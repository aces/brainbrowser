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


(function() {
  "use strict";
  
  var BrainCanvas = window.BrainCanvas = {};

  BrainCanvas.utilities = {};
  BrainCanvas.volumeType = {};
  BrainCanvas.colorScales = [];
  BrainCanvas.event_listeners = {};
  
  BrainCanvas.addEventListener = function(e, fn) {
    if (!BrainCanvas.event_listeners[e]) {
      BrainCanvas.event_listeners[e] = [];
    }
    
    BrainCanvas.event_listeners[e].push(fn);
  };
  
  BrainCanvas.triggerEvent = function(e) {
    if (BrainCanvas.event_listeners[e]) {
      BrainCanvas.event_listeners[e].forEach(function(fn) {
        fn();
      });
    }
  };
  
  BrainCanvas.viewer = function(containerID, opts) {
    var viewer = {};
    var volumes = [];
    var container;
    var braincanvas_element;
    var sliceHeight;
    var sliceWidth;
    var numVolumes;
    var cachedSlices = [];
    var axis_to_number = {
      xspace: 0,
      yspace: 1,
      zspace: 2
    };
  
    viewer.volumes = volumes;
    viewer.displays = [];
    viewer.synced = false;
    viewer.default_zoom_level = 1;
  
     /**
     * Open volume using appropriate volume loader
     * @param {Object} Volume description of the volume to load
     */
    function openVolume(volume, callback){
      var loader = BrainCanvas.volumeType[volume.type];
      if(loader){
        loader(volume, callback);
      } else {
        throw new Error("Unsuported Volume Type");
      }
    }
  
  
    /**
     * Initialize viewer instance
     * @param container Id of the element to contain the viewer
     * @param{Object} Options options
     *
     * Options:
     *   multi: used to view multiple volumes at a time (default: false)
     *   horizontal: should the volume be displayer horizontally (default: false)
     */
    function init(containerID, opts) {
      opts = opts || {};
      
      container = document.getElementById(containerID);
      braincanvas_element = document.createElement("div");
      braincanvas_element.id = "braincanvas";
      
      var volume_descriptions = opts.volumes;
      var num_descriptions = opts.volumes.length;
    
      BrainCanvas.loader.loadColorScaleFromUrl(
        '/color_scales/spectral.txt',
        'Spectral',
        function(scale) {
          var num_loaded = 0;
          var i;
          
          scale.cross_hair_color = "#FFFFFF";
          viewer.defaultScale = scale;
          BrainCanvas.colorScales[0] = scale;
          
          function loadVolume(i) {
            openVolume(volume_descriptions[i], function(volume) {
              volume.position = {};
              volumes[i] = volume;
              if (++num_loaded < num_descriptions) {
                return;
              }
              if (opts.overlay) {
                openVolume({
                    volumes: viewer.volumes,
                    type: 'multiVolume'
                  },
                  function(volume) {
                    volume.position = {};
                    volumes.push(volume);
                    startViewer();
                  }
                );
              } else {
                startViewer();
              }
            });
          }
          
          for (i = 0; i < num_descriptions; i++) {
            loadVolume(i);
          }
        }
      );
      
      BrainCanvas.loader.loadColorScaleFromUrl(
        '/color_scales/thermal.txt',
        'Thermal',
        function(scale) {
          scale.cross_hair_color = "#FFFFFF";
          BrainCanvas.colorScales[1] = scale;
        }
      );
      
      BrainCanvas.loader.loadColorScaleFromUrl(
        '/color_scales/gray_scale.txt',
        'Gray',
        function(scale){
          BrainCanvas.colorScales[2] = scale;
        }
      );
      
      BrainCanvas.loader.loadColorScaleFromUrl(
        '/color_scales/blue.txt',
        'Blue',
        function(scale){
          scale.cross_hair_color = "#FFFFFF";
          BrainCanvas.colorScales[3] = scale;
        }
      );
      
      BrainCanvas.loader.loadColorScaleFromUrl(
        '/color_scales/green.txt',
        'Green',
        function(scale){
          BrainCanvas.colorScales[4] = scale;
        }
      );
    }
  
    /*
     * Initialize the viewer with first slices
     */
    var startViewer = function() {
      var i;
      var div;
      var volume;
      var slices;
      var k;
      
      numVolumes = volumes.length;
      sliceWidth = 300;
      sliceHeight = 300;
      
      if (BrainCanvas.globalUIControls) {
        if (BrainCanvas.volumeUIControls.defer_until_page_load) {
          BrainCanvas.addEventListener("ready", function() {
            BrainCanvas.globalUIControls(braincanvas_element, viewer);
          });
        } else {
          BrainCanvas.globalUIControls(braincanvas_element, viewer);
        }
      }
      
      BrainCanvas.setupUI(viewer);
      for(i = 0; i < numVolumes; i++) {

        div = document.createElement("div");
        volume = volumes[i];
        slices = [];
        
        div.classList.add("volume-container");
        braincanvas_element.appendChild(div);
        viewer.displays.push(BrainCanvas.addCanvasUI(div, viewer, volumes[i], i));
        cachedSlices[i] = [];
        
        volume.position.xspace = parseInt(volume.header.xspace.space_length/2, 10);
        volume.position.yspace = parseInt(volume.header.yspace.space_length/2, 10);
        volume.position.zspace = parseInt(volume.header.zspace.space_length/2, 10);
  
        slices.push(volume.slice('xspace', volume.position.xspace));
        slices.push(volume.slice('yspace', volume.position.yspace));
        slices.push(volume.slice('zspace', volume.position.zspace));
        for ( k = 0; k < 3; k++ ) {
          slices[k].volID = i;
          slices[k].axis_number = k;
          slices[k].min = volume.min;
          slices[k].max = volume.max;
        }
        viewer.updateVolume(i, slices);
      }
      
      container.appendChild(braincanvas_element);
      BrainCanvas.triggerEvent("ready");
      BrainCanvas.triggerEvent("sliceupdate");
      
      viewer.draw();
    };
    
    viewer.updateVolume = function(volumeNum, slices) {
      var i, slice;
      
      for (i = 0; i < 3; i++) {
        slice = slices[i];
        viewer.updateSlice(volumeNum, i, slice);
      }
    };
  
    /**
     * Redraw volume with current position
     *
     * @param {Number} volNum
     *
     */
    viewer.redrawVolume = function(volNum) {
      viewer.updateSlices(volNum, "xspace", volumes[volNum].position.xspace);
      viewer.updateSlices(volNum, "yspace", volumes[volNum].position.yspace);
      viewer.updateSlices(volNum, "zspace", volumes[volNum].position.zspace);
    };
  
    viewer.redrawVolumes = function() {
      for(var i = 0; i < volumes.length; i++) {
        viewer.redrawVolume(i);
      }
    };
  
    /**
     * update slice for volume
     * @param {Number} VolID id of the volume
     * @param {Object} coord
     */
    viewer.updateSlices = function(volID, axis, slice_number) {
      var volume = volumes[volID];
      var slice;
      var axis_number = axis_to_number[axis];
      
      if (slice_number === undefined) {
        slice_number = volume.position[axis];
      }
      
      slice = volume.slice(axis, slice_number, volume.current_time);
      slice.volID = volID;
      slice.axis_number = axis_number;
      volume.position[axis] = slice_number;
  
      //slice.startx = 0;
      //slice.starty = 0;
      slice.min = volume.min;
      slice.max = volume.max;
      viewer.updateSlice(volID, slice.axis_number, slice);
          
      BrainCanvas.triggerEvent("sliceupdate");
      viewer.draw();
    };
    
    /**
     * Update a slice to canvas
     * @param {VolumeNum} VolumeNum number of the volume to which the slice belongs
     * @param {Number} startx initial x position of the slice (if translated) default 0
     * @param {Number} starty initial y position of the slice (if translated) default 0
     * @param {BrainBrowser.ColorScale} colorScale colors to use for the image
     * @param {Array} imageData intensity data for the slice
     */
    viewer.updateSlice = function(volumeNum, axis_number, slice_set) {
      var i = 0;
      var numSlices = slice_set.length;
      var images = [];
      var widthSpace = slice_set.x;
      var heightSpace = slice_set.y;
      var slice;
      var maxWidth, maxHeight;
      var finalImageData;
      var context = document.createElement("canvas").getContext("2d");
      var cached_slice = cachedSlices[volumeNum][axis_number] || {
        widthSpace: widthSpace,
        heightSpace: heightSpace,
      };
      var display = viewer.displays[volumeNum][axis_number];
      
      for (i = 0; i < numSlices; i++) {
  
        slice = slice_set[i];
  
        var colorScale = slice.colorScale;
        var imageData = context.createImageData(slice.width, slice.height);
        colorScale.colorizeArray(slice.data, slice.min, slice.max, true, 0, 1, slice.alpha, imageData.data);
  
        var xstep = slice.x.step;
        var ystep = slice.y.step;
        //console.log("xstep: " +xstep);
        //console.log("ystep: " +ystep);
        imageData = nearestNeighboor(imageData, Math.floor(slice.width * xstep * display.zoom), Math.floor(slice.height * ystep * display.zoom));
        
        images.push(imageData);
      }
      
      //Getting the maximum width and height of all the images to output an images that cover them all.
      maxWidth = Math.max.apply(null, images.map(function(image) { return image.width; }));
      maxHeight = Math.max.apply(null, images.map(function(image) { return image.height; }));
      
      
      finalImageData = context.createImageData(maxWidth, maxHeight);
      
      finalImageData = blendImages(images, finalImageData);
      
      cached_slice.image = finalImageData;
      cachedSlices[volumeNum][axis_number] = cached_slice;
      
      display.slice = cached_slice;
      display.updateCursor(volumes[volumeNum]);
      
    };
  
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
  
    viewer.draw = function draw() {
      var slice;
      var context;
      var canvas;
      var zoom;
      var frame_width = 4;
      var half_frame_width = frame_width/2;
      var color_scale;
  
      volumes.forEach(function(volume, i) {
        viewer.displays[i].forEach(function(display, display_num) {
          canvas = display.canvas;
          context = display.context;
          zoom = display.zoom;
          volume = volumes[i];
          context.globalAlpha = 255;
          context.clearRect(0, 0, canvas.width, canvas.height);
          //draw slices in order
          slice = cachedSlices[i][display_num];
          if (slice){
            color_scale = volume.colorScale || viewer.defaultScale;
            display.drawSlice(context, slice);
            display.drawCrosshair(context, color_scale.cross_hair_color, zoom);
          }
          if (canvas === viewer.active_canvas) {
            context.save();
            context.strokeStyle = "#EC2121";
            context.lineWidth = frame_width;
            context.strokeRect(
              half_frame_width,
              half_frame_width,
              canvas.width - frame_width,
              canvas.height - frame_width
            );
            context.restore();
          }
        });
      });
    };
  
    /**
     * Slice updating on click
     */
    viewer.getSlices = function(cursor, volID, axis_num) {
      var slice = cachedSlices[volID][axis_num];
      var display = viewer.displays[volID][axis_num];
      var image_origin = display.getImageOrigin();
      var zoom = display.zoom;
      var x, y;
      
      display.cursor.x = cursor.x;
      display.cursor.y = cursor.y;
      
  
      if (cursor) {
        x =  Math.floor((cursor.x - image_origin.x) / zoom / Math.abs(slice.widthSpace.step));
        y  = Math.floor(slice.heightSpace.space_length - (cursor.y - image_origin.y) / zoom  / Math.abs(slice.heightSpace.step));
      } else {
        x = null;
        y = null;
      }
  
      viewer.updateSlices(volID, slice.widthSpace.name, x);
      viewer.updateSlices(volID, slice.heightSpace.name, y);
  
    };
  
    init(containerID, opts);
  };
})();

