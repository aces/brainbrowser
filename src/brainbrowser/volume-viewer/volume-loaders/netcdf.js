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

  var type_sizes = [0, 1, 1, 2, 4, 4, 8];

  function type_size(typ) {
    if (typ >= type_enum.BYTE && typ < type_sizes.length) {
      return type_sizes[typ];
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
      return {
        // internal/private
        lnk_dat_offset: 0,
        lnk_dat_length: 0,
        // permanent/global
        lnk_name: "",
        lnk_attributes: {},
        lnk_children: [],
        lnk_dat_array: undefined,
        lnk_type: -1,
        lnk_dims: [],
      };
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

    /** Get an array from the NetCDF file.
     *
     * Tries to be reasonably intelligent about the conversion. In
     * particular, it tries to return an appropriately-typed view
     * into the original file buffer. The trick is that NetCDF is
     * always big-endian, and so we need to byte-swap the data.
     * Also, NetCDF is fastidious about placing things on 4-byte
     * boundaries, but it doesn't guarantee 8-byte alignment for
     * 64-bit floats. So we have to do some heavier lifting there.
     */
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
      } else if (typ === type_enum.DOUBLE) {
        /* Sadly have to special-case this because NetCDF doesn't
         * guarantee 8-byte alignment for doubles, at it seems that
         * at least some JavaScript engines will insist on it.
         */
        var new_abuf = new ArrayBuffer(n_bytes);
        var n = 0;
        value = new Float64Array(new_abuf);
        for (i = 0; i < n_bytes; i += 8) {
          value[n] = dv.getFloat64(offset + i);
          n += 1;
        }
      } else {
        var n_values = n_bytes / type_size(typ);
        VolumeViewer.utils.swapn(new Uint8Array(abuf, offset, n_bytes),
                                 type_size(typ));

        if (typ === type_enum.SHORT) {
          value = new Int16Array(abuf, offset, n_values);
        } else if (typ === type_enum.INT) {
          value = new Int32Array(abuf, offset, n_values);
        } else if (typ === type_enum.FLOAT) {
          value = new Float32Array(abuf, offset, n_values);
        } else {
          throw 'Bad type in get_array ' + typ;
        }
      }
      if (offset === dv_offset)
        dv_offset += pad(n_bytes);
      return value;
    }

    /** Read and verify the magic number in a NetCDF file.
     * We support only version 1 files, so the first 4 bytes
     * should be "CDF\001".
     */
    function magic() {
      var s = get_string(3);
      if (s !== 'CDF')
        return false;
      var v = get_u8();
      if (v !== 1)
        return false;
      return true;
    }

    /** Generic function for reading "tagged lists", which
     * correspond to dimensions, attributes, and/or variables
     * in NetCDF classic.
     */
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

    /** Read a NetCDF dimension from the buffer.
     * The dimension will be saved in the array file_dimensions.
     */
    function dimension() {
      var namelen = get_u32();
      var dimname = get_string(pad(namelen));
      var dimlen = get_u32();
      if (dimlen === 0) {
        throw new Error("Record dimension not implemented.");
      }
      file_dimensions.push({ name: dimname, length: dimlen });
    }

    /** Read a tagged list consisting of NetCDF dimensions.
     */
    function dimensions() {
      tagged_list(10, dimension);
    }

    /** Read a NetCDF attribute from the buffer.
     * The attribute will be saved in the lnk_attributes array of
     * the link.
     */
    function attribute(link) {
      var namelen = get_u32();
      var name = get_string(pad(namelen));
      var nc_type = get_u32();
      var nelems = get_u32();
      var value = get_array(nc_type, type_size(nc_type) * nelems);

      link.lnk_attributes[name] = value;
    }

    /** Read a tagged list consisting of NetCDF attributes.
     */
    function attributes(link) {
      tagged_list(12, attribute, link);
    }

    /** Read a NetCDF variable from the buffer.
     * A new "link" object will be created and added to the lnk_children
     * of the parent.
     *
     * Two non-obvious extensions: 1. The automatic creation
     * of a "dimorder" attribute that indicates the dimension names
     * associated with this variable. 2. The similar creation
     * of a "length" attribute reflecting the dimension length for
     * dimension variables.
     */
    function variable(parent) {
      var i;
      var namelen = get_u32();
      var name = get_string(pad(namelen));
      var ndims = get_u32();
      var dims = [];
      var dimid;
      var child = int_link();
      var dimorder = "";

      /* Get the dimension id's associated with this variable. */
      for (i = 0; i < ndims; i++) {
        dimid = get_u32();
        if (dimid < 0 || dimid >= file_dimensions.length) {
          throw new Error("Illegal dimension id: " + dimid);
        }
        dims.push(file_dimensions[dimid].length);

        /* Mock up the dimorder attribute for this variable. */
        if (dimorder.length > 0) {
          dimorder += ",";
        }
        dimorder += file_dimensions[dimid].name;
      }

      attributes(child);
      var nc_type = get_u32();    // data type
      var vsize = get_u32();      // size in bytes
      var begin = get_u32();      // offset in file

      child.lnk_name = name;
      child.lnk_type = nc_type;
      child.lnk_dims = dims;
      child.lnk_dat_length = vsize;
      child.lnk_dat_offset = begin;
      parent.lnk_children.push(child);

      /** See if this is a dimension variable.
       */
      var my_dim = file_dimensions.find(function (dim) {
        return child.lnk_name === dim.name;
      });
      if (my_dim) {
        var tmp = new Int32Array(new ArrayBuffer(4));
        tmp[0] = my_dim.length;
        child.lnk_attributes.length = tmp;
      }

      /* It is possible for the beginning to be after the end of the file.
       */
      if (begin + vsize <= dv.byteLength) {
        child.lnk_dat_array = get_array(nc_type, vsize, begin);
      }
      if (dimorder.length > 0) {
        child.lnk_attributes.dimorder = dimorder;
      }
    }

    /** Read a tagged list consisting of NetCDF attributes.
     */
    function variables(root) {
      tagged_list(11, variable, root);
    }

    /** The core of the NetCDF reader:
     * 1. Check the magic number.
     * 2. Read the numrec value.
     * 3. Read the list of dimensions.
     * 4. Read the list of global attributes.
     * 5. Read the list of variables.
     */
    if (!magic()) {
      throw new Error("Sorry, this does not look like a NetCDF file.");
    }
    var root = int_link();
    var numrec = get_u32();
    if (numrec !== 0) {
      throw new Error("Record dimension not implemented.");
    }
    dimensions();
    attributes(root);
    variables(root);
    return root;
  };

  console.log("NetCDF is loaded!");
})();
