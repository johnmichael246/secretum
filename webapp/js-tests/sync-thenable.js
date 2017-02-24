import {SyncThenable} from '../js/sync-thenable.js';

module.exports = {
    deferred: function() {
        const ret = SyncThenable();
        return { 
            promise: ret, 
            resolve: ret.resolve.bind(ret),
            reject: ret.reject.bind(ret)
        };
    }
};

/*const promisesAplusTests = require("promises-aplus-tests");
promisesAplusTests(adapter, function (err) {
    if(err) {
        console.error("SyncThenable failed the tests...", err);
    }
});*/ 