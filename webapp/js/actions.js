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

module.exports = {
  NAVIGATE: 'navigate',
  BOOT: 'boot',
  HOME_PAGE: {
    QUERY: 'home-page/query',
    INJECT: 'home-page/inject',
    DETAIL: 'home-page/detail',
  },
  GROUPS_PAGE: {
    QUERY: 'groups-page/query',
    INJECT: 'groups-page/inject',
  },
  SYNC_PAGE: {
    INJECT: 'sync-page/inject'
  },
  SHOW_MODAL: 'show-modal',
  HIDE_MODAL: 'hide-modal',
  SECRET_EDITOR: {
    BOOT: 'secret-editor/boot',
    EDIT: 'secret-editor/edit'
  },
  GROUP_EDITOR: {
    BOOT: 'group-editor/boot',
    EDIT: 'group-editor/edit'
  },
  SETUP_NATIVE_BACKEND: {
    'BOOT': 'setup-native-backend/boot',
    'EDIT': 'setup-native-backend/edit'
  }
};
