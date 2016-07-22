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
  * @param {object} options Options for the color update, which include the following:
  *
  * * **model\_name** Model that will be updated.
  * * **shape\_name** Specific shape that will be updated.
  * * **complete** Callback function to call when the color update is done.
  *
  * @description
  * Update the vertex colors of the model based on currently loaded intensity data.
  * ```js
  * viewer.updateColors({
  *   blend: true
  * });
  * ```
  */
  var timeout = null;

  // Because color updates can be interrupted, keep
  // callbacks in an array to be executed at the end.
  var complete_callbacks = [];

  viewer.updateColors = function(options) {
    options = options || {};
    var complete = options.complete;
    var model_name = options.model_name;
    var shape_name = options.shape_name || model_name + "_1";
    var model_data = viewer.model_data.get(model_name);
    var intensity_data, blend;

    if (BrainBrowser.utils.isFunction(complete)) {
      complete_callbacks.push(complete);
    }

    if (model_data.intensity_data.length > 1) {
      intensity_data = model_data.intensity_data;
      blend = true;
    } else {
      intensity_data = model_data.intensity_data[0];
      blend = false;
    }

    function applyColorArray(color_array) {
      var shapes;
      var shape = viewer.model.getObjectByName(shape_name, true);

      if (shape) {
        shapes = [shape];
      } else {
        // 'original_data' indicates that it's a loaded model
        shapes = viewer.model.children.filter(function(child) { return !!child.userData.original_data; });
      }

      colorModel(color_array, shapes);
      complete_callbacks.forEach(function(complete) {
        complete();
      });
      complete_callbacks.length = 0;

      viewer.triggerEvent("updatecolors", {
        model_data: model_data,
        intensity_data: intensity_data,
        colors: color_array,
        blend: blend
      });
      if (blend) {
        viewer.triggerEvent("blendcolors", {
          model_data: model_data,
          intensity_data: intensity_data,
          colors: color_array
        });
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
          default_colors: viewer.model_data.get(options.model_name).colors
        }));
      }
    }, 0);
  };

  /**
  * @doc function
  * @name viewer.color:setIntensity
  * @param {object} intensity\_data (Optional) The data to update.
  * @param {number} index Index at which to change the intensity value.
  * @param {number} value New intensity value.
  * @param {object} options Options for the range change, which include the following:
  *
  * * **complete** Callback function to call when the color update is done.
  * @description
  * Update the intensity value at the given index..
  * ```js
  * viewer.setIntensity(intensity_data, 12124, 3.0);
  * ```
  * Note that if this method is called without an explicit **intensity\_data**
  * argument, it will update the first available intensity dataset.
  * ```js
  * viewer.setIntensity(12124, 3.0);
  * ```
  */
  viewer.setIntensity = function() {
    var args = Array.prototype.slice.call(arguments);
    var intensity_data, index, value, options, model_data;

    if (!BrainBrowser.utils.isNumeric(args[0])) {
      intensity_data = args.shift();
    } else {
      intensity_data = viewer.model_data.getDefaultIntensityData();
    }
    model_data = intensity_data.model_data;

    index = args[0];
    value = args[1];
    options = args[2] || {};

    if (intensity_data && index >= 0 && index < intensity_data.values.length) {
      intensity_data.values[index] = value;

      viewer.updateColors({
        model_name: model_data.name,
        complete: options.complete
      });
      viewer.triggerEvent("updateintensitydata", {
        model_data: model_data,
        intensity_data: intensity_data,
        index: index,
        value: value
      });
    }
  };

  /**
  * @doc function
  * @name viewer.color:setIntensityRange
  * @param {object} intensity_data The data to update.
  * @param {number} min Minimum value of the range.
  * @param {number} max Maximum value of the range.
  * @param {object} options Options for the range change, which include the following:
  *
  * * **complete** Callback function to call when the color update is done.
  * @description
  * Update the range of colors being applied to the current model.
  * ```js
  * viewer.setIntensityRange(intensity_data, 2.0, 3.0);
  * ```
  * Note that if this method is called without an explicit **intensity\_data**
  * argument, it will update the first available intensity dataset.
  * ```js
  * viewer.setIntensityRange(2.0, 3.0);
  * ```
  */
  viewer.setIntensityRange = function() {
    var args = Array.prototype.slice.call(arguments);
    var intensity_data, min, max, options, model_data;

    if (!BrainBrowser.utils.isNumeric(args[0])) {
      intensity_data = args.shift();
    } else {
      intensity_data = viewer.model_data.getDefaultIntensityData();
    }
    model_data = intensity_data.model_data;

    min = args[0];
    max = args[1];
    options = args[2] || {};

    intensity_data.range_min = min;
    intensity_data.range_max = max;

    viewer.updateColors({
      model_name: model_data.name,
      complete: options.complete
    });

    viewer.triggerEvent("changeintensityrange", {
      model_data: model_data,
      intensity_data: intensity_data,
      min: min,
      max: max
    });
  };

  /**
  * @doc function
  * @name viewer.color:blend
  * @param {multiple} parameters Blend alpha values, model name and/or callback.
  *
  * @description
  * Blend loaded color maps using the supplied alphas.
  * ```js
  * viewer.blend(0.3);
  * ```
  *
  * If several data sets are loaded, this method can take multiple values to
  * applied in order to loaded data. Generally, it's best to leave at least
  * one data set's alpha unset. Any unset values will be set so that
  * the alphas all add up to 1. The following, for example, will set
  * the first data sets alpha to 0.3, the second's to 0.2, and the remaining
  * 0.5 will be split evenly among remaining data sets.
  * ```js
  * viewer.blend(0.3, 0.2);
  * ```
  *
  * Optionally, this method can take as first argument the **model\_name**
  * of the model on which the blending should be performed, and as final argument,
  * a callback function.
  * ```js
  * viewer.blend("brain.obj", 0.3, 0.2, function() {
  *   console.log("Blended!");
  * });
  * ```
  */
  viewer.blend = function() {
    var alphas = Array.prototype.slice.call(arguments).filter(function(r) { return r !== undefined; });
    var model_name, callback;

    if (typeof alphas[0] === "string") {
      model_name = alphas.shift();
    }

    if (BrainBrowser.utils.isFunction(alphas[alphas.length - 1])) {
      callback = alphas.pop();
    }

    var intensity_data = viewer.model_data.get(model_name).intensity_data;
    var remainder = (1 - alphas.reduce(function(total, n) { return total + n; }, 0)) /
                    (intensity_data.length - alphas.length);

    intensity_data.forEach(function(intensity_data, i) {
      if (i < alphas.length) {
        intensity_data.alpha = alphas[i];
      } else {
        intensity_data.alpha = remainder;
      }
    });

    viewer.updateColors({
      model_name: model_name,
      complete: callback
    });
  };

  ///////////////////////////
  // PRIVATE FUNCTIONS
  ///////////////////////////

  // Apply a color array to a model.
  function colorModel(color_array, shapes) {
    var geometry, shape, indices;
    var color_attribute, geometry_color;
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
      indices = shape.userData.original_data.indices;
      color_attribute = geometry.attributes.color;
      geometry_color = color_attribute.array;

      if (BrainBrowser.WEBGL_UINT_INDEX_ENABLED) {
        // Fixed bug introduced by commit ce8d3c277fef (Skip deindexing if uint indices supported.)
        // Just use the first colors present in color_array, ignored left-over.
        for (i = 0; i < geometry_color.length ; i++ ) {
          geometry_color[i] = color_array[i];
        }
        if (has_wireframe) {
          wireframe.geometry.attributes.color.array.set(color_array);
        }
      } else {
      // This looks a little messy but it's just going from an indexed color map
      // to an unindexed geometry.
      // And it's skipping the alphas (every 4th element).
        for (i = 0, count = indices.length; i < count; i += 3) {
          ic = i * 4;
          iwc = ic * 2;

          geometry_color[ic]    = color_array[indices[i]*4];
          geometry_color[ic+1]  = color_array[indices[i]*4+1];
          geometry_color[ic+2]  = color_array[indices[i]*4+2];
          geometry_color[ic+3]  = 1.0;
          geometry_color[ic+4]  = color_array[indices[i+1]*4];
          geometry_color[ic+5]  = color_array[indices[i+1]*4+1];
          geometry_color[ic+6]  = color_array[indices[i+1]*4+2];
          geometry_color[ic+7]  = 1.0;
          geometry_color[ic+8]  = color_array[indices[i+2]*4];
          geometry_color[ic+9]  = color_array[indices[i+2]*4+1];
          geometry_color[ic+10] = color_array[indices[i+2]*4+2];
          geometry_color[ic+11] = 1.0;

          if (!has_wireframe) {
            continue;
          }
          // Treat wireframe
          // v1 -v2
          wireframe_color[iwc]     = geometry_color[ic];
          wireframe_color[iwc + 1] = geometry_color[ic + 1];
          wireframe_color[iwc + 2] = geometry_color[ic + 2];
          wireframe_color[iwc + 3] = geometry_color[ic + 3];
          wireframe_color[iwc + 4] = geometry_color[ic + 4];
          wireframe_color[iwc + 5] = geometry_color[ic + 5];
          wireframe_color[iwc + 6] = geometry_color[ic + 6];
          wireframe_color[iwc + 7] = geometry_color[ic + 7];

          // v2 - v3
          wireframe_color[iwc + 8]  = geometry_color[ic + 4];
          wireframe_color[iwc + 9]  = geometry_color[ic + 5];
          wireframe_color[iwc + 10] = geometry_color[ic + 6];
          wireframe_color[iwc + 11] = geometry_color[ic + 7];
          wireframe_color[iwc + 12] = geometry_color[ic + 8];
          wireframe_color[iwc + 13] = geometry_color[ic + 9];
          wireframe_color[iwc + 14] = geometry_color[ic + 10];
          wireframe_color[iwc + 15] = geometry_color[ic + 11];

          // v3 - v1
          wireframe_color[iwc + 16] = geometry_color[ic + 8];
          wireframe_color[iwc + 17] = geometry_color[ic + 9];
          wireframe_color[iwc + 18] = geometry_color[ic + 10];
          wireframe_color[iwc + 19] = geometry_color[ic + 11];
          wireframe_color[iwc + 20] = geometry_color[ic];
          wireframe_color[iwc + 21] = geometry_color[ic + 1];
          wireframe_color[iwc + 22] = geometry_color[ic + 2];
          wireframe_color[iwc + 23] = geometry_color[ic + 3];
        }
      }


      color_attribute.needsUpdate = true;

      if (has_wireframe) {
        wireframe.geometry.attributes.color.needsUpdate = true;
      }
    }

  }

  // Blend a set of colors.
  function blendColors(intensity_data, model_name) {
    var model_data = viewer.model_data.get(model_name);
    var color_arrays = [];
    var alphas = [];
    var blended_color;
    var i, j, ci, num_arrays, num_colors;
    var alpha;

    intensity_data.forEach(function(intensity_data) {
      color_arrays.push(viewer.color_map.mapColors(intensity_data.values, {
        min: intensity_data.range_min,
        max: intensity_data.range_max,
        default_colors: model_data.colors
      }));

      alphas.push(intensity_data.alpha);
    });

    blended_color = new Float32Array(color_arrays[0].length);

    for (i = 0, num_colors = color_arrays[0].length / 4; i < num_colors; i++){
      for (j = 0, num_arrays = color_arrays.length; j < num_arrays; j++) {
        ci = i * 4;
        alpha = alphas[j];
        blended_color[ci]     += color_arrays[j][ci] * alpha;
        blended_color[ci + 1] += color_arrays[j][ci + 1] * alpha;
        blended_color[ci + 2] += color_arrays[j][ci + 2] * alpha;
        blended_color[ci + 3] += alpha;
      }
    }

    return blended_color;
  }

};

