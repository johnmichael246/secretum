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

function epc(elem, props, children) {
	if(props === undefined) throw new Error("Missing props argument");
	if(children === undefined) throw new Error("Missing children argument");
	return React.createElement(elem, props, children);
}

function ep(elem, props) {
	if(props === undefined) throw new Error("Missing props argument");
	return React.createElement(elem, props, null);
}

function ec(elem, children) {
	if(children === undefined) throw new Error("Missing children argument");
	return React.createElement(elem, null, children);
}

function e(elem) {
	return React.createElement(elem, null, null);
}

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

Map.fromObject = function(obj) {
	const map = new Map();
	for(var key in obj) {
		map.set(key,obj[key]);
	}
	return map;
}

class SearchTool extends React.Component {
	constructor(props) {
		super(props);
		this.state = {query: ''};
		this._handleSubmit = this._handleSubmit.bind(this);
		this._handleChange = this._handleChange.bind(this);
	}

	_handleSubmit(event) {
		this.props.onSubmit(this.state.query);
		event.preventDefault();
	}

	_handleChange(event) {
		this.setState({query: event.target.value});
	}

	render() {
		return epc("form", {className: "search", onSubmit: this._handleSubmit}, [
			ep("input", {key: "keyword", type: "text", onChange: this._handleChange, placeholder: "Search"}),
			ep("input", {key: "submit", type: "submit", value: "Go!"})
		]);
	}
}

class DataForm extends React.Component {
	constructor(props) {
		super(props);
		this.state = this._setup(props);

		this._onFieldChange = this._onFieldChange.bind(this);
		this._onSubmit = this._onSubmit.bind(this);
		this._onCancel = this._onCancel.bind(this);
	}

	_onSubmit(evt) {
		this.props.onSubmit(this.state.data);
	}

	_onCancel(evt) {
		this.props.onCancel();
	}

	_setup(props) {
		const promises = [];
		if(props.data instanceof Promise) {
			promises.push(props.data.then(d => this.setState({data: d})));
		}
		props.fields.forEach((f,fi) => {
			if(f.type === "select" && f.options instanceof Promise) {
				// Chains with a promise of a function
				// which inserts arrived options into the metadata
				promises.push(f.options.then(o => {
					var fields = new Object(this.state.fields);
					fields[fi].options = o;
					this.setState({fields: fields});
				}));
			}
		});

		if(promises.length > 0) {
			Promise.all(promises).then(()=>this.setState({loading: false}));
		}

		return {
			loading: promises.length > 0,
			data: props.data,
			fields: props.fields
		};
	}

	_onFieldChange(evt) {
		const update = {[evt.target.name]: evt.target.value};
		this.setState({data: Object.assign(this.state.data, update)});
	}

	_buildTextField(field) {
		const props = { key: "input", type: "text", name: field.name, onChange: this._onFieldChange };
		
		if(this.state.loading) {
			// Disabling input component if the data is not yet ready
			props.value = "...";
			props.disabled = "";
		} else {
			// Populating with current value otherwise
			props.value = this.state.data[field.name];
			props.disabled =  field.readOnly || false;
		}

		const label = epc("div", {key: "label", className: "label"}, field.label);
		return epc("div", {key: field.name, className: "row"}, [label, ep("input", props)]);
	}

	_buildSelectField(field) {
		const props = { key: "input", name: field.name, onChange: this._onFieldChange };
		const options = [];

		if(this.state.loading) {
			options.push(epc("option", {key: "loading"}, "..."));
			props.value = "...";
			props.disabled = "";
		} else {
			options.push(field.options.map(o => epc("option", {key: o.value, value: o.value}, o.label)));
			props.value = this.state.data[field.name];
		}

		const label = epc("div", {key: "label", className: "label"}, field.label);
		return epc("div", {key: field.name, className: "row"}, [label, epc("select", props, options)]);
	}

	_buildTextAreaField(field) {
		const props = { key: "input", name: field.name, onChange: this._onFieldChange, rows: 10 };

		if(this.state.loading) {
			props.value = "...";
			props.disabled = "";
		} else {
			props.value = this.state.data[field.name];
		}

		const label = epc("div", {key: "label", className: "label"}, field.label);
		return epc("div", {key: field.name, className: "row"}, [label, ep("textarea", props)]);
	}

	render() {
		// Form: title, [fields], validator?, record?, className?, onSubmit?, onCancel?
		// Field: name, type, label, validator?, className?
		const children = [];

		children.push(epc("h2",{key: "title", className: "title"},this.props.title));

		for(let field of this.state.fields) {
			var row;
			if(field.type === "text") {
				row = this._buildTextField(field);
			} else if(field.type === "select") {
				row = this._buildSelectField(field);
			} else if(field.type === "textarea") {
				row = this._buildTextAreaField(field);
			}
			
			children.push(row);
		}

		if(this.props.onSubmit !== undefined) {
			var buttonProps = {key: "!submit", type: "button", value: "Submit!", 
				onClick: this._onSubmit, disabled: this.state.loading};
			children.push(ep("input", buttonProps));
		}

		if(this.props.onCancel !== undefined) {
			var buttonProps = {key: "!cancel", type: "button", value: "Cancel", 
				onClick: this._onCancel, disabled: this.state.loading};
			children.push(ep("input", buttonProps));
		}

		return epc("div", {className: `data-form ${this.props.className}`}, children)
	}
}

