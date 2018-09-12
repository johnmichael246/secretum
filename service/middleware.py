# Copyright 2016-2017 Danylo Vashchilenko
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

from django.conf import settings
from django.core.exceptions import MiddlewareNotUsed
from django.http import HttpResponse, JsonResponse
from django.contrib.auth import authenticate, login
from base64 import b64decode
import logging
import service.views


class RequireBasicAuthentication():
    def __init__(self, get_response):
        self.get_response = get_response
        self.logger = logging.getLogger('secretum')

    def __call__(self, request):
        return self.get_response(request)

    def process_view(self, request, view_func, view_args, view_kwargs):
        #if view_func.__module__ is not service.views.__name__:
        #    return None

        if 'HTTP_X_FORWARDED_FOR' in request.META:
            ip = request.META['HTTP_X_FORWARDED_FOR']
        else:
            ip = request.META['REMOTE_ADDR']

        attempt = None
        if 'HTTP_AUTHORIZATION' in request.META:
            attempt = request.META['HTTP_AUTHORIZATION']
            username, password = b64decode(attempt.split(' ')[1]).decode().split(':')
            user = authenticate(username=username, password=password)

            if user is not None:
                login(request, user)
                self.logger.info('User {} authenticated with HTTP auth'.format(username))
            else:
                self.logger.warning('User {} / {} authentication with HTTP failed'.format(ip, username))

        self.logger.info('User {} called {}.{} with {} and {}'.format(
            request.user if request.user.is_authenticated else ip,
            view_func.__module__,
            view_func.__name__,
            request.GET,
            request.body if len(request.body) > 0 else None
        ))

        if not request.user.is_authenticated:
            if attempt is not None:
                resp = JsonResponse({'status': 'invalid-credentials'}, status=401)
                resp['WWW-Authenticate'] = 'Basic realm="SECRETUM"'
                return resp
            else:
                resp = JsonResponse({'status': 'missing-auth-header'}, status=401)
                resp['WWW-Authenticate'] = 'Basic realm="SECRETUM"'
                return resp

        return None
