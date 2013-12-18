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
* @author: Nicolas Kassis
* @author: Tarek Sherif
*/


/**
 * Represents a blended volume
 */

(function() {
  "use strict";
  
  var VolumeViewer = BrainBrowser.VolumeViewer;

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
      this.blendRatios[0] = (100.0 - ratio) / 100.0;
      this.blendRatios[1] = ratio / 100.0;
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
            colorScale.mapColors(slice.data, {
              min: slice.min,
              max: slice.max,
              scale255: true,
              brightness: 0,
              contrast: 1,
              alpha: slice.alpha,
              destination: imageData.data
            });
          
            var xstep = slice.x.step;
            var ystep = slice.y.step;
            // console.log("xstep: " +xstep);
            // console.log("ystep: " +ystep);
            imageData = VolumeViewer.utils.nearestNeighbor(imageData, Math.floor(slice.width * xstep * zoom), Math.floor(slice.height * ystep * zoom));
            
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

  VolumeViewer.volumeType.multivolume = function(opt, callback) {
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

