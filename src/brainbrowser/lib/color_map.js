/*
* BrainBrowser: Web-based Neurological Visualization Tools
* (https://brainbrowser.cbrain.mcgill.ca)
*
* Copyright (C) 2011 Alan Evans, McGill University 
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
* @author: Nicolas Kassis
* @author: Tarek Sherif
*/

/**
 * @doc function
 * @name BrainBrowser.static methods:createColorMap
 * @param {string}  data The color map data as a string.
 * 
 * @description
 * Factory function to produce color map object from a string of data. A given
 * color map is a set of colors to which intensity data can be mapped for display.
 */

(function() {
  "use strict";

  var BrainBrowser = window.BrainBrowser = window.BrainBrowser || {};

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
      * @name color_map.color_map:createCanvas
      * @param {array} colors Array of color data.
      * 
      * @description
      * Create a canvas color_map from the given colors.
      */
      createCanvas: function(colors)  {
        var canvas;
        
        if (!colors) {
          colors = color_map.colors;
        }
        
        canvas = createCanvas(colors, 20, 20, false);

        return canvas;
      },

      /**
      * @doc function
      * @name color_map.color_map:createCanvasWithScale
      * @param {number} min Min value of the color data.
      * @param {number} max Max value of the color data.
      * @param {boolean} flip Array of color data.
      * 
      * @description
      * Create a canvas color_map from the given colors and provide the scale for it.
      */
      createCanvasWithScale: function(min, max, flip) {
        var canvas;
        var context;
        var colors = color_map.colors;
        
        canvas = createCanvas(colors, 20, 40, flip);
        context = canvas.getContext("2d");

        context.fillStyle = "#FFA000";

        //min mark
        context.fillRect(0.5, 20, 1, 10);
        context.fillText(min.toPrecision(3), 0.5, 40 );

        //quater mark
        context.fillRect(canvas.width/4.0, 20, 1, 10);
        context.fillText(((min+max)/4.0).toPrecision(3), canvas.width/4.0, 40);

        //middle mark
        context.fillRect(canvas.width/2.0, 20, 1, 10);
        context.fillText(((min+max)/2.0).toPrecision(3), canvas.width/2.0, 40);

        //3quater mark
        context.fillRect(3*(canvas.width/4.0), 20, 1, 10);
        context.fillText((3*((min+max)/4.0)).toPrecision(3), 3*(canvas.width/4.0), 40);


        //max mark
        context.fillRect(canvas.width-0.5, 20, 1, 10);
        context.fillText(max.toPrecision(3), canvas.width - 20, 40);

        return canvas;
      },

      /**
      * @doc function
      * @name color_map.color_map:mapColors
      * @param {array} values Original color values.
      * @param {object} options Options for the color mapping.
      * Options include the following:
      *
      * * **min** {number} Minimum color value.
      * * **max** {number} Maximum color value.
      * * **scale255** {boolean} Should the color values be scaled to a 0-255 range?
      * * **contrast** {number} Color contrast.
      * * **brightness** {number} Color brightness.
      * * **alpha** {number} Opacity of the color map. 
      * 
      * @returns {array} Colors modified based on options.
      *
      * @description
      * Create a color map of the input values modified based on the options given.
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
        
        var color_map_colors = color_map.colors;
        var color_map_length = color_map_colors.length;
        var range = max - min;
        //calculate a slice of the data per color
        var increment = ( range + range / color_map_length ) / color_map_length;
        var i, count;
        var color_index;
        var value;
        var scale = scale255 ? 255 : 1;
        var colors = [];

        alpha *= scale;
          
        //for each value, assign a color
        for (i = 0, count = values.length; i < count; i++) {
          value = values[i];
          if (value <= min) {
            color_index = 0;
          } else if (values[i] > max){
            color_index = color_map_length - 1;
          }else {
            color_index = Math.floor((value - min) / increment);
          }
          
          colors = color_map_colors[color_index] || [0, 0, 0];

          destination[i*4+0] = scale * (colors[0] * contrast + brightness);
          destination[i*4+1] = scale * (colors[1] * contrast + brightness);
          destination[i*4+2] = scale * (colors[2] * contrast + brightness);
          destination[i*4+3] = alpha;
        }

        return destination;
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

      $(canvas).attr("width", 256);
      $(canvas).attr("height", full_height);
      
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
