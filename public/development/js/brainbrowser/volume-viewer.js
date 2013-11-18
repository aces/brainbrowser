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
* @doc overview
* @name Configuration
*
* @description
* The Volume Viewer is configured by defining the object **BrainBrowser.config.volume_viewer**.
* Currently the only properties available for configuration are the color scales which are configured
* to define their name, the URL at which the color scale file is located, and, optionally, the color
* to use for the cursor when the defined color scale is active:
*
```js
* BrainBrowser.config = {
*
*   volume_viewer: {
*     color_scales: [
*       {
*         name: "Spectral",
*         url: "/color_scales/spectral.txt",
*         cursor_color: "#FFFFFF"
*       },
*       {
*         name: "Gray",
*         url: "/color_scales/gray_scale.txt",
*         cursor_color: "#FF0000"
*       }
*     ]
*   }
*
* }
* ```
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
      default_zoom_level: 1,
      cachedSlices: []
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
      
      setupInterface();
      for(i = 0; i < numVolumes; i++) {

        div = document.createElement("div");
        volume = volumes[i];
        slices = [];
        
        div.classList.add("volume-container");
        viewer_element.appendChild(div);
        viewer.displays.push(addVolumeInterface(div, volumes[i], i));
        viewer.cachedSlices[i] = [];
        
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

    // Set up global keyboard interactions.
    function setupInterface() {
      document.addEventListener("keydown", function(e) {
        if (!viewer.active_canvas) return;
        var canvas = viewer.active_canvas;
      
        var keyCode = e.which;
        if (keyCode < 37 || keyCode > 40) return;
        
        e.preventDefault();
        e.stopPropagation();

        var cursor = viewer.active_cursor;
        var volID = canvas.getAttribute("data-volume-id");
        var axis_name = canvas.getAttribute("data-axis-name");
        
        ({
          37: function() { cursor.x--; }, // Left
          38: function() { cursor.y--; }, // Up
          39: function() { cursor.x++; }, // Right
          40: function() { cursor.y++; }  // Down
        })[keyCode]();
        
        viewer.setCursor(volID, axis_name, cursor);
        
        if (viewer.synced){
          viewer.displays.forEach(function(display, synced_vol_id) {
            if (synced_vol_id !== volID) {
              viewer.setCursor(synced_vol_id, axis_name, cursor);
            }
          });
        }
        
        return false;
      }, false);
    }
      
    // Create canvases and add mouse interface.
    function addVolumeInterface(div, volume, volID) {
      var displays = [];
      
      function captureMouse(canvas) {
        var mouse = {x: 0, y: 0};

        canvas.addEventListener("mousemove", function(e) {
          var offset = BrainBrowser.utils.getOffset(canvas);
          var x, y;

          if (e.pageX !== undefined) {
            x = e.pageX;
            y = e.pageY;
          } else {
            x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
          }

          mouse.x = x - offset.left;
          mouse.y = y - offset.top;
        }, false);
        return mouse;
      }
      
      ["xspace", "yspace", "zspace"].forEach(function(axis_name) {
        var canvas = document.createElement("canvas");
        var context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 256;
        canvas.setAttribute("data-volume-id", volID);
        canvas.setAttribute("data-axis-name", axis_name);
        canvas.classList.add("slice-display");
        canvas.style.backgroundColor = "#000000";
        div.appendChild(canvas);
        context.clearRect(0, 0, canvas.width, canvas.height);
        displays.push(
          VolumeViewer.display({
            volume: volume,
            axis: axis_name,
            canvas: canvas,
            context: context,
            cursor: {
              x: canvas.width / 2,
              y: canvas.height / 2
            },
            image_center: {
              x: canvas.width / 2,
              y: canvas.height / 2
            },
            mouse: captureMouse(canvas),
            zoom: viewer.default_zoom_level,
          })
        );
      });
      
      if (viewer.volumeUIControls) {
        var controls  = document.createElement("div");
        controls.className = "volume-viewer-controls volume-controls";
        if (viewer.volumeUIControls.defer_until_page_load) {
          viewer.addEventListener("ready", function() {
            div.appendChild(controls);
            viewer.volumeUIControls(controls, volume, volID);
          });
        } else {
          viewer.volumeUIControls(controls, volume, volID);
          div.appendChild(controls);
        }
      }
    
      /**********************************
      * Mouse Events
      **********************************/
      
      
      (function() {
        var current_target = null;
        
        ["xspace", "yspace", "zspace"].forEach(function(axis_name, slice_num) {
          var display = displays[slice_num];
          var canvas = display.canvas;
          var mouse = display.mouse;
          
          function drag(e) {
            var cursor = {
              x: mouse.x,
              y: mouse.y
            };
            
            function translate(d) {
              var dx, dy;
              dx = cursor.x - d.last_cursor.x;
              dy = cursor.y - d.last_cursor.y;
              d.image_center.x += dx;
              d.image_center.y += dy;
              d.cursor.x += dx;
              d.cursor.y += dy;
              d.last_cursor.x = cursor.x;
              d.last_cursor.y = cursor.y;
            }
                    
            if(e.target === current_target) {
              if(e.shiftKey) {
                translate(display);
                if (viewer.synced){
                  viewer.displays.forEach(function(display, synced_vol_id) {
                    if (synced_vol_id !== volID) {
                      translate(display[slice_num]);
                    }
                  });
                }
              } else {
                viewer.setCursor(volID, axis_name, cursor);
                if (viewer.synced){
                  viewer.displays.forEach(function(display, synced_vol_id) {
                    if (synced_vol_id !== volID) {
                      viewer.setCursor(synced_vol_id, axis_name, cursor);
                    }
                  });
                }
                display.cursor = viewer.active_cursor = cursor;
              }
              viewer.draw();
            }
          }
          
          function stopDrag() {
            document.removeEventListener("mousemove", drag, false);
            document.removeEventListener("mouseup", stopDrag, false);
            current_target = null;
          }
          
          canvas.addEventListener("mousedown", function startDrag(e) {
            current_target = e.target;
            var cursor = {
              x: mouse.x,
              y: mouse.y
            };

            e.preventDefault();
            e.stopPropagation();
            
            if (e.shiftKey) {
              display.last_cursor.x = cursor.x;
              display.last_cursor.y = cursor.y;
              if (viewer.synced){
                viewer.displays.forEach(function(display, synced_vol_id) {
                  if (synced_vol_id !== volID) {
                    var d = display[slice_num];
                    d.last_cursor.x = cursor.x;
                    d.last_cursor.y = cursor.y;
                  }
                });
              }
            } else {
              viewer.setCursor(volID, axis_name, cursor);
              if (viewer.synced){
                viewer.displays.forEach(function(display, synced_vol_id) {
                  if (synced_vol_id !== volID) {
                    viewer.setCursor(synced_vol_id, axis_name, cursor);
                  }
                });
              }
              display.cursor = viewer.active_cursor = cursor;
            }
            viewer.active_canvas = e.target;
            document.addEventListener("mousemove", drag, false);
            document.addEventListener("mouseup", stopDrag, false);
            
            viewer.draw();

          }, false);
          
          function wheelHandler(e) {
            var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));

            e.preventDefault();
            e.stopPropagation();

            display.zoom = Math.max(display.zoom + delta * 0.05, 0.05);
            
            viewer.renderSlice(volID, ["xspace", "yspace", "zspace"][slice_num]);
            if (viewer.synced){
              viewer.displays.forEach(function(display, synced_vol_id) {
                if (synced_vol_id !== volID) {
                  var d = display[slice_num];
                  d.zoom = Math.max(d.zoom + delta * 0.05, 0.05);
                  viewer.renderSlice(synced_vol_id, ["xspace", "yspace", "zspace"][slice_num]);
                }
              });
            }
          }

          canvas.addEventListener("mousewheel", wheelHandler, false);
          canvas.addEventListener("DOMMouseScroll", wheelHandler, false); // Dammit Firefox
        });
      })();
      
      
      return displays;
    }

    /**
    * @doc function
    * @name viewer.viewer:loadVolumes
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
    *            filename: 'volume1.mnc',
    *            header_params:  { get_headers: true },
    *            raw_data_params: { get_raw_data: true }
    *          },
    *          {
    *            type: 'minc',
    *            filename: 'volume2.mnc',
    *            header_params:  { get_headers: true },
    *            raw_data_params: { get_raw_data: true }
    *          }
    *        ],
    *        overlay: true
    *      });
    *    });
    * ```
    * The **header\_params** and **raw\_data\_params** options passed for each volume are
    * used to create the URLs to fetch the headers and raw data for each volume. The
    * Volume Viewer expects to send to requests to a single address, but with different
    * query parameters for each type of data. For example, the data for the first volume
    * described above would be fetched from the following two URLs:
    *
    * * /volume1.mnc?get_headers=true
    * * /volume1.mnc?get\_raw\_data=true
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
          
          scale.cursor_color = color_scale.cursor_color;
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
            scale.cursor_color = cs.cursor_color;
            VolumeViewer.colorScales[i+1] = scale;
          }
        );
      });
    };

    /**
    * @doc function
    * @name viewer.viewer:draw
    *
    * @description
    * Draw current slices to the canvases.
    *
    */
    viewer.draw = function draw() {
      var slice;
      var context;
      var canvas;
      var frame_width = 4;
      var half_frame_width = frame_width/2;
      var color_scale;

      volumes.forEach(function(volume, i) {
        viewer.displays[i].forEach(function(display, display_num) {
          canvas = display.canvas;
          context = display.context;
          volume = volumes[i];
          context.globalAlpha = 255;
          context.clearRect(0, 0, canvas.width, canvas.height);
          //draw slices in order
          slice = viewer.cachedSlices[i][display_num];
          if (slice){
            color_scale = volume.colorScale || viewer.defaultScale;
            display.drawSlice();
            display.drawCursor(color_scale.cursor_color);
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

    callback(viewer);
  };

})();

