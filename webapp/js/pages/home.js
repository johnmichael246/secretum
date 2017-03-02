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

/*global React*/

import { ep, epc} from '../ui.js';
import { SearchTool } from '../components/search-tool.js';
import { SecretsTable } from '../components/secrets-table.js';
import { ConfirmDialog } from '../dialogs/confirm.js';
import { SecretEditorDialog } from '../dialogs/secret-editor.js';
import { SecretForm } from '../components/secret-form.js';
import { Button } from '../components/button.js';


export class HomePage extends React.Component {
  constructor(props, context) {
    super(props);
    this.context = context;

    this.state = {secrets: this.context.store.findSecrets(props.query)};

    this._onSearch = this._onSearch.bind(this);
    this._onCopy = this._onCopy.bind(this);
    this._onEdit = this._onEdit.bind(this);
    this._onRemove = this._onRemove.bind(this);
    this._onNew = this._onNew.bind(this);
  }

  _onSearch(query) {
    this.props.onPageQuery(query);
  }

  _onCopy(secret) {
    copyTextToClipboard(secret.password);
  }

  _onEdit(secret) {
    const props = {
      secretId: secret.id,
      onSubmit: (secret) => {
        this.context.app.hideModal();
        this.context.store.saveSecret(secret).then(() => {
          this.setState({secrets: this.context.store.findSecrets(this.state.query)});
        });
      },
      onCancel: () => this.context.app.hideModal()
    };
    this.context.app.showModal(SecretEditorDialog, props);
  }

  _onNew() {
    const props = {
      secretId: null,
      title: 'New Secret',
      onSubmit: (secret) => {
        this.context.app.hideModal();
        this.context.store.createSecret(secret).then(() => {
          this.setState({secrets: this.context.store.findSecrets(this.state.query)});
        });
      },
      onCancel: () => this.context.app.hideModal()
    };
    this.context.app.showModal(SecretEditorDialog, props);
  }

  _onRemove(secret) {
    this.context.app.showModal(ConfirmDialog, {
      content: [
        epc('div', {key: 'question'}, 'Are you sure you would like to remove this secret?'),
        ep(SecretForm, {
          key: 'secret',
          readOnly: true,
          secretId: secret.id,
          fields: ['id', 'groupName', 'resource', 'principal']
        })
      ],
      onYes: ()=> {
        this.context.store.removeSecret(secret.id)
          .then(() => this.setState({
            secrets: this.context.store.findSecrets(this.state.query)
          }));
        this.context.app.hideModal();
      },
      onNo: () => this.context.app.hideModal()
    });
  }

  componentDidMount() {
    document.body.addEventListener('keydown', event => {
      if(event.altKey && event.key === 'q') {
        document.querySelector('.search select').focus();
      } else if(event.altKey && event.key === 'w') {
        const input = document.querySelector('.search input');
        input.focus();
        input.select();
      }
    });
  }

  componentWillReceiveProps(nextProps) {
    this.setState({secrets: this.context.store.findSecrets(nextProps.query)});
  }

  render() {
    const handlers = {onCopy: this._onCopy, onEdit: this._onEdit, onRemove: this._onRemove};
    return epc("div", {className: "page page--home"}, [
      ep(SecretsTable, {
        key: "table", 
        secrets: this.state.secrets, 
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
        keyword: (this.props.query||{}).keyword, 
        group: (this.props.query||{}).group, 
        groups: this.context.store.findGroups()
      })
    ]);
  }
}

HomePage.contextTypes = {
  app: React.PropTypes.object,
  store: React.PropTypes.object
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
		if(document.execCommand('copy') === 'unsuccessful') {
			throw new Error("Unable to copy to clipboard!");
		}
	} finally {
		document.body.removeChild(textArea);
	}
}
