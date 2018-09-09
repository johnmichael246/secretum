#!/usr/bin/env python

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "devsite.settings")
application = get_wsgi_application()

from service.models import Trunk
from django.contrib.auth.models import User

root = User()
root.username = 'root'
root.email = 'root@root.com'
root.set_password('root')
root.is_superuser = True
root.save()

trunk = Trunk()
trunk.name = 'dev'
trunk.save()

import logging
logger = logging.getLogger('secretum')

logger.info('Seeded root user and dev trunk')

