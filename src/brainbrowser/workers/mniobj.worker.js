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
    var input = e.data;

    var result = parse(input.data, input.options) || {
      error: true,
      error_message: "Error parsing data."
    };

    var data = {
      type: result.type,
      vertices: result.vertices,
      normals: result.normals,
      colors: result.colors,
      surface_properties: result.surface_properties,
      split: result.split,
      error: result.error,
      error_message: result.error_message
    };

    if (data.split) {
      data.shapes = [
        { indices: result.left.indices },
        { indices: result.right.indices }
      ];
    } else {
      data.shapes = [
        { indices: result.indices }
      ];
    }

    self.postMessage(data);
  });
  
  function parse(data, options) {
    var string = data.replace(/\s+$/, '').replace(/^\s+/, '');
    var i, j, start, end, nitems;
    var indices, end_indices;
    var line_indices = [];
    var split_hemispheres = options.split;
    var result = {};
    var stack = string.split(/\s+/).reverse();
    var object_class = stack.pop();

    // By default models are not split
    // (this option allows us to split hemispheres
    // into two separate models.)
    result.split = false;
  
    result.type = object_class === "P" ? "polygon" :
                  object_class === "L" ? "line" :
                  object_class;

    if(result.type === "polygon") {
      parseSurfProp(result, stack);
      result.num_vertices = parseInt(stack.pop(), 10);
      parseVertices(result, stack);
      parseNormals(result, stack);
      result.nitems = parseInt(stack.pop(), 10);
    } else if (result.type === "line") {
      parseSurfProp(result, stack);
      result.num_vertices = parseInt(stack.pop(), 10);
      parseVertices(result, stack);
      result.nitems = parseInt(stack.pop(), 10);
    } else {
      result.error = true;
      result.error_message = 'Invalid MNI Object class: must be "polygon" or "line"';
      return;
    }
    parseColors(result, stack);
    parseEndIndices(result, stack);
    parseIndices(result, stack);
  
    if (result.type === "polygon" ) {
      if (split_hemispheres){
        result.split = true;
        splitHemispheres(result, stack);
      }
    } else if (result.type === "line") {
      indices = result.indices;
      end_indices = result.end_indices;
      nitems = result.nitems;
      for (i = 0; i < nitems; i++){
        if (i === 0){
          start = 0;
        } else {
          start = end_indices[i-1];
        }
        line_indices.push(indices[start]);
        end = end_indices[i];
        for (j = start + 1; j < end - 1; j++) {
          line_indices.push(indices[j]);
          line_indices.push(indices[j]);
        }
        line_indices.push(indices[end-1]);
      }

      result.indices = line_indices;
    }
  
    return result;
  }
  
  function parseSurfProp(result, stack) {
    if (result.type === "polygon") {
      result.surface_properties = {
        ambient: parseFloat(stack.pop()),
        diffuse: parseFloat(stack.pop()),
        specular_reflectance: parseFloat(stack.pop()),
        specular_scattering: parseFloat(stack.pop()),
        transparency: parseFloat(stack.pop())
      };
    }else if (result.type === "line") {
      result.surfaceProperties = {
        width: stack.pop()
      };
    }
  }
  
  function parseVertices(result, stack) {
    var vertices = [];
    var num_vertices = result.num_vertices;
    var v, i;
    
    for (v = 0; v < num_vertices; v++) {
      for (i = 0; i < 3; i++) {
        vertices.push(parseFloat(stack.pop()));
      }
    }
    
    result.vertices = vertices;
  }
  
  
  function parseNormals(result, stack) {
    var normals = [];
    var num_vertices = result.num_vertices;
    var n, i;
    
    for (n = 0; n < num_vertices; n++){
      for (i = 0; i < 3; i++) {
        normals.push(parseFloat(stack.pop()));
      }
    }
    
    result.normals = normals;
  }
  
  function parseColors(result, stack) {
    var colors = [];
    var color_flag = parseInt(stack.pop(), 10);
    var i, c, count;
    
    if (color_flag === 0) {
      for (i = 0; i < 4; i++){
        colors.push(parseFloat(stack.pop()));
      }
    } else if (color_flag === 1) {
      for (c = 0, count = result.num_polygons; c < count; c++){
        for (i = 0; i < 4; i++){
          colors.push(parseFloat(stack.pop()));
        }
      }
    } else if (color_flag === 2) {
      for (c = 0, count = result.num_vertices; c < count; c++){
        for (i = 0; i < 4; i++){
          colors.push(parseFloat(stack.pop()));
        }
      }
    } else {
      throw new Error("color_flag not valid in that file");
    }
    
    result.color_flag = color_flag;
    result.colors = colors;
  }
  
  function parseEndIndices(result, stack) {
    var end_indices = [];
    var p, count;
    
    for(p = 0, count = result.nitems; p < count; p++){
      end_indices.push(parseInt(stack.pop(), 10));
    }
    
    result.end_indices = end_indices;
  }
  
  function parseIndices(result, stack) {
    var numberIndex = stack.length;
    var indices = [];
    var index;
    var i, count;
    
    for (i = 0, count = stack.length; i < numberIndex; i++) {
      index = parseInt(stack.pop(), 10);
      indices.push(index);
    }
    result.indices = indices;
  }
  
  function splitHemispheres(result) {
    var num_indices = result.indices.length;

    result.left = {
      indices: result.indices.slice(0, num_indices / 2)
    };

    result.right = {
      indices: result.indices.slice(num_indices / 2)
    };
  }

})();


