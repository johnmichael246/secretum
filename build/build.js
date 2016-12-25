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
const nodemon = require('nodemon');
const rollup = require('rollup');

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

// used to track the cache for subsequent bundles
var cache;

exports.build = function() {
	console.log("Building your app, master!")

	mkdirIfNeeded("output");
	mkdirIfNeeded("output/webapp");
	cp('web/index.html','output/webapp/index.html');
	cp('web/favicon.png','output/webapp/favicon.png');

	mkdirIfNeeded("output/webapp/js");
	cpIfNeeded('node_modules/react/dist/react.js','output/webapp/js/react.js');
	cpIfNeeded('node_modules/react-dom/dist/react-dom.js','output/webapp/js/react-dom.js');

	mkdirIfNeeded("output/webapp/css");
	cp('web/style.css','output/webapp/css/style.css');
	cpIfNeeded('node_modules/font-awesome/css/font-awesome.min.css', 'output/webapp/css/font-awesome.min.css');

	mkdirIfNeeded("output/webapp/fonts");
	cpIfNeeded('node_modules/font-awesome/fonts/fontawesome-webfont.woff', 'output/webapp/fonts/fontawesome-webfont.woff');
	cpIfNeeded('node_modules/font-awesome/fonts/fontawesome-webfont.woff2', 'output/webapp/fonts/fontawesome-webfont.woff2');
	cpIfNeeded('node_modules/font-awesome/fonts/fontawesome-webfont.ttf', 'output/webapp/fonts/fontawesome-webfont.ttf');

	rollup.rollup({
	  // The bundle's starting point. This file will be
	  // included, along with the minimum necessary code
	  // from its dependencies
	  entry: 'web/app.js',
	  // If you have a bundle you want to re-use (e.g., when using a watcher to rebuild as files change),
	  // you can tell rollup use a previous bundle as its starting point.
	  // This is entirely optional!
	  cache: cache,
		external: ['react']
	}).then(function(bundle) {
	  // Generate bundle + sourcemap
	  var result = bundle.generate({
	    // output format - 'amd', 'cjs', 'es', 'iife', 'umd'
	    format: 'iife'
	  });

	  // Cache our bundle for later use (optional)
	  cache = bundle;

	  fs.writeFileSync('output/webapp/js/app.js', result.code );
	});

}

exports.runDev = function() {
	nodemon({
		verbose: true,
		watch: ['./back-end','./web'],
	  script: './back-end/service.js',
	  ext: 'js json css',
		env: {NODE_ENV: 'development'}
  });

	nodemon.on('start', function () {
		exports.build();
	  console.log('App has started');
	}).on('quit', function () {
	  console.log('App has quit');
	}).on('restart', function (files) {
		exports.build();
	  console.log('App restarted due to: ', files);
	});
}

// Runnable as a stand-alone script
if(require.main === module) {
	exports.build();
	exports.runDev();
}
