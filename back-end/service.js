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

const http = require('http');
const pg = require('pg');
const url = require('url');
const httpStatus = require('http-status');
const winston = require('winston');

winston.level = process.env.LOG_LEVEL || 'debug';

const config = {
	user: 'postgres',
	database: 'secretum',
	password: 'postgres',
	host: 'localhost',
	port: 5432
};

function cross(aa, bb) {
	return aa.map((a,ka) => [a,bb[ka]]);
}

function parsePattern(pattern) {
	var cmps = pattern.split("/");
    var vars = [];

    // Removing emptiness before heading slash
    cmps.shift();

    cmps = cmps.map(c => {
    	const trial = /^{(.*)}$/.exec(c);
    	// If a pattern variable found
        if(trial) {
        	// Replace with a regex capture group
        	vars.push(trial[1]);
            return "([^\\/]+)";
        } else {
            return c;
        }
    });

    const regex = new RegExp("^/" + cmps.join("\\/") + "$");

    return {regex: regex, vars: vars};
}

function pathPattern(pattern) {
	const parsed = parsePattern(pattern);
    
    return req => {
    	const path = url.parse(req.url).pathname;
    	return parsed.regex.test(path);
    };
}

function method(verb) {
	return req => req.method === verb;
}

class Router {
	constructor(rules, defaultHandler, model) {
		if(rules === undefined) throw new Error("Missing rules for router initialization!");
		if(defaultHandler === undefined) throw new Error("Missing default handler for unmapped requests!");

		this._rules = rules;
		this._defaultHandler = defaultHandler;
		this._model = model;
	}

	serve(request, response) {
		for(var rule of this._rules) {
			const [test, handler] = rule;

			var applies = null;
			if(test instanceof Function) {
				applies = test(request);
			} else if(test instanceof Array) {
				applies = test.map(f => f(request)).filter(r => r === false).length === 0;
			}

			if(!applies) {
				continue;
			}

			handler(request, response, this._model);
			return;
		}
		return this._defaultHandler(request, response);
	}
}

class Model {
	constructor(config) {
		this._config = config;
	}

	_query(str, params) {
		return new Promise((resolve, reject) => {
			const client = new pg.Client(config);
			client.connect(err => {
				if(err) {
					reject(err);
					return;
				}

				
				client.query(str, params, (err, res) => {
					if(err) {
						reject(err);
						return;
					}

					resolve(res);
				});
			});
		});
	}

	findSecretsByKeywordAndGroup(keyword, groupId, deleted) {
		winston.verbose(`Selecting${deleted||false?' deleted ':' '}secrets from (${groupId||'all'}) with (${keyword||'any'}).`);
		const str = `select secrets.id as id, resource, principal, secrets.password, note, 
							groups.id as "groupId", groups.name as "groupName"
							from secrets left join groups on groups.id = secrets.group_id
							where (lower(resource) like lower($1) or lower(principal) like lower($1) 
										or lower(note) like lower($1) or $1 is null) 
							  	and (group_id = $2 OR $2 is null) and deleted = $3 order by id`;
		return this._query(str,[keyword||null,groupId||null,deleted||false]).then(res => res.rows);
	}

	findSecretById(id) {
		const str = `select secrets.id as id, resource, principal, secrets.password, note, 
							  groups.id as "groupId", groups.name as "groupName" 
							  from secrets left join groups on groups.id = secrets.group_id
							  where secrets.id = $1`;
		return this._query(str, [id]).then(res => res.rows.length > 0 ? res.rows[0] : null);
	}

	findAllGroups() {
		return this._query('select * from groups').then(res => res.rows);
	}

	insertSecret(secret) {
		winston.verbose(`Inserting new secret.`);
		const sql = `insert into secrets (resource, principal, password, note, group_id) 
						values ($1, $2, $3, $4, $5) returning id`;
		const params = [secret.resource, secret.principal, secret.password, secret.note, secret.groupsId];
		return this._query(sql, params).then(res => res.rows[0].id);
	}

	updateSecret(secret) {
		winston.verbose(`Updating secret with ID: ${secret.id}`);
		const sql = `update secrets set resource = $1, principal = $2, password = $3, note = $4, group_id = $5
						where id = $6`;
		const params = [secret.resource, secret.principal, secret.password, secret.note, secret.group_id, secret.id];
		return this._query(sql, params).then(res => secret.id);
	}

	deleteSecret(id) {
		winston.verbose(`Deleting secret with ID: ${id}`);
		return this._query('update secrets set deleted = true where id = $1', [id]).then(res => id);
	}
}

function ok(resp, doc) {
	resp.statusCode = httpStatus.OK;
	resp.statusMessage = httpStatus[resp.statusCode];
	resp.end(doc === undefined ? doc : JSON.stringify(doc));
}

