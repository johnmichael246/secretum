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

import { epc } from '../ui.js';

export class DataTable extends React.Component {
	constructor(props) {
		super(props);
		this.state = this._setup(props);

		this._onRowClick = this._onRowClick.bind(this);
	}

	_setup(props) {
		if(props.data instanceof Promise) {
			props.data.then(d => this.setState({
				loading: false,
				data: d,
				detailed: Array(d.length).fill(false)
		}));
			return { loading: true };
		} else {
			return {
				loading: false,
				data: props.data,
				detailed: Array(props.data.length).fill(false)
			};
		}
	}

	_buildHeaderRow(columns) {
		return epc("div", {key: "header", className: "header"},
		Object.keys(columns).map(name => epc("div", {key: name, className: `cell ${name}`}, columns[name])));
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
		children.push(this._buildHeaderRow(this.props.columns));

		const buildCell = (col,val) => epc("div", {key: col, className: `cell ${col}`}, val);
		const buildRow = (row,idx) => {
			const props = {
				key: idx,
				className: `row ${this.props.detailsFactory === undefined ? '' : 'selectable'}`,
				onClick: () => this._onRowClick(idx)
			};
			// Additional class name for currently selected row
			if(this.state.detailed[idx]) {
				props.className += ' selected';
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
					rows.splice(idx+inserted+1, 0, epc("div", {key: `details-${idx}`, className: 'details-wrapper'}, details));
					inserted = inserted+1;
				});
			}
			body.push.apply(body, rows);
		} else {
			body.push(epc("div", {key: "loading"}, "Loading..."));
		}

		children.push(epc('div', {key: 'body', className: 'body'},body));

		return epc("div", {className: `table ${this.props.className}`}, children);
	}
}
