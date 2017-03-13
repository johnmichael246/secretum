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
const { ep, epc } = require('../ui.js');
const GroupsTable = require('../components/groups-table.js');
const GroupEditorDialog = require('../dialogs/group-editor.js');
const Button = require('../components/button.js');
const ConfirmDialog = require('../dialogs/confirm.js');
const GroupForm = require('../components/group-form.js');

module.exports = class GroupPage extends React.Component {
  constructor(props, context) {
    super(props);
    this.context = context;
    this.state = { groups: this.context.store.findGroups() };
    this._onNew = this._onNew.bind(this);
    this._onEdit = this._onEdit.bind(this);
    this._onRemove = this._onRemove.bind(this);
  }

  _onEdit(group) {
    const props = {
      groupId: group.id,
      onSubmit: (group) => {
        this.context.app.hideModal();
        this.context.store.saveGroup(group).then(() => {
          this.setState({groups: this.context.store.findGroups(this.state.query)});
        });
      },
      onCancel: () => this.context.app.hideModal()
    };
    this.context.app.showModal(GroupEditorDialog, props);
  }
  
 _onNew() {
    const props = {
      groupId: null,
      title: 'New Group',
      onSubmit: (group) => {
        this.context.app.hideModal();
        this.context.store.createGroup(group).then(() => {
          this.setState({groups: this.context.store.findGroups(this.state.query)});
        });
      },
      onCancel: () => this.context.app.hideModal()
    };
    this.context.app.showModal(GroupEditorDialog, props);
 }

  _onRemove(group) {
    this.context.app.showModal(ConfirmDialog, {
      content: [
        epc('div', {key: 'question'}, 'Are you sure you would like to remove this group?'),
        ep(GroupForm, {
          key: 'group',
          readOnly: true,
          groupId: group.id,
          fields: ['id', 'name']
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
