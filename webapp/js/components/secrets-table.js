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
const DataTable = require('./data-table.js');
const SecretForm = require('./secret-form.js');

function SecretToolbox(props) {
  const handlers = props.actionHandlers;
  const secret = props.secret;
  const tools = [
    epc("a", {
      key: "copy",
      onClick: (e) => {
        e.stopPropagation();
        handlers.onCopy(secret)
      }}, ep("i", {className: "fa fa-flash"})),
    epc("a", {
      key: "edit",
      onClick: (e) => {
        e.stopPropagation();
        handlers.onEdit(secret)
      }}, ep("i", {className: "fa fa-edit"})),
    epc("a", {
      key: "remove",
      onClick: (e) => {
        e.stopPropagation();
        handlers.onRemove(secret)
      }}, ep("i", {className: "fa fa-remove"}))]
  return ec("div", tools);
}

function SecretsTable(props, context) {
  const transform = secret => {
    const instrumented = Object.create(secret);
    instrumented.actions =  ep(SecretToolbox, {secret, actionHandlers: props.actionHandlers});
    return instrumented;
  };

  const detailsFactory = (secret) => {
    const topActions = [
      {label: 'Edit', handler: () => props.actionHandlers.onEdit(secret.__proto__), icon: 'edit'},
      {label: 'Copy', handler: () => props.actionHandlers.onCopy(secret.__proto__), icon: 'flash'},
      {label: 'Remove', handler: () => props.actionHandlers.onRemove(secret.__proto__), icon: 'remove'}
    ];
    return ep(SecretForm, {
      className: "secret-details",
      secret: secret,
      groups: context.redux.getState().cached.groups,
      readOnly: true,
      topActions: topActions
    });
  };

  let data = undefined;
  if(!props.loading) {
    data = props.secrets.map(transform);
  }

  const columns = {
    id: "ID", groupName: 'Group', resource: 'Resource', principal: 'Principal',
    note: 'Note', actions: 'Actions'
  };

  // If columns passed in props, show those only
  if(props.columns !== undefined) {
    Object.keys(columns).forEach(columnName => {
      if(!props.columns.includes(columnName)) {
        delete columns[columnName];
      }
    });
  }

  return ep(DataTable, {
    className: "secrets",
    columns: columns,
    data: data,
    loading: props.loading,
    detailed: props.detailed,
    onRowClick: props.onRowClick,
    detailsFactory: props.details === undefined || props.details ? detailsFactory : undefined
  });
}

SecretsTable.contextTypes = {
  redux: React.PropTypes.object
};
