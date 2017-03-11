import { ep, epc, ec } from '../ui.js';
import { DataTable } from './data-table.js';
import { GroupForm } from './group-form.js';

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

export function GroupsTable(props, context) {
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

  var data;
  if(props.groups instanceof Promise) {
    data = props.groups.then(g => transform(g));
  } else {
    data = transform(props.groups);
  }
  
  const columns = {id: 'ID', name: 'Group', actions: 'Actions'};
  
  return ep(DataTable, {
    className: "secrets",
    columns: columns,
    data: props.groups,
    detailsFactory: props.details === undefined || props.details ? detailsFactory : undefined
  });
}
