// @flow
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

import NativeBackend from './backends/native.js';
import MockBackend from './backends/mock.js';

const backends = {
  'native': NativeBackend,
  'mock': MockBackend
};

export type SyncStatus = {
  backend: Object,
  commits: Array<Object>
};

export default class SyncManager {
  db: any;
  backend: Object;

  constructor(db: any) {
    this.db = db;

    this.db.transaction('_sync').objectStore('_sync').get('backend').then(backend => {
      if (backend === null) {
        return;
      }

      this._prepareBackend(backend);
    });
  }

  // TODO: define needed information
  async getSyncStatus(): Promise<SyncStatus> {
    const tx = this.db.transaction(['_sync', '_commits']);
    const [status, commits] = await Promise.all([
      tx.objectStore('_sync').toMap(),
      tx.objectStore('_commits').toMap()
    ]);

    if(!status.has('backend')) {
      throw new Error('Missing backend record in IDB');
    }

    return {
      backend: status.get('backend'),
      commits
    };
  }

  getUnsyncedChanges() {
    return this.db.transaction('_changes').objectStore('_changes').toArray();
  }

  async sync() {
    if (this.backend === null) {
      throw new Error('There is no backend to sync with.');
    }

    const sync: SyncStatus = await this.getSyncStatus();
    const knownCommits = await this.db.transaction('_commits')
      .objectStore('_commits')
      .toArray();

    const newCommits = await this.backend.pull(
      knownCommits.length > 0 ? knownCommits[knownCommits.length - 1].id : undefined
    );
    await this.db.merge(newCommits.select('delta').map(JSON.parse.bind(JSON)).flatten());
    await this.db.transaction('_commits', 'readwrite').objectStore('_commits').addAll(newCommits);

    const localChanges = await this.db.transaction('_changes')
      .objectStore('_changes')
      .toArray();

    if(localChanges.length > 0) {
      const newCommit = await this.backend.commit(localChanges);
      await Promise.all([
        this.db.transaction('_commits', 'readwrite').objectStore('_commits').add(newCommit),
        this.db.transaction('_changes', 'readwrite').objectStore('_changes').clear()
      ]);
    }
  }

  setup(backend: Object) {
    this._prepareBackend(backend);
    return this.db.transaction('_sync', 'readwrite').objectStore('_sync').put(backend, 'backend');
  }

  async clear() {
    const storeNames = ['secrets', 'groups', '_commits', '_changes'];
    const tx = this.db.transaction(storeNames, 'readwrite');
    await Promise.all(
      storeNames.map(name => tx.objectStore(name).clear())
    );
  }

  getBackend() {
    return this.db.transaction('_sync').objectStore('_sync').get('backend');
  }

  _prepareBackend(backend: Object) {
    if(backend === null) {
      this.backend = backend;
    }
    this.backend = new backends[backend.type](backend.config);
  }
}
