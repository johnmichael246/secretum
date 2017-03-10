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

module.exports = { thenify };

function thenify(request) {
  const ret = SyncThenable();
  request.onsuccess = () => ret.resolve(request.result);
  request.onerror = () => ret.reject(request.error);
  return ret;
}