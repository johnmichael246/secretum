// Copyright 2017 Danylo Vashchilenko
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

module.exports = function() {
  Set.prototype.intersect = function(anotherSet) {
    return new Set([...this].filter(value => anotherSet.has(value)));
  };
  
  Set.prototype.difference = function(anotherSet) {
    const difference = new Set(this);
    for (let object of anotherSet) {
      difference.delete(object);
    }
    return difference;
  }
};