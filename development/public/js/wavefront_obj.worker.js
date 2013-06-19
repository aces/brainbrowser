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

var self = this;

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
  var i, n, k, l, lastIndex, count;
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
          
          for (k = 1; k < 4; k++){
            elem = line[k].split('/');
            face.push(parseInt(elem[0])-1);
            indexArray.push(parseInt(elem[0], 10) - 1);
            texIndexArray.push(parseInt(elem[1], 10) - 1);
            if (elem[2]) {
              normalIndexArray.push(parseInt(elem[2], 10) - 1);
            }
          }

          if (line_length >= 4) {
            while (k < line_length){
              elem = line[k].split('/');
              face.push(parseInt(elem[0], 10) - 1);
              lastIndex = current_shape.indexArray.length;
              indexArray.push(current_shape.indexArray[lastIndex - 1]);		
              
              indexArray.push(current_shape.indexArray[lastIndex - 3]);	
              indexArray.push(elem[0] - 1);	
              k++;
            }
          }
          current_shape.faces.push(face);
          break;
      } 
    }
  }
  numberOfShapes = result.shapes.length;
  for(l = 0; l < numberOfShapes; l++){
    shape = result.shapes[l];
 
    shape.positionArray = vertexArray;
    if (shape.colorArray.length === 0) {
      shape.colorArray = [0.8,0.8,0.8,1.0];
    }
  }
  
  result.objectClass = 'P';
  result.vertexArray = vertexArray;
  result.texCoordArray = texCoordArray;
}