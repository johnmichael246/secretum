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

    Promise.all(work).then(() => {
      this.setState({loading: false});
    });

    this._doSync = this._doSync.bind(this);
  }

  render() {
    if(this.state.loading) {
      return epc("div", {}, 'Fetching metadata from the server...');
    } else if(this.state.syncing) {
      return epc("div", {}, 'Syncing the vault with the server...');
    } else {
      const status = this.state.status;
      const children = [
        epc('span', {key: 'status'}, `Synced with ${status.vault.name} (${status.vault.currentSnapshotId}) at ${status.when}`),
        epc('ui', {key: 'vaults'}, this.state.vaults.map(vault => epc('li',
          {key: vault.name, onClick: ()=>this._doSync(vault)}, `${vault.name} (${vault.currentSnapshotId})`)))
      ];
      return epc('div', {}, children);
    }
  }

  _doSync(vault) {
    this.setState({syncing: true});
    this.context.syncer.sync(vault).then(result => {
      this.setState({syncing: false, status: result});
    });
  }
}

SyncPage.contextTypes = {
  syncer: React.PropTypes.object
};
