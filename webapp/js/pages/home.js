// @flow
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
const {ep, epc} = require('../ui.js');
const SearchTool = require('../components/search-tool.js');
const SecretsTable = require('../components/secrets-table.js');
const ConfirmDialog = require('../dialogs/confirm.js');
const SecretEditorDialog = require('../dialogs/secret-editor.js');
const SecretForm = require('../components/secret-form.js');
const Button = require('../components/button.js');

import type { SecretsTableProps } from '../components/secrets-table.js';
import type { Secret, SecretFormProps } from '../components/secret-form.js';
import PropTypes from 'prop-types';

const actions = require('../actions.js');

type SecretsQuery = {
  keyword?: string,
  groupId?: number
};

class HomePage extends React.Component {
  constructor(props: any, context: any) {
    super(props);
    this.context = context;
    this.state = {loading: true, query: {}};
  }

  _onSearch = (query: SecretsQuery) => {
    this.context.redux.dispatch({type: actions.HOME_PAGE.QUERY, query});
    this.context.store.findSecrets(query).then(secrets => {
      this.context.redux.dispatch({type: actions.HOME_PAGE.INJECT, secrets});
    });
  }

  _onCopy = (secret: Secret) => {
    copyTextToClipboard(secret.password);
  }

  _onEdit = (secret: Secret) => {
    const props = {
      secret: secret,
      onSubmit: (secret) => {
        this.context.redux.dispatch({type: actions.HIDE_MODAL});
        this.context.store.saveSecret(secret).then(_ => this._onSearch(this.state.query));
      },
      onCancel: () => this.context.redux.dispatch({type: actions.HIDE_MODAL})
    };
    this.context.redux.dispatch({type: actions.SHOW_MODAL, component: SecretEditorDialog, props});
  }

  _onNew = () => {
    const props = {
      title: 'New Secret',
      onSubmit: _ => {
        const secret = this.context.redux.getState().modal.state.secret;
        this.context.redux.dispatch({type: actions.HIDE_MODAL});
        this.context.store.createSecret(secret).then(_ => this._onSearch(this.state.query));
      },
      onCancel: _ => this.context.redux.dispatch({type: actions.HIDE_MODAL})
    };
    this.context.redux.dispatch({type: actions.SHOW_MODAL, component: SecretEditorDialog, props});
  }

  _onRemove = (secret: Secret) => {
    const props = {
      content: [
        epc('div', {key: 'question'}, 'Are you sure you would like to remove this secret?'),
        ep(SecretForm, {
          key: 'secret',
          readOnly: true,
          secret: secret,
          groups: this.context.redux.getState().cached.groups,
          fields: ['id', 'groupName', 'resource', 'principal']
        })
      ],
      onYes: _ => {
        this.context.redux.dispatch({type: actions.HIDE_MODAL});
        this.context.store.removeSecret(secret.id).then(_ => this._onSearch(this.state.query));
      },
      onNo: () => this.context.redux.dispatch({type: actions.HIDE_MODAL})
    };

    this.context.redux.dispatch({type: actions.SHOW_MODAL, component: ConfirmDialog, props});
  }

  _onSecretClick = (index: number) => {
    this.context.redux.dispatch({type: actions.HOME_PAGE.DETAIL, index});
  }


  componentDidMount() {
    this._unsubscribe = this.context.redux.subscribe(_ => {
      const state = this.context.redux.getState();
      if (state.page === 'home' && 'home' in state) {
        this.setState(state.home);
      }
    });

    this._onSearch({});

    if(!document.body) throw 'React invariant violated!';

    document.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.altKey && event.key === 'q') {
        const select = document.querySelector('.search select');

        if(!select) {
          throw new Error('Unable to find the search input in the DOM!');
        }

        select.focus();
      } else if (event.altKey && event.key === 'w') {
        const input = document.querySelector('.search input');

        if(!input || !(input instanceof HTMLInputElement)) {
          throw new Error('Unable to find the search input in the DOM!');
        }

        input.focus();
        input.select();
      }
    });
  }

  render() {
    const secretsTableProps = {
      key: "table",
      loading: this.state.loading,
      secrets: this.state.secrets,
      detailed: this.state.detailed,
      onRowClick: this._onSecretClick,
      onEdit: this._onEdit,
      onCopy: this._onCopy,
      onRemove: this._onRemove
    };

    return epc("div", {className: "page page--home"}, [
      <SecretsTable {...secretsTableProps}/>,
      ep(Button, {
        key: '!new',
        className: 'new-secret',
        handler: this._onNew,
        label: 'New Secret',
        icon: 'plus-square'
      }),
      ep(SearchTool, {
        key: "search",
        onSubmit: this._onSearch,
        keyword: this.state.query.keyword,
        group: this.state.query.group,
        groups: this.context.redux.getState().cached.groups
      })
    ]);
  }

  componentWillUnmount() {
    if(this._unsubscribe) {
      this._unsubscribe();
    }
  }
};

