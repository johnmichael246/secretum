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

from django.shortcuts import render, render_to_response
from django.conf import settings


def home(request):
    return render(request, 'webapp/index.html', {'idb_name': settings.IDB_NAME, 'version': settings.VERSION})


def manifest(request):
    return render(request, 'webapp/manifest.json', {})


def service_worker(request):
    return render_to_response('webapp/sw.js', content_type='application/javascript')
