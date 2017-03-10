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

const { load } = require('../js/idb/loader.js');
const co = require('../js/utils/co.js');
const assert = require('assert');

require('../js/utils/array.js')();
require('../js/utils/object.js')();
require('../js/utils/set.js')();

const { i, u, d, v } = require('./helpers.js');

describe('SyncManager', function() {
  
  const record1 = {id:1, test: 'test'};
  
  const mockBackend1 = {
    type: 'mock',
    config: v(1, [
      [i(record1, 'test')]
    ])
  };
  
  it('should persist backend config', function(done) {
    co(function* () {
      const { syncManager } = yield load({
        idb_name: 'test',
        indexedDBFactory: require('fake-indexeddb')
      });
      
      yield syncManager.setup(mockBackend1);
      const actual = yield syncManager.getBackend();
      
      assert.deepStrictEqual(actual, mockBackend1);
    }).then(done, done);
  });
  
  it('should clone remote vault on fresh sync', function(done) {
    co(function* () {
      const { syncManager, db } = yield load({
        idb_name: 'test',
        indexedDBFactory: require('fake-indexeddb')
      });
      
      yield syncManager.setup(mockBackend1);
      yield syncManager.sync();
    
      const actual = yield db.transaction('test').objectStore('test').toArray();
      const expected = [record1];
      
      assert.deepStrictEqual(actual, expected);
    }).then(done, done);
  });
  
  
});
