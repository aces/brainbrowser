/*
 * Copyright (C) 2011 McGill University
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/*
* @author: Nicolas Kassis
* @author: Tarek Sherif
*/

(function() {
  "use strict";
     
  var VolumeViewer = BrainBrowser.VolumeViewer;

  /**
   * Fetch the parameters of the minc file. sends a request to http://filename/?minc_headers=true or whatever getHeadersParams says
   * @param {String} filename url/filename of the file to load minc headers
   */
  function getHeaders(filename, header_params, callback) {
    var request = new XMLHttpRequest();
    var status;
    var response_text;

    Object.keys(header_params).forEach(function(k) {
      filename += (filename.match(/\?/) ? "&" : "?") +
                  k + "=" + header_params[k];
    });

    request.open("GET", filename);
    request.onreadystatechange = function() {
      if (request.readyState === 4){
        status = request.status;

        // Based on jQuery's "success" codes.
        if(status >= 200 && status < 300 || status === 304) {
          try{
            response_text = JSON.parse(request.response);
          } catch(error) {
            throw new Error(
              "server did not respond with valid JSON" + "\n" +
              "Response was: \n" + request.response
            );
          }
          if (callback) callback(response_text);
        } else {
          throw new Error(
            "error loading URL: " + filename + "\n" +
            "HTTP Response: " + request.status + "\n" +
            "HTTP Status: " + request.statusText + "\n" +
            "Response was: \n" + request.response
          );
        }
      }
    };
    request.send();

  }

  /**
   * Make request to server for Minc file's data block.
   * @param {String}    filename  url/filename of the minc file
   * @param {Function}  callback  function to call when data is done loading
   * @param {Object}    extraArgs with extraArgs to pass to callback when data is done loading
   */
  function getData(filename, raw_data_params, callback){
    Object.keys(raw_data_params).forEach(function(k) {
      filename += (filename.match(/\?/) ? "&" : "?") +
                  k + "=" + raw_data_params[k];
    });
    VolumeViewer.loader.loadArrayBuffer(filename, function(data) {
      callback(data);
    });
  }
  
  // Prototype for minc volume.
  var minc_volume_proto = {
    slice: function(axis, number, time) {
      var slice = this.data.slice(axis, number, time);
      slice.colorScale = this.colorScale || VolumeViewer.colorScales[0];
      slice.min  = this.min;
      slice.max  = this.max;
      slice.axis = axis;

      slice.getImage = function(zoom) {
        zoom = zoom || 1;

        var context = document.createElement("canvas").getContext("2d");
        var colorScale = this.colorScale;
        var imageData = context.createImageData(this.width, this.height);
        colorScale.mapColors(this.data, {
          min: this.min,
          max: this.max,
          scale255: true,
          brightness: 0,
          contrast: 1,
          alpha: this.alpha,
          destination: imageData.data
        });
  
        var xstep = this.x.step;
        var ystep = this.y.step;
        return VolumeViewer.utils.nearestNeighbor(imageData, Math.floor(this.width * xstep * zoom), Math.floor(this.height * ystep * zoom));
      };
      
      return slice;
    },
    
    getVoxelCoords: function() {
      return {
        x: this.position.xspace,
        y: this.position.yspace,
        z: this.position.zspace
      };
    },
    
    setVoxelCoords: function(x, y, z) {
      this.position.xspace = x;
      this.position.yspace = y;
      this.position.zspace = z;
    },
    
    getWorldCoords: function() {
      return {
        x: this.data.xspace.start + this.position.xspace * this.data.xspace.step,
        y: this.data.yspace.start + this.position.yspace * this.data.yspace.step,
        z: this.data.zspace.start + this.position.zspace * this.data.zspace.step
      };
    },
    setWorldCoords: function(x, y, z) {
      this.position.xspace = Math.floor((x - this.data.xspace.start) / this.data.xspace.step);
      this.position.yspace = Math.floor((y - this.data.yspace.start) / this.data.yspace.step);
      this.position.zspace = Math.floor((z - this.data.zspace.start) / this.data.zspace.step);
    }
  };

  VolumeViewer.volumeType.minc = function(description, callback) {
    var volume = Object.create(minc_volume_proto);
      //What get parameter will be used in request to server
    var raw_data_params = description.raw_data_params || { raw_data: true };
    var header_params = description.header_params || { minc_headers : true };
    var data;
    volume.current_time = 0;
    
    
    getHeaders(description.filename, header_params, function(headers) {
      getData(description.filename, raw_data_params, function(arrayBuffer){
        data =  new Uint8Array(arrayBuffer);
        volume.data = VolumeViewer.mincData(description.filename, headers, data);
        volume.header = volume.data.header;
        volume.min = 0;
        volume.max = 255;
        if (callback) callback(volume);
      });
    });
  };
   
}());
