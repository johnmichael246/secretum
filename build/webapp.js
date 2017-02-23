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

const console = require("console");
const fs = require("fs");
const nodemon = require("nodemon");
const rollup = require("rollup");
const process = require("process");

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

function build() {
	console.log("Building your app, master!")

	mkdirIfNeeded('tmp');
	mkdirIfNeeded("tmp/static");
	mkdirIfNeeded("tmp/static/webapp");
	mkdirIfNeeded("tmp/static/webapp/js");
	cpIfNeeded('node_modules/react/dist/react.js','tmp/static/webapp/js/react.js');
	cpIfNeeded('node_modules/react-dom/dist/react-dom.js','tmp/static/webapp/js/react-dom.js');

	mkdirIfNeeded("tmp/static/webapp/css");
	cpIfNeeded('node_modules/font-awesome/css/font-awesome.min.css', 'tmp/static/webapp/css/font-awesome.min.css');

	mkdirIfNeeded("tmp/static/webapp/fonts");
	cpIfNeeded('node_modules/font-awesome/fonts/fontawesome-webfont.woff', 'tmp/static/webapp/fonts/fontawesome-webfont.woff');
	cpIfNeeded('node_modules/font-awesome/fonts/fontawesome-webfont.woff2', 'tmp/static/webapp/fonts/fontawesome-webfont.woff2');

	rollup.rollup({
	  entry: 'webapp/js/app.js',
		external: ['react']
	}).then(function(bundle) {
	  // Generate bundle + sourcemap
	  var result = bundle.generate({
	    // output format - 'amd', 'cjs', 'es', 'iife', 'umd'
	    format: 'es',
			sourceMap: true
			/*sourceMapFile: './tmp/static/js/app.js.map'*/
	  });

	  fs.writeFileSync('tmp/static/webapp/js/app.js', result.code + '\n//# sourceMappingURL=app.js.map');
		fs.writeFileSync('tmp/static/webapp/js/app.js.map', result.map.toString() );
	});

}

function deleteFolderRecursive(path) {
  if(fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    //fs.rmdirSync(path);
  }
};
 
// Runnable as a stand-alone script
if(require.main === module) {
	build();
}
