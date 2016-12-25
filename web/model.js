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

export class Model {
  constructor(endpoint) {
    this.endpoint = endpoint;
    Model.get = () => this;
  }

  _request(method, path, body) {
    const payload = (resolve, reject) => {
      var xhr = new XMLHttpRequest();
      xhr.open(method, this.endpoint + path);
      if(method === "GET") {
        xhr.responseType = "json";
      }
      xhr.onload = () => {
        if(xhr.status === 200) {
          resolve(xhr.response);
        } else {
          reject(new Error(xhr.statusText));
        }
      };
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(body);
    };
    return new Promise(payload);
  }

  _get(path) {
    return this._request("GET", path);
  }

  _post(path, body) {
    return this._request("POST", path, body);
  }

  findGroups() {
    if(this.groups !== undefined) {
      return Promise.resolve(this.groups);
    }
    return this._get("/groups").then(groups => this.groups = groups);
  }

  findSecrets(query) {
    query = query||{};
    const keyword = query.keyword||'';
    const group = query.group||'';

    return this._get(`/secrets?keyword=${encodeURIComponent(keyword)}&group=${encodeURIComponent(group)}`);
  }

  saveSecret(secret) {
    const data = JSON.stringify(secret);

    if(secret.id === null) {
      this._post("/secrets", data);
    } else {
      this._post(`/secrets/${secret.id}`, data);
    }
  }

  removeSecret(id) {
    this._post(`/secrets/${id}/delete`);
  }

  get(id) {
    return this.findSecrets().then(ss => {
      for(var s of ss) {
        if(s.id === id) {
          return s;
        }
      }
      return null;
    });
  }
}
