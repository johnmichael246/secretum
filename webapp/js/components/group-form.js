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

const React = require('react');
const { ep } = require('../ui.js');
const DataForm = require('./data-form.js');

module.exports = class GroupForm extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		const readOnly = this.props.readOnly || false;
    
		const fields = [
			{name: "id", type: "text", label: "ID", readOnly: true},
			{name: "name", type: "textarea", label: "Name", readOnly: readOnly}
		].filter(field => this.props.fields === undefined || this.props.fields.includes(field.name));

		const actions = this.props.topActions||[];

		const group = this.props.groupId === null ? {
			id: '',
			name: ''
		} : this.context.store.getGroup(this.props.groupId);

		const form = {
			className: this.props.className||'' + ' secret-form',
			title: this.props.title,
			fields: fields,
			data: group,
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
