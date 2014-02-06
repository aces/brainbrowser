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

var express = require("express");
var routes = require("./routes/routes");
var http = require("http");
var path = require("path");
var hbs = require("hbs");
var fs = require("fs");
var zlib = require("zlib");
var minc = require('./lib/minc-server');
var cluster = require("cluster");
var canarie_service = require("./routes/canarie-rpi-routes");

var MAX_INT = Math.pow(2, 32);

var num_instances = +process.argv[2] || 1;

if (cluster.isMaster) {
  while (num_instances--) {
    cluster.fork();
  }
  
  cluster.on("exit", function() {
    cluster.fork();
  });
} else {
  var app = express();

  app.set("port", process.env.PORT || 5000);
  app.set("views", __dirname + "/views");
  app.set("view engine", "hbs");
  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    return next();
  });
  app.use(express.compress());
  app.use(express.favicon("public/img/brainbrowser.png"));
  app.use(express.logger("dev"));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  
  if (app.get("env") === "production") {
    app.use(express.static(path.join(__dirname, "public", "production")));
  } else {
    app.use(express.static(path.join(__dirname, "public", "development")));
    app.use(express.errorHandler());
  }
  app.use(express.static(path.join(__dirname, "public", "common")));
  
  app.get("/", routes.index);
  app.get("/surface-viewer", routes.surface);
  app.get("/macacc-viewer", routes.macacc);
  app.get("/volume-viewer", routes.volume);
  app.get("/fmri-viewer", routes.fmri);
  app.get("/surface-viewer-widget", function(req, res) {
    fs.readFile("canarie-rpi/stats.json", { encoding: "utf8" }, function(err, data) {
      var stats;

      try {
        if (err) {
          stats = {
            invocations: 0,
            lastReset: new Date().toISOString()
          };
        } else {
          stats = JSON.parse(data);
        }

        stats.invocations++;

        if (stats.invocations > MAX_INT) {
          stats.invocations = 0;
          stats.lastReset = new Date().toISOString().replace(/\.\d+Z/, "Z");;
        }

        fs.writeFile("canarie-rpi/stats.json", JSON.stringify(stats, null, 2));

      } catch (e) {
        console.log(e);
        console.error("Error updating stats file.");
      }

    });

    routes.surface_widget(req, res);
  });

  app.get('/data/:filename', function(req, res) {
    var filename = req.params.filename;
    var raw_filename, gz_raw_filename, header_filename;
    var gzip = zlib.createGzip();
    
    if(!filename) {
      res.send('File name not provided.', 400);
      return;
    }
  
    if (!filename.match(/^[\w-\.]+\.mnc$/i)) {
      res.send('Invalid file name: ' + filename, 400);
      return;
    }
    
    filename = "./data/" + filename;

    if (req.query.raw_data) {
      raw_filename = filename + ".raw";
      gz_raw_filename = raw_filename + ".gz";
      
      fs.exists(gz_raw_filename, function(exists) {
        if (exists) {
          console.log("Sending cached raw file.");
          fs.readFile(gz_raw_filename, function(err, data) {
            res.set('Content-Encoding', 'gzip');
            res.end(data, 'binary');
          });
        } else {
          console.log("Creating raw file.");
          minc.getRawData(filename,function(data) {
            if (data) {
              res.contentType('text/plain');
              res.end(data, 'binary');
              gzip.pipe(fs.createWriteStream(gz_raw_filename));
              gzip.end(data, "binary");
            } else {
              res.send('Error occured getting the raw data from minc file', 500);
            }
          });
        }
      });
    } else {
      header_filename = filename + ".headers";
      
      fs.exists(header_filename, function(exists) {
        if (exists) {
          console.log("Sending cached headers.");
          fs.readFile(header_filename, function(err, headers) {
            res.send(headers);
          });
        } else {
          console.log("Creating headers.");
          minc.getHeaders(filename, function(headers) {
            res.send(headers);
            fs.writeFile(header_filename, JSON.stringify(headers));
          },
          function(err) {
            res.send(err, 500);
          });
        }
      });
    }
  });
  
  app.get(/\.(obj|txt|asc)$/, function(req, res, next) {
    req.url = req.url + '.gz';
    res.set('Content-Encoding', 'gzip');
    next();
  });

  app.get("/service/:service_name", function(req, res, next) {
    var service_name = req.params.service_name;
    service_name = service_name === "provenance" ? "info" : service_name;

    if (canarie_service.hasOwnProperty(service_name) && 
          typeof canarie_service[service_name] === "function") {
      canarie_service[service_name](req, res);
    } else {
      next();
    }
  });
  
  hbs.registerPartials(__dirname + '/views/partials');
  
  hbs.registerHelper("ifenv", function(val, options) {
    if (app.get("env") === val) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });
  
  
  http.createServer(app).listen(app.get("port"), function(){
    console.log("BrainBrowser started in " + (app.get("env") || "development") + " mode");
    console.log("Listening on port " + app.get("port"));
  });
}
