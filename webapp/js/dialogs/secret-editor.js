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

const initial = {
  booted: false
};

class SecretEditorDialog extends React.Component {
  constructor(props, context) {
    super(props);
    this.context = context;
    this.state = initial;
    
    this.unsubscribe = this.context.redux.subscribe(_ => {
      let modal = this.context.redux.getState().modal;
      if(modal) {
        this.setState(modal.state);
      }
    });
    
    this._onEdited = this._onEdited.bind(this);
  }
  
  componentDidMount() {
    let secret = this.props.secret;
    if(!secret) {
      secret = {
        id: '',
        resource: '',
        groupId: 0,
        principal: '',
        password: '',
        note: ''
      };
    }
    
    this.context.redux.dispatch({type: actions.SECRET_EDITOR.BOOT, secret});
  }
  
  componentWillUnmount() {
    this.unsubscribe();
  }
  
  _onEdited(secret) {
    this.context.redux.dispatch({type: actions.SECRET_EDITOR.EDIT, secret});
  }

  render() {
    const title = epc('div', {key: 'title', className: 'dialog__title'}, this.props.title||'Secret Editor');
    
    let content;
    if(this.state.booted) {
      let form = ep(SecretForm, {
        key: 'form',
        generator: true,
        secret: this.state.secret,
        groups: this.context.redux.getState().cached.groups,
        onSubmit: this.props.onSubmit,
        onCancel: this.props.onCancel,
        onEdited: this._onEdited
      });
      content = epc('div', {key: 'content', className: 'dialog__content'}, form);
    } else {
      content = epc('div', {key: 'content', className: 'dialog__content'}, 'Loading');
    }
    
    return epc('div', {className: 'dialog'}, [title, content]);
  }
}

SecretEditorDialog.reducer = function(state = {booted: false}, action) {
  if(action.type === actions.SECRET_EDITOR.BOOT) {
    return Object.assign({}, state, {booted: true, secret: action.secret});
  } else if(action.type === actions.SECRET_EDITOR.EDIT) {
    return Object.assign({}, state, {secret: action.secret});
  } else {
    return state;
  }
};

SecretEditorDialog.contextTypes = {
  redux: React.PropTypes.object
};

module.exports = SecretEditorDialog;
