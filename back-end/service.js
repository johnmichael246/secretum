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

// Public modules
const http = require('http');
const httpStatus = require('http-status');
const url = require('url');
const winston = require('winston');

const connect = require('connect');
const serveStatic = require('serve-static');

const domain = require('domain');

// Private modules
const Model = require('./model');
const router = require('./router');
const routes = require('./routes');

winston.level = process.env.LOG_LEVEL || 'debug';

const config = {
	user: 'postgres',
	database: 'secretum',
	password: 'postgres',
	host: 'localhost',
	port: 5432
};

class Service {
	constructor() {
		winston.info("Initializing service...");

		this._handleRequest = this._handleRequest.bind(this);
		this._handleUnmapped = this._handleUnmapped.bind(this);

		this._model = new Model(config);
		this._router = router(routes({model: this._model}), this._handleUnmapped);
	}

	_handleUnmapped(req, resp) {
		winston.warn(`Request (${req.method} ${req.url}) did not match any rule in the router!`);
		resp.statusCode = httpStatus.BAD_REQUEST;
		resp.statusMessage = httpStatus[resp.statusCode];
		resp.end();
	}

	_handleRequest(req, resp) {
		resp.setHeader('Access-Control-Allow-Origin', '*');
		winston.info(`Handling ${req.method} ${req.url}`);
		this._router(req, resp);
	}

}

var app = connect();
app.use('/', serveStatic('./output/webapp', {}));
app.use('/api', (new Service())._handleRequest);

http.createServer((req,res) => {
	const reqd = domain.create();
	reqd.add(req);
	reqd.add(res);
	reqd.on('error', err => {
		try {
			winston.error(`Request handler for ${req.method} ${url.parse(req.url).pathname} failed at ${err.stack}`);

			res.statusCode = httpStatus.INTERNAL_SERVER_ERROR;
			res.statusMessage = httpStatus[res.statusCode];
			res.end();
		} catch(err2) {
			// eslint-disable-next-line no-console
			console.error(`Failed to handle the domain's error event`);
		}
	});

	app(req,res);
}).listen(8000);

if(require('process').env.NODE_ENV === 'development') {
	require('repl').start();
}
