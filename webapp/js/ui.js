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

const React = require('react');

module.exports = { e, ep, ec, epc };

function epc(elem, props, children) {
	if(props === undefined) throw new Error("Missing props argument");
	if(children === undefined) throw new Error("Missing children argument");
	return React.createElement(elem, props, children);
}

function ep(elem, props) {
	if(props === undefined) throw new Error("Missing props argument");
	return React.createElement(elem, props, null);
}

function ec(elem, children) {
	if(children === undefined) throw new Error("Missing children argument");
	return React.createElement(elem, null, children);
}

function e(elem) {
	return React.createElement(elem, null, null);
}
