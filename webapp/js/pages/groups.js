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
const GroupForm = require('../components/group-form.js');

import type GroupEditorProps from '../dialogs/group-editor.js';

class GroupPage extends React.Component {
  constructor(props, context) {
    super(props);
    this.context = context;
    this.state = { loading: true };

    this.context.redux.subscribe(_ => {
      const state = this.context.redux.getState();
      if ('groups' in state) {
        this.setState(state.groups);
      }
    });
  }

  _onEdit = (group: Group) => {
    const props = {
      group: group,
      onSubmit: (group: Group) => {
        this.context.redux.dispatch({type: actions.HIDE_MODAL});
        this.context.store.saveGroup(group).then(() => {
          this.setState({groups: this.context.store.findGroups()});
        });
      },
      onCancel: () => this.context.redux.dispatch({type: actions.HIDE_MODAL})
    };
    this.context.app.showModal(GroupEditorDialog, props);
  }

 _onNew = () => {
   const props = {
     title: 'New Group',
     group: group,
     onSubmit: (group: Group) => {
       this.context.redux.dispatch({type: actions.HIDE_MODAL});
       this.context.store.createGroup(group).then(() => {
         this.setState({groups: this.context.store.findGroups()});
       });
     },
     onCancel: () => this.context.redux.dispatch({type: actions.HIDE_MODAL})
   };
   this.context.app.showModal(GroupEditorDialog, props);
 }

  _onRemove(group) {
    this.context.app.showModal(ConfirmDialog, {
      content: [
        <div key="question">Are you sure you would like to remove this group?</div>,
        <GroupForm key="group" editable={false} {group} fieldNames={['id', 'name']}/>
        })
      ],
      onYes: ()=> {
        this.context.store.removeGroup(group.id)
          .then(() => this.setState({
            groups: this.context.store.findGroups()
          }));
        this.context.app.hideModal();
      },
      onNo: () => this.context.app.hideModal()
    });
  }

  render() {
    const handlers = {onEdit: this._onEdit, onRemove: this._onRemove};
    return epc("div", {className: "page page--groups"}, [
      ep(GroupsTable, {key: "table", groups: this.state.groups, actionHandlers: handlers}),
      ep(Button, {key: "!new", className: 'new-group', handler: this._onNew, label: "New Group", icon: 'plus-square'})
    ]);
  }
};

module.exports.contextTypes = {
  app: React.PropTypes.object,
  store: React.PropTypes.object
};