class SecretForm extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		const groups = App.model.findAllGroups().then(gs => gs.map(g => ({value: g.id, label: g.name})));
		const fields = [
			{name: "id", type: "text", label: "ID", readOnly: true},
			{name: "groupId", type: "select", label: "Group", options: groups},
			{name: "resource", type: "text", label: "Resource"},
			{name: "principal", type: "text", label: "Principal"},
			{name: "password", type: "text", label: "Password"},
			{name: "note", type: "textarea", label: "Note"}
		];
		const form = {title: "Editing Secret", fields: fields, data: this.props.secret, 
			onSubmit: this.props.onSubmit, onCancel: this.props.onCancel};
		return ep(DataForm, form);
	}
}

class DataTable extends React.Component {
	constructor(props) {
		super(props);
		this.state = this._setup(props);
	}

	_setup(props) {
		if(props.data instanceof Promise) {
			props.data.then(d => this.setState({data: d, loading: false}));
			return { loading: true };
		} else {
			return {
				loading: false,
				data: props.data
			};
		}
	}

	_buildHeaderRow(headers, columns) {
		return epc("div", {key: "header", className: "header row"}, 
			headers.map((h,i) => epc("div", {key: columns[i], className: `cell ${columns[i]}`}, h)));
	}

	componentWillReceiveProps(props) {
		this.setState(this._setup(props));
	}

	render() {
		var children = [];
		if(this.props.headers !== undefined) {
			children.push(this._buildHeaderRow(this.props.headers,this.props.columns));
		}
		if(!this.state.loading) {
			children.push(
					this.state.data.map((r,i) => epc("div", {key: i, className: "row"},
						this.props.columns.map(k => epc("div", {key: k, className: `cell ${k}`}, r[k])))));
		} else {
			children.push(epc("div", {key: "loading"}, "Loading..."));
		}
		return epc("div", {className: `table ${this.props.className}`}, children);
	}
}

function merge(a1, a2) {
	return a1.map((a,i) => Object.assign(a,a2[i]));
}

function SecretToolbox(props) {
	const handlers = props.actionHandlers;
	const secret = props.secret;
	const tools = [epc("a", {key: "copy", onClick: evt => handlers.onCopy(secret)}, ep("i", {className: "fa fa-flash"})),
					epc("a", {key: "edit", onClick: evt => handlers.onEdit(secret)}, ep("i", {className: "fa fa-edit"})),
					epc("a", {key: "remove", onClick: evt => handlers.onRemove(secret)}, ep("i", {className: "fa fa-remove"}))]
	return ec("div", tools);
}

function SecretsTable(props) {
	const transform = secrets => {
		const actions = secrets.map(s => ({	
			actions: ep(SecretToolbox, {secret: s, actionHandlers: props.actionHandlers})
		}));
		return merge(secrets, actions);
	}

	var data;
	if(props.secrets instanceof Promise) {
		data = props.secrets.then(s => transform(s));
	} else {
		data = transform(props.secrets);
	}

	return ep(DataTable, 
		{className: "secrets", headers:["ID","Group", "Resource","Principal","Note","Actions"], 
			columns:["id", "groupName", "resource", "principal", "note", "actions"],
			data: data});
}

class Model {
	constructor(endpoint) {
		this.endpoint = endpoint;
	}

	_request(method, path, body) {
		const payload = (resolve, reject) => {
			var xhr = new XMLHttpRequest();
			xhr.open(method, this.endpoint + path);
			if(method === "GET") {
				xhr.responseType = "json";
			}
			xhr.onload = e => {
				if(xhr.status === 200) {
					resolve(xhr.response);
				} else {
					reject(new Error(xhr.statusText));
				}
			};
			xhr.onerror = e => reject(new Error("Network error"));
			xhr.send(body);
		};
		return new Promise(payload);
	}

	_get(path) {
		return this._request("GET", path);
	}

	_post(path, body) {
		return this._request("POST", path, body);
	}

	findAll() {
		return this._get("/secrets");
	}

	findAllGroups() {
		return this._get("/groups");
	}

	findKeyword(query) {
		return this._get("/secrets?keyword="+encodeURIComponent(query)).then(d => d.results);	
	}

	saveSecret(secret) {
		const data = JSON.stringify(secret);

		if(secret.id === null) {
			this._post("/secrets", data);
		} else {
			this._post(`/secrets/${secret.id}`, data);
		}
	}

	removeSecret(id) {
		this._post(`/secrets/${id}/delete`);
	}

