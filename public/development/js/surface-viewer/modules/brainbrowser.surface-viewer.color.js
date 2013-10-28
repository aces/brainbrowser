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


// Module for updating colours on models currently being displayed.
BrainBrowser.SurfaceViewer.core.color = function(viewer) {
  "use strict";
  
  var SurfaceViewer = BrainBrowser.SurfaceViewer;

  ///////////////////////////
  // PRIVATE DATA
  ///////////////////////////
  
  var colorManager = SurfaceViewer.colorManager();

  ///////////////////////////
  // INTERFACE
  ///////////////////////////

  // This updates the colors of the model. Will delegate to color_hemispheres() or color_model()
  // depending on the type of model.
  viewer.updateColors = function(data, options) {
    options = options || {};
    var min = options.min;
    var max = options.max;
    var spectrum = options.spectrum;
    var flip = options.flip;
    var clamped = options.clamped;
    var blend = options.blend;
    var afterUpdate = options.afterUpdate;

    function applyColorArray(color_array) {
      var shapes;
      if(viewer.model_data.num_hemispheres === 2) {
        color_hemispheres(color_array);
      } else {
        if (data.apply_to_shape) {
          shapes = [viewer.model.getChildByName(data.apply_to_shape, true)];
        } else {
          shapes = viewer.model.children;
        }
        color_model(color_array, shapes);
      }

      if (viewer.afterUpdateColors) {
        viewer.afterUpdateColors(data, min, max, spectrum);
      }

      if (afterUpdate) {
        afterUpdate();
      }
    }

    viewer.clamped = clamped;
    if (blend) {
      applyColorArray(colorManager.blendColorMap(spectrum, data, 0, 1));
    } else {
      data.createColorArray(min, max, spectrum, flip, clamped, viewer.model_data.colorArray, viewer.model_data, applyColorArray);
    }
  };

  ///////////////////////////
  // PRIVATE FUNCTIONS
  ///////////////////////////

  //Coloring for brain models with two separate hemispheres.
  function color_hemispheres(color_array) {
    var model = viewer.model;
    var color_array_length = color_array.length;
    var left_color_array;
    var right_color_array;
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
  
  //Coloring for regular models.
  function color_model(color_array, shapes) {
    var color_index;
    var face, faces;
    var vertexColors;
    var i, j;
    var count1, count2;

    for (i = 0, count1 = shapes.length; i < count1; i++) {
      faces = shapes[i].geometry.faces;
      for (j = 0, count2 = faces.length; j < count2; j++) {
        face = faces[j];
        vertexColors = face.vertexColors;
        
        color_index = face.a * 4;
        vertexColors[0].setRGB(color_array[color_index], color_array[color_index+1], color_array[color_index+2]);
        color_index = face.b * 4;
        vertexColors[1].setRGB(color_array[color_index], color_array[color_index+1], color_array[color_index+2]);
        color_index = face.c * 4;
        vertexColors[2].setRGB(color_array[color_index], color_array[color_index+1], color_array[color_index+2]);

        if (face.d) {
          color_index = face.d * 4;
          vertexColors[3].setRGB(color_array[color_index], color_array[color_index+1], color_array[color_index+2]);
        }
      }
      shapes[i].geometry.colorsNeedUpdate = true;
    }
  }

};

