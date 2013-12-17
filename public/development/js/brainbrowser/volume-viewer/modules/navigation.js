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
 * WARRANTIES OF MERCHANTABILITY AND FITNEstSS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL McGill University  BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/*
* @author: Tarek Sherif
*/

BrainBrowser.VolumeViewer.modules.navigation = function(viewer) {
  "use strict";
  
  var axis_to_number = {
    xspace: 0,
    yspace: 1,
    zspace: 2
  };


  /**
  * @doc function
  * @name viewer.volumes:updateVolume
  * @param {number} volume_num Index of the volume.
  * @param {array} slices slices Slice to update.
  *
  * @description
  * Update a volume with the given slices.
  * 
  */
  viewer.updateVolume = function(volume_num, slices) {

    ["xspace", "yspace", "zspace"].forEach(function(axis, i) {
      viewer.updateSlice(volume_num, axis, slices[i]);
    });

  };

  /**
  * @doc function
  * @name viewer.volumes:updateSlice
  * @param {number} volume_num Index of the volume.
  * @param {number} axis_num Volume axis to update.
  * @param {object} slice The slice to update with.
  *
  * @description
  * Update slice in volume.
  */
  viewer.updateSlice = function(volume_num, axis_name, slice) {
    var widthSpace = slice.x;
    var heightSpace = slice.y;
    var axis_num = axis_to_number[axis_name];
    
    var cached_slice = viewer.cachedSlices[volume_num][axis_num] || {
      widthSpace: widthSpace,
      heightSpace: heightSpace,
    };
    var display = viewer.displays[volume_num][axis_num];
    
    cached_slice.image = slice.getImage(display.zoom);
    viewer.cachedSlices[volume_num][axis_num] = cached_slice;
    
    display.slice = cached_slice;
    display.updateCursor();
  };

  /**
  * @doc function
  * @name viewer.volumes:redrawVolume
  * @param {number} volume_num Index of the volume.
  *
  * @description
  * Redraw the volume at its current position.
  */
  viewer.redrawVolume = function(volume_num) {
    var volumes = viewer.volumes;

    viewer.renderSlice(volume_num, "xspace", volumes[volume_num].position.xspace);
    viewer.renderSlice(volume_num, "yspace", volumes[volume_num].position.yspace);
    viewer.renderSlice(volume_num, "zspace", volumes[volume_num].position.zspace);
  };

  /**
  * @doc function
  * @name viewer.volumes:redrawVolumes
  *
  * @description
  * Redraw all volumes at their current position.
  */
  viewer.redrawVolumes = function() {
    var i, count;

    for(i = 0, count = viewer.volumes.length; i < count; i++) {
      viewer.redrawVolume(i);
    }
  };

 /**
  * @doc function
  * @name viewer.volumes:renderSlice
  * @param {number} volume_num Index of the volume where the slice is being rendered.
  * @param {string} axis_name Name of the axis where the slice is being rendered.
  * @param {number} slice_num Index of the slice to render.
  *
  * @description
  * Render a new slice on the given volume and axis.
  */

  // Keep track of timers.
  // renderSlice() is an expensive operation so 
  // we call it asynchronously and don't want to 
  // call it unnecessarily.
  var timeouts = {};

  viewer.renderSlice = function(volume_num, axis_name, slice_num) {
    timeouts[volume_num] = timeouts[volume_num] || {};
    
    clearTimeout(timeouts[volume_num][axis_name]);

    timeouts[volume_num][axis_name] = setTimeout(function() {
      var volume = viewer.volumes[volume_num];
      var slice;
      var axis_num = axis_to_number[axis_name];
      
      if (slice_num === undefined) {
        slice_num = volume.position[axis_name];
      }
      
      slice = volume.slice(axis_name, slice_num, volume.current_time);
      slice.volID = volume_num;
      slice.axis_number = axis_num;
      volume.position[axis_name] = slice_num;

      slice.min = volume.min;
      slice.max = volume.max;
      viewer.updateSlice(volume_num, axis_name, slice);
          
      viewer.triggerEvent("sliceupdate");
    }, 0);
  };

  /**
  * @doc function
  * @name viewer.volumes:setCursor
  * @param {number} volume_num Index of the volume.
  * @param {number} axis_num Volume axis to update.
  * @param {object} cursor Object containing the x and y coordinates of the 
  * cursor.
  *
  * @description
  * Set the cursor to a new position in the given volume and axis.
  */
  viewer.setCursor = function(volume_num, axis_name, cursor) {
    var axis_num = axis_to_number[axis_name];
    var slice = viewer.cachedSlices[volume_num][axis_num];
    var display = viewer.displays[volume_num][axis_num];
    var image_origin = display.getImageOrigin();
    var zoom = display.zoom;
    var x, y;
    
    display.cursor.x = cursor.x;
    display.cursor.y = cursor.y;

    if (cursor) {
      x = Math.floor((cursor.x - image_origin.x) / zoom / Math.abs(slice.widthSpace.step));
      y = Math.floor(slice.heightSpace.space_length - (cursor.y - image_origin.y) / zoom  / Math.abs(slice.heightSpace.step));
    } else {
      x = null;
      y = null;
    }

    viewer.renderSlice(volume_num, slice.widthSpace.name, x);
    viewer.renderSlice(volume_num, slice.heightSpace.name, y);
  };
};

