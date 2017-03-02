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

import { ep } from './ui.js';

export class Router extends React.Component {
  constructor(props) {
    super(props);

    this.state = this._afterRoutePersistance(props.page, props.query)({persisted: {}});
    this._onPageQuery = this._onPageQuery.bind(this);
  }
  
  _afterRoutePersistance(page, query) {
    return (state) => {
      const persisted = Object.create(state.persisted);
      persisted[page] = query;
      return {persisted: persisted};
    }
  }

  _onPageQuery(query) {
    this.setState(this._afterRoutePersistance(this.props.page, query));
  }

  render() {
    const component = this.props.components[this.props.page];
    const query = this.state.persisted[this.props.page];
    return ep(component, {query: query, onPageQuery: this._onPageQuery});
  }
}
