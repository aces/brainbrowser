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

/*
 * This file defines MNIObj object.
 * Given a url, the constructor will fetch the file specified which should be an
 * MNI .obj file. It will then pars this file and return an object with the properties
 * needed to display the file.
 *
 */
function MNIObject(string) {

  var stack;

  var that = this;

  function parse(string) {
    //replacing all new lines with spaces (obj files can be structure with or without them)
    //get all the fields as seperate strings.
    var string1 = string.replace(/\s+$/, '');
    var string2 = string1.replace(/^\s+/, '');
    
    //setting it to one here by default,
    //it will be set to two later if there are two hemispheres
    that.num_hemispheres = 1; 
  
    stack = string2.split(/\s+/).reverse();
    that.objectClass = stack.pop();
    if( that.objectClass === 'P') {
      parseSurfProp();
      that.numberVertices = parseInt(stack.pop());
      parsePositionArray();
      parseNormalArray();
      that.nitems = parseInt(stack.pop());
    } else if (that.objectClass === 'L') {
      parseSurfProp();
      that.numberVertices = parseInt(stack.pop());
      parsePositionArray();
      that.nitems = parseInt(stack.pop());
    } else { 
      that.objectClass = "__FAIL__"
      return;
    }
    parseColorArray();
    parseEndIndices();
    parseIndexArray();    
 
    //If there is two hemispheres, might need to be a better test one day
    if (that.objectClass == 'P' ) {
      if (that.positionArray.length ==  81924*3){
	      that.brainSurface = true;
	      that.split_hemispheres();
      }
      
    }

  };

  function parseSurfProp() {
    if (that.objectClass == 'P') {
      that.surfaceProperties = {
	      ambient: parseFloat(stack.pop()),
	      diffuse: parseFloat(stack.pop()),
	      specular_reflectance: parseFloat(stack.pop()),
	      specular_scattering: parseFloat(stack.pop()),
	      transparency: parseFloat(stack.pop())
      };
    }else if (that.objectClass == 'L') {
      that.surfaceProperties = {
	      width: stack.pop()
      };
    }
  }

  function parsePositionArray() {
    var positionArray = [];
    var numberVertices = that.numberVertices;
    var v, i;
    
    for (v = 0; v < numberVertices; v++) {
      for (i = 0; i < 3; i++) {
	      positionArray.push(parseFloat(stack.pop()));
      }
    }
    
    that.positionArray = positionArray;
  }


  function parseNormalArray() {
    var normalArray = [];
    var numberVertices = that.numberVertices;
    var n, i;
    
    for (n = 0; n < numberVertices; n++){
      for (i = 0; i < 3; i++) {
        normalArray.push(parseFloat(stack.pop()));
      }
    }
    
    that.normalArray = normalArray;
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
      for (c = 0, count = that.numberPolygons; c < count; c++){
	      for (i = 0; i<4; i++){
	        colorArray.push(parseFloat(stack.pop()));
	      }
      }
    } else if (colorFlag === 2) {
      for (c = 0, count = that.numberVertices; c < count; c++){
	      for (i = 0; i < 4; i++){
	        colorArray.push(parseFloat(stack.pop()));
	      }
      }
    } else {
      throw new Error("colorFlag not valid in that file");
    }
    
    that.colorFlag = colorFlag;
    that.colorArray = colorArray;
  }

  function parseEndIndices() {
    var nitems = that.nitems;
    var endIndicesArray = that.endIndicesArray;
    var endIndicesArray = [];
    var p, count;   
    
    for(p = 0, count = that.nitems; p < count; p++){
      endIndicesArray.push(parseInt(stack.pop(), 10));
    }
    
    that.endIndicesArray = endIndicesArray;
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
    that.indexArray = indexArray;
  }

  /*
   * Splits the model into two hemispheres
   * Making it easier to move the parts around (rotate the hemispheres 90 degrees,...)
   *
   */
  that.split_hemispheres = function() {
    var left = {};
    var right = {};
    var right_index_array;
    var adjusted_num_indices;
    var num_vertices, num_indices, num_normals, num_colors;
    var i, count;

    num_vertices = that.positionArray.length;
    left.positionArray = that.positionArray.slice(0, num_vertices/2);			
    right.positionArray = that.positionArray.slice(num_vertices/2, num_vertices);

    num_indices = that.indexArray.length;
    left.indexArray = that.indexArray.slice(0, num_indices/2);
    right.indexArray = that.indexArray.slice(num_indices/2, num_indices);

    right_index_array = right.indexArray;
    adjusted_num_indices = num_indices/3/2/2;
    
    for (i = 0, count = right_index_array.length; i < count; i++) {
      right_index_array[i] = right_index_array[i] - 2 - adjusted_num_indices;
    }
    
    num_normals = that.normalArray.length;
    left.normalArray = that.normalArray.slice(0, num_normals/2);
    right.normalArray = that.normalArray.slice(num_normals/2, num_normals);


    left.colorFlag = that.colorFlag;
    right.colorFlag = that.colorFlag;


    if(that.colorFlag === 0 || that.colorFlag === 1) {
      left.colorArray = that.colorArray;
      right.colorArray = that.colorArray;
    }else {
      num_colors = that.colorArray.length;
      left.colorArray = that.colorArray.slice(0, num_colors/2);
      right.colorArray = that.colorArray.slice(num_colors/2+1, -1);
    };

    left.numberVertices = that.numberVertices/2;
    right.numberVertices = that.numberVertices/2;
    
    left.numberPolygons = that.numberPolygons/2;
    right.numberPolygons = that.numberPolygons/2;

    that.num_hemispheres = 2;

    that.left = left;
    that.right = right;

  };


  that.getVertexInfo = function(vertex) {
    var position_vector = [
      that.positionArray[vertex*3],
      that.positionArray[vertex*3+1],
      that.positionArray[vertex*3+2]
    ];
    return { vertex: vertex, position_vector: position_vector};
  };
 
  if(string){
    parse(string);
  };
};