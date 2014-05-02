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
* to that callback function to set up interaction with the viewer:
*  ```js
*  BrainBrowser.VolumeViewer.start("brainbrowser", function(viewer) {
*
*    // Add an event listener.
*    BrainBrowser.events.addEventListener("volumesloaded", function() {
*      console.log("Viewer is ready!");
*    });
*
*    // Load volumes.
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

(function() {
  "use strict";
  
  var BrainBrowser = window.BrainBrowser = window.BrainBrowser || {};

  var VolumeViewer = BrainBrowser.VolumeViewer = {};
  
  VolumeViewer.modules = {};
  VolumeViewer.volume_loaders = {};
  

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
      dom_element: document.getElementById(element_id),
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

          color_map = volume.color_map || viewer.default_color_map;
          panel.drawSlice();
          panel.drawCursor(color_map.cursor_color);

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
    * @param {function} callback Callback invoked after fetching with the fetched 
    *   slice as argument.
    *
    * @description
    * Fetch a new slice from a loaded volume.
    */

    // Keep track of timers.
    // fetchSlice() is an expensive operation so 
    // we call it asynchronously and don't want to 
    // call it unnecessarily.
    var timeouts = {};

    viewer.fetchSlice = function(vol_id, axis_name, slice_num, callback) {
      timeouts[vol_id] = timeouts[vol_id] || {};
      
      clearTimeout(timeouts[vol_id][axis_name]);

      timeouts[vol_id][axis_name] = setTimeout(function() {
        var volume = viewer.volumes[vol_id];
        var axis_num = axis_to_number[axis_name];
        var slice;
        
        if (slice_num !== undefined) {
          volume.position[axis_name] = slice_num;
        }

        slice = volume.slice(axis_name);
        slice.vol_id = vol_id;
        slice.axis_number = axis_num;
        slice.min = volume.min;
        slice.max = volume.max;
        

        updateSlice(vol_id, axis_name, slice);
            
        BrainBrowser.events.triggerEvent("sliceupdate");

        if (BrainBrowser.utils.isFunction(callback)) {
          callback(slice);
        }

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

      var panel = volume.display[axis_num];
      var slice = panel.slice;
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

    /**
    * @doc function
    * @name viewer.viewer:setPanelSize
    * @param {number} width Panel width.
    * @param {number} height Panel height.
    * @param {object} options The only currently supported
    *   option is **scale_image** which, if set to **true**
    *   will scale the displayed slice by the same proportion
    *   as the panel.
    *
    * @description
    * Update the size of panel canvases.
    */
    viewer.setPanelSize = function(width, height, options) {
      options = options || {};

      var scale_image = options.scale_image;
      var old_width, old_height, ratio;

      if (scale_image) {
        old_width = viewer.panel_width;
        old_height = viewer.panel_height;
        ratio = Math.min(width / old_width, height / old_height);
      } 

      viewer.panel_width = width > 0 ? width : viewer.panel_width;
      viewer.panel_height = height > 0 ? height : viewer.panel_height;

      viewer.volumes.forEach(function(volume, vol_id) {
        volume.display.forEach(function(panel, axis_num) {
          

          panel.setSize(viewer.panel_width, viewer.panel_height, options);

          if (scale_image) {       
            panel.zoom = panel.zoom * ratio;
            panel.image_center.x = width / 2;
            panel.image_center.y = height / 2;
            viewer.setCursor(vol_id, ["xspace", "yspace", "zspace"][axis_num], {
              x: panel.image_center.x,
              y: panel.image_center.y
            });
          }
          
        });
      });

      if (scale_image) {       
        viewer.redrawVolumes();
      }

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

    // Update the slice currently being displayed
    function updateSlice(vol_id, axis_name, slice) {

      var width_space = slice.width_space;
      var height_space = slice.height_space;
      var axis_num = axis_to_number[axis_name];
      var volume = viewer.volumes[vol_id]; 
      var panel = volume.display[axis_num];
      
      panel.setSlice(slice);
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

  };

})();

