/* @flow */
// Copyright 2017 Alex Lementa, Danylo Vashchilenko
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
import type { SomeField } from './data-form.js';

export type Group = {
  id: number,
  name: string
};

const newGroupTemplate = {
  name: ''
};

export type GroupFormProps =
  |ViewGroupFormProps
  |EditGroupFormProps;

export type ViewGroupFormProps = {
  editable: false,
  group: Group
};

export type EditGroupFormProps = {
  editable: true,
  onSubmit: () => void,
  onCancel: () => void,
  onEdit: (group: Group) => void,
  group: Group|(typeof newGroupTemplate)
};

export default function GroupForm(props: GroupFormProps) {

  var dataFormProps;
  const fields: SomeField[] = [
    {name: "id", type: "text", label: "ID", editable: false},
    {name: "name", type: "longtext", label: "Name", editable: props.editable, rows: 5}
  ];

  if(props.editable){
    dataFormProps = {
      editable: true,
      data: props.group||newGroupTemplate,
      fields,
      onSubmit: props.onSubmit,
      onCancel: props.onCancel,
      onEdit: props.onEdit
    };
  } else {
    dataFormProps = {
      editable: false,
      data: props.group,
      fields
    };
  }

	return <DataForm className="group-form" {...dataFormProps} />;
}

GroupForm.newGroupTemplate = newGroupTemplate;
