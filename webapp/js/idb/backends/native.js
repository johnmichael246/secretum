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

require('isomorphic-fetch');

export default class NativeBackend {
  constructor(config) {
    this.config = config;
  }

  // async connect() {
  //   const url = `${this.config.url}`;
  //   const auth = 'Basic ' + btoa(`${this.config.username}:${this.config.password}`);
  //   return fetch(url, {
  //     headers: {
  //       'Authorization': auth
  //     }
  //   }).then(resp => resp.headers.get('Cookies')json()).then(result => result.snapshots);
  // }

  pull(sinceCommitId) {
    const url = `${this.config.url}/pull?vaultId=${this.config.vaultName}`+ (sinceCommitId === undefined ? '' : `&sinceCommitId=${sinceCommitId}`);
    const auth = 'Basic ' + btoa(`${this.config.username}:${this.config.password}`);
    return fetch(url, {
      headers: {
        'Authorization': auth
      }
    }).then(resp => resp.json()).then(result => result.snapshots);
  }

  commit(changes) {
    const url = `${this.config.url}/commit?vaultId=${this.config.vaultName}`;
    const auth = 'Basic ' + btoa(`${this.config.username}:${this.config.password}`);
    return fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': auth
      },
      body: JSON.stringify(changes)
    }).then(resp => resp.json());
  }
}
