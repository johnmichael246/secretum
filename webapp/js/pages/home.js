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

const actions = require('../actions.js');

module.exports = class HomePage extends React.Component {
  constructor(props, context) {
    super(props);
    this.context = context;
    
    this.state = {loading: true, query: {}};
    this.context.redux.subscribe(_ => {
      const state = this.context.redux.getState();
      if ('home' in state) {
        this.setState(state.home);
      }
    });
    
    this._onSearch = this._onSearch.bind(this);
    this._onCopy = this._onCopy.bind(this);
    this._onEdit = this._onEdit.bind(this);
    this._onRemove = this._onRemove.bind(this);
    this._onNew = this._onNew.bind(this);
    this._onSecretClick = this._onSecretClick.bind(this);
  }
  
  _onSearch(query) {
    this.context.redux.dispatch({type: actions.HOME_QUERY, query});
    this.context.store.findSecrets(query).then(secrets => {
      this.context.redux.dispatch({type: actions.HOME_INJECT, secrets});
    });
  }
  
  
  _onCopy(secret) {
    copyTextToClipboard(secret.password);
  }
  
  _onEdit(secret) {
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
  
  _onNew() {
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
  
  _onRemove(secret) {
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
  
  _onSecretClick(index) {
    this.context.redux.dispatch({type: actions.HOME_DETAIL, index});
  }
  
  
  componentDidMount() {
    this._onSearch({});
    
    document.body.addEventListener('keydown', event => {
      if (event.altKey && event.key === 'q') {
        document.querySelector('.search select').focus();
      } else if (event.altKey && event.key === 'w') {
        const input = document.querySelector('.search input');
        input.focus();
        input.select();
      }
    });
  }
  
  render() {
    const handlers = {onCopy: this._onCopy, onEdit: this._onEdit, onRemove: this._onRemove};
    return epc("div", {className: "page page--home"}, [
      ep(SecretsTable, {
        key: "table",
        loading: this.state.loading,
        secrets: this.state.secrets,
        detailed: this.state.detailed,
        onRowClick: this._onSecretClick,
        actionHandlers: handlers
      }),
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
        groups: this.context.store.findGroups()
      })
    ]);
  }
};

module.exports.contextTypes = {
  app: React.PropTypes.object,
  store: React.PropTypes.object,
  redux: React.PropTypes.object
};

module.exports.reducer = function (state = {query: {}, loading: true}, action) {
  if (action.type === actions.HOME_QUERY) {
    return Object.assign({}, state, {loading: true, query: action.query});
  } else if (action.type === actions.HOME_INJECT) {
    const newDetailed = new Array(action.secrets.length).fill(false);
    if (state.detailed !== undefined) {
      action.secrets.forEach((secret, index) => {
        const oldIndex = state.secrets.findIndex(s => s.id === secret.id);
        if (oldIndex !== -1) {
          newDetailed[index] = state.detailed[oldIndex];
        }
      });
    }
    return Object.assign({}, state, {loading: false, secrets: action.secrets, detailed: newDetailed});
  } else if (action.type === actions.HOME_DETAIL) {
    let newDetailed = Array.from(state.detailed);
    newDetailed[action.index] = !newDetailed[action.index];
    return Object.assign({}, state, {detailed: newDetailed});
  } else {
    return state;
  }
};

function copyTextToClipboard(text) {
  var textArea = document.createElement("textarea");
  
  // Place in top-left corner of screen regardless of scroll position.
  textArea.style.position = 'fixed';
  textArea.style.top = 0;
  textArea.style.left = 0;
  
  // Ensure it has a small width and height. Setting to 1px / 1em
  // doesn't work as this gives a negative w/h on some browsers.
  textArea.style.width = '2em';
  textArea.style.height = '2em';
  
  // We don't need padding, reducing the size if it does flash render.
  textArea.style.padding = 0;
  
  // Clean up any borders.
  textArea.style.border = 'none';
  textArea.style.outline = 'none';
  textArea.style.boxShadow = 'none';
  
  // Avoid flash of white box if rendered for any reason.
  textArea.style.background = 'transparent';
  
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  
  try {
    if (document.execCommand('copy') === 'unsuccessful') {
      throw new Error("Unable to copy to clipboard!");
    }
  } finally {
    document.body.removeChild(textArea);
  }
}
