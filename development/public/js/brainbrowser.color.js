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

BrainBrowser.modules.color = function(bb) {

   var colorManager = new ColorManager();
  
  /*
   * This updates the colors of the brain model
   */
  bb.updateColors = function(data, min, max, spectrum, flip, clamped, blend, shape, opts) {
    var options = opts || {};
    var afterUpdate = options.afterUpdate;
    var color_array;
    

    bb.clamped = clamped;
    if (blend) {
      color_array = colorManager.blendColorMap(spectrum, data, 0, 1);
    } else {
      color_array = data.createColorArray(min, max, spectrum, flip, clamped, bb.model_data.colorArray, bb.model_data);      
    }

    if(bb.model_data.num_hemispheres === 2) {
      color_hemispheres(color_array);
    } else {
      color_model(color_array);
    }

    if (afterUpdate) {
      afterUpdate();
    }

    if (bb.afterUpdateColors != null ) {
      bb.afterUpdateColors(data, min, max, spectrum);
    }
  };

  function color_hemispheres(color_array) {
    var model = bb.model;
    var color_array_length = color_array.length;
    var left_color_array;
    var right_color_array;
    var left_color_buffer = [];
    var right_color_buffer = [];
    var left_hem = model.getChildByName("left");
    var left_hem_faces = left_hem.geometry.faces;
    var right_hem = model.getChildByName("right");
    var right_hem_faces = right_hem.geometry.faces;
    var right_hem_faces_length = right_hem_faces.length;
    var left_hem_faces_length = left_hem_faces.length;
    var face;
    var i, count;
    var color_index;
    var vertexColors;
    
    left_color_array = color_array.slice(0, color_array_length/2);
    right_color_array = color_array.slice(color_array_length/2, color_array_length);
    
    count = Math.max(left_hem_faces_length, right_hem_faces_length);
    for (i = 0; i < count; i++) {
      if (i < left_hem_faces_length) {
        face = left_hem_faces[i];
        vertexColors = face.vertexColors;
        color_index = face.a * 4;
        
        vertexColors[0].setRGB(left_color_array[color_index], left_color_array[color_index+1], left_color_array[color_index+2]);
        color_index = face.b * 4;
        vertexColors[1].setRGB(left_color_array[color_index], left_color_array[color_index+1], left_color_array[color_index+2]);
        color_index = face.c * 4;
        vertexColors[2].setRGB(left_color_array[color_index], left_color_array[color_index+1], left_color_array[color_index+2]);
        if (face.d) {
          color_index = face.d * 4;
          vertexColors[3].setRGB(left_color_array[color_index], left_color_array[color_index+1], left_color_array[color_index+2]);
        }
      }
      if (i < right_hem_faces_length) {
        face = right_hem_faces[i];
        vertexColors = face.vertexColors;
        color_index = face.a * 4;
        
        vertexColors[0].setRGB(right_color_array[color_index], right_color_array[color_index+1], right_color_array[color_index+2]);
        color_index = face.b * 4;
        vertexColors[1].setRGB(right_color_array[color_index], right_color_array[color_index+1], right_color_array[color_index+2]);
        color_index = face.c * 4;
        vertexColors[2].setRGB(right_color_array[color_index], right_color_array[color_index+1], right_color_array[color_index+2]);
        if (face.d) {
          color_index = face.d * 4;
          vertexColors[3].setRGB(right_color_array[color_index], right_color_array[color_index+1], right_color_array[color_index+2]);
        }
      }  
    }

    left_hem.geometry.colorsNeedUpdate = true;
    right_hem.geometry.colorsNeedUpdate = true;
    
  }
  
  function color_model(color_array) {
    var model = bb.model;
    var color_array_length = color_array.length;
    var color_buffer = [];    
    var color_index;
    var col;
    var face, faces;
    var children;
    var vertexColors;
    var i, j;
    var count;
    
    children = model.children;
    for (i = 0, count = children.length; i < count; i++) {
      faces = children[i].geometry.faces;
      for (j = 0, count = faces.length; j < count; j++) {
        face = faces[j];
        vertexColors = face.vertexColors;
        
        color_index = face.a * 4;
        vertexColors[0].setRGB(color_array[color_index], color_array[color_index+1], color_array[color_index+2]);
        color_index = face.b * 4;
        vertexColors[0].setRGB(color_array[color_index], color_array[color_index+1], color_array[color_index+2]);
        color_index = face.c * 4;
        vertexColors[0].setRGB(color_array[color_index], color_array[color_index+1], color_array[color_index+2]);

        if (face.d) {
          color_index = face.d * 4;
          vertexColors[0].setRGB(color_array[color_index], color_array[color_index+1], color_array[color_index+2]);
        }
      }
      children[i].geometry.colorsNeedUpdate = true;
    }
  }
};

