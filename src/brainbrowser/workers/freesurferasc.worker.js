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
    self.postMessage(parse(e.data.data));
  });
  
  function parse(data) {
    var current_shape;
    var vertices = [];
    var counts;
    var vertex_count;
    var face_count;
    var line;
    var face;
    var i;
    
    var result = {};

    data = data.split("\n");
    result.shapes = [];
    current_shape = {name: data.name | "undefined", faces: [], indices: [] };
    result.shapes.push(current_shape);
    
    counts = data[1].replace(/^\s+/, "").replace(/\s+$/, "").split(/\s+/);
    vertex_count = parseInt(counts[0], 10);
    face_count = parseInt(counts[1], 10);
    
    for (i = 2; i < vertex_count + 2; i++) {
      line = data[i].replace(/^\s+/, "").replace(/\s+$/, "").split(/\s+/);
      vertices.push(parseFloat(line[0]));
      vertices.push(parseFloat(line[1]));
      vertices.push(parseFloat(line[2]));
    }
    
    for (i = vertex_count + 2; i < vertex_count + face_count + 2; i++) {
      line = data[i].replace(/^\s+/, "").replace(/\s+$/, "").split(/\s+/);
      face = [];
      face.push(parseInt(line[0], 10));
      face.push(parseInt(line[1], 10));
      face.push(parseInt(line[2], 10));

      Array.prototype.push.apply(current_shape.indices, face);
      current_shape.faces.push(face);
    }
    
    result.type = "polygon";
    result.vertices = vertices;
    result.colors = [0.8, 0.8, 0.8, 1.0];

    return result;
  }
})();

