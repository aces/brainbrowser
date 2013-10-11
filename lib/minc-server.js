"use strict";

var exec =  require('child_process').exec;
/**
 * get Minc file raw data 
 * @param {String} filename
 * @param {Function} callback
 */
function getRawData(filename, callback) {
  exec("minctoraw -byte -unsigned -normalize " + filename, {encoding: 'binary', maxBuffer: 524288000}, function(error, stdout) {
    callback(stdout);
  });
}

exports.getRawData = getRawData;

function getHeaders(filename, callback, errcallback) {
  
  function getSpace(filename, headers, space, callback) {
    console.log("getSpace " + space);
    headers[space] = {};
    exec("mincinfo -attval " +space+":start " + filename,function(error, stdout) {
      headers[space].start = parseFloat(stdout);
      exec("mincinfo -dimlength " + space + " " + filename,function(error, stdout) {
        headers[space].space_length = +stdout;
        exec("mincinfo -attval " +space+":step " + filename,function(error, stdout) {
          headers[space].step = parseFloat(stdout);
          callback(headers);
        });
      });
    });
  }

  function getOrder(headers, filename, callback) {
    function handleOrder(order,callback) {
      headers.order = order;
      return callback(headers);
    }
    exec("mincinfo -attval image:dimorder " + filename, function(error, stdout) {
      var order = [];

      order = stdout.trim().split(",");
      console.log(order);
      if(order < 3) {
        exec("mincinfo -dimnames " + filename,function(error, stdout) {
          order = stdout.trim().split(" ");
          console.log(order);
          handleOrder(order,callback);
        });
      } else {
        handleOrder(order,callback);
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
           