function badRequest(resp) {
	resp.statusCode = httpStatus.BAD_REQUEST;
	resp.statusMessage = httpStatus[resp.statusCode];
	resp.end();
}

function notFound(resp) {
	resp.statusCode = httpStatus.NOT_FOUND;
	resp.statusMessage = httpStatus[resp.statusCode];
	resp.end();
}

function serviceStatus(req, resp, model) {
	ok(resp, {home: true});
}

function extractQueryVars(req) {
	const query = url.parse(req).query;
	if(query === null) {
		return {};
	}

	const kvs = query.split('&');
	const params = kvs.map(kv => kv.split('=')).map(pair => ({[pair[0]]:pair[1]}));
	return Object.assign(params);
}

function extractPathVars(pattern, req) {
	const parsed = parsePattern(pattern);
	const values = parsed.regex.exec(url.parse(req).pathname);
	values.shift();
	return Object.assign(cross(parsed.vars, values).map(kv => ({[kv[0]]:kv[1]})))[0];
}

function findSecrets(req, resp, model) {
	const params = extractQueryVars(req.url);
	model.findSecretsByKeywordAndGroup(params.keyword, params.group).then(d => ok(resp, d));
}

function createSecret(req, resp, model) {
	readBody(req, body => {
		if(body === '') {
			badRequest(resp);
			return;
		}
		const secret = JSON.parse(body);
		secret.group_id = secret.groupId;
		secret.groupId = undefined;

		model.createSecret(secret).then(id => {
			ok(resp, {id: id});
		});
	});
}

function readBody(req, handler) {
	var body = '';
    req.on('data', function (data) {
        body += data;
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6) { 
            winston.warn(`A very large request will now be dropped!`);
            req.connection.destroy();
        }
    });
    req.on('end', _ => handler(body));
}

function updateSecret(req, resp, model) {
	readBody(req, body => {
	    if(body === '') {
			winston.warn(`Request (${req.method} ${req.url}) attempted without request body.`);
			badRequest(resp);
			return;
		}
		const secret = JSON.parse(body);
		secret.id = extractPathVars('/secrets/{id}', req.url).id;
		secret.group_id = secret.groupId;
		secret.groupId = undefined;

		model.updateSecret(secret).then(_ => ok(resp));
    });
}

function deleteSecret(req, resp, model) {
	const id = extractPathVars('/secrets/{id}/delete', req.url).id;
	model.deleteSecret(id).then(_ => ok(resp));
}

function findSecretById(req, resp, model) {
	const id = extractPathVars("/secrets/{id}").id;
	const promise = model.findSecretById(id);

	promise.then(secret => {
		if(secret === null) {
			notFound(resp);
		} else {
			ok(resp, secret);
		}
	});
}

function findGroups(req, resp, model) {
	model.findAllGroups().then(d => ok(resp,d));
}

class Service {
	constructor() {
		console.log("Initializing service...");

		this._handleRequest = this._handleRequest.bind(this);
		this._handleUnmapped = this._handleUnmapped.bind(this);

		this._server = new http.Server();
		this._server.addListener('request', this._handleRequest);

		this._model = new Model(config);

		this._router = new Router([
			[[method("GET"), pathPattern("/")], serviceStatus],
			[[method("GET"), pathPattern("/secrets")], findSecrets],
			[[method("POST"), pathPattern("/secrets")], createSecret],
			[[method("GET"), pathPattern("/secrets/{id}")], findSecretById],
			[[method("POST"), pathPattern("/secrets/{id}")], updateSecret],
			[[method("POST"), pathPattern("/secrets/{id}/delete")], deleteSecret],
			[[method("GET"), pathPattern("/groups")], findGroups]
		], this._handleUnmapped, this._model);
	}

	_handleUnmapped(req, resp) {
		winston.warn(`Request (${req.method} ${req.url}) did not match any rule in the router!`);
		badRequest(resp);
	}

	_handleRequest(req, resp) {
		resp.setHeader('Access-Control-Allow-Origin', '*');

		winston.info(`Handling ${req.method} ${req.url}`);

		const onError = err => {
			resp.statusCode = httpStatus.INTERNAL_SERVER_ERROR;
			resp.statusMessage = httpStatus[resp.statusCode];
			resp.end(err !== undefined ? err.toString() : undefined);
		};

		try {
			Promise.resolve(this._router.serve(req, resp, this._model)).catch(onError);
		} catch(err) {
			winston.error(err);
			onError();
		}
	}

	start() {
		this._server.listen(8001, () => {
			console.log("Service started successfully on port 8001...");
		});
	}
}

new Service().start();
