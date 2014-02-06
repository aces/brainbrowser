/*
* BrainBrowser: Web-based Neurological Visualization Tools
* (https://brainbrowser.cbrain.mcgill.ca)
*
* Copyright (C) 2011 McGill University 
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

"use strict";

var fs = require("fs");
var pkg = require("../package.json");
var info = require("../canarie-rpi/info.json");

info.version = "BrainBrowser v" + pkg.version + ", Web Service v" + pkg.webServiceVersion;


exports.info = function(req, res) {

  res.format({
    html: function(){
      res.render("canarie/info", { info: info });
    },
    
    json: function(){
      res.type("application/json").send(JSON.stringify(info, null, 2));
    }
  });

};

exports.stats = function(req, res) {
  fs.readFile("canarie-rpi/stats.json", { encoding: "utf8" }, function(err, data) {
    var stats;

    if (err) {
      stats = {
        invocations: 0,
        lastReset: new Date().toISOString().replace(/\.\d+Z/, "Z")
      };
    } else {
      stats = JSON.parse(data);
    }
    res.type("application/json").send(JSON.stringify(stats, null, 2));
  });
};

exports.doc = function(req, res) {
  res.redirect("https://brainbrowser.cbrain.mcgill.ca/#web-service");
};

exports.releasenotes = function(req, res) {
  res.redirect("https://brainbrowser.cbrain.mcgill.ca/#web-service");
};

exports.support = function(req, res) {
  res.redirect("https://brainbrowser.cbrain.mcgill.ca/#credits");
};

exports.source = function(req, res) {
  res.status(204).send("Not available.");
};

exports.tryme = function(req, res) {
  res.redirect("https://brainbrowser.cbrain.mcgill.ca/surface-viewer");
};

exports.license = function(req, res) {
  fs.readFile("LICENSE", { encoding: "utf8" }, function(err, data) {
    res.type("text/plain").send(data);
  });
};


