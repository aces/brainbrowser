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
*    BrainBrowser.events.addEventListener("ready", function() {
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
  *    BrainBrowser.events.addEventListener("ready", function() {
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
    var viewer_element = document.getElementById(element_id);
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
    * Handlers can be attached to the  **BrainBrowser.events** object to listen 
    * for certain events occuring over the viewer's lifetime. Currently, the 
    * following viewer events can be listened for:
    *
    * * **ready** Viewer is completely loaded and ready to be manipulated.
    * * **sliceupdate** A new slice has been rendered to the viewer.
    *
    * To listen for an event, simply use the viewer's **addEventListener()** method with
    * with the event name and a callback funtion:
    *
    * ```js
    *    BrainBrowser.events.addEventListener("sliceupdate", function() {
    *      console.log("Slice updated!");
    *    });
    *
    * ```
    */
    var viewer = {
      volumes: [],
      synced: false,
      default_zoom_level: 1,
      panel_width: 256,
      panel_height: 256
    };

    /**
    * @doc object
    * @name VolumeViewer.events:ready
    *
    * @description
    * Triggered when the viewer is fully loaded and ready for interaction.
    * The event handler receives no arguments.
    *
    * ```js
    *    BrainBrowser.events.addEventListener("ready", function() {
    *      //...
    *    });
    * ```
    */
    /**
    * @doc object
    * @name VolumeViewer.events:sliceupdate
    *
    * @description
    * Triggered when the slice currently being displayed is updated.
    * The event handler receives no arguments.
    *
    * ```js
    *    BrainBrowser.events.addEventListener("sliceupdate", function() {
    *      //...
    *    });
    * ```
    */
    
    Object.keys(VolumeViewer.modules).forEach(function(m) {
      VolumeViewer.modules[m](viewer);
    });

    console.log("BrainBrowser Volume Viewer v" + BrainBrowser.version);

    /**
    * @doc function
    * @name viewer.viewer:loadVolumes
    * @param {object} options Description of volumes to load:
    * * **volumes** {array} An array of volume descriptions.
    * * **overlay** {boolean|object} Set to true to display an overlay of 
    *   the loaded volumes with out any interface, or provide and object 
    *   containing a description of the template to use for the UI (see below).
    * * **panel_width** {number} Width of an individual slice panel in the display.
    * * **panel_height** {number} Height of an individual slice panel in the display.
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
    *   },
    *   panel_width: 256,
    *   panel_height: 256
    * });
    * ```
    * The volume viewer requires three parameters for each volume to be loaded:
    * * **type** The type of volume (currently, 'minc' is the only valid option).
    * * **header\_url** The URL from which to get header data for the MINC volume.
    * * **raw\_data\_url** The URL from which to get the raw MINC data.
    * * **template** (optional) Object containing information about the template to use
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
            
      var volume_descriptions = options.volumes;
      var num_descriptions = options.volumes.length;

      var config = BrainBrowser.config.volume_viewer;
      var color_map_description = config.color_maps[0];

      viewer.setPanelDimensions(options.panel_width, options.panel_height);

      BrainBrowser.loader.loadColorMapFromURL(
        color_map_description.url,
        function(color_map) {
          var num_loaded = 0;
          var i;

          color_map.name = color_map_description.name
          
          color_map.cursor_color = color_map_description.cursor_color;
          viewer.default_color_map = color_map;
          VolumeViewer.color_maps[0] = color_map;
          
          function loadVolume(i) {
            setVolume(i, volume_descriptions[i], function(volume) {
              if (++num_loaded < num_descriptions) {
                return;
              }
              
              if (options.overlay && num_descriptions > 1) {
                viewer.createOverlay(overlay_options, function() {
                  viewer.render();
                  BrainBrowser.events.triggerEvent("volumesloaded");
                });
              } else {
                viewer.render();
                BrainBrowser.events.triggerEvent("volumesloaded");
              }
            });
          }
          
          for (i = 0; i < num_descriptions; i++) {
            loadVolume(i);
          }
        }
      );

      config.color_maps.slice(1).forEach(function(color_map_description, i) {
        BrainBrowser.loader.loadColorMapFromURL(
          color_map_description.url,
          function(color_map) {
            color_map.name = color_map_description.name;
            color_map.cursor_color = color_map_description.cursor_color;
            VolumeViewer.color_maps[i+1] = color_map;
          }
        );
      });
    };

    /**
    * @doc function
    * @name viewer.volumes:loadVolume
    * @param {object} volume_description Description of the volume to be loaded. 
    *   Must contain at least a **type** property that maps to the volume loaders in
    *   **BrainBrowser.volume_loaders.** May contain a **template** property that 
    *   indicates the template to be used for the volume's UI. Other properties will be
    *   specific to a particular volume type.  
    * @param {function} callback Callback to which the new volume object will be passed
    *   after loading.
    *
    * @description
    * Load a new volume.
    */
    viewer.loadVolume = function(volume_description, callback) {     
      setVolume(viewer.volumes.length, volume_description, callback);
    };

    /**
    * @doc function
    * @name viewer.volumes:clearVolumes
    *
    * @description
    * Clear all loaded volumes.
    */
    viewer.clearVolumes = function() {
      viewer.volumes = [];
      viewer.active_canvas = null;
      viewer.active_cursor = null;
      viewer_element.innerHTML = "";
    };

    /**
    * @doc function
    * @name viewer.volumes:createOverlay
    * @param {object} volume_description Will contain at most a **template** 
    *   property indicating the template to use for the UI.
    * @param {function} callback Callback to which the new overlay volume object 
    *   will be passed after loading.
    *
    * @description
    * Create an overlay of the currently loaded volumes.
    */
    viewer.createOverlay = function(description, callback) {
      description = description || {};

      viewer.loadVolume({
          volumes: viewer.volumes,
          type: "overlay",
          template: description.template
        },
        callback
      );
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
      var half_frame_width = frame_width / 2;
      var color_map;

      viewer.volumes.forEach(function(volume) {
        volume.display.forEach(function(panel, panel_num) {
          canvas = panel.canvas;
          context = panel.context;
          context.globalAlpha = 255;
          context.clearRect(0, 0, canvas.width, canvas.height);
          //draw slices in order
          slice = volume.cached_slices[panel_num];
          if (slice){
            color_map = volume.color_map || viewer.default_color_map;
            panel.drawSlice();
            panel.drawCursor(color_map.cursor_color);
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
    * @name viewer.viewer:rendering
    *
    * @description
    * Start render loop around **viewer.draw()**.
    */
    viewer.render = function() {
      BrainBrowser.events.triggerEvent("rendering");

      (function render() {
        window.requestAnimationFrame(render);
  
        viewer.draw();
      })();
    };

    /**
    * @doc function
    * @name viewer.volumes:fetchSlice
    * @param {number} vol_id Index of the volume where the slice is being rendered.
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

    viewer.fetchSlice = function(vol_id, axis_name, slice_num) {
      timeouts[vol_id] = timeouts[vol_id] || {};
      
      clearTimeout(timeouts[vol_id][axis_name]);

      timeouts[vol_id][axis_name] = setTimeout(function() {
        var volume = viewer.volumes[vol_id];
        var slice;
        var axis_num = axis_to_number[axis_name];
        
        if (slice_num === undefined) {
          slice_num = volume.position[axis_name];
        }
        
        slice = volume.slice(axis_name, slice_num, volume.current_time);
        slice.vol_id = vol_id;
        slice.axis_number = axis_num;
        volume.position[axis_name] = slice_num;

        slice.min = volume.min;
        slice.max = volume.max;
        updateSlice(vol_id, axis_name, slice);
            
        BrainBrowser.events.triggerEvent("sliceupdate");
      }, 0);
    };

    /**
    * @doc function
    * @name viewer.volumes:setCursor
    * @param {number} vol_id Index of the volume.
    * @param {number} axis_num Volume axis to update.
    * @param {object} cursor Object containing the x and y coordinates of the 
    * cursor.
    *
    * @description
    * Set the cursor to a new position in the given volume and axis.
    */
    viewer.setCursor = function(vol_id, axis_name, cursor) {
      var volume = viewer.volumes[vol_id];
      var axis_num = axis_to_number[axis_name];

      var slice = volume.cached_slices[axis_num];
      var panel = volume.display[axis_num];
      var image_origin = panel.getImageOrigin();
      var zoom = panel.zoom;
      var x, y;
      
      panel.cursor.x = cursor.x;
      panel.cursor.y = cursor.y;

      if (cursor) {
        x = Math.floor((cursor.x - image_origin.x) / zoom / Math.abs(slice.width_space.step));
        y = Math.floor(slice.height_space.space_length - (cursor.y - image_origin.y) / zoom  / Math.abs(slice.height_space.step));
      } else {
        x = null;
        y = null;
      }

      viewer.fetchSlice(vol_id, slice.width_space.name, x);
      viewer.fetchSlice(vol_id, slice.height_space.name, y);
    };

    /**
    * @doc function
    * @name viewer.volumes:redrawVolumes
    *
    * @description
    * Redraw all volumes at their current position.
    */
    viewer.redrawVolumes = function() {
      viewer.volumes.forEach(function(volume, vol_id) {
        viewer.fetchSlice(vol_id, "xspace", volume.position.xspace);
        viewer.fetchSlice(vol_id, "yspace", volume.position.yspace);
        viewer.fetchSlice(vol_id, "zspace", volume.position.zspace);
      });
    };

    /**
    * @doc function
    * @name viewer.volumes:resetDisplays
    *
    * @description
    * Reset all displays.
    */
    viewer.resetDisplays = function() {

      viewer.volumes.forEach(function(volume) {
        volume.display.forEach(function(panel) {
          panel.reset();
        });
      });
      
    };

    viewer.setPanelDimensions = function(width, height) {
      viewer.panel_width = width > 0 ? width : viewer.panel_width;
      viewer.panel_height = height > 0 ? height : viewer.panel_height;
    };

    // Add keyboard controls
    keyboardControls();

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

    // Place a volume at a certain position in the volumes array.
    // This function should be used with care as empty places in the volumes
    // array will cause problems with rendering.
    function setVolume(vol_id, volume_description, callback) {     
      openVolume(volume_description, function(volume) {
        volume.position = {};
        volume.display = createVolumeDisplay(viewer_element, vol_id, volume_description);
        volume.cached_slices = [];
        viewer.volumes[vol_id] = volume;

        ["xspace", "yspace", "zspace"].forEach(function(axis, slice_num) {
          var position = volume.position[axis] = Math.floor(volume.header[axis].space_length / 2);
          var slice = volume.slice(axis, position);

          slice.vol_id = vol_id;
          slice.axis_number = slice_num;
          slice.min = volume.min;
          slice.max = volume.max;

          updateSlice(vol_id, axis, slice);
        });

        BrainBrowser.events.triggerEvent("sliceupdate");

        if (BrainBrowser.utils.isFunction(callback)) {
          callback(volume);
        } 
      });
    }

    // Update the slice currently being displayed
    function updateSlice(vol_id, axis_name, slice) {
      var width_space = slice.x;
      var height_space = slice.y;
      var axis_num = axis_to_number[axis_name];
      var volume = viewer.volumes[vol_id];
      
      var cached_slice = volume.cached_slices[axis_num] || {
        width_space: width_space,
        height_space: height_space,
      };
      var panel = volume.display[axis_num];
      
      cached_slice.image = slice.getImage(panel.zoom);
      volume.cached_slices[axis_num] = cached_slice;
      
      panel.slice = cached_slice;
      panel.updateCursor();
    }


    // Set up global keyboard interactions.
    function keyboardControls() {
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
          viewer.volumes.forEach(function(volume, synced_vol_id) {
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
    function createVolumeDisplay(viewer_element, vol_id, volume_description) {
      var container = document.createElement("div");
      var volume = viewer.volumes[vol_id];
            
      var display = [];
      var template_options = volume_description.template || {};
      var template;

      container.classList.add("volume-container");
      
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
        canvas.width = viewer.panel_width;
        canvas.height = viewer.panel_height;
        canvas.setAttribute("data-volume-id", vol_id);
        canvas.setAttribute("data-axis-name", axis_name);
        canvas.classList.add("slice-display");
        canvas.style.backgroundColor = "#000000";
        container.appendChild(canvas);
        context.clearRect(0, 0, canvas.width, canvas.height);
        display.push(
          VolumeViewer.createPanel({
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
        template = getTemplate(container, vol_id, template_options.element_id, template_options.viewer_insert_class);

        if (typeof template_options.complete === "function") {
          template_options.complete(volume, template);
        }

        Array.prototype.forEach.call(template, function(node) {
          if (node.nodeType === 1) {
            container.appendChild(node);
          }
        });
      }

      if (viewer.volumeUIControls) {
        var controls  = document.createElement("div");
        controls.className = "volume-viewer-controls volume-controls";
        if (viewer.volumeUIControls.defer_until_page_load) {
          BrainBrowser.events.addEventListener("ready", function() {
            container.appendChild(controls);
            viewer.volumeUIControls(controls, volume, vol_id);
          });
        } else {
          viewer.volumeUIControls(controls, volume, vol_id);
          container.appendChild(controls);
        }
      }
    
      ///////////////////////////////////
      // Mouse Events
      ///////////////////////////////////
      
      (function() {
        var current_target = null;
        
        ["xspace", "yspace", "zspace"].forEach(function(axis_name, slice_num) {
          var panel = display[slice_num];
          var canvas = panel.canvas;
          var mouse = panel.mouse;
          
          function drag(e) {
            var cursor = {
              x: mouse.x,
              y: mouse.y
            };
                    
            if(e.target === current_target) {
              if(e.shiftKey) {
                panel.followCursor(cursor);
                if (viewer.synced){
                  viewer.volumes.forEach(function(volume, synced_vol_id) {
                    if (synced_vol_id !== vol_id) {
                      volume.display[slice_num].followCursor(cursor);
                    }
                  });
                }
              } else {
                viewer.setCursor(vol_id, axis_name, cursor);
                if (viewer.synced){
                  viewer.volumes.forEach(function(volume, synced_vol_id) {
                    if (synced_vol_id !== vol_id) {
                      viewer.setCursor(synced_vol_id, axis_name, cursor);
                    }
                  });
                }
                panel.cursor = viewer.active_cursor = cursor;
              }
            }
          }
          
          function stopDrag() {
            document.removeEventListener("mousemove", drag, false);
            document.removeEventListener("mouseup", stopDrag, false);
            current_target = null;
          }
          
          canvas.addEventListener("mousedown", function startDrag(event) {
            current_target = event.target;
            var cursor = {
              x: mouse.x,
              y: mouse.y
            };

            event.preventDefault();
            event.stopPropagation();
            
            if (event.shiftKey) {
              panel.last_cursor.x = cursor.x;
              panel.last_cursor.y = cursor.y;
              if (viewer.synced){
                viewer.volumes.forEach(function(volume, synced_vol_id) {
                  if (synced_vol_id !== vol_id) {
                    var panel = volume.display[slice_num];
                    panel.last_cursor.x = cursor.x;
                    panel.last_cursor.y = cursor.y;
                  }
                });
              }
            } else {
              viewer.setCursor(vol_id, axis_name, cursor);
              if (viewer.synced){
                viewer.volumes.forEach(function(volume, synced_vol_id) {
                  if (synced_vol_id !== vol_id) {
                    viewer.setCursor(synced_vol_id, axis_name, cursor);
                  }
                });
              }
              panel.cursor = viewer.active_cursor = cursor;
            }
            viewer.active_canvas = event.target;
            document.addEventListener("mousemove", drag, false);
            document.addEventListener("mouseup", stopDrag, false);

          }, false);
          
          function wheelHandler(event) {
            var delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));

            event.preventDefault();
            event.stopPropagation();

            panel.zoom = Math.max(panel.zoom + delta * 0.05, 0.05);
            
            viewer.fetchSlice(vol_id, ["xspace", "yspace", "zspace"][slice_num]);
            if (viewer.synced){
              viewer.volumes.forEach(function(volume, synced_vol_id) {
                if (synced_vol_id !== vol_id) {
                  var panel = volume.display[slice_num];
                  panel.zoom = Math.max(panel.zoom + delta * 0.05, 0.05);
                  viewer.fetchSlice(synced_vol_id, ["xspace", "yspace", "zspace"][slice_num]);
                }
              });
            }
          }

          canvas.addEventListener("mousewheel", wheelHandler, false);
          canvas.addEventListener("DOMMouseScroll", wheelHandler, false); // Dammit Firefox
        });
      })();
      
      viewer_element.appendChild(container);
      BrainBrowser.events.triggerEvent("volumeuiloaded", container);

      return display;
    }
  };

})();

