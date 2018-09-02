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

// An almost compliant implementation of Promises (https://promisesaplus.com/).
// This implementation calls handlers passed to .then immediately and synchronously,
// as soon as the promise is resolved/rejected. That is, neither as a micro-, nor a macro-task.
// This is a violation of the specification's section 2.2.4, and results in 22/850 failed tests.

module.exports = SyncThenable;

function SyncThenable(handler) {
  const self = {};

  var status = 'pending';
  self.status = () => status;
  self.isPending = () => status === 'pending';
  
  var result;
  const chain = [];

  // Immediately changes this promise's state, and processes the chain.
  function finalize(newResult, newStatus) {
    status = newStatus;
    result = newResult;

    while(chain.length > 0) {
      const link = chain.shift();
      process(link.downstream, link.handlers);
    }
  }

  // Propogates the promise's status to the downstream promise
  function process(downstream, handlers) {
    if(status === 'pending') {
      throw new Error('Premature processing!');
    }
  
    var downstreamValue = result;

    if(isHandler(handlers[status])) {
      try {
        // Handlers must not be called with a bound this
        downstreamValue = handlers[status].call(undefined, result);
      } catch(err) {
        // If the downstream handler throws, we must directly reject the downstream promise.
        downstream.reject(err);
        return;
      }

      if(downstreamValue === downstream) {
        downstream.reject(new TypeError('A handler attempted to chain an infinite loop'));
        return;
      }
    }

    // Downstream is resolved, if at least one holds:
    // (1) the upstream promise was fulfilled
    // (2) the downstream promise had a rejection handler
    if(status == 'resolved' || isHandler(handlers['rejected'])) {
      downstream.resolve(downstreamValue);
    } else {
      downstream.reject(downstreamValue);
    }
  }

  self.resolve = (value) => {
    if(status !== 'pending') return;
    
    if(value === self) {
      self.reject(new TypeError('Attempted to start an infinite loop.'));
      return;
    }

    // If value is a non-null object or function, attempt to put it upstream
    if(value != null && (typeof value == 'object' || typeof value === 'function')) {
      
      // Protected handlers to be passed to the then function, if present
      var called = false;
      const onFulfilled = newValue => {
        if(called) return;
        called = true;
        self.resolve(newValue)
      };
      const onRejected = newReason => {
        if(called) return;
        called = true;
        self.reject(newReason);
      };

      var vthen;
      try {
        vthen = value.then;
      } catch(err) {
        // Always reject, if property retrieval failed
        finalize(err, 'rejected');
        return;
      }

      if(typeof vthen === 'function') {
        try {
          vthen.call(value, onFulfilled, onRejected);
          return; // Handlers will finish resolution of this promise
        } catch(err) {
          // Only reject, if no handler was called
          if(!called) finalize(err, 'rejected');
          return; // Finish here, because either a handler or finalize was or will be called
        }
      }
    }

    // If we are here, then the value should be used as is
    finalize(value, 'resolved');
  }

  self.reject = (reason) => {
    if(status !== 'pending') return;
    finalize(reason, 'rejected');
  }

  if(handler !== undefined) {
    try {
      handler(self.resolve, self.reject);
    } catch(err) {
      // Exceptions in the handler are treated as an immediate rejection of this promise
      finalize(err, 'rejected');
    }
  }

  self.then = (fulfilled, rejected) => {
    const downstream = SyncThenable();
    const handlers = {'resolved': fulfilled, 'rejected': rejected};

    // If the self is pending, then put this link downstream for future.
    if(status === 'pending') {
      chain.push({downstream: downstream, handlers: handlers});
    } else {
      process(downstream, handlers);
    }

    return downstream;
  }

  self.catch = (rejected) => self.then(undefined, rejected);

  return self;
}

SyncThenable.all = function(array) {
  const ret = SyncThenable();

  var counter = 0;
  const values = Array(array.length);

  array.forEach((st,i) => {
    st.then(value => {
      if(!ret.isPending()) return;

      values[i] = value;
      counter++;

      if(counter == array.length) {
        ret.resolve(values);
      }
    }, error => ret.reject(error))
  });

  return ret;
};

SyncThenable.resolve = function(value) {
  return SyncThenable((resolve)=>resolve(value));
};

SyncThenable.reject = function(value) {
  return SyncThenable((resolve,reject)=>reject(value));
};

function isHandler(value) {
  return value !== undefined 
    && value !== null 
    && typeof value === 'function';
}