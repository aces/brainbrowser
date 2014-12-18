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
    var data = e.data;
    var shapes = data.shapes;
    var verts = data.vertices;
    var norms = data.normals;
    var colors = data.colors;
    var transfer = [verts.buffer];
    var i, count;
    var shape, unindexed;

    for (i = 0, count = shapes.length; i < count; i++) {
      shape = shapes[i];
      unindexed = deindex(shape.indices, verts, norms, shape.color || colors);
      shape.centroid = unindexed.centroid;
      shape.unindexed = unindexed.unindexed;

      transfer.push(shape.indices.buffer);

      transfer.push(shape.unindexed.position.buffer);

      if (shape.unindexed.normal) {
        transfer.push(shape.unindexed.normal.buffer);
      }

      if (shape.unindexed.color) {
        transfer.push(shape.unindexed.color.buffer);
      }
    }

    if (norms) {
      transfer.push(norms.buffer);
    }

    if (colors) {
      transfer.push(colors.buffer);
    }

    data.deindexed = true;

    self.postMessage(data, transfer);
  });
  
  function deindex(indices, verts, norms, colors) {
    indices = indices || [];
    verts = verts || [];
    norms = norms || [];
    colors = colors;

    var num_vertices = indices.length; // number of unindexed vertices.
    var num_coords = num_vertices * 3;
    var num_color_coords = num_vertices * 4;

    var normals_given = norms.length > 0;
    var data_color_0, data_color_1, data_color_2, data_color_3, all_gray;
    var bounding_box = {};
    var centroid = {};
    var i, count;
    var iv, ic;

    var result;

    if(colors.length === 4) {
      all_gray = true;
      data_color_0 = colors[0];
      data_color_1 = colors[1];
      data_color_2 = colors[2];
      data_color_3 = colors[3];
    }

    var unindexed_positions = new Float32Array(num_coords);
    var unindexed_normals = normals_given ?  new Float32Array(num_coords) : null;
    var unindexed_colors = new Float32Array(num_color_coords);

    // Calculate center so positions of objects relative to each other can
    // defined (mainly for transparency).
    for(i = 0, count = indices.length; i < count; i++) {
      boundingBoxUpdate(bounding_box, verts[indices[i] * 3], verts[indices[i] * 3 + 1], verts[indices[i] * 3 + 2]);
    }
    centroid.x = bounding_box.min_x + (bounding_box.max_x - bounding_box.min_x) / 2;
    centroid.y = bounding_box.min_y + (bounding_box.max_y - bounding_box.min_y) / 2;
    centroid.z = bounding_box.min_z + (bounding_box.max_z - bounding_box.min_z) / 2;

    // "Unravel" the vertex and normal arrays so we don't have to use indices
    // (Avoids WebGL's 16 bit limit on indices)
    for (i = 0; i < num_vertices; i += 3) {
      iv = i * 3;
      ic = i * 4;

      unindexed_positions[iv]     = verts[indices[i] * 3];
      unindexed_positions[iv + 1] = verts[indices[i] * 3 + 1];
      unindexed_positions[iv + 2] = verts[indices[i] * 3 + 2];
      unindexed_positions[iv + 3] = verts[indices[i+1] * 3];
      unindexed_positions[iv + 4] = verts[indices[i+1] * 3 + 1];
      unindexed_positions[iv + 5] = verts[indices[i+1] * 3 + 2];
      unindexed_positions[iv + 6] = verts[indices[i+2] * 3];
      unindexed_positions[iv + 7] = verts[indices[i+2] * 3 + 1];
      unindexed_positions[iv + 8] = verts[indices[i+2] * 3 + 2];

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
        unindexed_colors[ic + 3]  = data_color_3;
        unindexed_colors[ic + 4]  = data_color_0;
        unindexed_colors[ic + 5]  = data_color_1;
        unindexed_colors[ic + 6]  = data_color_2;
        unindexed_colors[ic + 7]  = data_color_3;
        unindexed_colors[ic + 8]  = data_color_0;
        unindexed_colors[ic + 9]  = data_color_1;
        unindexed_colors[ic + 10] = data_color_2;
        unindexed_colors[ic + 11] = data_color_3;
      } else {
        unindexed_colors[ic]      = colors[indices[i] * 4];
        unindexed_colors[ic + 1]  = colors[indices[i] * 4 + 1];
        unindexed_colors[ic + 2]  = colors[indices[i] * 4 + 2];
        unindexed_colors[ic + 3]  = colors[indices[i] * 4 + 3];
        unindexed_colors[ic + 4]  = colors[indices[i+1] * 4];
        unindexed_colors[ic + 5]  = colors[indices[i+1] * 4 + 1];
        unindexed_colors[ic + 6]  = colors[indices[i+1] * 4 + 2];
        unindexed_colors[ic + 7]  = colors[indices[i+1] * 4 + 3];
        unindexed_colors[ic + 8]  = colors[indices[i+2] * 4];
        unindexed_colors[ic + 9]  = colors[indices[i+2] * 4 + 1];
        unindexed_colors[ic + 10] = colors[indices[i+2] * 4 + 2];
        unindexed_colors[ic + 11] = colors[indices[i+2] * 4 + 3];
      }
    }

    result =  {
      centroid: centroid,
      bounding_box: bounding_box,
      unindexed : {
        position: unindexed_positions,
        normal: unindexed_normals,
        color: unindexed_colors,
      }
    };

    return result;
  }

  // Update current values of the bounding box of
  // an object.
  function boundingBoxUpdate(box, x, y, z) {
    if (!box.min_x || box.min_x > x) {
      box.min_x = x;
    }
    if (!box.max_x || box.max_x < x) {
      box.max_x = x;
    }
    if (!box.min_y || box.min_y > y) {
      box.min_y = y;
    }
    if (!box.max_y || box.max_y < y) {
      box.max_y = y;
    }
    if (!box.min_z || box.min_z > z) {
      box.min_z = z;
    }
    if (!box.max_z || box.max_z < z) {
      box.max_z = z;
    }
  }


})();


