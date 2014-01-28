/*
 * Copyright (C) 2011 McGill University
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/*
* @author: Tarek Sherif
* @author: Nicolas Kassis
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
*  BrainBrowser.VolumeViewer.start("brainbrowser", function(viewer) {
*
*    // Add an event listener.
*    viewer.addEventListener("ready", function() {
*      console.log("Viewer is ready!");
*    });
*
*    // Load minc volumes.
*    viewer.loadVolumes({
*      volumes: [
*        {
*          type: "minc",
*          header_url: "volume1.mnc?minc_headers=true",
*          raw_data_url: "volume1.mnc?raw_data=true",
*          template: {
*            element_id: "volume-ui-template",
*            viewer_insert_class: "volume-viewer-display"
*          }
*        },
*        {
*          type: "minc",
*          header_url: "volume2.mnc?minc_headers=true",
*          raw_data_url: "volume2.mnc?raw_data=true",
*          template: {
*            element_id: "volume-ui-template",
*            viewer_insert_class: "volume-viewer-display"
*          }
*        }
*      ],
*      overlay: {
*        template: {
*          element_id: "overlay-ui-template",
*          viewer_insert_class: "overlay-viewer-display"
*        }
*      }
*    });
*  });
*  ```
*/

/**
* @doc overview
* @name Configuration
*
* @description
* The Volume Viewer is configured by defining the object **BrainBrowser.config.volume_viewer**.
* Currently the only properties available for configuration are the color maps which are configured
* to define their name, the URL at which the color scale file is located, and, optionally, the color
* to use for the cursor when the defined color scale is active:
*
*```js
* BrainBrowser.config = {
*
*   volume_viewer: {
*     color_maps: [
*       {
*         name: "Spectral",
*         url: "/color_maps/spectral.txt",
*         cursor_color: "#FFFFFF"
*       },
*       {
*         name: "Gray",
*         url: "/color_maps/gray_scale.txt",
*         cursor_color: "#FF0000"
*       }
*     ]
*   }
*
* }
* ```
*/
(function() {
  "use strict";
  
  var BrainBrowser = window.BrainBrowser = window.BrainBrowser || {};

  var VolumeViewer = BrainBrowser.VolumeViewer = {};

  VolumeViewer.volumes = {};
  VolumeViewer.color_maps = [];
  VolumeViewer.modules = {};
  

  /**
  *  @doc function
  *  @name VolumeViewer.static methods:start
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
  *  BrainBrowser.VolumeViewer.start("brainbrowser", function(viewer) {
  *
  *    // Add an event listener.
  *    viewer.addEventListener("ready", function() {
  *      console.log("Viewer is ready!");
  *    });
  *
  *    // Load minc volumes.
  *    viewer.loadVolumes({
  *      volumes: [
  *        {
  *          type: "minc",
  *          header_url: "volume1.mnc?minc_headers=true",
  *          raw_data_url: "volume1.mnc?raw_data=true",
  *          template: {
  *            element_id: "volume-ui-template",
  *            viewer_insert_class: "volume-viewer-display"
  *          }
  *        },
  *        {
  *          type: "minc",
  *          header_url: "volume2.mnc?minc_headers=true",
  *          raw_data_url: "volume2.mnc?raw_data=true",
  *          template: {
  *            element_id: "volume-ui-template",
  *            viewer_insert_class: "volume-viewer-display"
  *          }
  *        }
  *      ],
  *      overlay: {
  *        template: {
  *          element_id: "overlay-ui-template",
  *          viewer_insert_class: "overlay-viewer-display"
  *        }
  *      }
  *    });
  *  });
  *  ```
  */
  VolumeViewer.start = function(element_id, callback) {
    var volumes = [];
    var viewer_element;
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
    * Handlers can be attached to the viewer to listen for certain events
    * occuring over its lifetime. Currently, the following viewer events can be listened for:
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
    /**
    * @doc object
    * @name viewer.events:ready
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
    * @name viewer.events:sliceupdate
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
    BrainBrowser.utils.eventModel(viewer);
    
    Object.keys(VolumeViewer.modules).forEach(function(m) {
      VolumeViewer.modules[m](viewer);
    });

    console.log("BrainBrowser Volume Viewer v" + BrainBrowser.version);

    

    /**
    * @doc function
    * @name viewer.viewer:loadVolumes
    * @param {object} options Description of volumes to load:
    * * **volumes** {array} An array of volume descriptions.
    * * **overlay** {boolean} Create a display overlaying the other loaded volumes?
    *
    * @description
    * Initial load of volumes. Usage:
    * ```js
    * viewer.loadVolumes({
    *   volumes: [
    *     {
    *       type: "minc",
    *       header_url: "volume1.mnc?minc_headers=true",
    *       raw_data_url: "volume1.mnc?raw_data=true",
    *       template: {
    *         element_id: "volume-ui-template",
    *         viewer_insert_class: "volume-viewer-display"
    *       }
    *     },
    *     {
    *       type: "minc",
    *       header_url: "volume2.mnc?minc_headers=true",
    *       raw_data_url: "volume2.mnc?raw_data=true",
    *       template: {
    *         element_id: "volume-ui-template",
    *         viewer_insert_class: "volume-viewer-display"
    *       }
    *     }
    *   ],
    *   overlay: {
    *     template: {
    *       element_id: "overlay-ui-template",
    *       viewer_insert_class: "overlay-viewer-display"
    *     }
    *   }
    * });
    * ```
    * The volume viewer requires three parameters for each volume to be loaded:
    * * **type** The type of volume (currently, 'minc' is the only valid option).
    * * **header\_url** The URL from which to get header data for the MINC volume.
    * * **raw\_data\_url** The URL from which to get the raw MINC data.
    * * **template** Object containing information about the template to use
    *   to produce the UI for each volume. Its properties include **element\_id**,
    *   the id of the element containing the template, and
    *   **viewer\_insert\_class**, the class of the element within the template
    *   in which to insert the volume's display panels.
    */
    viewer.loadVolumes = function(options) {

      if (!BrainBrowser.utils.checkConfig("volume_viewer.color_maps")) {
        throw new Error(
          "error in VolumeViewer configuration.\n" +
          "BrainBrowser.config.volume_viewer.color_maps not defined."
        );
      }

      options = options || {};
      var overlay_options = options.overlay && typeof options.overlay === "object" ? options.overlay : {};
      
      viewer_element = document.getElementById(element_id);
      
      var volume_descriptions = options.volumes;
      var num_descriptions = options.volumes.length;

      var config = BrainBrowser.config.volume_viewer;
      var color_map = config.color_maps[0];

      VolumeViewer.loader.loadColorScaleFromURL(
        color_map.url,
        color_map.name,
        function(scale) {
          var num_loaded = 0;
          var i;
          
          scale.cursor_color = color_map.cursor_color;
          viewer.default_color_map = scale;
          VolumeViewer.color_maps[0] = scale;
          
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
                    type: "overlay",
                  },
                  function(volume) {
                    volume.position = {};
                    volumes.push(volume);
                    startViewer(options.volumes.concat(overlay_options));
                  }
                );
              } else {
                startViewer(options.volumes.concat(overlay_options));
              }
            });
          }
          
          for (i = 0; i < num_descriptions; i++) {
            loadVolume(i);
          }
        }
      );

      config.color_maps.slice(1).forEach(function(cs, i) {
        VolumeViewer.loader.loadColorScaleFromURL(
          cs.url,
          cs.name,
          function(scale) {
            scale.cursor_color = cs.cursor_color;
            VolumeViewer.color_maps[i+1] = scale;
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
    viewer.draw = function() {
      var slice;
      var context;
      var canvas;
      var frame_width = 4;
      var half_frame_width = frame_width/2;
      var color_map;

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
            color_map = volume.color_map || viewer.default_color_map;
            display.drawSlice();
            display.drawCursor(color_map.cursor_color);
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
    * @name viewer.volumes:fetchSlice
    * @param {number} volume_num Index of the volume where the slice is being rendered.
    * @param {string} axis_name Name of the axis where the slice is being rendered.
    * @param {number} slice_num Index of the slice to render.
    *
    * @description
    * Fetch a new slice from a loaded volume.
    */

    // Keep track of timers.
    // fetchSlice() is an expensive operation so 
    // we call it asynchronously and don't want to 
    // call it unnecessarily.
    var timeouts = {};

    viewer.fetchSlice = function(volume_num, axis_name, slice_num) {
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
        slice.vol_id = volume_num;
        slice.axis_number = axis_num;
        volume.position[axis_name] = slice_num;

        slice.min = volume.min;
        slice.max = volume.max;
        updateSlice(volume_num, axis_name, slice);
            
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
        x = Math.floor((cursor.x - image_origin.x) / zoom / Math.abs(slice.width_space.step));
        y = Math.floor(slice.height_space.space_length - (cursor.y - image_origin.y) / zoom  / Math.abs(slice.height_space.step));
      } else {
        x = null;
        y = null;
      }

      viewer.fetchSlice(volume_num, slice.width_space.name, x);
      viewer.fetchSlice(volume_num, slice.height_space.name, y);
    };

    /**
    * @doc function
    * @name viewer.volumes:redrawVolumes
    *
    * @description
    * Redraw all volumes at their current position.
    */
    viewer.redrawVolumes = function() {
      viewer.volumes.forEach(function(volume, volume_num) {
        viewer.fetchSlice(volume_num, "xspace", volume.position.xspace);
        viewer.fetchSlice(volume_num, "yspace", volume.position.yspace);
        viewer.fetchSlice(volume_num, "zspace", volume.position.zspace);
      });
    };


    ////////////////////////////
    // Pass viewer to callback
    ////////////////////////////
    callback(viewer);


    /////////////////////////
    // PRIVATE FUNCTIONS
    /////////////////////////
     
    // Open volume using appropriate volume loader
    function openVolume(volume_description, callback){
      var loader = VolumeViewer.volumes[volume_description.type];
      if(loader){
        loader(volume_description, callback);
      } else {
        throw new Error("Unsuported Volume Type");
      }
    }

    // Update the slice currently being displayed
    function updateSlice(volume_num, axis_name, slice) {
      var width_space = slice.x;
      var height_space = slice.y;
      var axis_num = axis_to_number[axis_name];
      
      var cached_slice = viewer.cachedSlices[volume_num][axis_num] || {
        width_space: width_space,
        height_space: height_space,
      };
      var display = viewer.displays[volume_num][axis_num];
      
      cached_slice.image = slice.getImage(display.zoom);
      viewer.cachedSlices[volume_num][axis_num] = cached_slice;
      
      display.slice = cached_slice;
      display.updateCursor();
    }

    
    // Initialize the viewer with first slices
    function startViewer(volume_descriptions) {
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
      volumes.forEach(function(volume, i) {

        var div = document.createElement("div");
        var slices = [];
        var k;
        
        div.classList.add("volume-container");
        viewer_element.appendChild(div);
        viewer.displays.push(addVolumeInterface(div, volumes[i], i, volume_descriptions[i]));
        viewer.cachedSlices[i] = [];
        
        volume.position.xspace = Math.floor(volume.header.xspace.space_length / 2);
        volume.position.yspace = Math.floor(volume.header.yspace.space_length / 2);
        volume.position.zspace = Math.floor(volume.header.zspace.space_length / 2);

        slices.push(volume.slice('xspace', volume.position.xspace));
        slices.push(volume.slice('yspace', volume.position.yspace));
        slices.push(volume.slice('zspace', volume.position.zspace));
        for ( k = 0; k < 3; k++ ) {
          slices[k].vol_id = i;
          slices[k].axis_number = k;
          slices[k].min = volume.min;
          slices[k].max = volume.max;
        }

        ["xspace", "yspace", "zspace"].forEach(function(axis, slice_num) {
          updateSlice(i, axis, slices[slice_num]);
        });

      });
      
      viewer.triggerEvent("ready");
      viewer.triggerEvent("sliceupdate");
      
      animate();
    }

    // Start animating
    function animate() {
      window.requestAnimationFrame(animate);

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
        var vol_id = canvas.getAttribute("data-volume-id");
        var axis_name = canvas.getAttribute("data-axis-name");
        
        ({
          37: function() { cursor.x--; }, // Left
          38: function() { cursor.y--; }, // Up
          39: function() { cursor.x++; }, // Right
          40: function() { cursor.y++; }  // Down
        })[keyCode]();
        
        viewer.setCursor(vol_id, axis_name, cursor);
        
        if (viewer.synced){
          viewer.displays.forEach(function(display, synced_vol_id) {
            if (synced_vol_id !== vol_id) {
              viewer.setCursor(synced_vol_id, axis_name, cursor);
            }
          });
        }
        
        return false;
      }, false);
    }
      
    function getTemplate(viewer_element, vol_id, template_id, viewer_insert_class) {
      var template = document.getElementById(template_id).innerHTML.replace(/\{\{VOLID\}\}/gm, vol_id);
      var temp = document.createElement("div");
      temp.innerHTML = template;
      var template_elements = temp.childNodes;
      var viewer_insert = temp.getElementsByClassName(viewer_insert_class)[0];

      var i, count;
      var node;

      for (i = 0, count = viewer_element.childNodes.length; i < count; i++) {
        node = viewer_element.childNodes[i];
        if (node.nodeType === 1) {
          viewer_insert.appendChild(node);
          i--;
          count--;
        }
      }

      return template_elements;
    }

    // Create canvases and add mouse interface.
    function addVolumeInterface(div, volume, vol_id, volume_description) {
      volume_description = volume_description || {};
      var displays = [];
      var template_options = volume_description.template || {};
      var template;
      
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
        canvas.setAttribute("data-volume-id", vol_id);
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

      if (template_options.element_id && template_options.viewer_insert_class) {
        template = getTemplate(div, vol_id, template_options.element_id, template_options.viewer_insert_class);

        if (typeof template_options.complete === "function") {
          template_options.complete(volume, template);
        }

        Array.prototype.forEach.call(template, function(node) {
          if (node.nodeType === 1) {
            div.appendChild(node);
          }
        });
      }

      if (viewer.volumeUIControls) {
        var controls  = document.createElement("div");
        controls.className = "volume-viewer-controls volume-controls";
        if (viewer.volumeUIControls.defer_until_page_load) {
          viewer.addEventListener("ready", function() {
            div.appendChild(controls);
            viewer.volumeUIControls(controls, volume, vol_id);
          });
        } else {
          viewer.volumeUIControls(controls, volume, vol_id);
          div.appendChild(controls);
        }
      }
    
      ///////////////////////////////////
      // Mouse Events
      ///////////////////////////////////
      
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
                    if (synced_vol_id !== vol_id) {
                      translate(display[slice_num]);
                    }
                  });
                }
              } else {
                viewer.setCursor(vol_id, axis_name, cursor);
                if (viewer.synced){
                  viewer.displays.forEach(function(display, synced_vol_id) {
                    if (synced_vol_id !== vol_id) {
                      viewer.setCursor(synced_vol_id, axis_name, cursor);
                    }
                  });
                }
                display.cursor = viewer.active_cursor = cursor;
              }
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
                  if (synced_vol_id !== vol_id) {
                    var d = display[slice_num];
                    d.last_cursor.x = cursor.x;
                    d.last_cursor.y = cursor.y;
                  }
                });
              }
            } else {
              viewer.setCursor(vol_id, axis_name, cursor);
              if (viewer.synced){
                viewer.displays.forEach(function(display, synced_vol_id) {
                  if (synced_vol_id !== vol_id) {
                    viewer.setCursor(synced_vol_id, axis_name, cursor);
                  }
                });
              }
              display.cursor = viewer.active_cursor = cursor;
            }
            viewer.active_canvas = e.target;
            document.addEventListener("mousemove", drag, false);
            document.addEventListener("mouseup", stopDrag, false);

          }, false);
          
          function wheelHandler(e) {
            var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));

            e.preventDefault();
            e.stopPropagation();

            display.zoom = Math.max(display.zoom + delta * 0.05, 0.05);
            
            viewer.fetchSlice(vol_id, ["xspace", "yspace", "zspace"][slice_num]);
            if (viewer.synced){
              viewer.displays.forEach(function(display, synced_vol_id) {
                if (synced_vol_id !== vol_id) {
                  var d = display[slice_num];
                  d.zoom = Math.max(d.zoom + delta * 0.05, 0.05);
                  viewer.fetchSlice(synced_vol_id, ["xspace", "yspace", "zspace"][slice_num]);
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
  };

})();

