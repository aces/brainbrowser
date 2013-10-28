/*
 * Copyright (c) 2011-2012, McGill University
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *   * Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *   * Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *   * Neither the name of McGill University nor the
 *     names of its contributors may be used to endorse or promote products
 *     derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL McGill University  BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

BrainBrowser.VolumeViewer.utils = (function() {
  "use strict";
  
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
  
  /**
   * Interpolates the slice data using nearest neighboor interpolation
   * @param {Array} data original data
   * @param {Number} width original width
   * @param {Number} height original height
   * @param {Number} new_width new width
   * @param {Number} new_height new height
   * @param {Number} numElem number of elements per pixel (default 4 for RGBA)
   * @return {Array} new_array output of the neighrest neighboor algo.
   */
  function nearestNeighboor(orig, new_width, new_height) {
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
      
    //console.log("neighbor");
    //else execute nearest neighboor (NED FLANDERS)
    
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
  }
  
  return {
    nearestNeighboor: nearestNeighboor
  };
  
})();



