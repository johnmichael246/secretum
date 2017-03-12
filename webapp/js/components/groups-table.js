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

module.exports = GroupsTable;

const { ep, epc, ec } = require('../ui.js');
const DataTable = require('./data-table.js');
const GroupForm = require('./group-form.js');

function GroupToolbox(props) {
  const handlers = props.actionHandlers;
  const group = props.group;
  const tools = [
    epc("a", {
      key: "edit",
      onClick: (e) => {
        e.stopPropagation();
        handlers.onEdit(group);
      }}, ep("i", {className: "fa fa-edit"})),
    epc("a", {
      key: "remove",
      onClick: (e) => {
        e.stopPropagation();
        handlers.onRemove(group);
      }}, ep("i", {className: "fa fa-remove"}))];
  return ec("div", tools);
}

function merge(a1, a2) {
  return a1.map((a,i) => Object.assign(a,a2[i]));
}

function GroupsTable(props) {
  const transform = groups => {
    const actions = groups.map(g => ({
      actions: ep(GroupToolbox, {group: g, actionHandlers: props.actionHandlers})
    }));
    return merge(groups, actions);
  };

  const detailsFactory = (group) => {
    const topActions = [
      {label: 'Edit', handler: () => props.actionHandlers.onEdit(group), icon: 'edit'},
      {label: 'Remove', handler: () => props.actionHandlers.onRemove(group), icon: 'remove'}
      
    ];
    return ep(GroupForm, {
      className: "secret-details",
      groupId: group.id,
      readOnly: true,
      topActions: topActions
    });
  };

  const data = props.groups instanceof Promise ?  props.groups.then(transform) : transform(props.groups);
  const columns = {id: 'ID', name: 'Group', actions: 'Actions'};
  
  return ep(DataTable, {
    className: "groups",
    columns: columns,
    data: data,
    detailsFactory: props.details === undefined || props.details ? detailsFactory : undefined
  });
}
