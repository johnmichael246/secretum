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

const httpStatus = require('http-status');
const winston = require('winston');

module.exports = (config) => {
  return [
    {method: "GET", 	path: "/vaults", handler: action(findVaults, {model: config.model})},
    {method: "GET", 	path: "/vaults/{name}", handler: action(getVault, {model: config.model})},
    //{method: "POST",  path: "/vaults", handler: action(createVault, {model: config.model})},
    {method: "GET", 	path: "/snapshots/{id}", handler: action(getSnapshot, {model: config.model})},
    //{method: "POST",  path: "/snapshots", handler: action(createSnapshot, {model: config.model})}
  ];
};

function action(handler, config) {
  return (req, resp) => {
    // Merging the factory's config in
    req = Object.assign(req, config);

    req.queryVars = extractQueryVars(req.url.query);

    const writeReply = reply => {
      resp.statusCode = reply.status;
      resp.statusMessage = httpStatus[resp.statusCode];
      resp.end(reply.doc === undefined ? undefined : JSON.stringify(reply.doc));
    };

    winston.verbose(`Calling ${handler.name} to handle ${req.method} ${req.url.pathname}`, req.pathVars, req.queryVars);

    readBody(req.httpRequest).then(body => {
      req.body = body;
      Promise.resolve(handler(req, resp)).then(writeReply);
    });
  };
}

function findVaults(req) {
	return req.model.findVaults().then(ok);
}

function getVault(req) {
  return req.model.getVault(req.pathVars.name).then(okOrNotFound);
}

function getSnapshot(req) {
  return req.model.getSnapshot(parseInt(req.pathVars.id)).then(okOrNotFound);
}

/*function findSecrets(req) {
  const keyword = (req.queryVars.keyword||'').trim();
  const group = parseInt(req.queryVars.group)||undefined;
	return req.model.findSecretsByKeywordAndGroup(keyword, group).then(res => ok(res));
}

function createSecret(req) {
	if(req.body === '') {
		winston.warn(`Request (${req.method} ${req.url}) attempted without request body.`);
		return {status: httpStatus.BAD_REQUEST};
	}

	const secret = JSON.parse(req.body);
	secret.group_id = secret.groupId;
	secret.groupId = undefined;

	return req.model.createSecret(secret).then(id => ok({id: id}));
}

function updateSecret(req) {
	if(req.body === '') {
		winston.warn(`Request (${req.method} ${req.url}) attempted without request body.`);
		return {status: httpStatus.BAD_REQUEST};
	}

	const secret = JSON.parse(req.body);
	secret.id = req.pathVars.id;
	secret.group_id = secret.groupId;
	secret.groupId = undefined;

	return req.model.updateSecret(secret).then(() => ok());
}

function deleteSecret(req) {
	return req.model.deleteSecret(req.pathVars.id).then(() => ok());
}

function findSecretById(req) {
	return req.model.findSecretById(req.pathVars.id).then(secret => {
		if(secret === null) {
			return {status: httpStatus.NOT_FOUND, doc: secret};
		} else {
			return ok(secret);
		}
	});
}

function findGroups(req) {
	return req.model.findAllGroups().then(groups => ok(groups));
}*/

// ----- Utility functions -----

function ok(doc) {
  return {status: httpStatus.OK, doc: doc};
}

function notFound() {
  return {status: httpStatus.NOT_FOUND};
}

function okOrNotFound(doc) {
  if(doc === null) {
    return notFound();
  } else {
    return ok(doc);
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    var body = '';
    req.on('data', function (data) {
        body += data;
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6) {
            winston.warn(`A very large request will now be dropped!`);
            req.connection.destroy();
            reject();
        }
    });
    req.on('end', () => resolve(body));
  });
}

function extractQueryVars(query) {
	if(query === null) {
		return {};
	}

	const kvs = query.split('&');
  if(kvs.length === 0) return {};

	const params = kvs.map(kv => kv.split('=')).map(pair => ({[pair[0]]:pair[1]}));
	return Object.assign.apply(null, params);
}
