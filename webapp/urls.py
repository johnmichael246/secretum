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

from django.conf.urls import url
import webapp.views as views

urlpatterns = [
    url(r'^manifest.json$', views.manifest, name='manifest'),
    url(r'^sw.js', views.service_worker, name='service-worker'),
    url(r'^$', views.home, name='home'),
    url(r'^login$', views.login, name='login')
]
