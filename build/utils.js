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

const path = require('path');
const fs = require('fs');

function exists(path) {
	try {
		fs.accessSync(path);
	} catch(e) {
		return false;
	}
	return true;
}

function mkdirIfNeeded(target) {
	if(exists(target)) {
        return;
    }
    
    const parent = path.dirname(target);
    if(!exists(parent)) {
        /* Recursively builds the path */
        mkdirIfNeeded(parent);
    }

	fs.mkdirSync(target);
}

module.exports = {
    mkdirIfNeeded: mkdirIfNeeded
};