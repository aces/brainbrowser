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
* @doc overview
* @name index
*
* @description
* The BrainBrowser Volume Viewer is a tool for navigating 3D minc volumes. 
* Basic usage consists of calling the **start()** method of the **VolumeViewer** module, 
* which takes a callback function as its second argument, and then using the **viewer** object passed
* to that callback function to set up interaction with the viewr:
*  ```js
*    BrainBrowser.VolumeViewer.start("brainbrowser", function(viewer) {
*   
*     // Add an event listener.
*     viewer.addEventListener("ready", function() {
*       console.log("Viewer is ready!");
*     });
*     
*     // Load minc volumes.
*     viewer.loadVolumes({
*       volumes: [
*         {
*           type: 'minc',
*           filename: 'volume1.mnc'
*         },
*         {
*           type: 'minc',
*           filename: 'volume2.mnc'
*         }
*       ],
*       overlay: true
*     });
*   });
*  ```
*/
/**
* @doc object
* @name Events
*
* @description
* The Surface Viewer event model can be used to listen for certain events 
* occuring of the lifetime of a viewer. Currently, the following viewer events can be listened for:
* 
* * **ready** Viewer is completely loaded and ready to be manipulated.
* * **sliceupdate** A new slice has been rendered to the viewer.
*
* To listen for an event, simply use the viewer's **addEventListener()** method with 
* with the event name and a callback funtion:
*
* ```js
*    viewer.addEventListener("sliceupdate", function() {
*      console.log("Slice updated!");
*    });
*
* ```
*/
/**
* @doc object
* @name Events.events:ready
*
* @description
* Triggered when the viewer is fully loaded and ready for interaction.
* The event handler receives no arguments.
*
* ```js
*    viewer.addEventListener("ready", function() {
*      //...
*    });
* ```
*/
/**
* @doc object
* @name Events.events:sliceupdate
*
* @description
* Triggered when the slice currently being displayed is updated.
* The event handler receives no arguments.
*
* ```js
*    viewer.addEventListener("sliceupdate", function() {
*      //...
*    });
* ```
*/

