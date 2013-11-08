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
  
  var stack;
  var result = {};
  
  self.addEventListener("message", function(e) {
    parse(e.data);

    var data = {
      objectClass: result.objectClass,
      positionArray: result.positionArray,
      normalArray: result.normalArray,
      colorArray: result.colorArray,
      num_hemispheres: result.num_hemispheres
    };

    if (data.num_hemispheres === 2) {
      data.shapes = [
        { indexArray: result.left.indexArray },
        { indexArray: result.right.indexArray }
      ]
    } else {
      data.shapes = [
        { indexArray: result.indexArray }
      ]
    }

    self.postMessage(data);
  });
  
  function parse(data) {
    //replacing all new lines with spaces (obj files can be structure with or without them)
    //get all the fields as seperate strings.
    var string = data.replace(/\s+$/, '').replace(/^\s+/, '');
    var i, j, start, end, nitems;
    var indices = []
    var indexArray, endIndicesArray;

    //setting it to one here by default,
    //it will be set to two later if there are two hemispheres
    result.num_hemispheres = 1;
  
    stack = string.split(/\s+/).reverse();
    result.objectClass = stack.pop();
    if(result.objectClass === 'P') {
      parseSurfProp();
      result.numberVertices = parseInt(stack.pop(), 10);
      parsePositionArray();
      parseNormalArray();
      result.nitems = parseInt(stack.pop(), 10);
    } else if (result.objectClass === 'L') {
      parseSurfProp();
      result.numberVertices = parseInt(stack.pop(), 10);
      parsePositionArray();
      result.nitems = parseInt(stack.pop(), 10);
    } else {
      result.objectClass = "__FAIL__";
      return;
    }
    parseColorArray();
    parseEndIndices();
    parseIndexArray();
  
    //If there are two hemispheres, might need to be a better test one day
    if (result.objectClass === 'P' ) {
      if (result.positionArray.length ===  81924*3){
        result.brainSurface = true;
        split_hemispheres();
      } 
    } else if ( result.objectClass === "L") {
      indexArray = result.indexArray;
      endIndicesArray = result.endIndicesArray;
      nitems = result.nitems;
      for (i = 0; i < nitems; i++){
        if (i === 0){
          start = 0;
        } else {
          start = endIndicesArray[i-1];
        }
        indices.push(indexArray[start]);
        end = endIndicesArray[i];
        for (j = start + 1; j < end - 1; j++) {
          indices.push(indexArray[j]);
          indices.push(indexArray[j]);
        }
        indices.push(indexArray[end-1]);
      }

      result.indexArray = indices;
    }
  
  }
  
  function parseSurfProp() {
    if (result.objectClass === 'P') {
      result.surfaceProperties = {
        ambient: parseFloat(stack.pop()),
        diffuse: parseFloat(stack.pop()),
        specular_reflectance: parseFloat(stack.pop()),
        specular_scattering: parseFloat(stack.pop()),
        transparency: parseFloat(stack.pop())
      };
    }else if (result.objectClass === 'L') {
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
  
  function split_hemispheres() {
    var num_indices = result.indexArray.length;

    result.num_hemispheres = 2;

    result.left = {
      indexArray: result.indexArray.slice(0, num_indices/2)
    };

    result.right = {
      indexArray: result.indexArray.slice(num_indices/2)
    };
  }

})();


