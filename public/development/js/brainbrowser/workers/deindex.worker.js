/*
 * Copyright (C) 2011 McGill University
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function() {
  "use strict";
  
  self.addEventListener("message", function(e) {
    var data = e.data;
    var shapes = data.shapes;
    var verts = data.positionArray;
    var norms = data.normalArray;
    var colors = data.colorArray || [0.7, 0.7, 0.7, 1.0];
    var i, count;

    for (i = 0, count = shapes.length; i < count; i++) {
      shapes[i].unindexed = deindex(shapes[i].indexArray, verts, norms, colors);
    }

    self.postMessage(data);
  });
  
  function deindex(indices, verts, norms, colors) {
    indices = indices || [];
    verts = verts || [];
    norms = norms || [];
    colors = colors || [0.7, 0.7, 0.7, 1.0];

    var num_vertices = indices.length; // number of unindexed vertices.
    var num_coords = num_vertices * 3;
    var num_color_coords = num_vertices * 4;

    var normals_given = norms.length > 0;
    var data_color_0, data_color_1, data_color_2, all_gray;
    var bounding_box = {};
    var centroid = {};
    var i, count;

    if(colors.length === 4) {
      all_gray = true;
      data_color_0 = colors[0];
      data_color_1 = colors[1];
      data_color_2 = colors[2];
    }

    var unindexed_positions = new Float32Array(num_coords);
    var unindexed_normals = normals_given ?  new Float32Array(num_coords) : new Float32Array();
    var unindexed_colors = new Float32Array(num_color_coords);

    //Calculate center so positions of objects relative to each other can
    // defined (mainly for transparency).
    for(i = 0, count = verts.length; i + 2 < count; i += 3) {
      boundingBoxUpdate(bounding_box, verts[i], verts[i+1], verts[i+2]);
    }
    centroid.x = bounding_box.minX + 0.5 * (bounding_box.maxX - bounding_box.minX);
    centroid.y = bounding_box.minY + 0.5 * (bounding_box.maxY - bounding_box.minY);
    centroid.z = bounding_box.minY + 0.5 * (bounding_box.maxZ - bounding_box.minZ);

    // "Unravel" the vertex and normal arrays so we don't have to use indices
    // (Avoids WebGL's 16 bit limit on indices)
    for (i = 0, count = num_vertices; i < count; i++) {
      unindexed_positions[i*3] = verts[indices[i] * 3] - centroid.x;
      unindexed_positions[i*3 + 1] = verts[indices[i] * 3 + 1] - centroid.y;
      unindexed_positions[i*3 + 2] = verts[indices[i] * 3 + 2] - centroid.z;

      if (normals_given) {
        unindexed_normals[i*3] = norms[indices[i] * 3];
        unindexed_normals[i*3 + 1] = norms[indices[i] * 3 + 1];
        unindexed_normals[i*3 + 2] = norms[indices[i] * 3 + 2];
      }

      if (all_gray) {
        unindexed_colors[i*4] = data_color_0;
        unindexed_colors[i*4 + 1] = data_color_1;
        unindexed_colors[i*4 + 2] = data_color_2;
      } else {
        unindexed_colors[i*4] = colors[indices[i] * 4];
        unindexed_colors[i*4 + 1] = colors[indices[i] * 4 + 1];
        unindexed_colors[i*4 + 2] = colors[indices[i] * 4 + 2];
      }
      unindexed_colors[i*4 + 3] = 1.0;
    }

    return {
      position: unindexed_positions,
      normal: unindexed_normals,
      color: unindexed_colors,
      centroid: centroid
    };

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


