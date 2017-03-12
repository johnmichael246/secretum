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
const { epc } = require('../ui.js');
const { camelToDash } = require('../utils.js');

module.exports = class DataTable extends React.Component {
	/*
	 * The properties schema:
	 * 1. data (*) - an array (or a promise) of records to show in this table.
	 * 2. columns (*) - an object mapping keys in data records to column labels.
	 * 3. detailsFactory - a factory of React components from a data record.
	 * 
	 * (*) - required value
	 * @param {Object} props
	 */
	constructor(props) {
		super(props);
		this.state = this._setup(props);

		this._onRowClick = this._onRowClick.bind(this);
	}

	/**
	 * Handles resolving promises in props.data.
	 * 
	 * @returns a state update object.
	 */
	_setup(props) {
		const handleData = data => ({
			loading: false,
			data: data,
			detailed: Array(data).fill(false)
		});
		
		if(props.data instanceof Promise) {
			props.data.then(handleData).then(this.setState.bind(this));
			return { loading: true };
		} else {
			return handleData(props.data);
		}
	}

	_buildHeaderRow(columns) {
		return epc("div", {key: "header", className: "table__header"},
		Object.keys(columns).map(name => epc("div", {key: name, className: `table__cell table__cell--${camelToDash(name)}`}, columns[name])));
	}

	componentWillReceiveProps(props) {
		this.setState(this._setup(props));
	}

	_onRowClick(idx) {
		if(this.props.detailsFactory !== undefined) {
			var detailed = Array.from(this.state.detailed);
			detailed[idx] = !detailed[idx];
			this.setState({detailed: detailed});
		}
	}

	render() {
		var children = [];

		if('title' in this.props) {
			children.push(epc('div', {key: 'title', className: 'table__title'}, this.props.title));
		}

		children.push(this._buildHeaderRow(this.props.columns));

		const buildCell = (col,val) => epc("div", {key: col, className: `table__cell table__cell--${camelToDash(col)}`}, val);
		const buildRow = (row,idx) => {
			const props = {
				key: idx,
				className: `table__row ${this.props.detailsFactory === undefined ? '' : 'table__row--expandable'}`,
				onClick: () => this._onRowClick(idx)
			};
			// Additional class name for currently selected row
			if(this.state.detailed[idx]) {
				props.className += ' table__row--expanded';
			}

			return epc("div", props, Object.keys(this.props.columns).map((col) => buildCell(col,row[col])));
		};

		const body = [];
		if(!this.state.loading) {
			const rows = this.state.data.map(buildRow);
			if(this.props.detailsFactory !== undefined) {
				var inserted = 0;
				this.state.detailed.forEach((flag,idx) => {
					if(!flag) return;
					// Inserts the details component after the currently selected rows
					const details = this.props.detailsFactory(this.state.data[idx]);
					rows.splice(idx+inserted+1, 0, epc("div", {key: `details-${idx}`, className: 'table__details'}, details));
					inserted = inserted+1;
				});
			}
			body.push.apply(body, rows);
		} else {
			body.push(epc("div", {key: "loading"}, "Loading..."));
		}

		children.push(epc('div', {key: 'body', className: 'table__body'},body));

		return epc("div", {className: `table table--${camelToDash(this.props.className)}`}, children);
	}
};
