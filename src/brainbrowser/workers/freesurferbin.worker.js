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
      
  self.addEventListener("message", function(e) {
    var result = parse(e.data.data);
    var transfer = [
      result.vertices.buffer,
      result.shapes[0].indices.buffer
    ];

    self.postMessage(result, transfer);
  });
  
  // Parsing based on http://www.grahamwideman.com/gw/brain/fs/surfacefileformats.htm
  function parse(data) {
    var bytes = new DataView(data);
    var index = 0;
    var vertices, num_vertices;
    var indices, num_indices;
    var i, ci;

    var magic_number = getMagicNumber(bytes);
    index += 3;

    // Triangle: (-2 & 0x00ffffff)
    // Quad:     (-1 & 0x00ffffff)
    // New quad: (-3 & 0x00ffffff)
    if (magic_number !== (-2 & 0x00ffffff)) {
      return {
        error: true,
        error_message: "Only triangle meshes supported."
      };
    }

    // Remove string.
    while (bytes.getUint8(index) !== 0x0A || bytes.getUint8(index + 1) !== 0x0A) {
      index++;
    }
    index += 2; //Skip over two newlines

    num_vertices = bytes.getUint32(index);
    index += 4;

    num_indices = bytes.getUint32(index) * 3;
    index += 4;

    vertices = new Float32Array(num_vertices * 3);
    indices = new Uint32Array(num_indices);

    for (i = 0; i < num_vertices; i++) {
      ci = i * 3;
      vertices[ci]   = bytes.getFloat32(index);
      index += 4;

      vertices[ci + 1] = bytes.getFloat32(index);
      index += 4;

      vertices[ci + 2] = bytes.getFloat32(index);
      index += 4;
    }

    for (i = 0; i < num_indices; i++) {
      indices[i] = bytes.getUint32(index);
      index += 4;
    }

    return {
      vertices: vertices,
      shapes: [
        {
          indices: indices
        }
      ]
    };

  }

  // First 3 bytes.
  function getMagicNumber(bytes) {
    var result = 0;
    var i;

    for (i = 0; i < 3; i++) {
      result += bytes.getUint8(i) << (3 - i - 1) * 8;
    }

    return result;
  }
})();