	get(id) {
		return this.findAll().then(ss => {
			var secret = null;
			for(var s of ss) {
				if(s.id === id) {
					return s;
				}
			}
			return null;
		});
	}
}

class Router extends React.Component {
	constructor(props) {
		super();

		const rules = props.rules.map(this._prepareRule);
		
		this.state = {
			prefix: props.hasOwnProperty("prefix") ? props.prefix : "/",
			rules: new Map(rules),
			current: null
		};

		console.log(`New router (${props.id}) with ${this.state.rules.size} rules at ${this.state.prefix}.`);
	}

	_prepareRule(rule) {
		const pattern = rule[0];
		const component = rule[1];
		
	    var cmps = pattern.split("/");

	    // Removing emptiness before heading slash
	    cmps.shift();

	    cmps = cmps.map(c => {
	    	// If a pattern variable found
	        if(/^{.*}$/.test(c)) {
	        	// Replace with a regex capture group
	            return "([^\\/]+)";
	        } else {
	            return c;
	        }
	    });

	    const regex = "^/" + cmps.join("\\/") + "$";
	    return [new RegExp(regex),component];
	}

	componentWillMount() {
		this._go();
	}

	componentDidMount() {
		// Routing upon hash changes
		window.addEventListener("hashchange", event => this._go());
	}

	_go() {
		// Take the window's hash and strip #
		var path = window.location.hash || "#/";
		path = path.substring(1);

		if(this.props.prefix !== undefined && !path.startsWith(this._prefix)) {
			// This router should not be in the view, so no need to navigate
			return;
		}

		// Remove the prefix, if any
		if(this.props.prefix !== undefined && this.props.prefix !== "/") {
			path = path.substring(this._prefix.length);
		}

		var found = false;
		this.state.rules.forEach((component,regex) => {
			const trial = regex.exec(path);
			if(trial !== null) {
				if(found) {
					throw new Error("Multiple patterns matched same path: " + path);
				}

				// Remove matching string, capture groups left
				trial.shift();

				const child = component instanceof Function ? component.apply(null, trial) : component;
				
				this.setState({current: child});
				found = true;
			}
		});

		if(!found) {
			throw `Error: Router ${this.props.id} matched prefix, but the rule is missing: ${path}`;
		}
	}

	render() {
		return epc("div", {className: `router ${this.props.className}`}, this.state.current);
	};
}

class HomePage extends React.Component {
	constructor(props) {
		super(props);
		this.state = {secrets: props.model.findAll()};

		this._onSearch = this._onSearch.bind(this);
		this._onCopy = this._onCopy.bind(this);
		this._onEdit = this._onEdit.bind(this);
		this._onRemove = this._onRemove.bind(this);
	}

	_onSearch(query) {
		this.setState({query: query, secrets: this.props.model.findKeyword(query)});
	}

	_onCopy(secret) {
		copyTextToClipboard(secret.password);
	}

	_onEdit(secret) {
		window.location.hash = `#/secrets/${secret.id}`;
	}

	_onRemove(secret) {
		App.model.removeSecret(secret.id);
		if(this.state.query !== undefined) {
			this.setState({secrets: this.props.model.findKeyword(this.state.query)});	
		} else {
			this.setState({secrets: this.props.model.findAll()});	
		}
		
	}

	render() {
		const handlers = {onCopy: this._onCopy, onEdit: this._onEdit, onRemove: this._onRemove};
		return epc("div", {className: "home"}, [
			ep(SearchTool, {key: "search", onSubmit: this._onSearch}),
			ep(SecretsTable, {key: "table", secrets: this.state.secrets, actionHandlers: handlers})
		]);
	}
}

class EditSecretPage extends React.Component {
	constructor(props) {
		super(props);
		this._onSave = this._onSave.bind(this);
		this._onCancel = this._onCancel.bind(this);
	}

	_onSave(secret) {
		App.model.saveSecret(secret);
		window.location.hash = "#/";
	}

	_onCancel() {
		window.location.hash = "#/";
	}

	render() {
		return ep(SecretForm, {secret: this.props.secret, onSubmit: this._onSave, onCancel: this._onCancel});
	}
}

class App extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		var rules = [
			["/", ep(HomePage,{model: this.props.model})],
			["/secrets/{id}", id => ep(EditSecretPage, {secret:this.props.model.get(Number.parseInt(id))})]
		];
		return epc("div", {className: "app"}, [
			epc("div", {key: "header", className: "header"}, "Secretum"),
			ep(Router, {key: "router", className: "page", rules: rules, id: "router-main"}),
			epc("div", {key: "footer", className: "footer"}, "Keep your secrets safe!")
		]);
	}

	static get model() {
		return App._model;
	}
}
App._model = new Model("http://localhost:8001");

document.addEventListener("DOMContentLoaded", function(evt) {
	ReactDOM.render(ep(App, {model: App.model}), document.getElementById("root"));
});