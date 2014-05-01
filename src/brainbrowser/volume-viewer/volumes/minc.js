/*
* BrainBrowser: Web-based Neurological Visualization Tools
* (https://brainbrowser.cbrain.mcgill.ca)
*
* Copyright (C) 2011
* The Royal Institution for the Advancement of Learning
* McGill University
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
  
  // Prototype for minc volume.
  var minc_volume_proto = {
    slice: function(axis, number, time) {
      var slice = this.data.slice(axis, number, time);
      slice.color_map = this.color_map;
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

  VolumeViewer.volume_loaders.minc = function(description, callback) {
    
    if (description.header_url && description.raw_data_url) {
      BrainBrowser.loader.loadFromURL(description.header_url, function(header_text) {
        parseHeader(header_text, function(header) {
          BrainBrowser.loader.loadFromURL(description.raw_data_url, function(raw_data) {
            createMincVolume(header, raw_data, callback);
          }, { result_type: "arraybuffer" });
        })
      });
    } else if (description.header_file && description.raw_data_file) {
      BrainBrowser.loader.loadFromFile(description.header_file, function(header_text) {
        parseHeader(header_text, function(header) {
          BrainBrowser.loader.loadFromFile(description.raw_data_file, function(raw_data) {
            createMincVolume(header, raw_data, callback);
          }, { result_type: "arraybuffer" });
        })
      });
    } else {
      throw new Error("invalid volume description");
    }
    
  };

  function parseHeader(header_text, callback) {
    var header;

    try{
      header = JSON.parse(header_text);
    } catch(error) {
      throw new Error(
        "server did not respond with valid JSON" + "\n" +
        "Response was: \n" + header_text
      );
    }

    if (BrainBrowser.utils.isFunction(callback)) {
      callback(header);
    }
  }

  function createMincVolume(header, raw_data, callback){
    var volume = Object.create(minc_volume_proto);

    volume.current_time = 0;
    volume.data = VolumeViewer.mincData(header, new Uint8Array(raw_data));
    volume.header = volume.data.header;
    volume.min = 0;
    volume.max = 255;
    
    if (BrainBrowser.utils.isFunction(callback)) {
      callback(volume);
    } 
  }
   
}());
