#!/usr/bin/env node
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

/*
* Author: Tarek Sherif <tsherif@gmail.com> (http://tareksherif.ca/)
* Author: Nicolas Kassis
* Author: Paul Mougel
*/


"use strict";

var fs = require("fs");
var exec =  require("child_process").exec;
var spawn = require("child_process").spawn;
var version = "0.2";

var filename = process.argv[2];

if (filename === undefined) {
  printUsage();
  process.exit(0);
}

fs.exists(filename, function(exists) {

  if (!exists) {
    console.error("File " + filename + " does not exist.");
    process.exit(1);
  }

  fs.stat(filename, function(err, stat) {
    if (!stat.isFile()) {
      console.error(filename + " is not a valid file.");
      process.exit(1);
    }

    var basename = filename.match(/[^\/]+$/)[0];
    var rawDataStream, rawFileStream;

    console.log("Processing file:", filename);

    console.log("Creating header file: ", basename + ".header");
    getHeader(filename, function(header) {
      fs.writeFile(basename + ".header", JSON.stringify(header));
    });

    console.log("Creating raw data file: ", basename + ".raw");
    rawDataStream = getRawDataStream(filename);
    rawFileStream = fs.createWriteStream(basename + ".raw", { encoding: "binary" });
    rawDataStream.pipe(rawFileStream);
  });

});

  

///////////////////////////
// Helper functions
///////////////////////////

function printUsage() {
  console.log("minc2volume-viewer.js v" + version);
  console.log("\nUsage: node minc2volume-viewer.js <filename>\n");
}

function getRawDataStream(filename) {
  var minctoraw = spawn("minctoraw", ["-byte", "-unsigned", "-normalize", filename]);
  minctoraw.on("exit", function (code) {
    if (code === null || code !== 0) {
      checkExecutionError(new Error('Process minctoraw failed with error code ' + code));
    }
  });
  minctoraw.on("error", checkExecutionError);
  minctoraw.stdout.setEncoding("binary");
  return minctoraw.stdout;
}

function getHeader(filename, callback) {
  
  function getSpace(filename, header, space, callback) {
    header[space] = {};
    exec("mincinfo -attval " + space + ":start " + filename, function(error, stdout) {
      checkExecutionError(error);

      header[space].start = parseFloat(stdout);
      exec("mincinfo -dimlength " + space + " " + filename, function(error, stdout) {
        checkExecutionError(error);

        header[space].space_length = parseFloat(stdout);
        
        exec("mincinfo -attval " + space + ":step " + filename, function(error, stdout) {
          checkExecutionError(error);

          header[space].step = parseFloat(stdout);

          exec("mincinfo -attval " + space + ":direction_cosines " + filename, function(error, stdout) {
            checkExecutionError(error);

            var direction_cosines = stdout.replace(/^\s+/, "").replace(/\s+$/, "").split(/\s+/);

            if (direction_cosines.length > 1) {
              header[space].direction_cosines = direction_cosines.map(parseFloat);
            }

            callback(header);
          });
        });

      });

    });
  }

  function getOrder(header, filename, callback) {
    
    function handleOrder(order, callback) {
      header.order = order;
      
      if (order.length === 4) {
        exec("mincinfo -attval time:start " + filename, function(error, time_start) {
          checkExecutionError(error);

          exec("mincinfo -dimlength time " + filename, function(error, time_length) {
            checkExecutionError(error);

            header.time = {
              start: parseFloat(time_start),
              space_length: parseFloat(time_length)
            };
            callback(header);
          });
        });
      
      } else {
        callback(header);
      }
    
    }
    
    exec("mincinfo -attval image:dimorder " + filename, function(error, stdout) {
      var order = [];
      order = stdout.trim().split(",");
      
      if (order.length < 3 || order.length > 4) {
        exec("mincinfo -dimnames " + filename,function(error, stdout) {
          checkExecutionError(error);

          order = stdout.trim().split(" ");
          handleOrder(order, callback);
        });
      } else {
        handleOrder(order, callback);
      }
    
    });
  }

  function buildHeader(filename, callback) {
    var header = {};
   
    getOrder(header, filename, function(header) {
      getSpace(filename, header, "xspace", function(header) {
        getSpace(filename, header, "yspace", function(header) {
          getSpace(filename, header, "zspace",function(header) {
            if(header.order > 3) {
              getSpace(filename, header, "time", function(header) {
                callback(header);
              });
            } else {
              callback(header);
            }
          });
        });
      });
    });
  }

  buildHeader(filename, function(header) {
    if(header) {
      callback(header);
    } else {
      console.error("Bad header.");
    }
  });
}

function checkExecutionError(error) {
  if (error) {
    error = error.toString();
    if (error.match("not installed") || error.match("command not found")) {
      console.error("\nminc2volume-viewer.js requires that the MINC tools be installed.");
      console.error("Visit http://www.bic.mni.mcgill.ca/ServicesSoftware/MINC for more info.\n");
    } else {
      console.trace(error);
      console.error("Error: " + error);
    }
    process.exit(1);
  }
}
    
           
