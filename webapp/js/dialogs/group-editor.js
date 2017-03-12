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

const React = require('react');
const GroupForm = require('../components/group-form.js');
const { ep, epc } = require('../ui.js');

module.exports = class GroupEditorDialog  extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const children = [
      epc('div', {key: 'title', className: 'dialog__title'}, this.props.title||'Group Editor'),
      epc('div', {key: 'content', className: 'dialog__content'},
        ep(GroupForm, {
          key: 'form',
          groupId: this.props.groupId,
          onSubmit: this.props.onSubmit,
          onCancel: this.props.onCancel
        })
      )
    ];
    return epc('div', {className: 'dialog'}, children);
  }
};

module.exports.contextTypes = {
  app: React.PropTypes.object,
  store: React.PropTypes.object
};
