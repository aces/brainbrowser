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

(function() {
  "use strict";

  BrainBrowser.VolumeViewer.utils = {
    /**
    * @doc object
    * @name VolumeViewer.utils.axis_to_number
    *
    * @property {xspace} Index of x space (0)
    * @property {yspace} Index of y space (1)
    * @property {zspace} Index of z space (2)
    *
    * @description
    * Convenience object for converting between space names
    * and indices.
    * ```js
    * BrainBrowser.VolumeViewer.utils.axis_to_number["xspace"];
    * ```
    */
    axis_to_number: {
      xspace: 0,
      yspace: 1,
      zspace: 2
    },

    /**
    * @doc function
    * @name VolumeViewer.utils.nearestNeighbor
    *
    * @param {array} source Source image data.
    * @param {number} width Width of source image.
    * @param {number} height Height of source image.
    * @param {number} target_width Width of scaled image.
    * @param {number} target_height Height of scaled image.
    * @param {object} options Extra options:
    * * **block_size** The size of each unit for scaling (default: 1). 
    * * **array_type** Constructor for the result array type (default: Uint8ClampedArray). 
    * 
    * @returns {array} The scaled image array.
    *
    * @description
    * Scale an image using nearest neighbor interpolation.
    * ```js
    * BrainBrowser.VolumeViewer.utils.nearestNeighbor(image_data, 256, 256, 512, 512);
    * ```
    */
    nearestNeighbor: function(source, width, height, target_width, target_height, options) {
      options = options || {};

      var x_ratio, y_ratio;
      var source_y_offset, source_block_offset;
      var target;
      var target_x, target_y;
      var target_y_offset, target_block_offset;
      var k;
      var block_size, ArrayType;

      block_size = options.block_size || 1;
      ArrayType = options.array_type || Uint8ClampedArray;

      if (target_width < 0 && target_height > 0) {
        source = flipImage(source, width, height, true, false, block_size);
      }

      target_width = Math.abs(target_width);
      target_height = Math.abs(target_height);

      //Do nothing if size is the same
      if(width === target_width && height === target_height) {
        return source;
      }
      
      target = new ArrayType(target_width * target_height * block_size);
      x_ratio   = width / target_width;
      y_ratio   = height / target_height;
      for (target_y = 0; target_y < target_height; target_y++) {
        source_y_offset = Math.floor(target_y * y_ratio) * width;
        target_y_offset = target_y * target_width;

        for (target_x = 0; target_x < target_width; target_x++)  {
          source_block_offset = (source_y_offset + Math.floor(target_x * x_ratio)) * block_size;
          target_block_offset = (target_y_offset + target_x) * block_size;

          for (k = 0; k < block_size; k++) {
            target[target_block_offset+ k] = source[source_block_offset + k];
          }
        }
      }
      
      return target;
    },


    /**
    * @doc function
    * @name VolumeViewer.utils.rotateUint16Array90Left
    *
    * @param {Uint16Array} array The array to rotate
    * @param {number} width Width of the 2D interpretation of the array
    * @param {number} height Height of the 2D interpretation of the array
    * @returns {Uint16Array} The rotated array.
    *
    * @description
    * Rotate an array to the left based on a width X height 2D interpretation 
    * of the array data.
    * ```js
    * BrainBrowser.VolumeViewer.utils.rotateUint16Array90Left(array, 512, 512);
    * ```
    */
    rotateUint16Array90Left: function(array, width, height){
      var new_array = new Uint16Array(width * height);
      var i, j;
      
      for (i = 0; i < width; i++) {
        for (j = 0; j < height; j++) {
          new_array[i * height + j] = array[j * width + (width - i)];
        }
      }

      return new_array;
    },
    
    /**
    * @doc function
    * @name VolumeViewer.utils.rotateUint16Array90Right
    *
    * @param {Uint16Array} array The array to rotate
    * @param {number} width Width of the 2D interpretation of the array
    * @param {number} height Height of the 2D interpretation of the array
    * @returns {Uint16Array} The rotated array.
    *
    * @description
    * Rotate an array to the right based on a width X height 2D interpretation 
    * of the array data.
    * ```js
    * BrainBrowser.VolumeViewer.utils.rotateUint16Array90Right(array, 512, 512);
    * ```
    */
    rotateUint16Array90Right: function(array, width, height){
      var new_array = new Uint16Array(width * height);
      var i, j;

      for (i = 0; i < width; i++) {
        for (j = 0; j < height; j++) {
          new_array[i * height + j] = array[(height - j) * width + i];
        }
      }
      return new_array;
    }
  };

  
  ///////////////////////////////////
  // Private Functions
  ///////////////////////////////////

  function flipImage(src, width, height, flipx, flipy, block_size) {
    var dest = [];
    var i, j, k;
    var x, y;
    block_size = block_size || 1;

    for (i = 0; i < width; i++) {
      for (j = 0; j < height; j++) {
        x = flipx ? width - i - 1 : i;
        y = flipy ? height - j - 1 : j;
        for (k = 0; k < block_size; k++) {
          dest[(j * width + i) * block_size + k] = src[(y * width + x) * block_size + k];
        }
      }
    }
    
    return dest;
  }
    
})();



