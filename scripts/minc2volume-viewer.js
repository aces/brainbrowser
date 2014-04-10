#!/usr/local/bin/node

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
* Author: Tarek Sherif  <tsherif@gmail.com> (http://tareksherif.ca/)
* Author: Nicolas Kassis
*/


"use strict";

var fs = require("fs");
var exec =  require("child_process").exec;
var version = "0.1"

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

    console.log("Processing file:", filename);

    console.log("Creating headers file.")
    getHeaders(filename, function(headers) {
      console.log("Writing headers file: ", basename + ".headers");
      fs.writeFile(basename + ".headers", JSON.stringify(headers));
    });

    console.log("Creating raw data file.")
    getRawData(filename, function(data) {
      console.log("Writing raw data file: ", basename + ".raw");
      fs.writeFile(basename + ".raw", data, { encoding: "binary" });
    });  
  })

});

  

///////////////////////////
// Helper functions
///////////////////////////

function printUsage() {
  console.log("minc2volume-viewer.js v" + version);
  console.log("\nUsage: node minc2volume-viewer.js <filename>\n");
}

function getRawData(filename, callback) {
  exec("minctoraw -byte -unsigned -normalize " + filename, { encoding: "binary", maxBuffer: 524288000 }, function(error, stdout) {
    checkExecutionError(error);
    callback(stdout);
  });
}

function getHeaders(filename, callback) {
  
  function getSpace(filename, headers, space, callback) {
    headers[space] = {};
    exec("mincinfo -attval " + space + ":start " + filename, function(error, stdout) {
      checkExecutionError(error);

      headers[space].start = parseFloat(stdout);
      exec("mincinfo -dimlength " + space + " " + filename, function(error, stdout) {
        checkExecutionError(error);

        headers[space].space_length = parseFloat(stdout);
        
        exec("mincinfo -attval " + space + ":step " + filename, function(error, stdout) {
          checkExecutionError(error);

          headers[space].step = parseFloat(stdout);
          callback(headers);
        });

      });

    });
  }

  function getOrder(headers, filename, callback) {
    
    function handleOrder(order, callback) {
      headers.order = order;
      
      if (order.length === 4) {
        exec("mincinfo -attval time:start " + filename, function(error, time_start) {
        checkExecutionError(error);

          exec("mincinfo -dimlength time " + filename, function(error, time_length) {
            checkExecutionError(error);

            headers.time = {
              start: parseFloat(time_start),
              space_length: parseFloat(time_length)
            };
            callback(headers);
          });
        });
      
      } else {
        callback(headers);
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

  function buildHeaders(filename, callback) {
    var headers = {};
   
    getOrder(headers, filename, function(headers) {
      getSpace(filename,headers, "xspace", function(headers) {
        getSpace(filename,headers, "yspace", function(headers) {
          getSpace(filename,headers, "zspace",function(headers) {
            if(headers.order > 3) {
              getSpace(filename, headers, "time", function(headers) {
                callback(headers);
              });
            } else {
              callback(headers);
            }
          });
        });
      });
    });
  }

  buildHeaders(filename, function(headers) {
    if(headers) {
      callback(headers);
    } else {
      console.error("Bad headers.");
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
    
           
