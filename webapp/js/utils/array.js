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

export function boostArrays() {

  Array.prototype.buildLookup = function(keyGenerator, valueGenerator) {
    const ret = {};

    if(valueGenerator === undefined) {
      valueGenerator = object => object;
    }

    this.forEach(element => {
      ret[keyGenerator(element)] = element;
    });

    return ret;
  };

  Array.prototype.filterRecursively = function(predicate) {
    const ret = [];

    this.forEach(element => {
      if(element instanceof Array) {
        ret.pushFrom(element.filterRecursively(predicate));
        return;
      }
      
      if(predicate(element)) {
        ret.push(element);
      }
    });

    return ret;
  }

  Array.prototype.select = function(property) {
    return Array.selector(property)(this);
  }

  Array.prototype.pushFrom = function(array) {
    this.push.apply(this, array);
  }

  Array.prototype.pushTo = function(array) {
    array.push.apply(array, this);
  }

  Array.selector = function(property) {
    return array => array.map(e => e[property]);
  }

  Array.prototype.flatten = function(maxLevels) {
    if(maxLevels===0) return this;

    const ret = [];

    this.forEach(element => {
      if(Array.isArray(element)) {
        Array.prototype.push.apply(ret, 
          element.flatten(maxLevels === undefined ? undefined : maxLevels-1));
      } else {
        ret.push(element);
      }
    });

    return ret;
  }

  Array.prototype.aggregate = function(aggregator) {
    return Array.aggregator(aggregator)(this);
  }

  Array.aggregator = function(aggregator) {
    return array => aggregator.apply(null, array);
  }

  Array.prototype.groupBy = function(property) {
    const ret = {};
    this.forEach(val => {
      if(!val.hasOwnProperty(property)) throw new Error('Grouping by property with missing values for some elements!');

      const key = val[property];
      if(typeof key !== 'string') throw new Error('Grouping by property with non-string values in some elements!');

      if(ret[key] === undefined) {
        ret[key] = [val];
      } else {
        ret[key].push(val);
      }
    });

    return ret;
  }

  Array.prototype.remove = function(predicate) {
    this.forEach((value,idx) => {
      if(predicate(value)) {
        delete this[idx];
      }
    });
  };

};