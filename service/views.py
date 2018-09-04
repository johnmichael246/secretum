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

import json

from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponseBadRequest
from django.http import JsonResponse, HttpResponse
from django.shortcuts import render, get_object_or_404
from django.utils.html import escape
from service.models import Trunk, Commit

import jsonschema
import json

def hello(request):
    return JsonResponse({'status': 'ok'})

def meta(request):
    response = JsonResponse([{'id': t.id, 'name': t.name} for t in Trunk.objects.all()], safe=False)
    return response

def pull(request):
    try:
        trunk = Trunk.objects.get(id=int(request.GET['vaultId']))
    except (KeyError, ValueError, ObjectDoesNotExist) as e:
        raise HttpResponseBadRequest('Invalid (or no) vault ID requested')

    commits = Commit.objects.filter(trunk=trunk)
    if 'sinceCommitId' in request.GET:
        commits = commits.filter(id__gt=request.GET['sinceCommitId'])

    commits = commits.order_by('id')

    return JsonResponse({
        'vault': {'id': trunk.id, 'name': trunk.name},
        'snapshots': [
            {'id': c.id, 'posted': c.posted, 'vault': c.trunk.id, 'device': c.device, 'delta': c.delta}
            for c in commits
    ]}, safe=False)

def commit(request):
    if 'vaultId' not in request.GET:
        return HttpResponseBadRequest('Vault ID was not specified')

    schema = {
        'type': 'array',
        'items': {
            'type': 'object',
            'required': ['record', 'operator', 'table'],
            'properties': {
                'operator': {'type': 'string'},
                'table': {'type': 'string'},
                'record': {
                    'type': 'object',
                    'required': ['id'],
                    'properties': {'id': {'type': 'integer'}}
                },
            }
        }
    }

    delta = request.body.decode()

    try:
        operations = json.loads(delta)
        jsonschema.validate(operations, schema)
    except json.JSONDecodeError as e:
        return HttpResponseBadRequest(str(e))
    except jsonschema.exceptions.ValidationError as e:
        return HttpResponseBadRequest(str(e))

    trunk = get_object_or_404(Trunk, id=request.GET['vaultId'])
    commit = Commit(
        trunk=trunk,
        parent=trunk.commit_set.last(),
        device=request.GET['device'],
        delta=delta
    )
    commit.save()

    c = commit
    return JsonResponse({
        'id': c.id,
        'posted': c.posted,
        'vault': c.trunk.id,
        'device': c.device,
        'delta': c.delta
    })
