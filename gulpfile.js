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

const gulp = require('gulp');
gulp.debug = require('gulp-debug');
gulp.changed = require('gulp-changed');
gulp.sass = require('gulp-sass');
gulp.util = require('gulp-util');
gulp.source = require('vinyl-source-stream');
gulp.sourcemaps = require('gulp-sourcemaps');
gulp.mocha = require('gulp-mocha');
gulp.buffer = require('vinyl-buffer');
gulp.flowtype = require('gulp-flowtype');

const browserify = require('browserify');
const watchify = require('watchify');
const babelify = require('babelify');

const fs = require('bluebird').promisifyAll(require('fs-extra'));
const path = require('path');
const es = require('event-stream');
const cprocess = require('child_process');

const DEST = './dist/webapp';

gulp.task('clean', _ => {
  return fs.removeAsync('./dist');
});

function compileSass() {
  return gulp.src('./webapp/scss/app.scss')
    .pipe(gulp.sourcemaps.init())
    .pipe(gulp.sass({
      sourceMap: true,
      outFile: './webapp/css/app.css'
    }))
    .on('error', gulp.sass.logError)
    .pipe(gulp.sourcemaps.write())
    .pipe(gulp.dest(path.join(DEST, 'css')));
}

const browserifyOpts = Object.assign({
  entries: './webapp/js/app.js',
  debug: true
}, watchify.args);
let browserifyBundle = browserify(browserifyOpts);
browserifyBundle.on('log', console.log);

function bundleJS() {
  return browserifyBundle
    .transform(babelify, {presets: ['react']})
    .bundle()
    .on('error', err => gulp.util.log('Browserify Error', err))
    .pipe(gulp.source('bundle.js'))
    .pipe(gulp.buffer())
    .pipe(gulp.sourcemaps.init({ loadMaps: true }))
    .pipe(gulp.sourcemaps.write('./'))
    .pipe(gulp.dest(path.join(DEST, 'js')));
}

function vendor() {
  return es.merge([
    gulp.src('./node_modules/react/dist/react.js')
      .pipe(gulp.changed(path.join(DEST, 'js')))
      .pipe(gulp.dest(path.join(DEST, 'js'))),
    gulp.src('./node_modules/react-dom/dist/react-dom.js')
      .pipe(gulp.changed(path.join(DEST, 'js')))
      .pipe(gulp.dest(path.join(DEST, 'js'))),
    gulp.src('./node_modules/font-awesome/css/font-awesome.min.css')
      .pipe(gulp.changed(path.join(DEST, 'css')))
      .pipe(gulp.dest(path.join(DEST, 'css'))),
    gulp.src([
        './node_modules/font-awesome/fonts/fontawesome-webfont.woff',
        './node_modules/font-awesome/fonts/fontawesome-webfont.woff2'
      ])
      .pipe(gulp.changed(path.join(DEST, 'fonts')))
      .pipe(gulp.dest(path.join(DEST, 'fonts')))
  ]);
}

function copyStaticFiles() {
  return gulp.src('./webapp/static/webapp/**')
    .pipe(gulp.changed(DEST))
    .pipe(gulp.dest(DEST));
}

gulp.task('build-watch', ['build'], _ => {
  browserifyBundle = watchify(browserify(browserifyOpts));
  return gulp.watch(['./webapp/js/**', './webapp/scss/**'], ['build' ]);
});

gulp.task('build', _ => {
  return es.merge([vendor(), copyStaticFiles(), bundleJS(), compileSass()]).pipe(gulp.debug());
});

gulp.task('test', ['test-promises', 'test-eslint', 'test-mocha', 'test-flow']);

gulp.task('test-flow', _ => {
  return gulp.src('./webapp/js/**')
    .pipe(gulp.flowtype());
});

gulp.task('test-mocha', _ => {
  return gulp.src('./webapp/js-tests/versioned-idb.js')
    .pipe(gulp.mocha());
});

gulp.task('test-eslint', done => {
  process.stdout.write('Performing ESLint of JS code...');
  try {
    cprocess.execFileSync('./node_modules/.bin/eslint', ['./webapp/js']);
  } catch(err) {
    console.log('Failed!');
    console.log(err.stdout.toString());
    done(err);
    return;
  }
  console.log('OK');
  done();
});

gulp.task('test-promises', done => {
  process.stdout.write('Running PromisesA+ tests...');
  try {
    cprocess.execFileSync('./node_modules/.bin/promises-aplus-tests',
      ['./webapp/js-tests/sync-thenable.js', '--reporter tap'], {});
  } catch(err) {
    //fs.writeFileSync('./webapp/js-tests/sync-thenable.last.log', err.stdout);
    const lastStdout = fs.readFileSync('./webapp/js-tests/sync-thenable.last.log');
    if(err.stdout.equals(lastStdout)) {
      console.log('OK!');
      done();
    } else {
      console.log('Failed!');
      console.error("Outputs of SyncThenable's tests have changed!");
      console.error('=============================================')
      console.error(err.stdout.toString());
      console.error('=============================================')
      console.error(err.stderr.toString());
      done(new Error('Promises test failed', err));
    }
  }
});