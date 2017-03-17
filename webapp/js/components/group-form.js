/* @flow */
// Copyright 2017 Alex Lementa
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

export type GroupFormProps = {
  editable: boolean,
  fieldNames: Array<string>,
  group?: Group,
  onSubmit: () => void,
  onCancel: () => void,
  onEdit: (group: Group) => void
};

const newGroupTemplate = { id: null, name: '' };

function GroupForm({
  editable=true,
  fieldNames=[],
  group,
  onSubmit,
  onCancel,
  onEdit
}: GroupFormProps) {

	const fields: SomeField[] = [
		{name: "id", type: "text", label: "ID", editable: false},
		{name: "name", type: "longtext", label: "Name", editable, rows: 5}
	].filter(field => fieldNames.includes(field.name));

	return <DataForm className="group-form" data={group||newGroupTemplate}
    {...{fields, onSubmit, onCancel, onEdit}} />;
}

module.exports = GroupForm;
