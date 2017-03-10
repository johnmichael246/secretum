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

module.exports = { i, u, d, v };

function a(operator, record, table='test') {
  return {
    operator: operator,
    table: table,
    record: record
  };
}

function i(record, table) { return a('insert', record, table); }
function u(record, table) { return a('update', record, table); }
function d(record, table) { return a('delete', record, table); }

function v(id, snapshots) {
  return {
    vault: {
      id: id,
      name: 'testVault1'
    },
    snapshots: snapshots.map((snapshot, index) => ({
      vault: id, delta: JSON.stringify(snapshot), posted: "today", device: 'tester', id: index+1
    }))
  };
}