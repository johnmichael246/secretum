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

/* global React */
import GroupForm from '../components/group-form.js';
import actions from '../actions.js';

import type { Group, EditGroupFormProps } from '../components/group-form.js';
import PropTypes from 'prop-types';

type GroupEditorProps = {
  group?: Group,
  onSubmit: (group: Group) => void,
  onCancel: () => void
};

class GroupEditorDialog  extends React.Component {
  props: GroupEditorProps;

  constructor(props: GroupEditorProps, context: any) {
    super(props, context);
    this.state = {};
  }

  componentWillMount() {
    this.setState({booted: false});
  }

  componentDidMount() {
    this.unsubscribe = this.context.redux.subscribe(() => {
      let modal = this.context.redux.getState().modal;
      if(modal && modal.component === GroupEditorDialog) {
        this.setState(modal.state);
      }
    });

    this.context.redux.dispatch({
      type: actions.GROUP_EDITOR.BOOT,
      group: this.props.group||{...GroupForm.newGroupTemplate}
    });
  }

  _onEdit = (group: Group): void => {
    this.context.redux.dispatch({
      type: actions.GROUP_EDITOR.EDIT,
      group
    });
  }

  render() {
    return (
        <div className="dialog">
          <div key="title" className="dialog__title">Group Editor</div>
            <div key="content" className="dialog__content">
                {this.state.booted && this._renderGroupForm()}
                {!this.state.booted && "Loading..."}
          </div>
        </div>
    );
  }

  _renderGroupForm() {
    return <GroupForm
      key="form"
      group={this.state.group}
      onEdit={this._onEdit}
      onSubmit={() => this.props.onSubmit(this.context.redux.getState().modal.state.group)}
      onCancel={this.props.onCancel}
      editable={true}
    />
  }

  componentWillUnmount() {
    if(this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

GroupEditorDialog.reducer = function(state = {booted: false}, action) {
  if(action.type === actions.GROUP_EDITOR.BOOT) {
    return {...state, booted: true, group: action.group};
  } else if(action.type === actions.GROUP_EDITOR.EDIT) {
    return {...state, group: action.group};
  } else {
    return state;
  }
};

module.exports = GroupEditorDialog;
module.exports.contextTypes = {
  app: PropTypes.object,
  redux: PropTypes.object
};
