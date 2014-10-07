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
  var image_creation_context = document.createElement("canvas").getContext("2d");

  VolumeViewer.volume_loaders.overlay = function(options, callback) {
    options = options || {};
    var volumes = options.volumes || [];

    var overlay_volume = {
      type: "overlay",
      position: {},
      header: volumes[0] ? volumes[0].header : {},
      min: 0,
      max: 255,
      volumes: [],
      blend_ratios: [],
      slice: function(axis, slice_num, time) {
        slice_num = slice_num === undefined ? this.position[axis] : slice_num;
        time = time === undefined ? this.current_time : time;

        var overlay_volume = this;
        var slices = [];

        overlay_volume.volumes.forEach(function(volume) {
          var slice = volume.slice(axis, slice_num, time);
          slices.push(slice);
        });
        
        return {
          height_space: slices[0].height_space,
          width_space: slices[0].width_space,
          getImage: function(zoom, contrast, brightness) {
            zoom = zoom || 1;
            
            var images = [];
            var max_width = 0;
            var max_height = 0;

            slices.forEach(function(slice) {
              var color_map = slice.color_map;
              var error_message;

              if (!color_map) {
                error_message = "No color map set for this volume. Cannot render slice.";
                overlay_volume.triggerEvent("error", error_message);
                throw new Error(error_message);
              }

              var xstep = slice.width_space.step;
              var ystep = slice.height_space.step;
              var target_width = Math.abs(Math.floor(slice.width * xstep * zoom));
              var target_height = Math.abs(Math.floor(slice.height * ystep * zoom));
              var source_image = image_creation_context.createImageData(slice.width, slice.height);
              var target_image = image_creation_context.createImageData(target_width, target_height);
              

              color_map.mapColors(slice.data, {
                min: slice.min,
                max: slice.max,
                contrast: contrast,
                brightness: brightness,
                destination: source_image.data
              });

              if (xstep < 0 && ystep > 0) {
                source_image.data.set(
                  VolumeViewer.utils.flipImage(source_image.data, source_image.width, source_image.height, {
                    flipx: true,
                    flipy: false,
                    block_size: 4
                  })
                );
              }
              
              target_image.data.set(VolumeViewer.utils.nearestNeighbor(
                source_image.data,
                source_image.width,
                source_image.height,
                target_width,
                target_height,
                {block_size: 4}
              ));

              max_width = Math.max(max_width, target_width);
              max_height = Math.max(max_height, target_height);
              
              images.push(target_image);
            });
           
            return blendImages(
              images,
              overlay_volume.blend_ratios,
              image_creation_context.createImageData(max_width, max_height)
            );
          }
        };
      },

      getIntensityValue: function(x, y, z, time) {
        x = x === undefined ? this.position.xspace : x;
        y = y === undefined ? this.position.yspace : y;
        z = z === undefined ? this.position.zspace : z;
        time = time === undefined ? this.current_time : time;

        var overlay_volume = this;
        var values = [];

        overlay_volume.volumes.forEach(function(volume) {
          if (x < 0 || x > volume.data.xspace.space_length ||
            y < 0 || y > volume.data.yspace.space_length ||
            z < 0 || z > volume.data.zspace.space_length) {
            values.push(0);
          }

          var slice = volume.data.slice("zspace", z, time);
          var data = slice.data;
          var slice_x, slice_y;

          if (slice.width_space.name === "xspace") {
            slice_x = x;
            slice_y = y;
          } else {
            slice_x = y;
            slice_y = z;
          }

          values.push(data[(slice.height_space.space_length - slice_y - 1) * slice.width + slice_x]);
        });

        return values.reduce(function(intensity, current_value, i) {
          return intensity + current_value * overlay_volume.blend_ratios[i];
        }, 0);
      }
    };

    volumes.forEach(function(volume) {
      overlay_volume.volumes.push(volume);
      overlay_volume.blend_ratios.push(1 / volumes.length);
    });
    
    if (BrainBrowser.utils.isFunction(callback)) {
      callback(overlay_volume);
    }
  };

  // Blend the pixels of several images using the alpha value of each
  function blendImages(images, blend_ratios, target) {
    var num_images = images.length;

    if (num_images === 1) {
      return images[0];
    }

    var target_data = target.data;
    var width = target.width;
    var height = target.height;
    var y, x;
    var i;
    var image, image_data, pixel, alpha, current;
    var row_offset;

    //This will be used to keep the position in each image of its next pixel
    var image_iter = new Uint32Array(images.length);
    var alphas = new Float32Array(blend_ratios);

    for (y = 0; y < height; y += 1) {
      row_offset = y * width;

      for (x = 0; x < width; x += 1) {
        pixel = (row_offset + x) * 4;
        alpha = 0;

        for (i = 0; i < num_images; i += 1) {
          image = images[i];

          if(y < image.height &&  x < image.width) {
            image_data = image.data;

            current = image_iter[i];
      
            //Red
            target_data[pixel] = target_data[pixel] * alpha +
                                  image_data[current] * alphas[i];
      
            //Green
            target_data[pixel + 1] = target_data[pixel + 1] * alpha +
                                      image_data[current + 1] * alphas[i];
      
            //Blue
            target_data[pixel + 2] = target_data[pixel + 2] * alpha +
                                      image_data[current + 2] * alphas[i];
      
            target_data[pixel + 3] = 255;
            alpha += alphas[i];
            
            image_iter[i] += 4;
          }

        }

      }
    }

    return target;

  }

}());

