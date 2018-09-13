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
import datetime

from django.contrib.auth import get_user_model
from django.contrib.auth import login as django_login
from django.contrib.auth.models import User
from django.http import HttpResponse
from django.shortcuts import render, render_to_response, redirect
from django.conf import settings

from google.oauth2 import id_token
from google.auth.transport import requests

import logging
logger = logging.getLogger('secretum')

def get_version():
    if settings.DEBUG:
        return datetime.datetime.now().isoformat()
    else:
        return settings.VERSION

def home(request):
    return render(request, 'webapp/index.html', {
        'idb_name': settings.IDB_NAME,
        'version': get_version(),
        'google_signin_client_id': settings.GOOGLE_SIGNIN_CLIENT_ID
    })


def login(request):
    if request.method == 'GET':
        return render(request, 'webapp/login.html', {
            'google_signin_client_id': settings.GOOGLE_SIGNIN_CLIENT_ID,
            'version': get_version()
        })
    elif request.method != 'POST':
        return HttpResponse(status=400)

    client_token = request.POST['token']

    idinfo = id_token.verify_oauth2_token(
        client_token,
        requests.Request(),
        settings.GOOGLE_SIGNIN_CLIENT_ID
    )

    signing_client_id = idinfo['aud']
    if signing_client_id != settings.GOOGLE_SIGNIN_CLIENT_ID:
        logger.warning('Google auth failed with wrong client ID {}'.format(signing_client_id))
        return HttpResponse(status=400)

    logger.warning('Google auth {}'.format(idinfo))


    user_model = get_user_model()
    user_email = idinfo['email']

    try:
        user = user_model.objects.get(email=user_email)
    except user_model.DoesNotExist:
        logger.warning('Google auth failed with unknown email {}'.format(user_email))
        return HttpResponse(status=400)

    django_login(request, user)
    logger.warning('Google auth succeeded with {}'.format(user_email))

    return redirect('/')


def manifest(request):
    return render(request, 'webapp/manifest.json', {})


def service_worker(request):
    return render_to_response('webapp/sw.js', content_type='application/javascript', context={'version': get_version()})
