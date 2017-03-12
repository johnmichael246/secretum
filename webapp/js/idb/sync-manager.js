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

const co = require('../utils/co.js');

const backends = {
  'native': require('./backends/native.js'),
  'mock': require('./backends/mock.js')
};

class SyncManager {
  constructor(db) {
    this.db = db;
    
    Promise.resolve(this.db.transaction('_sync').objectStore('_sync').get('backend')).then(backend => {
      if (backend === null) {
        return;
      }
      
      this._prepareBackend(backend);
    });
  }
  
  // TODO: define needed information
  getSyncStatus() {
    return Promise.resolve(this.db.transaction('_sync').objectStore('_sync').toMap());
  }
  
  getUnsyncedChanges() {
    return Promise.resolve(this.db.transaction('_changes').objectStore('_changes').toArray());
  }
  
  findRemoteVaults()  {
    return Promise.resolve([]);
  }
  
  sync() {
    const self = this;
    return co(function* () {
      if (self.backend === null) {
        throw new Error('There is no backend to sync with.');
      }
  
      const sync = yield self.getSyncStatus();
      const knownCommits = sync.get('commits');
      
      const state = yield self.backend.fetch(
        knownCommits.length > 0 ? [knownCommits.length - 1].id : undefined
      );
      const newCommits = state.snapshots;
      yield self.db.merge(newCommits.select('delta').map(JSON.parse.bind(JSON)).flatten());
    });
  }
  
  setup(backend) {
    this._prepareBackend(backend);
    return Promise.resolve(this.db.transaction('_sync', 'readwrite').objectStore('_sync').put(backend, 'backend'));
  }
  
  getBackend() {
    return Promise.resolve(this.db.transaction('_sync').objectStore('_sync').get('backend'));
  }
  
  _prepareBackend(backend) {
    if(backend === null) {
      this.backend = backend;
    }
    this.backend = new backends[backend.type](backend.config);
  }
}

module.exports = SyncManager;