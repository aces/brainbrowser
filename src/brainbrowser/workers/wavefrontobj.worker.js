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
* @author: Nicolas Kassis
* @author: Tarek Sherif
*/

(function() {
  "use strict";

  self.addEventListener("message", function(e) {
    var parsed = parse(e.data.data);
    var result = parsed.result;
    var transfer = parsed.transfer;

    self.postMessage(result, transfer);
  });
  
  function parse(data) {
    var current_shape;
    var vertices = [];
    var texture_coords = [];
    var normals = [];
    var indices, texture_indices, normal_indices;
    var line;
    var line_marker;
    var line_length;
    var i, n, k, count;
    var elem, first_elem;
   
    var result = {};
    var transfer = [];

    data = data.split("\n");
    result.shapes = [];
    current_shape = {indices: [], texture_indices:[], normal_indices: []};
    result.shapes.push(current_shape);
    for(i = 0, count = data.length; i < count; i++) {
      line = data[i].replace(/^\s+/, "").replace(/\s+$/, "").split(/\s+/);
      line_marker = line[0];
      line_length = line.length;
  
      if(!(line_marker.match("#")) || line === "") {
        switch(line_marker) {
        case "o":
        case "g":
          current_shape = {name: line[1], indices: [], texture_indices:[], normal_indices: []};
          result.shapes.push(current_shape);
          break;
        case "v":
          vertices.push(parseFloat(line[1]));
          vertices.push(parseFloat(line[2]));
          vertices.push(parseFloat(line[3]));
          break;
        case "vt":
          for(n = 1; n < line_length; n++){
            texture_coords.push(parseFloat(line[n]));
          }
          break;
        case "vn":
          normals.push(parseFloat(line[1]));
          normals.push(parseFloat(line[2]));
          normals.push(parseFloat(line[3]));
          break;
        case "f":
          indices = current_shape.indices;
          normal_indices = current_shape.normal_indices;
          texture_indices = current_shape.texture_indices;
          
          first_elem = line[1].split("/");
          
          for (k = 2; k < line_length - 1; k++){
            indices.push(parseInt(first_elem[0], 10) - 1);
            texture_indices.push(parseInt(first_elem[1], 10) - 1);
            if (first_elem[2]) {
              normal_indices.push(parseInt(first_elem[2], 10) - 1);
            }
            elem = line[k].split("/");
            indices.push(parseInt(elem[0], 10) - 1);
            texture_indices.push(parseInt(elem[1], 10) - 1);
            if (elem[2]) {
              normal_indices.push(parseInt(elem[2], 10) - 1);
            }
            elem = line[k+1].split("/");
            indices.push(parseInt(elem[0], 10) - 1);
            texture_indices.push(parseInt(elem[1], 10) - 1);
            if (elem[2]) {
              normal_indices.push(parseInt(elem[2], 10) - 1);
            }
          }

          break;
        }
      }
    }
  
    result.type = "polygon";
    result.vertices = new Float32Array(vertices);
    transfer.push(result.vertices.buffer);

    if (normals.length > 0) {
      result.normals = new Float32Array(normals);
      transfer.push(result.normals.buffer);
    }

    if (texture_coords.length > 0) {
      result.texture_coords = new Float32Array(texture_coords);
      transfer.push(result.texture_coords.buffer);
    }

    result.shapes.forEach(function(shape) {
      shape.indices = new Uint32Array(shape.indices);
      transfer.push(shape.indices.buffer);

      if (shape.normal_indices.length > 0) {
        shape.normal_indices = new Uint32Array(shape.normal_indices);
        transfer.push(shape.normal_indices.buffer);
      } else {
        shape.normal_indices = null;
      }

      if (shape.texture_indices.length > 0) {
        shape.texture_indices = new Uint32Array(shape.texture_indices);
        transfer.push(shape.texture_indices.buffer);
      } else {
        shape.texture_indices = null;
      }
    });

    return {
      result: result,
      transfer: transfer
    };
  }
})();

