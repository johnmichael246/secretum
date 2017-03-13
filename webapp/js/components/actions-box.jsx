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

const { epc, ep } = require('../ui.js');
const Button = require('./button.js');

function ActionsBox(props) {
  return <div className='actions-box'>
    { props.children && props.children.length > 0 &&
      props.children.map(action => {
      return <Button key={action.label} {...action}/>
    })}
  </div>
}

module.exports = ActionsBox;