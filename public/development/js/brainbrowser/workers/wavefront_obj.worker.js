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
  
  var result = {};

  self.addEventListener("message", function(e) {
    var data = e.data;
    parse(data);
    self.postMessage(result);
  });
  
  function parse(data) {
    var current_shape;
    var vertexArray = [];
    var texCoordArray = [];
    var normalArray = [];
    var indexArray, texIndexArray, normalIndexArray;
    var line;
    var line_marker;
    var line_length, numberOfShapes;
    var i, n, k, l, count;
    var face, shape, elem;
    
    data = data.split('\n');
    result.shapes = [];
    current_shape = {name: data.name | "undefined", faces: [], positionArray: [], colorArray: [], indexArray: [], texIndexArray:[], normalIndexArray: []};
    result.shapes.push(current_shape);
    for(i = 0, count = data.length; i < count; i++) {
      line = data[i].split(/\s+/);
      line_marker = line[0];
      line_length = line.length;
  
      if(!(line_marker.match("#")) || line === "") {
        switch(line_marker) {
        case "o":
        case "g":
          current_shape = {name: line[1], faces: [], positionArray: [], colorArray: [], indexArray: [], texIndexArray:[],  normalIndexArray: []};
          result.shapes.push(current_shape);
          break;
        case "v":
          vertexArray.push(parseFloat(line[1]));
          vertexArray.push(parseFloat(line[2]));
          vertexArray.push(parseFloat(line[3]));
          break;
        case "vt":
          for(n = 1; n < line_length; n++){
            texCoordArray.push(parseFloat(line[n]));
          }
          break;
        case "vn":
          normalArray.push(parseFloat(line[1]));
          normalArray.push(parseFloat(line[2]));
          normalArray.push(parseFloat(line[3]));
          break;
        case "f":
          face = [];
          indexArray = current_shape.indexArray;
          texIndexArray = current_shape.texIndexArray;
          normalIndexArray = current_shape.normalIndexArray;
          
          var first_elem = line[1].split('/');
          

          for (k = 2; k < line_length - 1; k++){
            face.push(parseInt(first_elem[0], 10)-1);
            indexArray.push(parseInt(first_elem[0], 10) - 1);
            texIndexArray.push(parseInt(first_elem[1], 10) - 1);
            if (first_elem[2]) {
              normalIndexArray.push(parseInt(first_elem[2], 10) - 1);
            }
            elem = line[k].split('/');
            face.push(parseInt(elem[0], 10)-1);
            indexArray.push(parseInt(elem[0], 10) - 1);
            texIndexArray.push(parseInt(elem[1], 10) - 1);
            if (elem[2]) {
              normalIndexArray.push(parseInt(elem[2], 10) - 1);
            }
            elem = line[k+1].split('/');
            face.push(parseInt(elem[0], 10)-1);
            indexArray.push(parseInt(elem[0], 10) - 1);
            texIndexArray.push(parseInt(elem[1], 10) - 1);
            if (elem[2]) {
              normalIndexArray.push(parseInt(elem[2], 10) - 1);
            }
          }

          current_shape.faces.push(face);
          break;
        }
      }
    }
  
    result.objectClass = 'P';
    result.positionArray = vertexArray;
    result.normalArray = normalArray;
    result.colorArray = [0.8,0.8,0.8,1.0];
    result.texCoordArray = texCoordArray;
  }
})();

