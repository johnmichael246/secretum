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

import { ep, ec, epc } from '../ui.js';
import { Button } from './button.js';
import { Segment } from './segment.js';

export class DataForm extends React.Component {
	/**
	 * The properties schema:
	 * 1. title - title of the form
	 * 2. nodes (*) - an array of nodes (or other arrays) describing the structure of the form
	 * 3. validator - a function that validates the form
	 * 4. record - an object representing the initial state of the form
	 * 5. className - a BEM modifier to apply against the form's class
	 * 6. onSubmit - a callback that that handles attempts to submit the form
	 * 7. onCancel - a callback that handles attempts to cancel this action
	 * 
	 * If the nodes property is an array, then it's rendered in the array's order.
	 * 
	 * A node's schema:
	 * 1. name (*) - the key in the record object
	 * 2. type (*) - the type of this node
	 * 3. label - the human-readable name of this node, validator?, className?
	 */
	constructor(props) {
		super(props);
		this.state = this._setup(props);

		this._onFieldChange = this._onFieldChange.bind(this);
		this._onSelectChange = this._onSelectChange.bind(this);
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

		const selectNodes = props.fields
			.filterRecursively(field => field.type === 'select');

		const updateOptions = (nodeName, newOptions) => {
			var selectOptions = new Object(this.state.selectOptions);
			selectOptions[nodeName] = newOptions;
			this.setState({selectOptions: selectOptions});
		};

		selectNodes
			.filter(node => node.options instanceof Promise)
			.map(node => node.options.then(opts => updateOptions(node.name, opts)))
			.pushTo(promises);

		if(promises.length > 0) {
			Promise.all(promises).then(()=>this.setState({loading: false}));
		}

		const selectOptions = selectNodes.buildLookup(field => field.name, field => field.options);

		return {
			loading: promises.length > 0,
			data: props.data,
			fields: props.fields,
			selectOptions: selectOptions
		};
	}

	_onFieldChange(evt) {
		const update = {[evt.target.name]: evt.target.value};
		this.setState({data: Object.assign(this.state.data, update)});
	}

	_onSelectChange(evt) {
		const update = {[evt.target.name]: parseInt(evt.target.value)};
		this.setState({data: Object.assign(this.state.data, update)});
	}

	_buildTextField(field) {
		const props = {
			key: "input",
			type: field.readOnly && field.type === 'password' ? 'password' : 'text',
			name: field.name,
			onChange: this._onFieldChange
		};

		if(this.state.loading) {
			// Disabling input component if the data is not yet ready
			props.value = "...";
			props.disabled = "";
		} else {
			// Populating with current value otherwise
			props.value = this.state.data[field.name];
			props.disabled =  field.readOnly || false;
		}

		const label = epc("div", {key: "label", className: "data-form__label"}, field.label);
		return epc("div", {key: field.name, className: "data-form__field"}, [label, ep("input", props)]);
	}

	_buildSelectField(field) {
		const props = { key: "input", name: field.name, onChange: this._onSelectChange };
		const options = [];

		if(this.state.loading) {
			options.push(epc("option", {key: "loading"}, "..."));
			
			props.value = "...";
			props.disabled = "";
		} else {
			options.push(this.state.selectOptions[field.name]
				.map(o => epc("option", {key: o.value, value: o.value}, o.label)));

			props.value = this.state.data[field.name];
			props.disabled =  field.readOnly || false;
		}

		const label = epc("div", {key: "label", className: "data-form__label"}, field.label);
		return epc("div", {key: field.name, className: "data-form__field"}, [label, epc("select", props, options)]);
	}

	_buildTextAreaField(field) {
		const props = { key: "input", name: field.name, onChange: this._onFieldChange, rows: 5 };

		if(this.state.loading) {
			props.value = "...";
			props.disabled = "";
		} else {
			props.value = this.state.data[field.name];
			props.disabled =  field.readOnly || false;
		}

		const label = epc("div", {key: "label", className: "data-form__label"}, field.label);
		return epc("div", {key: field.name, className: "data-form__field"}, [label, ep("textarea", props)]);
	}

	render() {
		const children = [];

		if(this.props.title !== undefined) {
			children.push(epc("h2",{key: "title", className: "title"},this.props.title));
		}

		const buildActions = (actions, key) => {
			const actionsBox = epc('div',
					{ key: 'actions-box', className: 'actions-box' },
					actions.map(a => ep(Button, {
						key: a.label,
						icon: a.icon,
						label: a.label,
						handler: () => {
							this.setState({data: a.handler(Object(this.state.data))});
						}
					}))
			);
			const label = ep('div', {key: 'label', className: 'data-form__label'});
			return epc('div', {key: key, className: 'data-form__field'}, [label, actionsBox]);
		};

		if(this.props.topActions !== undefined) {
			children.push(buildActions(this.props.topActions, 'top-actions'));
		}

		const buildNode = (node) => {
			// A segment of nodes
			if(node instanceof Array) {
				return epc(Segment, {key: node.map(n=>n.name).join('_')}, node.map(buildNode));
			}

			var result;
			if(node.type === "text" || node.type === 'password') {
				result = this._buildTextField(node);
			} else if(node.type === "select") {
				result = this._buildSelectField(node);
			} else if(node.type === "textarea") {
				result = this._buildTextAreaField(node);
			}

			return result;
		};

		children.push(epc(Segment, {key: 'fields'}, this.props.fields.map(buildNode)));

		const bottomActions = [];
	
		if(this.props.onSubmit !== undefined) {
			bottomActions.push({
				key: "!submit", 
				label: "Save", 
				icon: 'check-square',
				handler: this._onSubmit, 
				disabled: this.state.loading
			});
		}

		if(this.props.onCancel !== undefined) {
			bottomActions.push({
				key: "!cancel", 
				label: "Cancel", 
				icon: 'times-rectangle',
				handler: this._onCancel, 
				disabled: this.state.loading
			});
		}

		if(bottomActions.length > 0) {
			children.push(buildActions(bottomActions, 'bottom-actions'));
		}

		const classes = ['data-form'];
		if(this.props.className !== undefined) {
			classes.push('data-form--'+this.props.className);
		}

		return epc("div", {className: classes.join(' ')}, children);
	}
}
