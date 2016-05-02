/*
* BrainBrowser: Web-based Neurological Visualization Tools
* (https://brainbrowser.cbrain.mcgill.ca)
*
* Copyright (C) 2011-2014
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
* Author: Robert D. Vincent <robert.d.vincent@mcgill.ca>
*
* Loads MGH (FreeSurfer) files for volume viewer. For details on the MGH
* format, see https://surfer.nmr.mgh.harvard.edu/fswiki/FsTutorial/MghFormat
*
* Here are some of the salient features of the format:
* 1. A fixed-size binary header similar to NIfTI-1.
* 2. Generally stored big-endian, even on little-endian systems.
* 3. At most 4 dimensions, of which three are spatial.
* 4. MGZ files are just MGH files that have been run through GZIP/ZLIB.
* 5. Encodes a single transform, but uses a confusing dual notion of what
* the origin of the world axis is. In some cases, the centre of the voxel
* grid is used as the world origin, in others an offset is
* applied to each of the spatial dimensions.
* 6. There is no scaling information in the header. Voxel values are not
* transformed in any way.
*/

(function() {
  "use strict";

  var VolumeViewer = BrainBrowser.VolumeViewer;
  var debug = false;

  VolumeViewer.volume_loaders.mgh = function(description, callback) {
    var error_message;
    if (description.url) {
      BrainBrowser.loader.loadFromURL(description.url, function(data) {
        parseMGHHeader(data, function(header) {
          createMGHVolume(header, data, callback);
        });
      }, {result_type: "arraybuffer" });

    } else if (description.file) {
      BrainBrowser.loader.loadFromFile(description.file, function(data) {
        parseMGHHeader(data, function(header) {
          createMGHVolume(header, data, callback);
        });
      }, {result_type: "arraybuffer" });
    } else if (description.source) {
      parseMGHHeader(description.source, function(header) {
        createMGHVolume(header, description.source, callback);
      });
    } else {
      error_message = "invalid volume description.\n" +
        "Description must contain the property 'url', 'file' or 'source'.";

      BrainBrowser.events.triggerEvent("error", { message: error_message });
      throw new Error(error_message);
    }

  };

  /* Function to parse the basic MGH header. This is a 284-byte binary
   * object that begins at offset zero in the file.
   * The resulting header object will contain the following fields:
   *
   * header.order[] - An array of strings that gives the order of the
   * spatial dimensions.
   * header.xspace - Description of the X axis (patient left to right)
   * header.yspace - Description of the Y axis (patient posterior to anterior)
   * header.zspace - Description of the Z axis (patient inferior to superior)
   * header.time - Description of time axis, if any.

   * Non-standard fields used internally only:
   *
   * header.nvoxels - Total number of voxels in the image.
   * header.datatype - MGH data type of image.
   * header.little_endian - True if data is little endian (should be false!)
   */
  function parseMGHHeader(raw_data, callback) {
    var header = {
      order: ["xspace", "yspace", "zspace"],
      xspace: {},
      yspace: {},
      zspace: {}
    };
    var error_message;
    var dview = new DataView(raw_data, 0, 284);
    var little_endian = true;

    /* Read the header version, which should always have the value
     * 0x00000001. We use this to test the endian-ness of the data,
     * but it should always be big-endian.
     */
    var hdr_version = dview.getUint32(0, true);
    if (hdr_version === 0x00000001) {
      little_endian = true;
    } else if (hdr_version === 0x01000000) {
      little_endian = false;    // Generally files are big-endian.
    }
    else {
      error_message = "This does not look like an MGH file.";
    }

    /* Now read the dimension lengths. There are at most 4 dimensions
     * in the file. The lengths fields are always present, but they
     * unused dimensions may have the value 0 or 1.
     */
    var ndims = 0;
    var sizes = [0, 0, 0, 0];
    var header_offset = 4;
    var nvoxels = 1;
    for (ndims = 0; ndims < 4; ndims++) {
      sizes[ndims] = dview.getUint32(header_offset, little_endian);
      if (sizes[ndims] <= 1) {
        break;
      }
      nvoxels *= sizes[ndims];
      header_offset += 4;
    }

    if (ndims < 3 || ndims > 4) {
      error_message = "Cannot handle " + ndims + "-dimensional images yet.";
    }

    var datatype = dview.getUint32(20, little_endian);
    // IGNORED var dof = dview.getUint32(24, little_endian);
    var good_transform_flag = dview.getUint16(28, little_endian);
    var spacing = [1.0, 1.0, 1.0];
    var i, j;
    var dircos = [
      [-1.0,  0.0,  0.0],
      [ 0.0,  0.0, -1.0],
      [ 0.0,  1.0,  0.0],
      [ 0.0,  0.0,  0.0]
    ];
    if (good_transform_flag) {
      header_offset = 30;
      for (i = 0; i < 3; i++) {
        spacing[i] = dview.getFloat32(header_offset, little_endian);
        header_offset += 4;
      }
      for (i = 0; i < 4; i++) {
        for (j = 0; j < 3; j++) {
          dircos[i][j] = dview.getFloat32(header_offset, little_endian);
          header_offset += 4;
        }
      }
    }

    if (debug) {
      // Prints out the transform in a format similar to the output
      // of FreeSurfer's mri_info tool.
      //
      for (i = 0; i < 3; i++) {
        var s1 = "";
        for (j = 0; j < 4; j++) {
          s1 += "xyzc"[j] + "_" + "ras"[i] + " " + dircos[j][i] + " ";
        }
        console.log(s1);
      }
    }

    var axis_index_from_file = [0, 1, 2];

    for ( var axis = 0; axis < 3; axis++) {
      var spatial_axis = 0;
      var c_x = Math.abs(dircos[axis][0]);
      var c_y = Math.abs(dircos[axis][1]);
      var c_z = Math.abs(dircos[axis][2]);

      header.order[axis] = "xspace";
      if (c_y > c_x && c_y > c_z) {
        spatial_axis = 1;
        header.order[axis] = "yspace";
      }
      if (c_z > c_x && c_z > c_y) {
        spatial_axis = 2;
        header.order[axis] = "zspace";
      }
      axis_index_from_file[axis] = spatial_axis;
    }

    /* If there are four dimensions, assume the last is the time
     * dimension. I use default values for step and start because as
     * far as I know MGH files do not carry any descriptive
     * information about the 4th dimension.
     */
    if (ndims === 4) {
      if (debug) {
        console.log("Creating time dimension: " + sizes[3]);
      }
      header.time = {
        space_length: sizes[3],
        step: 1,
        start: 0,
        name: "time"
      };
      header.order.push("time");
    }

    /** This is here because there are two different ways of interpreting
      * the origin of an MGH file. One can ignore the offsets in the
      * transform, using the centre of the voxel grid. Or you can correct
      * these naive grid centres using the values stored in the transform.
      * The first approach is what is used by surface files, so to get them
      * to register nicely, we want ignore_offsets to be true. However,
      * getting volumetric files to register correctly implies setting
      * ignore_offsets to false.
      */
    var ignore_offsets = false;
    var mgh_xform = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ];
    for (i = 0; i < 3; i++) {
      for (j = 0; j < 3; j++) {
        mgh_xform[i][j] = dircos[j][i] * spacing[i];
      }
    }

    for (i = 0; i < 3; i++) {
      var temp = 0.0;
      for (j = 0; j < 3; j++) {
        temp += mgh_xform[i][j] * (sizes[j] / 2.0);
      }

      if (ignore_offsets) {
        mgh_xform[i][4 - 1] = -temp;
      }
      else {
        mgh_xform[i][4 - 1] = dircos[4 - 1][i] - temp;
      }
    }

    var transform = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ];

    for (i = 0; i < 3; i++) {
      for (j = 0; j < 4; j++) {
        var volume_axis = j;
        if (j < 3) {
          volume_axis = axis_index_from_file[j];
        }
        transform[i][volume_axis] = mgh_xform[i][j];
      }
    }

    // Now that we have the transform, need to convert it to MINC-like
    // steps and direction_cosines.

    VolumeViewer.utils.transformToMinc(transform, header);

    if (error_message !== undefined) {
      BrainBrowser.events.triggerEvent("error", { message: error_message });
      throw new Error(error_message);
    }

    // Save the datatype so that we can refer to it later.
    header.datatype = datatype;
    header.little_endian = little_endian;
    header.nvoxels = nvoxels;

    // Save the voxel dimension lengths.
    for (i = 0; i < 3; i++) {
      header[header.order[i]].space_length = sizes[i];
    }

    if (BrainBrowser.utils.isFunction(callback)) {
      callback(header);
    }
  }

  function createMGHVolume(header, raw_data, callback) {
    var volume = VolumeViewer.createVolume(header,
                                           createMGHData(header, raw_data));
    volume.type = "mgh";
    volume.intensity_min = header.voxel_min;
    volume.intensity_max = header.voxel_max;
    volume.saveOriginAndTransform(header);
    if (BrainBrowser.utils.isFunction(callback)) {
      callback(volume);
    }
  }

  function createMGHData(header, raw_data) {
    var native_data = null;
    var bytes_per_voxel = 1;

    switch (header.datatype) {
    case 0:                     // Unsigned characters.
      bytes_per_voxel = 1;
      break;
    case 1:                     // 4-byte signed integers.
    case 3:                     // 4-byte float.
      bytes_per_voxel = 4;
      break;
    case 4:                     // 2-byte signed integers.
      bytes_per_voxel = 2;
      break;
    default:
      var error_message = "Unsupported data type: " + header.datatype;
      BrainBrowser.events.triggerEvent("error", { message: error_message });
      throw new Error(error_message);
    }

    var nbytes = header.nvoxels * bytes_per_voxel;

    if (bytes_per_voxel > 1 && !header.little_endian) {
      VolumeViewer.utils.swapn(new Uint8Array(raw_data, 284, nbytes),
                               bytes_per_voxel);
    }

    switch (header.datatype) {
    case 0:                     // unsigned char
      native_data = new Uint8Array(raw_data, 284, header.nvoxels);
      break;
    case 1:                     // signed int
      native_data = new Int32Array(raw_data, 284, header.nvoxels);
      break;
    case 3:
      native_data = new Float32Array(raw_data, 284, header.nvoxels);
      break;
    case 4:                     // signed short
      native_data = new Int16Array(raw_data, 284, header.nvoxels);
      break;
    }

    VolumeViewer.utils.scanDataRange(native_data, header);

    // Incrementation offsets for each dimension of the volume. MGH
    // files store the fastest-varying dimension _first_, so the
    // "first" dimension actually has the smallest offset. That is
    // why this calculation is different from that for NIfTI-1.
    //
    var d;
    var offset = 1;
    for (d = 0; d < header.order.length; d++) {
      header[header.order[d]].offset = offset;
      offset *= header[header.order[d]].space_length;
    }
    return native_data;
  }

}());
