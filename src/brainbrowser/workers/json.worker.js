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
    self.postMessage(parseData(JSON.parse(e.data.data)));
  });

  function parseData(data) {
    var result = { name: data.name, type: data.type, shapes: [] };
    result.vertices = flatten(data.vertices);

    data.colors = data.colors || data.color;

    if (data.colors) {
      result.colors = flatten(data.colors);

      if (result.vertices.length === result.colors.length || result.colors.length === 3) {
        result.colors = insertColorAlpha(result.colors);
      }

    }

    if (data.normals) {
      result.normals = flatten(data.normals);
    }

    if (data.shapes === undefined) {
      data.shapes = [];
    }

    if (data.indices) {
      data.shapes.push({ indices: data.indices });
    }

    data.shapes.forEach(function(shape) {
      var indices = flatten(shape.indices);
      
      if (shape.one_indexed) {
        adjustIndices(indices);
      }
      
      shape.color = shape.color || shape.colors;

      if (Array.isArray(shape.color) && shape.color.length === 3) {
        shape.color.push(1);
      }
      
      result.shapes.push({ name: shape.name, indices: indices, color: shape.color });
    });

    return result;
  }

  function flatten(array, index) {
    if (!Array.isArray(array)) {
      return [array];
    }

    index = index || 0;

    if (index === array.length) {
      return [];
    }

    var result = [];
    var i, count;

    for (i = 0, count = array.length; i < count; i++) {
      result.push.apply(result, flatten(array[i]));
    }

    return result;
  }

  function insertColorAlpha(data_colors) {
    var colors;
    var i, ri, count;

    colors = new Float32Array(data_colors.length * 4 / 3);
    i = ri = 0;
    count = data_colors.length;

    while (i < count) {
      colors[ri++] = data_colors[i++];
      colors[ri++] = data_colors[i++];
      colors[ri++] = data_colors[i++];
      colors[ri++] = 1.0;
    }

    return colors;
  }

  function adjustIndices(indices) {
    var i, count;

    for (i = 0, count = indices.length; i < count; i++) {
      indices[i] = indices[i] - 1;
    }
  }
  
})();

