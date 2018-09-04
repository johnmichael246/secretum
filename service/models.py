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

from datetime import datetime, timezone
from django.db import models
import json

class Trunk(models.Model):
    name = models.CharField(max_length=100, unique=True)
    def __str__(self):
        return "{{id={}, name={}}}".format(self.id, self.name)


class Commit(models.Model):
    parent = models.ForeignKey("self", null=True, on_delete=models.CASCADE)
    posted = models.DateTimeField(default=lambda: datetime.now(timezone.utc))
    device = models.CharField(max_length=100)
    delta = models.TextField(500000)
    trunk = models.ForeignKey(Trunk, on_delete=models.CASCADE)
    
    def changes(self):
        return json.loads(self.delta)

    def __str__(self):
        return "{{id={}, to={}, by={}, at={}}}".format(self.id, self.trunk.name, self.device, self.posted)
