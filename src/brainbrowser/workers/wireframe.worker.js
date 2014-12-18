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
* @author: Tarek Sherif
*/

(function() {
  "use strict";

  self.addEventListener("message", function(event) {
    var data = event.data;

    var result, transfer;

    if (data.indices) {
      result = createIndexedWireframe(data.indices);
      transfer = [result.indices.buffer];
    } else {
      result = createUnindexedWireframe(data.positions, data.colors);
      transfer = [result.positions.buffer, result.colors.buffer];
    }

    self.postMessage(result, transfer);
  });

  function createIndexedWireframe(indices) {
    var wire_indices = new Uint32Array(indices.length * 2);
    var i, iw, count;

    for (i = 0, count = indices.length; i < count; i += 3) {
      iw = i * 2;

      // v1 - v2
      wire_indices[iw]      = indices[i];
      wire_indices[iw + 1]  = indices[i + 1];

      // v2 - v3
      wire_indices[iw + 2]  = indices[i + 1];
      wire_indices[iw + 3]  = indices[i + 2];

      // v3 - v1
      wire_indices[iw + 4] = indices[i + 2];
      wire_indices[iw + 5] = indices[i];

    }

    return {
      indices: wire_indices
    };
  }

  function createUnindexedWireframe(positions, colors) {
    var wire_verts = new Float32Array(positions.length * 2);
    var wire_colors = new Float32Array(colors.length * 2);
    var i, iw, iv, ic, iwc;
    var num_vertices = positions.length / 3;

    for (i = 0; i < num_vertices; i += 3) {
      iv = i * 3;
      ic = i * 4;
      iw = iv * 2;
      iwc = ic * 2;

      // v1 -v2
      wire_verts[iw]      = positions[iv];
      wire_verts[iw + 1]  = positions[iv + 1];
      wire_verts[iw + 2]  = positions[iv + 2];
      wire_verts[iw + 3]  = positions[iv + 3];
      wire_verts[iw + 4]  = positions[iv + 4];
      wire_verts[iw + 5]  = positions[iv + 5];

      // v2 - v3
      wire_verts[iw + 6]  = positions[iv + 3];
      wire_verts[iw + 7]  = positions[iv + 4];
      wire_verts[iw + 8]  = positions[iv + 5];
      wire_verts[iw + 9]  = positions[iv + 6];
      wire_verts[iw + 10] = positions[iv + 7];
      wire_verts[iw + 11] = positions[iv + 8];

      // v3 - v1
      wire_verts[iw + 12] = positions[iv + 6];
      wire_verts[iw + 13] = positions[iv + 7];
      wire_verts[iw + 14] = positions[iv + 8];
      wire_verts[iw + 15] = positions[iv];
      wire_verts[iw + 16] = positions[iv + 1];
      wire_verts[iw + 17] = positions[iv + 2];

       // v1 -v2
      wire_colors[iwc]      = colors[ic];
      wire_colors[iwc + 1]  = colors[ic + 1];
      wire_colors[iwc + 2]  = colors[ic + 2];
      wire_colors[iwc + 3]  = colors[ic + 3];
      wire_colors[iwc + 4]  = colors[ic + 4];
      wire_colors[iwc + 5]  = colors[ic + 5];
      wire_colors[iwc + 6]  = colors[ic + 6];
      wire_colors[iwc + 7]  = colors[ic + 7];

      // v2 - v3
      wire_colors[iwc + 8]  = colors[ic + 4];
      wire_colors[iwc + 9]  = colors[ic + 5];
      wire_colors[iwc + 10] = colors[ic + 6];
      wire_colors[iwc + 11] = colors[ic + 7];
      wire_colors[iwc + 12] = colors[ic + 8];
      wire_colors[iwc + 13] = colors[ic + 9];
      wire_colors[iwc + 14] = colors[ic + 10];
      wire_colors[iwc + 15] = colors[ic + 11];
      
      // v3 - v1
      wire_colors[iwc + 16] = colors[ic + 8];
      wire_colors[iwc + 17] = colors[ic + 9];
      wire_colors[iwc + 18] = colors[ic + 10];
      wire_colors[iwc + 19] = colors[ic + 11];
      wire_colors[iwc + 20] = colors[ic];
      wire_colors[iwc + 21] = colors[ic + 1];
      wire_colors[iwc + 22] = colors[ic + 2];
      wire_colors[iwc + 23] = colors[ic + 3];
    }

    return {
      positions: wire_verts,
      colors: wire_colors
    };
  }
})();
