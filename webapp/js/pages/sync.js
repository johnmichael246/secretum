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
const { ep, epc } = require('../ui.js');
const Button = require('../components/button.js');
const DataTable = require('../components/data-table.js');
const ConfirmDialog = require('../dialogs/confirm.js');

module.exports = class SyncPage extends React.Component {
  constructor(props, context) {
    super(props);
    this.context = context;

    this.state = this._load();

    this._sync = this._sync.bind(this);
    this._switch = this._switch.bind(this);
    this._onVaultSelect = this._onVaultSelect.bind(this);
    this._onClear = this._onClear.bind(this);
  }

  _load() {
    const work = [];
    work.push(this.context.syncer.getSyncStatus().then(status => {
      const update = {status: status};
      if(status.vault !== null) {
        update.vaultId = status.vault.id;
      }
      this.setState(update);
    }));
    work.push(this.context.syncer.getUnsyncedChanges().then(changes => {
      this.setState({changes: changes});
    }));

    Promise.all(work).then(() => {
      this.setState({loading: false});
    });

    this.context.syncer.findRemoteVaults().then(vaults => {
      this.setState({vaults: vaults, selectedVaultId: (vaults[0]||{}).id});
    });

    return {loading: true};
  }

  render() {
    if(this.state.loading) {
      return epc("div", {className: 'page sync'}, 'Fetching metadata from the server...');
    } else if(this.state.syncing) {
      return epc("div", {className: 'page sync'}, 'Syncing the vault with the server...');
    } else {
      const children = [];

      if(this.state.status !== null) {
        let status = this.state.status;
        let vault = status.vault;
        let snapshot = status.snapshot||{};

        if(vault != null) {
          let datum = {
            id: 0,
            vaultId: (vault.id)||'',
            vaultName: (vault.name)||'',
            lastSync: status.when||'',
            lastDevice: snapshot.device||''
          };

          children.push(ep(DataTable, {
            key: 'status',
            className: 'sync-status',
            title: 'Remote Vault',
            columns: {
              'vaultId': 'ID',
              'vaultName': 'Name',
              'lastSync': 'Last Sync',
              'lastDevice': 'Last Device'
            },
            data: [datum]
          }));

        }
      }

      const hasLocalChanges = (this.state.changes||[]).length > 0;
      if(hasLocalChanges || ((this.state.status||{}).vault||null) != null) {
        const changes = this.state.changes
          .filter(c => c.table === 'secrets')
          .map(c => ({
            action: c.operator,
            id: c.record.id,
            resource: c.record.resource,
            principal: c.record.principal
          }));

        children.push(
          ep(DataTable, {
            key: 'changes',
            className: 'sync-changes',
            title: 'Unsynced Changes',
            columns: {action: 'Action', id: 'ID', resource: 'Resource', principal: 'Principal'},
            data: changes
          })
        );

        if(hasLocalChanges) {
          children.push(
            ep(Button, {key: '!sync', label: 'Sync Now!', icon: 'server', handler: this._sync})
          );
        }
      }

      if(this.state.status.vault == null && this.state.vaults !== undefined) {
        children.push(
          epc('select', {key: 'vaults', value: this.state.selectedVaultId, onChange: this._onVaultSelect},
            this.state.vaults.map(vault => epc('option', {key: vault.id, value: vault.id}, `${vault.name}`)))
        );
        children.push(
          ep(Button, {key: '!switch', handler: this._switch, label: 'Connect', icon: 'plug'})
        );
      }

      if(this.state.status.vault === null && this.state.changes.length > 0
        || this.state.status.vault !== null && this.state.changes.length === 0) {
        children.push(
          ep(Button, {key: '!clear', label: 'Clear', icon: 'warning', handler: this._onClear})
        );
      }

      return epc('div', {className: 'page page--sync'}, children);
    }
  }

  _onClear() {
    this.context.app.showModal(ConfirmDialog, {
      content: 'Do you really want to clear the local store?',
      onYes: () => {
        this.context.store.clear().then(() => {
          this.setState(this._load())
        });
        this.context.app.hideModal();
      },
      onNo: () => {
        this.context.app.hideModal();
      }
    });
  }

  _onVaultSelect(event) {
    return this.setState({selectedVaultId: parseInt(event.target.value)});
  }

  _sync() {
    this.setState({syncing: true});
    this.context.syncer.sync()
      .then(status => this.setState({syncing: false, changes: [], status: status}));
  }

  _switch() {
    this.setState({syncing: true});
    this.context.syncer.setup(this.state.selectedVaultId)
      .then(status => Promise.all([
        Promise.resolve(status),
        this.context.syncer.getUnsyncedChanges()
      ])).then(([status, changes]) => this.setState({syncing: false, status: status, changes: changes}));
  }
};

module.exports.contextTypes = {
  syncer: React.PropTypes.object,
  store: React.PropTypes.object,
  app: React.PropTypes.object
};
