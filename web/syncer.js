// Copyright 2016-2017 Danylo Vashchilenko
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

export class Syncer {
  constructor(config) {
    this.config = config;
  }

  _request(method, path, body) {
    const payload = (resolve, reject) => {
      var xhr = new XMLHttpRequest();
      xhr.open(method, this.config.endpoint + path);
      if(method === "GET") {
        xhr.responseType = "json";
      }
      xhr.onload = () => {
        if(xhr.status === 200) {
          resolve(xhr.response);
        } else {
          reject(new Error(xhr.statusText));
        }
      };
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(body);
    };
    return new Promise(payload);
  }

  _get(path, params) {
    const req = params === undefined ? path :
      path+'?'+Object.keys(params).map(key=>key+'='+encodeURIComponent(params[key])).join('&');
    return this._request("GET", req);
  }

  _post(path, body) {
    return this._request("POST", path, body);
  }

  _openStores(storeNames, mode) {
    const tx = this._transaction(storeNames, mode);
    return Object.assign.apply(null, storeNames.map(name => ({[name]: tx.objectStore(name)})));
  }

  _openStore(storeName, mode) {
    return this._openStores([storeName], mode)[storeName];
  }

  _clearStores(storeNames) {
    return Promise.all(Object.values(this._openStores(storeNames)).map(store => {
      return this._promisify(store.clear());
    }));
  }

  _promisify(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = ()=>resolve(request.result);
      request.onerror = ()=>reject(request.error);
    });
  }

  _transaction(stores, mode) {
    if(this._tx) {
      if(!stores.every(store => this._tx.stores.includes(store))) {
        throw new Error('Attempted overlapping transaction with a different scope');
      }
      if(mode === 'readwrite' && this._tx.mode != 'readwrite') {
        throw new Error('Attempted overlapping transaction with a more restrictive mode');
      }
      return this._tx.tx;
    } else {
      const tx = this.config.db.transaction(stores, mode||'readonly');
      tx.onabort = tx.onerror = (error) => {
        console.error('Transaction failed', error);
        this._tx = undefined
      };

      tx.oncomplete = () => {
        console.log('Transaction completed');
        this._tx = undefined
      };

      this._tx = {tx: tx, stores: stores, mode: mode||'readonly'};
      return tx;
    }
  }

  findRemoteVaults() {
    return this._get('/meta');
  }

  getSyncStatus() {
    const ret = this._openStore('meta').get('sync');
    return this._promisify(ret).then(res => res === undefined ? null : res);
  }

  /* get-merge-postIfDirty */
  sync() {
    return this._storeGetAll(this._openStore('meta'))
      .then(meta => {
        if(meta.sync === undefined) throw new Error('No vault to sync with!');
        const opts = {vaultId: meta.sync.vault.id};
        if(meta.sync.snapshot) {
          opts.sinceCommitId = meta.sync.snapshot.id;
        }
        return this._get(`/fetch`, opts)
          .then(({vault: vault, snapshots: snapshots}) => ({vault: vault, snapshots: snapshots, meta: meta}));
      }).then(({vault: vault, meta: meta, snapshots: snapshots}) => {
        const stores = this._openStores(['secrets','groups','meta'], 'readwrite');

        const work = [];

        // Updating each store with corresponding changes in the shapshots
        snapshots.forEach(snapshot => {
          const delta = JSON.parse(snapshot.delta);
          Object.keys(delta).forEach(storeName => {
            if(Object.keys(delta[storeName]).includes('insert')) {
              delta[storeName].insert.forEach(datum => work.push(stores[storeName].add(datum)));
              // TODO: increment IDs of changes in the local store
            }
            if(Object.keys(delta[storeName]).includes('delete')) {
              delta[storeName].delete.forEach(datum => work.push(stores[storeName].remove(datum)));
              // TODO: unflag local removals if IDs match
            }
            if(Object.keys(delta[storeName]).includes('update')) {
              delta[storeName].update.forEach(datum => work.push(stores[storeName].put(datum)));
              // TODO: report merge conflict if IDs match
            }
          });
        });

        // Updating sync status
        meta.sync = {vault: vault, snapshot: snapshots[snapshots.length-1], when: new Date()};
        work.push(stores.meta.put(meta.sync,'sync'));
        if(meta.changes === undefined) {
          meta.changes = {};
          work.push(stores.meta.put({}, 'changes'));
        }

        return Promise.all(work.map(this._promisify))
          .then(()=>({meta: meta, stores: stores}));
      }).then(({meta: meta, stores}) => {
        // If not dirty, pass context forward
        if(this._areChangesEmpty(meta.changes)) {
          return {meta: meta};
        }

        // Otherwise, post changes and update the sync status
        return this._post('/save', meta.changes).then(snapshot => {
          meta.changes = {};
          meta.sync.snapshot = snapshot;
          meta.sync.when = Date();
          return Promise.all([
            stores.meta.put('changes', meta.changes),
            stores.meta.put('sync', meta.sync)
          ].map(this._promisify));
        }).then(()=>({meta: meta}));
      }).then(({meta: meta}) => meta.sync);
  }

  _areChangesEmpty(meta) {
    return meta.changes===undefined||Object.keys(meta.changes).map(storeName => {
      return meta.changes[storeName].map(x=>x.length);
    }).reduce((a,v)=>a+v) === 0;
  }

  setup(vaultId) {
    // Locking meta until this.sync reads it
    this._transaction(['meta','secrets','groups'],'readwrite');

    this.clear();

    return this._promisify(this._openStore('meta', 'readwrite')
      .put({vault: {id: vaultId}}, 'sync'))
      .then(()=>this.sync());
  }

  isDirty() {
    return this._storeGetByKey('meta', 'changes').then(this._areChangesEmpty);
  }

  clear() {
    return this._promisify(this._clearStores(['meta','secrets','groups']));
  }

  getUnsyncedChanges() {
    return this._promisify(this._openStore('meta').get('changes'));
  }

  _storeGetByKey(store, key) {
    return this._promisify(this.idb.transaction(store).objectStore(store).get(key));
  }

  _storeGetAll(store) {
    return new Promise((resolve,reject) => {
      const result = {};
      const request = store.openCursor();
      request.onerror = ()=>reject(request.error);
      request.onsuccess = function (event) {
        var cursor = event.target.result;
        if (cursor) {
            result[cursor.key] = cursor.value;
            cursor.continue();
        } else {
            resolve(result);
        }
      };
    });
  }

}
