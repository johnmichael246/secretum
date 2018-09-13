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

import logging
from base64 import b64decode

import webapp.views
from django.conf import settings
from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from django.shortcuts import redirect

import service.views
from devsite import settings


class RequireBasicAuthentication():
    def __init__(self, get_response):
        self.get_response = get_response
        self.logger = logging.getLogger('secretum')

    def __call__(self, request):
        return self.get_response(request)

    def process_view(self, request, view_func, view_args, view_kwargs):
        if 'HTTP_X_FORWARDED_FOR' in request.META:
            ip = request.META['HTTP_X_FORWARDED_FOR']
        else:
            ip = request.META['REMOTE_ADDR']

        required = True
        if view_func in (webapp.views.login, service.views.hello):
            required = False

        http_allowed = settings.HTTP_AUTH_ALLOWED
        http_attempt = 'HTTP_AUTHORIZATION' in request.META
        if http_allowed and http_attempt:
            http_token = request.META['HTTP_AUTHORIZATION']
            username, password = b64decode(http_token.split(' ')[1]).decode().split(':')
            user = authenticate(username=username, password=password)

            if user is not None:
                login(request, user)
                self.logger.info('User {} / {} authentication with HTTP ok'.format(ip, username))
            else:
                self.logger.warning('User {} / {} authentication with HTTP failed'.format(ip, username))

        self.logger.info('User {} / {} called {}.{} with {} and {}'.format(
            ip,
            request.user,
            view_func.__module__,
            view_func.__name__,
            request.GET,
            request.body if len(request.body) > 0 else None
        ))

        if required and not request.user.is_authenticated:
            if http_attempt:
                resp = JsonResponse({'status': 'invalid-credentials'}, status=401)
                resp['WWW-Authenticate'] = 'Basic realm="SECRETUM"'
                return resp
            else:
                return redirect('login')

        return None
