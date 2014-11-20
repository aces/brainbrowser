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
*    viewer.addEventListener("volumesloaded", function() {
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
* @name Configuration
*
* @description
* The Volume Viewer can be configured using the **set** and **get**
* methods of the **BrainBrowser.config** object. At this point, there
* is no required configuration for the Volume Viewer, so this
* functionality can be safely used for custom app configuration.
*
* ```js
* BrainBrowser.config.set("color_map_path", "color-maps/spectral.txt");
* ```
*
* Configuration parameters can be retrieved using the **get** method:
*
* ```js
* var color_map_path = BrainBrowser.config.get("color_map_path");
* ```
*
* If the requested parameter does not exist, **null** will be returned.
*
* Configuration parameters can be namespaced, using a "." to separate namespaces,
* so for example:
*
* ```js
* BrainBrowser.set("color_maps.spectral.name", "Spectral");
* ```
*
* will set the **name** property in the **spectral** namespace of the
* **color_maps** namespace. Namespaces are implemented as objects, so
* if a namespace is requested with **get**, the namespace object will be
* returned. Using the previous **set**, the following **get**:
*
* ```js
* BrainBrowser.get("color_maps.spectral");
* ```
*
* would return the object:
*
* ```js
*  { name: "Spectral" }
* ```
*
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
  * @param {string} element ID of a DOM element, or the DOM element itself, 
  * into which the viewer will be inserted.
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
  *   viewer.addEventListener("volumesloaded", function() {
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
  VolumeViewer.start = function(element, callback) {
    
    /**
    * @doc object
    * @name viewer
    * @property {array} volumes Volumes to be displayed.
    * @property {boolean} synced Are the cursors being synced across volumes?
    * @property {DOMElement} dom_element The DOM element where the viewer
    * will be inserted.
    * @property {active_panel} active_panel The slice panel that's currently
    * being manipulated.
    *
    * @description
    * The viewer object encapsulates all functionality of the Surface Viewer.
    * Handlers can be attached to the  **viewer** object to listen
    * for certain events occuring over the viewer's lifetime. Currently, the
    * following viewer events can be listened for:
    *
    * * **volumesloaded** Volumes loaded by **viewer.loadVolumes()** have finished loading.
    * * **rendering** Viewer has started rendering.
    * * **volumeuiloaded** A new volume UI has been created by the viewer.
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

    // Element where the viewer canvases will be loaded.
    var dom_element;
    
    if (typeof element === "string") {
      dom_element = document.getElementById(element);
    } else {
      dom_element = element;
    }

    var viewer = {
      dom_element: dom_element,
      volumes: [],
      synced: false
    };

    /**
    * @doc object
    * @name viewer.events:volumeloaded
    *
    * @description
    * Triggered when a volume loaded through **viewer.loadVolume()** or one of the
    * volumes loaded from **viewer.loadVolume()** has completely finished loading.
    * The following information will be passed in the event object:
    *
    * * **event.volume**: the loaded volume.
    *
    * ```js
    *    viewer.addEventListener("volumeloaded", function(event) {
    *      //...
    *    });
    * ```
    */
    /**
    * @doc object
    * @name viewer.events:volumesloaded
    *
    * @description
    * Triggered when volumes loaded through **viewer.loadVolumes()** have completely
    * finished loading. No special information is passed in the event object.
    *
    * ```js
    *    viewer.addEventListener("volumesloaded", function(event) {
    *      //...
    *    });
    * ```
    */
    /**
    * @doc object
    * @name viewer.events:rendering
    *
    * @description
    * Triggered when the viewer begins rendering after a call to **viewer.render()**.
    * No special information is passed in the event object.
    *
    * ```js
    *    viewer.addEventListener("rendering", function(event) {
    *      //...
    *    });
    * ```
    */
    /**
    * @doc object
    * @name viewer.events:volumeuiloaded
    *
    * @description
    * Triggered after a UI is created for a newly loaded volume. The following information 
    * will be passed in the event object:
    *
    * * **event.container**: the DOM element containing the UI.
    * * **event.volume**: the volume associated with the UI.
    * * **event.volume_id**: the ID of the loaded volume.
    *
    * ```js
    *    viewer.addEventListener("volumeuiloaded", function(event) {
    *      //...
    *    });
    * ```
    */
      
    Object.keys(VolumeViewer.modules).forEach(function(m) {
      VolumeViewer.modules[m](viewer);
    });

    BrainBrowser.events.addEventModel(viewer);

    console.log("BrainBrowser Volume Viewer v" + BrainBrowser.version);

    // Add keyboard controls
    keyboardControls();

    ////////////////////////////
    // Pass viewer to callback
    ////////////////////////////
    callback(viewer);


    /////////////////////////
    // PRIVATE FUNCTIONS
    /////////////////////////

    // Set up global keyboard interactions.
    function keyboardControls() {
      document.addEventListener("keydown", function(event) {
        if (!viewer.active_panel) return;
        var panel = viewer.active_panel;
        var volume = panel.volume;
        var axis_name = panel.axis;

        var key = event.which;
        var space_name, time;
        var cursor;
        
        var keys = {
          // CTRL
          17: function() {
            if (panel.anchor) {
              return;
            }

            if (panel.mouse.left || panel.mouse.middle || panel.mouse.right) {
              panel.anchor = {
                x: panel.mouse.x,
                y: panel.mouse.y
              };
            }
          },
          // Left
          37: function() {
            space_name = panel.slice.width_space.name;
            if (volume.position[space_name] > 0) {
              volume.position[space_name]--;
            }
          },
          // Up
          38: function() {
            space_name = panel.slice.height_space.name;
            if (volume.position[space_name] < panel.slice.height_space.space_length) {
              volume.position[space_name]++;
            }
          },
          // Right
          39: function() {
            space_name = panel.slice.width_space.name;
            if (volume.position[space_name] < panel.slice.width_space.space_length) {
              volume.position[space_name]++;
            }
          },
          // Down
          40: function() {
            space_name = panel.slice.height_space.name;
            if (volume.position[space_name] > 0) {
              volume.position[space_name]--;
            }
          }
        };

        if (typeof keys[key] === "function") {
          event.preventDefault();
          keys[key]();

          panel.updated = true;
          volume.display.forEach(function(other_panel) {
            if (panel !== other_panel) {
              other_panel.updateSlice();
            }
          });

          if (viewer.synced){
            cursor = panel.getCursorPosition();

            viewer.volumes.forEach(function(synced_volume) {
              var synced_panel;
              
              if (synced_volume !== volume) {
                synced_panel = synced_volume.display.getPanel(axis_name);
                synced_panel.updateVolumePosition(cursor.x, cursor.y);
                synced_volume.display.forEach(function(panel) {
                  if (panel !== synced_panel) {
                    panel.updateSlice();
                  }
                });
              }
            });
          }
          
          return false;
        }

        // Space
        if (key === 32) {
          event.preventDefault();

          if (volume.data.time) {

            if (event.shiftKey) {
              time = Math.max(0, volume.current_time - 1);
            } else {
              time = Math.min(volume.current_time + 1, volume.data.time.space_length - 1);
            }

            volume.current_time = time;

            if (viewer.synced){
              viewer.volumes.forEach(function(synced_volume) {
                if (synced_volume !== volume) {
                  synced_volume.current_time = Math.max(0, Math.min(time, synced_volume.data.time.space_length - 1));
                }
              });
            }

            viewer.redrawVolumes();

            return false;
          }

        }

      }, false);

      document.addEventListener("keyup", function(e) {
        var key = e.which;

        var keys = {
          // CTRL key
          17: function() {
            viewer.volumes.forEach(function(volume) {
              volume.display.forEach(function(panel) {
                panel.anchor = null;
              });
            });
          }
        };

        if (typeof keys[key] === "function") {
          e.preventDefault();
          keys[key]();

          return false;
        }
              
      }, false);
    }

    return viewer;
  };

})();

