// @flow
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

/* global React */
const GroupsTable = require('../components/groups-table.js');
const GroupEditorDialog = require('../dialogs/group-editor.js');
const Button = require('../components/button.js');
const ConfirmDialog = require('../dialogs/confirm.js');

import GroupForm from '../components/group-form.js';

const actions = require('../actions.js');
import type GroupEditorProps from '../dialogs/group-editor.js';
import type { Group } from '../components/group-form.js';

class GroupsPage extends React.Component {
  constructor(props: any, context: any) {
    super(props);
    this.context = context;
    this.state = { loading: true };
  }

  componentDidMount() {
    this._unsubcribe = this.context.redux.subscribe(_ => {
      const state = this.context.redux.getState();
      if (state.page === 'groups' && 'groups' in state) {
        this.setState(state.groups);
      }
    });

    this.refresh();
  }

  refresh = () => {
    this.context.redux.dispatch({type: actions.GROUPS_PAGE.QUERY});
    this.context.store.findGroups().then(groups => {
      this.context.redux.dispatch({type: actions.GROUPS_PAGE.INJECT, groups});
    });
  }

  _onEdit = (group: Group) => {
    const props = {
      group: group,
      onSubmit: (group: Group) => {
        this.context.redux.dispatch({type: actions.HIDE_MODAL});
        this.context.redux.dispatch({type: actions.GROUPS_PAGE.QUERY});
        this.context.store.saveGroup(group).then(this.refresh);
      },
      onCancel: () => this.context.redux.dispatch({type: actions.HIDE_MODAL})
    };
    this.context.redux.dispatch({
      type: actions.SHOW_MODAL,
      component: GroupEditorDialog,
      props
    });
  }

 _onNew = () => {
   const props = {
     title: 'New Group',
     onSubmit: (group: Group) => {
       this.context.redux.dispatch({type: actions.HIDE_MODAL});
       this.context.store.createGroup(group).then(this.refresh);
     },
     onCancel: () => this.context.redux.dispatch({type: actions.HIDE_MODAL})
   };
   this.context.redux.dispatch({
     type: actions.SHOW_MODAL,
     component: GroupEditorDialog,
     props
   });
 }

  _onRemove(group: Group) {
    const groupFormProps = {
      key: "group",
      editable: false,
      group
    };

    this.context.app.showModal(ConfirmDialog, {
      content: [
        <div key="question">Are you sure you would like to remove this group?</div>,
        <GroupForm {...groupFormProps}/>
      ],
      onYes: () => {
        this.context.store.removeGroup(group.id).then(this.refresh);
        this.context.redux.dispatch({type: actions.HIDE_MODAL});
      },
      onNo: () => this.context.redux.dispatch({type: actions.HIDE_MODAL})
    });
  }

  render() {
    const groupsTableProps = {
      loading: this.state.loading,
      groups: this.state.groups,
      onEdit: this._onEdit,
      onRemove: this._onRemove,
      detailed: this.state.detailed
    };
    const buttonProps = {
      className: 'new-group',
      handler: this._onNew,
      label: "New Group",
      icon: 'plus-square'
    };
    return (
      <div className="page page--groups">
        <GroupsTable key="table" {...groupsTableProps}/>
        <Button key="!new" {...buttonProps}/>
      </div>
    )
  }

  componentWillUnmount() {
    if(this._unsubscribe) {
      this._unsubscribe();
    }
  }

  static reducer(state = {loading: true}, action) {
    if (action.type === actions.GROUPS_PAGE.QUERY) {
      return query(state, action);
    } else if (action.type === actions.GROUPS_PAGE.INJECT) {
      if(!state.loading) {
        throw new Error('Can not inject into, because not loading!');
      }
      return inject(state, action);
    } else {
      return state;
    }
  };
}

GroupsPage.contextTypes = {
  redux: React.PropTypes.object,
  store: React.PropTypes.object
};

module.exports = GroupsPage;

function query(state, action) {
  return {...state, loading: true};
}

type GroupsInjectAction = {
  type: actions.GROUPS_PAGE.INJECT,
  groups: Array<Group>
};

type LoadingState = {
  loading: true
};

type LoadedState = {
  loading: false,
  groups: Array<Group>,
};

function inject(state: LoadingState, action: GroupsInjectAction): LoadedState {
  return {loading: false, groups: action.groups };
}
