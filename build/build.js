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
	if(!exists(src)) throw new Error(`Source (${src}) does not exists!`);
	if(exists(dst)) return;
	cp(src,dst);
}

function mkdirIfNeeded(path) {
	if(exists(path)) return;
	fs.mkdirSync(path);
}

mkdirIfNeeded("output");
mkdirIfNeeded("output/webapp");
cp('web/index.html','output/webapp/index.html');
cp('web/favicon.png','output/webapp/favicon.png');

mkdirIfNeeded("output/webapp/js");
cpIfNeeded('node_modules/react/dist/react.js','output/webapp/js/react.js');
cpIfNeeded('node_modules/react-dom/dist/react-dom.js','output/webapp/js/react-dom.js');
cp('web/app.js','output/webapp/js/app.js');

mkdirIfNeeded("output/webapp/css");
cp('web/style.css','output/webapp/css/style.css');
cpIfNeeded('node_modules/font-awesome/css/font-awesome.min.css', 'output/webapp/css/font-awesome.min.css');

mkdirIfNeeded("output/webapp/fonts");
cpIfNeeded('node_modules/font-awesome/fonts/fontawesome-webfont.woff', 'output/webapp/fonts/fontawesome-webfont.woff');
cpIfNeeded('node_modules/font-awesome/fonts/fontawesome-webfont.ttf', 'output/webapp/fonts/fontawesome-webfont.ttf');

