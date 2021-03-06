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

const SyncThenable = require('./sync-thenable.js');
const { thenify } = require('./helpers.js');
const co = require('../utils/co.js');

class MergeConflict extends Error {
  constructor(localChange, remoteChange) {
    super();
    this.localChange = localChange;
    this.remoteChange = remoteChange;
  }
}

/**
 * Instruments the IndexedDB API with the following features:
 * 1. Request objects are wrapped into SyncThenables for convenience
 * 2. All modifications are logged into the '_changes' table.
 *
 * @param factory
 * @returns {factory}
 */
function versionedIDBFactory(factory) {
  const wrappedFactory = Object.create(factory);

  wrappedFactory.open = (name, version) => wrapRequest(
    factory.open(name, version),
    wrapDatabase
  );

  return wrappedFactory;
}

function wrapRequest(request, resultWrapper) {
  const wrappedRequest = {};

  request.onupgradeneeded = event => {
    if(!('result' in wrappedRequest)) {
      wrappedRequest.result = resultWrapper(request.result);
    }

    // Creating the store for change logs
    event.target.result.createObjectStore('_changes', {autoIncrement: true});

    const wrappedEvent = Object.create(event, {result: {value: wrappedRequest.result}});

    if(wrappedRequest.onupgradeneeded instanceof Function) {
      wrappedRequest.onupgradeneeded(wrappedEvent);
    }
  };

  request.onsuccess = event => {
    if(!('result' in wrappedRequest)) {
      wrappedRequest.result = resultWrapper(request.result);
    }

    const wrappedEvent = Object.create(event, {result: {value: wrappedRequest.result}});

    if(wrappedRequest.onsuccess instanceof Function) {
      wrappedRequest.onsuccess(wrappedEvent);
    }
  };

  request.onerror = event => {
    if(wrappedRequest.onerror instanceof Function) {
      wrappedRequest.onerror(event);
    }
  };

  return wrappedRequest;
}

function wrapDatabase(database) {
  const wrappedDatabase = Object.create(database, {onerror: {value: null}});

  wrappedDatabase.transaction = (storeNames, mode='readonly') => {
    //console.log(`New transaction: stores=${storeNames}, mode=${mode}`);

    if(mode === 'readwrite') {
      if (!(storeNames instanceof Array)) {
        storeNames = [storeNames, '_changes'];
      } else if (!storeNames.includes('_changes')) {
        storeNames = [...storeNames, '_changes'];
      }
    }

    return wrapTransaction(database.transaction(storeNames, mode));
  };

  wrappedDatabase.createObjectStore = (name, options) => {
    return wrapObjectStore(database.createObjectStore(name, options));
  };

  wrappedDatabase.merge = co.wrap(function* (unmergedRemote) {
    const tables = [...new Set(unmergedRemote.select('table')), '_changes'];
    const tx = database.transaction(tables, 'readwrite');
    const stores = {};
    for(let name of tables) {
      stores[name] = tx.objectStore(name);
    }

    // IDBRequests to be fulfilled before the merger is complete
    const work = [];

    const unmergedLocal = Array.from((yield getAllFrom(stores['_changes'])).values());
    const {mergedLocal, mergedRemote, idMaps} = mergeChanges(unmergedLocal, unmergedRemote);

    // Remapping local IDs as in the merged local state
    // Reversing the changes for convenience
    mergedLocal.reverse();
    for(let table of Object.keys(idMaps)) {
      let store = stores[table];
      let map = idMaps[table];

      for(let oldId of Object.keys(map)) {
        let lastChange = mergedLocal.find(change => change.record.id === map[oldId]);
        work.push(store.delete(oldId));
        work.push(store.add(lastChange.record));
      }
    }
    mergedLocal.reverse();

    work.push(stores['_changes'].clear());
    for(let change of mergedLocal) {
      work.push(stores['_changes'].add(change));
    }

    for(let change of mergedRemote) {
      const store = stores[change.table];

      if(change.operator === 'insert') {
        work.push(store.put(change.record));
      } else if(change.operator === 'update') {
        work.push(store.put(change.record));
      } else if(change.operator === 'delete') {
        work.push(store.delete(change.record.id));
      } else {
        throw new Error('Unknown operator in the change: ' + change.operator);
      }
    }

    yield work.map(thenify);
  }, SyncThenable);

  return wrappedDatabase;
}

function wrapTransaction(transaction) {
  const wrappedTransaction = Object.create(transaction);

  wrappedTransaction.objectStore = name => {
    return wrapObjectStore(transaction.objectStore(name));
  };

  return wrappedTransaction;
}

