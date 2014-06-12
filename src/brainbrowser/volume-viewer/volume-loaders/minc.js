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
* Author: Nicolas Kassis
* Author: Tarek Sherif <tsherif@gmail.com> (http://tareksherif.ca/)
*/

(function() {
  "use strict";
     
  var VolumeViewer = BrainBrowser.VolumeViewer;
  
  // Prototype for minc volume.
  var minc_volume_proto = {
    slice: function(axis, slice_num, time) {
      slice_num = slice_num === undefined ? this.position[axis] : slice_num;
      time = time === undefined ? this.current_time : time;
      
      var slice = this.data.slice(axis, slice_num, time);

      slice.color_map = this.color_map;
      slice.min  = this.min;
      slice.max  = this.max;
      slice.axis = axis;

      slice.getImage = function(zoom) {
        zoom = zoom || 1;

        var context = document.createElement("canvas").getContext("2d");
        var color_map = slice.color_map;
        var imageData = context.createImageData(slice.width, slice.height);
        color_map.mapColors(slice.data, {
          min: slice.min,
          max: slice.max,
          scale255: true,
          brightness: 0,
          contrast: 1,
          alpha: slice.alpha,
          destination: imageData.data
        });

        var xstep = slice.width_space.step;
        var ystep = slice.height_space.step;
        return VolumeViewer.utils.nearestNeighbor(imageData, Math.floor(slice.width * xstep * zoom), Math.floor(slice.height * ystep * zoom));
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
      return this.voxelToWorld(this.position.xspace, this.position.yspace, this.position.zspace);
    },
    
    setWorldCoords: function(x, y, z) {
      var voxel = this.worldToVoxel(x, y, z);

      this.position.xspace = voxel.x;
      this.position.yspace = voxel.y;
      this.position.zspace = voxel.z;
    },

    // Voxel to world matrix applied here is:
    // cxx * stepx | cxy * stepx | cxz * stepx | ox
    // cyx * stepy | cyy * stepy | cyz * stepy | oy
    // czx * stepz | czy * stepz | czz * stepz | oz
    // 0           | 0           | 0           | 1
    //
    // Taken from (http://en.wikibooks.org/wiki/MINC/Reference/MINC2.0_File_Format_Reference)
    voxelToWorld: function(x, y, z) {
      var cx = this.data.xspace.direction_cosines;
      var cy = this.data.yspace.direction_cosines;
      var cz = this.data.zspace.direction_cosines;
      var stepx = this.data.xspace.step;
      var stepy = this.data.yspace.step;
      var stepz = this.data.zspace.step;
      var o = this.data.voxel_origin;

      return {
        x: x * cx[0] * stepx + y * cx[1] * stepx + z * cx[2] * stepx + o.x,
        y: x * cy[0] * stepy + y * cy[1] * stepy + z * cy[2] * stepy + o.y,
        z: x * cz[0] * stepz + y * cz[1] * stepz + z * cz[2] * stepz + o.z
      };
    },

    // World to voxel matrix applied here is:
    // cxx / stepx | cyx / stepy | czx / stepz | -ox * cxx / stepx - oy * cyx / stepy - oz * czx / stepz
    // cxy / stepx | cyy / stepy | czy / stepz | -ox * cxy / stepx - oy * cyy / stepy - oz * czy / stepz
    // cxz / stepx | cyz / stepy | czz / stepz | -ox * cxz / stepx - oy * cyz / stepy - oz * czz / stepz
    // 0           | 0           | 0           | 1
    //
    // Inverse of the voxel to world matrix.
    worldToVoxel: function(x, y, z) {
      var cx = this.data.xspace.direction_cosines;
      var cy = this.data.yspace.direction_cosines;
      var cz = this.data.zspace.direction_cosines;
      var stepx = this.data.xspace.step;
      var stepy = this.data.yspace.step;
      var stepz = this.data.zspace.step;
      var o = this.data.voxel_origin;
      var tx = -o.x * cx[0] / stepx - o.y * cy[0] / stepy - o.z * cz[0] / stepz;
      var ty = -o.x * cx[1] / stepx - o.y * cy[1] / stepy - o.z * cz[1] / stepz;
      var tz = -o.x * cx[2] / stepx - o.y * cy[2] / stepy - o.z * cz[2] / stepz;

      return {
        x: Math.floor(x * cx[0] / stepx + y * cy[0] / stepy + z * cz[0] / stepz + tx),
        y: Math.floor(x * cx[1] / stepx + y * cy[1] / stepy + z * cz[1] / stepz + ty),
        z: Math.floor(x * cx[2] / stepx + y * cy[2] / stepy + z * cz[2] / stepz + tz)
      };
    }
  };

  // Prototype for the minc volume's data object.
  var minc_data_proto = {
    // Warning: This function can get a little crazy
    // We are trying to get a slice out of the array. To do this we need to be careful this
    // we check for the orientation of the slice (steps positive or negative affect the orientation)
    slice: function(axis, number, time) {
      var slice;
      var cached_slices = this.cached_slices;
      var order0 = this[this.order[0]];
      time = time || 0;
      
      cached_slices[axis] = cached_slices[axis] || [];
      cached_slices[axis][time] =  cached_slices[axis][time] || [];
      
      if(this[axis].step < 0) {
        number = this[axis].space_length - number;
      }
      
      if(cached_slices[axis][time][number] !== undefined) {
        slice = cached_slices[axis][time][number];
        slice.alpha = 1;
        slice.number = number;
        return slice;
      }
      
      if(this.order === undefined ) {
        return false;
      }
      
      var time_offset = 0;
      
      if(this.time) {
        time_offset = time * order0.height * order0.width * parseFloat(order0.space_length);
      }
      
      
      var length_step = this[axis].width_space.step;
      var height_step = this[axis].height_space.step;
      slice = {};
      var slice_data;
      var slice_length, height, row_length, element_offset, row_offset, slice_offset;
      var i, j, k;
      
      if(this.order[0] === axis) {
        slice_length = this[axis].height*this[axis].width;
        height = this[axis].height;
        row_length = this[axis].width;
        element_offset = 1;
        row_offset = row_length;
        slice_offset = slice_length;
        slice_data = new Uint16Array(slice_length);
        
        if(length_step > 0) {
          if(height_step > 0) {
            for (i = 0; i < slice_length; i++) {
              slice_data[i]=this.data[time_offset+ slice_offset*number+i];
            }
          } else {
            for(i = height; i > 0; i--) {
              for(j = 0; j < row_length; j++) {
                slice_data[(height-i)*row_length+j] = this.data[time_offset+slice_offset*number+i*row_length + j];
              }
            }
          }
        } else {
          if(height_step < 0) {
            for(i = 0; i < height; i++) {
              for(j = 0; j < row_length; j++) {
                slice_data[i*row_length+j] = this.data[time_offset+slice_offset*number+i*row_length + row_length - j];
              }
            }
          } else {
            for(i = height; i > 0; i--) {
              for(j = 0; j < row_length; j++) {
                slice_data[(height-i)*row_length+j] = this.data[time_offset+slice_offset*number+i*row_length + row_length - j];
              }
            }
          }
        }
        
      } else if (this.order[1] === axis ) {
        
        height = this[axis].height;
        slice_length = this[axis].height*this[axis].width;
        row_length = this[axis].width;
        element_offset = 1;
        row_offset = order0.slice_length;
        slice_offset = order0.width;
        slice_data = new Uint8Array(slice_length);
        
        
        if(height_step < 0) {
          for(j = 0; j<height; j++) {
            for(k = 0; k< row_length; k++){
              slice_data[j*(row_length)+k] = this.data[time_offset+number*slice_offset+row_offset*k+j];
            }
          }
        } else {
          for (j = height; j >= 0; j--) {
            for(k = 0; k < row_length; k++) {
              slice_data[(height-j)*(row_length)+k] = this.data[time_offset+number*slice_offset+row_offset*k+j];
            }
          }
        }
        
        
      } else {
        height = this[axis].height;
        slice_length = this[axis].height*this[axis].width;
        row_length = this[axis].width;
        element_offset = order0.slice_length;
        row_offset= order0.width;
        slice_offset = 1;
        slice_data = new Uint16Array(slice_length);
        
        
        
        
        for ( j = 0; j < height; j++) {
          for( k = 0; k < row_length; k++){
            slice_data[j*row_length+k] = this.data[time_offset+number+order0.width*j+k*order0.slice_length];
          }
        }
      }
      
      //set the spaces on each axis
      slice.width_space = this[axis].width_space;
      slice.height_space = this[axis].height_space;
      slice.width = row_length;
      slice.height = height;
      
      
      //Checks if the slices need to be rotated
      //xspace should have yspace on the x axis and zspace on the y axis
      if(axis === "xspace" && this.xspace.height_space.name === "yspace"){
        if (this.zspace.step < 0){
          slice_data = VolumeViewer.utils.rotateUint16Array90Right(slice_data,slice.width,slice.height);
        } else {
          slice_data = VolumeViewer.utils.rotateUint16Array90Left(slice_data,slice.width,slice.height);
        }
        slice.width_space = this[axis].height_space;
        slice.height_space = this[axis].width_space;
        slice.width = height;
        slice.height = row_length;
        
      }
      //yspace should be XxZ
      if(axis === "yspace" && this.yspace.height_space.name === "xspace"){
        if(this.zspace.step < 0){
          slice_data = VolumeViewer.utils.rotateUint16Array90Right(slice_data,slice.width,slice.height);
        }else {
          slice_data = VolumeViewer.utils.rotateUint16Array90Left(slice_data,slice.width,slice.height);
        }
        slice.width_space = this[axis].height_space;
        slice.height_space = this[axis].width_space;
        slice.width = height;
        slice.height = row_length;
        
      }
      //zspace should be XxY
      if(axis === "zspace" && this.zspace.height_space.name === "xspace"){
        slice_data = VolumeViewer.utils.rotateUint16Array90Left(slice_data,slice.width,slice.height);
        slice.width_space = this[axis].width_space;
        slice.height_space = this[axis].height_space;
        slice.width = height;
        slice.height = row_length;
        
      }
      
      slice.data = slice_data;
      //set the spaces on each axis
      slice.width_space = slice.width_space || this[axis].width_space;
      slice.height_space = slice.height_space || this[axis].height_space;
      slice.width = slice.width || row_length;
      slice.height = slice.height || height;
      cached_slices[axis][time][number] = slice;

      return slice;
    }
  };

  VolumeViewer.volume_loaders.minc = function(description, callback) {
    var error_message;
    
    if (description.header_url && description.raw_data_url) {
      BrainBrowser.loader.loadFromURL(description.header_url, function(header_text) {
        parseHeader(header_text, function(header) {
          BrainBrowser.loader.loadFromURL(description.raw_data_url, function(raw_data) {
            createMincVolume(header, raw_data, callback);
          }, { result_type: "arraybuffer" });
        });
      });
    } else if (description.header_file && description.raw_data_file) {
      BrainBrowser.loader.loadFromFile(description.header_file, function(header_text) {
        parseHeader(header_text, function(header) {
          BrainBrowser.loader.loadFromFile(description.raw_data_file, function(raw_data) {
            createMincVolume(header, raw_data, callback);
          }, { result_type: "arraybuffer" });
        });
      });
    } else {
      error_message = "invalid volume description.\n" +
        "Description must contain property pair 'header_url' and 'raw_data_url', or\n" +
        "'header_file' and 'raw_data_file'.";

      BrainBrowser.events.triggerEvent("error", error_message);
      throw new Error(error_message);
    }
    
  };

  function parseHeader(header_text, callback) {
    var header;
    var error_message;

    try{
      header = JSON.parse(header_text);
    } catch(error) {
      error_message = "server did not respond with valid JSON" + "\n" +
        "Response was: \n" + header_text;

      BrainBrowser.events.triggerEvent("error", error_message);
      throw new Error(error_message);
    }

    if (BrainBrowser.utils.isFunction(callback)) {
      callback(header);
    }
  }

  function createMincVolume(header, raw_data, callback){
    var volume = Object.create(minc_volume_proto);

    volume.position = {};
    volume.current_time = 0;
    volume.data = createMincData(header, new Uint8Array(raw_data));
    volume.header = volume.data.header;
    volume.min = 0;
    volume.max = 255;
    
    if (BrainBrowser.utils.isFunction(callback)) {
      callback(volume);
    }
  }

  function createMincData(header, data) {
    var minc_data = Object.create(minc_data_proto);
    var startx, starty, startz, cx, cy, cz;
    
    minc_data.header = header;
    minc_data.order = header.order;
    
    if(minc_data.order.length === 4) {
      minc_data.order = minc_data.order.slice(1);
      minc_data.time = header.time;
    }

    minc_data.xspace = header.xspace;
    minc_data.yspace = header.yspace;
    minc_data.zspace = header.zspace;
    minc_data.xspace.name = "xspace";
    minc_data.yspace.name = "yspace";
    minc_data.zspace.name = "zspace";
    
    minc_data.xspace.space_length = parseFloat(minc_data.xspace.space_length);
    minc_data.yspace.space_length = parseFloat(minc_data.yspace.space_length);
    minc_data.zspace.space_length = parseFloat(minc_data.zspace.space_length);

    startx = minc_data.xspace.start = parseFloat(minc_data.xspace.start);
    starty = minc_data.yspace.start = parseFloat(minc_data.yspace.start);
    startz = minc_data.zspace.start = parseFloat(minc_data.zspace.start);

    minc_data.xspace.step = parseFloat(minc_data.xspace.step);
    minc_data.yspace.step = parseFloat(minc_data.yspace.step);
    minc_data.zspace.step = parseFloat(minc_data.zspace.step);

    minc_data.xspace.direction_cosines = minc_data.xspace.direction_cosines || [1, 0, 0]
    minc_data.yspace.direction_cosines = minc_data.yspace.direction_cosines || [0, 1, 0]
    minc_data.zspace.direction_cosines = minc_data.zspace.direction_cosines || [0, 0, 1]

    cx = minc_data.xspace.direction_cosines = minc_data.xspace.direction_cosines.map(parseFloat);
    cy = minc_data.yspace.direction_cosines = minc_data.yspace.direction_cosines.map(parseFloat);
    cz = minc_data.zspace.direction_cosines = minc_data.zspace.direction_cosines.map(parseFloat);

    minc_data.voxel_origin = {
      x: startx * cx[0] + starty * cx[1] + startz * cx[2], 
      y: startx * cy[0] + starty * cy[1] + startz * cy[2], 
      z: startx * cz[0] + starty * cz[1] + startz * cz[2]
    };


    if(minc_data.order.length === 4) {
      minc_data.time.space_length = parseFloat(minc_data.time.space_length);
      minc_data.time.start = parseFloat(minc_data.time.start);
      minc_data.time.step = parseFloat(minc_data.time.step);
    }
    
    //figure out height and width of each slices in each direction
    var order0 = minc_data[minc_data.order[0]];
    var order1 = minc_data[minc_data.order[1]];
    var order2 = minc_data[minc_data.order[2]];


    order0.height        = parseFloat(order1.space_length);
    order0.height_space  = order1;
    order0.width         = parseFloat(order2.space_length);
    order0.width_space   = order2;

    order1.height = parseFloat(order2.space_length);
    order1.height_space = order2;
    order1.width = parseFloat(order0.space_length);
    order1.width_space = order0;

    order2.height = parseFloat(order1.space_length);
    order2.height_space = order1;
    order2.width = parseFloat(order0.space_length);
    order2.width_space = order0;

    //calculate the offsets for each element of a slice
    order0.offset = parseFloat(order1.space_length) * parseFloat(order2.space_length);
    order1.offset = parseFloat(order0.space_length);
    order2.offset = parseFloat(order0.space_length);
    order0.slice_length = order0.height * order0.width;
    minc_data.cached_slices = {};
    minc_data.data = data;

    return minc_data;
  }
   
}());
