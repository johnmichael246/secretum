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

export class ConfirmDialog extends React.Component {
  constructor(props){
    super(props);
  }

  render() {
    const title = epc('div', {key: 'title', className: 'dialog-title'}, 'Confirm');
    const content = epc('div', {key: 'content', className: 'dialog-content'}, [
      epc('div', {key: 'user-content'}, this.props.content),
      ep(Button, {key: 'yes', handler: this.props.onYes, label: 'Yes'}),
      ep(Button, {key: 'no', handler: this.props.onNo, label: 'No'}),
    ]);
    return epc('div', {className: 'dialog'}, [title, content]);
  }
}
