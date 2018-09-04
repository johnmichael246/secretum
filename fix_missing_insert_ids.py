#!/usr/bin/env python

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "devsite.settings")
application = get_wsgi_application()

from service.models import Commit

import logging
logger = logging.getLogger('secretum')

def invalid_op(op):
    return op['operator'] == 'insert' and 'id' not in op['record']

def find_max_id():
    max_id = -1
    for c in Commit.objects.all():
        for op in c.changes():
            if 'id' in op['record'] and op['record']['id'] > max_id:
                max_id = op['record']['id']
    return max_id


# returns invalid operations from a set of ops
# can be used to filter invalid commits
def invalid_ops(ops):
  return list(filter(invalid_op, ops))

def fix_op(op, next_id):
    logger.warning(
        "Fixing {op} on {table}, added ID {id}".format(
            op = op['operator'],
            table = op['table'],
            id = next_id
        )
    )

    op['record']['id'] = next_id

def fix_ops(ops):
    max_id = find_max_id()
    iops = invalid_ops(ops)

    for iop in iops:
        max_id += 1
        fix_op(iop, max_id)

    return ops
    

def invalid_commit(c):
    return len(invalid_ops(c.changes())) > 0



def fix_commit(c):
    logger.warning("Fixing commit ID {}".format(c.id))

    import json
    ops = fix_ops(c.changes())
    c.delta = json.dumps(ops)
    c.save()


if __name__ == "__main__":
    fc = list(filter(invalid_commit, Commit.objects.all()))
    for c in fc:
        fix_commit(c)

