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
    self.postMessage(parse(e.data.data));
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
    var face, elem;
   
    var result = {};

    data = data.split("\n");
    result.shapes = [];
    current_shape = {name: data.name | "undefined", faces: [], indices: [], texture_indices:[], normal_indices: []};
    result.shapes.push(current_shape);
    for(i = 0, count = data.length; i < count; i++) {
      line = data[i].replace(/^\s+/, "").replace(/\s+$/, "").split(/\s+/);
      line_marker = line[0];
      line_length = line.length;
  
      if(!(line_marker.match("#")) || line === "") {
        switch(line_marker) {
        case "o":
        case "g":
          current_shape = {name: line[1], faces: [], indices: [], texture_indices:[],  normal_indices: []};
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
          face = [];
          indices = current_shape.indices;
          texture_indices = current_shape.texture_indices;
          normal_indices = current_shape.normal_indices;
          
          var first_elem = line[1].split("/");
          
          for (k = 2; k < line_length - 1; k++){
            face.push(parseInt(first_elem[0], 10) - 1);
            indices.push(parseInt(first_elem[0], 10) - 1);
            texture_indices.push(parseInt(first_elem[1], 10) - 1);
            if (first_elem[2]) {
              normal_indices.push(parseInt(first_elem[2], 10) - 1);
            }
            elem = line[k].split("/");
            face.push(parseInt(elem[0], 10) - 1);
            indices.push(parseInt(elem[0], 10) - 1);
            texture_indices.push(parseInt(elem[1], 10) - 1);
            if (elem[2]) {
              normal_indices.push(parseInt(elem[2], 10) - 1);
            }
            elem = line[k+1].split("/");
            face.push(parseInt(elem[0], 10) - 1);
            indices.push(parseInt(elem[0], 10) - 1);
            texture_indices.push(parseInt(elem[1], 10) - 1);
            if (elem[2]) {
              normal_indices.push(parseInt(elem[2], 10) - 1);
            }
          }

          current_shape.faces.push(face);
          break;
        }
      }
    }
  
    result.type = "polygon";
    result.vertices = vertices;
    result.normals = normals;
    result.colors = [0.8, 0.8, 0.8, 1.0];
    result.texture_coords = texture_coords;

    return result;
  }
})();

