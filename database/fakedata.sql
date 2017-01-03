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
    "record":{"resource":"https://icloud.com","groupId":4,"principal":"myfamily","password":"password40","note":"","id":220}},
  {"operator":"update","table":"secrets",
    "record":{"resource":"https://icloud.com","groupId":4,"principal":"myfamily","password":"password400","note":"","id":220}},
  {"operator":"update","table":"secrets",
    "record":{"resource":"https://icloud.com","groupId":4,"principal":"thefamily","password":"password400","note":"","id":220}},
  {"operator":"update","table":"secrets",
    "record":{"resource":"https://icloud.com","groupId":4,"principal":"thefamily@gmail.com","password":"password400","note":"","id":220}},
  {"operator":"insert","table":"secrets",
    "record":{"resource":"https://gmail.com","groupId":1,"principal":"name@gmail.com","password":"notsuperhardpassword","note":"TODO: Replace the password with a super hard one.","id":221}},
  {"operator":"update","table":"secrets",
    "record":{"resource":"https://twitter.com","groupId":1,"principal":"username2","password":"password3","note":"Security Question: What''s your dog''s name?\nAnswer: Bolty","id":216}},
  {"operator":"insert","table":"secrets",
    "record":{"resource":"https://anotherbank.com","groupId":3,"principal":"account5910","password":"easypassword","note":"VISA PIN: 1591","id":222}}]
');
