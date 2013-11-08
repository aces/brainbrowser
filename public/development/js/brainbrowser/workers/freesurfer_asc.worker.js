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
    var counts;
    var vertexCount;
    var faceCount;
    var line;
    var face;
    var i;
    
    data = data.split('\n');
    result.shapes = [];
    current_shape = {name: data.name | "undefined", faces: [], positionArray: [], colorArray: [], indexArray: [], texIndexArray:[], normalIndexArray: []};
    result.shapes.push(current_shape);
    
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

      Array.prototype.push.apply(current_shape.indexArray, face);
      current_shape.faces.push(face);
    }
    
    result.objectClass = 'P';
    result.positionArray = vertexArray;
    result.colorArray = [0.8,0.8,0.8,1.0];
  }
})();

