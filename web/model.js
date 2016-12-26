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

export var getModel;

export function createModel(config) {
  return new Promise((resolve, reject) => {
    var db;
    var openRequest = window.indexedDB.open('secretum', 1);
    openRequest.onsuccess = (event) => {
      db = openRequest.result;
      db.onerror = console.error;

      resolve(new Model(config, db));

      console.log('IndexedDB is now open.');
    };
    openRequest.onupgradeneeded = (event) => {
      db = openRequest.result;

      db.createObjectStore('secrets', {keyPath: 'id'});
      db.createObjectStore('groups', {keyPath: 'id'});

      console.log('Database scheme initialized!');
    }
  });
}


class Model {
  constructor(endpoint, idb) {
    this.endpoint = endpoint;
    this.idb = idb;

    getModel = () => this;
  }

  _request(method, path, body) {
    const payload = (resolve, reject) => {
      var xhr = new XMLHttpRequest();
      xhr.open(method, this.endpoint + path);
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

  _cache(storeName, dataOrPromise) {
    return Promise.resolve(dataOrPromise).then(data => {
      var store = this.idb.transaction(storeName, 'readwrite').objectStore(storeName);
      data.forEach(datum => store.add(datum));
    });
  }

  _cacheGetAll(store) {
    return new Promise((resolve) => {
      var result = [];
      this.idb.transaction(store).objectStore(store).openCursor().onsuccess = function (event) {
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

  findGroups() {
    return this._cacheGetAll('groups').then(groups => {
      if(groups.length > 0) {
        return groups;
      } else {
        const promise = this._get("/groups");
        this._cache('groups', promise);
        return promise;
      }
    });
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
    const fetch = () => {
      query = query||{};
      const keyword = query.keyword||'';
      const group = query.group||'';
      return this._get(`/secrets?keyword=${encodeURIComponent(keyword)}&group=${encodeURIComponent(group)}`);
    };

    return this._cacheGetAll('secrets').then(secrets => {
      if(secrets.length > 0) {
        return secrets.filter(match);
      } else {
        const promise = fetch();
        this._cache('secrets', promise);
        return promise.then(secrets => secrets.filter(match));
      }
    });


  }

  saveSecret(secret) {
    const data = JSON.stringify(secret);

    if(secret.id === null) {
      this._post("/secrets", data);
    } else {
      this._post(`/secrets/${secret.id}`, data);
    }
  }

  removeSecret(id) {
    this._post(`/secrets/${id}/delete`);
  }

  get(id) {
    return this.findSecrets().then(ss => {
      for(var s of ss) {
        if(s.id === id) {
          return s;
        }
      }
      return null;
    });
  }
}
