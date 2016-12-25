// Copyright 2016-2017 Danylo Vashchilenko
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const url = require('url');
const winston = require('winston');

module.exports = function(rules, defaultHandler) {
  if(rules === undefined) throw new Error("Missing rules for router initialization!");
  if(defaultHandler === undefined) throw new Error("Missing default handler for unmapped requests!");

  winston.info(`Created router with ${rules.length} rule(s).`);

  return (req, res) => {
    const urlp = url.parse(req.url);

    for(var rule of rules) {
      // Method criterion
      if(rule.method !== undefined && rule.method !== req.method) {
        continue;
      }

      var pathVars;
      // Path pattern criterion
      if(rule.path !== undefined) {
        const pathTrial = pathTest(rule.path, urlp.pathname);
        if(!pathTrial) continue;
        pathVars = pathTrial;
      }

      const newReq = {
        httpRequest: req,
        url: urlp,
        method: req.method,
        pathVars: pathVars
      };

      // This rule is applicable
      return rule.handler(newReq, res);
    }

    // No applicable rule found
    return defaultHandler(req, res);
  };
};

function parsePattern(pattern) {
  var cmps = pattern.split("/");
  var vars = [];

  // Removing emptiness before heading slash
  cmps.shift();

  cmps = cmps.map(c => {
    const trial = /^{(.*)}$/.exec(c);
    // If a pattern variable found
    if(trial) {
      // Replace with a regex capture group
      vars.push(trial[1]);
      return "([^\\/]+)";
    } else {
      return c;
    }
  });

  const regex = new RegExp("^/" + cmps.join("\\/") + "$");

  return {regex: regex, vars: vars};
}

function pathTest(pattern, path) {
  const parsed = parsePattern(pattern);
  const result = parsed.regex.exec(path);
  if(result === null) {
    return false;
  }

  if(parsed.vars.length === 0) return {};

  const bound = parsed.vars.map((k,i) => ({[k]: parsed.values[i]}));
  return Object.assign.apply(null, bound);
}
