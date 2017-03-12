'use strict';

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

const versionedIDBFactory = require('../js/idb/versioned.js');
const { thenify } = require('../js/idb/helpers.js');
const assert = require('assert');
const fdb = require('fake-indexeddb');

const simple1 = {a: 'A', b: 'B'};

describe("Versioned IndexedDB", function() {
  var db;
  
  before(function(done) {
    const databaseRequest = versionedIDBFactory(fdb).open('test', 1);
    databaseRequest.onerror = done;
    databaseRequest.onupgradeneeded = () => {
      db = databaseRequest.result;
      const store = db.createObjectStore('test', {
        keyPath: 'id', autoIncrement: true
      });
      done();
    };
  });

  beforeEach(function(done) {
    const storeNames = ['test', '_changes'];
    const tx = db.transaction(storeNames, 'readwrite');
    
    Promise.all(storeNames.map(
      name => thenify(tx.objectStore(name).clear())
    )).then(() => done(), done);
  });

  it('#add should log an insert action', function(done) {
    const action = { 
      operator: 'insert',
      table: 'test',
      record: Object.assign({}, simple1, {id: 1})
    };

    const addPromise = db.transaction('test', 'readwrite')
      .objectStore('test')
      .add(record);

    addPromise.then(() => {
      return db.transaction('_changes')
        .objectStore('_changes')
        .getAll();
    }).then(changes => {
      assert.deepStrictEqual(changes, [action]);
      done();
    }).catch(done);
  });
});
