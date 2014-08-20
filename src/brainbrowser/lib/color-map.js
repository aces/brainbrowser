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
  * @returns {object} Color map object.
  * 
  * @description
  * Factory function to produce color map object from a string of data. A given
  * color map is a set of colors to which intensity data can be mapped for display.
  * ```js
  * BrainBrowser.createColorMap(data);
  * ```
  */
  BrainBrowser.createColorMap = function(data) {

    /**
    * @doc object
    * @name color_map
    * 
    * @description
    * Object representing the currently loaded color map.
    */
    var color_map = {

      /**
      * @doc function
      * @name color_map.color_map:createCanvasWithScale
      * @param {number} min Min value of the color data.
      * @param {number} max Max value of the color data.
      * @param {object} options The only option currently supported is **flip_correlation**
      *   which will flip the correlation between colors and intensities if set to **true**.
      * 
      * @description
      * Create a canvas color_map from the given colors and provide the scale for it.
      * ```js
      * color_map.createCanvasWithScale(0.0, 7.0, {
      *   flip_correlation: true
      * });
      * ```
      */
      createCanvasWithScale: function(min, max, options) {
        options = options || {};
        var canvas;
        var context;
        var colors = color_map.colors;
        var flip = options.flip;
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
      },

      /**
      * @doc function
      * @name color_map.color_map:mapColors
      * @param {array} values Original intensity values.
      * @param {object} options Options for the color mapping.
      * Options include the following:
      *
      * * **min** {number} Minimum intensity value.
      * * **max** {number} Maximum intensity value.
      * * **scale255** {boolean} Should the color values be scaled to a 0-255 range?
      * * **contrast** {number} Color contrast.
      * * **brightness** {number} Color brightness.
      * * **alpha** {number} Opacity of the color map. 
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
      *   max: 7.0,
      *   scale255: true,
      *   brightness: 0,
      *   contrast: 1,
      *   alpha: 0.8
      * });
      * ```
      */
      mapColors: function(values, options) {
        options = options || {};
        var min = options.min === undefined ? 0 : options.min;
        var max = options.max === undefined ? 255 : options.max;
        var scale255 = options.scale255 === undefined ? false : options.scale255;
        var brightness = options.brightness === undefined ? 0 : options.brightness;
        var contrast = options.contrast === undefined ? 1 : options.contrast;
        var alpha = options.alpha === undefined ? 1 : options.alpha;
        var destination = options.destination || [];

        var i, count;
        var value;
        var scale = scale255 ? 255 : 1;
        var colors = [];

        alpha *= scale;
          
        //for each value, assign a color
        for (i = 0, count = values.length; i < count; i++) {          
          colors = color_map.colorFromValue(values[i], {
            min: min,
            max: max
          });

          destination[i*4+0] = scale * (colors[0] * contrast + brightness);
          destination[i*4+1] = scale * (colors[1] * contrast + brightness);
          destination[i*4+2] = scale * (colors[2] * contrast + brightness);
          destination[i*4+3] = alpha;
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
        var format = options.format || "float";
        var min = options.min === undefined ? 0 : options.min;
        var max = options.max === undefined ? 255 : options.max;

        var color_map_colors = color_map.colors;
        var color_map_length = color_map_colors.length;
        var range = max - min;
        
        // Calculate a slice of the data per color
        var increment = ( range + range / color_map_length ) / color_map_length;
        var color, color_index;

        if (value <= min) {
          color_index = 0;
        } else if (value > max){
          color_index = color_map.colors.length - 1;
        }else {
          color_index = Math.floor((value - min) / increment);
        }

        if (color_map_colors[color_index]) {
          color = Array.prototype.slice.call(color_map_colors[color_index]);
        } else {
          color = [0, 0, 0];
        }

        if (format !== "float") {
          color[0] = Math.floor(color[0] * 255);
          color[1] = Math.floor(color[1] * 255);
          color[2] = Math.floor(color[2] * 255);
          color[3] = Math.floor(color[3] * 255);

          if (format === "hex") {
            color[0] = ("0" + color[0].toString(16)).slice(-2);
            color[1] = ("0" + color[1].toString(16)).slice(-2);
            color[2] = ("0" + color[2].toString(16)).slice(-2);
            color = color.slice(0, 3).join("");
          }
        }

        return color;
      }
    };

    // Creates an canvas with the color_map of colors
    // from low(left) to high(right) values
    //   colors: array of colors
    //   color_height: height of the color bar
    //   full_height: height of the canvas
    //   flip: boolean should the colors be reversed
    function createCanvas(colors, color_height, full_height, flip) {
      var canvas = document.createElement("canvas");
      var value_array  = new Array(256);
      var i, k;
      var context;

      canvas.width = 256;
      canvas.height = full_height;
      
      for (i = 0; i < 256; i++) {
        if (flip) {
          value_array[255-i] = i;
        } else {
          value_array[i] = i;
        }
      }
      
      colors = color_map.mapColors(value_array, { scale255: true });

      context = canvas.getContext("2d");
      for (k = 0; k < 256; k++) {
        context.fillStyle = "rgb(" + Math.floor(colors[k*4]) + ", " +
                                     Math.floor(colors[k*4+1]) + ", " +
                                     Math.floor(colors[k*4+2]) + ")";
        context.fillRect(k, 0, 1, color_height);
      }

      return canvas;

    }

    /*
    * Parse the color_map data from a string
    */
    (function() {
      if (!data) return;

      data = data.replace(/^\s+/, '').replace(/\s+$/, '');
      var lines = data.split(/\n/);
      var colors = [];
      var i, k, line_count, line_length;
      var color;
      
      for (i = 0, line_count = lines.length; i < line_count; i++) {
        color = lines[i].replace(/^\s+/, '').replace(/\s+$/, '').split(/\s+/).slice(0, 4);
        line_length = color.length;

        if (line_length < 3) continue;

        for (k=0; k < line_length; k++) {
          color[k] = parseFloat(color[k]);
        }

        if (line_length < 4) {
          color.push(1.0000);
        }

        colors.push(color);
      }
      color_map.colors = colors;
    })();

    return color_map;

  };

})();
