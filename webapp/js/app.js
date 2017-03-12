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

/* global settings */

const React = require('react');
const ReactDOM = require('react-dom');
const HomePage = require('./pages/home.js');
const GroupsPage = require('./pages/groups.js');
const SyncPage = require('./pages/sync.js');

const {e, ep, epc} = require('./ui.js');
const Router = require('./router.js');

const {load} = require('./idb/loader.js');
const Button = require('./components/button.js');

// Instrumenting global objects with custom improvements...
// This will be called only once, when this script is loaded.
require('../js/utils/array.js')();
require('../js/utils/object.js')();
require('../js/utils/set.js')();

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {loading: true, page: 'home'};
    
    load({
      endpoint: settings.service_url,
      idb_name: settings.idb_name,
      indexedDBFactory: window.indexedDB
    }).then(facades => {
      this.store = facades.store;
      this.syncer = facades.syncManager;
      this.setState({loading: false});
    });
  }
  
  showModal(dialog, config) {
    this.setState({modal: ep(dialog, config)})
  }
  
  hideModal() {
    this.setState({modal: undefined});
  }
  
  getChildContext() {
    if (this.state.loading) {
      return {};
    } else {
      // Must not be used before the loading is finished
      return {app: this, store: this.store, syncer: this.syncer};
    }
  }
  
  render() {
    if (this.state.loading) {
      return epc('div', {className: 'loading'}, 'Application is loading...');
    }
    
    var pageComponents = {
      home: HomePage,
      groups: GroupsPage,
      sync: SyncPage
    };
    
    const tabs = [
      ep(Button, {
        key: 'home', label: 'Secrets', icon: 'home', toggled: this.state.page === 'home',
        handler: () => this.setState({page: 'home'})
      }),
      ep(Button, {
        key: 'groups', label: 'Groups', icon: 'home', toggled: this.state.page === 'groups',
        handler: () => this.setState({page: 'groups'})
      }),
      ep(Button, {
        key: 'sync', label: 'Sync', icon: 'refresh', toggled: this.state.page === 'sync',
        handler: () => this.setState({page: 'sync'})
      })
    ];
    
    const children = [
      epc("div", {key: "header", className: "header"}, [
        epc("div", {key: "title", className: "title"}, "Secretum"),
        epc("div", {key: "version", className: "version"}, settings.build_version)
      ]),
      ep(Router, {key: "router", components: pageComponents, page: this.state.page, id: "router-main"}),
      epc("div", {key: "footer", className: "footer"}, tabs)
    ];
    
    if (this.state.modal !== undefined) {
      children.push(epc('div', {key: 'modal', className: 'modal'}, this.state.modal));
    }
    
    return epc("div", {className: "app"}, children);
  }
}

App.childContextTypes = {
  app: React.PropTypes.object,
  store: React.PropTypes.object,
  syncer: React.PropTypes.object
}

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
