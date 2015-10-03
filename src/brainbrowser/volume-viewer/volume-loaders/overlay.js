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
 * Represents a blended volume. It does so at least in part by
 * defining its own "virtual" world space and superimposing the
 * other volumes onto this space.
 */

(function() {
  "use strict";

  var VolumeViewer = BrainBrowser.VolumeViewer;
  var image_creation_context = document.createElement("canvas").getContext("2d");

  VolumeViewer.volume_loaders.overlay = function(options, callback) {
    options = options || {};
    var volumes = options.volumes || [];

    /*
     * Initialize the header to a fairly generic setting. This allows
     * us to fully define "world coordinates" in this volume. This is
     * important if we're going to synchronize all slices on world
     * coordinates.
     */
    var header = {};
    var SIZE = 256;
    var order = ["xspace", "yspace", "zspace"];
    header.order = order;

    for (var i = 0; i < order.length; i++) {
      header[order[i]] = {};
      header[order[i]].step = 1;
      header[order[i]].start = -SIZE / 2;
      header[order[i]].direction_cosines = [0, 0, 0];
      header[order[i]].direction_cosines[i] = 1;
      header[order[i]].space_length = SIZE;
    }
    /* Use this header to create the volume object for the
     * overlay. This will set the transform and populate
     * essential member functions.
     */
    var overlay_volume = VolumeViewer.createVolume(header, []);

    overlay_volume.type = "overlay"; // Set the type.

    /* Create the three special fields the overlay contains - the base
     * size of its voxel dimensions, the list of overlaid volumes and
     * the blend ratios to apply to those volumes.
     */
    overlay_volume.size = SIZE;
    overlay_volume.volumes = [];
    overlay_volume.blend_ratios = [];

    overlay_volume.saveOriginAndTransform(header);

    /* Override the default slice function. This one does not really
     * return the data at all, since the overlay contains no data of
     * its own. It just gets references to the slices in the overlaid
     * volumes and returns a more-or-less valid slice object.
     */
    overlay_volume.slice = function(axis, slice_num, time) {
      slice_num = slice_num === undefined ? this.position[axis] : slice_num;
      time = time === undefined ? this.current_time : time;

      var slices = [];

      this.volumes.forEach(function(volume) {
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
        height_space: header[axis].height_space,
        width_space: header[axis].width_space,
        slices: slices
      };
    };

    // Get the slice image, at the requested zoom level, contrast
    // and brightness. Zoom values of less than one imply a smaller
    // image (therefore a larger field of view)
    overlay_volume.getSliceImage = function(slice, zoom, contrast, brightness) {
      zoom = zoom || 1;

      var slices = slice.slices;
      var images = [];
      var max_width = Math.round(this.size * zoom);
      var max_height = max_width;

      slices.forEach(function(slice, i) {
        var volume = overlay_volume.volumes[i];
        var color_map = volume.color_map;
        var intensity_min = volume.intensity_min;
        var intensity_max = volume.intensity_max;
        var error_message;

        if (!color_map) {
          error_message = "No color map set for this volume. Cannot render slice.";
          this.triggerEvent("error", { message: error_message });
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

        var data_length = max_width * max_height;
        var slice_data = new Uint8Array(data_length);
        var data_index = 0;

        // We need to calculate the slice coordinate in world
        // space in order to properly align the volumes.
        //
        var c_axis = getSliceCoordinate(overlay_volume, axis_space.name);

        for (var c_row = max_row-1; c_row >= min_row; c_row--) {
          for (var c_col = min_col; c_col < max_col; c_col++) {
            var wc = {};
            wc[slice.axis] = c_axis;
            wc[width_space.name] = c_col / zoom;
            wc[height_space.name] = c_row / zoom;
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
              if (data_index < data_length)
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
    };

    /* Override the getIntensityValue function. The intensity of
     * the overlaid image is defined as the mean of the individual
     * volume intensities, weighted by the blend values.
     */
    overlay_volume.getIntensityValue = function(x, y, z, time) {
      x = x === undefined ? this.position.xspace : x;
      y = y === undefined ? this.position.yspace : y;
      z = z === undefined ? this.position.zspace : z;
      time = time === undefined ? this.current_time : time;
      var values = [];

      this.volumes.forEach(function(volume) {
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
    };

    volumes.forEach(function(volume) {
      overlay_volume.volumes.push(volume);
      overlay_volume.blend_ratios.push(1 / volumes.length);
    });

    if (BrainBrowser.utils.isFunction(callback)) {
      callback(overlay_volume);
    }
  };

  // Calculates the axis coordinate in world space.
  //
  function getSliceCoordinate(volume, axis_name) {
    var vc = volume.getVoxelCoords();
    var wc = volume.voxelToWorld(vc.i, vc.j, vc.k);

    return wc[axis_name[0]];
  }


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

