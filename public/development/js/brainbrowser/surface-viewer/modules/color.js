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
    var complete = options.complete;


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


      if (complete) {
        complete();
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
    var data = viewer.model_data.data;
    
    data.rangeMin = min;
    data.rangeMax = max;
    viewer.updateColors(data, {
      min: data.rangeMin,
      max: data.rangeMax,
      spectrum: viewer.spectrum,
      flip: viewer.flip,
      clamped: clamped,
      complete: options.complete
    });

    viewer.triggerEvent("rangechange", data);
  };

  ///////////////////////////
  // PRIVATE FUNCTIONS
  ///////////////////////////

  //Coloring for brain models with two separate hemispheres.
  function color_hemispheres(color_array) {
    var model = viewer.model;
    var left_hem = model.getObjectByName("left");
    var right_hem = model.getObjectByName("right");
    var i, count;
    var ic, iwc;

    var left_indices = left_hem.geometry.original_data.indices;
    var right_indices = right_hem.geometry.original_data.indices;

    var left_color_attribute = left_hem.geometry.attributes.color;
    var left_color_attribute_array = left_color_attribute.array;
    var right_color_attribute = right_hem.geometry.attributes.color;
    var right_color_attribute_array = right_color_attribute.array;

    var left_wireframe = left_hem.getObjectByName("__wireframe__");
    var right_wireframe = right_hem.getObjectByName("__wireframe__");
    var left_wireframe_color;
    var right_wireframe_color;

    var has_wireframe = !!left_wireframe;

    if (has_wireframe) {
      left_wireframe_color = left_wireframe.geometry.attributes.color.array;
      right_wireframe_color = right_wireframe.geometry.attributes.color.array;
    }

    for (i = 0, count = left_indices.length; i < count; i += 3) {
      ic = i * 4;
      iwc = ic * 2;


      // This is a little messy but it's just going from an indexed color map
      // to an unindexed geometry.
      // And it's skipping the alphas (every 4th element).
      left_color_attribute_array[ic]    = color_array[left_indices[i]*4];
      left_color_attribute_array[ic+1]  = color_array[left_indices[i]*4+1];
      left_color_attribute_array[ic+2]  = color_array[left_indices[i]*4+2];
      left_color_attribute_array[ic+4]  = color_array[left_indices[i+1]*4];
      left_color_attribute_array[ic+5]  = color_array[left_indices[i+1]*4+1];
      left_color_attribute_array[ic+6]  = color_array[left_indices[i+1]*4+2];
      left_color_attribute_array[ic+8]  = color_array[left_indices[i+2]*4];
      left_color_attribute_array[ic+9]  = color_array[left_indices[i+2]*4+1];
      left_color_attribute_array[ic+10] = color_array[left_indices[i+2]*4+2];

      right_color_attribute_array[ic]    = color_array[right_indices[i]*4];
      right_color_attribute_array[ic+1]  = color_array[right_indices[i]*4+1];
      right_color_attribute_array[ic+2]  = color_array[right_indices[i]*4+2];
      right_color_attribute_array[ic+4]  = color_array[right_indices[i+1]*4];
      right_color_attribute_array[ic+5]  = color_array[right_indices[i+1]*4+1];
      right_color_attribute_array[ic+6]  = color_array[right_indices[i+1]*4+2];
      right_color_attribute_array[ic+8]  = color_array[right_indices[i+2]*4];
      right_color_attribute_array[ic+9]  = color_array[right_indices[i+2]*4+1];
      right_color_attribute_array[ic+10] = color_array[right_indices[i+2]*4+2];

      if (has_wireframe) {
        // v1 -v2
        left_wireframe_color[iwc] = left_color_attribute_array[ic];
        left_wireframe_color[iwc + 1] = left_color_attribute_array[ic + 1];
        left_wireframe_color[iwc + 2] = left_color_attribute_array[ic + 2];
        left_wireframe_color[iwc + 3] = left_color_attribute_array[ic + 3];
        left_wireframe_color[iwc + 4] = left_color_attribute_array[ic + 4];
        left_wireframe_color[iwc + 5] = left_color_attribute_array[ic + 5];
        left_wireframe_color[iwc + 6] = left_color_attribute_array[ic + 6];
        left_wireframe_color[iwc + 7] = left_color_attribute_array[ic + 7];

        // v2 - v3
        left_wireframe_color[iwc + 8] = left_color_attribute_array[ic + 4];
        left_wireframe_color[iwc + 9] = left_color_attribute_array[ic + 5];
        left_wireframe_color[iwc + 10] = left_color_attribute_array[ic + 6];
        left_wireframe_color[iwc + 11] = left_color_attribute_array[ic + 7];
        left_wireframe_color[iwc + 12] = left_color_attribute_array[ic + 8];
        left_wireframe_color[iwc + 13] = left_color_attribute_array[ic + 9];
        left_wireframe_color[iwc + 14] = left_color_attribute_array[ic + 10];
        left_wireframe_color[iwc + 15] = left_color_attribute_array[ic + 11];
        
        // v3 - v1
        left_wireframe_color[iwc + 16] = left_color_attribute_array[ic + 8];
        left_wireframe_color[iwc + 17] = left_color_attribute_array[ic + 9];
        left_wireframe_color[iwc + 18] = left_color_attribute_array[ic + 10];
        left_wireframe_color[iwc + 19] = left_color_attribute_array[ic + 11];
        left_wireframe_color[iwc + 20] = left_color_attribute_array[ic];
        left_wireframe_color[iwc + 21] = left_color_attribute_array[ic + 1];
        left_wireframe_color[iwc + 22] = left_color_attribute_array[ic + 2];
        left_wireframe_color[iwc + 23] = left_color_attribute_array[ic + 3];

        // v1 -v2
        right_wireframe_color[iwc]     = right_color_attribute_array[ic];
        right_wireframe_color[iwc + 1] = right_color_attribute_array[ic + 1];
        right_wireframe_color[iwc + 2] = right_color_attribute_array[ic + 2];
        right_wireframe_color[iwc + 3] = right_color_attribute_array[ic + 3];
        right_wireframe_color[iwc + 4] = right_color_attribute_array[ic + 4];
        right_wireframe_color[iwc + 5] = right_color_attribute_array[ic + 5];
        right_wireframe_color[iwc + 6] = right_color_attribute_array[ic + 6];
        right_wireframe_color[iwc + 7] = right_color_attribute_array[ic + 7];

        // v2 - v3
        right_wireframe_color[iwc + 8]  = right_color_attribute_array[ic + 4];
        right_wireframe_color[iwc + 9]  = right_color_attribute_array[ic + 5];
        right_wireframe_color[iwc + 10] = right_color_attribute_array[ic + 6];
        right_wireframe_color[iwc + 11] = right_color_attribute_array[ic + 7];
        right_wireframe_color[iwc + 12] = right_color_attribute_array[ic + 8];
        right_wireframe_color[iwc + 13] = right_color_attribute_array[ic + 9];
        right_wireframe_color[iwc + 14] = right_color_attribute_array[ic + 10];
        right_wireframe_color[iwc + 15] = right_color_attribute_array[ic + 11];
        
        // v3 - v1
        right_wireframe_color[iwc + 16] = right_color_attribute_array[ic + 8];
        right_wireframe_color[iwc + 17] = right_color_attribute_array[ic + 9];
        right_wireframe_color[iwc + 18] = right_color_attribute_array[ic + 10];
        right_wireframe_color[iwc + 19] = right_color_attribute_array[ic + 11];
        right_wireframe_color[iwc + 20] = right_color_attribute_array[ic];
        right_wireframe_color[iwc + 21] = right_color_attribute_array[ic + 1];
        right_wireframe_color[iwc + 22] = right_color_attribute_array[ic + 2];
        right_wireframe_color[iwc + 23] = right_color_attribute_array[ic + 3];
      }

    }

    left_color_attribute.needsUpdate = true;
    right_color_attribute.needsUpdate = true;
    if (has_wireframe) {
      left_wireframe.geometry.attributes.color.needsUpdate = true;
      right_wireframe.geometry.attributes.color.needsUpdate = true;
    }
  }
  
  //Coloring for regular models.
  function color_model(color_array, shapes) {
    var geometry, shape, indices;
    var color_attribute, colors;
    var i, count;
    var wireframe;
    var wireframe_color;
    var ic, iwc;

    var has_wireframe;

    for (i = 0, count = shapes.length; i < count; i++) {
      shape = shapes[i];
      wireframe = shape.getObjectByName("__wireframe__");

      has_wireframe = !!wireframe;

      if (has_wireframe) {
        wireframe_color = wireframe.geometry.attributes.color.array;
      }

      geometry = shape.geometry;
      indices = shape.geometry.original_data.indices;
      color_attribute = geometry.attributes.color;
      colors = color_attribute.array;
      for (i = 0, count = indices.length; i < count; i += 3) {
        ic = i * 4;
        iwc = ic * 2;

        colors[ic]    = color_array[indices[i]*4];
        colors[ic+1]  = color_array[indices[i]*4+1];
        colors[ic+2]  = color_array[indices[i]*4+2];
        colors[ic+4]  = color_array[indices[i+1]*4];
        colors[ic+5]  = color_array[indices[i+1]*4+1];
        colors[ic+6]  = color_array[indices[i+1]*4+2];
        colors[ic+8]  = color_array[indices[i+2]*4];
        colors[ic+9]  = color_array[indices[i+2]*4+1];
        colors[ic+10] = color_array[indices[i+2]*4+2];

        if (has_wireframe) {
          // v1 -v2
          wireframe_color[iwc] = colors[ic];
          wireframe_color[iwc + 1] = colors[ic + 1];
          wireframe_color[iwc + 2] = colors[ic + 2];
          wireframe_color[iwc + 3] = colors[ic + 3];
          wireframe_color[iwc + 4] = colors[ic + 4];
          wireframe_color[iwc + 5] = colors[ic + 5];
          wireframe_color[iwc + 6] = colors[ic + 6];
          wireframe_color[iwc + 7] = colors[ic + 7];

          // v2 - v3
          wireframe_color[iwc + 8] = colors[ic + 4];
          wireframe_color[iwc + 9] = colors[ic + 5];
          wireframe_color[iwc + 10] = colors[ic + 6];
          wireframe_color[iwc + 11] = colors[ic + 7];
          wireframe_color[iwc + 12] = colors[ic + 8];
          wireframe_color[iwc + 13] = colors[ic + 9];
          wireframe_color[iwc + 14] = colors[ic + 10];
          wireframe_color[iwc + 15] = colors[ic + 11];
          
          // v3 - v1
          wireframe_color[iwc + 16] = colors[ic + 8];
          wireframe_color[iwc + 17] = colors[ic + 9];
          wireframe_color[iwc + 18] = colors[ic + 10];
          wireframe_color[iwc + 19] = colors[ic + 11];
          wireframe_color[iwc + 20] = colors[ic];
          wireframe_color[iwc + 21] = colors[ic + 1];
          wireframe_color[iwc + 22] = colors[ic + 2];
          wireframe_color[iwc + 23] = colors[ic + 3];
        }
      }

      color_attribute.needsUpdate = true;

      if (has_wireframe) {
        wireframe.geometry.attributes.color.needsUpdate = true;
      }
    }

  }

};

