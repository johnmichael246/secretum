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

  _get(path) {
    return this._request("GET", path);
  }

  _post(path, body) {
    return this._request("POST", path, body);
  }

  findRemoteVaults() {
    return this._get('/vaults');
  }

  getSyncStatus() {
    return this._promisify(this.config.db.transaction('meta').objectStore('meta').get('sync'));
  }

  _openStores(tx, storeNames) {
    return Object.assign.apply(null, storeNames.map(name => ({[name]: tx.objectStore(name)})));
  }

  _clearStores(stores) {
    const promises = Object.keys(stores).map(name => {
      return this._promisify(stores[name].clear());
    });
    return Promise.all(promises);
  }

  _promisify(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = ()=>resolve(request.result);
      request.onerror = ()=>reject(request.error);
    });
  }

  sync(vault) {
    const doTransaction = snapshot => {
      const storeNames = ['secrets','groups'];
      const tx = this.config.db.transaction(['secrets','groups','meta'],'readwrite');
      const stores = this._openStores(tx, storeNames);
      stores.meta = this._openStores(tx, ['meta']).meta;

      return this._clearStores(stores).then(()=> {
        const work = [];
        storeNames.forEach(name => {
          snapshot.blob[name].forEach(datum => work.push(stores[name].add(datum)));
        });
        const status = {vault: vault, when: new Date()};
        work.push(stores.meta.add(status,'sync'));
        return Promise.all(work.map(w=>this._promisify(w))).then(()=>status);
      });
    };
    return this._get(`/snapshots/${vault.currentSnapshotId}`).then(doTransaction);
  }
}
