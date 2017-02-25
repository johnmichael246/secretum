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

const fs = require('fs');
const rollup = require('rollup');
const utils = require('./utils.js')
const console = require('console');
const cprocess = require('child_process');

console.log('Running tests of the webapp...');
process.stdout.write('Performing ESLint of JS code...');
try {
    cprocess.execFileSync('./node_modules/.bin/eslint', ['./webapp/js']);
} catch(err) {
    console.log('Failed!');
    console.log(err.stdout.toString());
    process.exit(1);
}
console.log('OK');


process.stdout.write('Preparing PromisesA+ tests...');
utils.mkdirIfNeeded('./tmp/tests/webapp');
rollup.rollup({
    entry: './webapp/js-tests/sync-thenable.js'
}).then(function(bundle) {
    var result = bundle.generate({format: 'cjs'});
    fs.writeFileSync('./tmp/tests/webapp/sync-thenable.js', result.code);
    console.log('OK');
    runPromiseTests();
}, error => {
    console.error('Rollup failed!', error);
    process.exit(1);
});

function runPromiseTests() {
    process.stdout.write('Running PromisesA+ tests...');
    try {
        cprocess.execFileSync('./node_modules/.bin/promises-aplus-tests',
            ['./tmp/tests/webapp/sync-thenable.js', '--no-colors'], {});
    } catch(err) {
        //fs.writeFileSync('./webapp/js-tests/sync-thenable.last.log', err.stdout);
        const lastStdout = fs.readFileSync('./webapp/js-tests/sync-thenable.last.log');
        if(err.stdout.equals(lastStdout)) {
            console.log('OK');
        } else {
            console.log('Failed!')
            console.error("Ouputs of SyncThenable's tests have changed!");
            console.error('=============================================')
            console.error(err.stdout.toString());
            console.error('=============================================')
            console.error(err.stderr.toString());
            process.exit(1);
        }
    }
}