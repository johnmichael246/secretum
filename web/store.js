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

export class Store {
  constructor(idb) {
    this.idb = idb;
  }

  _storeGetAll(store) {
    return new Promise((resolve,reject) => {
      const result = [];
      const request = this.idb.transaction(store).objectStore(store).openCursor();
      request.onerror = ()=>reject(request.error);
      request.onsuccess = function (event) {
        var cursor = event.target.result;
        if (cursor) {
            result.push(cursor.value);
            cursor.continue();
        } else {
            resolve(result);
        }
      };
    });
  }

  _storeGetByKey(store, key) {
    return this._promisify(this.idb.transaction(store).objectStore(store).get(key));
  }

  _promisify(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = ()=>resolve(request.result);
      request.onerror = ()=>reject(request.error);
    });
  }


  findGroups() {
    return this._storeGetAll('groups');
  }

  findSecrets(query) {
    const match = (secret) => {
      if(query === undefined) return true;

      if(query.group !== undefined && secret.groupId !== query.group) {
        return false;
      }

      if(query.keyword !== undefined) {
        query.keyword = query.keyword.toLowerCase();
        if(secret.resource.search(query.keyword)==-1
          && secret.principal.search(query.keyword)==-1
          && secret.note.search(query.keyword)==-1) {
            return false;
          }
      }
      return true;
    };

    return this._storeGetAll('secrets')
      .then(secrets => secrets.filter(match));
  }

  saveSecret(secret) {
    return this._promisify(this.idb.transaction('secrets', 'readwrite').objectStore('secrets').put(secret));
  }

  removeSecret() {
    throw new Error('Not implemented yet.');
  }

  getSecret(id) {
    return this._storeGetByKey('secrets', id);
  }

  getGroup(id) {
    return this._storeGetByKey('groups', id);
  }
}
