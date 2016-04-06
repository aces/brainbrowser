/*
* BrainBrowser: Web-based Neurological Visualization Tools
* (https://brainbrowser.cbrain.mcgill.ca)
*
* Copyright (C) 2016
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
* Author: Robert D. Vincent (robert.d.vincent@mcgill.ca)
*
* Interprets a MODERATE subset of the NetCDF classic format for the 
* volume viewer. This is sufficient to parse most MINC 1.0 files, but
* may not handle NetCDF from other sources!!
* 
* For details on the NetCDF format, see:
* https://earthdata.nasa.gov/files/ESDS-RFC-011v2.00.pdf
*/

(function () {
  "use strict";
  /** netcdf type codes. */
  var type_enum = {
    BYTE: 1,
    CHAR: 2,
    SHORT: 3,
    INT: 4,
    FLOAT: 5,
    DOUBLE: 6
  };

  function type_size(typ) {
    var sizes = [0, 1, 1, 2, 4, 4, 8];
    if (typ >= type_enum.BYTE && typ < sizes.length) {
      return sizes[typ];
    }
    throw 'Unknown type ' + typ;
  }

  function type_name(typ) {
    var names = [
      '', 'Byte', 'Char', 'Short', 'Int', 'Float', 'Double'
    ];
    if (typ >= type_enum.BYTE && typ < names.length) {
      return names[typ];
    }
    throw 'Unknown type ' + typ;
  }

  var VolumeViewer = BrainBrowser.VolumeViewer;

  VolumeViewer.utils.netcdf_reader = function (abuf, debug) {
    /* 'global' variables. */
    var dv_offset = 0;
    var little_endian = false;
    var dv = new DataView(abuf);
    var file_dimensions = [];

    debug = debug || false;

    /* Function to create and initialize one of our internal
     * 'link' objects,  which represents a NetCDF variable.
     */
    function int_link() {
      var r = {};
      // internal/private
      r.lnk_dat_offset = 0;
      r.lnk_dat_length = 0;
      // permanent/global
      r.lnk_name = "";
      r.lnk_attributes = [];
      r.lnk_children = [];
      r.lnk_dat_array = null;
      r.lnk_type = -1;
      r.lnk_dims = [];
      r.type_name = type_name;
      return r;
    }

    /* helper functions for access to our DataView. */
    function get_u8() {
      var v = dv.getUint8(dv_offset);
      dv_offset += 1;
      return v;
    }

    function get_u32() {
      var v = dv.getUint32(dv_offset, little_endian);
      dv_offset += 4;
      return v;
    }

    function get_string(length) {
      var r = "";
      var i;
      var c;
      for (i = 0; i < length; i += 1) {
        c = get_u8();
        if (c === 0) {
          dv_offset += (length - i - 1);
          break;
        }
        r += String.fromCharCode(c);
      }
      return r;
    }

    // pad to nearest 4 byte boundary.
    function pad(n) {
      return Math.floor((n + 3) / 4) * 4;
    }

    function get_array(typ, n_bytes, offset) {
      var value;
      var i;
      offset = offset || dv_offset;

      if (typ === type_enum.CHAR) {
        var c;

        value = "";
        for (i = 0; i < n_bytes; i += 1) {
          c = dv.getUint8(offset + i);
          if (c === 0) {
            break;
          }
          value += String.fromCharCode(c);
        }
      } else if (typ === type_enum.BYTE) {
        value = new Uint8Array(abuf, offset, n_bytes);
      } else {
        var new_abuf = new ArrayBuffer(n_bytes);
        var n = 0;

        if (typ === type_enum.SHORT) {
          value = new Int16Array(new_abuf);
          for (i = 0; i < n_bytes; i += 2) {
            value[n] = dv.getInt16(offset + i);
            n += 1;
          }
        } else if (typ === type_enum.INT) {
          value = new Int32Array(new_abuf);
          for (i = 0; i < n_bytes; i += 4) {
            value[n] = dv.getInt32(offset + i);
            n += 1;
          }
        } else if (typ === type_enum.FLOAT) {
          value = new Float32Array(new_abuf);
          for (i = 0; i < n_bytes; i += 4) {
            value[n] = dv.getFloat32(offset + i);
            n += 1;
          }
        } else if (typ === type_enum.DOUBLE) {
          value = new Float64Array(new_abuf);
          for (i = 0; i < n_bytes; i += 8) {
            value[n] = dv.getFloat64(offset + i);
            n += 1;
          }
        } else {
          throw 'Bad type in get_array ' + typ;
        }
      }
      if (offset === dv_offset)
        dv_offset += pad(n_bytes);
      return value;
    }

    function magic() {
      var s = get_string(3);
      if (s !== 'CDF')
        return false;
      var v = get_u8();
      if (v !== 1)
        return false;
      return true;
    }

    function tagged_list(expected_tag, item_func, func_arg) {
      var i;
      var tag = get_u32();
      var n_elements = get_u32();

      if (tag === expected_tag) {
        for (i = 0; i < n_elements; i++) {
          item_func(func_arg);
        }
      } else if (tag !== 0 || n_elements !== 0) {
        throw new Error("Protocol error.");
      }
    }

    function dimension() {
      var nlen = get_u32();
      var name = get_string(pad(nlen));
      var len = get_u32();
      if (len === 0) {
        throw new Error("Record dimension not implemented.");
      }
      file_dimensions.push({ name: name, length: len });
    }

    function dimensions() {
      tagged_list(10, dimension);
    }

    function attribute(link) {
      var nlen = get_u32();
      var name = get_string(pad(nlen));
      var nc_type = get_u32();
      var nelems = get_u32();
      var value = get_array(nc_type, type_size(nc_type) * nelems);

      link.lnk_attributes.push({ att_name: name,
                                 att_type: nc_type,
                                 att_value: value});
    }

    function attributes(link) {
      tagged_list(12, attribute, link);
    }

    function variable(parent) {
      var i;
      var nlen = get_u32();
      var name = get_string(pad(nlen));
      var ndims = get_u32();
      var dim;
      var child = int_link();
      var dimorder = "";

      for (i = 0; i < ndims; i++) {
        dim = get_u32();
        if (dim < 0 || dim >= file_dimensions.length) {
          throw new Error("Illegal dimension value: " + dim);
        }
        child.lnk_dims.push(file_dimensions[dim].length);
        if (dimorder.length > 0) {
          dimorder += ",";
        }
        dimorder += file_dimensions[dim].name;
      }

      child.lnk_name = name;
      
      attributes(child);
      var nc_type = get_u32();    // data type
      var vsize = get_u32();      // size in bytes
      var begin = get_u32();      // offset in file

      child.lnk_type = nc_type;
      child.lnk_dat_length = vsize;
      child.lnk_dat_offset = begin;
      parent.lnk_children.push(child);

      var my_dim = file_dimensions.find(function(dim) {
        return child.lnk_name === dim.name;
      });
      if (my_dim) {
        console.log(my_dim.name + " " + my_dim.length);
        child.lnk_attributes.push({
          att_name: "length",
          att_type: type_enum.INT,
          att_value: Int32Array.of(my_dim.length)
        });
      }

      child.lnk_dat_array = get_array(nc_type, vsize, begin);

      if (dimorder.length > 0) {
        child.lnk_attributes.push({
          att_name: "dimorder",
          att_type: type_enum.CHAR,
          att_value: dimorder
        });
      }
    }

    function variables(root) {
      tagged_list(11, variable, root);
    }

    if (!magic()) {
      return;
    } else {
      var root = int_link();
      var numrec = get_u32();
      if (numrec !== 0) {
        throw new Error("Record dimension not implemented.");
      }
      dimensions();
      attributes(root);
      variables(root);
      return root;
    }
  };

  console.log("NetCDF is loaded!");
})();
