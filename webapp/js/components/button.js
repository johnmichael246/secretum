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

module.exports = Button;

const { ep, epc } = require('../ui.js');

function Button(props) {
	const icon = ep('div', {key: 'icon', className: `button__icon fa fa-${props.icon}`});
	const label = epc('div', {key: 'label', className: 'button__label'}, props.label);

	if(props.handler === undefined) {
		throw new Error('Attempted to create a button without a callback!');
	}

	return epc('div', {
		key: props.label,
		className: 'button' + (props.toggled ? ' button--toggled ' : ' ') 
			+ (props.className === undefined ? '' : 'button--'+props.className),
		onClick: props.toggled ? undefined : props.handler},
		[icon, label]);
}
