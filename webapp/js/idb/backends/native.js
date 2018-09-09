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

require('isomorphic-fetch');

export default class NativeBackend {
  constructor(config) {
    this.config = config;
  }

  // async connect() {
  //   const url = `${this.config.url}`;
  //   const auth = 'Basic ' + btoa(`${this.config.username}:${this.config.password}`);
  //   return fetch(url, {
  //     headers: {
  //       'Authorization': auth
  //     }
  //   }).then(resp => resp.headers.get('Cookies')json()).then(result => result.snapshots);
  // }

  async pull(sinceCommitId) {
    const params = {
      'vaultId': this.config.vaultName
    };

    if(sinceCommitId !== undefined) {
      params['sinceCommitId'] = sinceCommitId;
    }

    const response = await this._get('/pull', params);
    return response.snapshots;
  }

  commit(changes) {
    const params = {
      'device': this.config.device,
      'vaultId': this.config.vaultName
    };

    return this._post('/commit', params, JSON.stringify(changes));
  }

  _get(path, queryObject) {
    return this._request('GET', path, {queryObject});
  }

  _post(path, queryObject, body) {
    return this._request('POST', path, {queryObject, body});
  }

  async _request(method, path, {queryObject={}, body=null}) {

    const queryString = Object.keys(queryObject)
      .map(key => [key, queryObject[key]])
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    const auth = 'Basic ' + btoa(`${this.config.username}:${this.config.password}`);
    const url = `${this.config.url}${path}?${queryString}`;

    const response = await fetch(url, {
      method: method,
      headers: {
        'Authorization': auth
      },
      body: body
    });

    const statusCode = response.status;
    const responseBody = await response.json();

    if(statusCode === 400) {
      throw new Error(`Code: ${statusCode}\nMessage: ${responseBody.status}`);
    }

    return responseBody;
  }
}
