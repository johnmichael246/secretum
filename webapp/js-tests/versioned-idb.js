const req = versionedIDBFactory(fdb).open('test', 1);
req.onupgradeneeded = () => {
  const db = req.result;
  const store = db.createObjectStore('people', {autoIncrement: true});
  
  store.add({name: 'Danylo', age: 20}).then(console.log);
  store.put({name: 'Danylo', age: 20}).then(console.log);
};

req.onsuccess = () => {
  const db = req.result;
  
  const tx = db.transaction('_changes');
  tx.objectStore('_changes').openCursor().onsuccess = event => {
    const cursor = event.target.result;
    
    if(cursor) {
      console.log(cursor.value);
      cursor.continue();
    }
  };
};
