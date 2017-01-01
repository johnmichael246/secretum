export function SyncThenable(handler) {
  var state = 'pending';
  var result;
  const chain = [];

  const isThenable = value => value !== undefined
    && typeof value === 'object'
    && value.hasOwnProperty('then')
    && value.then instanceof Function;

  const process = (newResult, newState) => {
    state = newState;
    result = newResult;

    if(newState === 'fulfilled') {
      chain.forEach(link => {
        if(link.fulfilled === undefined) {
          link.promise.resolve(newResult);
        } else {
          link.promise.resolve(link.fulfilled(newResult));
        }
      });
    } else if(newState === 'rejected') {
      chain.forEach(link => {
        if(link.rejected === undefined) {
          link.promise.reject(newResult);
        } else {
          link.promise.reject(link.rejected(newResult));
        }
      });
    } else {
      throw new Error('Illegal new state of the promise');
    }
  };

  const self = {};

  self.isPending = function() {
    return state === 'pending';
  }

  self.resolve = value => {
    if(state !== 'pending') throw new Error('Attempting to resolve a non-pending promise.');
    if(isThenable(value)) {
      value.then(newValue => process(newValue,'fulfilled'),
                newValue => process(newValue,'rejected'));
    } else {
      process(value, 'fulfilled');
    }
  };

  self.reject = value => {
    if(state !== 'pending') throw new Error('Attempting to reject a non-pending promise.');
    if(isThenable(value)) {
      value.then(newValue => process(newValue,'fulfilled'),
                newValue => process(newValue,'rejected'));
    } else {
      process(value, 'rejected');
    }
  };

  if(handler !== undefined) {
    handler(self.resolve, self.reject);
  }

  self.then = (fulfilled, rejected) => {
    if(fulfilled !== undefined && typeof fulfilled !== 'function') {
      throw new Error('Attempting to pass a non-function as then(fulfilled,).');
    }
    if(rejected !== undefined && typeof rejected !== 'function') {
      throw new Error('Attempting to pass a non-function as then(,rejected).');
    }

    if(state === 'pending') {
      const inner = SyncThenable();
      chain.push({promise: inner, fulfilled: fulfilled, rejected: rejected});
      return inner;
    } else {
      var innerResult;
      if(state === 'fulfilled' && fulfilled !== undefined) {
        innerResult = fulfilled(result);
      } else if(state === 'rejected' && rejected !== undefined) {
        innerResult = rejected(result);
      }

      if(isThenable(innerResult)) {
        const inner = SyncThenable();
        innerResult.then(newValue => inner.resolve(newValue),
                        newValue => inner.reject(newValue));
        return inner;
      } else {
        return SyncThenable(resolve=>resolve(innerResult));
      }
    }
  };

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
