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

BrainBrowser.filetypes.FreeSurferAsc = function(data) {
  var obj = this;
  var current_shape;
  var vertexArray = [];
  var texCoordArray = [];
  var normalArray = [];
  var counts;
  var vertexCount;
  var faceCount;
  var line;
  var face, shape;
  var numberOfShapes;
  var i, l;
  
  data = data.split('\n');
  obj.shapes = [];
  current_shape = {name: data.name | "undefined", faces: [], positionArray: [], colorArray: [], indexArray: [], texIndexArray:[], normalIndexArray: []};
  obj.shapes.push(current_shape);
  
  counts = data[1].split(/\s+/);
  vertexCount = parseInt(counts[0], 10);
  faceCount = parseInt(counts[1], 10);
  
  for (i = 2; i < vertexCount + 2; i++) {
    line = data[i].split(/\s+/);
    vertexArray.push(parseFloat(line[0]));
    vertexArray.push(parseFloat(line[1]));
    vertexArray.push(parseFloat(line[2]));
  }
  
  for (i = vertexCount + 2; i < vertexCount + faceCount + 2; i++) {
    line = data[i].split(/\s+/);
    face = [];
    face.push(parseInt(line[0], 10));
    face.push(parseInt(line[1], 10));
    face.push(parseInt(line[2], 10));
    current_shape.faces.push(face);
  }
  
  numberOfShapes = obj.shapes.length;
  for(l = 0; l < numberOfShapes; l++){
    shape = obj.shapes[l];
    
    shape.positionArray = vertexArray;
    if (shape.colorArray.length == 0) {
      shape.colorArray = [0.8,0.8,0.8,1.0];
    }
  }
  
  obj.objectClass = 'P';
  obj.vertexArray = vertexArray;
};