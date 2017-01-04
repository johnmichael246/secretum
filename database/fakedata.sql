-- Copyright 2016-2017 Danylo Vashchilenko
--
-- Licensed under the Apache License, Version 2.0 (the "License");
-- you may not use this file except in compliance with the License.
-- You may obtain a copy of the License at
--
--     http://www.apache.org/licenses/LICENSE-2.0
--
-- Unless required by applicable law or agreed to in writing, software
-- distributed under the License is distributed on an "AS IS" BASIS,
-- WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
-- See the License for the specific language governing permissions and
-- limitations under the License.

delete from snapshots where vault = (select id from vaults where name = 'fakedata');
delete from vaults where name = 'fakedata';


insert into vaults (name) values ('fakedata');

insert into snapshots (device, vault, parent, delta) values ('fake', currval('vault_id_seq'), null, '
  [
  {"table": "groups",
    "record": {"id": 1, "name": "Personal"}, "operator": "insert"},
  {"table": "groups",
    "record": {"id": 2, "name": "Work"}, "operator": "insert"},
  {"table": "groups",
    "record": {"id": 3, "name": "Banking"}, "operator": "insert"},
  {"table": "groups",
    "record": {"id": 4, "name": "Family"}, "operator": "insert"}
  ]
');

insert into snapshots (device, vault, parent, delta) values ('fake', currval('vault_id_seq'), currval('snapshot_id_seq'), '
  [
  {"operator":"insert", "table":"secrets",
    "record": {"resource":"https://facebook.com","groupId":1,"principal":"myname@email.com","password":"password1","note":"","id":1}},
  {"operator":"insert","table":"secrets",
    "record":{"resource":"https://twitter.com","groupId":1,"principal":"username3","password":"password3","note":"","id":2}},
  {"operator":"insert","table":"secrets",
    "record":{"resource":"https://mybank.com","groupId":3,"principal":"account1092","password":"password8","note":"VISA PIN: 1234","id":3}},
  {"operator":"update","table":"secrets",
    "record":{"resource":"https://twitter.com","groupId":1,"principal":"username3","password":"password3","note":"","id":2}},
  {"operator":"update","table":"secrets",
    "record":{"resource":"https://twitter.com","groupId":1,"principal":"username2","password":"password3","note":"","id":2}},
  {"operator":"insert","table":"secrets",
    "record":{"resource":"https://corp.com","groupId":2,"principal":"employee19","password":"veryhardpassword","note":"Badge ID: 9419","id":4}},
  {"operator":"insert","table":"secrets",
    "record":{"resource":"http://dropbox.com","groupId":4,"principal":"myfamily","password":"sharedpassword","note":"","id":5}},
  {"operator":"update","table":"secrets",
    "record":{"resource":"https://dropbox.com","groupId":4,"principal":"myfamily","password":"sharedpassword","note":"","id":5}}
  ]
');

insert into snapshots (device, vault, parent, delta) values ('fake', currval('vault_id_seq'), currval('snapshot_id_seq'), '
  [
  {"operator":"insert","table":"secrets",
    "record":{"resource":"https://icloud.com","groupId":4,"principal":"myfamily","password":"password40","note":"","id":6}},
  {"operator":"update","table":"secrets",
    "record":{"resource":"https://icloud.com","groupId":4,"principal":"myfamily","password":"password400","note":"","id":6}},
  {"operator":"update","table":"secrets",
    "record":{"resource":"https://icloud.com","groupId":4,"principal":"thefamily","password":"password400","note":"","id":6}},
  {"operator":"update","table":"secrets",
    "record":{"resource":"https://icloud.com","groupId":4,"principal":"thefamily@gmail.com","password":"password400","note":"","id":6}},
  {"operator":"insert","table":"secrets",
    "record":{"resource":"https://gmail.com","groupId":1,"principal":"name@gmail.com","password":"notsuperhardpassword","note":"TODO: Replace the password with a super hard one.","id":7}},
  {"operator":"update","table":"secrets",
    "record":{"resource":"https://twitter.com","groupId":1,"principal":"username2","password":"password3","note":"Security Question: What''s your dog''s name?\nAnswer: Bolty","id":2}},
  {"operator":"insert","table":"secrets",
    "record":{"resource":"https://anotherbank.com","groupId":3,"principal":"account5910","password":"easypassword","note":"VISA PIN: 1591","id":8}}]
');
