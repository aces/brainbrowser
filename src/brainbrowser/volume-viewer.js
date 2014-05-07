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
* Author: Tarek Sherif <tsherif@gmail.com> (http://tareksherif.ca/)
* Author: Nicolas Kassis
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
*    // Load the default color map.
*    // (Second argument is the cursor color to use).
*    viewer.loadDefaultColorMapFromURL(color_map_url, "#FF0000");
*
*    // Set the size of slice display panels.
*    viewer.setPanelSize(256, 256);
*
*    // Start rendering.
*    viewer.render();
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
*          header_file: document.getElementById("header-file"),
*          raw_data_file: document.getElementById("raw-data-file"),
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
* @name Templates
*
* @description
* If more than one volume is to be displayed by the Volume Viewer, or if volumes are
* to be loaded and removed dynamically, the Volume Viewer's default behaviour of inserting
* the viewer panels into the DOM element referred to in the **start** method might not be
* sufficient. For cases such as these, the Volume Viewer provides a templating mechanism 
* to allow UI to be created once and then reused for several volumes.
* A template is simply unrendered HTML embedded in a web page using a
* a **script** tag with a non-JavaScript type: 
*
* ```HTML
* &lt;script id=&quot;volume-ui-template&quot; type=&quot;x-volume-ui-template&quot;&gt;
*   &lt;div class=&quot;volume-viewer-display&quot;&gt;&lt;/div&gt;
*   &lt;div class=&quot;volume-viewer-controls volume-controls&quot;&gt;
*     &lt;div class=&quot;coords&quot;&gt;
*       &lt;div class=&quot;control-heading&quot; id=&quot;voxel-coordinates-heading-&#123;&#123;VOLID&#125;&#125;&quot;&gt;
*         Voxel Coordinates: 
*       &lt;/div&gt;
*       &lt;div class=&quot;voxel-coords&quot; data-volume-id=&quot;&#123;&#123;VOLID&#125;&#125;&quot;&gt;
*         X:&lt;input id=&quot;voxel-x-&#123;&#123;VOLID&#125;&#125;&quot; class=&quot;control-inputs&quot;&gt;
*         Y:&lt;input id=&quot;voxel-y-&#123;&#123;VOLID&#125;&#125;&quot; class=&quot;control-inputs&quot;&gt;
*         Z:&lt;input id=&quot;voxel-z-&#123;&#123;VOLID&#125;&#125;&quot; class=&quot;control-inputs&quot;&gt;
*       &lt;/div&gt;
*     &lt;/div&gt;
*   &lt;/div&gt;
* &lt;/script&gt;
* ```
* 
* Some important points about the template:
*
* * An element with a distinct class must be provided in which the viewer panels
*   will be inserted. In the above example, this is the **div** with the class 
*   **volume-viewer-display**.
* * The placeholder **`{{VOLID}}`** will be replaced by the displayed volume's ID
*   (i.e. its index in the **viewer.volumes** array). This can be useful if its
*   necessary to refer from a element to the volume it applies to.
* 
* To use the template, simply refer to the template's **id** and the viewer panel's
* **class** in the **option** of any of the volume loading functions:
*
* * **loadVolume**
* * **loadVolumes**
* * **createOverlay**
*
* For example, to load a single volume over the network and apply the above template,
* something like the following would suffice:
* ```js
* viewer.loadVolume({
*   type: "minc",
*   header_url: "volume1.header",
*   raw_data_url: "volume1.raw",
*   template: {
*     element_id: "volume-ui-template",
*     viewer_insert_class: "volume-viewer-display"
*   }
* });
* ```
*
* The key options are:
*
* * **element_id**: the **ID** of the template element.
* * **viewer\_insert\_class**: the **class** of the element in which to insert the viewer
*   panels.
*/
(function() {
  "use strict";
  
  var VolumeViewer = BrainBrowser.VolumeViewer = {};
  
  VolumeViewer.modules = {};
  VolumeViewer.volume_loaders = {};
  

  /**
  * @doc function
  * @name VolumeViewer.static methods:start
  * @param {string} element_id ID of the DOM element
  * in which the viewer will be inserted.
  * @param {function} callback Callback function to which the viewer object
  * will be passed after creation.
  * @description
  * The start() function is the main point of entry to the Volume Viewer.
  * It creates a viewer object that is then passed to the callback function
  * supplied by the user.
  *
  * ```js
  * BrainBrowser.VolumeViewer.start("brainbrowser", function(viewer) {
  *
  *   // Add an event listener.
  *   BrainBrowser.events.addEventListener("volumesloaded", function() {
  *     console.log("Viewer is ready!");
  *   });
  *
  *   // Load the default color map.
  *   // (Second argument is the cursor color to use).
  *   viewer.loadDefaultColorMapFromURL(color_map_url, "#FF0000");
  *
  *   // Set the size of slice display panels.
  *   viewer.setPanelSize(256, 256);
  *
  *   // Start rendering.
  *   viewer.render();
  *
  *   // Load minc volumes.
  *   viewer.loadVolumes({
  *     volumes: [
  *       // Load a volume over the network.
  *       {
  *         type: "minc",
  *         header_url: "volume1.mnc?minc_headers=true",
  *         raw_data_url: "volume1.mnc?raw_data=true",
  *         template: {
  *           element_id: "volume-ui-template",
  *           viewer_insert_class: "volume-viewer-display"
  *         }
  *       },
  *       // Load a volume from a local file.
  *       {
  *         type: "minc",
  *         header_file: document.getElementById("header-file"),
  *         raw_data_file: document.getElementById("raw-data-file"),
  *         template: {
  *           element_id: "volume-ui-template",
  *           viewer_insert_class: "volume-viewer-display"
  *         }
  *       }
  *     ],
  *     overlay: {
  *       template: {
  *         element_id: "overlay-ui-template",
  *         viewer_insert_class: "overlay-viewer-display"
  *       }
  *     }
  *   });
  * });
  * ```
  */
  VolumeViewer.start = function(element_id, callback) {
    
    /**
    * @doc object
    * @name viewer
    * @property {array} volumes Volumes to be displayed.
    * @property {array} displays Display areas (one per volume).
    * @property {boolean} synced Are the cursors being synced across volumes?
    *
    * @description
    * The viewer object encapsulates all functionality of the Surface Viewer.
    * Handlers can be attached to the  **BrainBrowser.events** object to listen 
    * for certain events occuring over the viewer's lifetime. Currently, the 
    * following viewer events can be listened for:
    *
    * * **volumesloaded** Volumes loaded by **viewer.loadVolumes()** have finished loading.
    * * **rendering** Viewer has started rendering.
    * * **volumeuiloaded** A new volume UI has been created by the viewer.
    * * **sliceupdate** A new slice has been rendered to the viewer.
    * * **error** An error has occured.
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
      panel_width: 256,
      panel_height: 256
    };

    /**
    * @doc object
    * @name VolumeViewer.events:volumesloaded
    *
    * @description
    * Triggered when volumes loaded through **viewer.loadVolumes()** have completely
    * finished loading. The event handler receives no arguments.
    *
    * ```js
    *    BrainBrowser.events.addEventListener("volumesloaded", function() {
    *      //...
    *    });
    * ```
    */
    /**
    * @doc object
    * @name VolumeViewer.events:rendering
    *
    * @description
    * Triggered when the viewer begins rendering after a call to **viewer.render()**.
    * The event handler receives no arguments.
    *
    * ```js
    *    BrainBrowser.events.addEventListener("rendering", function() {
    *      //...
    *    });
    * ```
    */
    /**
    * @doc object
    * @name VolumeViewer.events:volumeuiloaded
    *
    * @description
    * Triggered after a UI is created for a newly loaded volume. The DOM element
    * created and the volume ID are passed as arguments.
    *
    * ```js
    *    BrainBrowser.events.addEventListener("volumeuiloaded", function(container, vol_id) {
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
    /**
    * @doc object
    * @name VolumeViewer.events:error
    *
    * @description
    * Triggered when an error of some sort has occured. The error message, if any,
    * is passed as the callbacks sole argument.
    *
    * ```js
    *    BrainBrowser.events.addEventListener("error", function(error_message) {
    *      //...
    *    });
    * ```
    *
    */
    
    Object.keys(VolumeViewer.modules).forEach(function(m) {
      VolumeViewer.modules[m](viewer);
    });

    console.log("BrainBrowser Volume Viewer v" + BrainBrowser.version);

    /**
    * @doc function
    * @name viewer.viewer:fetchSlice
    * @param {number} vol_id Index of the volume where the slice is being rendered.
    * @param {string} axis_name Name of the axis where the slice is being rendered.
    * @param {number} slice_num Index of the slice to render.
    * @param {function} callback Callback invoked after fetching with the fetched 
    *   slice as argument.
    *
    * @description
    * Fetch a new slice from a loaded volume.
    * ```js
    * viewer.fetchSlice(vol_id, "xspace", 25, function(slice) {
    *   // Manipulate slice.
    * });
    * ```
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
        var axis_num = VolumeViewer.utils.axis_to_number[axis_name];
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
    * ```js
    * viewer.setPanelSize(512, 512, {
    *   scale_image: true
    * });
    * ```
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
      var axis_num = VolumeViewer.utils.axis_to_number[axis_name];
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

