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

class Native {
  constructor({url, vaultId}) {
    this.url = url;
    this.vaultId = vaultId;
  }
  
  fetch(lastId) {
    const url = `${this.url}/fetch?vaultId=${this.vaultId}`+ (lastId === undefined ? '' : `sinceCommitId=${lastId}`);
    return fetch(url).then(resp => resp.json()).then(result => result.snapshots);
  }
}

module.exports = Native;
