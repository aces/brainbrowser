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

/*
 * Author: Nicolas Kassis <nic.kassis@gmail.com>
 */


/**
 * Represents a blended volume
 */

(function() {
  "use strict";
  
  /*
   * Blend the pixels of two images using the alpha value of each
   */
  function blendImages(images, dest) {
    var numImages = images.length;
    if(numImages > 1) {
      var finalImage = dest.data;
      var numCol = dest.width;
      var numRow = dest.height;
      //This will be used to keep the position in each image of it's next pixel
      var imageIter = [];
      
      for (var i = 0; i < numRow; i += 1) {
        for (var k = 0; k < numCol; k += 1) {
          for (var j = 0; j < numImages; j += 1) {
            imageIter[j] = imageIter[j] || 0;
            var image = images[j];
            if(i < image.height &&  k < image.width) {
              var pixel = (i*numCol + k) * 4;
              var alpha = (finalImage[pixel  + 3] || 0)/255.0;
              var current = imageIter[j];
        
              finalImage[pixel] = (finalImage[pixel + 0] || 0)  *  //Red
                                  alpha + image.data[current+0] *
                                  (image.data[current+3]/255.0);
        
              finalImage[pixel + 1] = (finalImage[pixel + 1] || 0)  *  //Green
                                      alpha + image.data[current+1] *
                                      (image.data[current+3]/255.0);
        
              finalImage[pixel + 2] = (finalImage[pixel + 2] || 0)  * //Blue
                                      alpha + image.data[current+2] *
                                      (image.data[current+3]/255.0);
        
              finalImage[pixel + 3] = (finalImage[pixel + 3] || 0) + //combine alpha values
                                      image.data[current+3];
              imageIter[j] += 4;
            }
          }
        }
      }
      for(i = 3; i < finalImage.length; i+=4) {
        finalImage[i] = 255;
      }
      return dest;
    } else {
      return images[0];
    }
  }

  var multi_volume_proto = {
    updateBlendRatio: function(ratio) {
      ratio += 50;
      this.blendRatios[0] = (100.0-ratio)/100.0;
      this.blendRatios[1] = parseFloat(ratio)/100.0;

    },

    slice: function(axis, number, time) {
      var numVolumes = this.volumes.length;
      var i, slice;
      var slices = [];

      for(i = 0; i < numVolumes; i++) {
        var volume = this.volumes[i];
        if(volume !== this) {
          slice = this.volumes[i].slice(axis, number, time);
          slice.alpha = this.blendRatios[i];
          slices.push(slice);
        }
      }
      return {
        x: slices[0].x,
        y: slices[0].y,
        getImage: function(zoom) {
          zoom = zoom || 1;
          
          var context = document.createElement("canvas").getContext("2d");
          var images = [];
          var maxWidth, maxHeight;
          var finalImageData;
          var i, slice;
          for (i = 0; i < slices.length; i++) {
          
            slice = slices[i];
          
            var colorScale = slice.colorScale;
            var imageData = context.createImageData(slice.width, slice.height);
            colorScale.colorizeArray(slice.data, slice.min, slice.max, true, 0, 1, slice.alpha, imageData.data);
          
            var xstep = slice.x.step;
            var ystep = slice.y.step;
            // console.log("xstep: " +xstep);
            // console.log("ystep: " +ystep);
            imageData = BrainCanvas.utils.nearestNeighboor(imageData, Math.floor(slice.width * xstep * zoom), Math.floor(slice.height * ystep * zoom));
            
            images.push(imageData);
          }
          //Getting the maximum width and height of all the images to output an images that cover them all.
          maxWidth = Math.max.apply(null, images.map(function(image) { return image.width; }));
          maxHeight = Math.max.apply(null, images.map(function(image) { return image.height; }));
          
          
          finalImageData = context.createImageData(maxWidth, maxHeight);

          return blendImages(images, finalImageData);
        }
      };
    },
    
    getVoxelCoords: function() {
      return {
        x: this.position.xspace,
        y: this.position.yspace,
        z: this.position.zspace
      };
    },
    
    setVoxelCoords: function(x, y, z) {
      this.position.xspace = x;
      this.position.yspace = y;
      this.position.zspace = z;
    },
    
    getWorldCoords: function() {
      var reference = this.volumes[0];
      
      return {
        x: reference.data.xspace.start + this.position.xspace * reference.data.xspace.step,
        y: reference.data.yspace.start + this.position.yspace * reference.data.yspace.step,
        z: reference.data.zspace.start + this.position.zspace * reference.data.zspace.step
      };
    },
    
    setWorldCoords: function(x, y, z) {
      var reference = this.volumes[0];
      this.position.xspace = Math.floor((x - reference.data.xspace.start) / reference.data.xspace.step);
      this.position.yspace = Math.floor((y - reference.data.yspace.start) / reference.data.yspace.step);
      this.position.zspace = Math.floor((z - reference.data.zspace.start) / reference.data.zspace.step);
    }
  };

  function multivolumeData(volumes) {
    var data = Object.create(multi_volume_proto);
    var i;
    
    data.volumes = [];
    var numVolumes = volumes.length;
    for(i = 0; i < numVolumes; i++) {
      if(volumes[i] !== data) {
        data.volumes.push(volumes[i]);
      }
    }
    data.blendRatios = [];

    //initialize blendRatios
    numVolumes = data.volumes.length;
    var blendRatio = 1.0/numVolumes;
    for(i = 0; i < numVolumes; i++) {
      data.blendRatios[i] = blendRatio;
    }

    return data;
  }

  BrainCanvas.volumeType.multivolume = function(opt, callback) {
    var volume = multivolumeData(opt.volumes);
    volume.type = "multivolume";
    volume.min = 0;
    volume.max = 255;
    volume.header = opt.volumes[0].header;
    setTimeout(function() {
      callback(volume);
    }, 0);
  };
}());

