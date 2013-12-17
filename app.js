"use strict";

/**
* Module dependencies.
*/

var express = require("express");
var routes = require("./routes/routes");
var http = require("http");
var path = require("path");
var hbs = require("hbs");
var fs = require("fs");
var zlib = require("zlib");
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
  app.get("/surface-viewer", routes.surface);
  app.get("/macacc-viewer", routes.macacc);
  app.get("/volume-viewer", routes.volume);
  app.get("/fmri-viewer", routes.fmri);
  app.get('/data/:filename', function(req,res) {
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
  
  app.get(/\.(obj|txt)$/, toGzip);
  
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