(function() {
  "use strict";
  
  var BrainBrowser = window.BrainBrowser = window.BrainBrowser || {};

  var VolumeViewer = BrainBrowser.VolumeViewer = {};

  VolumeViewer.volumeType = {};
  VolumeViewer.colorScales = [];
  VolumeViewer.modules = {};
  

  /**
  *  @doc function
  *  @name start
  *  @param {string} element_id ID of the DOM element 
  *  in which the viewer will be inserted.
  *  @param {function} callback Callback function to which the viewer object
  *  will be passed after creation.
  *  @description
  *  The start() function is the main point of entry to the Volume Viewer.
  *  It creates a viewer object that is then passed to the callback function 
  *  supplied by the user.
  *
  *  ```js
  *    BrainBrowser.VolumeViewer.start("brainbrowser", function(viewer) {
  *    
  *      // Add an event listener.
  *      viewer.addEventListener("ready", function() {
  *        console.log("Viewer is ready!");
  *      });
  *      
  *      // Load minc volumes.
  *      viewer.loadVolumes({
  *        volumes: [
  *          {
  *            type: 'minc',
  *            filename: 'volume1.mnc'
  *          },
  *          {
  *            type: 'minc',
  *            filename: 'volume2.mnc'
  *          }
  *        ],
  *        overlay: true
  *      });
  *    });
  *  ```
  */
  VolumeViewer.start = function(element_id, callback) {
    var volumes = [];
    var container;
    var viewer_element;
    var sliceHeight;
    var sliceWidth;
    var numVolumes;
    var cachedSlices = [];
    var axis_to_number = {
      xspace: 0,
      yspace: 1,
      zspace: 2
    };
    
    /**
    * @doc object
    * @name viewer
    * @property {array} volumes Array of object representing volumes to be displayed.
    * @property {array} displays Array of objects representing the display areas.
    * @property {boolean} synced Are the cursors being synced across volumes? 
    * @property {number} default_zoom_level The default zoom level for the viewer.
    *
    * @description
    * The viewer object encapsulates all functionality of the Surface Viewer.
    */
    var viewer = { 
      volumes: volumes,
      displays: [],
      synced: false,
      default_zoom_level: 1
    };

    /**
    * @doc function
    * @name viewer.events:addEventListener
    * @param {string} e The event name.
    * @param {function} fn The event handler. 
    *
    * @description
    * Add an event handler to handle event **e**.
    */
    /**
    * @doc function
    * @name viewer.events:triggerEvent
    * @param {string} e The event name. 
    *
    * @description
    * Trigger all handlers associated with event **e**.
    * Any arguments after the first will be passed to the 
    * event handler.
    */
    BrainBrowser.utils.eventModel(viewer);
    
    Object.keys(VolumeViewer.modules).forEach(function(m) {
      VolumeViewer.modules[m](viewer);
    });

    console.log("BrainBrowser Volume Viewer v" + BrainBrowser.version);

    /////////////////////////
    // PRIVATE FUNCTIONS
    /////////////////////////
     
    // Open volume using appropriate volume loader
    function openVolume(volume_description, callback){
      var loader = VolumeViewer.volumeType[volume_description.type];
      if(loader){
        loader(volume_description, callback);
      } else {
        throw new Error("Unsuported Volume Type");
      }
    }
  
    
    // Initialize the viewer with first slices
    function startViewer() {
      var i;
      var div;
      var volume;
      var slices;
      var k;

      numVolumes = volumes.length;
      sliceWidth = 300;
      sliceHeight = 300;
      
      if (viewer.globalUIControls) {
        if (viewer.globalUIControls.defer_until_page_load) {
          viewer.addEventListener("ready", function() {
            viewer.globalUIControls(viewer_element);
          });
        } else {
          viewer.globalUIControls(viewer_element);
        }
      }
      
      viewer.setupInterface();
      for(i = 0; i < numVolumes; i++) {

        div = document.createElement("div");
        volume = volumes[i];
        slices = [];
        
        div.classList.add("volume-container");
        viewer_element.appendChild(div);
        viewer.displays.push(viewer.addVolumeInterface(div, volumes[i], i));
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
      
      container.appendChild(viewer_element);
      viewer.triggerEvent("ready");
      viewer.triggerEvent("sliceupdate");
      
      viewer.draw();
    }

    /**
    * @doc function
    * @name viewer.volumes:loadVolumes
    * @param {object} options Description of volumes to load:
    * * **volumes** {array} An array of volume descriptions.
    * * **overlay** {boolean} Create a display overlaying the other loaded volumes?
    *
    * @description
    * Initial load of volumes. Usage: 
    *  ```js
    *    BrainBrowser.VolumeViewer.start("brainbrowser", function(viewer) {
    *    
    *      // Add an event listener.
    *      viewer.addEventListener("ready", function() {
    *        console.log("Viewer is ready!");
    *      });
    *      
    *      // Load minc volumes.
    *      viewer.loadVolumes({
    *        volumes: [
    *          {
    *            type: 'minc',
    *            filename: 'volume1.mnc'
    *          },
    *          {
    *            type: 'minc',
    *            filename: 'volume2.mnc'
    *          }
    *        ],
    *        overlay: true
    *      });
    *    });
    * ```
    * 
    */
    viewer.loadVolumes = function(options) {
      options = options || {};
      
      container = document.getElementById(element_id);
      viewer_element = document.createElement("div");
      viewer_element.id = "volume-viewer";
      
      var volume_descriptions = options.volumes;
      var num_descriptions = options.volumes.length;

      var config = BrainBrowser.config.volume_viewer;
      var color_scale = config.color_scales[0];

      VolumeViewer.loader.loadColorScaleFromUrl(
        color_scale.url,
        color_scale.name,
        function(scale) {
          var num_loaded = 0;
          var i;
          
          scale.crosshair_color = color_scale.crosshair_color;
          viewer.defaultScale = scale;
          VolumeViewer.colorScales[0] = scale;
          
          function loadVolume(i) {
            openVolume(volume_descriptions[i], function(volume) {
              volume.position = {};
              volumes[i] = volume;
              if (++num_loaded < num_descriptions) {
                return;
              }
              if (options.overlay && num_descriptions > 1) {
                openVolume({
                    volumes: viewer.volumes,
                    type: 'multivolume'
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

      config.color_scales.slice(1).forEach(function(cs, i) {
        VolumeViewer.loader.loadColorScaleFromUrl(
          cs.url,
          cs.name,
          function(scale) {
            scale.crosshair_color = cs.crosshair_color;
            VolumeViewer.colorScales[i+1] = scale;
          }
        );
      });
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
      var i;
      
      for (i = 0; i < 3; i++) {
        viewer.updateSlice(volume_num, i, slices[i]);
      }
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
    viewer.updateSlice = function(volume_num, axis_num, slice) {
      var widthSpace = slice.x;
      var heightSpace = slice.y;
      
      var cached_slice = cachedSlices[volume_num][axis_num] || {
        widthSpace: widthSpace,
        heightSpace: heightSpace,
      };
      var display = viewer.displays[volume_num][axis_num];
      
      cached_slice.image = slice.getImage(display.zoom);
      cachedSlices[volume_num][axis_num] = cached_slice;
      
      display.slice = cached_slice;
      display.updateCursor(volumes[volume_num]);
    };
  
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
            display.drawCrosshair(context, color_scale.crosshair_color, zoom);
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
    * @doc function
    * @name viewer.volumes:redrawVolume
    * @param {number} volume_num Index of the volume.
    *
    * @description
    * Redraw the volume at its current position.
    */
    viewer.redrawVolume = function(volume_num) {
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

      for(i = 0, count = volumes.length; i < count; i++) {
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
    viewer.renderSlice = function(volume_num, axis_name, slice_num) {
      var volume = volumes[volume_num];
      var slice;
      var axis_number = axis_to_number[axis_name];
      
      if (slice_num === undefined) {
        slice_num = volume.position[axis_name];
      }
      
      slice = volume.slice(axis_name, slice_num, volume.current_time);
      slice.volID = volume_num;
      slice.axis_number = axis_number;
      volume.position[axis_name] = slice_num;
  
      slice.min = volume.min;
      slice.max = volume.max;
      viewer.updateSlice(volume_num, slice.axis_number, slice);
          
      viewer.triggerEvent("sliceupdate");

      viewer.draw();
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
    viewer.setCursor = function(volume_num, axis_num, cursor) {
      var slice = cachedSlices[volume_num][axis_num];
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

    callback(viewer);
  };
})();

