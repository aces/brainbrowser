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

var exec =  require('child_process').exec;

function getRawData(filename, callback) {
  exec("minctoraw -byte -unsigned -normalize " + filename, {encoding: 'binary', maxBuffer: 524288000}, function(error, stdout) {
    console.log("minctoraw run on " + filename);
    if (error) {
      console.log("Error: " + error);
    }
    callback(stdout);
  });
}

exports.getRawData = getRawData;

function getHeaders(filename, callback, errcallback) {
  
  function getSpace(filename, headers, space, callback) {
    console.log("getSpace " + space);
    headers[space] = {};
    exec("mincinfo -attval " + space + ":start " + filename, function(error, stdout) {
      headers[space].start = parseFloat(stdout);
      exec("mincinfo -dimlength " + space + " " + filename, function(error, stdout) {
        headers[space].space_length = +stdout;
        exec("mincinfo -attval " + space + ":step " + filename, function(error, stdout) {
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
          exec("mincinfo -dimlength time " + filename, function(error, time_length) {
            headers.time = {
              start: +time_start.trim(),
              space_length: +time_length.trim()
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
      console.log(order);
      if (order.length < 3 || order.length > 4) {
        exec("mincinfo -dimnames " + filename,function(error, stdout) {
          order = stdout.trim().split(" ");
          console.log(order);
          handleOrder(order, callback);
        });
      } else {
        handleOrder(order, callback);
      }
    });
  }

  function buildHeaders(filename,callback) {
    var headers = {};
   
    getOrder(headers, filename, function(headers) {
      getSpace(filename,headers,"xspace",function(headers) {
        getSpace(filename,headers,"yspace",function(headers) {
          getSpace(filename,headers,"zspace",function(headers) {
            if(headers.order > 3) {
              console.log("finished");
              getSpace(filename,headers,"time",function(headers) {
                callback(headers);
              });
            } else {
              console.log("finished");
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
      errcallback("bad headers");
    }
  });
}
        
exports.getHeaders = getHeaders;
           
