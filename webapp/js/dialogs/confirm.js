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

const { epc } = require('../ui.js');
const ActionsBox = require('../components/actions-box.js');

function ConfirmDialog(props) {
  const title = epc('div', {key: 'title', className: 'dialog__title'}, 'Confirm');
  const content = epc('div', {key: 'content', className: 'dialog__content'}, [
    epc('div', {key: 'user-content'}, props.content),
    epc(ActionsBox, {key: 'actions-box'}, [{handler: props.onYes, label: 'Yes'}, {handler: props.onNo, label: 'No'}]),
  ]);
  return epc('div', {className: 'dialog'}, [title, content]);
}

module.exports = ConfirmDialog;
