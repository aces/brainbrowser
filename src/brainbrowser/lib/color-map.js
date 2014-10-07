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
* Author: Nicolas Kassis
* Author: Tarek Sherif <tsherif@gmail.com> (http://tareksherif.ca/)
*/

(function() {
  "use strict";

  /**
  * @doc function
  * @name BrainBrowser.static methods:createColorMap
  * @param {string}  data The color map data as a string.
  * @param {object} options Options for the color map.
  * Options include the following:
  *
  * * **clamp** {boolean} Should values be clamped to range?
  * * **flip** {boolean} Invert mapping?
  * * **scale** {number} Scale to use (usually 1 or 255).
  * * **contrast** {number} Color contrast. 
  * * **brightness** {number} Extra intensity for colors. 
  * 
  * @returns {object} Color map object.
  * 
  * @description
  * Factory function to produce color map object from a string of data. A given
  * color map is a set of colors to which intensity data can be mapped for display.
  * ```js
  * BrainBrowser.createColorMap(data);
  * ```
  */
  BrainBrowser.createColorMap = function(data, options) {
    options = options || {};

    var clamp = options.clamp === undefined ? true : options.clamp;
    var flip = options.flip || false;
    var scale = options.scale || 1;
    var contrast = options.contrast || 1;
    var brightness = options.brightness || 0;

    var color_map_colors;
    var lines, line_count, line_length;
    var i, j, ic;
    var color;

    if (data) {
      lines = data.trim().split(/\n/);
      color_map_colors = new Float32Array(lines.length * 4);
      ic = 0;

      for (i = 0, line_count = lines.length; i < line_count; i++) {
        color = lines[i].trim().split(/\s+/).slice(0, 4);
        line_length = color.length;

        if (line_length < 3) continue;

        for (j = 0; j < line_length; j++) {
          color_map_colors[ic + j] = parseFloat(color[j]);
        }

        if (line_length < 4) {
          color_map_colors[ic + 3] = 1;
        }

        ic += 4;
      }
    }

    /**
    * @doc object
    * @name color_map
    * 
    * @description
    * Object representing the currently loaded color map.
    */
    var color_map = {
      colors: color_map_colors,
      clamp: clamp,
      flip: flip,
      scale: scale,
      contrast: contrast,
      brightness: brightness,

      /**
      * @doc function
      * @name color_map.color_map:mapColors
      * @param {array} values Original intensity values.
      * @param {object} options Options for the color mapping.
      * Options include the following:
      *
      * * **min** {number} Minimum intensity value.
      * * **max** {number} Maximum intensity value.
      * * **clamp** {boolean} Should values be clamped to range (overrides color map default)?
      * * **flip** {boolean} Invert mapping (overrides color map default)?
      * * **scale** {number} Scale to use (usually 1 or 255, overrides color map default).
      * * **contrast** {number} Color contrast (overrides color map default). 
      * * **brightness** {number} Extra intensity for colors (overrides color map default). 
      * * **default_colors** {array} Colors to use if value is out of range.
      * * **destination** {array} Array to write the colors to (instead of creating
      *   a new array). 
      * 
      * @returns {array} Colors modified based on options.
      *
      * @description
      * Create a color map of the input values modified based on the options given.
      * ```js
      * color_map.mapColors(data, {
      *   min: 0,
      *   max: 7.0
      * });
      * ```
      */
      mapColors: function(intensity_values, options) {
        options = options || {};
        var min = options.min === undefined ? 0 : options.min;
        var max = options.max === undefined ? 255 : options.max;
        var default_colors = options.default_colors || [0, 0, 0, 1];
        var destination = options.destination || new Float32Array(intensity_values.length * 4);

        var color_map_colors = color_map.colors;
        var color_map_length = color_map.colors.length / 4;
        
        var scale = options.scale === undefined ? color_map.scale : options.scale;
        var clamp = options.clamp === undefined ? color_map.clamp : options.clamp;
        var flip = options.flip === undefined ? color_map.flip : options.flip;
        var brightness = options.brightness === undefined ? color_map.brightness : options.brightness;
        var contrast = options.contrast === undefined ? color_map.contrast : options.contrast;

        // This is used so that when the model color is used in a model
        // that was just given a single color to apply to the whole model,
        // the indexes will be set properly (i.e. from 0-4, not 0-no. of
        // vertices.)
        var default_color_offset = default_colors.length === 4 ? 0 : 1;
        var range = max - min;
        var increment = color_map_length / range;
        
        var value;
        var i, ic, idc, count;
        var color_map_index;

        brightness *= scale;
        contrast *= scale;

        //for each value, assign a color
        for (i = 0, count = intensity_values.length; i < count; i++) {
          value = intensity_values[i];
          ic = i * 4;

          color_map_index = getColorMapIndex(value, min, max, increment, clamp, flip, color_map_length);

          //This inserts the RGBA values (R,G,B,A) independently
          if(color_map_index < 0) {
            idc = ic * default_color_offset;

            // contrast includes scaling factor
            destination[ic]     = contrast * default_colors[idc]     + brightness;
            destination[ic + 1] = contrast * default_colors[idc + 1] + brightness;
            destination[ic + 2] = contrast * default_colors[idc + 2] + brightness;
            destination[ic + 3] = scale    * default_colors[idc + 3];
          } else {
            // contrast includes scaling factor
            destination[ic]     = contrast * color_map_colors[color_map_index]     + brightness;
            destination[ic + 1] = contrast * color_map_colors[color_map_index + 1] + brightness;
            destination[ic + 2] = contrast * color_map_colors[color_map_index + 2] + brightness;
            destination[ic + 3] = scale    * color_map_colors[color_map_index + 3];
          }
        }

        return destination;
      },

      /**
      * @doc function
      * @name color_map.color_map:colorFromValue
      * @param {number} value Value to convert.
      * @param {object} options Options for the color mapping.
      * Options include the following:
      *
      * * **format** {string} Can be **float** for 0-1 range rgb array, 
      *   **255** for 0-255 range rgb array, or "hex" for a hex string.
      * * **min** {number} Minimum intensity value.
      * * **max** {number} Maximum intensity value.
      * * **clamp** {boolean} Should values be clamped to range (overrides color map default)?
      * * **flip** {boolean} Invert mapping (overrides color map default)?
      * * **scale** {number} Scale to use (usually 1 or 255, overrides color map default).
      * * **contrast** {number} Color contrast (overrides color map default). 
      * * **brightness** {number} Extra intensity for colors (overrides color map default). 
      * 
      * @returns {array|string} Color parsed from the value given.
      *
      * @description
      * Convert an intensity value to a color.
      * ```js
      * color_map.colorFromValue(value, {
      *   format: "float",
      *   min: 0,
      *   max: 7.0
      * });
      * ```
      */
      colorFromValue: function(value, options) {
        options = options || {};
        var hex = options.hex || false;
        var min = options.min === undefined ? 0 : options.min;
        var max = options.max === undefined ? 255 : options.max;
        var scale = options.scale === undefined ? color_map.scale : options.scale;
        var brightness = options.brightness === undefined ? color_map.brightness : options.brightness;
        var contrast = options.contrast === undefined ? color_map.contrast : options.contrast;
        var range = max - min;
        var color_map_length = color_map.colors.length / 4;
        var increment = color_map_length / range;
        var color_map_index = getColorMapIndex(
          value, min, max, increment,
          color_map.clamp,
          color_map.flip,
          color_map_length
        );
        
        var color;

        if (color_map_index >= 0) {
          color = Array.prototype.slice.call(color_map.colors, color_map_index, color_map_index + 4);
        } else {
          color = [0, 0, 0, 1];
        }

        color[0] = Math.max(0, Math.min(contrast * color[0] + brightness, 1));
        color[1] = Math.max(0, Math.min(contrast * color[1] + brightness, 1));
        color[2] = Math.max(0, Math.min(contrast * color[2] + brightness, 1));

        if (hex) {
          color[0] = Math.floor(color[0] * 255);
          color[1] = Math.floor(color[1] * 255);
          color[2] = Math.floor(color[2] * 255);
          color[3] = Math.floor(color[3] * 255);
          color[0] = ("0" + color[0].toString(16)).slice(-2);
          color[1] = ("0" + color[1].toString(16)).slice(-2);
          color[2] = ("0" + color[2].toString(16)).slice(-2);
          color = color.slice(0, 3).join("");
        } else {
          color[0] = color[0] * scale;
          color[1] = color[1] * scale;
          color[2] = color[2] * scale;
          color[3] = color[3] * scale;
        }

        return color;
      },

      /**
      * @doc function
      * @name color_map.color_map:createElement
      * @param {number} min Min value of the color data.
      * @param {number} max Max value of the color data.
      * 
      * @description
      * Create an element representing the color map.
      * ```js
      * color_map.createElement(0.0, 7.0);
      * ```
      */
      createElement: function(min, max) {
        var canvas;
        var context;
        var colors = color_map.colors;
        var range = max - min;
        
        canvas = createCanvas(colors, 20, 40, flip);
        context = canvas.getContext("2d");

        context.fillStyle = "#FFA000";

        // Min mark
        context.fillRect(0.5, 20, 1, 10);
        context.fillText(min.toPrecision(3), 0.5, 40);

        // Quarter mark
        context.fillRect(canvas.width / 4, 20, 1, 10);
        context.fillText((min + 0.25 * range).toPrecision(3), 0.25 * canvas.width, 40);

        // Middle mark
        context.fillRect(canvas.width / 2, 20, 1, 10);
        context.fillText((min + 0.5 * range).toPrecision(3), 0.5 * canvas.width, 40);

        // Three-quarter mark
        context.fillRect(3 * canvas.width / 4, 20, 1, 10);
        context.fillText((min + 0.75 * range).toPrecision(3), 0.75 * canvas.width, 40);


        // Max mark
        context.fillRect(canvas.width - 0.5, 20, 1, 10);
        context.fillText(max.toPrecision(3), canvas.width - 20, 40);

        return canvas;
      }
    };

    // Map a single value to a color.
    function getColorMapIndex(value, min, max, increment, clamp, flip, color_map_length) {
      var color_map_index;

      if ((value < min || value > max) && !clamp) {
        return -1;
      } else {
        color_map_index = Math.floor(Math.max(0, Math.min((value - min) * increment, color_map_length - 1)));
        if (flip) {
          color_map_index = color_map_length - 1 - color_map_index;
        }

        color_map_index *= 4;

        return color_map_index;
      }
    }

    // Creates an canvas with the color_map of colors
    // from low(left) to high(right) values
    //   colors: array of colors
    //   color_height: height of the color bar
    //   full_height: height of the canvas
    function createCanvas(colors, color_height, full_height) {
      var canvas = document.createElement("canvas");
      var value_array  = new Array(256);
      var i;
      var context;
      var old_scale;

      canvas.width = 256;
      canvas.height = full_height;

      for (i = 0; i < 256; i++) {
        value_array[i] = i;
      }
      
      old_scale = color_map.scale;
      color_map.scale = 255;
      colors = color_map.mapColors(value_array);
      color_map.scale = old_scale;

      context = canvas.getContext("2d");
      for (i = 0; i < 256; i++) {
        context.fillStyle = "rgb(" + Math.floor(colors[i*4]) + ", " +
                                     Math.floor(colors[i*4+1]) + ", " +
                                     Math.floor(colors[i*4+2]) + ")";
        context.fillRect(i, 0, 1, color_height);
      }

      return canvas;

    }
    
    

    return color_map;

  };

})();
