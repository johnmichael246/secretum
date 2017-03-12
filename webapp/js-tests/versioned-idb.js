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

const { versionedIDBFactory, MergeConflict } = require('../js/idb/versioned.js');
const { thenify } = require('../js/idb/helpers.js');
const co = require('../js/utils/co.js');

const assert = require('assert');
const fdb = require('fake-indexeddb');

require('../js/utils/array.js')();
require('../js/utils/object.js')();
require('../js/utils/set.js')();

const simple1 = {a: 'A', b: 'B'};
const simple2 = {c: 'C', d: 'D'};

const { i, u, d } = require('./helpers.js');

describe("Versioned IndexedDB", function() {
  let db;
  
  before(function(done) {
    const databaseRequest = versionedIDBFactory(fdb).open('test', 1);
    databaseRequest.onerror = done;
    databaseRequest.onupgradeneeded = () => {
      db = databaseRequest.result;
      db.createObjectStore('test', {
        keyPath: 'id', autoIncrement: true
      });
      db.createObjectStore('test2', {
        keyPath: 'id', autoIncrement: true
      });
      done();
    };
  });

  beforeEach(function(done) {
    co(function*() {
      const storeNames = ['test', '_changes'];
      const tx = db.transaction(storeNames, 'readwrite');
    
      yield storeNames.map(name => thenify(tx.objectStore(name).clear()));
      done();
    });
  });
  
  describe('IDBObjectStore', function() {
    it('#toArray returns a key-ordered array of all records', function(done) {
      co(function*() {
        const store = db.transaction('test', 'readwrite').objectStore('test');
        const [id1, id2] = yield ([simple1,simple2].map(entity => store.add(entity)));
      
        const actual = yield db.transaction('test')
          .objectStore('test')
          .toArray();
      
        const record1 = Object.assign({id: id1}, simple1);
        const record2 = Object.assign({id: id2}, simple2);
        const expected = [record1, record2];
      
        assert.deepStrictEqual(actual, expected);
        done();
      }).catch(done);
    });
  });
  
  describe("with 1 table", function(done) {
    it('#add should log an insert action', function (done) {
      co(function*() {
        const id = yield db.transaction('test', 'readwrite')
          .objectStore('test')
          .add(simple1);
      
        const actual = yield db.transaction('_changes')
          .objectStore('_changes')
          .toArray();
      
        const record1 = Object.assign({id: id}, simple1);
        const expected = [i(record1)];
      
        assert.deepStrictEqual(actual, expected);
        done();
      }).catch(done);
    });
  
    it('#add+#put should log 1 insert and 1 update actions', function (done) {
      co(function*() {
        const id = yield db.transaction('test', 'readwrite')
          .objectStore('test')
          .add(simple1);
      
        const record1 = Object.assign({id: id}, simple1);
        const record2 = Object.assign({id: id}, simple2);
      
        yield db.transaction('test', 'readwrite')
          .objectStore('test')
          .put(record2);
      
        const actions = [i(record1), u(record2)];
      
        const actual = yield db.transaction('_changes')
          .objectStore('_changes')
          .toArray();
      
        assert.deepStrictEqual(actual, actions);
        done();
      }).catch(done);
    });
    
    it('#add+#delete should log a delete action', function(done) {
      co(function*() {
        const id = yield db.transaction('test', 'readwrite')
          .objectStore('test')
          .add(simple1);
        
        yield db.transaction('test', 'readwrite')
          .objectStore('test')
          .delete(id);
    
        const actual = yield db.transaction('_changes')
          .objectStore('_changes')
          .toArray();
    
        const record1 = Object.assign({id: id}, simple1);
        const expected = [i(record1), d(record1)];
    
        assert.deepStrictEqual(actual, expected);
        done();
      }).catch(done);
    });
  });
  
  describe("with 2 tables", function(done) {
    it('#add should log an insert action', function (done) {
      co(function*() {
        const tx = db.transaction(['test', 'test2'], 'readwrite');
        
        const [id1,id2] = yield [
          tx.objectStore('test').add(simple1),
          tx.objectStore('test2').add(simple2)
        ];
        
        const actual = yield db.transaction('_changes')
          .objectStore('_changes')
          .toArray();
        
        const record1 = Object.assign({id: id1}, simple1);
        const record2 = Object.assign({id: id2}, simple2);
        const expected = [i(record1), i(record2, 'test2')];
        
        assert.deepStrictEqual(actual, expected);
        done();
      }).catch(done);
    });
    
    it('#add+#put should log 1 insert and 1 update actions', function (done) {
      
      co(function*() {
        let tx = db.transaction(['test', 'test2'], 'readwrite');
  
        const [id1,id2] = yield [
          tx.objectStore('test').add(simple1),
          tx.objectStore('test2').add(simple2)
        ];
        
        const pre1 = Object.assign({id: id1}, simple1);
        const pre2 = Object.assign({id: id2}, simple2);
        
        const post1 = Object.assign({id: id1}, simple2);
        const post2 = Object.assign({id: id2}, simple1);
  
        tx = db.transaction(['test', 'test2'], 'readwrite');
        yield [
          tx.objectStore('test').put(post1),
          tx.objectStore('test2').put(post2)
        ];
        
        const expected = [i(pre1), i(pre2, 'test2'), u(post1), u(post2, 'test2')];
        
        const actual = yield db.transaction('_changes')
          .objectStore('_changes')
          .toArray();
        
        assert.deepStrictEqual(actual, expected);
        done();
      }).catch(done);
    });
  });
  
  describe('IDBDatabase#merge', function() {
    describe('shiftConflictingLocalIds', function() {
      const calculateRebase = versionedIDBFactory._testables.shiftConflictingLocalIds;
      const test = (local, remote, expected) => {
        return () => assert.deepEqual(calculateRebase(local, remote), expected);
      };
      
      it('all local overshadowed by some remote',     test( [1,2],    [1,2,3],  {1:4, 2:5}  ));
      it('some local overshadowed by all remote',     test( [1,2,3],  [1,2],    {1:4, 2:5}  ));
      it('no local overshadowed by some remote',      test( [],       [1,2],    {}          ));
      it('some local overshadowed by no remote',      test( [1,2],    [],       {}          ));
      it('skipped local overshadowed by all remote',  test( [2,3],    [1,2],    {2:4}       ));
      it('some local overshadowed by skipped remote', test( [1,2],    [2,3],    {2:4}       ));
      it('all remote inside of skipped local',        test( [1,4],    [2,3],    {}          ));
      it('all local inside of skipped remote',        test( [2,3],    [1,4],    {}          ));
    });
    
    describe('resolveConflictingInserts', function() {
      const resolveConflictingInserts = versionedIDBFactory._testables.resolveConflictingInserts;
      const test = (local, remote, expected) => {
        const idsMap = resolveConflictingInserts(local, remote);
        return () => assert(new Set(Object.keys(idsMap)).difference(new Set(expected)).size === 0);
      };
      
      it('remaps inserts on both sides',              test( [i({id:1}, 'table1')],  [i({id:1}, 'table1')],  ['table1']));
      it('ignores inserts on only one of the sides',  test( [i({id:1}, 'table1')],  [i({id:1}, 'table2')],  []        ));
      it('ignores updates on both sides',             test( [u({id:1}, 'table1')],  [u({id:1}, 'table1')],  []        ));
    });
    
    describe('mergeChanges', function() {
      const mergeChanges = versionedIDBFactory._testables.mergeChanges;
  
      it('discards matching removals', function() {
        const local = [d({id:1})];
        const remote = [d({id:1})];
    
        const merger = mergeChanges(local, remote);
    
        assert(merger.mergedRemote.length === 0);
        assert(merger.mergedLocal.length === 0);
      });
  
      it('remaps changes that conflict with remote inserts', function() {
        const local = [i({id:1}), u({id:1}), d({id:1})];
        const remote = [i({id:1})];
    
        const {mergedLocal} = mergeChanges(local, remote);
    
        const newLocalID = mergedLocal.select('record').select('id');
        assert.equal(newLocalID.length, local.length);
        assert.notEqual(newLocalID[0], remote[0].record.id);
        assert(newLocalID.every(id => id === newLocalID[0]));
      });
  
      it('fails on unresolved update conflict', function() {
        const local = [u({id:1})];
        const remote = [u({id:1})];
    
        assert.throws(() => mergeChanges(local, remote), MergeConflict);
      });
    });
    
    it('writes remote inserts', co.wrap(function* (done) {
      const remote = [i({id:1})];
      
      yield db.merge(remote);
      
      const tx = db.transaction('test');
      const actual = yield tx.objectStore('test').toArray();
      
      assert.deepStrictEqual(actual, [{id:1}]);
    }));
  
    it('writes remote updates', co.wrap(function* (done) {
      let tx = db.transaction('test', 'readwrite');
      yield tx.objectStore('test').add({id:1, old: true});
      
      const expected = {id:1, old: false};
      const remote = [u(expected)];
      yield db.merge(remote);
    
      tx = db.transaction('test');
      const actual = yield tx.objectStore('test').get(1);
    
      assert.deepStrictEqual(actual, expected);
    }));
  
    it('writes remote deletes', co.wrap(function* (done) {
      let tx = db.transaction('test', 'readwrite');
      yield tx.objectStore('test').add({id:1});

      yield db.merge([d({id:1})]);
    
      tx = db.transaction('test');
      const actual = yield tx.objectStore('test').toArray();
    
      assert.deepStrictEqual(actual, []);
    }));
  });
});