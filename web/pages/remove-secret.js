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

import { ec, ep, epc } from '../ui.js';
import { Button } from '../components/button.js';
import { SecretForm } from '../components/secret-form.js';

export class RemoveSecretPage extends React.Component {
  constructor(props){
    super(props);

    this._onYesClicked = this._onYesClicked.bind(this);
    this._onNoClicked = this._onNoClicked.bind(this);
  }

  _onYesClicked() {
    this.context.store.removeSecret(this.props.route.secret.id).then(()=>{
      this.context.app.navigate({page: 'home'});
    })
  }

  _onNoClicked() {
    this.context.app.navigate({page: 'home'});
  }

  render() {
    const children = [
      epc('div',{key: 'question'}, 'Are you sure you would like to remove this secret?'),
      ep(Button, {key: 'yes', handler: this._onYesClicked, label: 'Yes'}),
      ep(Button, {key: 'no', handler: this._onNoClicked, label: 'No'}),
      ep(SecretForm, {key: 'secret', readOnly: true, secretId: this.props.route.secret.id})
    ];
    return ec('div', children);
  }
}

RemoveSecretPage.contextTypes = {
  store: React.PropTypes.object,
  app: React.PropTypes.object
};
