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

const { ep } = require('../ui.js');
const DataForm = require('./data-form.js');

module.exports = SecretForm;

function SecretForm(props) {
  
  const groups = props.groups.map(g => ({value: g.id, label: g.name}));
  const readOnly = props.readOnly || false;
  
  const fields = [
    {name: "id", type: "text", label: "ID", editable: false},
    {name: "groupId", type: "select", label: "Group", options: groups, editable: !readOnly},
    {name: "resource", type: "text", label: "Resource", editable: !readOnly},
    {name: "principal", type: "text", label: "Principal", editable: !readOnly},
    {name: "password", type: "password", label: "Password", editable: !readOnly},
    {name: "note", type: "longtext", label: "Note", editable: !readOnly}
  ].filter(field => props.fields === undefined || props.fields.includes(field.name));

  const actions = props.topActions||[];

  if(props.generator||false) {
    actions.push({label: 'Generate', icon: 'magic', handler: _ => props.onEdited(generatePassword(props.secret))});
  }
  
  const form = {
    className: 'secret-form',
    title: props.title,
    fields: fields,
    data: props.secret,
    onSubmit: props.onSubmit,
    onCancel: props.onCancel,
    onEdit: props.onEdited,
    actions: actions,
    editable: !readOnly
  };
  return ep(DataForm, form);
}

function generatePassword(secret) {
  const dict = 'abcdefghijklmopqrstuvwxyzABCDEFGIJKLMOPQRSTUVWXYZ0123456789!@#$%^&*()+*-~';
  secret.password = new Array(20).fill(0)
    .map(Math.random)
    .map(n => Math.floor(n/(1/dict.length)))
    .map(n => dict[n])
    .join('');
  return secret;
}
