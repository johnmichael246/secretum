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

/* global settings React ReactDOM */

const Redux = require('redux');

const HomePage = require('./pages/home.js');
const GroupsPage = require('./pages/groups.js');
const SyncPage = require('./pages/sync.js');

const { e, ep, epc } = require('./ui.js');
const { load } = require('./idb/loader.js');
const Button = require('./components/button.js');
const actions = require('./actions.js');

// Instrumenting global objects with custom improvements...
// This will be called only once, when this script is loaded.
require('../js/utils/array.js')();
require('../js/utils/object.js')();
require('../js/utils/set.js')();

if(!Object.entries) {
  require('object.entries').shim();
}

const initialState = {
  booted: false
};

function boot(opts) {
  return {
    type: actions.BOOT,
    opts
  };
}

function navigate(page) {
  return {
    type: actions.NAVIGATE,
    page: page
  };
}

function rootReducer(state = initialState, action) {
  console.log(action);

  let newState = {...state};

  if(action.type === actions.NAVIGATE) {
    newState.page = action.page;
  } else if(action.type === actions.BOOT) {
    newState = Object.assign(newState, action.opts, {booted: true, page: 'home'});
  } else if(action.type === actions.SHOW_MODAL) {
    newState.modal = {component: action.component, props: action.props};
  } else if(action.type === actions.HIDE_MODAL) {
    delete newState.modal;
  }

  if(newState.modal && newState.modal.component.reducer) {
    let newModalState = newState.modal.component.reducer(newState.modal.state, action);
    newState.modal = Object.assign({}, newState.modal, {state: newModalState});
  }

  if(state.page === 'home') {
    newState.home = {...state.home, ...HomePage.reducer(state.home, action)};
  } else if(state.page === 'groups') {
    newState.groups = {...state.groups, ...GroupsPage.reducer(state.groups, action)};
  }

  return newState;
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.redux = Redux.createStore(rootReducer.bind(this));

    const extract = state => ({booted: state.booted, page: state.page, modal: state.modal});

    this.state = extract(this.redux.getState());
    this.redux.subscribe(_ => this.setState(extract(this.redux.getState())));

    load({
      endpoint: settings.service_url,
      idb_name: settings.idb_name,
      indexedDBFactory: window.indexedDB
    }).then(facades => {
      this.store = facades.store;
      this.syncer = facades.syncManager;
      this.store.findGroups().then(groups => {
        this.redux.dispatch(boot({cached: {groups}}));
      });
    });
  }

  showModal(component, props) {
    this.redux.dispatch({type: actions.SHOW_MODAL, component, props});
  }

  hideModal() {
    this.redux.dispatch({type: actions.HIDE_MODAL});
  }

  getChildContext() {
    const context = { redux: this.redux };
    if (this.state.booted) {
      context.app = this;
      context.store = this.store;
      context.syncer = this.syncer;
    }
    return context;
  }

  render() {
    if (!this.state.booted) {
      return epc('div', { className: 'loading' }, 'Application is loading...');
    }

    const pageComponents = {
      home: HomePage,
      groups: GroupsPage,
      sync: SyncPage
    };

    const currentPage = this.state.page;

    const tabs = [
      ep(Button, {
        key: 'home', label: 'Secrets', icon: 'home', toggled: currentPage === 'home',
        handler: () => this.redux.dispatch(navigate('home'))
      }),
      ep(Button, {
        key: 'groups', label: 'Groups', icon: 'home', toggled: currentPage === 'groups',
        handler: () => this.redux.dispatch(navigate('groups'))
      }),
      ep(Button, {
        key: 'sync', label: 'Sync', icon: 'refresh', toggled: currentPage === 'sync',
        handler: () => this.redux.dispatch(navigate('sync'))
      })
    ];

    const children = [
      epc("div", {key: "header", className: "header"}, [
        epc("div", {key: "title", className: "title"}, "Secretum"),
        epc("div", {key: "version", className: "version"}, settings.build_version)
      ]),
      ep(pageComponents[currentPage], {key: currentPage}),
      epc("div", {key: "footer", className: "footer"}, tabs)
    ];

    if (this.state.modal !== undefined) {
      children.push(epc('div', {key: 'modal', className: 'modal'}, ep(this.state.modal.component, this.state.modal.props)));
    }

    return epc("div", {className: "app"}, children);
  }
}

App.childContextTypes = {
  app: React.PropTypes.object,
  store: React.PropTypes.object,
  syncer: React.PropTypes.object,
  redux: React.PropTypes.object
};

document.addEventListener("DOMContentLoaded", function () {
  //overscroll(document.querySelector('#root'));
  // document.body.addEventListener('touchmove', function(evt) {
  // 	if(evt._isScroller !== undefined && !evt._isScroller) {
  // 		evt.preventDefault();
  // 		alert(evt.target.className);
  // 	}
  // });
  ReactDOM.render(e(App), document.getElementById("root"));
});

// var overscroll = function(el) {
//   el.addEventListener('touchstart', function() {
//     const top = el.scrollTop;
// 		const totalScroll = el.scrollHeight;
// 		const currentScroll = top + el.offsetHeight;
//
//     if(top === 0) {
//       el.scrollTop = 1;
//     } else if(currentScroll === totalScroll) {
//       el.scrollTop = top - 1;
//     }
//   });
//   el.addEventListener('touchmove', function(evt) {
//     if(el.offsetHeight < el.scrollHeight) {
//       evt._isScroller = true
// 		} else {
// 			evt._isScroller = false;
// 		}
//   });
// }
