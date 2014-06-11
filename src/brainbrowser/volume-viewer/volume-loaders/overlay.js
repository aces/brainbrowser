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

/**
 * Represents a blended volume
 */

(function() {
  "use strict";
  
  var VolumeViewer = BrainBrowser.VolumeViewer;

  // Blend the pixels of two images using the alpha value of each
  function blendImages(images, dest) {
    var n_images = images.length;
    var final_image = dest.data;
    var n_cols = dest.width;
    var n_rows = dest.height;
    var i, j, k;
    var image, pixel, alpha, current;

    //This will be used to keep the position in each image of its next pixel
    var image_iter = [];

    if(n_images > 1) {
      for (i = 0; i < n_rows; i += 1) {
        for (k = 0; k < n_cols; k += 1) {
          for (j = 0; j < n_images; j += 1) {
            image_iter[j] = image_iter[j] || 0;
            image = images[j];
            if(i < image.height &&  k < image.width) {
              pixel = (i*n_cols + k) * 4;
              alpha = (final_image[pixel  + 3] || 0)/255.0;
              current = image_iter[j];
        
              final_image[pixel] = (final_image[pixel + 0] || 0)  *  //Red
                                  alpha + image.data[current + 0] *
                                  (image.data[current + 3]/255.0);
        
              final_image[pixel + 1] = (final_image[pixel + 1] || 0)  *  //Green
                                       alpha + image.data[current + 1] *
                                       (image.data[current+3]/255.0);
        
              final_image[pixel + 2] = (final_image[pixel + 2] || 0)  * //Blue
                                       alpha + image.data[current + 2] *
                                       (image.data[current + 3] / 255.0);
        
              final_image[pixel + 3] = (final_image[pixel + 3] || 0) + //combine alpha values
                                       image.data[current + 3];
              image_iter[j] += 4;
            }
          }
        }
      }
      for (i = 3; i < final_image.length; i += 4) {
        final_image[i] = 255;
      }
      return dest;
    } else {
      return images[0];
    }
  }

  var overlay_proto = {

    slice: function(axis, slice_num, time) {
      slice_num = slice_num === undefined ? this.position[axis] : slice_num;
      time = time === undefined ? this.current_time : time;

      var overlay_volume = this;
      var slices = [];

      overlay_volume.volumes.forEach(function(volume, i) {
        var slice = volume.slice(axis, slice_num, time);
        slice.alpha = overlay_volume.blend_ratios[i];
        slices.push(slice);
      });
      
      return {
        height_space: slices[0].height_space,
        width_space: slices[0].width_space,
        getImage: function(zoom) {
          zoom = zoom || 1;
          
          var context = document.createElement("canvas").getContext("2d");
          var images = [];
          var max_width, max_height;
          var final_image_data;

          slices.forEach(function(slice) {
            var color_map = slice.color_map;
            var image_data = context.createImageData(slice.width, slice.height);
            var result_width = Math.floor(slice.width * slice.width_space.step * zoom);
            var result_height = Math.floor(slice.height * slice.height_space.step * zoom);
            
            color_map.mapColors(slice.data, {
              min: slice.min,
              max: slice.max,
              scale255: true,
              brightness: 0,
              contrast: 1,
              alpha: slice.alpha,
              destination: image_data.data
            });
            
            image_data = VolumeViewer.utils.nearestNeighbor(image_data, result_width, result_height);
            
            images.push(image_data);
          });

          // Getting the max width and height of all images to produce an image
          // large enough to display them all
          max_width = images.reduce(function(max_width, image) { return Math.max(max_width, image.width); }, 0);
          max_height = images.reduce(function(max_height, image) { return Math.max(max_height, image.height); }, 0);

         
          final_image_data = context.createImageData(max_width, max_height);

          return blendImages(images, final_image_data);
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
      return this.volumes[0].voxelToWorld(this.position.xspace, this.position.yspace, this.position.zspace);
    },
    
    setWorldCoords: function(x, y, z) {
      var voxel = this.volumes[0].worldToVoxel(x, y, z);

      this.position.xspace = voxel.x;
      this.position.yspace = voxel.y;
      this.position.zspace = voxel.z;
    }
  };

  VolumeViewer.volume_loaders.overlay = function(options, callback) {
    options = options || {};
    var volumes = options.volumes || [];

    var overlay_volume = Object.create(overlay_proto);
    
    overlay_volume.type = "overlay";
    overlay_volume.position = {};
    overlay_volume.header = volumes[0] ? volumes[0].header : {};
    overlay_volume.min = 0;
    overlay_volume.max = 255;
    overlay_volume.volumes = [];
    overlay_volume.blend_ratios = [];

    volumes.forEach(function(volume) {
      overlay_volume.volumes.push(volume);
      overlay_volume.blend_ratios.push(1 / volumes.length);
    });
    
    if (BrainBrowser.utils.isFunction(callback)) {
      callback(overlay_volume);
    }
  };
}());

