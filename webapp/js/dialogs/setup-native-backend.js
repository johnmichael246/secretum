// @flow
// Copyright 2017 Danylo Vashchilenko
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

import actions from '../actions.js';

import NativeConfigForm from '../components/configs/native-config-form.js';
import type NativeConfig from '../components/configs/native-config-form.js';
import type NativeConfigFormProps from '../components/configs/native-config-form.js';


import PropTypes from 'prop-types';

const newNativeConfigTemplate = {
  url: 'https://',
  vaultName: '',
  username: '',
  password: '',
  device: ''
};

export default class SetupNativeBackend extends React.Component {
  constructor(props: any, context: any) {
    super(props, context);
    this.redux = context.redux;
    this.props = props;
    this.state = {};
  }

  componentWillMount() {
    this.unsubscribe = this.context.redux.subscribe(_ => {
      let modal = this.context.redux.getState().modal;
      if(modal) {
        this.setState(modal.state);
      }
    });

    let config = this.props.config || {...newNativeConfigTemplate};
    this.context.redux.dispatch({type: actions.SETUP_NATIVE_BACKEND.BOOT, config});
  }

  onEdit = (config: NativeConfig) => {
    this.redux.dispatch({type: actions.SETUP_NATIVE_BACKEND.EDIT, config});
  }

  onSubmit = () => {
    this.props.onSubmit(this.state.config);
  }

  render() {
    return (
      <div className="dialog">
        <div key="title" className="dialog__title">Setup Backend</div>
        <NativeConfigForm
          editable={true}
          nativeConfig={this.state.config}
          onEdit={this.onEdit}
          onSubmit={this.onSubmit}
          onCancel={this.props.onCancel}/>
      </div>
    );
  }

  componentWillUnmount() {
    if(this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

SetupNativeBackend.reducer = function(state = {booted: false}, action) {
  if(action.type === actions.SETUP_NATIVE_BACKEND.BOOT) {
    return Object.assign({}, state, {booted: true, config: action.config});
  } else if(action.type === actions.SETUP_NATIVE_BACKEND.EDIT) {
    return Object.assign({}, state, {secret: action.config});
  } else {
    return state;
  }
};


SetupNativeBackend.contextTypes = {
  redux: PropTypes.object
};
