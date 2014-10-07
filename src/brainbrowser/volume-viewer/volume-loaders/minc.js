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

        return slice.data[(slice.height_space.space_length - y - 1) * slice.width + x];
      },
      
      getVoxelCoords: function() {
        var data = volume.data;
        var position = {
          xspace: data.xspace.step > 0 ? volume.position.xspace : data.xspace.space_length - volume.position.xspace,
          yspace: data.yspace.step > 0 ? volume.position.yspace : data.yspace.space_length - volume.position.yspace,
          zspace: data.zspace.step > 0 ? volume.position.zspace : data.zspace.space_length - volume.position.zspace
        };

        return {
          i: position[data.order[0]],
          j: position[data.order[1]],
          k: position[data.order[2]],
        };
      },
      
      setVoxelCoords: function(i, j, k) {
        var data = volume.data;
        var ispace = data.order[0];
        var jspace = data.order[1];
        var kspace = data.order[2];
        
        volume.position[ispace] = data[ispace].step > 0 ? i : data[ispace].space_length - i;
        volume.position[jspace] = data[jspace].step > 0 ? j : data[jspace].space_length - j;
        volume.position[kspace] = data[kspace].step > 0 ? k : data[kspace].space_length - k;
      },
      
      getWorldCoords: function() {
        var voxel = volume.getVoxelCoords();

        return volume.voxelToWorld(voxel.i, voxel.j, voxel.k);
      },
      
      setWorldCoords: function(x, y, z) {
        var voxel = volume.worldToVoxel(x, y, z);

        volume.setVoxelCoords(voxel.i, voxel.j, voxel.k);
      },

      // Voxel to world matrix applied here is:
      // cxx * stepx | cyx * stepy | czx * stepz | ox
      // cxy * stepx | cyy * stepy | czy * stepz | oy
      // cxz * stepx | cyz * stepy | czz * stepz | oz
      // 0           | 0           | 0           | 1
      //
      // Taken from (http://www.bic.mni.mcgill.ca/software/minc/minc2_format/node4.html)
      voxelToWorld: function(i, j, k) {
        var ordered = {};
        var x, y, z;

        ordered[volume.data.order[0]] = i;
        ordered[volume.data.order[1]] = j;
        ordered[volume.data.order[2]] = k;

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
          i: ordered.xspace,
          j: ordered.yspace,
          k: ordered.zspace
        };
      }
    };
    
    if (BrainBrowser.utils.isFunction(callback)) {
      callback(volume);
    }
  }

  function createMincData(header, data) {
    var startx, starty, startz, cx, cy, cz;
    var minc_data = {
      data: data,
      cached_slices: {}
    };

    minc_data.header = header;
    minc_data.order = header.order;
    
    if(header.order.length === 4) {
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

    minc_data.xspace.width_space  = minc_data.yspace;
    minc_data.xspace.width        = minc_data.yspace.space_length;
    minc_data.xspace.height_space = minc_data.zspace;
    minc_data.xspace.height       = minc_data.zspace.space_length;

    minc_data.yspace.width_space  = minc_data.xspace;
    minc_data.yspace.width        = minc_data.xspace.space_length;
    minc_data.yspace.height_space = minc_data.zspace;
    minc_data.yspace.height       = minc_data.zspace.space_length;

    minc_data.zspace.width_space  = minc_data.xspace;
    minc_data.zspace.width        = minc_data.xspace.space_length;
    minc_data.zspace.height_space = minc_data.yspace;
    minc_data.zspace.height       = minc_data.yspace.space_length;

    // Incrementation offsets for each dimension of the volume.
    minc_data[minc_data.order[0]].offset = minc_data[minc_data.order[1]].space_length * minc_data[minc_data.order[2]].space_length;
    minc_data[minc_data.order[1]].offset = minc_data[minc_data.order[2]].space_length;
    minc_data[minc_data.order[2]].offset = 1;

    if(minc_data.time) {
      minc_data.time.space_length = parseFloat(minc_data.time.space_length);
      minc_data.time.start = parseFloat(minc_data.time.start);
      minc_data.time.step = parseFloat(minc_data.time.step);
      minc_data.time.offset = minc_data.xspace.space_length * minc_data.yspace.space_length * minc_data.zspace.space_length;
    }

    // Pull a slice out of the volume.
    minc_data.slice = function(axis, slice_num, time) {
      if(minc_data.order === undefined ) {
        return null;
      }

      time = time || 0;

      var cached_slices = minc_data.cached_slices;
      
      cached_slices[axis] = cached_slices[axis] || [];
      cached_slices[axis][time] =  cached_slices[axis][time] || [];
      
      if(cached_slices[axis][time][slice_num] !== undefined) {
        return cached_slices[axis][time][slice_num];
      }

      var time_offset = minc_data.time ? time * minc_data.time.offset : 0;

      var axis_space = minc_data[axis];
      var width_space = axis_space.width_space;
      var height_space = axis_space.height_space;

      var width = axis_space.width;
      var height = axis_space.height;

      var axis_space_offset = axis_space.offset;
      var width_space_offset = width_space.offset;
      var height_space_offset = height_space.offset;

      var slice_data = new Uint8Array(width * height);

      var slice;

      // Rows and colums of the result slice.
      var row, col;

      // Indexes into the volume, relative to the slice.
      // NOT xspace, yspace, zspace coordinates!!!
      var x, y, z;

      // Linear offsets into volume considering an
      // increasing number of axes: (t) time, 
      // (z) z-axis, (y) y-axis, (x) x-axis.
      var tz_offset, tzy_offset, tzyx_offset;

      // Whether the dimension steps positively or negatively.
      var x_positive = width_space.step  > 0;
      var y_positive = height_space.step > 0;
      var z_positive = axis_space.step   > 0;

      // iterator for the result slice.
      var i = 0;

      z = z_positive ? slice_num : axis_space.space_length - slice_num - 1;
      tz_offset = time_offset + z * axis_space_offset;

      for (row = height - 1; row >= 0; row--) {
        y = y_positive ? row : height - row - 1;
        tzy_offset = tz_offset + y * height_space_offset;

        for (col = 0; col < width; col++) {
          x = x_positive ? col : width - col - 1;
          tzyx_offset = tzy_offset + x * width_space_offset;

          slice_data[i++] = minc_data.data[tzyx_offset];
        }
      }

      slice = {
        data: slice_data,
        width_space: width_space,
        height_space: height_space,
        width: width,
        height: height
      };

      cached_slices[axis][time][slice_num] = slice;

      return slice;
    };

    return minc_data;
  }
   
}());
