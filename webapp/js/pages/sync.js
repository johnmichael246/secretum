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
const Button = require('../components/button.js');
import DataTable from '../components/data-table.js';

const ConfirmDialog = require('../dialogs/confirm.js');

import NativeConfigForm from '../components/configs/native-config-form.js';
import SetupNativeBackend from '../dialogs/setup-native-backend.js';

import PropTypes from 'prop-types';

const moment = require('moment');

const actions = require('../actions.js');

function summarizeChange(change) {
  return {...change, id: change.record.id};
}

export default class SyncPage extends React.Component {

  constructor(props: any, context: any) {
    super(props);
    this.context = context;
    this.redux = context.redux;
    this.syncManager = context.syncManager;

    this.state = {loading: true};

    this.onSync = this.onSync.bind(this);
    this.onClear = this.onClear.bind(this);
  }

  async componentWillMount() {
    this.unsubscribe = this.redux.subscribe(_ => {
      const state = this.redux.getState();
      if (state.page === 'sync') {
        this.setState(state.sync);
      }
    });

    const status = await this.syncManager.getSyncStatus();
    const changes = await this.syncManager.getUnsyncedChanges();
    this.redux.dispatch({type: actions.SYNC_PAGE.INJECT, status, changes});
  }

  componentWillUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  async onLogout() {

  }

  onLogOut = async () => {
    window.signOut();
  }

 onSetup = () => {
    const props: Object = {
      onSubmit: (config) => {
        const backend = {type: 'native', config};
        this.syncManager.setup(backend);
        this.redux.dispatch({
          type: actions.SYNC_PAGE.INJECT,
          status: Object.assign(this.state.status, {backend}),
          changes: this.state.changes
        });
        this.redux.dispatch({type: actions.HIDE_MODAL});
      },
      onCancel: () => {
        this.redux.dispatch({type: actions.HIDE_MODAL});
      }
    };

    if (this.state.status.backend) {
      props.config = this.state.status.backend.config;
    }

    this.redux.dispatch({type: actions.SHOW_MODAL, component: SetupNativeBackend, props});
  }

  async onSync() {
    try {
      await this.syncManager.sync();
      const status = await this.syncManager.getSyncStatus();
      const changes = await this.syncManager.getUnsyncedChanges();

      this.redux.dispatch({type: actions.SYNC_PAGE.INJECT, status, changes});
    } catch (ex) {
      // We want to communicate that the action failed
      alert(ex.message);

      // Let's have the exception handler also be aware
      throw ex;
    }
  }

  async onClear() {
    await this.syncManager.clear();
    const status = await this.syncManager.getSyncStatus();
    const changes = await this.syncManager.getUnsyncedChanges();
    this.redux.dispatch({type: actions.SYNC_PAGE.INJECT, status, changes});
  }

  render() {
    if (this.state.loading) {
      return <div className="page page--sync">Loading...</div>;
    }

    function procCommit(commit) {
      return {
        ...commit,
        date: formatDate(new Date(commit.posted)),
        time: formatTime(new Date(commit.posted))
      };
    }

    const commits = Array.from(this.state.status.commits.values())
      .reverse()
      .slice(0, 10)
      .map(procCommit);

    return (
      <div className="page page--sync">
        <h2>Backend:</h2>
        <Button handler={this.onSetup} label='Change' icon='edit'/>
        <Button handler={this.onLogOut} label='Log Out' icon='edit'/>
        {
          this.state.status.backend &&
          <NativeConfigForm editable={false}
                            nativeConfig={this.state.status.backend.config}/>
        }
        <Button handler={this.onClear} label='Erase all' icon='warning'/>
        <DataTable
          loading={false}
          detailable={false}
          key="changes"
          className="sync-changes"
          title="Unsynced Changes"
          columns={{operator: 'Operator', table: 'Table', id: 'ID'}}
          data={this.state.changes.map(summarizeChange)}/>
        <DataTable
          loading={false}
          detailable={false}
          key="commits"
          className="sync-commits"
          title="Recent Commits"
          columns={{date: 'Date', time: 'Time', device: 'Device', id: 'ID'}}
          data={commits}/>
        {this.state.status.backend && <Button handler={this.onSync} label='Sync' icon='refresh'/>}
      </div>
    );

  }
}

SyncPage.reducer = function (state = {loading: true}, action) {
  if (action.type === actions.SYNC_PAGE.INJECT) {
    return {...state, loading: false, status: action.status, changes: action.changes};
  } else {
    return state;
  }
}

SyncPage.contextTypes = {
  syncManager: PropTypes.object,
  redux: PropTypes.object
};

function formatDate(date) {
  return moment(date).format('MMM/DD/YYYY');
}

function formatTime(time) {
  return moment(time).format('HH:mm ZZ');
}
