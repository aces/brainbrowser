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
  var image_creation_context = document.createElement("canvas").getContext("2d");

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
    var data = createMincData(header, new Uint8Array(raw_data));

    var volume = {
      position: {},
      current_time: 0,
      data: data,
      header: data.header,
      min: 0,
      max: 255,
      slice: function(axis, slice_num, time) {
        slice_num = slice_num === undefined ? volume.position[axis] : slice_num;
        time = time === undefined ? volume.current_time : time;

        var slice = volume.data.slice(axis, slice_num, time);

        slice.color_map = volume.color_map;
        slice.min  = volume.min;
        slice.max  = volume.max;
        slice.axis = axis;

        slice.getImage = function(zoom, contrast, brightness) {
          zoom = zoom || 1;

          var color_map = slice.color_map;
          var error_message;

          if (!color_map) {
            error_message = "No color map set for this volume. Cannot render slice.";
            volume.triggerEvent("error", error_message);
            throw new Error(error_message);
          }

          var xstep = slice.width_space.step;
          var ystep = slice.height_space.step;
          var target_width = Math.abs(Math.floor(slice.width * xstep * zoom));
          var target_height = Math.abs(Math.floor(slice.height * ystep * zoom));
          var source_image = image_creation_context.createImageData(slice.width, slice.height);
          var target_image = image_creation_context.createImageData(target_width, target_height);

          color_map.mapColors(slice.data, {
            min: slice.min,
            max: slice.max,
            contrast: contrast,
            brightness: brightness,
            destination: source_image.data
          });

          target_image.data.set(
            VolumeViewer.utils.nearestNeighbor(
              source_image.data,
              source_image.width,
              source_image.height,
              target_width,
              target_height,
              {block_size: 4}
            )
          );

          return target_image;
        };
        
        return slice;
      },

      getIntensityValue: function(x, y, z, time) {
        x = x === undefined ? volume.position.xspace : x;
        y = y === undefined ? volume.position.yspace : y;
        z = z === undefined ? volume.position.zspace : z;
        time = time === undefined ? volume.current_time : time;

        if (x < 0 || x > volume.data.xspace.space_length ||
          y < 0 || y > volume.data.yspace.space_length ||
          z < 0 || z > volume.data.zspace.space_length) {
          return 0;
        }

        var slice = volume.data.slice("zspace", z, time);
        var data = slice.data;
        var slice_x, slice_y;

        if (slice.width_space.name === "xspace") {
          slice_x = x;
          slice_y = y;
        } else {
          slice_x = y;
          slice_y = z;
        }

        return data[(slice.height_space.space_length - slice_y - 1) * slice.width + slice_x];
      },
      
      getVoxelCoords: function() {
        var world = volume.getWorldCoords();

        return volume.worldToVoxel(world.x, world.y, world.z);
      },
      
      setVoxelCoords: function(x, y, z) {
        var world = volume.voxelToWorld(x, y, z);

        volume.setWorldCoords(world.x, world.y, world.z);
      },
      
      getWorldCoords: function() {
        var data = volume.data;
        var position = {
          x: data.xspace.step > 0 ? volume.position.xspace : data.xspace.space_length - volume.position.xspace,
          y: data.yspace.step > 0 ? volume.position.yspace : data.yspace.space_length - volume.position.yspace,
          z: data.zspace.step > 0 ? volume.position.zspace : data.zspace.space_length - volume.position.zspace
        };

        return {
          x: position.x * data.xspace.step + data.xspace.start,
          y: position.y * data.yspace.step + data.yspace.start,
          z: position.z * data.zspace.step + data.zspace.start
        };
      },
      
      setWorldCoords: function(x, y, z) {
        var data = volume.data;

        volume.position.xspace = data.xspace.step > 0 ? x : data.xspace.space_length - x;
        volume.position.yspace = data.yspace.step > 0 ? y : data.yspace.space_length - y;
        volume.position.zspace = data.zspace.step > 0 ? z : data.zspace.space_length - z;
      },

      // Voxel to world matrix applied here is:
      // cxx * stepx | cyx * stepy | czx * stepz | ox
      // cxy * stepx | cyy * stepy | czy * stepz | oy
      // cxz * stepx | cyz * stepy | czz * stepz | oz
      // 0           | 0           | 0           | 1
      //
      // Taken from (http://www.bic.mni.mcgill.ca/software/minc/minc2_format/node4.html)
      voxelToWorld: function(x, y, z) {
        var ordered = {};
        ordered[volume.data.order[0]] = x;
        ordered[volume.data.order[1]] = y;
        ordered[volume.data.order[2]] = z;

        x = ordered.xspace;
        y = ordered.yspace;
        z = ordered.zspace;

        var cx = volume.data.xspace.direction_cosines;
        var cy = volume.data.yspace.direction_cosines;
        var cz = volume.data.zspace.direction_cosines;
        var stepx = volume.data.xspace.step;
        var stepy = volume.data.yspace.step;
        var stepz = volume.data.zspace.step;
        var o = volume.data.voxel_origin;

        return {
          x: x * cx[0] * stepx + y * cy[0] * stepy + z * cz[0] * stepz + o.x,
          y: x * cx[1] * stepx + y * cy[1] * stepy + z * cz[1] * stepz + o.y,
          z: x * cx[2] * stepx + y * cy[2] * stepy + z * cz[2] * stepz + o.z
        };
      },

      // World to voxel matrix applied here is:
      // cxx / stepx | cxy / stepx | cxz / stepx | (-o.x * cxx - o.y * cxy - o.z * cxz) / stepx
      // cyx / stepy | cyy / stepy | cyz / stepy | (-o.x * cyx - o.y * cyy - o.z * cyz) / stepy
      // czx / stepz | czy / stepz | czz / stepz | (-o.x * czx - o.y * czy - o.z * czz) / stepz
      // 0           | 0           | 0           | 1
      //
      // Inverse of the voxel to world matrix.
      worldToVoxel: function(x, y, z) {
        var cx = volume.data.xspace.direction_cosines;
        var cy = volume.data.yspace.direction_cosines;
        var cz = volume.data.zspace.direction_cosines;
        var stepx = volume.data.xspace.step;
        var stepy = volume.data.yspace.step;
        var stepz = volume.data.zspace.step;
        var o = volume.data.voxel_origin;
        var tx = (-o.x * cx[0] - o.y * cx[1] - o.z * cx[2]) / stepx;
        var ty = (-o.x * cy[0] - o.y * cy[1] - o.z * cy[2]) / stepy;
        var tz = (-o.x * cz[0] - o.y * cz[1] - o.z * cz[2]) / stepz;

        var result = {
          x: Math.round(x * cx[0] / stepx + y * cx[1] / stepx + z * cx[2] / stepx + tx),
          y: Math.round(x * cy[0] / stepy + y * cy[1] / stepy + z * cy[2] / stepy + ty),
          z: Math.round(x * cz[0] / stepz + y * cz[1] / stepz + z * cz[2] / stepz + tz)
        };

        var ordered = {};
        ordered[volume.data.order[0]] = result.x;
        ordered[volume.data.order[1]] = result.y;
        ordered[volume.data.order[2]] = result.z;

        return {
          x: ordered.xspace,
          y: ordered.yspace,
          z: ordered.zspace
        };
      }
    };
    
    if (BrainBrowser.utils.isFunction(callback)) {
      callback(volume);
    }
  }

  function createMincData(header, data) {
    var startx, starty, startz, cx, cy, cz;
    var minc_data = {};

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

    minc_data.xspace.direction_cosines = minc_data.xspace.direction_cosines || [1, 0, 0];
    minc_data.yspace.direction_cosines = minc_data.yspace.direction_cosines || [0, 1, 0];
    minc_data.zspace.direction_cosines = minc_data.zspace.direction_cosines || [0, 0, 1];

    cx = minc_data.xspace.direction_cosines = minc_data.xspace.direction_cosines.map(parseFloat);
    cy = minc_data.yspace.direction_cosines = minc_data.yspace.direction_cosines.map(parseFloat);
    cz = minc_data.zspace.direction_cosines = minc_data.zspace.direction_cosines.map(parseFloat);

    // Origin equation taken from (http://www.bic.mni.mcgill.ca/software/minc/minc2_format/node4.html)
    minc_data.voxel_origin = {
      x: startx * cx[0] + starty * cy[0] + startz * cz[0],
      y: startx * cx[1] + starty * cy[1] + startz * cz[1],
      z: startx * cx[2] + starty * cy[2] + startz * cz[2]
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

    // Warning: This function can get a little crazy
    // We are trying to get a slice out of the array. To do this we need to be careful this
    // we check for the orientation of the slice (steps positive or negative affect the orientation)
    minc_data.slice = function(axis, slice_num, time) {
      if(minc_data.order === undefined ) {
        return null;
      }

      var axis_space = minc_data[axis];

      if(axis_space.step < 0) {
        slice_num = axis_space.space_length - slice_num - 1;
      }

      var slice;
      var cached_slices = minc_data.cached_slices;
      var order0 = minc_data[minc_data.order[0]];
      var width_space = axis_space.width_space;
      var height_space = axis_space.height_space;
      time = time || 0;
      
      cached_slices[axis] = cached_slices[axis] || [];
      cached_slices[axis][time] =  cached_slices[axis][time] || [];
      
      if(cached_slices[axis][time][slice_num] !== undefined) {
        slice = cached_slices[axis][time][slice_num];
        slice.number = slice_num;
        return slice;
      }
            
      slice = {};

      var time_offset = minc_data.time ? time * order0.height * order0.width * parseFloat(order0.space_length) : 0;
      var length_step = width_space.step;
      var height_step = height_space.step;
      var slice_data;
      var width, height;
      var slice_length, row_offset, slice_offset;
      var i, j, k;

      width = axis_space.width;
      height = axis_space.height;
      slice_length = width * height;
      slice_data = new Uint8Array(slice_length);
      
      if(minc_data.order[0] === axis) {
        row_offset = width;
        slice_offset = slice_length;
        
        if(length_step > 0) {
          if(height_step > 0) {
            for (i = 0; i < slice_length; i++) {
              slice_data[i] = minc_data.data[time_offset + slice_offset * slice_num + i];
            }
          } else {
            for(i = height; i > 0; i--) {
              for(j = 0; j < width; j++) {
                slice_data[(height-i) * width + j] = minc_data.data[time_offset + slice_offset * slice_num + i * width + j];
              }
            }
          }
        } else {
          if(height_step < 0) {
            for(i = 0; i < height; i++) {
              for(j = 0; j < width; j++) {
                slice_data[i * width + j] = minc_data.data[time_offset + slice_offset * slice_num + (i + 1) * width - j];
              }
            }
          } else {
            for(i = height; i > 0; i--) {
              for(j = 0; j < width; j++) {
                slice_data[(height - i) * width + j] = minc_data.data[time_offset + slice_offset * slice_num + (i + 1) * width - j];
              }
            }
          }
        }
        
      } else if (minc_data.order[1] === axis ) {
        row_offset = order0.slice_length;
        slice_offset = order0.width;        
        
        if(height_step < 0) {
          for(j = 0; j < height; j++) {
            for(k = 0; k < width; k++){
              slice_data[j * width + k] = minc_data.data[time_offset + slice_num * slice_offset + row_offset * k + j];
            }
          }
        } else {
          for (j = height; j >= 0; j--) {
            for(k = 0; k < width; k++) {
              slice_data[(height - j) * width + k] = minc_data.data[time_offset + slice_num * slice_offset + row_offset * k + j];
            }
          }
        }
        
      } else {

        for ( j = 0; j < height; j++) {
          for( k = 0; k < width; k++){
            slice_data[j * width + k] = minc_data.data[time_offset + slice_num + order0.width * j + k * order0.slice_length];
          }
        }

      }
      
      //Set the default spaces on each axis
      slice.width_space = width_space;
      slice.height_space = height_space;
      slice.width = width;
      slice.height = height;

      // Not sure why, but zspace never seems to need flipping?
      if (axis === "xspace" || axis === "yspace") {
        checkImageFlip(slice_data, axis_space, width_space, height_space);
      }

      checkImageRotation(slice, slice_data, axis, width_space, height_space);
      
      slice.data = slice_data;
      cached_slices[axis][time][slice_num] = slice;

      return slice;
    };

    return minc_data;
  }

  function checkImageFlip(slice_data, axis_space, width_space, height_space) {
    // If we're looking down the negative axis, width and height sign
    // should match. If not flip the height axis.
    if (axis_space.step < 0) {
      slice_data.set(VolumeViewer.utils.flipArray(
          slice_data,
          Uint8Array,
          width_space.space_length, 
          height_space.space_length, 
          {
            flipy: (width_space.step > 0 && height_space.step < 0) || (width_space.step < 0 && height_space.step > 0)
          }
        )
      );
    } else {
      // If we're looking down the positive axis, width and height sign
      // should not match. If not flip the height axis.
      slice_data.set(VolumeViewer.utils.flipArray(
          slice_data,
          Uint8Array,
          width_space.space_length,
          height_space.space_length,
          {
            flipy: (width_space.step > 0 && height_space.step > 0) || (width_space.step < 0 && height_space.step < 0)
          }
        )
      );
    }
  }

  function checkImageRotation(slice, slice_data, axis, width_space, height_space) {
    var width = slice.width;
    var height = slice.height;
    var correct_height_space = {
      xspace: "zspace",
      yspace: "zspace",
      zspace: "yspace"
    }[axis];

    // If the height space is not correct, rotate the image.
    if (height_space.name !== correct_height_space) {
      if (width_space.step > 0) {
        slice_data.set(VolumeViewer.utils.rotateArray90Left(slice_data, Uint8Array, width, height));
      } else {
        slice_data.set(VolumeViewer.utils.rotateArray90Right(slice_data, Uint8Array, width, height));
      }
      slice.width_space  = height_space;
      slice.height_space = width_space;
      slice.width  = height;
      slice.height = width;
    }
  }
   
}());
