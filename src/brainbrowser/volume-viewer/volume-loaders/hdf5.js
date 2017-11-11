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
 * Interprets a subset of the HDF5 format for the volume viewer.  This
 * is sufficient to parse most MINC 2.0 files, but may not handle HDF5
 * from other sources!!
 *
 * Relies on pako (https://github.com/nodeca/pako) to inflate
 * compressed data chunks.
 *
 * For details on the HDF5 format, see:
 * https://www.hdfgroup.org/HDF5/doc/H5.format.html
 */
(function () {
  'use strict';
  /* Internal type codes. These have nothing to do with HDF5. */
  var type_enum = {
    INT8: 1,
    UINT8: 2,
    INT16: 3,
    UINT16: 4,
    INT32: 5,
    UINT32: 6,
    FLT: 7,
    DBL: 8,
    STR: 9
  };

  /* The following polyfill copied verbatim from MDN 2016-06-16 */
  if (!Array.prototype.find) {
    Array.prototype.find = function(predicate) {
      if (this === null) {
        throw new TypeError('Array.prototype.find called on null or undefined');
      }
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }
      var list = Object(this);
      var length = list.length >>> 0;
      var thisArg = arguments[1];
      var value;

      for (var i = 0; i < length; i++) {
        value = list[i];
        if (predicate.call(thisArg, value, i, list)) {
          return value;
        }
      }
      return undefined;
    };
  }

  function defined(x) {
    return typeof x !== 'undefined';
  }

  function typeName(x) {
    if (!defined(x)) {
      return "undefined";
    }
    return x.constructor.name;
  }

  var type_sizes = [0, 1, 1, 2, 2, 4, 4, 4, 8, 0];

  function typeSize(typ) {
    if (typ >= type_enum.INT8 && typ < type_sizes.length) {
      return type_sizes[typ];
    }
    throw new Error('Unknown type ' + typ);
  }

  function typeIsFloat(typ) {
    return (typ >= type_enum.FLT && typ <= type_enum.DBL);
  }

  /**
   * @doc function
   * @name hdf5Reader
   * @param {object} abuf The ArrayBuffer containing the data to be
   * parsed.
   * @param {boolean} debug True if we should print debugging information
   * to the console.
   * @returns A 'link' object that corresponds to the root group of the HDF5
   * file structure.
   * @description Attempts to interpret an ArrayBuffer as an HDF5 file.
   */
  function hdf5Reader(abuf, debug) {
    /* 'global' variables. */
    var dv_offset = 0;
    var align = 8;
    var little_endian = true;
    var continuation_queue = [];
    var dv = new DataView(abuf);
    var superblk = {};
    var start_offset = 0;

    debug = debug || false;
    /**
     * @doc object
     * @name hdf5.link
     * @property {string} name The name associated with this object.
     * @property {object} attributes Hash of all of the attributes
     * associated with this object.
     * @property {array} children Indexed list of child nodes.
     * @property {object} array The typed array that contains the actual
     * data associated with the link.
     * @property {number} type The type of the data associated with this 
     * node, one of the type_enum values.
     * @property {boolean} inflate True if the data needs to be decompressed
     * during loading.
     * @property {array} dims The lengths of each dimension in the image.
     * @description This object is used to represent HDF5 objects such as
     * groups and datasets, or NetCDF variables.
     */
    /**
     * @doc function
     * @name hdf5Reader.createLink
     * @returns {object} One of our internal 'link' objects.
     * @description
     * Function to create and initialize one of our internal
     * 'link' objects,  which represent either an HDF5 group
     * or dataset here.
     */
    function createLink() {
      var r = {};
      // internal/private
      r.hdr_offset = 0;         // offset to object header.
      r.data_offset = 0;        // offset to actual data.
      r.data_length = 0;        // length of data.
      r.n_filled = 0;           // counts elements written to array
      r.chunk_size = 0;         // number of bytes per chunk.
      r.chunk_dims = [];        // dimensions of chunks.
      r.sym_btree = 0;          // offset of symbol table btree
      r.sym_lheap = 0;          // offset of symbol table local heap
      // permanent/global
      r.name = "";              // name of this group or dataset.
      r.attributes = {};        // indexed by attribute name.
      r.children = [];          // not associative for now.
      r.array = undefined;      // actual data, if dataset.
      r.type = -1;              // type of data.
      r.inflate = false;        // true if need to inflate (gzip).
      r.dims = [];              // dimension sizes.
      return r;
    }

    /* Turns out that alignment of the messages in at least the
     * version 1 object header is actually relative to the start
     * of the header. So we update the start position of the
     * header here, so we can refer to it when calculating the
     * alignment in checkAlignment().
     */
    function startAlignment() {
      start_offset = dv_offset;
    }

    function checkAlignment() {
      var tmp = dv_offset - start_offset;
      if ((tmp % align) !== 0) {
        var n = align - (tmp % align);
        dv_offset += n;
        if (debug) {
          console.log('skipping ' + n + ' bytes at ' + tmp + ' for alignmnent');
        }
      }
    }

    /* helper functions to manipulate the current DataView offset.
     */
    function skip(n_bytes) {
      dv_offset += n_bytes;
    }

    function seek(new_offset) {
      dv_offset = new_offset;
    }

    function tell() {
      return dv_offset;
    }

    /* helper functions for access to our DataView. */
    function getU8() {
      var v = dv.getUint8(dv_offset);
      dv_offset += 1;
      return v;
    }
    function getU16() {
      var v = dv.getUint16(dv_offset, little_endian);
      dv_offset += 2;
      return v;
    }
    function getU32() {
      var v = dv.getUint32(dv_offset, little_endian);
      dv_offset += 4;
      return v;
    }
    function getU64() {
      var v = dv.getUint64(dv_offset, little_endian);
      dv_offset += 8;
      return v;
    }
    function getF32() {
      var v = dv.getFloat32(dv_offset, little_endian);
      dv_offset += 4;
      return v;
    }
    function getF64() {
      var v = dv.getFloat64(dv_offset, little_endian);
      dv_offset += 8;
      return v;
    }
    function getOffset(offsz) {
      var v = 0;
      offsz = offsz || superblk.offsz;
      if (offsz === 4) {
        v = dv.getUint32(dv_offset, little_endian);
      } else if (offsz === 8) {
        v = dv.getUint64(dv_offset, little_endian);
      } else {
        throw new Error('Unsupported value for offset size ' + offsz);
      }
      dv_offset += offsz;
      return v;
    }
    function getLength() {
      var v = dv.getUint64(dv_offset, little_endian);
      dv_offset += superblk.lensz;
      return v;
    }
    function getString(length) {
      var r = "";
      var i;
      var c;
      for (i = 0; i < length; i += 1) {
        c = getU8();
        if (c === 0) {
          dv_offset += (length - i - 1);
          break;
        }
        r += String.fromCharCode(c);
      }
      return r;
    }

    function getArray(typ, n_bytes, new_off) {
      var value;
      var n_values;
      var new_abuf;
      var i;
      var spp = dv_offset;
      if (new_off) {
        dv_offset = new_off;
      }
      switch (typ) {
      case type_enum.INT8:
        value = new Int8Array(abuf, dv_offset, n_bytes);
        break;
      case type_enum.UINT8:
        value = new Uint8Array(abuf, dv_offset, n_bytes);
        break;
      case type_enum.INT16:
        if ((dv_offset % 2) !== 0) {
          new_abuf = new ArrayBuffer(n_bytes);
          n_values = n_bytes / 2;
          value = new Int16Array(new_abuf);
          for (i = 0; i < n_values; i += 1) {
            value[i] = getU16();
          }
        } else {
          value = new Int16Array(abuf, dv_offset, n_bytes / 2);
          dv_offset += n_bytes;
        }
        break;
      case type_enum.UINT16:
        if ((dv_offset % 2) !== 0) {
          new_abuf = new ArrayBuffer(n_bytes);
          n_values = n_bytes / 2;
          value = new Uint16Array(new_abuf);
          for (i = 0; i < n_values; i += 1) {
            value[i] = getU16();
          }
        } else {
          value = new Uint16Array(abuf, dv_offset, n_bytes / 2);
          dv_offset += n_bytes;
        }
        break;
      case type_enum.INT32:
        if ((dv_offset % 4) !== 0) {
          new_abuf = new ArrayBuffer(n_bytes);
          n_values = n_bytes / 4;
          value = new Int32Array(new_abuf);
          for (i = 0; i < n_values; i += 1) {
            value[i] = getU32();
          }
        } else {
          value = new Int32Array(abuf, dv_offset, n_bytes / 4);
          dv_offset += n_bytes;
        }
        break;
      case type_enum.UINT32:
        if ((dv_offset % 4) !== 0) {
          new_abuf = new ArrayBuffer(n_bytes);
          n_values = n_bytes / 4;
          value = new Uint32Array(new_abuf);
          for (i = 0; i < n_values; i += 1) {
            value[i] = getU32();
          }
        } else {
          value = new Uint32Array(abuf, dv_offset, n_bytes / 4);
          dv_offset += n_bytes;
        }
        break;
      case type_enum.FLT:
        if ((dv_offset % 4) !== 0) {
          new_abuf = new ArrayBuffer(n_bytes);
          n_values = n_bytes / 4;
          value = new Float32Array(new_abuf);
          for (i = 0; i < n_values; i += 1) {
            value[i] = getF32();
          }
        } else {
          value = new Float32Array(abuf, dv_offset, n_bytes / 4);
          dv_offset += n_bytes;
        }
        break;
      case type_enum.DBL:
        if ((dv_offset % 8) !== 0) {
          new_abuf = new ArrayBuffer(n_bytes);
          n_values = n_bytes / 8;
          value = new Float64Array(new_abuf);
          for (i = 0; i < n_values; i += 1) {
            value[i] = getF64();
          }
        } else {
          value = new Float64Array(abuf, dv_offset, n_bytes / 8);
          dv_offset += n_bytes;
        }
        break;
      default:
        throw new Error('Bad type in getArray ' + typ);
      }
      if (new_off) {
        dv_offset = spp;
      }
      return value;
    }

    /* Get a variably-sized integer from the DataView. */
    function getUXX(n) {
      var v;
      var i;
      switch (n) {
      case 1:
        v = dv.getUint8(dv_offset);
        break;
      case 2:
        v = dv.getUint16(dv_offset, little_endian);
        break;
      case 4:
        v = dv.getUint32(dv_offset, little_endian);
        break;
      case 8:
        v = dv.getUint64(dv_offset, little_endian);
        break;
      default:
        /* Certain hdf5 types can have odd numbers of bytes. We try
         * to deal with that special case here.
         */
        v = 0;
        if (!little_endian) {
          for (i = 0; i < n; i++) {
            v = (v << 8) + dv.getUint8(dv_offset + i);
          }
        }
        else {
          for (i = n - 1; i >= 0; i--) {
            v = (v << 8) + dv.getUint8(dv_offset + i);
          }
        }
      }
      dv_offset += n;
      return v;
    }

    /* Patch in the missing function to get 64-bit integers.
     * Note: this won't really quite work b/c Javascript doesn't
     * have support for 64-bit integers.
     */
    dv.getUint64 = function (off, little_endian) {
      var l4 = dv.getUint32(off + 0, little_endian);
      var u4 = dv.getUint32(off + 4, little_endian);
      if (little_endian) {
        return (u4 << 32) + l4;
      } else {
        return (l4 << 32) + u4;
      }
    };

    /* Verify that the expected signature is found at this offset.
     */
    function checkSignature(str) {
      var i;
      for (i = 0; i < str.length; i += 1) {
        if (dv.getUint8(dv_offset + i) !== str.charCodeAt(i)) {
          return false;
        }
      }
      skip(str.length);
      return true;
    }

    function hdf5Superblock() {
      var sb = {};
      if (!checkSignature("\u0089HDF\r\n\u001A\n")) {
        throw new Error('Bad magic string in HDF5');
      }
      sb.sbver = getU8();
      if (sb.sbver > 2) {
        throw new Error('Unsupported HDF5 superblock version ' + sb.sbver);
      }
      if (sb.sbver <= 1) {
        sb.fsver = getU8();
        sb.rgver = getU8();
        skip(1);            // reserved
        sb.shver = getU8();
        sb.offsz = getU8();
        sb.lensz = getU8();
        skip(1);            // reserved
        sb.gln_k = getU16();
        sb.gin_k = getU16();
        sb.cflags = getU32();
        if (sb.sbver === 1) {
          sb.isin_k = getU16();
          skip(2);        // reserved
        }
        sb.base_addr = getOffset(sb.offsz);
        sb.gfsi_addr = getOffset(sb.offsz);
        sb.eof_addr = getOffset(sb.offsz);
        sb.dib_addr = getOffset(sb.offsz);
        sb.root_ln_offs = getOffset(sb.offsz);
        sb.root_addr = getOffset(sb.offsz);
        sb.root_cache_type = getU32();
        skip(4);
        skip(16);
      } else {
        sb.offsz = getU8();
        sb.lensz = getU8();
        sb.cflags = getU8();
        sb.base_addr = getOffset(sb.offsz);
        sb.ext_addr = getOffset(sb.offsz);
        sb.eof_addr = getOffset(sb.offsz);
        sb.root_addr = getOffset(sb.offsz);
        sb.checksum = getU32();
      }
      if (debug) {
        console.log("HDF5 SB " + sb.sbver + " " + sb.offsz + " " + sb.lensz + " " + sb.cflags);
      }
      return sb;
    }

    /* read the v2 fractal heap header */
    function hdf5FractalHeapHeader() {
      var fh = {};
      if (!checkSignature("FRHP")) {
        throw new Error('Bad or missing FRHP signature');
      }
      fh.ver = getU8();         // Version
      fh.idlen = getU16();      // Heap ID length
      fh.iof_el = getU16();     // I/O filter's encoded length
      fh.flags = getU8();       // Flags
      fh.objmax = getU32();     // Maximum size of managed objects.
      fh.objnid = getLength();  // Next huge object ID
      fh.objbta = getOffset();  // v2 B-tree address of huge objects
      fh.nf_blk = getLength();  // Amount of free space in managed blocks
      fh.af_blk = getOffset();  // Address of managed block free space manager
      fh.heap_total = getLength(); // Amount of managed space in heap
      fh.heap_alloc = getLength(); // Amount of allocated managed space in heap
      fh.bai_offset = getLength(); // Offset of direct block allocation iterator
      fh.heap_nobj = getLength();  // Number of managed objects in heap
      fh.heap_chuge = getLength(); // Size of huge objects in heap
      fh.heap_nhuge = getLength(); // Number of huge objects in heap
      fh.heap_ctiny = getLength(); // Size of tiny objects in heap
      fh.heap_ntiny = getLength(); // Number of tiny objects in heap
      fh.table_width = getU16();   // Table width
      fh.start_blksz = getLength(); // Starting block size
      fh.max_blksz = getLength();   // Maximum direct block size
      fh.max_heapsz = getU16();     // Maximum heap size
      fh.rib_srows = getU16();      // Starting # of rows in root indirect block
      fh.root_addr = getOffset();   // Address of root block
      fh.rib_crows = getU16();      // Current # of rows in root indirect block

      var max_dblock_rows = Math.log2(fh.max_blksz) - Math.log2(fh.start_blksz) + 2;
      fh.K = Math.min(fh.rib_crows, max_dblock_rows) * fh.table_width;
      fh.N = (fh.rib_crows < max_dblock_rows) ? 0 : fh.K - (max_dblock_rows * fh.table_width);

      if (debug) {
        console.log("FRHP V" + fh.ver + " F" + fh.flags + " " + fh.objbta + " Total:" + fh.heap_total + " Alloc:" + fh.heap_alloc + " #obj:" + fh.heap_nobj + " width:" + fh.table_width + " start_blksz:" + fh.start_blksz + " max_blksz:" + fh.max_blksz + " " + fh.max_heapsz + " srows:" + fh.rib_srows + " crows:" + fh.rib_crows + " " + fh.heap_nhuge);
        console.log("   K: " + fh.K + " N: " + fh.N);
      }

      if (fh.iof_el > 0) {
        throw new Error("Filters present in fractal heap.");
      }
      return fh;
    }

    /* read the v2 btree header */
    function hdf5V2BtreeHeader() {
      var bh = {};
      if (!checkSignature("BTHD")) {
        throw new Error('Bad or missing BTHD signature');
      }
      bh.ver = getU8();
      bh.type = getU8();
      bh.nodesz = getU32();
      bh.recsz = getU16();
      bh.depth = getU16();
      bh.splitp = getU8();
      bh.mergep = getU8();
      bh.root_addr = getOffset();
      bh.root_nrec = getU16();
      bh.total_nrec = getLength();
      bh.checksum = getU32();

      if (debug) {
        console.log("BTHD V" + bh.ver + " T" + bh.type + " " + bh.nodesz + " " + bh.recsz + " " + bh.depth + " " + bh.root_addr + " " + bh.root_nrec + " " + bh.total_nrec);
      }
      return bh;
    }

    var huge_id;

    /*
     * Enumerates btree records in a block. Records are found both in direct
     * and indirect v2 btree blocks.
     */
    function hdf5V2BtreeRecords(fh, bt_type, nrec, link) {
      var i;
      var spp;                  // saved position pointer
      var offset;
      var length;
      if (bt_type === 1) {
        for (i = 0; i < nrec; i++) {
          offset = getOffset();
          length = getLength();
          var id = getLength();
          if (debug) {
            console.log("  -> " + offset + " " + length + " " + id + " " + huge_id);
          }
          spp = tell();
          if (id === huge_id) {
            seek(offset);
            hdf5MsgAttribute(length, link);
          }
          seek(spp);
        }
      }
      else if (bt_type === 8) {
        var cb_offs;
        var cb_leng;
        /* maximum heap size is stored in bits! */
        cb_offs = fh.max_heapsz / 8;
        var tmp = Math.min(fh.objmax, fh.max_blksz);
        if (tmp <= 256) {
          cb_leng = 1;
        }
        else if (tmp <= 65536) {
          cb_leng = 2;
        }
        else {
          cb_leng = 4;
        }
        for (i = 0; i < nrec; i++) {
          /* Read managed fractal heap ID.
           */
          var vt = getU8();
          if ((vt & 0xc0) !== 0) {
            throw new Error('Bad Fractal Heap ID version ' + vt);
          }
          var id_type = (vt & 0x30);
          var flags;
          if (id_type === 0x10) {     // huge!
            huge_id = getUXX(7);
          }
          else if (id_type === 0x00) { // managed.
            offset = getUXX(cb_offs);
            length = getUXX(cb_leng);
          }
          else {
            throw new Error("Can't handle this Heap ID: " + vt);
          }
          flags = getU8();

          /* Read the rest of the record.
           */
          getU32();               // creation order (IGNORE)
          getU32();               // hash (IGNORE)
          if (debug) {
            console.log("  -> " + vt + " " + offset + " " + length + " " + flags);
          }
          spp = tell();
          if (id_type === 0x10) {
            /* A "huge" object is found by indexing through the btree
             * present in the header
             */
            seek(fh.objbta);
            var bh = hdf5V2BtreeHeader();
            if (bh.type === 1) {
              seek(bh.root_addr);
              hdf5V2BtreeLeafNode(fh, bh.root_nrec, link);
            }
            else {
              throw new Error("Can only handle type-1 btrees");
            }
          }
          else {
            /*
             * A managed object implies that the attribute message is
             * found in the associated fractal heap at the specified
             * offset in the heap. We get the actual address
             * corresponding to the offset here.
             */
            var location = hdf5FractalHeapOffset(fh, offset);
            if (location >= 0) {
              seek(location);
              hdf5MsgAttribute(length, link);
            }
          }
          seek(spp);
        }
      }
      else {
        throw new Error("Unhandled V2 btree type.");
      }
    }

    /* read a v2 btree leaf node */
    function hdf5V2BtreeLeafNode(fh, nrec, link) {

      if (!checkSignature("BTLF")) {
        throw new Error('Bad or missing BTLF signature');
      }

      var ver = getU8();
      var typ = getU8();

      if (debug) {
        console.log("BTLF V" + ver + " T" + typ + " " + tell());
      }
      hdf5V2BtreeRecords(fh, typ, nrec, link);
    }

    /* read the hdf5 v2 btree internal node */
    function hdf5V2BtreeInternalNode(fh, nrec, depth, link) {

      if (!checkSignature("BTIN")) {
        throw new Error('Bad or missing BTIN signature');
      }
      var ver = getU8();
      var type = getU8();
      var i;

      if (debug) {
        console.log("BTIN V" + ver + " T" + type);
      }
      hdf5V2BtreeRecords(fh, type, nrec, link);
      for (i = 0; i <= nrec; i++) {
        var child_offset = getOffset();
        var child_nrec = getUXX(1); // TODO: calculate real size!!
        var child_total;
        /* TODO: unfortunately, this field is optional and
         * variably-sized. Calculating the size is non-trivial, as it
         * depends on the total depth and size of the tree. For now
         * we will just assume it is its minimum size, as I've never
         * encountered a file with depth > 1 anyway.
         */
        if (depth > 1) {
          child_total = getUXX(1);
        }
        if (debug) {
          console.log(" child->" + child_offset + " " + child_nrec + " " + child_total);
        }
      }
    }

    /* Names of the various HDF5 messages.
     * Note that MESSAGE23 appears to be illegal. All the rest are defined,
     * although I've never encountered a BOGUS message!
     */
    var msg_names = [
      "NIL", "Dataspace", "LinkInfo", "Datatype", "FillValue 1", "FillValue 2",
      "Link", "ExternalFiles", "Layout", "BOGUS", "GroupInfo", "FilterPipeline",
      "Attribute", "ObjectComment", "ObjectModTime 1", "SharedMsgTable",
      "ObjHdrContinue", "SymbolTable", "ObjectModTime 2", "BtreeKValue",
      "DriverInfo", "AttrInfo", "ObjectRefCnt", "MESSAGE23",
      "FileSpaceInfo"
    ];

    function hdf5GetMsgName(n) {
      if (n < msg_names.length) {
        return msg_names[n];
      }
      throw new Error('Unknown message type ' + n + " " + tell());
    }


    // Compute the expected uncompressed size of a chunk.  We have to
    // do some additional calculation because it is possible to have a
    // "padded" chunk when the chunk dimension is not an even multiple
    // of the total dataset dimension.
    //
    function calcChunkSize(dims, chunk_dims, chunk_offsets) {
      var j;
      var result = 1;
      for (j = 0; j < dims.length; j++) {
        // compute the number of remaining points in this chunk.
        var diff = dims[j] - chunk_offsets[j];
        if ( chunk_dims[j] > diff ) {
          result *= diff;
        }
        else {
          result *= chunk_dims[j];
        }
      }
      return result;
    }

    function hdf5V1BtreeNode(link) {
      var i;
      var bt = {};
      if (!checkSignature("TREE")) {
        throw new Error('Bad TREE signature at ' + tell());
      }

      bt.keys = [];

      bt.node_type = getU8();
      bt.node_level = getU8();
      bt.entries_used = getU16();
      bt.left_sibling = getOffset();
      bt.right_sibling = getOffset();

      if (debug) {
        console.log("BTREE type " + bt.node_type + " lvl " +
                    bt.node_level + " n_used " + bt.entries_used + " " +
                    bt.left_sibling + " " + bt.right_sibling);
      }

      if (!link) {
        /* If this BTREE is associated with a group (not a dataset),
         * then its keys are single "length" value.
         */
        for (i = 0; i < bt.entries_used; i += 1) {
          bt.keys[i] = {};
          bt.keys[i].key_value = getLength();
          bt.keys[i].child_address = getOffset();
          if (debug) {
            console.log("  BTREE " + i + " key " +
                        bt.keys[i].key_value + " adr " +
                        bt.keys[i].child_address);
          }
        }
      } else {
        var j;

        /* If this BTREE is a "chunked raw data node" associated
         * with a dataset, then its keys are complex, consisting
         * of the chunk size in bytes, a filter mask, and a set of
         * offsets matching the dimensionality of the chunk layout.
         * The chunk size stores the actual stored length of the
         * data, so it may not equal the uncompressed chunk size.
         */
        var chunks = [];

        for (i = 0; i < bt.entries_used; i += 1) {
          bt.keys[i] = {};
          chunks[i] = {};
          chunks[i].chunk_size = getU32();
          chunks[i].filter_mask = getU32();
          chunks[i].chunk_offsets = [];
          for (j = 0; j < link.dims.length + 1; j += 1) {
            chunks[i].chunk_offsets.push(getU64());
          }
          bt.keys[i].child_address = getOffset();
          if (i < bt.entries_used) {
            if (debug) {
              console.log("  BTREE " + i +
                          " chunk_size " + chunks[i].chunk_size +
                          " filter_mask " + chunks[i].filter_mask +
                          " addr " + bt.keys[i].child_address);
            }
          }
        }
        chunks[i] = {};
        chunks[i].chunk_size = getU32();
        chunks[i].filter_mask = getU32();
        chunks[i].chunk_offsets = [];
        for (j = 0; j < link.dims.length + 1; j += 1) {
          chunks[i].chunk_offsets.push(getU64());
        }

        /* If we're at a leaf node, we have data to deal with.
         * We might have to uncompress!
         */
        if (bt.node_level === 0) {
          var length;
          var offset;
          var sp;
          var dp;

          for (i = 0; i < bt.entries_used; i += 1) {
            length = chunks[i].chunk_size;
            offset = bt.keys[i].child_address;

            var dst_length = calcChunkSize(link.dims, link.chunk_dims,
                                           chunks[i].chunk_offsets);
            if (link.inflate) {
              sp = new Uint8Array(abuf, offset, length);
              dp = pako.inflate(sp);
              switch (link.type) {
              case type_enum.INT8:
                dp = new Int8Array(dp.buffer);
                break;
              case type_enum.UINT8:
                dp = new Uint8Array(dp.buffer);
                break;
              case type_enum.INT16:
                dp = new Int16Array(dp.buffer);
                break;
              case type_enum.UINT16:
                dp = new Uint16Array(dp.buffer);
                break;
              case type_enum.INT32:
                dp = new Int32Array(dp.buffer);
                break;
              case type_enum.UINT32:
                dp = new Uint32Array(dp.buffer);
                break;
              case type_enum.FLT:
                dp = new Float32Array(dp.buffer);
                break;
              case type_enum.DBL:
                dp = new Float64Array(dp.buffer);
                break;
              default:
                throw new Error('Unknown type code ' + link.type);
              }
              if (dst_length < dp.length) {
                dp = dp.subarray(0, dst_length);
              }
              if (link.array.length - link.n_filled < dp.length) {
                dp = dp.subarray(0, link.array.length - link.n_filled);
                console.log("WARNING: Discarding excess data.");
              }
              link.array.set(dp, link.n_filled);
              link.n_filled += dp.length;
              if (debug) {
                console.log(link.name + " " + sp.length + " " + dp.length + " " + link.n_filled + "/" + link.array.length);
              }
            }
            else {
              /* no need to inflate data. */
              dp = getArray(link.type, length, offset);
              link.array.set(dp, link.n_filled);
              link.n_filled += dp.length;
            }
          }
        } else {
          for (i = 0; i < bt.entries_used; i += 1) {
            seek(bt.keys[i].child_address);
            hdf5V1BtreeNode(link);
          }
        }
      }
      return bt;
    }

    function hdf5GroupSymbolTable(lh, link) {
      if (!checkSignature("SNOD")) {
        throw new Error('Bad or missing SNOD signature');
      }
      var ver = getU8();
      skip(1);
      var n_sym = getU16();
      if (debug) {
        console.log("hdf5GroupSymbolTable V" + ver + " #" + n_sym +
                    " '" + link.name + "'");
      }
      var i;
      var link_name_offset;
      var ohdr_address;
      var cache_type;
      var child;
      var spp;

      for (i = 0; i < 2 * superblk.gln_k; i += 1) {
        link_name_offset = getOffset();
        ohdr_address = getOffset();
        cache_type = getU32();
        skip(20);

        if (i < n_sym) {
          child = createLink();
          child.hdr_offset = ohdr_address;
          if (lh) {
            spp = tell();
            /* The link name is a zero-terminated string
             * starting at the link_name_off relative to
             * the beginning of the data segment of the local
             * heap.
             */
            seek(lh.lh_dseg_off + link_name_offset);
            child.name = getString(lh.lh_dseg_len);
            seek(spp);
          }
          if (debug) {
            console.log("    " + i + " O " + link_name_offset + " A " +
                        ohdr_address + " T " + cache_type + " '" +
                        child.name + "'");
          }
          link.children.push(child);
        }
      }
    }

    /* Read a v1 local heap header. These define relatively small
     * regions used primarily for storing symbol names associated with
     * a symbol table message.
     */
    function hdf5LocalHeap() {
      var lh = {};
      if (!checkSignature("HEAP")) {
        throw new Error('Bad or missing HEAP signature');
      }
      lh.lh_ver = getU8();
      skip(3);
      lh.lh_dseg_len = getLength();
      lh.lh_flst_len = getLength();
      lh.lh_dseg_off = getOffset();
      if (debug) {
        console.log("LHEAP V" + lh.lh_ver + " " + lh.lh_dseg_len + " " +
                    lh.lh_flst_len + " " + lh.lh_dseg_off);
      }
      return lh;
    }

    /* Process a "dataspace" message. Dataspaces define the
     * dimensionality of a dataset or attribute. They define the
     * number of dimensions (rank) and the current length of each
     * dimension. It is possible to specify a "maximum" length that is
     * greater than or equal to the current length, but MINC doesn't
     * rely on that feature so these values are ignored.  Finally it
     * is also possible to specify a "permutation index" that alters
     * storage order of the dataset, but again, MINC doesn't rely on
     * this feature, so the values are ignored.
     */
    function hdf5MsgDataspace(sz, link) {
      var cb;
      var ver = getU8();
      var n_dim = getU8();
      var flag = getU8();
      if (ver <= 1) {
        skip(5);
      } else {
        skip(1);
      }

      var n_items = 1;
      var dlen = [];
      var i;
      for (i = 0; i < n_dim; i += 1) {
        dlen[i] = getLength();
        n_items *= dlen[i];
      }

      cb = (n_dim * superblk.lensz) + ((ver <= 1) ? 8 : 4);

      var dmax = [];
      if ((flag & 1) !== 0) {
        cb += n_dim * superblk.lensz;
        for (i = 0; i < n_dim; i += 1) {
          dmax[i] = getLength();
        }
      }

      var dind = [];
      if ((flag & 2) !== 0) {
        cb += n_dim * superblk.lensz;
        for (i = 0; i < n_dim; i += 1) {
          dind[i] = getLength();
        }
      }
      var msg = "hdf5MsgDataspace V" + ver + " N" + n_dim + " F" + flag;
      if (debug) {
        if (n_dim !== 0) {
          msg += "[" + dlen.join(', ') + "]";
        }
        console.log(msg);
      }
      if (cb < sz) {
        skip(sz - cb);
      }
      if (link) {
        link.dims = dlen;
      }
      return n_items;
    }

    /*
     * link info messages may contain a fractal heap address where we
     * can find additional link messages for this object. This
     * happens, for example, when there are lots of links in a
     * particular group.
     */
    function hdf5MsgLinkInfo(link) {
      var ver = getU8();
      var flags = getU8();
      if ((flags & 1) !== 0) {
        getU64();          // max. creation index (IGNORE).
      }
      var fh_address = getOffset(); // fractal heap address
      var bt_address = getOffset(); // v2 btree for name index
      if ((flags & 2) !== 0) {
        getOffset();       // creation order index (IGNORE).
      }
      if (debug) {
        console.log("hdf5MsgLinkInfo V" + ver + " F" + flags +
                    " FH " + fh_address + " BT " + bt_address);
      }
      var spp = tell();
      if (fh_address < superblk.eof_addr) {
        seek(fh_address);
        /* If there is a valid fractal heap address in the link info message, that
         * means the fractal heap is a collection of link messages. We can ignore
         * the btree address because we can get the names from the link messages.
         */
        var fh = hdf5FractalHeapHeader();
        var n_msg = 0;
        hdf5FractalHeapEnumerate( fh, function(row, address, block_offset, block_length) {
          /* Avoid errors caused by extra alignment bytes by
           * ignoring the last few bytes in the block, if
           * present.
           */
          var end_address = address + block_length - 4;
          while (n_msg < fh.heap_nobj && tell() < end_address) {
            hdf5MsgLink(link);
            n_msg += 1;
          }
          return true;          // continue with enumeration.
        });
      }
      seek(spp);
    }

    function dt_class_name(cls) {
      var names = [
        "Fixed-Point", "Floating-Point", "Time", "String",
        "BitField", "Opaque", "Compound", "Reference",
        "Enumerated", "Variable-Length", "Array"
      ];

      if (cls < names.length) {
        return names[cls];
      }
      throw new Error('Unknown datatype class: ' + cls);
    }

    /* Process a "datatype" message. These messages specify the data
     * type of a single element within a dataset or attribute. Data
     * types are extremely flexible, HDF5 supports a range of options
     * for bit widths and organization atomic types. We support only
     * fixed, float, and string atomic types, and those only for
     * certain restricted (but common) cases.  At this point we
     * provide no support for more exotic types such as bit field,
     * enumerated, array, opaque, compound, time, reference,
     * variable-length, etc.
     *
     * TODO: should support enumerated types, possibly a few others.
     */
    function hdf5MsgDatatype(sz) {
      var type = {};
      var cb = 8;
      var msg = "";
      var bit_offs;
      var bit_prec;
      var exp_loc;
      var exp_sz;
      var mnt_loc;
      var mnt_sz;
      var exp_bias;

      var cv = getU8();
      var ver = cv >> 4;
      var cls = cv & 15;
      var bf = [];
      var i;
      for (i = 0; i < 3; i += 1) {
        bf[i] = getU8();
      }
      var dt_size = getU32();

      if (debug) {
        console.log("hdf5MsgDatatype V" + ver + " C" + cls +
                    " " + dt_class_name(cls) +
                    " " + bf[0] + "." + bf[1] + "." + bf[2] +
                    " " + dt_size);
      }

      switch (cls) {
      case 0:      /* Fixed (integer): bit 0 for byte order, bit 3 for signed */
        bit_offs = getU16();
        bit_prec = getU16();
        switch (dt_size) {
        case 4:
          type.typ_type = (bf[0] & 8) ? type_enum.INT32 : type_enum.UINT32;
          break;
        case 2:
          type.typ_type = (bf[0] & 8) ? type_enum.INT16 : type_enum.UINT16;
          break;
        case 1:
          type.typ_type = (bf[0] & 8) ? type_enum.INT8 : type_enum.UINT8;
          break;
        default:
          throw new Error('Unknown type size ' + dt_size);
        }
        type.typ_length = dt_size;
        cb += 4;
        if (debug) {
          console.log('  (' + bit_offs + ' ' + bit_prec + ')');
        }
        break;
      case 1:                /* Float: uses bits 0,6 for byte order */
        msg = "";
        if (debug) {
          switch (bf[0] & 0x41) {
          case 0:
            msg += "LE ";
            break;
          case 1:
            msg += "BE ";
            break;
          case 0x41:
            msg += "VX ";
            break;
          default:
            throw new Error('Reserved fp byte order: ' + bf[0]);
          }
        }
        bit_offs = getU16();
        bit_prec = getU16();
        exp_loc = getU8();
        exp_sz = getU8();
        mnt_loc = getU8();
        mnt_sz = getU8();
        exp_bias = getU32();
        if (debug) {
          msg += (bit_offs + " " + bit_prec + " " + exp_loc + " " + exp_sz +
                  " " + mnt_loc + " " + mnt_sz + " " + exp_bias);
        }
        /* See if it's one of the formats we recognize.
           IEEE 64-bit or IEEE 32-bit are the only two we handle.
        */
        if (bit_prec === 64 && bit_offs === 0 &&
            exp_loc === 52 && exp_sz === 11 &&
            mnt_loc === 0 && mnt_sz === 52 &&
            exp_bias === 1023 && dt_size === 8) {
          type.typ_type = type_enum.DBL;
        } else if (bit_prec === 32 && bit_offs === 0 &&
                   exp_loc === 23 && exp_sz === 8 &&
                   mnt_loc === 0 && mnt_sz === 23 &&
                   exp_bias === 127 && dt_size === 4) {
          type.typ_type = type_enum.FLT;
        } else {
          throw new Error("Unsupported floating-point type");
        }
        if (debug) {
          console.log(msg);
        }
        type.typ_length = dt_size;
        cb += 12;
        break;

      case 3:                   // string
        /* bits 0-3 = 0: null terminate, 1: null pad, 2: space pad */
        /* bits 4-7 = 0: ASCII, 1: UTF-8 */
        type.typ_type = type_enum.STR;
        type.typ_length = dt_size;
        break;

      default:
        throw new Error('Unimplemented HDF5 data class ' + cls);
      }
      if (sz > cb) {
        skip(sz - cb);
      }
      return type;
    }

    /* Process a "layout" message. These messages specify the location and organization
     * of data in a dataset. The organization can be either compact, contiguous, or
     * chunked. Compact data is stored in the message as a contiguous block. Contiguous
     * data is stored elsewhere in the file in a single chunk. Chunked data is stored within
     * a V1 Btree as a series of possibly filtered (e.g. compressed) chunks.
     */
    function hdf5MsgLayout(link) {
      var msg = "";

      var ver = getU8();
      var cls;
      var n_dim;
      var cdsz;
      var dim = [];
      var i;
      var dtadr;
      var dtsz;
      var elsz;

      var n_items = 1;
      if (ver === 1 || ver === 2) {
        n_dim = getU8();
        cls = getU8();
        skip(5);
        if (debug) {
          msg += "hdf5MsgLayout V" + ver + " N" + n_dim + " C" + cls;
        }
        if (cls === 1 || cls === 2) { // contiguous or chunked
          var addr = getOffset();
          if (debug) {
            msg += " A" + addr;
          }
          link.data_offset = addr;
        }

        for (i = 0; i < n_dim; i += 1) {
          dim[i] = getU32();
          n_items *= dim[i];
        }

        if (debug) {
          msg += "[" + dim.join(', ') + "]";
        }

        if (cls === 2) {        // chunked
          elsz = getU32();
          link.chunk_dims = dim; // save chunk dimensions.
          link.chunk_size = n_items * elsz;
          if (debug) {
            msg += " E" + elsz;
          }
        }
        if (cls === 0) {        // compact
          cdsz = getU32();
          if (debug) {
            msg += "(" + cdsz + ")";
          }
          link.data_offset = tell();
          link.data_length = cdsz;
        } else if (cls === 1) {
          link.data_length = n_items;
        }
      } else if (ver === 3) {
        cls = getU8();
        msg = "hdf5MsgLayout V" + ver + " C" + cls;

        if (cls === 0) {
          cdsz = getU16();
          if (debug) {
            msg += "(" + cdsz + ")";
          }
          link.data_offset = tell();
          link.data_length = cdsz;
        } else if (cls === 1) {
          dtadr = getOffset();
          dtsz = getLength();
          if (debug) {
            msg += "(" + dtadr + ", " + dtsz + ")";
          }
          link.data_offset = dtadr;
          link.data_length = dtsz;
        } else if (cls === 2) {
          n_dim = getU8();
          dtadr = getOffset();
          link.data_offset = dtadr;
          link.chunk_size = 1;
          for (i = 0; i < n_dim - 1; i += 1) {
            dim[i] = getU32();
            n_items *= dim[i];
          }
          if (debug) {
            msg += "(N" + n_dim + ", A" + dtadr + " [" + dim.join(',') + "]";
          }
          elsz = getU32();
          link.chunk_dims = dim; // save chunk dimensions.
          link.chunk_size = n_items * elsz;
          if (debug) {
            msg += " E" + elsz;
          }
        }
      } else {
        throw new Error("Illegal layout version " + ver);
      }
      if (debug) {
        console.log(msg);
      }
    }

    /*
     * Read a "filter pipeline" message. At the moment we _only_ handle
     * deflate/inflate. Anything else will cause us to throw an exception.
     */
    function hdf5MsgPipeline(link) {
      var ver = getU8();
      var nflt = getU8();

      var msg = "hdf5MsgPipeline V" + ver + " N" + nflt;
      if (ver === 1) {
        skip(6);
      }

      if (debug) {
        console.log(msg);
      }

      var i;
      var fiv;
      var nlen;
      var flags;
      var ncdv;
      for (i = 0; i < nflt; i += 1) {
        fiv = getU16();
        if (fiv !== 1) {             /* deflate */
          throw new Error("Unimplemented HDF5 filter " + fiv);
        }
        else {
          if (typeof pako !== 'object') {
            throw new Error('Need pako to inflate data.');
          }
          link.inflate = true;
        }
        if (ver === 1 || fiv > 256) {
          nlen = getU16();
        } else {
          nlen = 0;
        }

        flags = getU16();
        ncdv = getU16();
        if ((ncdv & 1) !== 0) {
          ncdv += 1;
        }
        if (nlen !== 0) {
          skip(nlen);     // ignore name.
        }

        skip(ncdv * 4);

        if (debug) {
          console.log("  " + i + " ID" + fiv + " F" + flags + " " + ncdv);
        }
      }
    }

    /* Process an "attribute" message. This actually defines an attribute that is
     * to be associated with a group or dataset (what I generally call a "link"
     * in this code. Attributes include a name, a datatype, and a dataspace, followed
     * by the actual data.
     */
    function hdf5MsgAttribute(sz, link) {
      var ver = getU8();
      var flags = getU8();
      var nm_len = getU16();
      var dt_len = getU16();
      var ds_len = getU16();
      var msg = "hdf5MsgAttribute V" + ver + " F" + flags + " " + sz + ": ";

      if ((flags & 3) !== 0) {
        throw new Error('Shared dataspaces and datatypes are not supported.');
      }

      if (ver === 3) {
        var cset = getU8();
        if (debug) {
          msg += (cset === 0) ? "ASCII" : "UTF-8";
        }
      }
      if (debug) {
        msg += "(" + nm_len + " " + dt_len + " " + ds_len + ")";
      }
      if (ver < 3) {
        nm_len = Math.floor((nm_len + 7) / 8) * 8;
        dt_len = Math.floor((dt_len + 7) / 8) * 8;
        ds_len = Math.floor((ds_len + 7) / 8) * 8;

        if (debug) {
          msg += "/(" + nm_len + " " + dt_len + " " + ds_len + ")";
        }
      }

      var att_name = getString(nm_len);
      if (debug) {
        msg += " Name: " + att_name;
        console.log(msg);
      }
      var val_type = hdf5MsgDatatype(dt_len);
      var n_items = hdf5MsgDataspace(ds_len);
      var val_len = 0;
      if (sz > 0) {
        if (ver < 3) {
          val_len = sz - (8 + nm_len + dt_len + ds_len);
        } else {
          val_len = sz - (9 + nm_len + dt_len + ds_len);
        }
      } else {
        val_len = val_type.typ_length * n_items;
      }
      if (debug) {
        console.log("  attribute data size " + val_len + " " + tell());
      }
      var att_value;
      if (val_type.typ_type === type_enum.STR) {
        att_value = getString(val_len);
      } else {
        att_value = getArray(val_type.typ_type, val_len);
      }
      link.attributes[att_name] = att_value;
    }

    /* Process a "group info" message. We don't actually do anything with these.
     */
    function hdf5MsgGroupInfo() {
      var n_ent = 4;
      var n_lnl = 8;
      var ver = getU8();
      var flags = getU8();
      if ((flags & 1) !== 0) {
        getU16();          // link phase change: max compact value (IGNORE)
        getU16();          // link phase cange: max dense value (IGNORE)
      }
      if ((flags & 2) !== 0) {
        n_ent = getU16();
        n_lnl = getU16();
      }
      if (debug) {
        console.log("hdf5MsgGroupInfo V" + ver + " F" + flags + " ENT " + n_ent + " LNL " + n_lnl);
      }
    }

    /* Process a "link" message. This specifies the name and header location of either a
     * group or a dataset within the current group. It is probably also used to implement
     * internal links but we don't really support that.
     */
    function hdf5MsgLink(link) {
      var ver = getU8();
      var ltype = 0;
      if (ver !== 1) {
        throw new Error("Bad link message version " + ver);
      }
      var flags = getU8();
      if ((flags & 8) !== 0) {
        ltype = getU8();
      }
      if ((flags & 4) !== 0) {
        getU64();               // creation order (IGNORE)
      }
      if ((flags & 16) !== 0) {
        getU8();                // link name character set (IGNORE)
      }
      var cb = 1 << (flags & 3);
      var lnsz = getUXX(cb);

      var child = createLink();

      child.name = getString(lnsz);

      if ((flags & 8) === 0) {
        child.hdr_offset = getOffset();
      }

      if (debug) {
        console.log("hdf5MsgLink V" + ver + " F" + flags + " T" + ltype +
                    " NM " + child.name + " OF " + child.hdr_offset);
      }
      link.children.push(child);
    }

    /*
     * The fractal heap direct block contains:
     * 1. A signature.
     * 2. a byte version.
     * 3. an offset pointing to the header (for integrity checking).
     * 4. A variably-sized block offset that gives (_I think_) the mininum block offset
     * associated with this block.
     * 5. Variably-sized data. Block size varies with row number in a slightly tricky
     * fashion. Each "row" consists of "table_width" blocks. The first two rows, row 0 and 1,
     * have blocks of the "starting block size". Row 2-N have blocks of size 2^(row-1) times
     * the starting block size.
     */
    function hdf5FractalHeapDirectBlock(fh, row, address, callback) {
      if (!checkSignature("FHDB")) {
        throw new Error("Bad or missing FHDB signature");
      }
      var ver = getU8();
      if (ver !== 0) {
        throw new Error('Bad FHDB version: ' + ver);
      }
      getOffset();              // heap header address (IGNORE)
      var cb = Math.ceil(fh.max_heapsz / 8.0);
      var block_offset = getUXX(cb); // block offset
      if ((fh.flags & 2) !== 0) {
        getU32();               // checksum (IGNORE)
      }

      if (debug) {
        console.log("FHDB V:" + ver + " R:" + row + " O:" + block_offset + " A:" + address);
      }
      var header_length = 5 + superblk.offsz + cb;
      if ((fh.flags & 2) !== 0) {
        header_length += 4;
      }
      var block_length;
      if (row <= 1) {
        block_length = fh.start_blksz;
      }
      else {
        block_length = Math.pow(2, row - 1) * fh.start_blksz;
      }
      if (callback) {
        return callback(row, address, block_offset, block_length);
      }
      else {
        return true;            // continue enumeration.
      }
    }

    /*
     * The fractal heap indirect block contains:
     * 1. A signature.
     * 2. a byte version
     * 3. an offset pointing to the header (for integrity checking).
     * 4. a variably-sized block offset that gives (_I think_) the mininum block offset
     * associated with children of this block.
     * 5. pointers to K direct blocks
     * 6. pointers to N indirect blocks
     * 7. A checksum. This code completely ignores checksums.
     * See calculations of K and N in hdf5FractalHeapHeader(). Note that there can also
     * be additional information in the header if "filtered" direct blocks are used. I have
     * made no attempt to support this.
     */
    function hdf5FractalHeapIndirectBlock(fh, callback) {
      if (!checkSignature("FHIB")) {
        throw new Error("Bad or missing FHIB signature");
      }
      var ver = getU8();
      if (ver !== 0) {
        throw new Error('Bad FHIB version: ' + ver);
      }
      getOffset();              // heap header address (IGNORE)
      var cb = Math.ceil(fh.max_heapsz / 8.0);
      var block_offset = getUXX(cb); // block offset

      if (debug) {
        console.log("FHIB V:" + ver + " O:" + block_offset);
      }
      var i;
      var address;
      var db_addrs = [];
      for (i = 0; i < fh.K; i += 1) {
        address = getOffset();
        if (address < superblk.eof_addr) {
          if (debug) {
            console.log("direct block at " + address);
          }
          db_addrs.push(address);
        }
      }

      var ib_addrs = [];
      for (i = 0; i < fh.N; i += 1) {
        address = getOffset();
        if (address < superblk.eof_addr) {
          if (debug) {
            console.log("indirect block at " + address);
          }
          ib_addrs.push(address);
        }
      }
      getU32();                 // checksum (IGNORE)

      /* Finished reading the indirect block, now go read its children.
       */
      for (i = 0; i < db_addrs.length; i++) {
        seek(db_addrs[i]);
        /* TODO: check row calculation!
         */
        if (!hdf5FractalHeapDirectBlock(fh, Math.floor(i / fh.table_width), db_addrs[i], callback)) {
          return false;
        }
      }
      for (i = 0; i < ib_addrs.length; i++) {
        seek(ib_addrs[i]);
        if (!hdf5FractalHeapIndirectBlock(fh, callback)) {
          return false;
        }
      }
      return true;
    }

    /* enumerate over all of the direct blocks in the fractal heap.
     */
    function hdf5FractalHeapEnumerate(fh, callback) {
      seek(fh.root_addr);
      if (fh.K === 0) {
        hdf5FractalHeapDirectBlock(fh, 0, fh.root_addr, callback);
      }
      else {
        hdf5FractalHeapIndirectBlock(fh, callback);
      }
    }

    function hdf5FractalHeapOffset(fh, offset) {
      var location = -1;
      hdf5FractalHeapEnumerate(fh, function(row, address, block_offset, block_length) {
        if (offset >= block_offset && offset < block_offset + block_length) {
          location = address + (offset - block_offset);
          return false;         // stop enumeration.
        }
        return true;            // continue enumeration.
      });
      return location;
    }

    /*
     * Attribute info messages contain pointers to a fractal heap and a v2 btree.
     * If these pointers are valid, we must follow them to find more attributes.
     * The attributes are indexed by records in the "type 8" btree. These btree
     * records
     */
    function hdf5MsgAttrInfo(link) {
      var ver = getU8();
      if (ver !== 0) {
        throw new Error('Bad attribute information message version: ' + ver);
      }

      var flags = getU8();

      if ((flags & 1) !== 0) {
        getU16();          // maximum creation index (IGNORE)
      }
      var fh_addr = getOffset();
      var bt_addr = getOffset();
      if ((flags & 2) !== 0) {
        getOffset();       // attribute creation order (IGNORE)
      }

      if (debug) {
        console.log("hdf5MsgAttrInfo V" + ver + " F" + flags + " HP " + fh_addr +
                    " AN " + bt_addr);
      }

      var spp = tell();
      var fh;                   // fractal heap header.
      if (fh_addr < superblk.eof_addr) {
        seek(fh_addr);
        fh = hdf5FractalHeapHeader();
      }
      if (bt_addr < superblk.eof_addr) {
        seek(bt_addr);
        var bh = hdf5V2BtreeHeader();
        if (bh.type !== 8) {
          throw new Error("Can only handle indexed attributes.");
        }
        seek(bh.root_addr);
        if (bh.depth > 0) {
          hdf5V2BtreeInternalNode(fh, bh.root_nrec, bh.depth, link);
        }
        else {
          hdf5V2BtreeLeafNode(fh, bh.root_nrec, link);
        }
      }
      seek(spp);
    }

    /* Process a single message, given a message header. Assumes that
     * the data view offset is pointing to the remainder of the
     * message.
     *
     * V1 and V2 files use different sets of messages to accomplish
     * similar things. For example, V1 files tend to use "symbol
     * table" messages to describe links within a group, whereas V2
     * files use "link" and "linkinfo" messages.
     */
    function hdf5ProcessMessage(msg, link) {
      var cq_new = {};
      var val_type;

      switch (msg.hm_type) {
      case 1:
        hdf5MsgDataspace(msg.hm_size, link);
        break;
      case 2:
        hdf5MsgLinkInfo(link);
        break;
      case 3:
        val_type = hdf5MsgDatatype(msg.hm_size);
        if (link) {
          link.type = val_type.typ_type;
        }
        break;
      case 6:
        hdf5MsgLink(link);
        break;
      case 8:
        hdf5MsgLayout(link);
        break;
      case 10:
        hdf5MsgGroupInfo();
        break;
      case 11:
        hdf5MsgPipeline(link);
        break;
      case 12:
        hdf5MsgAttribute(msg.hm_size, link);
        break;
      case 16:
        /* Process an object header continuation message. These
         * basically just say this header continues with a new segment
         * with a given location and length. They can come before the
         * end of the current message segment, and multiple
         * continuation messages can occur in any particular segment.
         * This means we have to enqueue them and shift them off the
         * queue when we finish processing the current segment.
         */
        cq_new.cq_off = getOffset();
        cq_new.cq_len = getLength();
        continuation_queue.push(cq_new);
        if (debug) {
          console.log("hdf5MsgObjHdrContinue " + cq_new.cq_off + " " + cq_new.cq_len);
        }
        break;
      case 17: // SymbolTable
        link.sym_btree = getOffset();
        link.sym_lheap = getOffset();
        if (debug) {
          console.log("hdf5MsgSymbolTable " + link.sym_btree + " " + link.sym_lheap);
        }
        break;
      case 21:
        hdf5MsgAttrInfo(link);
        break;
      case 0:
      case 4:
      case 5:
      case 7:
      case 18:
      case 19:
      case 20:
      case 22:
      case 24:
        skip(msg.hm_size);
        break;
      default:
        throw new Error('Unknown message type: ' + msg.hm_type);
      }
    }

    /* Read a V2 object header. Object headers contain a series of messages that define
     * an HDF5 object, primarily a group or a dataset. V2 object headers, and V2 objects
     * generally, are much less concerned about alignment than V1 objects.
     */
    function hdf5V2ObjectHeader(link) {
      if (!checkSignature("OHDR")) {
        throw new Error('Bad or missing OHDR signature');
      }

      var ver = getU8();
      var flags = getU8();

      if ((flags & 0x20) !== 0) {
        getU32();          // access time (IGNORE)
        getU32();          // modify time (IGNORE)
        getU32();          // change time (IGNORE)
        getU32();          // birth time (IGNORE)
      }

      if ((flags & 0x10) !== 0) {
        getU16(); // maximum number of compact attributes (IGNORE)
        getU16(); // maximum number of dense attributes (IGNORE)
      }

      var cb = 1 << (flags & 3);
      var ck0_size = getUXX(cb);

      var msg_num = 0;
      var msg_offs = 0;
      var msg_bytes = ck0_size;

      if (debug) {
        console.log("hdf5V2ObjectHeader V" + ver + " F" + flags + " HS" + ck0_size);
      }

      var hmsg;
      var cq_head;
      var spp;

      while (true) {
        while (msg_bytes - msg_offs >= 8) {
          hmsg = {};
          hmsg.hm_type = getU8();
          hmsg.hm_size = getU16();
          hmsg.hm_flags = getU8();
          if (debug) {
            console.log("  msg" + msg_num + " F" + hmsg.hm_flags + " T " +
                        hmsg.hm_type + " S " + hmsg.hm_size +
                        " (" + msg_offs + "/" + msg_bytes + ") " +
                        hdf5GetMsgName(hmsg.hm_type));
          }
          if ((flags & 0x04) !== 0) {
            hmsg.hm_corder = getU16();
          }
          spp = tell();
          hdf5ProcessMessage(hmsg, link);
          seek(spp + hmsg.hm_size); // skip past message.

          msg_offs += hmsg.hm_size + 4;

          msg_num += 1;
        }

        if ((msg_bytes - msg_offs) > 4) {
          skip(msg_bytes - (msg_offs + 4));
        }

        getU32();          // checksum (IGNORE)

        if (continuation_queue.length !== 0) {
          cq_head = continuation_queue.shift();
          seek(cq_head.cq_off);
          msg_bytes = cq_head.cq_len - 4;
          msg_offs = 0;
          if (debug) {
            console.log('continuing with ' + cq_head.cq_len + ' bytes at ' + tell());
          }
          if (!checkSignature("OCHK")) {
            throw new Error("Bad v2 object continuation");
          }
        } else {
          break;
        }
      }

      link.children.forEach(function (child, link_num) {
        seek(child.hdr_offset);
        if (debug) {
          console.log(link_num + " " + child.hdr_offset + " " + child.name);
        }
        if (checkSignature("OHDR")) {
          seek(child.hdr_offset);
          hdf5V2ObjectHeader(child);
        }
        else {
          seek(child.hdr_offset);
          hdf5V1ObjectHeader(child);
        }
      });
    }

    function loadData(link) {
      if (link.chunk_size !== 0 &&
          link.data_offset > 0 && link.data_offset < superblk.eof_addr) {
        seek(link.data_offset);

        var n_bytes = 1;
        var i;
        for (i = 0; i < link.dims.length; i += 1) {
          n_bytes *= link.dims[i];
        }
        n_bytes *= typeSize(link.type);
        if (debug) {
          console.log('allocating ' + n_bytes + ' bytes');
        }
        var ab = new ArrayBuffer(n_bytes);
        link.n_filled = 0;
        switch (link.type) {
        case type_enum.INT8:
          link.array = new Int8Array(ab);
          break;
        case type_enum.UINT8:
          link.array = new Uint8Array(ab);
          break;
        case type_enum.INT16:
          link.array = new Int16Array(ab);
          break;
        case type_enum.UINT16:
          link.array = new Uint16Array(ab);
          break;
        case type_enum.INT32:
          link.array = new Int32Array(ab);
          break;
        case type_enum.UINT32:
          link.array = new Uint32Array(ab);
          break;
        case type_enum.FLT:
          link.array = new Float32Array(ab);
          break;
        case type_enum.DBL:
          link.array = new Float64Array(ab);
          break;
        default:
          throw new Error('Illegal type: ' + link.type);
        }
        hdf5V1BtreeNode(link);
      } else {
        if (link.data_offset > 0 && link.data_offset < superblk.eof_addr) {
          if (debug) {
            console.log('loading ' + link.data_length + ' bytes from ' + link.data_offset + ' to ' + link.name);
          }
          link.array = getArray(link.type, link.data_length,
                                     link.data_offset);
        } else {
          if (debug) {
            console.log('data not present for /' + link.name + '/');
          }
        }
      }

      link.children.forEach(function (child) {
        loadData(child);
      });
    }

    /* Read a v1 object header. Object headers contain a series of
     * messages that define an HDF5 object, primarily a group or a
     * dataset. The v1 object header, like most of the v1 format, is
     * very careful about alignment. Every message must be on an
     * 8-byte alignment RELATIVE TO THE START OF THE HEADER. So if the
     * header starts on an odd boundary, messages may start on odd
     * boundaries as well. No, this doesn't make much sense.
     */
    function hdf5V1ObjectHeader(link) {
      var oh = {};
      startAlignment();
      oh.oh_ver = getU8();
      skip(1);                // reserved
      oh.oh_n_msgs = getU16();
      oh.oh_ref_cnt = getU32();
      oh.oh_hdr_sz = getU32();
      if (oh.oh_ver !== 1) {
        throw new Error("Bad v1 object header version: " + oh.oh_ver);
      }
      if (debug) {
        console.log("hdf5V1ObjectHeader V" + oh.oh_ver +
                    " #M " + oh.oh_n_msgs +
                    " RC " + oh.oh_ref_cnt +
                    " HS " + oh.oh_hdr_sz);
      }

      var msg_bytes = oh.oh_hdr_sz;
      var cq_head;
      var msg_num;
      var hmsg;
      var spp;

      for (msg_num = 0; msg_num < oh.oh_n_msgs; msg_num += 1) {
        if (msg_bytes <= 8) {
          if (continuation_queue.length !== 0) {
            cq_head = continuation_queue.shift();
            seek(cq_head.cq_off);
            msg_bytes = cq_head.cq_len;
            if (debug) {
              console.log('continuing with ' + msg_bytes + ' bytes at ' + tell());
            }
            startAlignment();
          } else {
            break;
          }
        }

        checkAlignment();

        hmsg = {};
        hmsg.hm_type = getU16();
        hmsg.hm_size = getU16();
        hmsg.hm_flags = getU8();

        if ((hmsg.hm_size % 8) !== 0) {
          throw new Error('Size is not 8-byte aligned: ' + hmsg.hm_size);
        }
        skip(3);            // skip reserved
        msg_bytes -= (8 + hmsg.hm_size);
        if (debug) {
          console.log("  msg" + msg_num +
                      " F " + hmsg.hm_flags +
                      " T " + hmsg.hm_type +
                      " S " + hmsg.hm_size +
                      "(" + msg_bytes + ") " + hdf5GetMsgName(hmsg.hm_type));
        }

        spp = tell();
        hdf5ProcessMessage(hmsg, link);
        seek(spp + hmsg.hm_size); // skip whole message.
      }

      if (link.sym_btree !== 0 && link.sym_lheap !== 0) {
        seek(link.sym_btree);
        var bt = hdf5V1BtreeNode();
        seek(link.sym_lheap);
        var lh = hdf5LocalHeap();
        var i;
        for (i = 0; i < bt.entries_used; i += 1) {
          seek(bt.keys[i].child_address);
          if (checkSignature("SNOD")) {
            seek(bt.keys[i].child_address);
            hdf5GroupSymbolTable(lh, link);
          } else {
            seek(bt.keys[i].child_address);
            hdf5V1ObjectHeader(link);
          }
        }

        link.children.forEach(function (child) {
          seek(child.hdr_offset);
          hdf5V1ObjectHeader(child);
        });
      }
    }

    /* This is where the actual HDF5 loading process gets started.
     */
    var root = createLink();

    superblk = hdf5Superblock();
    seek(superblk.root_addr);
    if (superblk.sbver <= 1) {
      hdf5V1ObjectHeader(root);
    } else {
      hdf5V2ObjectHeader(root);
    }
    loadData(root);
    return root;
  } /* end of hdf5Reader() */


  /*
   * The remaining code after this point is not truly HDF5 specific -
   * it's mostly about converting the MINC file into the form
   * BrainBrowser is able to use. Therefore it is used for both HDF5
   * and NetCDF files.
   */

  /*
   * Join does not seem to be defined on the typed arrays in
   * javascript, so I've re-implemented it here, sadly.
   */
  function join(array, string) {
    var result = "";
    if (array && array.length) {
      var i;
      for (i = 0; i < array.length - 1; i += 1) {
        result += array[i];
        result += string;
      }
      result += array[i];
    }
    return result;
  }

  /*
   * Recursively print out the structure and contents of the file.
   * Primarily useful for debugging.
   */
  function printStructure(link, level) {
    var i;
    var msg = "";
    for (i = 0; i < level * 2; i += 1) {
      msg += " ";
    }
    msg += link.name + (link.children.length ? "/" : "");
    if (link.type > 0) {
      msg += ' ' + typeName(link.array);
      if (link.dims.length) {
        msg += '[' + link.dims.join(', ') + ']';
      }
      if (link.array) {
        msg += ":" + link.array.length;
      } else {
        msg += " NULL";
      }
    }
    console.log(msg);

    Object.keys(link.attributes).forEach(function (name) {
      var value = link.attributes[name];

      msg = "";
      for (i = 0; i < level * 2 + 1; i += 1) {
        msg += " ";
      }
      msg += link.name + ':' + name + " " +
        typeName(value) + "[" + value.length + "] ";
      if (typeof value === "string") {
        msg += JSON.stringify(value);
      } else {
        msg += "{" + join(value.slice(0, 16), ', ');
        if (value.length > 16) {
          msg += ", ...";
        }
        msg += "}";
      }
      console.log(msg);
    });

    link.children.forEach(function (child) {
      printStructure(child, level + 1);
    });
  }

  /* Find a dataset with a given name, by recursively searching through
   * the links. Groups will have 'type' fields of -1, since they contain
   * no data.
   * TODO (maybe): Use associative array for children?
   */
  function findDataset(link, name, level) {
    var result;
    if (link.name === name && link.type > 0) {
      result = link;
    } else {
      link.children.find( function( child ) {
        result = findDataset(child, name, level + 1);
        return defined(result);
      });
    }
    return result;
  }

  /* Find an attribute with a given name.
   */
  function findAttribute(link, name, level) {
    var result = link.attributes[name];
    if (result)
      return result;

    link.children.find( function (child ) {
      result = findAttribute( child, name, level + 1);
      return defined(result);
    });
    return result;
  }

  /**
   * @doc function
   * @name hdf5.scaleVoxels
   * @param {object} image The link object corresponding to the image data.
   * @param {object} image_min The link object corresponding to the image-min
   * data.
   * @param {object} image_max The link object corresponding to the image-max
   * data.
   * @param {object} valid_range An array of exactly two items corresponding
   * to the minimum and maximum valid _raw_ voxel values.
   * @param {boolean} debug True if we should print debugging information.
   * @returns A new ArrayBuffer containing the rescaled data.
   * @description
   * Convert the MINC data from voxel to real range. This returns a
   * new buffer that contains the "real" voxel values. It does less
   * work for floating-point volumes, since they don't need scaling.
   *
   * For debugging/testing purposes, also gathers basic voxel statistics,
   * for comparison against mincstats.
   */
  function scaleVoxels(image, image_min, image_max, valid_range, debug) {
    var new_abuf = new ArrayBuffer(image.array.length *
                                   Float32Array.BYTES_PER_ELEMENT);
    var new_data = new Float32Array(new_abuf);
    var n_slice_dims = image.dims.length - image_min.dims.length;

    if (n_slice_dims < 1) {
      throw new Error("Too few slice dimensions: " + image.dims.length +
                      " " + image_min.dims.length);
    }
    var n_slice_elements = 1;
    var i;
    for (i = image_min.dims.length; i < image.dims.length; i += 1) {
      n_slice_elements *= image.dims[i];
    }
    if (debug) {
      console.log(n_slice_elements + " voxels in slice.");
    }
    var real_sum = 0;
    var n_voxels = 0;
    var real_max = -Number.MAX_VALUE;
    var real_min = Number.MAX_VALUE;
    var im = image.array;
    var im_max = image_max.array;
    var im_min = image_min.array;
    if (debug) {
      console.log("valid range is " + valid_range[0] + " to " + valid_range[1]);
    }
    var vrange;
    var rrange;
    var vmin = valid_range[0];
    var rmin;
    var j;
    var v;
    var is_float = typeIsFloat(image.type);
    for (i = 0; i < image_min.array.length; i += 1) {
      if (debug) {
        console.log(i + " " + im_min[i] + " " + im_max[i] + " " +
                    im[i * n_slice_elements]);
      }
      if (is_float) {
        /* For floating-point volumes there is no scaling to be performed.
         * We do scan the data and make sure voxels are within the valid
         * range, and collect our statistics.
         */
        for (j = 0; j < n_slice_elements; j += 1) {
          v = im[n_voxels];
          if (v < valid_range[0] || v > valid_range[1]) {
            new_data[n_voxels] = 0.0;
          }
          else {
            new_data[n_voxels] = v;
            real_sum += v;
            if (v > real_max) {
              real_max = v;
            }
            if (v < real_min) {
              real_min = v;
            }
          }
          n_voxels += 1;
        }
      }
      else {
        /* For integer volumes we have to scale each slice according to image-min,
         * image-max, and valid_range.
         */
        vrange = (valid_range[1] - valid_range[0]);
        rrange = (im_max[i] - im_min[i]);
        rmin = im_min[i];
        for (j = 0; j < n_slice_elements; j += 1) {
          v = (im[n_voxels] - vmin) / vrange * rrange + rmin;
          new_data[n_voxels] = v;
          real_sum += v;
          n_voxels += 1;
          if (v > real_max) {
            real_max = v;
          }
          if (v < real_min) {
            real_min = v;
          }
        }
      }
    }

    if (debug) {
      console.log("Min: " + real_min);
      console.log("Max: " + real_max);
      console.log("Sum: " + real_sum);
      console.log("Mean: " + real_sum / n_voxels);
      console.log("Count: " + n_voxels);
    }

    return new_abuf;
  }

  /**
   * @doc function
   * @name hdf5.isRgbVolume
   * @param {object} header The header object representing the structure 
   * of the MINC file.
   * @param {object} image The typed array object used to represent the
   * image data.
   * @returns {boolean} True if this is an RGB volume.
   * @description
   * A MINC volume is an RGB volume if all three are true:
   * 1. The voxel type is unsigned byte.
   * 2. It has a vector_dimension in the last (fastest-varying) position.
   * 3. The vector dimension has length 3.
   */
  function isRgbVolume(header, image) {
    var order = header.order;
    return (image.array.constructor.name === 'Uint8Array' &&
            order.length > 0 &&
            order[order.length - 1] === "vector_dimension" &&
            header.vector_dimension.space_length === 3);
  }

  /**
   * @doc function
   * @name hdf5.rgbVoxels
   * @param {object} image The 'link' object created using createLink(),
   * that corresponds to the image within the HDF5 or NetCDF file.
   * @returns {object} A new ArrayBuffer that contains the original RGB 
   * data augmented with alpha values.
   * @description
   * This function copies the RGB voxels to the destination buffer.
   * Essentially we just convert from 24 to 32 bits per voxel. This
   * is another MINC-specific function.
   */
  function rgbVoxels(image) {
    var im = image.array;
    var n = im.length;
    var new_abuf = new ArrayBuffer(n / 3 * 4);
    var new_byte = new Uint8Array(new_abuf);
    var i, j = 0;
    for (i = 0; i < n; i += 3) {
      new_byte[j+0] = im[i+0];
      new_byte[j+1] = im[i+1];
      new_byte[j+2] = im[i+2];
      new_byte[j+3] = 255;
      j += 4;
    }
    return new_abuf;
  }

  var VolumeViewer = BrainBrowser.VolumeViewer;

  /**
   * @doc function
   * @name VolumeViewer.utils.hdf5Loader
   * @param {object} data An ArrayBuffer object that contains the binary
   * data to be interpreted as an HDF5 file.
   *
   * @description This function is the primary entry point for loading
   * either MINC 1.0 or 2.0 files. It attempts to interpret the file
   * as an HDF5 (MINC 2.0) file. If that fails (e.g. throws an
   * exception), the code falls back to interpreting the file as a
   * NetCDF (MINC 1.0) file.
   */
  VolumeViewer.utils.hdf5Loader = function (data) {
    var debug = false;

    var root;
    try {
      root = hdf5Reader(data, debug);
    } catch (e) {
      if (debug) {
        console.log(e);
        console.log("Trying as NetCDF...");
      }
      root = VolumeViewer.utils.netcdfReader(data, debug);
    }
    if (debug) {
      printStructure(root, 0);
    }

    /* The rest of this code is MINC-specific, so like some of the
     * functions above, it can migrate into minc.js once things have
     * stabilized.
     *
     * This code is responsible for collecting up the various pieces
     * of important data and metadata, and reorganizing them into the
     * form the volume viewer can handle.
     */
    var image = findDataset(root, "image");
    if (!defined(image)) {
      throw new Error("Can't find image dataset.");
    }
    var valid_range = findAttribute(image, "valid_range", 0);
    /* If no valid_range is found, we substitute our own. */
    if (!defined(valid_range)) {
      var min_val;
      var max_val;
      switch (image.type) {
      case type_enum.INT8:
        min_val = -(1 << 7);
        max_val = (1 << 7) - 1;
        break;
      case type_enum.UINT8:
        min_val = 0;
        max_val = (1 << 8) - 1;
        break;
      case type_enum.INT16:
        min_val = -(1 << 15);
        max_val = (1 << 15) - 1;
        break;
      case type_enum.UINT16:
        min_val = 0;
        max_val = (1 << 16) - 1;
        break;
      case type_enum.INT32:
        min_val = -(1 << 31);
        max_val = (1 << 31) - 1;
        break;
      case type_enum.UINT32:
        min_val = 0;
        max_val = (1 << 32) - 1;
        break;
      }
      valid_range = Float32Array.of(min_val, max_val);
    }
    var image_min = findDataset(root, "image-min");
    if (!defined(image_min) || !defined(image_min.array)) {
      image_min = {
        array: Float32Array.of(0),
        dims: []
      };
    }
    var image_max = findDataset(root, "image-max");
    if (!defined(image_max) || !defined(image_max.array)) {
      image_max = {
        array: Float32Array.of(1),
        dims: []
      };
    }

    /* Create the header expected by the existing brainbrowser code.
     */
    var header = {};
    var tmp = findAttribute(image, "dimorder", 0);
    if (typeof tmp !== 'string') {
      throw new Error("Can't find dimension order.");
    }
    header.order = tmp.split(',');

    header.order.forEach(function(dimname) {
      var dim = findDataset(root, dimname);
      if (!defined(dim)) {
        throw new Error("Can't find dimension variable " + dimname);
      }

      header[dimname] = {};

      tmp = findAttribute(dim, "step", 0);
      if (!defined(tmp)) {
        tmp = Float32Array.of(1);
      }
      header[dimname].step = tmp[0];

      tmp = findAttribute(dim, "start", 0);
      if (!defined(tmp)) {
        tmp = Float32Array.of(0);
      }
      header[dimname].start = tmp[0];

      tmp = findAttribute(dim, "length", 0);
      if (!defined(tmp)) {
        throw new Error("Can't find length for " + dimname);
      }
      header[dimname].space_length = tmp[0];

      tmp = findAttribute(dim, "direction_cosines", 0);
      if (defined(tmp)) {
        // why is the bizarre call to slice needed?? it seems to work, though!
        header[dimname].direction_cosines = Array.prototype.slice.call(tmp);
      }
      else {
        if (dimname === "xspace") {
          header[dimname].direction_cosines = [1, 0, 0];
        } else if (dimname === "yspace") {
          header[dimname].direction_cosines = [0, 1, 0];
        } else if (dimname === "zspace") {
          header[dimname].direction_cosines = [0, 0, 1];
        }
      }
    });

    var new_abuf;

    if (isRgbVolume(header, image)) {
      header.order.pop();
      header.datatype = 'rgb8';
      new_abuf = rgbVoxels(image);
    }
    else {
      header.datatype = 'float32';
      new_abuf = scaleVoxels(image, image_min, image_max, valid_range, debug);
    }

    return { header_text: JSON.stringify(header),
             raw_data: new_abuf};
  };
}());
