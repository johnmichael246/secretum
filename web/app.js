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

/* global React ReactDOM */

import { HomePage } from './pages/home.js';
import { SyncPage} from './pages/sync.js';

import { e, ep, epc } from './ui.js';
import { Router } from './router.js';
import { Store } from './store.js';

import { Button } from './components/button.js';

Object.values = function(obj) {
	return Object.keys(obj).map(key => obj[key]);
}

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {loading: true, route: {page: 'home'}};

		this._initDatabase().then(db => {
			this.store = new Store({endpoint: 'http://192.168.1.123:8001', db: db});
			this.syncer = this.store;
			this.setState({loading: false});
		});
	}

	navigate(route) {
		this.setState({route: route});
	}

	showModal(dialog, config) {
		this.setState({modal: ep(dialog, config)})
	}

	hideModal() {
		this.setState({modal: undefined});
	}

	getChildContext() {
		if(this.state.loading) {
			return {};
		} else {
			// Must not be used before the loading is finished
			return {app: this, store: this.store, syncer: this.syncer};
		}
	}

	render() {
		if(this.state.loading) {
			return epc('div', {className: 'loading'}, 'Application is loading...');
		}

		var rules = [
			{page: 'home', component: HomePage},
			{page: 'sync', component: SyncPage}
		];

		const tabs = [
			ep(Button, {
				key: 'home', label: 'Home', icon: 'home', toggled: this.state.route.page==='home',
				handler: ()=>this.setState({route: {page: 'home'}})}),
			ep(Button, {
				key: 'sync', label: 'Sync', icon: 'refresh', toggled: this.state.route.page==='sync',
				handler: ()=>this.setState({route: {page: 'sync'}})})
		];

		const children = [
			epc("div", {key: "header", className: "header"}, "Secretum"),
			ep(Router, {key: "router", className: "page", rules: rules, route: this.state.route, id: "router-main"}),
			epc("div", {key: "footer", className: "footer"}, tabs)
		];

		if(this.state.modal !== undefined) {
			children.push(epc('div', {key: 'modal', className: 'modal'}, this.state.modal));
		}

		return epc("div", {className: "app"}, children);
	}

	_initDatabase() {
		return new Promise((resolve, reject) => {
			var db;
			var openRequest = window.indexedDB.open('secretum', 1);
			openRequest.onsuccess = () => {
				db = openRequest.result;
				db.onerror = console.error;

				resolve(db);

				console.log('IndexedDB is now open.');
			};
			openRequest.onerror = reject;
			openRequest.onupgradeneeded = () => {
				db = openRequest.result;

				db.createObjectStore('secrets', {keyPath: 'id', autoIncrement: true});
				db.createObjectStore('groups', {keyPath: 'id', autoIncrement: true});
				db.createObjectStore('meta');

				console.log('Database scheme upgraded or initialized!');
			}
		});
	}
}

App.childContextTypes = {
	app: React.PropTypes.object,
	store: React.PropTypes.object,
	syncer: React.PropTypes.object
}

document.addEventListener("DOMContentLoaded", function() {
	overscroll(document.querySelector('#root'));
	document.body.addEventListener('touchmove', function(evt) {
		if(!evt._isScroller) {
			evt.preventDefault()
		}
	});
	ReactDOM.render(e(App), document.getElementById("root"));
});

var overscroll = function(el) {
  el.addEventListener('touchstart', function() {
    const top = el.scrollTop;
		const totalScroll = el.scrollHeight;
		const currentScroll = top + el.offsetHeight;

    if(top === 0) {
      el.scrollTop = 1;
    } else if(currentScroll === totalScroll) {
      el.scrollTop = top - 1;
    }
  });
  el.addEventListener('touchmove', function(evt) {
    if(el.offsetHeight < el.scrollHeight)
      evt._isScroller = true
  });
}
