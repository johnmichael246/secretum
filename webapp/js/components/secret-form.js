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

const React = require('react');
const { ep } = require('../ui.js');
const DataForm = require('./data-form.js');

module.exports = class SecretForm extends React.Component {
	constructor(props) {
		super(props);
	}

	_generatePassword(secret) {
		const dict = 'abcdefghijklmopqrstuvwxyzABCDEFGIJKLMOPQRSTUVWXYZ0123456789!@#$%^&*()+*-~';
		secret.password = Array(22).fill(0)
			.map(Math.random)
			.map(n => Math.floor(n/(1/dict.length)))
			.map(n => dict[n])
			.join('');
		return secret;
	}

	render() {
		const groups = this.context.store.findGroups().then(gs => gs.map(g => ({value: g.id, label: g.name})));
		const readOnly = this.props.readOnly || false;


		const fields = [
			[{name: "id", type: "text", label: "ID", readOnly: true},
			{name: "groupId", type: "select", label: "Group", options: groups, readOnly: readOnly},
			{name: "resource", type: "text", label: "Resource", readOnly: readOnly},
			{name: "principal", type: "text", label: "Principal", readOnly: readOnly},
			{name: "password", type: "password", label: "Password", readOnly: readOnly}],
			{name: "note", type: "textarea", label: "Note", readOnly: readOnly}
		].filter(field => this.props.fields === undefined || this.props.fields.includes(field.name));

		const actions = this.props.topActions||[];

		if(this.props.generator||false) {
			actions.push({label: 'Generate', icon: 'magic', handler: this._generatePassword});
		}

		const secret = this.props.secretId === null ? {
			id: '',
			resource: '',
			groupId: 0,
			principal: '',
			password: '',
			note: ''
		} : this.context.store.getSecret(this.props.secretId);

		const form = {
			className: 'secret-form',
			title: this.props.title,
			fields: fields,
			data: secret,
			onSubmit: this.props.onSubmit,
			onCancel: this.props.onCancel,
			topActions: actions
		};
		return ep(DataForm, form);
	}
};

module.exports.contextTypes = {
  store: React.PropTypes.object
};
