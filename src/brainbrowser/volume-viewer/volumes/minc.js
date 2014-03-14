/*
* BrainBrowser: Web-based Neurological Visualization Tools
* (https://brainbrowser.cbrain.mcgill.ca)
*
* Copyright (C) 2011 Alan Evans, McGill University 
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
* @author: Nicolas Kassis
* @author: Tarek Sherif
*/

(function() {
  "use strict";
     
  var VolumeViewer = BrainBrowser.VolumeViewer;

  function getHeaders(url, callback) {
    var request = new XMLHttpRequest();
    var status;
    var response_text;

    request.open("GET", url);
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
            "error loading URL: " + url + "\n" +
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
  function getData(url, callback){
    VolumeViewer.loader.loadArrayBuffer(url, function(data) {
      callback(data);
    });
  }
  
  // Prototype for minc volume.
  var minc_volume_proto = {
    slice: function(axis, number, time) {
      var slice = this.data.slice(axis, number, time);
      slice.color_map = this.color_map || VolumeViewer.color_maps[0];
      slice.min  = this.min;
      slice.max  = this.max;
      slice.axis = axis;

      slice.getImage = function(zoom) {
        zoom = zoom || 1;

        var context = document.createElement("canvas").getContext("2d");
        var color_map = this.color_map;
        var imageData = context.createImageData(this.width, this.height);
        color_map.mapColors(this.data, {
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

  VolumeViewer.volumes.minc = function(description, callback) {
    var volume = Object.create(minc_volume_proto);
    var data;
    volume.current_time = 0;
    
    
    getHeaders(description.header_url, function(headers) {
      getData(description.raw_data_url, function(arrayBuffer){
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
