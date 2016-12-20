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

let console = require("console");
console.log("Building your app, master...")

let fs = require("fs");

function cp(src, dst) {
	console.log("Copying " + src + " to " + dst);
	fs.createReadStream(src).pipe(fs.createWriteStream(dst));
}

function exists(path) {
	try {
		fs.accessSync(path);
	} catch(e) {
		return false;
	}
	return true;
}

function cpIfNeeded(src, dst) {
	if(exists(dst)) return;
	cp(src,dst);
}

function mkdirIfNeeded(path) {
	if(exists(path)) return;
	fs.mkdirSync(path);
}

mkdirIfNeeded("output");
mkdirIfNeeded("output/lib");
cpIfNeeded('node_modules/react/dist/react.js','output/lib/react.js');
cpIfNeeded('node_modules/react-dom/dist/react-dom.js','output/lib/react-dom.js');
cp('static/app.html','output/app.html');
cp('static/app.css','output/app.css');

var babel = require("babel-core");

console.log("Transforming scripts...");
let s = fs.createWriteStream("output/app.js");
s.write(babel.transformFileSync("js/app.jsx",{presets:["react"]}).code);
s.end();