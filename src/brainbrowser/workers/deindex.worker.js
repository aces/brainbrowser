/*
* BrainBrowser: Web-based Neurological Visualization Tools
* (https://brainbrowser.cbrain.mcgill.ca)
*
* Copyright (C) 2011 Alan Evans, McGill University 
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
    var data = e.data;
    var shapes = data.shapes;
    var verts = data.vertices;
    var norms = data.normals;
    var colors = data.colors || [0.7, 0.7, 0.7, 1.0];
    var i, count;
    var shape, unindexed;

    for (i = 0, count = shapes.length; i < count; i++) {
      shape = shapes[i];
      unindexed = deindex(shapes[i].indices, verts, norms, colors, data.type !== "line");
      shape.centroid = unindexed.centroid;
      shape.unindexed = unindexed.unindexed;
      shape.wireframe = unindexed.wireframe;
    }

    self.postMessage(data);
  });
  
  function deindex(indices, verts, norms, colors, wireframe) {
    indices = indices || [];
    verts = verts || [];
    norms = norms || [];
    colors = colors || [0.7, 0.7, 0.7, 1.0];

    var num_vertices = indices.length; // number of unindexed vertices.
    var num_coords = num_vertices * 3;
    var num_color_coords = num_vertices * 4;
    var wire_verts, wire_colors;

    var normals_given = norms.length > 0;
    var data_color_0, data_color_1, data_color_2, all_gray;
    var bounding_box = {};
    var centroid = {};
    var i, count;
    var iw, iv, ic, iwc;

    var result;

    if(colors.length === 4) {
      all_gray = true;
      data_color_0 = colors[0];
      data_color_1 = colors[1];
      data_color_2 = colors[2];
    }

    var unindexed_positions = new Float32Array(num_coords);
    var unindexed_normals = normals_given ?  new Float32Array(num_coords) : new Float32Array();
    var unindexed_colors = new Float32Array(num_color_coords);
    if (wireframe) {
      wire_verts = new Float32Array(num_coords * 2);
      wire_colors = new Float32Array(num_color_coords * 2);
    }
     

    // Calculate center so positions of objects relative to each other can
    // defined (mainly for transparency).
    for(i = 0, count = indices.length; i < count; i++) {
      boundingBoxUpdate(bounding_box, verts[indices[i] * 3], verts[indices[i] * 3 + 1], verts[indices[i] * 3 + 2]);
    }
    centroid.x = bounding_box.minX + (bounding_box.maxX - bounding_box.minX) / 2;
    centroid.y = bounding_box.minY + (bounding_box.maxY - bounding_box.minY) / 2;
    centroid.z = bounding_box.minZ + (bounding_box.maxZ - bounding_box.minZ) / 2;
    centroid.bounding_box = bounding_box;

    // "Unravel" the vertex and normal arrays so we don't have to use indices
    // (Avoids WebGL's 16 bit limit on indices)
    for (i = 0, count = num_vertices; i < count; i += 3) {
      iv = i * 3;
      ic = i * 4;

      unindexed_positions[iv]     = verts[indices[i] * 3] - centroid.x;
      unindexed_positions[iv + 1] = verts[indices[i] * 3 + 1] - centroid.y;
      unindexed_positions[iv + 2] = verts[indices[i] * 3 + 2] - centroid.z;
      unindexed_positions[iv + 3] = verts[indices[i+1] * 3] - centroid.x;
      unindexed_positions[iv + 4] = verts[indices[i+1] * 3 + 1] - centroid.y;
      unindexed_positions[iv + 5] = verts[indices[i+1] * 3 + 2] - centroid.z;
      unindexed_positions[iv + 6] = verts[indices[i+2] * 3] - centroid.x;
      unindexed_positions[iv + 7] = verts[indices[i+2] * 3 + 1] - centroid.y;
      unindexed_positions[iv + 8] = verts[indices[i+2] * 3 + 2] - centroid.z;

      if (normals_given) {
        unindexed_normals[iv]     = norms[indices[i] * 3];
        unindexed_normals[iv + 1] = norms[indices[i] * 3 + 1];
        unindexed_normals[iv + 2] = norms[indices[i] * 3 + 2];
        unindexed_normals[iv + 3] = norms[indices[i+1] * 3];
        unindexed_normals[iv + 4] = norms[indices[i+1] * 3 + 1];
        unindexed_normals[iv + 5] = norms[indices[i+1] * 3 + 2];
        unindexed_normals[iv + 6] = norms[indices[i+2] * 3];
        unindexed_normals[iv + 7] = norms[indices[i+2] * 3 + 1];
        unindexed_normals[iv + 8] = norms[indices[i+2] * 3 + 2];
      }

      if (all_gray) {
        unindexed_colors[ic]      = data_color_0;
        unindexed_colors[ic + 1]  = data_color_1;
        unindexed_colors[ic + 2]  = data_color_2;
        unindexed_colors[ic + 3]  = 1.0;
        unindexed_colors[ic + 4]  = data_color_0;
        unindexed_colors[ic + 5]  = data_color_1;
        unindexed_colors[ic + 6]  = data_color_2;
        unindexed_colors[ic + 7]  = 1.0;
        unindexed_colors[ic + 8]  = data_color_0;
        unindexed_colors[ic + 9]  = data_color_1;
        unindexed_colors[ic + 10] = data_color_2;
        unindexed_colors[ic + 11] = 1.0;
      } else {
        unindexed_colors[ic]      = colors[indices[i] * 4];
        unindexed_colors[ic + 1]  = colors[indices[i] * 4 + 1];
        unindexed_colors[ic + 2]  = colors[indices[i] * 4 + 2];
        unindexed_colors[ic + 3]  = 1.0;
        unindexed_colors[ic + 4]  = colors[indices[i+1] * 4];
        unindexed_colors[ic + 5]  = colors[indices[i+1] * 4 + 1];
        unindexed_colors[ic + 6]  = colors[indices[i+1] * 4 + 2];
        unindexed_colors[ic + 7]  = 1.0;
        unindexed_colors[ic + 8]  = colors[indices[i+2] * 4];
        unindexed_colors[ic + 9]  = colors[indices[i+2] * 4 + 1];
        unindexed_colors[ic + 10] = colors[indices[i+2] * 4 + 2];
        unindexed_colors[ic + 11] = 1.0;
      }

      if (wireframe) {
        iw = iv * 2;
        iwc = ic * 2;

        // v1 -v2
        wire_verts[iw]      = unindexed_positions[iv];
        wire_verts[iw + 1]  = unindexed_positions[iv + 1];
        wire_verts[iw + 2]  = unindexed_positions[iv + 2];
        wire_verts[iw + 3]  = unindexed_positions[iv + 3];
        wire_verts[iw + 4]  = unindexed_positions[iv + 4];
        wire_verts[iw + 5]  = unindexed_positions[iv + 5];

        // v2 - v3
        wire_verts[iw + 6]  = unindexed_positions[iv + 3];
        wire_verts[iw + 7]  = unindexed_positions[iv + 4];
        wire_verts[iw + 8]  = unindexed_positions[iv + 5];
        wire_verts[iw + 9]  = unindexed_positions[iv + 6];
        wire_verts[iw + 10] = unindexed_positions[iv + 7];
        wire_verts[iw + 11] = unindexed_positions[iv + 8];

        // v3 - v1
        wire_verts[iw + 12] = unindexed_positions[iv + 6];
        wire_verts[iw + 13] = unindexed_positions[iv + 7];
        wire_verts[iw + 14] = unindexed_positions[iv + 8];
        wire_verts[iw + 15] = unindexed_positions[iv];
        wire_verts[iw + 16] = unindexed_positions[iv + 1];
        wire_verts[iw + 17] = unindexed_positions[iv + 2];

         // v1 -v2
        wire_colors[iwc]      = unindexed_colors[ic];
        wire_colors[iwc + 1]  = unindexed_colors[ic + 1];
        wire_colors[iwc + 2]  = unindexed_colors[ic + 2];
        wire_colors[iwc + 3]  = unindexed_colors[ic + 3];
        wire_colors[iwc + 4]  = unindexed_colors[ic + 4];
        wire_colors[iwc + 5]  = unindexed_colors[ic + 5];
        wire_colors[iwc + 6]  = unindexed_colors[ic + 6];
        wire_colors[iwc + 7]  = unindexed_colors[ic + 7];

        // v2 - v3
        wire_colors[iwc + 8]  = unindexed_colors[ic + 4];
        wire_colors[iwc + 9]  = unindexed_colors[ic + 5];
        wire_colors[iwc + 10] = unindexed_colors[ic + 6];
        wire_colors[iwc + 11] = unindexed_colors[ic + 7];
        wire_colors[iwc + 12] = unindexed_colors[ic + 8];
        wire_colors[iwc + 13] = unindexed_colors[ic + 9];
        wire_colors[iwc + 14] = unindexed_colors[ic + 10];
        wire_colors[iwc + 15] = unindexed_colors[ic + 11];
        
        // v3 - v1
        wire_colors[iwc + 16] = unindexed_colors[ic + 8];
        wire_colors[iwc + 17] = unindexed_colors[ic + 9];
        wire_colors[iwc + 18] = unindexed_colors[ic + 10];
        wire_colors[iwc + 19] = unindexed_colors[ic + 11];
        wire_colors[iwc + 20] = unindexed_colors[ic];
        wire_colors[iwc + 21] = unindexed_colors[ic + 1];
        wire_colors[iwc + 22] = unindexed_colors[ic + 2];
        wire_colors[iwc + 23] = unindexed_colors[ic + 3];
      }
    }

    result =  {
      centroid: centroid,
      unindexed : {
        position: unindexed_positions,
        normal: unindexed_normals,
        color: unindexed_colors,
      }
    };

    if (wireframe) {
      result.wireframe =  {
        position: wire_verts,
        color: wire_colors
      };
    }

    return result;
  }

  // Update current values of the bounding box of
  // an object.
  function boundingBoxUpdate(box, x, y, z) {
    if (!box.minX || box.minX > x) {
      box.minX = x;
    }
    if (!box.maxX || box.maxX < x) {
      box.maxX = x;
    }
    if (!box.minY || box.minY > y) {
      box.minY = y;
    }
    if (!box.maxY || box.maxY < y) {
      box.maxY = y;
    }
    if (!box.minZ || box.minZ > z) {
      box.minZ = z;
    }
    if (!box.maxZ || box.maxZ < z) {
      box.maxZ = z;
    }
  }


})();


