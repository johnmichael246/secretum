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

import { epc } from '../ui.js';

export class SyncPage extends React.Component {
  constructor(props, context) {
    super(props);
    this.context = context;

    this.state = {loading: true};

    const work = [];
    work.push(this.context.syncer.findRemoteVaults().then(vaults => {
      this.setState({vaults: vaults});
    }));
    work.push(this.context.syncer.getSyncStatus().then(status => {
      this.setState({status: status});
    }));
    work.push(this.context.syncer.getUnsyncedChanges().then(changes => {
      this.setState({changes: changes});
    }));

    Promise.all(work).then(() => {
      this.setState({loading: false});
    });

    this._sync = this._sync.bind(this);
    this._switch = this._switch.bind(this);
  }

  render() {
    if(this.state.loading) {
      return epc("div", {}, 'Fetching metadata from the server...');
    } else if(this.state.syncing) {
      return epc("div", {}, 'Syncing the vault with the server...');
    } else {
      const status = this.state.status;
      const children = [
        epc('span', {key: 'status', onClick: this._sync}, status === null || status.when === undefined ? 'Not synced with anything.' : `Synced with ${status.vault.name} (${status.snapshot.id}) at ${status.when}`),
        epc('ui', {key: 'vaults'}, this.state.vaults.map(vault => epc('li',
          {key: vault.name, onClick: ()=>this._switch(vault)}, `${vault.name}`))),
        epc('div', {key: 'changes'}, `Changes: ${JSON.stringify(this.state.changes)||'none'}.`)
      ];
      return epc('div', {}, children);
    }
  }

  _sync() {
    this.setState({syncing: true});
    this.context.syncer.sync()
      .then(status => ({status: status, changes: this.context.syncer.getUnsyncedChanges()}))
      .then(update => this.setState(Object.assign({syncing: false}, update)));
  }

  _switch(vault) {
    this.setState({syncing: true});
    this.context.syncer.setup(vault.id)
      .then(status => ({status: status, changes: this.context.syncer.getUnsyncedChanges()}))
      .then(update => this.setState(Object.assign({syncing: false}, update)));
  }
}

SyncPage.contextTypes = {
  syncer: React.PropTypes.object
};
