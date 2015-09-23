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
      intensity_min: 0,
      intensity_max: 255,
      volumes: [],
      blend_ratios: [],
      slice: function(axis, slice_num, time) {
        slice_num = slice_num === undefined ? this.position[axis] : slice_num;
        time = time === undefined ? this.current_time : time;

        var overlay_volume = this;
        var slices = [];

        overlay_volume.volumes.forEach(function(volume) {
          /*
           * We need to correct the slice_num for images with different
           * numbers of points along an axis. Otherwise we won't form
           * the composite image correctly.
           * TODO: This is only a partial fix, and should be improved.
           */
          var factor = volume.header[axis].step / volumes[0].header[axis].step;
          var corrected_slice_num = Math.round(slice_num / factor);
          var slice = volume.slice(axis, corrected_slice_num, time);
          slices.push(slice);
        });

        return {
          height_space: slices[0].height_space,
          width_space: slices[0].width_space,
          slices: slices
        };
      },

      // Calculates the axis coordinate in world space.
      //
      getSliceCoordinate: function(header, axis_name) {
        var vc = {
          i: overlay_volume.position[header.order[0]],
          j: overlay_volume.position[header.order[1]],
          k: overlay_volume.position[header.order[2]]
        };
        var wc = overlay_volume.volumes[0].voxelToWorld(vc.i, vc.j, vc.k);

        var result = 0;
        if (axis_name === "xspace")
          result = wc.x;
        else if (axis_name === "yspace")
          result = wc.y;
        else
          result = wc.z;
        return result;
      },

      getSliceImage: function(slice, zoom, contrast, brightness) {
        zoom = zoom || 1;

        var slices = slice.slices;
        var images = [];
        var max_width = 0;
        var max_height = 0;
        var overlay_volume = this;

        // Calculate the maximum width and height for the set of
        // volumes. We need this to set the overall field of view.
        //
        slices.forEach(function(slice, i) {
          var xstep = slice.width_space.step;
          var ystep = slice.height_space.step;

          var target_width = Math.abs(Math.floor(slice.width * xstep * zoom));
          var target_height = Math.abs(Math.floor(slice.height * ystep * zoom));

          max_width = Math.max(max_width, target_width);
          max_height = Math.max(max_height, target_height);
        });

        slices.forEach(function(slice, i) {
          var volume = overlay_volume.volumes[i];
          var color_map = volume.color_map;
          var intensity_min = volume.intensity_min;
          var intensity_max = volume.intensity_max;
          var error_message;

          if (!color_map) {
            error_message = "No color map set for this volume. Cannot render slice.";
            overlay_volume.triggerEvent("error", { message: error_message });
            throw new Error(error_message);
          }

          var target_image = image_creation_context.createImageData(max_width, max_height);

          var min_col = -max_width / 2;
          var max_col = max_width / 2;
          var min_row = -max_height / 2;
          var max_row = max_height / 2;

          var header = volume.header;

          var time_offset = header.time ? volume.current_time * header.time.offset : 0;

          var axis_space = header[slice.axis];
          var width_space = axis_space.width_space;
          var height_space = axis_space.height_space;

          var i_offset = header[header.order[0]].offset;
          var j_offset = header[header.order[1]].offset;
          var k_offset = header[header.order[2]].offset;

          var sizes = [
            header[header.order[0]].space_length,
            header[header.order[1]].space_length,
            header[header.order[2]].space_length
          ];

          var slice_data = new Uint8Array(max_width * max_height);
          var data_index = 0;

          // We need to calculate the slice coordinate in world
          // space in order to properly align the volumes.
          //
          var c_axis = overlay_volume.getSliceCoordinate(header,
                                                         axis_space.name);

          for (var c_row = max_row; c_row >= min_row; c_row--) {
            for (var c_col = min_col; c_col < max_col; c_col++) {
              var wc = {};
              wc[slice.axis] = c_axis;
              wc[width_space.name] = c_col;
              wc[height_space.name] = c_row;
              var vc = volume.worldToVoxel(wc.xspace, wc.yspace, wc.zspace);
              if (vc.i < 0 || vc.i >= sizes[0] ||
                  vc.j < 0 || vc.j >= sizes[1] ||
                  vc.k < 0 || vc.k >= sizes[2]) {
                slice_data[data_index] = 0;
              }
              else {
                var volume_index = (time_offset +
                                    vc.i * i_offset +
                                    vc.j * j_offset +
                                    vc.k * k_offset);
                slice_data[data_index] = volume.data[volume_index];
              }
              data_index++;
            }
          }

          color_map.mapColors(slice_data, {
            min: intensity_min,
            max: intensity_max,
            contrast: contrast,
            brightness: brightness,
            destination: target_image.data
          });

          images.push(target_image);
        });

        return blendImages(
          images,
          overlay_volume.blend_ratios,
          image_creation_context.createImageData(max_width, max_height)
        );
      },

      getIntensityValue: function(x, y, z, time) {
        x = x === undefined ? this.position.xspace : x;
        y = y === undefined ? this.position.yspace : y;
        z = z === undefined ? this.position.zspace : z;
        time = time === undefined ? this.current_time : time;

        var overlay_volume = this;
        var values = [];

        overlay_volume.volumes.forEach(function(volume) {
          var header = volume.header;

          if (x < 0 || x > header.xspace.space_length ||
            y < 0 || y > header.yspace.space_length ||
            z < 0 || z > header.zspace.space_length) {
            values.push(0);
          }
          else {
            var slice = volume.slice("zspace", z, time);
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
          }
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

