"use strict";

/**
 * Module dependencies.
 */

var express = require("express");
var routes = require("./routes/routes");
var http = require("http");
var path = require("path");
var hbs = require("hbs");
var minc = require('./lib/minc-server');
var cluster = require("cluster");

var num_instances = +process.argv[2] || 1;
var i;

function toGzip(req, res, next) {
  req.url = req.url + '.gz';
  res.set('Content-Encoding', 'gzip');
  next();
}

if (cluster.isMaster) {
  for (i = 0; i < num_instances; i++) {
    cluster.fork();
  }
  
  cluster.on("exit", function() {
    cluster.fork();
  });
} else {
  var app = express();

  // all environments
  app.set("port", process.env.PORT || 5000);
  app.set("views", __dirname + "/views");
  app.set("view engine", "hbs");
  app.use(express.compress());
  app.use(express.favicon("public/img/brainbrowser.png"));
  app.use(express.logger("dev"));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  
  // development only
  if (app.get("env") === "production") {
    app.use(express.static(path.join(__dirname, "public", "production")));
  } else {
    app.use(express.static(path.join(__dirname, "public", "development")));
    app.use(express.errorHandler());
  }
  app.use(express.static(path.join(__dirname, "public", "common")));
  
  app.get("/", routes.index);
  app.get("/about", routes.about);
  app.get("/credits", routes.credits);
  app.get("/surfview", routes.surfview);
  app.get("/macaccview", routes.macaccview);
  app.get("/braincanvas", routes.braincanvas);
  app.get('/data/:filename', function(req,res) {
    if(req.params.filename) {
      var filename = req.params.filename;
      filename = filename.match(/^[\w|-]*\.\w*$/) ?
                 "./data/" + filename :
                 "";
      if (req.query.raw_data) {
        if (filename) {
          minc.getRawData(filename,function(data) {
            if (data) {
              res.contentType('text/plain');
              res.end(data, 'binary');
            } else {
              res.send('Error occured getting the raw data from minc file', 500);
            }
          });
        }
      } else if (req.query.minc_headers) {
        minc.getHeaders(filename,function(headers) {
          console.log("finish building headers");
          res.send(headers);
        },
        function(err) {
          res.send(err, 500);
        });
      } else {
        res.send('Bad resquest', 400);
      }
    } else {
      res.send('Bad filename', 400);
    }
  });
  
  app.get(/\.(obj|txt|mnc)$/, toGzip);
  
  hbs.registerPartials(__dirname + '/views/partials');
  
  hbs.registerHelper("ifenv", function(env, val, options) {
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
