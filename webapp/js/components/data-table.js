// @flow
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

import { camelToDash } from '../utils.js';

export type LoadedDataTableProps = {
	loading: false,
	title?: string,
	className: string,
	columns: Object,
	onRowClick?: (index: number) => void,
	data: Array<Object>,
} & ({detailable: false}|DetailableDataTableProps);

export type DetailableDataTableProps = {
	detailable: true,
	detailed: Array<boolean>,
	detailsFactory: (record: Object) => React.Component
};

export type LoadingDataTableProps = {
	loading: true,
	className: string,
	title?: string,
	columns: Object
};

export type DataTableProps =
	|LoadingDataTableProps
	|LoadedDataTableProps;

export default function DataTable(props: DataTableProps) {
	const { className, title, columns } = props;

	const buildColumn = ([name, label]) => {
		const className = `table__cell table__cell--${camelToDash(name)}`;
		return (
			<div key={name} className={className}>{label}</div>
		);
	};

	return (
		<div className={`table table--${camelToDash(className)}`}>
			{title && <div key="title" className="table__title">{title}</div>}
			<div key="header" className="table__header">
				{Object.entries(columns).map(buildColumn)}
			</div>
			<div key="body" className="table__body">
				{props.loading && <div key="loading">Loading</div>}
				{!props.loading && renderLoadedDataTable(props)}
			</div>
		</div>
	);
}

function renderLoadedDataTable(props: LoadedDataTableProps) {

	const buildCell = (col,val) => {
		const className = `table__cell table__cell--${camelToDash(col)}`;
		return <div key={col} className={className}>{val}</div>;
	};

	const buildRow = (row,idx) => {
		const rowProps = {
			key: idx,
			className: `table__row ${props.detailsFactory ? 'table__row--expandable' : ''}`,
			onClick: props.detailable ? _ => props.onRowClick(idx) : undefined
		};
		// Additional class name for currently selected row
		if(props.detailable && props.detailed[idx]) {
			rowProps.className += ' table__row--expanded';
		}

		return (
			<div {...rowProps}>
				{Object.keys(props.columns).map((col) => buildCell(col,row[col]))}
			</div>
		);
	};

	const rows = props.data.map(buildRow);
	if(props.detailable) {
		let inserted = 0;
		props.detailed.forEach((flag,idx) => {
			if(!flag) return;
			// Inserts the details component after the currently selected rows
			const details = props.detailsFactory(props.data[idx]);
			rows.splice(idx+inserted+1, 0, (
				<div key={`details-${idx}`} className="table__details">{details}</div>
			));
			inserted = inserted+1;
		});
	}

	return rows;
}
