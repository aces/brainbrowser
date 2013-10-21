/*
 * Copyright (c) 2011-2012, McGill University
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *   * Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *   * Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *   * Neither the name of McGill University nor the
 *     names of its contributors may be used to endorse or promote products
 *     derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL McGill University  BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/*
 * Author: Nicolas Kassis <nic.kassis@gmail.com>
 */

/**
 * Library to encapsulate Minc. 
 * It request the parameters needed and then request the data block from the server
 * The data block is a binary array
 * The library can fetch slices in one of the three axese
 * @constructor
 * @param {string}   filename  File name or url of minc file
 * @param {object}   extraArgs object for extra arguments
 * @param {function} callback  function to call when data is finish loading 
 */

(function() {
  "use strict";
     
  /**
   * Fetch the parameters of the minc file. sends a request to http://filename/?minc_headers=true or whatever getHeadersParams says
   * @param {String} filename url/filename of the file to load minc headers
   */
  var getHeaders = function(filename, getParam, callback) {
    var param = getParam.split('=');
    var dataArgs = {};
    
    dataArgs[param[0]] = param[1];
    
    $.ajax({
      url: filename,
      dataType: 'json',
      data: dataArgs,
      success: function(data){
        if (callback) callback(data);
      },
      error: function(request, textStatus) {
        throw {
          request: request,
          textStatus: textStatus
        };
      }
    });
  };

  /**
   * Make request to server for Minc file's data block. 
   * @param {String}    filename  url/filename of the minc file
   * @param {Function}  callback  function to call when data is done loading
   * @param {Object}    extraArgs with extraArgs to pass to callback when data is done loading
   */
  var getData = function (filename, getRawDataParam, callback){
    filename += filename.match(/\?/) ? "&" : "?";
    filename += getRawDataParam;
    
    BrainCanvas.loader.loadArrayBuffer(filename, function(data) {
      callback(data);
    });
    
  };
  

  BrainCanvas.volumeType.minc = function(opt, callback) {
    var volume = {};
      //What get parameter will be used in request to server
    var getRawDataParam = opt.getRawDataParam || "raw_data=true";
    var getHeaderParam = opt.getHeaderParam || "minc_headers=true";
    var headers, data;
    volume.current_time = 0;
    
    volume.slice = function(axis, number, time) {
      var slice = volume.data.slice(axis, number, time);
      slice.colorScale = volume.colorScale || BrainCanvas.colorScales[0];
      slice.min   = volume.min;
      slice.max   = volume.max;
      slice.axis = axis;

      slice.getImage = function(zoom) {
        var context = document.createElement("canvas").getContext("2d");
        var colorScale = this.colorScale;
        var imageData = context.createImageData(this.width, this.height);
        colorScale.colorizeArray(this.data, this.min, this.max, true, 0, 1, this.alpha, imageData.data);
  
        var xstep = this.x.step;
        var ystep = this.y.step;
        return BrainCanvas.utils.nearestNeighboor(imageData, Math.floor(this.width * xstep * zoom), Math.floor(this.height * ystep * zoom));
      };
      
      return slice;
    };
    
    volume.getVoxelCoords = function() {
      return {
        x: this.position.xspace,
        y: this.position.yspace,
        z: this.position.zspace
      };
    };
    
    volume.setVoxelCoords = function(x, y, z) {
      this.position.xspace = x;
      this.position.yspace = y;
      this.position.zspace = z;
    };
    
    volume.getWorldCoords = function() {
      return {
        x: this.data.xspace.start + this.position.xspace * this.data.xspace.step,
        y: this.data.yspace.start + this.position.yspace * this.data.yspace.step,
        z: this.data.zspace.start + this.position.zspace * this.data.zspace.step
      };
    };
    
    volume.setWorldCoords = function(x, y, z) {
      this.position.xspace = Math.floor((x - this.data.xspace.start) / this.data.xspace.step);
      this.position.yspace = Math.floor((y - this.data.yspace.start) / this.data.yspace.step);
      this.position.zspace = Math.floor((z - this.data.zspace.start) / this.data.zspace.step);
    };
    
    getHeaders(opt.filename,getHeaderParam, function(headerData) {
      headers = headerData;
      getData(opt.filename,getRawDataParam,function(arrayBuffer){
        data =  new Uint8Array(arrayBuffer);
        volume.data = new BrainCanvas.MincJS(opt.filename, headers, data);
        volume.header = volume.data.header;
        volume.min = 0;
        volume.max = 255;
        if (callback) callback(volume);
      });
      
    });
  };
   
}());
