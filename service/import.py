import psycopg2
import json
import datetime

srcName = 'secretum_back'
dstName = 'secretum'

def importDatabase(vaultId):
    with psycopg2.connect("dbname=%s user=postgres password='postgres'" % (srcName)) as sdb:
        with psycopg2.connect("dbname=%s user=postgres password='postgres'" % (dstName)) as tdb:
            try:
                with sdb.cursor() as src:
                    with tdb.cursor() as dst:
                        src.execute('SELECT id, name FROM sections')
                        groups = [{'id': s[0], 'name': s[1]} for s in src.fetchall()]

                        src.execute('select id, resource, principal, secret, notes, section from secrets')
                        secrets = [{'id': s[0], 'resource': s[1],
                                    'principal': s[2], 'password': s[3],
                                    'note': s[4] if s[4] != None else '', 'groupId': s[5]} for s in src.fetchall()]

                        delta = {'groups': {'insert': groups},
                                 'secrets': {'insert': secrets}}

                        dst.execute('delete from snapshots where vault = %s', (vaultId,))
                        dst.execute("insert into snapshots (posted, device, parent, delta, vault) values (now(), 'import', null, %s, %s)",
                                    (json.dumps(delta), vaultId))

                sdb.commit()
                tdb.commit()
            except Exception as e:
                sdb.rollback()
                tdb.rollback()
                raise e

def generate(vaultId):
    with psycopg2.connect("dbname=secretum user=postgres password='postgres'") as db:
        try:
            with db.cursor() as cur:
                cur.execute('delete from snapshots where vault = %s', (vaultId,))

                groups = [
                    {'id': 1, 'name': 'Personal'},
                    {'id': 2, 'name': 'Work'},
                    {'id': 3, 'name': 'Banking'},
                    {'id': 4, 'name': 'Family'}
                ]

                delta = [{'operator': 'insert', 'table': 'groups', 'record': group} for group in groups]
                delta = json.dumps(delta)

                cur.execute("insert into snapshots (device, delta, vault) values ('server', %s, %s)", (delta, vaultId))
            db.commit()
        except Exception as e:
            db.rollback()
            raise e