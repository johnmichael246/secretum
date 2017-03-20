// @flow
// Copyright 2017 Alex Lementa, Danylo Vashchilenko
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

import DataTable from './data-table.js';
import GroupForm from './group-form.js';

import type {
  DataTableProps,
  LoadingDataTableProps,
  LoadedDataTableProps
} from './data-table.js';
import type { GroupFormProps, Group } from './group-form.js';

export type GroupsTableProps = {
  onEdit: (group: Group) => void,
  onRemove: (group: Group) => void,
  groups: Array<Group>,
  loading: boolean
};

function GroupToolbox(props) {
  const handlers = props.actionHandlers;
  const group = props.group;

  const onEdit = (e) => {
    e.stopPropagation();
    handlers.onEdit(group);
  };

  const onRemove = (e) => {
    e.stopPropagation();
    handlers.onRemove(group);
  };

  return (
    <div>
      <a key="edit" onClick={onEdit}>
        <i className="fa fa-edit"/>
      </a>
      <a key="remove" onClick={onRemove}>
        <i className="fa fa-remove"/>
      </a>
    </div>
  );
}

function GroupsTable({
  loading=false,
  groups=[],
  onEdit,
  onRemove
}: GroupsTableProps) {

  const transform = group => {
    const instrumented = Object.create(group);
    instrumented.actions = (
      <GroupToolbox group={group} actionHandlers={{onEdit, onRemove}}/>
    );
    return instrumented;
  };

  const data = loading ? [] : groups.map(transform);
  const tableColumns = {id: 'ID', name: 'Group', actions: 'Actions'};

  if(loading) {
    return <DataTable loading={true} className="groups" columns={tableColumns}/>;
  }

  return <DataTable className="groups"
    loading={false}
    columns={tableColumns}
    data={data}
    detailable={false}/>
}
