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
* Author: Nicolas Kassis
* Author: Tarek Sherif <tsherif@gmail.com> (http://tareksherif.ca/)
* Author: Robert D. Vincent <robert.d.vincent@mcgill.ca>
* 
* Loads NIfTI-1 files for volume viewer. For details on the NIfTI-1 format, 
* see: http://nifti.nimh.nih.gov/nifti-1/documentation/nifti1fields
*/

(function() {
  "use strict";
     
  var VolumeViewer = BrainBrowser.VolumeViewer;

  VolumeViewer.volume_loaders.nifti1 = function(description, callback) {
    var error_message;
    if (description.nii_url) {
      BrainBrowser.loader.loadFromURL(description.nii_url, function(nii_data) {
        parseNifti1Header(nii_data, function(header) {
          createNifti1Volume(header, nii_data, callback);
        });
      }, {result_type: "arraybuffer" });
                                        
    } else if (description.nii_file) {
      BrainBrowser.loader.loadFromFile(description.nii_file, function(nii_data) {
        parseNifti1Header(nii_data, function(header) {
          createNifti1Volume(header, nii_data, callback);
        });
      }, {result_type: "arraybuffer" });
    } else {
      error_message = "invalid volume description.\n" +
        "Description must contain the property 'nii_url' or 'nii_file'.";

      BrainBrowser.events.triggerEvent("error", { message: error_message });
      throw new Error(error_message);
    }
    
  };

  function parseNifti1Header(raw_data, callback) {
    var header = {
      order: ["zspace", "yspace", "xspace"],
      xspace: {},
      yspace: {},
      zspace: {}
    };
    var error_message;
    var dview = new DataView(raw_data, 0, 348);
    var bytes = new Uint8Array(raw_data, 0, 348);
    var littleEndian = true;

    var sizeof_hdr = dview.getUint32(0, true);
    if (sizeof_hdr === 0x0000015c) {
      littleEndian = true;
    } else if (sizeof_hdr === 0x5c010000) {
      littleEndian = false;
    } else {
      error_message = "This does not look like a NIfTI-1 file.";
    }

    var ndims = dview.getUint16(40, littleEndian);
    if (ndims < 3 || ndims > 4) {
      error_message = "Cannot handle " + ndims + "-dimensional images yet.";
    }

    var magic = String.fromCharCode.apply(null, bytes.subarray(344, 348));
    if (magic !== "n+1\0") {
      error_message = "Bad magic number: '" + magic + "'";
    }

    if (error_message !== undefined) {
      BrainBrowser.events.triggerEvent("error", { message: error_message });
      throw new Error(error_message);
    }

    header.xspace.space_length = dview.getUint16(42, littleEndian);
    header.yspace.space_length = dview.getUint16(44, littleEndian);
    header.zspace.space_length = dview.getUint16(46, littleEndian);
    var tlength = dview.getUint16(48, littleEndian);

    var datatype = dview.getUint16(70, littleEndian);
    var bitpix = dview.getUint16(72, littleEndian);

    var xstep = dview.getFloat32(80, littleEndian);
    var ystep = dview.getFloat32(84, littleEndian);
    var zstep = dview.getFloat32(88, littleEndian);
    var tstep = dview.getFloat32(92, littleEndian);

    var vox_offset = dview.getFloat32(108, littleEndian);
    if (vox_offset < 352) {
      vox_offset = 352;
    }

    var scl_slope = dview.getFloat32(112, littleEndian);
    var scl_inter = dview.getFloat32(116, littleEndian);

    var qform_code = dview.getUint16(252, littleEndian);
    var sform_code = dview.getUint16(254, littleEndian);

    var x_dir_cosines = [];
    var y_dir_cosines = [];
    var z_dir_cosines = [];
    var transform = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ];

    if (tlength >= 1) {
      header.time = {};
      header.time.space_length = tlength;
      header.time.step = tstep;
      header.time.start = 0;
      header.time.name = "time";
      header.order = ["time", "zspace", "yspace", "xspace"];
    }

    /* Record the number of bytes per voxel, and note whether we need 
     * to swap bytes in the voxel data.
     */
    header.bytes_per_voxel = bitpix / 8;
    header.must_swap_data = !littleEndian && header.bytes_per_voxel > 1;

    if (sform_code > 0) {
      /* The "Sform", if present, defines an affine transform which is 
       * generally assumed to correspond to some standard coordinate
       * space (e.g. Talairach).
       */
      transform[0][0] = dview.getFloat32(280, littleEndian);
      transform[0][1] = dview.getFloat32(284, littleEndian);
      transform[0][2] = dview.getFloat32(288, littleEndian);
      transform[0][3] = dview.getFloat32(292, littleEndian);
      transform[1][0] = dview.getFloat32(296, littleEndian);
      transform[1][1] = dview.getFloat32(300, littleEndian);
      transform[1][2] = dview.getFloat32(304, littleEndian);
      transform[1][3] = dview.getFloat32(308, littleEndian);
      transform[2][0] = dview.getFloat32(312, littleEndian);
      transform[2][1] = dview.getFloat32(316, littleEndian);
      transform[2][2] = dview.getFloat32(320, littleEndian);
      transform[2][3] = dview.getFloat32(324, littleEndian);
    }
    else if (qform_code > 0) {
      /* The "Qform", if present, defines a quaternion which specifies
       * a less general transformation, often to scanner space.
       */
      var quatern_b = dview.getFloat32(256, littleEndian);
      var quatern_c = dview.getFloat32(260, littleEndian);
      var quatern_d = dview.getFloat32(264, littleEndian);
      var qoffset_x = dview.getFloat32(268, littleEndian);
      var qoffset_y = dview.getFloat32(272, littleEndian);
      var qoffset_z = dview.getFloat32(276, littleEndian);
      var qfac = (dview.getFloat32(76, littleEndian) < 0) ? -1.0 : 1.0;

      transform = niftiQuaternToMat44(quatern_b, quatern_c, quatern_d,
                                      qoffset_x, qoffset_y, qoffset_z,
                                      xstep, ystep, zstep, qfac);
    }
    else {
      transform[0][0] = xstep;
      transform[1][1] = ystep;
      transform[2][2] = zstep;
    }

    // A tiny helper function to calculate the magnitude of the rotational
    // part of the transform.
    //
    function magnitude(v) {
      var dotprod = v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
      if (dotprod <= 0) {
        dotprod = 1.0;
      }
      return Math.sqrt(dotprod);
    }

    // Now that we have the transform, need to convert it to MINC-like 
    // steps and direction_cosines.

    var xmag = magnitude(transform[0]);
    var ymag = magnitude(transform[1]);
    var zmag = magnitude(transform[2]);

    xstep = (transform[0][0] < 0) ? -xmag : xmag;
    ystep = (transform[1][1] < 0) ? -ymag : ymag;
    zstep = (transform[2][2] < 0) ? -zmag : zmag;

    for (var i = 0; i < 3; i++) {
      x_dir_cosines[i] = transform[0][i] / xstep;
      y_dir_cosines[i] = transform[1][i] / ystep;
      z_dir_cosines[i] = transform[2][i] / zstep;
    }
        
    header.xspace.step = xstep;
    header.yspace.step = ystep;
    header.zspace.step = zstep;

    /* The NIfTI-1 transform already encodes the "corrected" origin
     * in world space, so there is no need for later correction.
     */
    header.xspace.start = transform[0][3];
    header.yspace.start = transform[1][3];
    header.zspace.start = transform[2][3];

    header.xspace.direction_cosines = x_dir_cosines;
    header.yspace.direction_cosines = y_dir_cosines;
    header.zspace.direction_cosines = z_dir_cosines;

    header.datatype = datatype;
    header.vox_offset = vox_offset;
    header.scl_slope = scl_slope;
    header.scl_inter = scl_inter;

    if (BrainBrowser.utils.isFunction(callback)) {
      callback(header);
    }
  }

  /* This function is a direct translation of the identical function
   * found in the standard NIfTI-1 library (nifti1_io.c).
   */
  function niftiQuaternToMat44( qb, qc, qd,
                                qx, qy, qz,
                                dx, dy, dz, qfac )
  {
    var m = [                   // 4x4 transform
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 1]
    ];
    var b = qb;
    var c = qc;
    var d = qd;
    var a, xd, yd, zd;

    // compute a parameter from b,c,d 

    a = 1.0 - (b * b + c * c + d * d);
    if ( a < 1.e-7 ) {           // special case
      a = 1.0 / Math.sqrt(b * b + c * c + d * d);
      b *= a;                    // normalize (b,c,d) vector
      c *= a;
      d *= a;
      a = 0.0;                   // a = 0 ==> 180 degree rotation
    } else {
      a = Math.sqrt(a);          // angle = 2*arccos(a)
    }

    // load rotation matrix, including scaling factors for voxel sizes 

    xd = (dx > 0.0) ? dx : 1.0;  // make sure are positive
    yd = (dy > 0.0) ? dy : 1.0;
    zd = (dz > 0.0) ? dz : 1.0;

    if ( qfac < 0.0 )            // left handedness?
      zd = -zd;

    m[0][0] =       (a * a + b * b - c * c - d * d) * xd;
    m[0][1] = 2.0 * (b * c - a * d                ) * yd;
    m[0][2] = 2.0 * (b * d + a * c                ) * zd;
    m[1][0] = 2.0 * (b * c + a * d                ) * xd;
    m[1][1] =       (a * a + c * c - b * b - d * d) * yd;
    m[1][2] = 2.0 * (c * d - a * b                ) * zd;
    m[2][0] = 2.0 * (b * d - a * c                ) * xd;
    m[2][1] = 2.0 * (c * d + a * b                ) * yd;
    m[2][2] =       (a * a + d * d - c * c - b * b) * zd;

    // load offsets

    m[0][3] = qx;
    m[1][3] = qy;
    m[2][3] = qz;

    return m;
  }

  function createNifti1Volume(header, raw_data, callback) {
    var volume = VolumeViewer.createVolume(header,
                                           createNifti1Data(header, raw_data));
    
    if (BrainBrowser.utils.isFunction(callback)) {
      callback(volume);
    }
  }

  function swapn(byte_data, n_per_item) {
    for (var d = 0; d < byte_data.length; d += n_per_item) {
      var hi_offset = n_per_item - 1;
      var lo_offset = 0;
      while (hi_offset > lo_offset) {
        var tmp = byte_data[d + hi_offset];
        byte_data[d + hi_offset] = byte_data[d + lo_offset];
        byte_data[d + lo_offset] = tmp;
        hi_offset--;
        lo_offset++;
      }
    }
  }

  function createNifti1Data(header, raw_data) {
    var byte_data = null;
    var native_data = null;
    var n_min, n_max;

    if (header.must_swap_data) {
      swapn(new Uint8Array(raw_data, header.vox_offset),
            header.bytes_per_voxel);
    }

    switch (header.datatype) {
    case 2:                     // DT_UNSIGNED_CHAR
      // no translation necessary; could optimize this out.
      native_data = new Uint8Array(raw_data, header.vox_offset);
      break;
    case 4:                     // DT_SIGNED_SHORT
      native_data = new Int16Array(raw_data, header.vox_offset);
      break;
    case 8:                     // DT_SIGNED_INT
      native_data = new Int32Array(raw_data, header.vox_offset);
      break;
    case 16:                    // DT_FLOAT
      native_data = new Float32Array(raw_data, header.vox_offset);
      break;
    case 64:                    // DT_DOUBLE
      native_data = new Float64Array(raw_data, header.vox_offset);
      break;
    // Values above 256 are NIfTI-specific, and rarely used.
    case 256:                   // DT_INT8
      native_data = new Int8Array(raw_data, header.vox_offset);
      break;
    case 512:                   // DT_UINT16
      native_data = new Uint16Array(raw_data, header.vox_offset);
      break;
    case 768:                   // DT_UINT32
      native_data = new Uint32Array(raw_data, header.vox_offset);
      break;
    default:
      // We don't yet support 64-bit, complex, RGB, and float 128 types.
      var error_message = "Unsupported data type: " + header.datatype;
      BrainBrowser.events.triggerEvent("error", { message: error_message });
      throw new Error(error_message);
    }

    var d = 0;                  // Generic loop counter.

    // Convert data to bytes.
    byte_data = new Uint8Array(native_data.length);
    n_min = native_data[0];
    n_max = native_data[0];

    for (d = 1; d < native_data.length; d++) {
      if (native_data[d] > n_max)
        n_max = native_data[d];
      if (native_data[d] < n_min)
        n_min = native_data[d];
    }
    for (d = 0; d < native_data.length; d++) {
      byte_data[d] = ((native_data[d] + n_min) * 255) / (n_max - n_min);
    }

    if(header.order.length === 4) {
      header.order = header.order.slice(1);
    }

    header.xspace.name = "xspace";
    header.yspace.name = "yspace";
    header.zspace.name = "zspace";

    header.voxel_origin = {
      x: header.xspace.start,
      y: header.yspace.start,
      z: header.zspace.start
    };

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

    // Incrementation offsets for each dimension of the volume.
    header[header.order[0]].offset = header[header.order[1]].space_length * header[header.order[2]].space_length;
    header[header.order[1]].offset = header[header.order[2]].space_length;
    header[header.order[2]].offset = 1;

    if(header.time) {
      header.time.offset = header.xspace.space_length * header.yspace.space_length * header.zspace.space_length;
    }

    return byte_data;
  }
   
}());
