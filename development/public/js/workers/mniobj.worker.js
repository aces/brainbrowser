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

var stack;
var result = {};

self.addEventListener("message", function(e) {
  var data = e.data;
  parse(data);
  self.postMessage(result);
});

function parse(data) {
  //replacing all new lines with spaces (obj files can be structure with or without them)
  //get all the fields as seperate strings.
  var string1 = data.replace(/\s+$/, '');
  var string2 = string1.replace(/^\s+/, '');
  
  //setting it to one here by default,
  //it will be set to two later if there are two hemispheres
  result.num_hemispheres = 1; 

  stack = string2.split(/\s+/).reverse();
  result.objectClass = stack.pop();
  if(result.objectClass === 'P') {
    parseSurfProp();
    result.numberVertices = parseInt(stack.pop());
    parsePositionArray();
    parseNormalArray();
    result.nitems = parseInt(stack.pop());
  } else if (result.objectClass === 'L') {
    parseSurfProp();
    result.numberVertices = parseInt(stack.pop());
    parsePositionArray();
    result.nitems = parseInt(stack.pop());
  } else { 
    result.objectClass = "__FAIL__"
    return;
  }
  parseColorArray();
  parseEndIndices();
  parseIndexArray();    

  //If there are two hemispheres, might need to be a better test one day
  if (result.objectClass == 'P' ) {
    if (result.positionArray.length ==  81924*3){
      result.brainSurface = true;
      split_hemispheres();
    }
    
  }

};

function parseSurfProp() {
  if (result.objectClass == 'P') {
    result.surfaceProperties = {
      ambient: parseFloat(stack.pop()),
      diffuse: parseFloat(stack.pop()),
      specular_reflectance: parseFloat(stack.pop()),
      specular_scattering: parseFloat(stack.pop()),
      transparency: parseFloat(stack.pop())
    };
  }else if (result.objectClass == 'L') {
    result.surfaceProperties = {
      width: stack.pop()
    };
  }
}

function parsePositionArray() {
  var positionArray = [];
  var numberVertices = result.numberVertices;
  var v, i;
  
  for (v = 0; v < numberVertices; v++) {
    for (i = 0; i < 3; i++) {
      positionArray.push(parseFloat(stack.pop()));
    }
  }
  
  result.positionArray = positionArray;
}


function parseNormalArray() {
  var normalArray = [];
  var numberVertices = result.numberVertices;
  var n, i;
  
  for (n = 0; n < numberVertices; n++){
    for (i = 0; i < 3; i++) {
      normalArray.push(parseFloat(stack.pop()));
    }
  }
  
  result.normalArray = normalArray;
}

function parseColorArray() {
  var colorArray = [];
  var colorFlag = parseInt(stack.pop(), 10);
  var i, c, count;
  
  if (colorFlag === 0) {
    for (i = 0; i < 4; i++){
      colorArray.push(parseFloat(stack.pop()));
    }
  } else if (colorFlag === 1) {
    for (c = 0, count = result.numberPolygons; c < count; c++){
      for (i = 0; i<4; i++){
        colorArray.push(parseFloat(stack.pop()));
      }
    }
  } else if (colorFlag === 2) {
    for (c = 0, count = result.numberVertices; c < count; c++){
      for (i = 0; i < 4; i++){
        colorArray.push(parseFloat(stack.pop()));
      }
    }
  } else {
    throw new Error("colorFlag not valid in that file");
  }
  
  result.colorFlag = colorFlag;
  result.colorArray = colorArray;
}

function parseEndIndices() {
  var nitems = result.nitems;
  var endIndicesArray = result.endIndicesArray;
  var endIndicesArray = [];
  var p, count;   
  
  for(p = 0, count = result.nitems; p < count; p++){
    endIndicesArray.push(parseInt(stack.pop(), 10));
  }
  
  result.endIndicesArray = endIndicesArray;
}

function parseIndexArray() {
  var numberIndex = stack.length;
  var indexArray = [];
  var index;
  var i, count;
  
  for (i = 0, count = stack.length; i < numberIndex; i++) {
    index = parseInt(stack.pop(), 10);
    indexArray.push(index);
  }
  result.indexArray = indexArray;
}

/*
 * Splits the model into two hemispheres
 * Making it easier to move the parts around (rotate the hemispheres 90 degrees,...)
 *
 */
function split_hemispheres() {
  var left = {};
  var right = {};
  var right_index_array;
  var adjusted_num_indices;
  var num_vertices, num_indices, num_normals, num_colors;
  var i, count;

  num_vertices = result.positionArray.length;
  left.positionArray = result.positionArray.slice(0, num_vertices/2);     
  right.positionArray = result.positionArray.slice(num_vertices/2, num_vertices);

  num_indices = result.indexArray.length;
  left.indexArray = result.indexArray.slice(0, num_indices/2);
  right.indexArray = result.indexArray.slice(num_indices/2, num_indices);

  right_index_array = right.indexArray;
  adjusted_num_indices = num_indices/3/2/2;
  
  for (i = 0, count = right_index_array.length; i < count; i++) {
    right_index_array[i] = right_index_array[i] - 2 - adjusted_num_indices;
  }
  
  num_normals = result.normalArray.length;
  left.normalArray = result.normalArray.slice(0, num_normals/2);
  right.normalArray = result.normalArray.slice(num_normals/2, num_normals);


  left.colorFlag = result.colorFlag;
  right.colorFlag = result.colorFlag;


  if(result.colorFlag === 0 || result.colorFlag === 1) {
    left.colorArray = result.colorArray;
    right.colorArray = result.colorArray;
  }else {
    num_colors = result.colorArray.length;
    left.colorArray = result.colorArray.slice(0, num_colors/2);
    right.colorArray = result.colorArray.slice(num_colors/2+1, -1);
  };

  left.numberVertices = result.numberVertices/2;
  right.numberVertices = result.numberVertices/2;
  
  left.numberPolygons = result.numberPolygons/2;
  right.numberPolygons = result.numberPolygons/2;

  result.num_hemispheres = 2;

  result.left = left;
  result.right = right;

};
