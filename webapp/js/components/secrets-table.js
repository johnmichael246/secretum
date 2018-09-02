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

module.exports = SecretsTable;

/* global React */
const { ep, epc, ec } = require('../ui.js');
import DataTable from './data-table.js';
const SecretForm = require('./secret-form.js');

import type {
  DataTableProps,
  LoadingDataTableProps,
  LoadedDataTableProps
} from './data-table.js';
import type { SecretFormProps, Secret} from './secret-form.js';

function SecretToolbox({secret, onCopy, onEdit, onRemove}) {
  const onCopyClick = e => { e.stopPropagation(); onCopy(secret);};
  const onEditClick = e => { e.stopPropagation(); onEdit(secret);};
  const onRemoveClick = e => { e.stopPropagation(); onRemove(secret);};
  return (
    <div>
      <a key="copy" onClick={onCopyClick}><i className="fa fa-flash"/></a>
      <a key="edit" onClick={onEditClick}><i className="fa fa-edit"/></a>
      <a key="remove" onClick={onRemoveClick}><i className="fa fa-remove"/></a>
    </div>
  );
}

export type SecretsTableProps = {
  onEdit: (secret: Secret) => void,
  onCopy: (secret: Secret) => void,
  onRemove: (secret: Secret) => void,
  secrets: Array<Secret>,
  columns?: Array<string>,
  loading: boolean,
  detailed: Array<boolean>,
  onRowClick: (index: number) => void
};

function SecretsTable({
  onEdit,
  onCopy,
  onRemove,
  secrets=[],
  columns,
  loading=false,
  detailed=new Array(secrets.length).fill(false),
  onRowClick
}: SecretsTableProps, context: any) {
  const transform = secret => {
    const instrumented = Object.create(secret);
    instrumented.actions =  ep(SecretToolbox, {secret, onCopy, onEdit, onRemove});
    return instrumented;
  };

  const detailsFactory = (secret) => {
    const topActions = [
      {label: 'Edit', handler: () => onEdit(secret.__proto__), icon: 'edit'},
      {label: 'Copy', handler: () => onCopy(secret.__proto__), icon: 'flash'},
      {label: 'Remove', handler: () => onRemove(secret.__proto__), icon: 'remove'}
    ];
    return <SecretForm
      className="secret-details"
      secret={secret}
      groups={context.redux.getState().cached.groups}
      editable={false}
      topActions={topActions}
    />;
  };

  const data = secrets.map(transform);
  const tableColumns = {
    id: "ID", groupName: 'Group', resource: 'Resource', principal: 'Principal',
    note: 'Note', actions: 'Actions'
  };

  // If columns passed in props, show those only
  if(columns) {
    for(let columnName of Object.keys(tableColumns)) {
      if(!columns.includes(columnName)) {
        delete tableColumns[columnName];
      }
    }
  }

  if(loading) {
    return <DataTable className="secrets" loading={true} columns={tableColumns}/>;
  }

  return <DataTable className="secrets"
    loading={false}
    columns={tableColumns}
    data={data}
    detailable={true}
    detailed={detailed}
    detailsFactory={detailsFactory}
    onRowClick={onRowClick}/>
}

SecretsTable.contextTypes = {
  redux: React.PropTypes.object
};