function wrapObjectStore(objectStore) {
  const wrappedObjectStore = Object.create(objectStore);

  wrappedObjectStore.add = co.wrap(function*(record, key) {
    const addRequest = objectStore.add(record, key);
    const id = yield thenify(addRequest);

    // Ignoring changes to hidden tables
    if(objectStore.name.startsWith('_')) {
      return id;
    }

    const finalRecord = Object.assign({}, record, {id: id});
    const changesStore = objectStore.transaction.objectStore('_changes');

    yield thenify(changesStore.add(
      { operator: 'insert', table: objectStore.name, record: finalRecord }
    ));

    return id;
  }, SyncThenable);

  wrappedObjectStore.addAll = co.wrap(function*(records) {
    yield records.map(record => wrappedObjectStore.add(record));
  });

  wrappedObjectStore.get = function(id) {
    return thenify(objectStore.get(id));
  };

  wrappedObjectStore.toMap = function() {
    return getAllFrom(objectStore);
  };

  wrappedObjectStore.toArray = function() {
    return getAllFrom(objectStore).then(map => Array.from(map.values()));
  };

  wrappedObjectStore.put = co.wrap(function* (record, key) {
    const id = yield (thenify(objectStore.put(record, key)));

    if(objectStore.name.startsWith('_')) {
      return id;
    }

    const finalRecord = Object.assign({}, record, {id: id});
    const changesStore = objectStore.transaction.objectStore('_changes');
    yield (thenify(changesStore.add(
      { operator: 'update', table: objectStore.name, record: finalRecord }
    )));

    return id;
  }, SyncThenable);

  wrappedObjectStore.delete = co.wrap(function* (key) {
    const record = yield thenify(objectStore.get(key));

    yield thenify(objectStore.delete(key));

    if(objectStore.name.startsWith('_')) {
      return;
    }

    const changesStore = objectStore.transaction.objectStore('_changes');
    yield thenify(changesStore.add(
      { operator: 'delete', table: objectStore.name, record: record }
    ));
  }, SyncThenable);

  wrappedObjectStore.clear = co.wrap(function* () {
      return thenify(objectStore.clear());
  });

  return wrappedObjectStore;
}

function getAllFrom(objectStore) {
  const thenable = SyncThenable();
  const result = new Map();

  const request = objectStore.openCursor();
  request.onsuccess = (event) => {
    const cursor = event.target.result;

    if(cursor) {
      result.set(cursor.key, cursor.value);
      cursor.continue();
    } else {
      thenable.resolve(result);
    }
  };
  request.onerror = thenable.reject.bind(thenable);

  return thenable;
}

function shiftConflictingLocalIds(newLocalIds, newRemoteIds) {
  const remap = {};

  if(newLocalIds.length === 0 || newRemoteIds.length === 0) {
    // If there is no new IDs on either side, there is no need for any remap.
    return remap;
  }

  let newId = Math.max(
    Math.max.apply(Math, newRemoteIds)+1,
    Math.max.apply(Math, newLocalIds)+1
  );

  // Finding a union of all new IDs
  const newIds = new Set();
  newLocalIds.forEach(Set.prototype.add.bind(newIds));
  newRemoteIds.forEach(Set.prototype.add.bind(newIds));

  for(let id of newIds) {
    if(newLocalIds.includes(id) && newRemoteIds.includes(id)) {
      // Resolving conflicting IDs on the local side
      remap[id] = newId++;
    }
  }

  return remap;
}

function resolveConflictingInserts(unmergedLocal, unmergedRemote) {
  const localInserts = unmergedLocal.filter(change => change.operator === 'insert');
  const remoteInserts = unmergedRemote.filter(change => change.operator === 'insert');

  const conflictingTables = new Set(localInserts.select('table')).intersect(new Set(remoteInserts.select('table')));

  const idMaps = {};

  for(let table of conflictingTables) {
    idMaps[table] = shiftConflictingLocalIds(
      localInserts.filter(change => change.table === table).select('record').select('id'),
      remoteInserts.filter(change => change.table === table).select('record').select('id')
    );
  }

  return idMaps;
}

function mergeChanges(unmergedLocal, unmergedRemote) {
  const mergedLocal = [];
  const discardedRemote = [];

  const idMaps = resolveConflictingInserts(unmergedLocal, unmergedRemote);

  for(let change of unmergedLocal) {
    // Making a clone of the change
    const updatedChange = {
      operator: change.operator,
      table: change.table,
      record: Object.assign({}, change.record)
    };

    // Remapping IDs of any change
    if(change.table in idMaps) {
      updatedChange.record.id = idMaps[change.table][change.record.id];
    }

    if(change.operator === 'update') {
      const conflictingRemoteChange = unmergedRemote.find(rc => {
        return rc.operator === 'update' && rc.table === change.table && rc.record.id === updatedChange.record.id
      });

      // No point in continuing merger if at least one update conflict is found
      // TODO: field-by-field merger
      if(conflictingRemoteChange !== undefined) {
        throw new MergeConflict(change, conflictingRemoteChange);
      }
    } else if(change.operator === 'delete') {
      const sameRemoteRemoval = unmergedRemote.findIndex(rc => {
        return rc.operator === 'delete' && rc.table === change.table && rc.record.id === updatedChange.record.id;
      });

      if(sameRemoteRemoval !== -1) {
        discardedRemote.push(sameRemoteRemoval);
        // skipping this local change because it's already on the remote side
        continue;
      }
    }
    mergedLocal.push(updatedChange);
  }

  const mergedRemote = unmergedRemote.filter((change, index) => !discardedRemote.includes(index));

  return {mergedLocal, mergedRemote, idMaps};
}

module.exports = { versionedIDBFactory, MergeConflict };

// Exports private functions for testing purposes
if (typeof it === 'function') {
  versionedIDBFactory._testables = {
    shiftConflictingLocalIds,
    resolveConflictingInserts,
    mergeChanges
  };
}
