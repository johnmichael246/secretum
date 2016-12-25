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

/* global React */

import {ep} from '../ui.js';
import {DataForm} from './data-form.js';
import { Model } from '../model.js';

export class SecretForm extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		const groups = Model.get().findGroups().then(gs => gs.map(g => ({value: g.id, label: g.name})));
		const readOnly = this.props.readOnly || false;

		const fields = [
			{name: "id", type: "text", label: "ID", readOnly: true},
			{name: "groupId", type: "select", label: "Group", options: groups, readOnly: readOnly},
			{name: "resource", type: "text", label: "Resource", readOnly: readOnly},
			{name: "principal", type: "text", label: "Principal", readOnly: readOnly},
			{name: "password", type: "text", label: "Password", readOnly: readOnly},
			{name: "note", type: "textarea", label: "Note", readOnly: readOnly}
		];
		const form = {
			className: this.props.className||'' + ' secret-form',
			title: this.props.title,
			fields: fields,
			data: this.props.secret,
			onSubmit: this.props.onSubmit,
			onCancel: this.props.onCancel,
			topActions: this.props.topActions
		};
		return ep(DataForm, form);
	}
}
