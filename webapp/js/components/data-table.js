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

const { epc } = require('../ui.js');
const { camelToDash } = require('../utils.js');

module.exports = function(props) {
	
	const buildHeaderRow = columns => {
		return epc("div", {key: "header", className: "table__header"},
		Object.keys(columns).map(name => epc("div", {key: name, className: `table__cell table__cell--${camelToDash(name)}`}, columns[name])));
	};
	const children = [];

	if('title' in props) {
		children.push(epc('div', {key: 'title', className: 'table__title'}, props.title));
	}

	children.push(buildHeaderRow(props.columns));

	const buildCell = (col,val) => epc("div", {key: col, className: `table__cell table__cell--${camelToDash(col)}`}, val);
	const buildRow = (row,idx) => {
		const rowProps = {
			key: idx,
			className: `table__row ${props.detailsFactory === undefined ? '' : 'table__row--expandable'}`,
			onClick: _ => props.onRowClick(idx)
		};
		// Additional class name for currently selected row
		if(props.detailed[idx]) {
			rowProps.className += ' table__row--expanded';
		}

		return epc("div", rowProps, Object.keys(props.columns).map((col) => buildCell(col,row[col])));
	};

	const body = [];
	if(!props.loading) {
		const rows = props.data.map(buildRow);
		if(props.detailsFactory !== undefined) {
			let inserted = 0;
			props.detailed.forEach((flag,idx) => {
				if(!flag) return;
				// Inserts the details component after the currently selected rows
				const details = props.detailsFactory(props.data[idx]);
				rows.splice(idx+inserted+1, 0, epc("div", {key: `details-${idx}`, className: 'table__details'}, details));
				inserted = inserted+1;
			});
		}
		body.push.apply(body, rows);
	} else {
		body.push(epc("div", {key: "loading"}, "Loading..."));
	}

	children.push(epc('div', {key: 'body', className: 'table__body'},body));

	return epc("div", {className: `table table--${camelToDash(props.className)}`}, children);
};
