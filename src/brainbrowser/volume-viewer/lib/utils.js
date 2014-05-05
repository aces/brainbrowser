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
    axis_to_number: {
      xspace: 0,
      yspace: 1,
      zspace: 2
    },
    /**
    * @doc function
    * @name utils.utils.nearestNeighbor
    *
    * @param {array} orig Original image
    * @param {number} new_width Width of scaled image.
    * @param {number} new_height Height of scaled image.
    * @returns {ImageData} The scaled image.
    *
    * @description
    * Scale an image using nearest neighbor interpolation.
    */
    nearestNeighbor: function(orig, new_width, new_height) {
      var data = orig.data;
      var width = orig.width;
      var height = orig.height;
      var context = document.createElement("canvas").getContext("2d");
      var numElem   = 4;
      //Do nothing if height is the same
      if(width === new_width && height === new_height) {
        return orig;
      }
      
      if (new_width < 0 && new_height > 0) {
        data = flipImage(data, width, height, true, false, numElem);
      }
      
      new_width = Math.abs(new_width);
      new_height = Math.abs(new_height);
      
      var image     = context.createImageData(new_width, new_height);
      var imageData = image.data;
      var x_ratio   = width / new_width;
      var y_ratio   = height / new_height;
      for (var i = 0; i < new_height; i++) {
        for (var j = 0; j < new_width; j++)  {
          var px = Math.floor(j * x_ratio);
          var py = Math.floor(i * y_ratio);
          for (var k = 0; k < numElem; k++) {
            imageData[Math.floor(i * new_width + j) * numElem + k] = data[Math.floor( py * width + px) * numElem + k];
          }
        }
      }
      
      return image;
    },

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



