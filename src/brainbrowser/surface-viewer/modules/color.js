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
* Author: Tarek Sherif <tsherif@gmail.com> (http://tareksherif.ca/)
* Author: Nicolas Kassis
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
  * ```js
  * viewer.updateColors(data, {
  *   blend: true
  * });
  * ```
  */
  var timeout = null;
  
  viewer.updateColors = function(intensity_data, options) {
    options = options || {};
    var blend = options.blend;
    var complete = options.complete;

    function applyColorArray(color_array) {
      var shapes;
      var shape = viewer.model.getObjectByName(intensity_data.apply_to_shape, true);

      if (shape) {
        shapes = [shape];
      } else {
        shapes = viewer.model.children;
      }

      colorModel(color_array, shapes);

      viewer.triggerEvent("updatecolors", color_array);

      if (complete) {
        complete();
      }

    }

    // Color updates will be asynchronous because they take a while.
    // New requests for color updates will replace old ones.
    clearTimeout(timeout);

    timeout = setTimeout(function() {
      if (blend) {
        applyColorArray(blendColors(intensity_data, options.model_name));
      } else {
        applyColorArray(viewer.color_map.mapColors(intensity_data.values, {
          min: intensity_data.range_min,
          max: intensity_data.range_max,
          default_colors: viewer.model_data.get(options.model_name).colors,
          clamp: viewer.getAttribute("clamp_colors"),
          flip: viewer.getAttribute("flip_colors")
        }));
      }
    }, 0);
  };

  /** 
  * @doc function
  * @name viewer.color:setIntensity
  * @param {number} index Index at which to change the intensity value.
  * @param {number} value New intensity value.
  * @param {object} options Options for the range change, which include the following: 
  * 
  * * **model_name** The name of the model whose intensity data should be updated.
  * * **complete** Callback function to call when the color update is done.
  * @description
  * Update the intensity value at the given index..
  * ```js
  * viewer.setIntensity(12124, 3.0);
  * ```
  * If more than one model file has been loaded, indicate the model data
  * the intensity data is associated with using the **model_name** option:
  * ```js
  * viewer.setIntensity(12124, 3.0, { model_name: "brain.obj" });
  * ```
  */
  viewer.setIntensity = function(index, value, options) {
    options = options || {};
    var data = viewer.model_data.get(options.model_name).intensity_data;
    
    if (data && index >= 0 && index < data.values.length) {
      data.values[index] = value;

      viewer.triggerEvent("updateintensitydata", data);
      viewer.updateColors(data, {
        complete: options.complete
      });
    }
  };

  /** 
  * @doc function
  * @name viewer.color:setIntensityRange
  * @param {number} min Minimum value of the range.
  * @param {number} max Maximum value of the range.
  * @param {object} options Options for the range change, which include the following: 
  * 
  * * **model_name** The name of the model whose intensity data should be updated.
  * * **complete** Callback function to call when the color update is done.
  * @description
  * Update the range of colors being applied to the current model.
  * ```js
  * viewer.setIntensityRange(2.0, 3.0);
  * ```
  * If more than one model file has been loaded, indicate the model data
  * the intensity data is associated with using the **model_name** option:
  * ```js
  * viewer.setIntensityRange(2.0, 3.0, { model_name: "brain.obj" });
  * ```
  */
  viewer.setIntensityRange = function(min, max, options) {
    options = options || {};
    var data = viewer.model_data.get(options.model_name).intensity_data;
    
    data.range_min = min;
    data.range_max = max;

    viewer.updateColors(data, {
      complete: options.complete
    });

    viewer.triggerEvent("changeintensityrange", data);
  };

  /**
  * @doc function
  * @name viewer.color:blend
  * @param {number} ratio Blend ratio between two loaded color maps (between 0 and 1).
  *
  * @description 
  * Blend two loaded color maps using the supplied ratio.
  * ```js
  * viewer.blend(0.3);
  * ```
  * **Note**: assumes two separate intesity data sets have been loaded using different
  * **blend_index** values (see **loadIntensityDataFromURL()** or 
  * **loadIntensityDataFromFile()**).
  */
  viewer.blend = function(ratio) {
    var blend_data = viewer.blend_data;
    var blend_data_length = blend_data.length;
    var i;
    
    blend_data[0].alpha = ratio;
    blend_data[1].alpha = 1.0 - ratio;
    for(i = 2; i < blend_data_length; i++) {
      blend_data[i].alpha = 0.0;
    }

    viewer.updateColors(blend_data, {
      blend: true
    });
  };

  ///////////////////////////
  // PRIVATE FUNCTIONS
  ///////////////////////////

  // Apply a color array to a model.
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
      wireframe = shape.getObjectByName("__WIREFRAME__");

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

  // Blend two sets of colors.
  function blendColors(intensity_set, model_name) {
    var color_arrays = [];
    var blended_color;
    var i, j, ci, num_arrays, num_colors;
    var alpha;
    
    intensity_set.forEach(function(intensity_data) {
      color_arrays.push(viewer.color_map.mapColors(intensity_data.values, {
        min: intensity_data.range_min,
        max: intensity_data.range_max,
        default_colors: viewer.model_data.get(model_name).colors,
        clamp: viewer.getAttribute("clamp_colors"),
        flip: viewer.getAttribute("flip_colors")
      }));
    });

    blended_color = new Float32Array(color_arrays[0].length);
    
    for (i = 0, num_colors = color_arrays[0].length / 4; i < num_colors; i++){
      for (j = 0, num_arrays = color_arrays.length; j < num_arrays; j++) {
        ci = i * 4;
        alpha = intensity_set[j].alpha;
        blended_color[ci]     += color_arrays[j][ci] * alpha;
        blended_color[ci + 1] += color_arrays[j][ci + 1] * alpha;
        blended_color[ci + 2] += color_arrays[j][ci + 2] * alpha;
        blended_color[ci + 3] += alpha;
      }
    }

    return blended_color;
  }

};

