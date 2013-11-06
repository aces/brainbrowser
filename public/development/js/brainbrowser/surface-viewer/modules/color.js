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
          shapes = [viewer.model.getObjectByName(data.apply_to_shape, true)];
        } else {
          shapes = viewer.model.children;
        }
        color_model(color_array, shapes);
      }

      viewer.triggerEvent("updatecolors", data, min, max, spectrum);


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

  /*
   * Called when the range of colors is changed in the interface
   * Clamped signifies that the range should be clamped and values above or bellow the
   * thresholds should have the color of the maximum/mimimum.
   */
  viewer.rangeChange = function(min, max, clamped, options) {
    options = options || {};
    var afterChange = options.afterChange;
    var data = viewer.model_data.data;
    
    data.rangeMin = min;
    data.rangeMax = max;
    viewer.updateColors(data, {
      min: data.rangeMin,
      max: data.rangeMax,
      spectrum: viewer.spectrum,
      flip: viewer.flip,
      clamped: clamped,
      afterUpdate: options.afterUpdate
    });

    if (afterChange) {
      afterChange();
    }

    viewer.triggerEvent("rangechange", min, max);
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
    var left_hem = model.getObjectByName("left");
    var right_hem = model.getObjectByName("right");
    var i, count;

    left_color_array = color_array.slice(0, color_array_length/2);
    right_color_array = color_array.slice(color_array_length/2);

    var left_indices = left_hem.geometry.original_data.indices;
    var right_indices = right_hem.geometry.original_data.indices;

    var left_color_attribute = left_hem.geometry.attributes.color;
    var left_color_attribute_array = left_color_attribute.array;
    var right_color_attribute = right_hem.geometry.attributes.color;
    var right_color_attribute_array = right_color_attribute.array;
     
    for (i = 0, count = left_indices.length; i < count; i++) {
      left_color_attribute_array[i*4] = left_color_array[left_indices[i]*4];
      left_color_attribute_array[i*4+1] = left_color_array[left_indices[i]*4+1];
      left_color_attribute_array[i*4+2] = left_color_array[left_indices[i]*4+2];
      right_color_attribute_array[i*4] = right_color_array[right_indices[i]*4];
      right_color_attribute_array[i*4+1] = right_color_array[right_indices[i]*4+1];
      right_color_attribute_array[i*4+2] = right_color_array[right_indices[i]*4+2];
    }

    left_color_attribute.needsUpdate = true;
    right_color_attribute.needsUpdate = true;
    
  }
  
  //Coloring for regular models.
  function color_model(color_array, shapes) {
    var geometry, shape, indices;
    var color_attribute, colors;
    var i, count;

    for (i = 0, count = shapes.length; i < count; i++) {
      shape = shapes[i];
      geometry = shape.geometry;
      indices = shape.geometry.original_data.indices;
      color_attribute = geometry.attributes.color;
      colors = color_attribute.array;
      for (i = 0, count = indices.length; i < count; i++) {
        colors[i*4] = color_array[indices[i]*4];
        colors[i*4+1] = color_array[indices[i]*4+1];
        colors[i*4+2] = color_array[indices[i]*4+2];
      }

      color_attribute.needsUpdate = true;
    }

  }

};

