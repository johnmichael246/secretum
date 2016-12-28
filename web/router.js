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

import { ep, epc } from './ui.js';

export class Router extends React.Component {
  constructor(props) {
    super(props);

    this.state = this._setup(props);

    console.log(`New router (${props.id}) with ${props.rules.size} rules.`);
  }

  _setup(props) {
    var current;
    if(props.route === undefined) {
      current = undefined;
    } else {
      current = props.rules.find(rule => rule.page === props.route.page).component;
    }
    return {current: current};
  }

  componentWillReceiveProps(props) {
    this.setState(this._setup(props));
  }

  render() {
    return epc("div", {className: `router ${this.props.className}`},
      ep(this.state.current, {route: this.props.route}));
  }
}
