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
* @author: Tarek Sherif
* @author: Nicolas Kassis
*/

// Module for updating colours on models currently being displayed.
BrainBrowser.SurfaceViewer.modules.color = function(viewer) {
  "use strict";
  
  ///////////////////////////
  // INTERFACE
  ///////////////////////////
  /**
  * @doc function
  * @name viewer.color:updateColors
  * @param {object} data Data object.
  * @param {object} options Options for the color update, which include the following: 
  * 
  * * **blend** Are the colors being blended with already loaded values?
  * * **complete** Callback function to call when the color update is done.
  * 
  * @description
  * Update the vertex colors of the model based on data object passed as argument.
  */
  var timeout = null;
  
  viewer.updateColors = function(data, options) {
    options = options || {};
    var blend = options.blend;
    var complete = options.complete;

    var min = data.range_min;
    var max = data.range_max;
    var flip = viewer.getAttribute("flip_colors");
    var clamped = viewer.getAttribute("clamp_colors");
    var color_map = viewer.color_map;

    function applyColorArray(color_array) {
      var shapes;
      
      if (data.apply_to_shape) {
        shapes = [viewer.model.getObjectByName(data.apply_to_shape, true)];
      } else {
        shapes = viewer.model.children;
      }
      colorModel(color_array, shapes);

      viewer.triggerEvent("updatecolors", data, min, max, color_map);


      if (complete) {
        complete();
      }

    }

    // Color updates will be asynchronous because they take a while.
    // New requests for color updates will replace old ones.
    clearTimeout(timeout);

    timeout = setTimeout(function() {
      if (blend) {
        applyColorArray(blendColorMap(color_map, data, 0, 1));
      } else {
        data.createColorArray(min, max, color_map, flip, clamped, viewer.model_data.colors, viewer.model_data, applyColorArray);
      }
    }, 0);
  };

  /** 
   * @doc function
   * @name viewer.color:setIntensityRange
   * @param {number} min Minimum value of the range.
   * @param {number} max Maximum value of the range.
   * @param {boolean} clamped Should values be clampled to the min/max range?
   * @param {object} options Options for the range change, which include the following: 
   * 
   * * **complete** Callback function to call when the color update is done.
   * @description
   * Update the range of colors being applied to the current model.
   */
  viewer.setIntensityRange = function(min, max, options) {
    options = options || {};
    var data = viewer.model_data.intensity_data;
    
    data.range_min = min;
    data.range_max = max;

    viewer.updateColors(data, {
      complete: options.complete
    });

    viewer.triggerEvent("rangechange", data);
  };

  /**
  * @doc function
  * @name viewer.color:blend
  * @param {number} blend Blend ratio between two loaded color maps (between 0 and 1);
  *
  * @description 
  * Blend two loaded color maps using the supplied ratio.
  */
  viewer.blend = function(value) {
    var blendData = viewer.blendData;
    var blendDataLength = blendData.length;
    var i;
    
    blendData[0].alpha = value;
    blendData[1].alpha = 1.0 - value;
    for(i = 2; i < blendDataLength; i++) {
      blendData[i].alpha = 0.0;
    }

    viewer.updateColors(blendData, {
      blend: true
    });
  };

  ///////////////////////////
  // PRIVATE FUNCTIONS
  ///////////////////////////
  
  function colorModel(color_array, shapes) {
    var geometry, shape, indices;
    var color_attribute, colors;
    var i, j, count, shape_count;
    var wireframe;
    var wireframe_color;
    var ic, iwc;

    var has_wireframe;

    for (j = 0, shape_count = shapes.length; j < shape_count; j++) {
      shape = shapes[j];
      wireframe = shape.getObjectByName("__wireframe__");

      has_wireframe = !!wireframe;

      if (has_wireframe) {
        wireframe_color = wireframe.geometry.attributes.color.array;
      }

      geometry = shape.geometry;
      indices = shape.geometry.original_data.indices;
      color_attribute = geometry.attributes.color;
      colors = color_attribute.array;
      
      // This looks a little messy but it's just going from an indexed color map
      // to an unindexed geometry.
      // And it's skipping the alphas (every 4th element).
      for (i = 0, count = indices.length; i < count; i += 3) {
        ic = i * 4;
        iwc = ic * 2;

        colors[ic]    = color_array[indices[i]*4];
        colors[ic+1]  = color_array[indices[i]*4+1];
        colors[ic+2]  = color_array[indices[i]*4+2];
        colors[ic+3]  = 1.0;
        colors[ic+4]  = color_array[indices[i+1]*4];
        colors[ic+5]  = color_array[indices[i+1]*4+1];
        colors[ic+6]  = color_array[indices[i+1]*4+2];
        colors[ic+7]  = 1.0;
        colors[ic+8]  = color_array[indices[i+2]*4];
        colors[ic+9]  = color_array[indices[i+2]*4+1];
        colors[ic+10] = color_array[indices[i+2]*4+2];
        colors[ic+11]  = 1.0;

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

  function blendColors(color_arrays) {
    var final_color = color_arrays[0];
    var i, j, count1, count2;
    var old_alpha, new_alpha;
    
    for (i = 0, count1 = color_arrays[0].length/4; i < count1; i++){
      for (j = 1, count2 = color_arrays.length;  j < count2; j++) {
        old_alpha = final_color[i*4+3];
        new_alpha = color_arrays[j][i*4+3];
        final_color[i*4]   = final_color[i*4] * old_alpha+color_arrays[j][i*4] * new_alpha;
        final_color[i*4+1] = final_color[i*4+1] * old_alpha+color_arrays[j][i*4+1] * new_alpha;
        final_color[i*4+2] = final_color[i*4+2] * old_alpha+color_arrays[j][i*4+2] * new_alpha;
        final_color[i*4+3] = old_alpha + new_alpha;
      }
    }
    return final_color;
    
  }


  /**
  * Blends two or more arrays of values into one color array
  */
  function blendColorMap(color_map, value_arrays) {
    var count = value_arrays.length;
    var color_arrays = new Array(count);
    var i;
    var value_array;
    
    for(i = 0; i < count; i++){
      value_array = value_arrays[i];
      color_arrays[i] = color_map.mapColors(value_array.values, {
        min: value_array.range_min,
        max: value_array.range_max,
        alpha: value_array.alpha
      });
    }
    
    return blendColors(color_arrays);
  }

};

