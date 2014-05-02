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
*/

BrainBrowser.VolumeViewer.modules.loading = function(viewer) {
  "use strict";

  var VolumeViewer = BrainBrowser.VolumeViewer;

  /**
  * @doc function
  * @name viewer.loading:loadVolumes
  * @param {object} options Description of volumes to load:
  * * **volumes** {array} An array of volume descriptions.
  * * **overlay** {boolean|object} Set to true to display an overlay of 
  *   the loaded volumes without any interface, or provide and object 
  *   containing a description of the template to use for the UI (see below).
  * * **complete** {function} Callback invoked once all volumes are loaded.
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
  * The volume viewer can use the following parameters to describe the volumes to be loaded:
  * * **type** The type of volume. This should map to one of the volume loaders.
  * * **template** (optional) Object containing information about the template to use
  *   to produce the UI for each volume. Its properties include **element\_id**,
  *   the id of the element containing the template, and
  *   **viewer\_insert\_class**, the class of the element within the template
  *   in which to insert the volume's display panels.
  *
  * Other parameters may be required for given volume types.
  */
  viewer.loadVolumes = function(options) {

    options = options || {};
    var overlay_options = options.overlay && typeof options.overlay === "object" ? options.overlay : {};
          
    var volume_descriptions = options.volumes;
    var num_descriptions = options.volumes.length;

    var complete = options.complete;
    var num_loaded = 0;
    var i;
        
    function loadVolume(i) {
      setVolume(i, volume_descriptions[i], function(volume) {
        if (++num_loaded < num_descriptions) {
          return;
        }
        
        if (options.overlay && num_descriptions > 1) {
          viewer.createOverlay(overlay_options, function() {
            if (BrainBrowser.utils.isFunction(complete)) {
              complete();
            }

            BrainBrowser.events.triggerEvent("volumesloaded");
          });
        } else {
          if (BrainBrowser.utils.isFunction(complete)) {
            complete();
          }

          BrainBrowser.events.triggerEvent("volumesloaded");
        }
      });
    }
    
    for (i = 0; i < num_descriptions; i++) {
      loadVolume(i);
    }

  };

  /**
  * @doc function
  * @name viewer.volumes:loadVolumeColorMap
  * @param {number} vol_id Index of the volume to be updated. 
  * @param {string} url URL of the color map file. 
  * @param {string} cursor_color Color to be used for the cursor.
  * @param {function} callback Callback to which the color map object will be passed
  *   after loading.
  *
  * @description
  * Load a color map for the specified volume.
  */
  viewer.loadVolumeColorMap = function(vol_id, url, cursor_color, callback) {
    BrainBrowser.loader.loadColorMapFromURL(url, function(color_map) {
      color_map.cursor_color = cursor_color;
      viewer.setVolumeColorMap(vol_id, color_map);
      
      if (BrainBrowser.utils.isFunction(callback)) {
        callback(viewer.volumes[vol_id], color_map);
      }

    });
  };

  /**
  * @doc function
  * @name viewer.volumes:loadDefaultColorMap
  * @param {string} url URL of the color map file. 
  * @param {string} cursor_color Color to be used for the cursor.
  *
  * @description
  * Load a default color map for the viewer. Used when a given volume
  *   doesn't have its color map set.
  */
  viewer.loadDefaultColorMap = function(url, cursor_color) {
    BrainBrowser.loader.loadColorMapFromURL(url, function(color_map) {
      color_map.cursor_color = cursor_color;
      viewer.default_color_map = color_map;
    });
  };

  /**
  * @doc function
  * @name viewer.volumes:setVolumeColorMap
  * @param {number} vol_id Index of the volume to be updated. 
  * @param {object} color_map Color map to use for the indicated volume.
  *
  * @description
  * Set the color map for the indicated volume using an actual color map 
  *   object.
  */
  viewer.setVolumeColorMap = function(vol_id, color_map) {
    viewer.volumes[vol_id].color_map = color_map;
  };

  /**
  * @doc function
  * @name viewer.loading:loadVolume
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
  * @name viewer.loading:clearVolumes
  *
  * @description
  * Clear all loaded volumes.
  */
  viewer.clearVolumes = function() {
    viewer.volumes = [];
    viewer.active_canvas = null;
    viewer.active_cursor = null;
    viewer.dom_element.innerHTML = "";
  };

  /**
  * @doc function
  * @name viewer.loading:createOverlay
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

  // Open volume using appropriate volume loader
  function openVolume(volume_description, callback){
    var loader = VolumeViewer.volume_loaders[volume_description.type];
    
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
      var slices_loaded = 0;

      viewer.volumes[vol_id] = volume;
      volume.position = {};
      volume.display = createVolumeDisplay(viewer.dom_element, vol_id, volume_description);
      volume.color_map = viewer.default_color_map;

      ["xspace", "yspace", "zspace"].forEach(function(axis, axis_num) {
        var position = volume.position[axis] = Math.floor(volume.header[axis].space_length / 2);
        
        viewer.fetchSlice(vol_id, axis, position, function() {
          if (++slices_loaded === 3 && BrainBrowser.utils.isFunction(callback)) {
            callback(volume);
          }
        });

      });

    });
  }

  function getTemplate(dom_element, vol_id, template_id, viewer_insert_class) {
    var template = document.getElementById(template_id).innerHTML.replace(/\{\{VOLID\}\}/gm, vol_id);
    var temp = document.createElement("div");
    temp.innerHTML = template;
    
    var template_elements = temp.childNodes;
    var viewer_insert = temp.getElementsByClassName(viewer_insert_class)[0];

    var i, count;
    var node;

    for (i = 0, count = dom_element.childNodes.length; i < count; i++) {
      node = dom_element.childNodes[i];
      if (node.nodeType === 1) {
        viewer_insert.appendChild(node);
        i--;
        count--;
      }
    }

    return template_elements;
  }

  // Create canvases and add mouse interface.
  function createVolumeDisplay(dom_element, vol_id, volume_description) {
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
      
      ["xspace", "yspace", "zspace"].forEach(function(axis_name, axis_num) {
        var panel = display[axis_num];
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
                    volume.display[axis_num].followCursor(cursor);
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
                  var panel = volume.display[axis_num];
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
          
          viewer.fetchSlice(vol_id, ["xspace", "yspace", "zspace"][axis_num]);
          if (viewer.synced){
            viewer.volumes.forEach(function(volume, synced_vol_id) {
              if (synced_vol_id !== vol_id) {
                var panel = volume.display[axis_num];
                panel.zoom = Math.max(panel.zoom + delta * 0.05, 0.05);
                viewer.fetchSlice(synced_vol_id, ["xspace", "yspace", "zspace"][axis_num]);
              }
            });
          }
        }

        canvas.addEventListener("mousewheel", wheelHandler, false);
        canvas.addEventListener("DOMMouseScroll", wheelHandler, false); // Dammit Firefox
      });
    })();
    
    dom_element.appendChild(container);
    BrainBrowser.events.triggerEvent("volumeuiloaded", container, vol_id);

    return display;
  }
};