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

import { SecretForm } from '../components/secret-form.js';
import { ep } from '../ui.js';

export class EditSecretPage extends React.Component {
  constructor(props) {
    super(props);
    this._onSave = this._onSave.bind(this);
    this._onCancel = this._onCancel.bind(this);
  }

  _onSave(secret) {
    this.props.model.saveSecret(secret);
    window.location.hash = "#/";
  }

  _onCancel() {
    window.location.hash = "#/";
  }

  render() {
    return ep(SecretForm, {
      model: this.props.model,
      secret: this.props.secret,
      onSubmit: this._onSave,
      onCancel: this._onCancel,
      title: 'Editing Secret'
    });
  }
}
