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
const { ep, epc } = require('../ui.js');

module.exports = class SearchTool extends React.Component {
	constructor(props) {
		super(props);
		this._setup(props);

		this._onChange = this._onChange.bind(this);
	}

	_setup(props) {
		this.state = {keyword: props.keyword, groups: [], group: props.group, loaded: false};
		Promise.resolve(props.groups).then(groups => {
			this.setState({groups: groups, loaded: true});
		});
	}

	_onChange(event) {
		var newValue = event.target.value;
		if(event.target.name === 'group') newValue = parseInt(newValue)||undefined;
		const update = {[event.target.name]: newValue};
		this.setState(update);

		const query = Object.assign({group: this.state.group, keyword: this.state.keyword}, update);
		this.props.onSubmit(query);
	}

	render() {
		const renderGroup = g => epc("option", {key: g.id, value: g.id}, g.name);
		const groups = this.state.groups.map(renderGroup);

		// An option to disable group filtering, also a placeholder for a hint
		groups.unshift(epc("option", {key: 'undefined'}, 'All Groups'));

		return epc("div", {className: "search"}, [
			epc("select", {
				key: "group", 
				name: "group",
				value: this.state.group,
				onChange: this._onChange, 
				disabled: groups.length === 0
			}, groups),
			ep("input", {
				key: "keyword", 
				name: "keyword", 
				type: "text",
				value: this.state.keyword||'',
				onChange: this._onChange, 
				placeholder: "Enter a keyword"
			})
		]);
	}
}

module.exports.propTypes = {
	keyword: React.PropTypes.string,
	group: React.PropTypes.number,
	groups: React.PropTypes.oneOfType([
		React.PropTypes.arrayOf(React.PropTypes.object),
		React.PropTypes.instanceOf(Promise)
	]).isRequired,
	onSubmit: React.PropTypes.func.isRequired,
};
