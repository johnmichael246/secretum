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

//const pg = require('pg');
const winston = require('winston');
const fs = require('fs');

class Model {
	constructor(config) {
		this._config = config;
		this.data = new Promise((resolve,reject) => {
			fs.readFile('./back-end/mock.json', (err, data) => {
				if(err) {
					reject(err);
				} else {
					resolve(JSON.parse(data));
				}
			});
		});
	}

	getVault(name) {
		return this.data.then(data => {
			const vault = data.vaults.find(vault => vault.name === name);
			return vault === undefined ? null : vault;
		});
	}

	getSnapshot(id) {
		return this.data.then(data => {
			const ret = data.snapshots.find(s => s.id === id);
			return ret === undefined ? null : ret;
		});
	}

	findVaults() {
		return this.data.then(data => data.vaults);
	}

	/*_query(str, params) {
		return new Promise((resolve, reject) => {
			const client = new pg.Client(this._config);
			client.connect(err => {
				if(err) {
					reject(err);
					return;
				}

				str = str.replace(/\s\s+/g, ' ');
				winston.debug(`With (${JSON.stringify(params||{})}) executing SQL: ${str}`);

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

		keyword = `%${keyword||''}%`;
		return this._query(str,[keyword,groupId||null,deleted||false]).then(res => res.rows);
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
		return this._query(sql, params).then(() => secret.id);
	}

	deleteSecret(id) {
		winston.verbose(`Deleting secret with ID: ${id}`);
		return this._query('update secrets set deleted = true where id = $1', [id]).then(() => id);
	}*/
}

module.exports = Model;
