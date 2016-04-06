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

  function type_size(typ) {
    var sizes = [0, 1, 1, 2, 2, 4, 4, 4, 8, 0];
    if (typ >= type_enum.INT8 && typ < sizes.length) {
      return sizes[typ];
    }
    throw new Error('Unknown type ' + typ);
  }

  function type_name(typ) {
    var names = [
      '', 'Int8', 'UInt8', 'Int16', 'UInt16', 'Int32', 'UInt32',
      'Float', 'Double', 'String'
    ];
    if (typ >= type_enum.INT8 && typ < names.length) {
      return names[typ];
    }
    throw new Error('Unknown type ' + typ);
  }

  function type_is_flt(typ) {
    return (typ >= type_enum.FLT && typ <= type_enum.DBL);
  }

  function hdf5_reader(abuf, debug) {
    /* 'global' variables. */
    var dv_offset = 0;
    var align = 8;
    var littleEndian = true;
    var continuation_queue = [];
    var dv = new DataView(abuf);
    var superblk = {};
    var start_offset = 0;

    debug = debug || false;

    /* Function to create and initialize one of our internal
     * 'link' objects,  which represent either an HDF5 group
     * or dataset here.
     */
    function hdf5_int_link() {
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
      r.lnk_attributes = [];
      r.lnk_children = [];
      r.lnk_dat_array = undefined;
      r.lnk_type = -1;
      r.lnk_inflate = false;
      r.lnk_dims = [];
      r.type_name = type_name;
      return r;
    }

    /* Turns out that alignment of the messages in at least the
     * version 1 object header is actually relative to the start
     * of the header. So we update the start position of the
     * header here, so we can refer to it when calculating the
     * alignment in check_alignment().
     */
    function start_alignment() {
      start_offset = dv_offset;
    }

    function check_alignment() {
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
    function get_u8() {
      var v = dv.getUint8(dv_offset);
      dv_offset += 1;
      return v;
    }
    function get_u16() {
      var v = dv.getUint16(dv_offset, littleEndian);
      dv_offset += 2;
      return v;
    }
    function get_u32() {
      var v = dv.getUint32(dv_offset, littleEndian);
      dv_offset += 4;
      return v;
    }
    function get_u64() {
      var v = dv.getUint64(dv_offset, littleEndian);
      dv_offset += 8;
      return v;
    }
    function get_f32() {
      var v = dv.getFloat32(dv_offset, littleEndian);
      dv_offset += 4;
      return v;
    }
    function get_f64() {
      var v = dv.getFloat64(dv_offset, littleEndian);
      dv_offset += 8;
      return v;
    }
    function get_offset(offsz) {
      var v = 0;
      offsz = offsz || superblk.offsz;
      if (offsz === 4) {
        v = dv.getUint32(dv_offset, littleEndian);
      } else if (offsz === 8) {
        v = dv.getUint64(dv_offset, littleEndian);
      } else {
        throw new Error('Unsupported value for offset size ' + offsz);
      }
      dv_offset += offsz;
      return v;
    }
    function get_length() {
      var v = dv.getUint64(dv_offset, littleEndian);
      dv_offset += superblk.lensz;
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

    function get_array(typ, n_bytes, new_off) {
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
            value[i] = get_u16();
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
            value[i] = get_u16();
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
            value[i] = get_u32();
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
            value[i] = get_u32();
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
            value[i] = get_f32();
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
            value[i] = get_f64();
          }
        } else {
          value = new Float64Array(abuf, dv_offset, n_bytes / 8);
          dv_offset += n_bytes;
        }
        break;
      default:
        throw new Error('Bad type in get_array ' + typ);
      }
      if (new_off) {
        dv_offset = spp;
      }
      return value;
    }

    /* Get a variably-sized integer from the DataView. */
    function get_uxx(n) {
      var v;
      switch (n) {
      case 1:
        v = dv.getUint8(dv_offset);
        break;
      case 2:
        v = dv.getUint16(dv_offset, littleEndian);
        break;
      case 4:
        v = dv.getUint32(dv_offset, littleEndian);
        break;
      case 8:
        v = dv.getUint64(dv_offset, littleEndian);
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
    dv.getUint64 = function (off, littleEndian) {
      var l4 = dv.getUint32(off + 0, littleEndian);
      var u4 = dv.getUint32(off + 4, littleEndian);
      if (littleEndian) {
        return (u4 << 32) + l4;
      } else {
        return (l4 << 32) + u4;
      }
    };

    /* Verify that the expected signature is found at this offset.
     */
    function check_signature(str) {
      var i;
      for (i = 0; i < str.length; i += 1) {
        if (dv.getUint8(dv_offset + i) !== str.charCodeAt(i)) {
          return false;
        }
      }
      skip(str.length);
      return true;
    }

    function hdf5_sb() {
      var sb = {};
      if (!check_signature("\u0089HDF\r\n\u001A\n")) {
        throw new Error('Bad magic string in HDF5');
      }
      sb.sbver = get_u8();
      if (sb.sbver > 2) {
        throw new Error('Unsupported HDF5 superblock version ' + sb.sbver);
      }
      if (sb.sbver <= 1) {
        sb.fsver = get_u8();
        sb.rgver = get_u8();
        skip(1);            // reserved
        sb.shver = get_u8();
        sb.offsz = get_u8();
        sb.lensz = get_u8();
        skip(1);            // reserved
        sb.gln_k = get_u16();
        sb.gin_k = get_u16();
        sb.cflags = get_u32();
        if (sb.sbver === 1) {
          sb.isin_k = get_u16();
          skip(2);        // reserved
        }
        sb.base_addr = get_offset(sb.offsz);
        sb.gfsi_addr = get_offset(sb.offsz);
        sb.eof_addr = get_offset(sb.offsz);
        sb.dib_addr = get_offset(sb.offsz);
        sb.root_ln_offs = get_offset(sb.offsz);
        sb.root_addr = get_offset(sb.offsz);
        sb.root_cache_type = get_u32();
        skip(4);
        skip(16);
      } else {
        sb.offsz = get_u8();
        sb.lensz = get_u8();
        sb.cflags = get_u8();
        sb.base_addr = get_offset(sb.offsz);
        sb.ext_addr = get_offset(sb.offsz);
        sb.eof_addr = get_offset(sb.offsz);
        sb.root_addr = get_offset(sb.offsz);
        sb.checksum = get_u32();
      }
      if (debug) {
        console.log("HDF5 SB " + sb.sbver + " " + sb.offsz + " " + sb.lensz + " " + sb.cflags);
      }
      return sb;
    }

    /* read the v2 fractal heap header */
    function hdf5_frhp() {
      var fh = {};
      if (!check_signature("FRHP")) {
        throw new Error('Bad or missing FRHP signature');
      }
      fh.ver = get_u8();
      fh.idlen = get_u16();
      fh.iof_el = get_u16();
      fh.flags = get_u8();
      fh.objmax = get_u32();
      fh.objnid = get_length();
      fh.objbta = get_offset();
      fh.nf_blk = get_length();
      fh.af_blk = get_offset();
      fh.heap_total = get_length();
      fh.heap_alloc = get_length();
      fh.bai_offset = get_length();
      fh.heap_nobj = get_length();
      fh.heap_chuge = get_length();
      fh.heap_nhuge = get_length();
      fh.heap_ctiny = get_length();
      fh.heap_ntiny = get_length();
      fh.table_width = get_u16();
      fh.start_blksz = get_length();
      fh.max_blksz = get_length();
      fh.max_heapsz = get_u16();
      fh.rib_srows = get_u16();
      fh.root_addr = get_offset();
      fh.rib_crows = get_u16();
      if (fh.iof_el > 0) {
        throw new Error("Filters present in fractal heap.");
      }
      return fh;
    }

    /** read the v2 btree header */
    function hdf5_bthd() {
      var bh = {};
      if (!check_signature("BTHD")) {
        throw new Error('Bad or missing BTHD signature');
      }
      bh.ver = get_u8();
      bh.type = get_u8();
      bh.nodesz = get_u32();
      bh.recsz = get_u16();
      bh.depth = get_u16();
      bh.splitp = get_u8();
      bh.mergep = get_u8();
      bh.root_addr = get_offset();
      bh.root_nrec = get_u16();
      bh.total_nrec = get_length();
      bh.checksum = get_u32();
      return bh;
    }

    function msg_type_to_str(n) {
      var names = [
        "NIL", "Dataspace", "LinkInfo", "Datatype", "FillValue 1", "FillValue 2",
        "Link", "ExternalFiles", "Layout", "BOGUS", "GroupInfo", "FilterPipeline",
        "Attribute", "ObjectComment", "ObjectModTime 1", "SharedMsgTable",
        "ObjHdrContinue", "SymbolTable", "ObjectModTime 2", "BtreeKValue",
        "DriverInfo", "AttributeInfo", "ObjectRefCnt", "MESSAGE23", "FileSpaceInfo"
      ];

      if (n < names.length) {
        return names[n];
      }
      throw new Error('Unknown message type ' + n + " " + tell());
    }

    function hdf5_btree(link) {
      var i;
      var bt = {};
      if (!check_signature("TREE")) {
        throw new Error('Bad TREE signature at ' + tell());
      }

      bt.keys = [];

      bt.node_type = get_u8();
      bt.node_level = get_u8();
      bt.entries_used = get_u16();
      bt.left_sibling = get_offset();
      bt.right_sibling = get_offset();

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
          bt.keys[i].key_value = get_length();
          bt.keys[i].child_address = get_offset();
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
          chunks[i].chunk_size = get_u32();
          chunks[i].filter_mask = get_u32();
          chunks[i].chunk_offsets = [];
          for (j = 0; j < link.lnk_dims.length + 1; j += 1) {
            chunks[i].chunk_offsets.push(get_u64());
          }
          bt.keys[i].child_address = get_offset();
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
        chunks[i].chunk_size = get_u32();
        chunks[i].filter_mask = get_u32();
        chunks[i].chunk_offsets = [];
        for (j = 0; j < link.lnk_dims.length + 1; j += 1) {
          chunks[i].chunk_offsets.push(get_u64());
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
              dp = get_array(link.lnk_type, length, offset);
              link.lnk_dat_array.set(dp, link.lnk_dat_used);
              link.lnk_dat_used += dp.length;
            }
          }
        } else {
          for (i = 0; i < bt.entries_used; i += 1) {
            seek(bt.keys[i].child_address);
            hdf5_btree(link);
          }
        }
      }
      return bt;
    }

    function hdf5_snod(lh, link) {
      if (!check_signature("SNOD")) {
        throw new Error('Bad or missing SNOD signature');
      }
      var ver = get_u8();
      skip(1);
      var n_sym = get_u16();
      if (debug) {
        console.log("hdf5_snod V" + ver + " #" + n_sym +
                    " '" + link.lnk_name + "'");
      }
      var i;
      var link_name_offset;
      var ohdr_address;
      var cache_type;
      var child;
      var spp;
      for (i = 0; i < 2 * superblk.gln_k; i += 1) {
        link_name_offset = get_offset();
        ohdr_address = get_offset();
        cache_type = get_u32();
        skip(20);

        if (i < n_sym) {
          child = hdf5_int_link();
          child.lnk_hdr_offset = ohdr_address;
          link.lnk_children.push(child);
          if (lh) {
            spp = tell();
            // The link name is a zero-terminated string
            // starting at the link_name_off relative to
            // the beginning of the data segment of the local
            // heap.
            seek(lh.lh_dseg_off + link_name_offset);
            child.lnk_name = get_string(lh.lh_dseg_len);
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
    function hdf5_lheap() {
      var lh = {};
      if (!check_signature("HEAP")) {
        throw new Error('Bad or missing HEAP signature');
      }
      lh.lh_ver = get_u8();
      skip(3);
      lh.lh_dseg_len = get_length();
      lh.lh_flst_len = get_length();
      lh.lh_dseg_off = get_offset();
      if (debug) {
        console.log("LHEAP V" + lh.lh_ver + " " + lh.lh_dseg_len + " " +
                    lh.lh_flst_len + " " + lh.lh_dseg_off);
      }
      return lh;
    }

    function hdf5_msg_dataspace(sz, link) {
      var cb;
      var ver = get_u8();
      var n_dim = get_u8();
      var flag = get_u8();
      if (ver <= 1) {
        skip(5);
      } else {
        skip(1);
      }

      var n_items = 1;
      var dlen = [];
      var i;
      for (i = 0; i < n_dim; i += 1) {
        dlen[i] = get_length();
        n_items *= dlen[i];
      }

      cb = (n_dim * superblk.lensz) + ((ver <= 1) ? 8 : 4);

      var dmax = [];
      if ((flag & 1) !== 0) {
        cb += n_dim * superblk.lensz;
        for (i = 0; i < n_dim; i += 1) {
          dmax[i] = get_length();
        }
      }

      var dind = [];
      if ((flag & 2) !== 0) {
        cb += n_dim * superblk.lensz;
        for (i = 0; i < n_dim; i += 1) {
          dind[i] = get_length();
        }
      }
      var msg = "hdf5_msg_dataspace V" + ver + " N" + n_dim + " F" + flag;
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

    function hdf5_msg_linkinfo() {
      var ver = get_u8();
      var flags = get_u8();
      if ((flags & 1) !== 0) {
        get_u64();          // max. creation index (IGNORE).
      }
      var fh_address = get_offset(); // fractal heap address
      var bt_address = get_offset(); // v2 btree for name index
      if ((flags & 2) !== 0) {
        get_offset();       // creation order index (IGNORE).
      }
      if (debug) {
        console.log("hdf5_msg_linkinfo V" + ver + " F" + flags +
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

    function hdf5_msg_datatype(sz) {
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

      var cv = get_u8();
      var ver = cv >> 4;
      var cls = cv & 15;
      var bf = [];
      var i;
      for (i = 0; i < 3; i += 1) {
        bf[i] = get_u8();
      }
      var dt_size = get_u32();

      if (debug) {
        console.log("hdf5_msg_datatype V" + ver + " C" + cls +
                    " " + dt_class_name(cls) +
                    " " + bf[0] + "." + bf[1] + "." + bf[2] +
                    " " + dt_size);
      }

      switch (cls) {
      case 0:
        /* Fixed: bit 0 for byte order, bit 3 for signed */
        bit_offs = get_u16();
        bit_prec = get_u16();
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
        bit_offs = get_u16();
        bit_prec = get_u16();
        exp_loc = get_u8();
        exp_sz = get_u8();
        mnt_loc = get_u8();
        mnt_sz = get_u8();
        exp_bias = get_u32();
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
        bit_prec = get_u16();
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

    function hdf5_msg_layout(link) {
      var msg = "";

      var ver = get_u8();
      var cls;
      var n_dim;
      var cdsz;
      var dim = [];
      var i;
      var dtadr;
      var dtsz;
      var elsz;

      if (ver === 1 || ver === 2) {
        n_dim = get_u8();
        cls = get_u8();
        skip(5);
        if (debug) {
          msg += "hdf5_msg_layout V" + ver + " N" + n_dim + " C" + cls;
        }
        if (cls === 1 || cls === 2) {
          var addr = get_offset();
          if (debug) {
            msg += " A" + addr;
          }
          link.lnk_dat_offset = addr;
        }

        var n_items = 1;
        for (i = 0; i < n_dim; i += 1) {
          dim[i] = get_u32();
          n_items *= dim[i];
        }

        if (debug) {
          msg += "[" + dim.join(', ') + "]";
        }

        if (cls === 2) {
          elsz = get_u32();
          if (debug) {
            msg += " E" + elsz;
          }
        }
        if (cls === 0) {
          cdsz = get_u32();
          if (debug) {
            msg += "(" + cdsz + ")";
          }
          link.lnk_dat_offset = tell();
          link.lnk_dat_length = cdsz;
        } else if (cls === 1) {
          link.lnk_dat_length = type_size(link.lnk_type) * n_items;
        }
      } else if (ver === 3) {
        cls = get_u8();
        msg = "hdf5_msg_layout V" + ver + " C" + cls;

        if (cls === 0) {
          cdsz = get_u16();
          if (debug) {
            msg += "(" + cdsz + ")";
          }
          link.lnk_dat_offset = tell();
          link.lnk_dat_length = cdsz;
        } else if (cls === 1) {
          dtadr = get_offset();
          dtsz = get_length();
          if (debug) {
            msg += "(" + dtadr + ", " + dtsz + ")";
          }
          link.lnk_dat_offset = dtadr;
          link.lnk_dat_length = dtsz;
        } else if (cls === 2) {
          n_dim = get_u8();
          dtadr = get_offset();
          link.lnk_dat_offset = dtadr;
          link.lnk_ck_sz = 1;
          for (i = 0; i < n_dim - 1; i += 1) {
            dim[i] = get_u32();
            link.lnk_ck_sz *= dim[i];
          }
          if (debug) {
            msg += "(N" + n_dim + ", A" + dtadr + " [" + dim.join(',') + "]";
          }
          elsz = get_u32();
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
    function hdf5_msg_pipeline(link) {
      var ver = get_u8();
      var nflt = get_u8();

      var msg = "hdf5_msg_pipeline V" + ver + " N" + nflt;
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
        fiv = get_u16();
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
          nlen = get_u16();
        } else {
          nlen = 0;
        }

        flags = get_u16();
        ncdv = get_u16();
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

    function hdf5_msg_attribute(sz, link) {
      var ver = get_u8();
      var msg = "hdf5_msg_attribute V" + ver + " " + sz + ": ";
      var flags = get_u8();
      var nm_len = get_u16();
      var dt_len = get_u16();
      var ds_len = get_u16();

      if ((flags & 3) !== 0) {
        throw new Error('Shared dataspaces and datatypes are not supported.');
      }

      if (ver === 3) {
        var cset = get_u8();
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

      var attr = {};

      link.lnk_attributes.push(attr);

      attr.att_name = get_string(nm_len);
      if (debug) {
        msg += " Name: " + attr.att_name;
        console.log(msg);
      }
      var val_type = hdf5_msg_datatype(dt_len);
      var n_items = hdf5_msg_dataspace(ds_len);
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
      attr.att_type = val_type.typ_type;
      if (attr.att_type === type_enum.STR) {
        attr.att_value = get_string(val_len);
      } else {
        attr.att_value = get_array(attr.att_type, val_len);
      }
    }

    function hdf5_msg_groupinfo() {
      var n_ent = 4;
      var n_lnl = 8;
      var ver = get_u8();
      var flags = get_u8();
      if ((flags & 1) !== 0) {
        get_u16();          // link phase change: max compact value (IGNORE)
        get_u16();          // link phase cange: max dense value (IGNORE)
      }
      if ((flags & 2) !== 0) {
        n_ent = get_u16();
        n_lnl = get_u16();
      }
      if (debug) {
        console.log("hdf5_msg_groupinfo V" + ver + " F" + flags + " ENT " + n_ent + " LNL " + n_lnl);
      }
    }

    function hdf5_msg_link(link) {
      var ver = get_u8();
      var ltype = 0;
      if (ver !== 1) {
        throw new Error("Bad link message version " + ver);
      }
      var flags = get_u8();
      if ((flags & 8) !== 0) {
        ltype = get_u8();
      }
      if ((flags & 4) !== 0) {
        get_u64();          // creation order (IGNORE)
      }
      if ((flags & 16) !== 0) {
        get_u8();           // link name character set (IGNORE)
      }
      var cb = 1 << (flags & 3);
      var lnsz = get_uxx(cb);

      var child = hdf5_int_link();

      child.lnk_name = get_string(lnsz);

      if ((flags & 8) === 0) {
        child.lnk_hdr_offset = get_offset();
      }

      if (debug) {
        console.log("hdf5_msg_link V" + ver + " F" + flags + " T" + ltype +
                    " NM " + child.lnk_name + " OF " + child.lnk_hdr_offset);
      }
      link.lnk_children.push(child);
    }

    function hdf5_fhdb(fh, link) {
      if (!check_signature("FHDB")) {
        throw new Error("Bad or missing FHDB signature");
      }
      var ver = get_u8();
      if (ver !== 0) {
        throw new Error('Bad FHDB version: ' + ver);
      }
      get_offset();           // heap header address (IGNORE)
      var cb = Math.ceil(fh.max_heapsz / 8.0);
      skip(cb);               // block offset (IGNORE)
      if ((fh.flags & 2) !== 0) {
        get_u32();          // checksum (IGNORE)
      }

      var i;
      for (i = 0; i < fh.heap_nobj; i += 1) {
        hdf5_msg_attribute(-1, link);
      }
    }

    function hdf5_msg_attrinfo(link) {
      var ver = get_u8();
      if (ver !== 0) {
        throw new Error('Bad attribute information message version: ' + ver);
      }

      var flags = get_u8();

      if ((flags & 1) !== 0) {
        get_u16();          // maximum creation index (IGNORE)
      }
      var fh_addr = get_offset();
      var bt_addr = get_offset();
      if ((flags & 2) !== 0) {
        get_offset();       // attribute creation order (IGNORE)
      }

      if (debug) {
        console.log("hdf5_msg_attrinfo V" + ver + " F" + flags + " HP " + fh_addr +
                    " AN " + bt_addr);
      }

      var spp = tell();
      if (fh_addr < superblk.eof_addr) {
        seek(fh_addr);
        var fh = hdf5_frhp();
        seek(fh.root_addr);

        hdf5_fhdb(fh, link);
      }
      if (bt_addr < superblk.eof_addr) {
        seek(bt_addr);
        hdf5_bthd();
      }
      seek(spp);
    }

    function hdf5_process_message(msg, link) {
      var cq_new = {};
      var val_type;

      switch (msg.hm_type) {
      case 1:
        hdf5_msg_dataspace(msg.hm_size, link);
        break;
      case 2:
        hdf5_msg_linkinfo();
        break;
      case 3:
        val_type = hdf5_msg_datatype(msg.hm_size);
        if (link) {
          link.lnk_type = val_type.typ_type;
        }
        break;
      case 6:
        hdf5_msg_link(link);
        break;
      case 8:
        hdf5_msg_layout(link);
        break;
      case 10:
        hdf5_msg_groupinfo();
        break;
      case 11:
        hdf5_msg_pipeline(link);
        break;
      case 12:
        hdf5_msg_attribute(msg.hm_size, link);
        break;
      case 16:
        cq_new.cq_off = get_offset();
        cq_new.cq_len = get_length();
        continuation_queue.push(cq_new);
        if (debug) {
          console.log("hdf5_msg_objhdrcontinue " + cq_new.cq_off + " " + cq_new.cq_len);
        }
        break;
      case 17: // SymbolTable
        link.lnk_sym_btree = get_offset();
        link.lnk_sym_lheap = get_offset();
        if (debug) {
          console.log("hdf5_msg_symboltable " + link.lnk_sym_btree + " " + link.lnk_sym_lheap);
        }
        break;
      case 21:
        hdf5_msg_attrinfo(link);
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
    function hdf5_ohdr2(link) {
      if (!check_signature("OHDR")) {
        throw new Error('Bad or missing OHDR signature');
      }

      var ver = get_u8();
      var flags = get_u8();

      if ((flags & 0x20) !== 0) {
        get_u32();          // access time (IGNORE)
        get_u32();          // modify time (IGNORE)
        get_u32();          // change time (IGNORE)
        get_u32();          // birth time (IGNORE)
      }

      if ((flags & 0x10) !== 0) {
        get_u16(); // maximum number of compact attributes (IGNORE)
        get_u16(); // maximum number of dense attributes (IGNORE)
      }

      var cb = 1 << (flags & 3);
      var ck0_size = get_uxx(cb);

      var msg_num = 0;
      var msg_offs = 0;
      var msg_bytes = ck0_size;

      if (debug) {
        console.log("hdf5_ohdr2 V" + ver + " F" + flags + " HS" + ck0_size);
      }

      var hmsg;
      var cq_head;
      var spp;

      while (true) {
        while (msg_bytes - msg_offs >= 8) {
          hmsg = {};
          hmsg.hm_type = get_u8();
          hmsg.hm_size = get_u16();
          hmsg.hm_flags = get_u8();
          if (debug) {
            console.log("  msg" + msg_num + " F" + hmsg.hm_flags + " T " + hmsg.hm_type + " S " + hmsg.hm_size + " (" + msg_offs + "/" + msg_bytes + ") " + msg_type_to_str(hmsg.hm_type));
          }
          if ((flags & 0x04) !== 0) {
            hmsg.hm_corder = get_u16();
          }
          spp = tell();
          hdf5_process_message(hmsg, link);
          seek(spp + hmsg.hm_size);

          msg_offs += hmsg.hm_size + 4;

          msg_num += 1;
        }

        if ((msg_bytes - msg_offs) > 4) {
          skip(msg_bytes - (msg_offs + 4));
        }

        get_u32();          // checksum (IGNORE)

        if (continuation_queue.length !== 0) {
          cq_head = continuation_queue.shift();
          seek(cq_head.cq_off);
          msg_bytes = cq_head.cq_len - 4;
          msg_offs = 0;
          if (debug) {
            console.log('continuing with ' + cq_head.cq_len + ' bytes at ' + tell());
          }
          if (!check_signature("OCHK")) {
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
        hdf5_ohdr2(child);
      });
    }

    function load_data(link) {
      if (link.lnk_ck_sz !== 0) {
        seek(link.lnk_dat_offset);

        var n_bytes = 1;
        var i;
        for (i = 0; i < link.lnk_dims.length; i += 1) {
          n_bytes *= link.lnk_dims[i];
        }
        n_bytes *= type_size(link.lnk_type);
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
        hdf5_btree(link);
      } else {
        if (link.lnk_dat_offset > 0 && link.lnk_dat_offset < superblk.eof_addr) {
          if (debug) {
            console.log('loading ' + link.lnk_dat_length + ' bytes from ' + link.lnk_dat_offset + ' to ' + link.lnk_name);
          }
          link.lnk_dat_array = get_array(link.lnk_type,
                                         link.lnk_dat_length,
                                         link.lnk_dat_offset);
        } else {
          if (debug) {
            console.log('data not present for /' + link.lnk_name + '/');
          }
        }
      }

      link.lnk_children.forEach(function (child) {
        load_data(child);
      });
    }

    function hdf5_ohdr1(link) {
      var oh = {};
      start_alignment();
      oh.oh_ver = get_u8();
      skip(1);                // reserved
      oh.oh_n_msgs = get_u16();
      oh.oh_ref_cnt = get_u32();
      oh.oh_hdr_sz = get_u32();
      if (oh.oh_ver !== 1) {
        throw new Error("Bad v1 object header version: " + oh.oh_ver);
      }
      if (debug) {
        console.log("hdf5_ohdr1 V" + oh.oh_ver +
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
            start_alignment();
          } else {
            break;
          }
        }

        check_alignment();

        hmsg = {};
        hmsg.hm_type = get_u16();
        hmsg.hm_size = get_u16();
        hmsg.hm_flags = get_u8();

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
                      "(" + msg_bytes + ") " + msg_type_to_str(hmsg.hm_type));
        }

        spp = tell();
        hdf5_process_message(hmsg, link);
        seek(spp + hmsg.hm_size); // skip whole message.
      }

      if (link.lnk_sym_btree !== 0 && link.lnk_sym_lheap !== 0) {
        seek(link.lnk_sym_btree);
        var bt = hdf5_btree();
        seek(link.lnk_sym_lheap);
        var lh = hdf5_lheap();
        var i;
        for (i = 0; i < bt.entries_used; i += 1) {
          seek(bt.keys[i].child_address);
          if (check_signature("SNOD")) {
            seek(bt.keys[i].child_address);
            hdf5_snod(lh, link);
          } else {
            seek(bt.keys[i].child_address);
            hdf5_ohdr1(link);
          }
        }

        link.lnk_children.forEach(function (child) {
          seek(child.lnk_hdr_offset);
          hdf5_ohdr1(child);
        });
      }
    }

    var root = hdf5_int_link();

    superblk = hdf5_sb();
    seek(superblk.root_addr);
    if (superblk.sbver <= 1) {
      hdf5_ohdr1(root);
    } else {
      hdf5_ohdr2(root);
    }
    load_data(root);
    return root;
  }

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

  function print_hierarchy(link, level) {
    var i;
    var msg = "";
    for (i = 0; i < level * 2; i += 1) {
      msg += " ";
    }
    msg += link.lnk_name + (link.lnk_children.length ? "/" : "");
    if (link.lnk_type > 0) {
      msg += ' ' + link.type_name(link.lnk_type);
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

    link.lnk_attributes.forEach(function (attr) {
      msg = "";
      for (i = 0; i < level * 2 + 1; i += 1) {
        msg += " ";
      }
      msg += link.lnk_name + ':' + attr.att_name + " " +
        link.type_name(attr.att_type) + "[" + attr.att_value.length + "] ";
      if (attr.att_type === type_enum.STR) {
        msg += "'" + attr.att_value + "'";
      } else {
        msg += "{" + join(attr.att_value.slice(0, 16), ', ');
        if (attr.att_value.length > 16) {
          msg += ", ...";
        }
        msg += "}";
      }
      console.log(msg);
    });

    link.lnk_children.forEach(function (child) {
      print_hierarchy(child, level + 1);
    });
  }

  function find_dataset(link, name, level) {
    var result;
    if (link.lnk_name === name && link.lnk_type > 0) {
      result = link;
    } else {
      link.lnk_children.find( function( child ) {
        result = find_dataset(child, name, level + 1);
        return defined(result);
      });
    }
    return result;
  }

  function find_attribute(link, name, level) {
    var result = link.lnk_attributes.find( function (element) {
      return (element.att_name === name);
    });

    if (result)
      return result.att_value;

    link.lnk_children.find( function (child ) {
      result = find_attribute( child, name, level + 1);
      return defined(result);
    });
    return result;
  }

  var VolumeViewer = BrainBrowser.VolumeViewer;

  VolumeViewer.utils.hdf5_loader = function (data) {
    var debug = false;

    var root;
    try {
      root = hdf5_reader(data, debug);
    } catch (e) {
      root = VolumeViewer.utils.netcdf_reader(data, debug);
    }
    print_hierarchy(root, 0);

    var image = find_dataset(root, 'image');
    if (!defined(image)) {
      throw new Error("Can't find image dataset.");
    }
    var valid_range = find_attribute(image, 'valid_range', 0);
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
    var image_min = find_dataset(root, 'image-min');
    if (!defined(image_min)) {
      image_min = {
        lnk_dat_array: Float32Array.of(0),
        lnk_dims: []
      };
    }
    var image_max = find_dataset(root, 'image-max');
    if (!defined(image_max)) {
      image_max = {
        lnk_dat_array: Float32Array.of(1),
        lnk_dims: []
      };
    }
    var new_abuf = new ArrayBuffer(image.lnk_dat_array.length *
                                   Float32Array.BYTES_PER_ELEMENT);
    var new_data = new Float32Array(new_abuf);
    var n_slice_dims = image.lnk_dims.length - image_min.lnk_dims.length;

    if (n_slice_dims < 1) {
      throw new Error('Too few slice dimensions!');
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
      console.log('valid range is ' + valid_range[0] + " to " + valid_range[1]);
    }
    var vrange;
    var rrange;
    var j;
    var v;
    var is_float = type_is_flt(image.lnk_type);
    for (i = 0; i < image_min.lnk_dat_array.length; i += 1) {
      if (debug) {
        console.log(i + " " + im_min[i] + " " + im_max[i] + " " +
                    im[i * n_slice_elements]);
      }
      vrange = (valid_range[1] - valid_range[0]);
      rrange = (im_max[i] - im_min[i]);
      for (j = 0; j < n_slice_elements; j += 1) {
        if (is_float) {
          v = im[c];
        }
        else {
          v = (im[c] - valid_range[0]) / vrange * rrange + im_min[i];
        }
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
    console.log('Sum: ' + s);
    console.log('Mean: ' + s / c);
    console.log('Min: ' + n);
    console.log('Max: ' + x);

    /* Create the header expected by the existing brainbrowser code.
     */
    var header = {};
    var tmp = find_attribute(image, 'dimorder', 0);
    if (typeof tmp !== 'string') {
      throw new Error("Can't find dimension order.");
    }
    header.order = tmp.split(',');

    header.order.forEach(function(dimname) {
      var dim = find_dataset(root, dimname);
      if (!defined(dim)) {
        throw new Error("Can't find dimension variable " + dimname);
      }
      
      header[dimname] = {};

      tmp = find_attribute(dim, "step", 0);
      if (!defined(tmp)) {
        throw new Error("Can't find step for " + dimname);
      }
      header[dimname].step = tmp[0];

      tmp = find_attribute(dim, "start", 0);
      if (!defined(tmp)) {
        throw new Error("Can't find start for " + dimname);
      }
      header[dimname].start = tmp[0];

      tmp = find_attribute(dim, "length", 0);
      if (!defined(tmp)) {
        throw new Error("Can't find length for " + dimname);
      }
      header[dimname].space_length = tmp[0];

      tmp = find_attribute(dim, "direction_cosines", 0);
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
