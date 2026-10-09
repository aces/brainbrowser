/*
* BrainBrowser: Web-based Neurological Visualization Tools
* (https://brainbrowser.cbrain.mcgill.ca)
*
* Copyright (C) 2011-20126
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
* Loader for a single PNG loaded as a volume with one axial slice.
*/

(function() {
  "use strict";

  var VolumeViewer = BrainBrowser.VolumeViewer;

  VolumeViewer.volume_loaders.png = function(description, callback) {
    var source;
    var error_message;

    if (description.url) {
      source = description.url;
    } else if (description.file) {
      source = description.file.files[0];
      if (!source) {
        return;
      }
    } else if (description.source) {
      source = description.source;
    } else {
      error_message = "invalid volume description.\n" +
        "Description must contain the property 'url', 'file' or 'source'.";

      BrainBrowser.events.triggerEvent("error", { message: error_message });
      throw new Error(error_message);
    }

    loadImage(source, function(image) {
      createPNGVolume(description, image, callback);
    });
  };

  // Decode the source (URL, File/Blob or already loaded image) into an ImageData.
  function loadImage(source, callback) {
    var object_url = null;

    if (source instanceof HTMLImageElement || source instanceof HTMLCanvasElement) {
      callback(getImageData(source));
      return;
    }

    var image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = function() {
      if (object_url) {
        URL.revokeObjectURL(object_url);
      }
      callback(getImageData(image));
    };
    image.onerror = function() {
      if (object_url) {
        URL.revokeObjectURL(object_url);
      }
      BrainBrowser.events.triggerEvent("error", { message: "Unable to decode image: " + (source.name || source) });
    };

    if (typeof source === "string") {
      image.src = source;
    } else {
      object_url = URL.createObjectURL(source);
      image.src  = object_url;
    }
  }

  function getImageData(image) {
    var width  = image.naturalWidth  || image.width;
    var height = image.naturalHeight || image.height;

    var canvas    = document.createElement("canvas");
    canvas.width  = width;
    canvas.height = height;
    var context   = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    return context.getImageData(0, 0, width, height);
  }

  // Under 1% of the image is colored BB consider as gray
  function isGrayscale(image) {
    var data = image.data;
    var colored = 0;

    for (var i = 0; i < data.length; i += 4) {
      var r = data[i + 0];
      var g = data[i + 1];
      var b = data[i + 2];
      if (Math.max(r, g, b) - Math.min(r, g, b) > 16) {
        colored++;
      }
    }

    return colored <= (data.length / 4) * 0.01;
  }

  function createPNGHeader(description, image) {
    var step   = description.step || {};
    var width  = image.width;
    var height = image.height;

    // Same layout as MINC: z is the slowest varying axis, x the fastest.
    var header = {
      order: ["zspace", "yspace", "xspace"],
      xspace: { space_length: width,  step: step.x || 1, direction_cosines: [1, 0, 0] },
      yspace: { space_length: height, step: step.y || 1, direction_cosines: [0, 1, 0] },
      zspace: { space_length: 1,      step: step.z || 1, direction_cosines: [0, 0, 1] }
    };

    // Center the image on the world origin.
    ["xspace", "yspace", "zspace"].forEach(function(axis) {
      header[axis].start = -header[axis].step * (header[axis].space_length - 1) / 2;
    });

    header.zspace.offset = width * height;
    header.yspace.offset = width;
    header.xspace.offset = 1;

    header.datatype = isGrayscale(image) ? "uint8" : "rgb8";

    return header;
  }

  function createPNGData(header, image) {
    var width   = header.xspace.space_length;
    var height  = header.yspace.space_length;
    var is_gray = header.datatype === "uint8";
    var native_data = is_gray ? new Uint8Array( width * height) :
                                new Uint32Array(width * height);

    var bytes  = new Uint8Array(native_data.buffer);
    var pixels = image.data;
    var row, col, src, dst;

    for (row = 0; row < height; row++) {
      dst = (height - row - 1) * width;
      src = row * width * 4;

      for (col = 0; col < width; col++, dst++, src += 4) {
        if (is_gray) {
          // based on luma 601
          bytes[dst] = Math.round(0.299 * pixels[src + 0] +
                                  0.587 * pixels[src + 1] +
                                  0.114 * pixels[src + 2]);
        } else {
          bytes[dst * 4 + 0] = pixels[src + 0];
          bytes[dst * 4 + 1] = pixels[src + 1];
          bytes[dst * 4 + 2] = pixels[src + 2];
          bytes[dst * 4 + 3] = 255;
        }
      }
    }

    if (is_gray) {
      VolumeViewer.utils.scanDataRange(native_data, header);
    } else {
      header.voxel_min = 0;
      header.voxel_max = 255;
    }

    return native_data;
  }

  function createPNGVolume(description, image, callback) {
    var header = createPNGHeader(description, image);

    if (!description.views) {
      description.views = ["zspace"];
    }

    var data    = createPNGData(header, image);
    var volume  = VolumeViewer.createVolume(header, data);
    volume.type = "png";
    volume.intensity_min = header.voxel_min;
    volume.intensity_max = header.voxel_max;
    volume.saveOriginAndTransform(header);
    if (BrainBrowser.utils.isFunction(callback)) {
      callback(volume);
    }
  }

}());
