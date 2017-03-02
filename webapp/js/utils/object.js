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

export function boostObjects() {
  Object.values = function(obj) {
    return Object.keys(obj).map(key => obj[key]);
  }

  Object.defineProperty(Object.prototype, 'mapValues', {value: function(mapper) {
    const ret = Object(this);
    Object.keys(ret).forEach(key => ret[key] = mapper(ret[key]));
    return ret;
  }});

  Object.defineProperty(Object.prototype, 'assignFrom', {value: function(object) {
    return Object.assign(this, object);
  }});
}