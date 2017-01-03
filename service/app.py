# Copyright 2016-2047 Danylo Vashchilenko
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import http.server
import logging
import urllib.parse
import psycopg2
import json
import datetime

logging.basicConfig(level=logging.INFO)

class DatetimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime.datetime):
            return obj.isoformat()
        return json.JSONEncoder.default(self, obj)

class App(http.server.BaseHTTPRequestHandler):
    def prepare_req(self):
        args = {}
        pos = self.path.find('?')
        if pos >= 0:
            rpath = self.path[:pos]
            args = urllib.parse.parse_qs(self.path[pos + 1:])
        else:
            rpath = self.path

        return (rpath, args)

    def do_POST(self):
        body = self.rfile.read(int(self.headers.get('Content-Length'))).decode('utf-8')

        logging.info('Request POST %s: %s' % (self.path, body))

        rpath, args = self.prepare_req()
        if rpath == '/save':
            self.save(args, body)
        else:
            self.send_error(404)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

    def do_GET(self):
        logging.info('Request GET %s' % (self.path))

        rpath, args = self.prepare_req()

        if rpath == '/fetch':
            self.fetch(args)
        elif rpath == '/meta':
            self.meta(args)
        else:
            self.send_response(404)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()


    def meta(self, args):
        with psycopg2.connect("dbname=secretum user=postgres password='postgres'") as db:
            with db.cursor() as cur:
                cur.execute('select id, name from vaults')
                data = cur.fetchall()

                doc = [{'id': row[0], 'name': row[1]} for row in data]

                data = bytearray(json.dumps(doc), 'utf-8')

                self.send_response(200, 'Sure')
                self.send_header('Content-length', len(data))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(data)

    def fetch(self, args):
        if not 'vaultId' in args:
            self.send_error(400, 'Missing trunk query parameter')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            return

        vaultId = args['vaultId'][0]
        since = args['sinceCommitId'][0] if 'sinceCommitId' in args else 0

        with psycopg2.connect("dbname=secretum user=postgres password='postgres'") as db:
            with db.cursor() as cur:
                cur.execute('select id, vault, posted, device, delta from snapshots where vault = %s and id > %s order by id asc', (vaultId, since))
                snapshots = [{'id': row[0], 'vault': row[1], 'posted': row[2], 'device': row[3], 'delta': row[4]}
                             for row in cur.fetchall()]

                cur.execute('select id, name from vaults where id = %s', (vaultId))
                row = cur.fetchone()
                vault = {'id': row[0], 'name': row[1]}

        data = bytearray(json.dumps({'vault': vault, 'snapshots': snapshots}, cls=DatetimeEncoder), 'utf-8')

        self.send_response(200, 'Sure')
        self.send_header('Content-length', len(data))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(data)

    def save(self, args, body):
        if not 'vaultId' in args:
            self.send_error(400, 'No vault ID specified')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            return

        vaultId = args['vaultId'][0]

        with psycopg2.connect("dbname=secretum user=postgres password='postgres'") as db:
            with db.cursor() as cur:
                # Testing if the trunk exists
                cur.execute('select %s in (select id from vaults)', (vaultId,))
                if not cur.fetchone()[0]:
                    self.send_error(400, 'No trunk with ID given exists')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    return

                cur.execute("""insert into snapshots (parent, posted, device, delta, vault)
                              values ((select max(id) from snapshots where vault = %(vault)s),now(),'webapp',%(delta)s,%(vault)s)
                              returning id, parent, posted, device, vault, delta""",
                            {'vault': vaultId, 'delta': body})

                # Getting the new ID back
                row = cur.fetchone()
                snapshot = {'id': row[0], 'parent': row[1], 'posted': row[2], 'device': row[3], 'vault': row[4], 'delta': row[5]}
                data = bytearray(json.dumps(snapshot, cls=DatetimeEncoder), 'utf-8')

                db.commit()

                self.send_response(200, 'Sure')
                self.send_header('Content-length', len(data))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(data)

server = http.server.HTTPServer(('',8001), App)
server.serve_forever()
