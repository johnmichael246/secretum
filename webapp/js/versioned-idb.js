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

import { SyncThenable } from './sync-thenable.js';

export function versionedIDBFactory(factory) {
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
    
    // Creating the store for metadata
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
  const wrappedDatabase = Object.create(database);
  
  wrappedDatabase.transaction = (storeNames, mode) => {
    if(mode === 'readwrite') {
      if(!(storeNames instanceof Array)) {
        storeNames = [storeNames, 'changes'];
      } else if(storeNames.findIndex('changes') == -1) {
        storeNames = [...storeNames, 'changes'];
      }
    }
    
    return wrapTransaction(database.transaction(storeNames, mode));
  };
  
  wrappedDatabase.createObjectStore = (name, options) => {
    return wrapObjectStore(database.createObjectStore(name, options));
  };
  
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
  
  wrappedObjectStore.add = (record, key) => {
    const addRequest = objectStore.add(record, key);

    return thenify(addRequest).then(id => {
      const finalRecord = Object.assign({}, record, {id: id});
      const changesStore = objectStore.transaction.objectStore('_changes');
      const changeRequest = changesStore.add(
        { operator: 'insert', table: objectStore.name, record: finalRecord }
      );
      return thenify(changeRequest).then(()=>id);
    });
  };

  wrappedObjectStore.put = (record, key) => {
    const putRequest = objectStore.put(record, key);

    return thenify(putRequest).then(id => {
      const finalRecord = Object.assign({}, record, {id: id});
      const changesStore = objectStore.transaction.objectStore('_changes');
      const changeRequest = changesStore.add(
        { operator: 'update', table: objectStore.name, record: finalRecord }
      );
      return thenify(changeRequest).then(()=>id);
    });
  };
  
  return wrappedObjectStore;
}

function thenify(request) {
  const ret = SyncThenable();
  request.onsuccess = () => ret.resolve(request.result);
  request.onerror = () => ret.reject(request.error);
  return ret;
}