/* @flow */
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
const Button = require('./button.js');
const Segment = require('./segment.js');
const ActionsBox = require('./actions-box.jsx');

type AbstractField = {
  name: string,
  label: string,
  editable: boolean
};

type Option = {
  key: string,
  value: string
};

export type TextField = AbstractField & {type: 'text'};
export type PasswordField = AbstractField & {type: 'password'};
export type SelectField = AbstractField & {type: 'select', options: Option[]};
export type LongTextField = AbstractField & {type: 'longtext', rows: number};
export type SomeField = TextField | PasswordField | SelectField | LongTextField;

type EditHandler = (date: Object) => void;

type Props = {
  className?: string,
  data: Object,
  fields: SomeField[],
  onEdit?: EditHandler,
  onSubmit?: () => any,
  onCancel?: () => any,
  actions?: Action[]
};

type Action = {
  label: string,
  icon: string,
  handler: () => any
};

module.exports = DataForm;

function DataForm(props: Props) {
  const {className, fields, data, onEdit, onSubmit, onCancel, actions=[]} = props;

  const bottomActions = [];
  if(onSubmit) {
    bottomActions.push({
      key: "!submit",
      label: "Save",
      icon: 'check-square',
      handler: _ => onSubmit()
    });
  }
  if(onCancel) {
    bottomActions.push({
      key: "!cancel",
      label: "Cancel",
      icon: 'times-rectangle',
      handler: _ => onCancel()
    });
  }
  
  return (
    <div className={"data-form" + (className ? ` data-form--${className}` : '')}>
      { actions.length > 0 && buildActions(actions, 'top-actions')}
      { fields.length > 0 && fields.map(field => buildField(field, data[field.name], onChangeFactory(data, onEdit))) }
      { bottomActions.length > 0 && buildActions(bottomActions, 'bottom-actions')}
    </div>
  );
}

function onChangeFactory(data: Object, handler: ?EditHandler) {
  return function({target: {name, value}}) {
    if(handler) {
      return handler(Object.assign(data, {[name]: value}));
    }
  }
}

function buildActions(actions, key) {
  return (
    <div key={key} className="data-form__field">
      <div key="label" className="data-form__label"/>
      <ActionsBox key="input">{actions}</ActionsBox>
    </div>
  );
}

function buildField(field: SomeField, value: any, onChange: Function) {
  switch(field.type) {
    case "text":
      return buildTextField(field, value, onChange);
    case "password":
      return buildPasswordField(field, value, onChange);
    case "select":
      return buildSelectField(field, value, onChange);
    case "longtext":
      return buildLongTextField(field, value, onChange);
    default:
      throw new Error(`Unknown form field type: ${field.type}`);
  }
}

function buildPasswordField(
  {editable=true, name, type, label}: PasswordField,
  value: string,
  onChange: (data: Object) => any
) {
  
  if(editable === undefined || editable === true) {
    return buildTextField({editable, name, type: 'text', label}, value, onChange);
  }
  
  return (
    <div key={name} className="data-form__field">
      <div key="label" className="data-form__label">{label}</div>
      <input key="input" disabled={!editable} {...{type, name, value, onChange}}/>
    </div>
  );
}

function buildTextField(
  {editable=true, name, type, label}: TextField,
  value: string,
  onChange: (data: Object) => any
) {
  
  return (
    <div key={name} className="data-form__field">
      <div key="label" className="data-form__label">{label}</div>
      <input key="input" disabled={!editable} {...{type, name, value, onChange}}/>
    </div>
  );
}

function buildSelectField(
  {editable=true, name, label, options}: SelectField,
  value: string,
  onChange: Function) {
  
  return (
    <div key={name} className="data-form__field">
      <div key="label" className="data-form__label">{label}</div>
      <select key="input" disabled={!editable} {...{name, value, onChange}}>
        {options.map(option => <option key={label} {...option}/>)}
      </select>
    </div>
  );
}

function buildLongTextField(
  {editable=true, name, label, rows=5}: LongTextField,
  value: string,
  onChange: Function
) {
  
  return (
    <div key={name} className="data-form__field">
      <div key="label" className="data-form__label">{label}</div>
      <textarea key="input" disabled={!editable} {...{name, value, onChange, rows}}/>
    </div>
  );
}
