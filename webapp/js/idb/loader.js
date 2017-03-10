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

const { versionedIDBFactory } = require('./versioned.js');
const Store = require('./store.js');
const SyncManager = require('./sync-manager.js');

module.exports = { load };

function load(config) {
  return new Promise((resolve, reject) => {
    const openRequest = versionedIDBFactory(config.indexedDBFactory).open(config.idb_name, 1);
    
    openRequest.onsuccess = () => {
      const db = openRequest.result;
      db.onerror = console.error;
      
      const store = new Store(db);
      const syncManager = new SyncManager(db);
      resolve({store, syncManager, db});
      
      console.log('IndexedDB is now open.');
    };
    
    openRequest.onerror = reject;
    
    openRequest.onupgradeneeded = () => {
      const db = openRequest.result;
      db.onerror = console.error;
      
      config.schema = {
        secrets: {
          type: 'entity'
        },
        groups: {
          type: 'entity',
          initial: [{id: 0, name: 'Default Group'}]
        },
        _sync: {
          type: 'map',
          initial: {
            backend: null,
            commits: []
          }
        }
      };
      
      for(let name of Object.keys(config.schema)) {
        let table = config.schema[name];
        
        let objectStore;
        if(table.type === 'entity') {
          objectStore = db.createObjectStore(name, {keyPath: 'id', autoIncrement: true});
          for(let entity of table.initial) {
            objectStore.add(entity);
          }
        } else if(table.type === 'map') {
          objectStore = db.createObjectStore(name);
          for(let key of Object.keys(table.initial)) {
            objectStore.add(key, table.initial[key]);
          }
        }
      }
    }
  });
}
