// @flow
// Copyright 2017 Danylo Vashchilenko
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

import DataForm from '../data-form.js';
import type { SomeField, DataFormProps } from '../data-form.js';

export type NativeConfig = {
  url: string,
  vaultName: string,
  username: string,
  password: string,
  device: string
};

export type NativeConfigFormProps = {
  nativeConfig: NativeConfig,
  editable: false
} | {
  editable: true,
  onSubmit: (nativeConfig: NativeConfig) => void,
  onCancel: () => void,
  nativeConfig: NativeConfig,
  onEdit: (nativeConfig: NativeConfig) => void
};

export default function NativeConfigForm(props: NativeConfigFormProps) {
  const fields: Array<SomeField> = [
    {type: "text", name: "url", label: "URL", editable: props.editable},
    {type: "text", name: "vaultName", label: "Vault", editable: props.editable},
    {type: "text", name: "username", label: "User", editable: props.editable},
    {type: "password", name: "password", label: "Password", editable: props.editable},
    {type: "text", name: "device", label: "Device", editable: props.editable}
  ];

  const dataFormProps: Object = {
    className: "native-config",
    fields,
    data: props.nativeConfig,
    editable: props.editable
  };

  if(props.editable) {
    dataFormProps.onSubmit = props.onSubmit;
    dataFormProps.onCancel = props.onCancel;
    dataFormProps.onEdit = props.onEdit;
  }

  return <DataForm {...dataFormProps}/>;
}