module.exports = HomePage;

module.exports.contextTypes = {
  app: PropTypes.object,
  store: PropTypes.object,
  redux: PropTypes.object
};

function query(state, action) {
  return Object.assign({}, state, {loading: true, query: action.query});
}

type HomeInjectAction = {
  type: actions.HOME_PAGE.INJECT,
  secrets: Array<Secret>
};

type LoadingState = {
  loading: true,
  secrets?: Array<Secret>,
  detailed?: Array<boolean>,
  query: SecretsQuery
};

type LoadedState = {
  loading: false,
  secrets: Array<Secret>,
  detailed: Array<boolean>,
  query: SecretsQuery
};

function inject(state: LoadingState, action: HomeInjectAction): LoadedState {
  const newDetailed = new Array(action.secrets.length).fill(false);

  if (state.detailed && state.secrets) {
    const oldDetailed = state.detailed;
    const oldSecrets = state.secrets;

    for(let [index, secret] of action.secrets.entries()) {
      const oldIndex = oldSecrets.findIndex(s => s.id === secret.id);
      if (oldIndex !== -1) {
        newDetailed[index] = oldDetailed[oldIndex];
      }
    }
  }
  return {
    query: state.query,
    loading: false,
    secrets: action.secrets,
    detailed: newDetailed
  };
}

function detail(state: LoadedState, action) {
  let newDetailed = Array.from(state.detailed);
  newDetailed[action.index] = !newDetailed[action.index];
  return Object.assign({}, state, {detailed: newDetailed});
}

function reduce(state = {query: {}, loading: true}, action) {
  if (action.type === actions.HOME_PAGE.QUERY) {
    return query(state, action);
  } else if (action.type === actions.HOME_PAGE.INJECT) {
    if(!state.loading) {
      throw new Error('Can not inject into, because not loading!');
    }
    return inject(state, action);
  } else if (action.type === actions.HOME_PAGE.DETAIL) {
    if(state.loading) {
      throw new Error('Can not detail a record, while loading!');
    }

    return detail(state, action);
  } else {
    return state;
  }
};

module.exports.reducer = reduce;

function copyTextToClipboard(text) {
  var textArea = document.createElement("textarea");

  // Place in top-left corner of screen regardless of scroll position.
  textArea.style.fontSize = '12pt';
  textArea.style.position = 'absolute';
  textArea.style.top = '0';
  textArea.style.left = (window.pageYOffset || document.documentElement.scrollTop) + 'px';

  // Ensure it has a small width and height. Setting to 1px / 1em
  // doesn't work as this gives a negative w/h on some browsers.
  textArea.style.width = '2em';
  textArea.style.height = '2em';

  // Clean up any borders.
  textArea.style.border = '0';
  textArea.style.padding = '0';
  textArea.style.margin = '0';

  textArea.style.outline = 'none';
  textArea.style.boxShadow = 'none';

  // Avoid flash of white box if rendered for any reason.
  textArea.style.background = 'transparent';

  textArea.setAttribute('readonly', '');
  textArea.value = text;

  const body = document.body;
  if(!body) {
      throw new Error('The DOM is not loaded yet!');
  }

  body.appendChild(textArea);
  textArea.select();

  try {
    if (document.execCommand('copy') === 'unsuccessful') {
      throw new Error("Unable to copy to clipboard!");
    }
  } finally {
    body.removeChild(textArea);
  }
}
