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

/* global React */
const SecretForm = require('../components/secret-form.js');
const { ep, epc } = require('../ui.js');
const actions = require('../actions.js');

import type { SecretFormProps, Secret } from '../components/secret-form.js';

const initial = {
  booted: false
};

export type SecretEditorProps = {
  onSubmit: (secret: Secret) => void,
  onCancel: () => void,
  secret?: Secret
};

const newSecretTemplate = {
  groupId: -1,
  resource: '',
  principal: '',
  password: '',
  note: '',
};

class SecretEditorDialog extends React.Component {
  props: SecretEditorProps;

  constructor(props: SecretEditorProps, context: any) {
    super(props);
    this.redux = context.redux;
    this.store = context.store;
    this.state = initial;
  }

  async componentWillMount() {
    this.unsubscribe = this.context.redux.subscribe(_ => {
      let modal = this.context.redux.getState().modal;
      if(modal) {
        this.setState(modal.state);
      }
    });

    const secret = this.props.secret || {...newSecretTemplate};
    const groups = await this.store.findGroups();
    this.redux.dispatch({type: actions.SECRET_EDITOR.BOOT, secret, groups});
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _onEdit = (secret: Secret) => {
    this.context.redux.dispatch({type: actions.SECRET_EDITOR.EDIT, secret});
  }

  render() {

    let content;
    if(this.state.booted) {
      const props: SecretFormProps = {
        key: "form",
        generator: true,
        secret: this.state.secret,
        groups: this.state.groups,
        onSubmit: _ => this.props.onSubmit(this.context.redux.getState().modal.state.secret),
        onCancel: this.props.onCancel,
        onEdit: this._onEdit
      };
      content = (
          <div key="content" className="dialog__content">
            <SecretForm {...props}/>
          </div>
      );
    } else {
      content = <div key="content" className="dialog__content">Loading</div>;
    }

    return (
      <div className="dialog">
        <div key="title" className="dialog__title">Secret Editor</div>
        {content}
      </div>
    );
  }
}

SecretEditorDialog.reducer = function(state = {booted: false}, action) {
  if(action.type === actions.SECRET_EDITOR.BOOT) {
    return Object.assign({}, state, {booted: true, secret: action.secret, groups: action.groups});
  } else if(action.type === actions.SECRET_EDITOR.EDIT) {
    return Object.assign({}, state, {secret: action.secret});
  } else {
    return state;
  }
};

SecretEditorDialog.contextTypes = {
  redux: React.PropTypes.object,
  store: React.PropTypes.object
};

module.exports = SecretEditorDialog;
