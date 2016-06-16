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

  VolumeViewer.volume_loaders.minc = function(description, callback) {
    var error_message;

    if (!description.header_file && description.raw_data_file) {
      BrainBrowser.loader.loadFromFile(description.raw_data_file, function(raw_data) {
        var tmp = VolumeViewer.utils.hdf5Loader(raw_data);
        parseHeader(tmp.header_text, function(header) {
          createMincVolume(header, tmp.raw_data, callback);
        });
      }, { result_type: "arraybuffer" });
    } else if (!description.header_url && description.raw_data_url) {
      BrainBrowser.loader.loadFromURL(description.raw_data_url, function(raw_data) {
        var tmp = VolumeViewer.utils.hdf5Loader(raw_data);
        parseHeader(tmp.header_text, function(header) {
          createMincVolume(header, tmp.raw_data, callback);
        });
      }, { result_type: "arraybuffer" });
    } else if (description.header_url && description.raw_data_url) {
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
    } else if (description.header_source && description.raw_data_source) {
      parseHeader(description.header_source, function(header) {
        createMincVolume(header, description.raw_data_source, callback);
      });
    } else {
      error_message = "invalid volume description.\n" +
        "Description must contain property pair 'header_url' and 'raw_data_url', \n" +
        "'header_file' and 'raw_data_file' \nor 'header_source' and 'raw_data_source'.";

      BrainBrowser.events.triggerEvent("error", { message: error_message });
      throw new Error(error_message);
    }

  };

  /*
   * Create a volume object given a header and some byte data that
   * represents the voxels. Format-specific functions have to be
   * used to create the header and byte_data, but this function
   * combines the information into the generic data structure used
   * elsewhere in the volume viewer.
   */
  VolumeViewer.createVolume = function(header, native_data) {
    var image_creation_context = document.createElement("canvas").getContext("2d");
    var cached_slices = {};

    // Populate the header with the universal fields.
    finishHeader(header);

    var volume = {
      position: {},
      current_time: 0,
      data: native_data,
      header: header,
      intensity_min: 0,
      intensity_max: 255,
      slice: function(axis, slice_num, time) {
        slice_num = slice_num === undefined ? volume.position[axis] : slice_num;
        time = time === undefined ? volume.current_time : time;

        var header = volume.header;

        if(header.order === undefined ) {
          return null;
        }

        time = time || 0;

        cached_slices[axis] = cached_slices[axis] || [];
        cached_slices[axis][time] =  cached_slices[axis][time] || [];

        if(cached_slices[axis][time][slice_num] !== undefined) {
          return cached_slices[axis][time][slice_num];
        }

        var time_offset = header.time ? time * header.time.offset : 0;

        var axis_space = header[axis];
        var width_space = axis_space.width_space;
        var height_space = axis_space.height_space;

        var width = axis_space.width;
        var height = axis_space.height;

        var axis_space_offset = axis_space.offset;
        var width_space_offset = width_space.offset;
        var height_space_offset = height_space.offset;

        // Calling the volume data's constructor guarantees that the
        // slice data buffer has the same type as the volume.
        //
        var slice_data = new volume.data.constructor(width * height);

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
        if (z >= 0 && z < axis_space.space_length) {
          tz_offset = time_offset + z * axis_space_offset;

          for (row = height - 1; row >= 0; row--) {
            y = y_positive ? row : height - row - 1;
            tzy_offset = tz_offset + y * height_space_offset;

            for (col = 0; col < width; col++) {
              x = x_positive ? col : width - col - 1;
              tzyx_offset = tzy_offset + x * width_space_offset;

              slice_data[i++] = volume.data[tzyx_offset];
            }
          }
        }

        slice = {
          axis: axis,
          data: slice_data,
          width_space: width_space,
          height_space: height_space,
          width: width,
          height: height
        };

        cached_slices[axis][time][slice_num] = slice;

        return slice;
      },

      // Calculate the world to voxel transform and save it, so we
      // can access it efficiently. The transform is:
      // cxx / stepx | cxy / stepx | cxz / stepx | (-o.x * cxx - o.y * cxy - o.z * cxz) / stepx
      // cyx / stepy | cyy / stepy | cyz / stepy | (-o.x * cyx - o.y * cyy - o.z * cyz) / stepy
      // czx / stepz | czy / stepz | czz / stepz | (-o.x * czx - o.y * czy - o.z * czz) / stepz
      // 0           | 0           | 0           | 1

      // Origin equation taken from (http://www.bic.mni.mcgill.ca/software/minc/minc2_format/node4.html)

      saveOriginAndTransform: function(header) {
        var startx = header.xspace.start;
        var starty = header.yspace.start;
        var startz = header.zspace.start;
        var cx = header.xspace.direction_cosines;
        var cy = header.yspace.direction_cosines;
        var cz = header.zspace.direction_cosines;
        var stepx = header.xspace.step;
        var stepy = header.yspace.step;
        var stepz = header.zspace.step;
        header.voxel_origin = {
          x: startx * cx[0] + starty * cy[0] + startz * cz[0],
          y: startx * cx[1] + starty * cy[1] + startz * cz[1],
          z: startx * cx[2] + starty * cy[2] + startz * cz[2]
        };
        var o = header.voxel_origin;

        var tx = (-o.x * cx[0] - o.y * cx[1] - o.z * cx[2]) / stepx;
        var ty = (-o.x * cy[0] - o.y * cy[1] - o.z * cy[2]) / stepy;
        var tz = (-o.x * cz[0] - o.y * cz[1] - o.z * cz[2]) / stepz;

        header.w2v = [
          [cx[0] / stepx, cx[1] / stepx, cx[2] / stepx, tx],
          [cy[0] / stepy, cy[1] / stepy, cy[2] / stepy, ty],
          [cz[0] / stepz, cz[1] / stepz, cz[2] / stepz, tz]
        ];
      },

      getSliceImage: function(slice, zoom, contrast, brightness) {
        zoom = zoom || 1;

        var color_map = volume.color_map;
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

        if (volume.header.datatype === 'rgb8') {
          var tmp = new Uint8ClampedArray(slice.data.buffer);
          source_image.data.set(tmp, 0);
        }
        else {
          color_map.mapColors(slice.data, {
            min: volume.intensity_min,
            max: volume.intensity_max,
            contrast: contrast,
            brightness: brightness,
            destination: source_image.data
          });
        }

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
      },

      getIntensityValue: function(i, j, k, time) {
        var header = volume.header;
        var vc = volume.getVoxelCoords();
        i = i === undefined ? vc.i : i;
        j = j === undefined ? vc.j : j;
        k = k === undefined ? vc.k : k;
        time = time === undefined ? volume.current_time : time;

        if (i < 0 || i >= header[header.order[0]].space_length ||
            j < 0 || j >= header[header.order[1]].space_length ||
            k < 0 || k >= header[header.order[2]].space_length) {
          return 0;
        }
        var time_offset = header.time ? time * header.time.offset : 0;
        var xyzt_offset = (i * header[header.order[0]].offset +
                           j * header[header.order[1]].offset +
                           k * header[header.order[2]].offset +
                           time_offset);
        return volume.data[xyzt_offset];
      },

      getVoxelCoords: function() {
        var header = volume.header;
        var position = {
          xspace: header.xspace.step > 0 ? volume.position.xspace : header.xspace.space_length - volume.position.xspace,
          yspace: header.yspace.step > 0 ? volume.position.yspace : header.yspace.space_length - volume.position.yspace,
          zspace: header.zspace.step > 0 ? volume.position.zspace : header.zspace.space_length - volume.position.zspace
        };

        return {
          i: position[header.order[0]],
          j: position[header.order[1]],
          k: position[header.order[2]],
        };
      },

      setVoxelCoords: function(i, j, k) {
        var header = volume.header;
        var ispace = header.order[0];
        var jspace = header.order[1];
        var kspace = header.order[2];

        volume.position[ispace] = header[ispace].step > 0 ? i : header[ispace].space_length - i;
        volume.position[jspace] = header[jspace].step > 0 ? j : header[jspace].space_length - j;
        volume.position[kspace] = header[kspace].step > 0 ? k : header[kspace].space_length - k;
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
        var header = volume.header;

        ordered[header.order[0]] = i;
        ordered[header.order[1]] = j;
        ordered[header.order[2]] = k;

        x = ordered.xspace;
        y = ordered.yspace;
        z = ordered.zspace;

        var cx = header.xspace.direction_cosines;
        var cy = header.yspace.direction_cosines;
        var cz = header.zspace.direction_cosines;
        var stepx = header.xspace.step;
        var stepy = header.yspace.step;
        var stepz = header.zspace.step;
        var o = header.voxel_origin;

        return {
          x: x * cx[0] * stepx + y * cy[0] * stepy + z * cz[0] * stepz + o.x,
          y: x * cx[1] * stepx + y * cy[1] * stepy + z * cz[1] * stepz + o.y,
          z: x * cx[2] * stepx + y * cy[2] * stepy + z * cz[2] * stepz + o.z
        };
      },

      // Inverse of the voxel to world matrix.
      worldToVoxel: function(x, y, z) {
        var xfm = header.w2v;   // Get the world-to-voxel transform.
        var result = {
          vx: x * xfm[0][0] + y * xfm[0][1] + z * xfm[0][2] + xfm[0][3],
          vy: x * xfm[1][0] + y * xfm[1][1] + z * xfm[1][2] + xfm[1][3],
          vz: x * xfm[2][0] + y * xfm[2][1] + z * xfm[2][2] + xfm[2][3]
        };

        var ordered = {};
        ordered[header.order[0]] = Math.round(result.vx);
        ordered[header.order[1]] = Math.round(result.vy);
        ordered[header.order[2]] = Math.round(result.vz);

        return {
          i: ordered.xspace,
          j: ordered.yspace,
          k: ordered.zspace
        };
      },
      getVoxelMin: function() {
        return volume.header.voxel_min;
      },
      getVoxelMax: function() {
        return volume.header.voxel_max;
      },
      /* given a width and height (from the panel), this function returns the "best"
       * single zoom level that will guarantee that the image fits exactly into the
       * current panel.
       */
      getPreferredZoom: function(width, height) {
        var header = volume.header;
        var x_fov = header.xspace.space_length * Math.abs(header.xspace.step);
        var y_fov = header.yspace.space_length * Math.abs(header.yspace.step);
        var z_fov = header.zspace.space_length * Math.abs(header.xspace.step);
        var xw = width / x_fov;
        var yw = width / y_fov;
        var yh = height / y_fov;
        var zh = height / z_fov;
        return Math.min(yw, xw, zh, yh);
      }
    };
    return volume;
  };

  VolumeViewer.utils.scanDataRange = function(native_data, header) {
    var d = 0;
    var n_min = +Infinity;
    var n_max = -Infinity;

    for (d = 0; d < native_data.length; d++) {
      var value = native_data[d];
      if (value > n_max)
        n_max = value;
      if (value < n_min)
        n_min = value;
    }
    header.voxel_min = n_min;
    header.voxel_max = n_max;
  };

  function createMincData(header, raw_data){
    var native_data = null;
    switch (header.datatype) {
    case 'int8':
      native_data = new Int8Array(raw_data);
      break;
    case 'int16':
      native_data = new Int16Array(raw_data);
      break;
    case 'int32':
      native_data = new Int32Array(raw_data);
      break;
    case 'float32':
      native_data = new Float32Array(raw_data);
      break;
    case 'float64':
      native_data = new Float64Array(raw_data);
      break;
    case 'uint8':
      native_data = new Uint8Array(raw_data);
      break;
    case 'uint16':
      native_data = new Uint16Array(raw_data);
      break;
    case 'uint32':
    case 'rgb8':
      native_data = new Uint32Array(raw_data);
      break;
    default:
      var error_message = "Unsupported data type: " + header.datatype;
      BrainBrowser.events.triggerEvent("error", { message: error_message } );
      throw new Error(error_message);
    }

    VolumeViewer.utils.scanDataRange(native_data, header);
    return native_data;
  }

  function createMincVolume(header, raw_data, callback){
    var volume = VolumeViewer.createVolume(header,
                                           createMincData(header, raw_data));
    volume.type = "minc";

    volume.saveOriginAndTransform(header);
    volume.intensity_min = header.voxel_min;
    volume.intensity_max = header.voxel_max;
    if (BrainBrowser.utils.isFunction(callback)) {
      callback(volume);
    }
  }

  /*
   * Creates common fields all headers must contain.
   */
  function finishHeader(header) {
    header.xspace.name = "xspace";
    header.yspace.name = "yspace";
    header.zspace.name = "zspace";

    header.xspace.width_space  = header.yspace;
    header.xspace.width        = header.yspace.space_length;
    header.xspace.height_space = header.zspace;
    header.xspace.height       = header.zspace.space_length;

    header.yspace.width_space  = header.xspace;
    header.yspace.width        = header.xspace.space_length;
    header.yspace.height_space = header.zspace;
    header.yspace.height       = header.zspace.space_length;

    header.zspace.width_space  = header.xspace;
    header.zspace.width        = header.xspace.space_length;
    header.zspace.height_space = header.yspace;
    header.zspace.height       = header.yspace.space_length;

    if (header.voxel_min === undefined)
      header.voxel_min = 0;
    if (header.voxel_max === undefined)
      header.voxel_max = 255;
  }

  function parseHeader(header_text, callback) {
    var header;
    var error_message;

    try{
      header = JSON.parse(header_text);
    } catch(error) {
      error_message = "server did not respond with valid JSON" + "\n" +
        "Response was: \n" + header_text;

      BrainBrowser.events.triggerEvent("error", { message: error_message });
      throw new Error(error_message);
    }

    if(header.order.length === 4) {
      header.order = header.order.slice(1);
    }

    header.datatype = header.datatype || "uint8";

    header.xspace.space_length = parseFloat(header.xspace.space_length);
    header.yspace.space_length = parseFloat(header.yspace.space_length);
    header.zspace.space_length = parseFloat(header.zspace.space_length);

    header.xspace.start = parseFloat(header.xspace.start);
    header.yspace.start = parseFloat(header.yspace.start);
    header.zspace.start = parseFloat(header.zspace.start);

    header.xspace.step = parseFloat(header.xspace.step);
    header.yspace.step = parseFloat(header.yspace.step);
    header.zspace.step = parseFloat(header.zspace.step);

    header.xspace.direction_cosines = header.xspace.direction_cosines || [1, 0, 0];
    header.yspace.direction_cosines = header.yspace.direction_cosines || [0, 1, 0];
    header.zspace.direction_cosines = header.zspace.direction_cosines || [0, 0, 1];

    header.xspace.direction_cosines = header.xspace.direction_cosines.map(parseFloat);
    header.yspace.direction_cosines = header.yspace.direction_cosines.map(parseFloat);
    header.zspace.direction_cosines = header.zspace.direction_cosines.map(parseFloat);

    /* Incrementation offsets for each dimension of the volume.
     * Note that this somewhat format-specific, so it does not
     * belong in the generic "createVolume()" code.
     */
    header[header.order[0]].offset = header[header.order[1]].space_length * header[header.order[2]].space_length;
    header[header.order[1]].offset = header[header.order[2]].space_length;
    header[header.order[2]].offset = 1;

    if(header.time) {
      header.time.space_length = parseFloat(header.time.space_length);
      header.time.start = parseFloat(header.time.start);
      header.time.step = parseFloat(header.time.step);
      header.time.offset = header.xspace.space_length * header.yspace.space_length * header.zspace.space_length;
    }

    if (BrainBrowser.utils.isFunction(callback)) {
      callback(header);
    }

  }

}());
