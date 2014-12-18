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

  var stack;
  var stack_index;
  
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

    var transfer = [
      data.vertices.buffer,
      data.colors.buffer
    ];

    if (data.normals) {
      transfer.push(data.normals.buffer);
    }

    if (data.split) {
      data.shapes = [
        { indices: result.left.indices },
        { indices: result.right.indices }
      ];

      transfer.push(
        result.left.indices.buffer,
        result.right.indices.buffer
      );
    } else {
      data.shapes = [
        { indices: result.indices }
      ];
      transfer.push(
        result.indices.buffer
      );
    }

    self.postMessage(data, transfer);
  });
  
  function parse(data, options) {
    stack = data.trim().split(/\s+/).reverse();
    stack_index = stack.length - 1;
    
    var split_hemispheres = options.split;
    var result = {};
    var object_class = popStack();
    var i, j, start, end, nitems;
    var indices, end_indices;
    var line_indices;
    var line_index_size, line_index_counter;

    // By default models are not split
    // (this option allows us to split hemispheres
    // into two separate models.)
    result.split = false;
  
    result.type = object_class === "P" ? "polygon" :
                  object_class === "L" ? "line" :
                  object_class;

    if(result.type === "polygon") {
      parseSurfProp(result);
      result.num_vertices = parseInt(popStack(), 10);
      parseVertices(result);
      parseNormals(result);
      result.nitems = parseInt(popStack(), 10);
    } else if (result.type === "line") {
      parseSurfProp(result);
      result.num_vertices = parseInt(popStack(), 10);
      parseVertices(result);
      result.nitems = parseInt(popStack(), 10);
    } else {
      result.error = true;
      result.error_message = 'Invalid MNI Object class: must be "polygon" or "line"';
      return;
    }

    parseColors(result);
    parseEndIndices(result);
    parseIndices(result);
  
    if (result.type === "polygon" ) {
      if (split_hemispheres){
        result.split = true;
        splitHemispheres(result);
      }
    } else if (result.type === "line") {
      line_indices = [];
      indices = result.indices;
      end_indices = result.end_indices;
      nitems = result.nitems;
      line_index_size = line_index_counter = 0;

      for (i = 0; i < nitems; i++){
        
        if (i === 0){
          start = 0;
        } else {
          start = end_indices[i - 1];
        }
        
        end = end_indices[i];

        line_index_size += (end - start - 1) * 2;
      }

      line_indices = new Uint32Array(line_index_size);

      for (i = 0; i < nitems; i++){
        
        if (i === 0){
          start = 0;
        } else {
          start = end_indices[i - 1];
        }
        
        line_indices[line_index_counter++] = indices[start];
        end = end_indices[i];
        
        for (j = start + 1; j < end - 1; j++) {
          line_indices[line_index_counter++] = indices[j];
          line_indices[line_index_counter++] = indices[j];
        }
        
        line_indices[line_index_counter++] = indices[end - 1];
      }
      
      result.indices = line_indices;
    }
  
    return result;
  }
  
  function parseSurfProp(result) {
    if (result.type === "polygon") {
      result.surface_properties = {
        ambient: parseFloat(popStack()),
        diffuse: parseFloat(popStack()),
        specular_reflectance: parseFloat(popStack()),
        specular_scattering: parseFloat(popStack()),
        transparency: parseFloat(popStack())
      };
    }else if (result.type === "line") {
      result.surfaceProperties = {
        width: popStack()
      };
    }
  }
  
  function parseVertices(result) {
    var count = result.num_vertices * 3;
    var vertices = new Float32Array(count);
    var i;
    
    for (i = 0; i < count; i++) {
      vertices[i] = parseFloat(popStack());
    }
    
    result.vertices = vertices;
  }
  
  
  function parseNormals(result) {
    var count = result.num_vertices * 3;
    var normals = new Float32Array(count);
    var i;
    
    for (i = 0; i < count; i++) {
      normals[i] = parseFloat(popStack());
    }
    
    result.normals = normals;
  }
  
  function parseColors(result) {
    var color_flag = parseInt(popStack(), 10);
    var colors;

    var i, count;
    
    if (color_flag === 0) {
      colors = new Float32Array(4);
      for (i = 0; i < 4; i++){
        colors[i] = parseFloat(popStack());
      }
    } else if (color_flag === 1) {
      count = result.num_polygons * 4;
      colors = new Float32Array(count);
      for (i = 0; i < count; i++){
        colors[i] = parseFloat(popStack());
      }
    } else if (color_flag === 2) {
      count = result.num_vertices * 4;
      colors = new Float32Array(count);
      for (i = 0; i < count; i++){
        colors[i] = parseFloat(popStack());
      }
    } else {
      result.error = true;
      result.error_message = "Invalid color flag: " + color_flag;
    }
    
    result.color_flag = color_flag;
    result.colors = colors;
  }
  
  function parseEndIndices(result) {
    var count = result.nitems;
    var end_indices = new Uint32Array(count);
    var i;
    
    for(i = 0; i < count; i++){
      end_indices[i] = parseInt(popStack(), 10);
    }
    
    result.end_indices = end_indices;
  }
  
  function parseIndices(result) {
    var count = stack_index + 1;
    var indices = new Uint32Array(count);
    var i;
    
    for (i = 0; i < count; i++) {
      indices[i] = parseInt(popStack(), 10);
    }

    result.indices = indices;
  }
  
  function splitHemispheres(result) {
    var num_indices = result.indices.length;

    result.left = {
      indices: new Uint32Array(Array.prototype.slice.call(result.indices, 0, num_indices / 2))
    };

    result.right = {
      indices: new Uint32Array(Array.prototype.slice.call(result.indices, num_indices / 2))
    };
  }

  function popStack() {
    return stack[stack_index--];
  }

})();


