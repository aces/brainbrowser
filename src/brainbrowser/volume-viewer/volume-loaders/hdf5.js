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
 * Interprets a MINIMAL subset of the HDF5 format for the volume viewer.
 * This is sufficient to parse most MINC 2.0 files, but may not handle
 * HDF5 from other sources!!
 *
 * Relies on pako (https://github.com/nodeca/pako) to inflate
 * compressed data chunks.
 *
 * For details on the HDF5 format, see:
 * https://www.hdfgroup.org/HDF5/doc/H5.format.html
 */
(function () {
  'use strict';
  /** Internal type codes. These have nothing to do with HDF5. */
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

    /* Function to create and initialize one of our internal
     * 'link' objects,  which represent either an HDF5 group
     * or dataset here.
     */
    function createLink() {
      var r = {};
      // internal/private
      r.lnk_hdr_offset = 0;
      r.lnk_dat_offset = 0;
      r.lnk_dat_length = 0;
      r.lnk_ck_sz = 0;
      r.lnk_sym_btree = 0;
      r.lnk_sym_lheap = 0;
      // permanent/global
      r.lnk_name = "";
      r.lnk_attributes = {};
      r.lnk_children = [];
      r.lnk_dat_array = undefined;
      r.lnk_type = -1;
      r.lnk_inflate = false;
      r.lnk_dims = [];
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
        throw new Error('Unsupported type length ' + n);
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
      fh.ver = getU8();
      fh.idlen = getU16();
      fh.iof_el = getU16();
      fh.flags = getU8();
      fh.objmax = getU32();
      fh.objnid = getLength();
      fh.objbta = getOffset();
      fh.nf_blk = getLength();
      fh.af_blk = getOffset();
      fh.heap_total = getLength();
      fh.heap_alloc = getLength();
      fh.bai_offset = getLength();
      fh.heap_nobj = getLength();
      fh.heap_chuge = getLength();
      fh.heap_nhuge = getLength();
      fh.heap_ctiny = getLength();
      fh.heap_ntiny = getLength();
      fh.table_width = getU16();
      fh.start_blksz = getLength();
      fh.max_blksz = getLength();
      fh.max_heapsz = getU16();
      fh.rib_srows = getU16();
      fh.root_addr = getOffset();
      fh.rib_crows = getU16();
      if (fh.iof_el > 0) {
        throw new Error("Filters present in fractal heap.");
      }
      return fh;
    }

    /** read the v2 btree header */
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
      return bh;
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
        // If this BTREE is associated with a group (not a dataset),
        // then its keys are single "length" value.
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

        // If this BTREE is a "chunked raw data node" associated
        // with a dataset, then its keys are complex, consisting
        // of the chunk size in bytes, a filter mask, and a set of
        // offsets matching the dimensionality of the chunk layout.
        // The chunk size stores the actual stored length of the
        // data, so it may not equal the uncompressed chunk size.
        //
        var chunks = [];

        for (i = 0; i < bt.entries_used; i += 1) {
          bt.keys[i] = {};
          chunks[i] = {};
          chunks[i].chunk_size = getU32();
          chunks[i].filter_mask = getU32();
          chunks[i].chunk_offsets = [];
          for (j = 0; j < link.lnk_dims.length + 1; j += 1) {
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
        for (j = 0; j < link.lnk_dims.length + 1; j += 1) {
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

            if (link.lnk_inflate) {
              sp = new Uint8Array(abuf, offset, length);
              dp = pako.inflate(sp);
              switch (link.lnk_type) {
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
                throw new Error('Unknown type code ' + link.lnk_type);
              }
              if (link.lnk_dat_array.length - link.lnk_dat_used <
                  dp.length) {
                dp = dp.subarray(0, link.lnk_dat_array.length -
                                 link.lnk_dat_used);
              }
              link.lnk_dat_array.set(dp, link.lnk_dat_used);
              link.lnk_dat_used += dp.length;
              if (debug) {
                console.log(link.lnk_name + " " + sp.length + " " + dp.length + " " + link.lnk_dat_used + "/" + link.lnk_dat_array.length);
              }
            }
            else {
              /* no need to inflate data. */
              dp = getArray(link.lnk_type, length, offset);
              link.lnk_dat_array.set(dp, link.lnk_dat_used);
              link.lnk_dat_used += dp.length;
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
                    " '" + link.lnk_name + "'");
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
          child.lnk_hdr_offset = ohdr_address;
          link.lnk_children.push(child);
          if (lh) {
            spp = tell();
            // The link name is a zero-terminated string
            // starting at the link_name_off relative to
            // the beginning of the data segment of the local
            // heap.
            seek(lh.lh_dseg_off + link_name_offset);
            child.lnk_name = getString(lh.lh_dseg_len);
            seek(spp);
          }
          if (debug) {
            console.log("    " + i + " O " + link_name_offset + " A " +
                        ohdr_address + " T " + cache_type + " '" +
                        child.lnk_name + "'");
          }
        }
      }
    }

    /** read a v1 local heap */
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
        link.lnk_dims = dlen;
      }
      return n_items;
    }

    function hdf5MsgLinkInfo() {
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
      case 0:
        /* Fixed: bit 0 for byte order, bit 3 for signed */
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
      case 1:
        /* Float: uses bits 0,6 for byte order */
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
           IEEE 64-bit
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

      case 2:
        /* bit 0 for byte order */
        bit_prec = getU16();
        if (debug) {
          console.log(bit_prec);
        }
        cb += 2;
        break;

      case 3:
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

      if (ver === 1 || ver === 2) {
        n_dim = getU8();
        cls = getU8();
        skip(5);
        if (debug) {
          msg += "hdf5MsgLayout V" + ver + " N" + n_dim + " C" + cls;
        }
        if (cls === 1 || cls === 2) {
          var addr = getOffset();
          if (debug) {
            msg += " A" + addr;
          }
          link.lnk_dat_offset = addr;
        }

        var n_items = 1;
        for (i = 0; i < n_dim; i += 1) {
          dim[i] = getU32();
          n_items *= dim[i];
        }

        if (debug) {
          msg += "[" + dim.join(', ') + "]";
        }

        if (cls === 2) {
          elsz = getU32();
          if (debug) {
            msg += " E" + elsz;
          }
        }
        if (cls === 0) {
          cdsz = getU32();
          if (debug) {
            msg += "(" + cdsz + ")";
          }
          link.lnk_dat_offset = tell();
          link.lnk_dat_length = cdsz;
        } else if (cls === 1) {
          link.lnk_dat_length = typeSize(link.lnk_type) * n_items;
        }
      } else if (ver === 3) {
        cls = getU8();
        msg = "hdf5MsgLayout V" + ver + " C" + cls;

        if (cls === 0) {
          cdsz = getU16();
          if (debug) {
            msg += "(" + cdsz + ")";
          }
          link.lnk_dat_offset = tell();
          link.lnk_dat_length = cdsz;
        } else if (cls === 1) {
          dtadr = getOffset();
          dtsz = getLength();
          if (debug) {
            msg += "(" + dtadr + ", " + dtsz + ")";
          }
          link.lnk_dat_offset = dtadr;
          link.lnk_dat_length = dtsz;
        } else if (cls === 2) {
          n_dim = getU8();
          dtadr = getOffset();
          link.lnk_dat_offset = dtadr;
          link.lnk_ck_sz = 1;
          for (i = 0; i < n_dim - 1; i += 1) {
            dim[i] = getU32();
            link.lnk_ck_sz *= dim[i];
          }
          if (debug) {
            msg += "(N" + n_dim + ", A" + dtadr + " [" + dim.join(',') + "]";
          }
          elsz = getU32();
          link.lnk_ck_sz *= elsz;
          if (debug) {
            msg += " E" + elsz;
          }
        }
      } else {
        console.log("Illegal layout version " + ver);
      }
      if (debug) {
        console.log(msg);
      }
    }

    /**
     * @doc function
     * Read a filter pipeline message. At the moment we _only_ handle
     * deflate/inflate.
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
          link.lnk_inflate = true;
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

    function hdf5MsgAttribute(sz, link) {
      var ver = getU8();
      var msg = "hdf5MsgAttribute V" + ver + " " + sz + ": ";
      var flags = getU8();
      var nm_len = getU16();
      var dt_len = getU16();
      var ds_len = getU16();

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
      link.lnk_attributes[att_name] = att_value;
    }

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

      child.lnk_name = getString(lnsz);

      if ((flags & 8) === 0) {
        child.lnk_hdr_offset = getOffset();
      }

      if (debug) {
        console.log("hdf5MsgLink V" + ver + " F" + flags + " T" + ltype +
                    " NM " + child.lnk_name + " OF " + child.lnk_hdr_offset);
      }
      link.lnk_children.push(child);
    }

    function hdf5FractalHeapDirectBlock(fh, link) {
      if (!checkSignature("FHDB")) {
        throw new Error("Bad or missing FHDB signature");
      }
      var ver = getU8();
      if (ver !== 0) {
        throw new Error('Bad FHDB version: ' + ver);
      }
      getOffset();           // heap header address (IGNORE)
      var cb = Math.ceil(fh.max_heapsz / 8.0);
      skip(cb);               // block offset (IGNORE)
      if ((fh.flags & 2) !== 0) {
        getU32();          // checksum (IGNORE)
      }

      var i;
      for (i = 0; i < fh.heap_nobj; i += 1) {
        hdf5MsgAttribute(-1, link);
      }
    }

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
      if (fh_addr < superblk.eof_addr) {
        seek(fh_addr);
        var fh = hdf5FractalHeapHeader();
        seek(fh.root_addr);

        hdf5FractalHeapDirectBlock(fh, link);
      }
      if (bt_addr < superblk.eof_addr) {
        seek(bt_addr);
        hdf5V2BtreeHeader();
      }
      seek(spp);
    }

    function hdf5ProcessMessage(msg, link) {
      var cq_new = {};
      var val_type;

      switch (msg.hm_type) {
      case 1:
        hdf5MsgDataspace(msg.hm_size, link);
        break;
      case 2:
        hdf5MsgLinkInfo();
        break;
      case 3:
        val_type = hdf5MsgDatatype(msg.hm_size);
        if (link) {
          link.lnk_type = val_type.typ_type;
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
        cq_new.cq_off = getOffset();
        cq_new.cq_len = getLength();
        continuation_queue.push(cq_new);
        if (debug) {
          console.log("hdf5MsgObjHdrContinue " + cq_new.cq_off + " " + cq_new.cq_len);
        }
        break;
      case 17: // SymbolTable
        link.lnk_sym_btree = getOffset();
        link.lnk_sym_lheap = getOffset();
        if (debug) {
          console.log("hdf5MsgSymbolTable " + link.lnk_sym_btree + " " + link.lnk_sym_lheap);
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

    /** read the v2 object header */
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
          seek(spp + hmsg.hm_size);

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

      link.lnk_children.forEach(function (child, link_num) {
        seek(child.lnk_hdr_offset);
        if (debug) {
          console.log(link_num + " " + child.lnk_hdr_offset + " " +
                      child.lnk_name);
        }
        if (checkSignature("OHDR")) {
          seek(child.lnk_hdr_offset);
          hdf5V2ObjectHeader(child);
        }
        else {
          seek(child.lnk_hdr_offset);
          hdf5V1ObjectHeader(child);
        }
      });
    }

    function loadData(link) {
      if (link.lnk_ck_sz !== 0) {
        seek(link.lnk_dat_offset);

        var n_bytes = 1;
        var i;
        for (i = 0; i < link.lnk_dims.length; i += 1) {
          n_bytes *= link.lnk_dims[i];
        }
        n_bytes *= typeSize(link.lnk_type);
        if (debug) {
          console.log('allocating ' + n_bytes + ' bytes');
        }
        var ab = new ArrayBuffer(n_bytes);
        link.lnk_dat_used = 0;
        switch (link.lnk_type) {
        case type_enum.INT8:
          link.lnk_dat_array = new Int8Array(ab);
          break;
        case type_enum.UINT8:
          link.lnk_dat_array = new Uint8Array(ab);
          break;
        case type_enum.INT16:
          link.lnk_dat_array = new Int16Array(ab);
          break;
        case type_enum.UINT16:
          link.lnk_dat_array = new Uint16Array(ab);
          break;
        case type_enum.INT32:
          link.lnk_dat_array = new Int32Array(ab);
          break;
        case type_enum.UINT32:
          link.lnk_dat_array = new Uint32Array(ab);
          break;
        case type_enum.FLT:
          link.lnk_dat_array = new Float32Array(ab);
          break;
        case type_enum.DBL:
          link.lnk_dat_array = new Float64Array(ab);
          break;
        default:
          throw new Error('Illegal type: ' + link.lnk_type);
        }
        hdf5V1BtreeNode(link);
      } else {
        if (link.lnk_dat_offset > 0 && link.lnk_dat_offset < superblk.eof_addr) {
          if (debug) {
            console.log('loading ' + link.lnk_dat_length + ' bytes from ' + link.lnk_dat_offset + ' to ' + link.lnk_name);
          }
          link.lnk_dat_array = getArray(link.lnk_type, link.lnk_dat_length,
                                        link.lnk_dat_offset);
        } else {
          if (debug) {
            console.log('data not present for /' + link.lnk_name + '/');
          }
        }
      }

      link.lnk_children.forEach(function (child) {
        loadData(child);
      });
    }

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

      if (link.lnk_sym_btree !== 0 && link.lnk_sym_lheap !== 0) {
        seek(link.lnk_sym_btree);
        var bt = hdf5V1BtreeNode();
        seek(link.lnk_sym_lheap);
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

        link.lnk_children.forEach(function (child) {
          seek(child.lnk_hdr_offset);
          hdf5V1ObjectHeader(child);
        });
      }
    }

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
  }


  /**
   * The remaining code after this point is not truly HDF5 specific -
   * it's mostly about converting the MINC file into the form
   * BrainBrowser is able to use. Therefore it is used for both HDF5
   * and NetCDF files.
   */

  /** why is this needed?? */
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

  function printStructure(link, level) {
    var i;
    var msg = "";
    for (i = 0; i < level * 2; i += 1) {
      msg += " ";
    }
    msg += link.lnk_name + (link.lnk_children.length ? "/" : "");
    if (link.lnk_type > 0) {
      msg += ' ' + typeName(link.lnk_dat_array);
      if (link.lnk_dims.length) {
        msg += '[' + link.lnk_dims.join(', ') + ']';
      }
      if (link.lnk_dat_array) {
        msg += ":" + link.lnk_dat_array.length;
      } else {
        msg += " NULL";
      }
    }
    console.log(msg);

    Object.getOwnPropertyNames(link.lnk_attributes).forEach(function (name) {
      var value = link.lnk_attributes[name];

      msg = "";
      for (i = 0; i < level * 2 + 1; i += 1) {
        msg += " ";
      }
      msg += link.lnk_name + ':' + name + " " +
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

    link.lnk_children.forEach(function (child) {
      printStructure(child, level + 1);
    });
  }

  function findDataset(link, name, level) {
    var result;
    if (link.lnk_name === name && link.lnk_type > 0) {
      result = link;
    } else {
      link.lnk_children.find( function( child ) {
        result = findDataset(child, name, level + 1);
        return defined(result);
      });
    }
    return result;
  }

  function findAttribute(link, name, level) {
    var result = link.lnk_attributes[name];
    if (result)
      return result;

    link.lnk_children.find( function (child ) {
      result = findAttribute( child, name, level + 1);
      return defined(result);
    });
    return result;
  }

  /**
   * Convert the data from voxel to real range. This returns a new
   * buffer that contains the "real" voxel values. It does less work
   * for floating-point volumes, since they don't need scaling.
   *
   * For debugging/testing purposes, also gathers basic voxel statistics,
   * for comparison against mincstats.
   */
  function scaleVoxels(image, image_min, image_max, valid_range, debug) {
    var new_abuf = new ArrayBuffer(image.lnk_dat_array.length *
                                   Float32Array.BYTES_PER_ELEMENT);
    var new_data = new Float32Array(new_abuf);
    var n_slice_dims = image.lnk_dims.length - image_min.lnk_dims.length;

    if (n_slice_dims < 1) {
      throw new Error("Too few slice dimensions: " + image.lnk_dims.length +
                      " " + image_min.lnk_dims.length);
    }
    var n_slice_elements = 1;
    var i;
    for (i = image_min.lnk_dims.length; i < image.lnk_dims.length; i += 1) {
      n_slice_elements *= image.lnk_dims[i];
    }
    if (debug) {
      console.log(n_slice_elements + " voxels in slice.");
    }
    var s = 0;
    var c = 0;
    var x = -Number.MAX_VALUE;
    var n = Number.MAX_VALUE;
    var im = image.lnk_dat_array;
    var im_max = image_max.lnk_dat_array;
    var im_min = image_min.lnk_dat_array;
    if (debug) {
      console.log("valid range is " + valid_range[0] + " to " + valid_range[1]);
    }
    var vrange;
    var rrange;
    var vmin = valid_range[0];
    var rmin;
    var j;
    var v;
    var is_float = typeIsFloat(image.lnk_type);
    for (i = 0; i < image_min.lnk_dat_array.length; i += 1) {
      if (debug) {
        console.log(i + " " + im_min[i] + " " + im_max[i] + " " +
                    im[i * n_slice_elements]);
      }
      if (is_float) {
        for (j = 0; j < n_slice_elements; j += 1) {
          v = im[c];
          if (v < valid_range[0] || v > valid_range[1]) {
            new_data[c] = 0.0;
          }
          else {
            new_data[c] = v;
            s += v;
            if (v > x) {
              x = v;
            }
            if (v < n) {
              n = v;
            }
          }
          c += 1;
        }
      }
      else {
        vrange = (valid_range[1] - valid_range[0]);
        rrange = (im_max[i] - im_min[i]);
        rmin = im_min[i];
        for (j = 0; j < n_slice_elements; j += 1) {
          v = (im[c] - vmin) / vrange * rrange + rmin;
          new_data[c] = v;
          s += v;
          c += 1;
          if (v > x) {
            x = v;
          }
          if (v < n) {
            n = v;
          }
        }
      }
    }

    console.log("Sum: " + s);
    console.log("Mean: " + s / c);
    console.log("Min: " + n);
    console.log("Max: " + x);

    return new_abuf;
  }

  var VolumeViewer = BrainBrowser.VolumeViewer;

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
    printStructure(root, 0);

    var image = findDataset(root, "image");
    if (!defined(image)) {
      throw new Error("Can't find image dataset.");
    }
    var valid_range = findAttribute(image, "valid_range", 0);
    /* If no valid_range is found, we substitute our own. */
    if (!defined(valid_range)) {
      var min_val;
      var max_val;
      switch (image.lnk_type) {
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
    if (!defined(image_min)) {
      image_min = {
        lnk_dat_array: Float32Array.of(0),
        lnk_dims: []
      };
    }
    var image_max = findDataset(root, "image-max");
    if (!defined(image_max)) {
      image_max = {
        lnk_dat_array: Float32Array.of(1),
        lnk_dims: []
      };
    }

    var new_abuf = scaleVoxels(image, image_min, image_max, valid_range, debug);

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
        throw new Error("Can't find step for " + dimname);
      }
      header[dimname].step = tmp[0];

      tmp = findAttribute(dim, "start", 0);
      if (!defined(tmp)) {
        throw new Error("Can't find start for " + dimname);
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
      header.datatype = 'float32';
    });

    return { header_text: JSON.stringify(header),
             raw_data: new_abuf};
  };

  console.log("HDF5 is loaded!");
}());
