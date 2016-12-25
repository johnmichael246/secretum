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

import { epc } from './ui.js';

export class Router extends React.Component {
  constructor(props) {
    super();

    const rules = props.rules.map(this._prepareRule);

    this.state = {
      prefix: props.hasOwnProperty("prefix") ? props.prefix : "/",
      rules: new Map(rules),
      current: null
    };

    console.log(`New router (${props.id}) with ${this.state.rules.size} rules at ${this.state.prefix}.`);
  }

  _prepareRule(rule) {
    const pattern = rule[0];
    const component = rule[1];

    var cmps = pattern.split("/");

    // Removing emptiness before heading slash
    cmps.shift();

    cmps = cmps.map(c => {
      // If a pattern variable found
      if(/^{.*}$/.test(c)) {
        // Replace with a regex capture group
        return "([^\\/]+)";
      } else {
        return c;
      }
    });

    const regex = "^/" + cmps.join("\\/") + "$";
    return [new RegExp(regex),component];
  }

  componentWillMount() {
    this._go();
  }

  componentDidMount() {
    // Routing upon hash changes
    window.addEventListener("hashchange", () => this._go());
  }

  _go() {
    // Take the window's hash and strip #
    var path = window.location.hash || "#/";
    path = path.substring(1);

    if(this.props.prefix !== undefined && !path.startsWith(this._prefix)) {
      // This router should not be in the view, so no need to navigate
      return;
    }

    // Remove the prefix, if any
    if(this.props.prefix !== undefined && this.props.prefix !== "/") {
      path = path.substring(this._prefix.length);
    }

    var found = false;
    this.state.rules.forEach((component,regex) => {
      const trial = regex.exec(path);
      if(trial !== null) {
        if(found) {
          throw new Error("Multiple patterns matched same path: " + path);
        }

        // Remove matching string, capture groups left
        trial.shift();

        const child = component instanceof Function ? component.apply(null, trial) : component;

        this.setState({current: child});
        found = true;
      }
    });

    if(!found) {
      throw `Error: Router ${this.props.id} matched prefix, but the rule is missing: ${path}`;
    }
  }

  render() {
    return epc("div", {className: `router ${this.props.className}`}, this.state.current);
  }
}
