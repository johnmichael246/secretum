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

/*global React*/

import {ep, epc} from '../ui.js';

export class DataForm extends React.Component {
	constructor(props) {
		super(props);
		this.state = this._setup(props);

		this._onFieldChange = this._onFieldChange.bind(this);
		this._onSubmit = this._onSubmit.bind(this);
		this._onCancel = this._onCancel.bind(this);
	}

	_onSubmit() {
		this.props.onSubmit(this.state.data);
	}

	_onCancel() {
		this.props.onCancel();
	}

	_setup(props) {
		const promises = [];
		if(props.data instanceof Promise) {
			promises.push(props.data.then(d => this.setState({data: d})));
		}
		props.fields.forEach((f,fi) => {
			if(f.type === "select" && f.options instanceof Promise) {
				// Chains with a promise of a function
				// which inserts arrived options into the metadata
				promises.push(f.options.then(o => {
					var fields = new Object(this.state.fields);
					fields[fi].options = o;
					this.setState({fields: fields});
				}));
			}
		});

		if(promises.length > 0) {
			Promise.all(promises).then(()=>this.setState({loading: false}));
		}

		return {
			loading: promises.length > 0,
			data: props.data,
			fields: props.fields
		};
	}

	_onFieldChange(evt) {
		const update = {[evt.target.name]: evt.target.value};
		this.setState({data: Object.assign(this.state.data, update)});
	}

	_buildTextField(field) {
		const props = { key: "input", type: "text", name: field.name, onChange: this._onFieldChange };

		if(this.state.loading) {
			// Disabling input component if the data is not yet ready
			props.value = "...";
			props.disabled = "";
		} else {
			// Populating with current value otherwise
			props.value = this.state.data[field.name];
			props.disabled =  field.readOnly || false;
		}

		const label = epc("div", {key: "label", className: "label"}, field.label);
		return epc("div", {key: field.name, className: "row"}, [label, ep("input", props)]);
	}

	_buildSelectField(field) {
		const props = { key: "input", name: field.name, onChange: this._onFieldChange };
		const options = [];

		if(this.state.loading) {
			options.push(epc("option", {key: "loading"}, "..."));
			props.value = "...";
			props.disabled = "";
		} else {
			options.push(field.options.map(o => epc("option", {key: o.value, value: o.value}, o.label)));
			props.value = this.state.data[field.name];
			props.disabled =  field.readOnly || false;
		}

		const label = epc("div", {key: "label", className: "label"}, field.label);
		return epc("div", {key: field.name, className: "row"}, [label, epc("select", props, options)]);
	}

	_buildTextAreaField(field) {
		const props = { key: "input", name: field.name, onChange: this._onFieldChange, rows: 10 };

		if(this.state.loading) {
			props.value = "...";
			props.disabled = "";
		} else {
			props.value = this.state.data[field.name];
			props.disabled =  field.readOnly || false;
		}

		const label = epc("div", {key: "label", className: "label"}, field.label);
		return epc("div", {key: field.name, className: "row"}, [label, ep("textarea", props)]);
	}

	render() {
		// Form: title, [fields], validator?, record?, className?, onSubmit?, onCancel?
		// Field: name, type, label, validator?, className?
		const children = [];

		if(this.props.title !== undefined) {
			children.push(epc("h2",{key: "title", className: "title"},this.props.title));
		}

		const buildAction = (action) => {
			const icon = ep('div', {key: 'icon', className: `action-icon fa fa-${action.icon}`});
			const label = epc('div', {key: 'label', className: 'action-label'}, action.label);

			return epc('div', {key: action.label, className: 'action', onClick: action.handler}, [icon, label]);
		};

		if(this.props.topActions !== undefined) {
			const actionsBox = epc('div',
				{key: 'top-actions', className: 'actions-box'},
				this.props.topActions.map(buildAction)
			);
			const label = ep('div', {key: 'label', className: 'label'});
			const row = epc('div', {key: 'actions', className: 'row'}, [label, actionsBox]);
			children.push(row);
		}

		for(let field of this.state.fields) {
			var row;
			if(field.type === "text") {
				row = this._buildTextField(field);
			} else if(field.type === "select") {
				row = this._buildSelectField(field);
			} else if(field.type === "textarea") {
				row = this._buildTextAreaField(field);
			}

			children.push(row);
		}

		if(this.props.onSubmit !== undefined) {
			let buttonProps = {key: "!submit", type: "button", value: "Submit!",
			onClick: this._onSubmit, disabled: this.state.loading};
			children.push(ep("input", buttonProps));
		}

		if(this.props.onCancel !== undefined) {
			let buttonProps = {key: "!cancel", type: "button", value: "Cancel",
			onClick: this._onCancel, disabled: this.state.loading};
			children.push(ep("input", buttonProps));
		}

		return epc("div", {className: `data-form ${this.props.className}`}, children)
	}
}
