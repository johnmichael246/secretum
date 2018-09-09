// @flow
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

const DataForm = require('./data-form.js');

import type { Action, DataFormProps, SomeField, Option } from './data-form.js';
import type { Group } from './group-form.js';

export type SecretFormProps = {
  title?: string,
  secret: Secret|SecretTemplate,
  groups: Array<Group>,
  editable?: boolean,
  fields?: Array<string>,
  generator?: boolean,
  topActions?: Array<Action>,
  onEdit?: EditHandler,
  onSubmit?: Function,
  onCancel?: Function
};

export type Secret = {
  id: number,
  groupId: ?number,
  resource: string,
  principal: string,
  password: string,
  note: string
};

export type SecretTemplate = {
  groupId: number,
  resource: string,
  principal: string,
  password: string,
  note: string
}

export type EditHandler = (secret: Secret) => void;

module.exports = SecretForm;

function SecretForm({
  title,
  secret,
  groups,
  editable=true,
  fields,
  topActions=[],
  generator=false,
  onEdit=()=>{},
  onSubmit,
  onCancel
}: SecretFormProps) {

  const groupOptions: Array<Option> = groups.map(group => {
    return {key: group.id.toString(), value: group.name};
  });

  groupOptions.unshift({key: '-1', value: 'No Group'});

  const formFields: Array<SomeField> = [
    {name: "id", type: "text", label: "ID", editable: false},
    {name: "groupId", type: "select", label: "Group", options: groupOptions, editable},
    {name: "resource", type: "text", label: "Resource", editable},
    {name: "principal", type: "text", label: "Principal", editable},
    {name: "password", type: "password", label: "Password", editable},
    {name: "note", type: "longtext", label: "Note", rows: 5, editable}
  ].filter(field => !fields || fields.includes(field.name));

  if(!('id' in Object.keys(secret))) {
    // Can not display ID of new objects
    formFields.splice(0,1);

    // Generating a password for new secrets
    generatePassword(secret);
  }

  if(generator) {
    topActions.push({
      label: 'Generate',
      icon: 'magic',
      handler: _ => onEdit(generatePassword(secret))
    });
  }

  const form: DataFormProps = {
    className: 'secret-form',
    title,
    fields: formFields,
    data: secret,
    onSubmit,
    onCancel,
    onEdit: data => onEdit({
      ...data,
      groupId: data.groupId === '-1' ? null : parseInt(data.groupId)
    }),
    actions: topActions,
    editable
  };
  return <DataForm {...form}/>;
}

function generatePassword(secret: Object): Object {
  const dict = 'abcdefghijklmopqrstuvwxyzABCDEFGIJKLMOPQRSTUVWXYZ0123456789!@#$%^&*()+*-~';
  secret.password = new Array(20).fill(0)
    .map(Math.random)
    .map(n => Math.floor(n/(1/dict.length)))
    .map(n => dict[n])
    .join('');
  return secret;
}
