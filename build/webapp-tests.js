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

utils.mkdirIfNeeded('./tmp/tests/webapp');

rollup.rollup({
    entry: 'webapp/js-tests/sync-thenable.js'
}).then(function(bundle) {
    var result = bundle.generate({format: 'cjs'});
    fs.writeFileSync('tmp/tests/webapp/sync-thenable.js', result.code);
}).catch(e => {
    console.error('Rollup failed!', e);
});