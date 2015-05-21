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
*/

BrainBrowser.VolumeViewer.modules.loading = function(viewer) {
  "use strict";

  var VolumeViewer = BrainBrowser.VolumeViewer;
  var default_color_map = null;
  var default_panel_width = 256;
  var default_panel_height = 256;

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
  *       header_file: document.getElementById("header-file"),
  *       raw_data_file: document.getElementById("raw-data-file"),
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
      setVolume(i, volume_descriptions[i], function() {
        if (++num_loaded < num_descriptions) {
          return;
        }

        if (options.overlay && num_descriptions > 1) {
          viewer.createOverlay(overlay_options, function() {
            if (BrainBrowser.utils.isFunction(complete)) {
              complete();
            }

            viewer.triggerEvent("volumesloaded");
          });
        } else {
          if (BrainBrowser.utils.isFunction(complete)) {
            complete();
          }

          viewer.triggerEvent("volumesloaded");
        }
      });
    }
    
    for (i = 0; i < num_descriptions; i++) {
      loadVolume(i);
    }

  };

  /**
  * @doc function
  * @name viewer.loading:loadVolumeColorMapFromURL
  * @param {number} vol_id Index of the volume to be updated.
  * @param {string} url URL of the color map file.
  * @param {string} cursor_color Color to be used for the cursor.
  * @param {function} callback Callback to which the color map object will be passed
  *   after loading.
  *
  * @description
  * Load a color map for the specified volume.
  * ```js
  * viewer.loadVolumeColorMapFromURL(vol_id, url, "#FF0000", function(volume, color_map) {
  *   // Manipulate volume or color map.
  * });
  * ```
  */
  viewer.loadVolumeColorMapFromURL = function(vol_id, url, cursor_color, callback) {
    var options = { scale: 255 };
    if(url.indexOf('FreeSurfer') !== -1){
      options.freesurfer = true;
    }
    BrainBrowser.loader.loadColorMapFromURL(url, function(color_map) {
      setVolumeColorMap(vol_id, color_map, cursor_color, callback);
    }, options);
  };

  /**
  * @doc function
  * @name viewer.loading:loadDefaultColorMapFromURL
  * @param {string} url URL of the color map file.
  * @param {string} cursor_color Color to be used for the cursor.
  * @param {function} callback Callback to which the color map object will be passed
  *   after loading.
  *
  * @description
  * Load a default color map for the viewer. Used when a given volume
  *   doesn't have its color map set.
  * ```js
  * viewer.loadDefaultColorMapFromURL(url, "#FF0000", function(color_map) {
  *   // Manipulate color map.
  * });
  * ```
  */
  viewer.loadDefaultColorMapFromURL = function(url, cursor_color, callback) {
    BrainBrowser.loader.loadColorMapFromURL(url, function(color_map) {
      setDefaultColorMap(color_map, cursor_color, callback);
    }, { scale: 255 });
  };

  /**
  * @doc function
  * @name viewer.loading:loadVolumeColorMapFromFile
  * @param {number} vol_id Index of the volume to be updated.
  * @param {DOMElement} file_input File input element representing the color map file to load.
  * @param {string} cursor_color Color to be used for the cursor.
  * @param {function} callback Callback to which the color map object will be passed
  *   after loading.
  *
  * @description
  * Load a color map for the specified volume.
  * ```js
  * viewer.loadVolumeColorMapFromFile(vol_id, file_input_element, "#FF0000", function(volume, color_map) {
  *   // Manipulate volume or color map.
  * });
  * ```
  */
  viewer.loadVolumeColorMapFromFile = function(vol_id, file_input, cursor_color, callback) {
    BrainBrowser.loader.loadColorMapFromFile(file_input, function(color_map) {
      setVolumeColorMap(vol_id, color_map, cursor_color, callback);
    }, { scale: 255 });
  };

  /**
  * @doc function
  * @name viewer.loading:loadDefaultColorMapFromFile
  * @param {DOMElement} file_input File input element representing the color map file to load.
  * @param {string} cursor_color Color to be used for the cursor.
  * @param {function} callback Callback to which the color map object will be passed
  *   after loading.
  *
  * @description
  * Load a default color map for the viewer. Used when a given volume
  *   doesn't have its color map set.
  * ```js
  * viewer.loadDefaultColorMapFromFile(file_input_element, "#FF0000", function(color_map) {
  *   // Manipulate color map.
  * });
  * ```
  */
  viewer.loadDefaultColorMapFromFile = function(file_input, cursor_color, callback) {
    BrainBrowser.loader.loadColorMapFromFile(file_input, function(color_map) {
      setDefaultColorMap(color_map, cursor_color, callback);
    }, { scale: 255 });
  };

  /**
  * @doc function
  * @name viewer.loading:setVolumeColorMap
  * @param {number} vol_id Index of the volume to be updated.
  * @param {object} color_map Color map to use for the indicated volume.
  *
  * @description
  * Set the color map for the indicated volume using an actual color map
  *   object.
  * ```js
  * viewer.setVolumeColorMap(vol_id, color_map));
  * ```
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
  * ```js
  * // Load over the network.
  * viewer.loadVolume({
  *   type: "minc",
  *   header_url: "volume1.mnc?minc_headers=true",
  *   raw_data_url: "volume1.mnc?raw_data=true",
  *   template: {
  *     element_id: "volume-ui-template",
  *     viewer_insert_class: "volume-viewer-display"
  *   }
  * });
  *
  * // Load from local files.
  * viewer.loadVolume({
  *   type: "minc",
  *   header_file: document.getElementById("header-file"),
  *   raw_data_file: document.getElementById("raw-data-file"),
  *   template: {
  *     element_id: "volume-ui-template",
  *     viewer_insert_class: "volume-viewer-display"
  *   }
  * });
  * ```
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
  * ```js
  * viewer.clearVolumes();
  * ```
  */
  viewer.clearVolumes = function() {
    viewer.volumes.forEach(function(volume) {
      volume.triggerEvent("eventmodelcleanup");
    });

    viewer.volumes = [];
    viewer.active_panel = null;
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
  * ```js
  * viewer.createOverlay({
  *   template: {
  *     element_id: "overlay-ui-template",
  *     viewer_insert_class: "overlay-viewer-display"
  *   }
  * });
  * ```
  */
  viewer.createOverlay = function(description, callback) {

    description = description || {};

    viewer.loadVolume({
        volumes: viewer.volumes,
        type: "overlay",
        template: description.template,
        views: description.views || ["xspace", "yspace", "zspace"],
        views_description: description.views_description,
        canvas_layers: description.canvas_layers,
        style: description.style,
        id: description.id
      },
      callback
    );
  };

  /**
  * @doc function
  * @name viewer.loading:setDefaultPanelSize
  * @param {number} width Panel width.
  * @param {number} height Panel height.
  *
  * @description
  * Set the default size for panel canvases.
  * ```js
  * viewer.setDefaultPanelSize(512, 512);
  * ```
  */
  viewer.setDefaultPanelSize = function(width, height) {
    default_panel_width = width;
    default_panel_height = height;
  };

  ///////////////////////////
  // Private Functions
  ///////////////////////////

  // Open volume using appropriate volume loader
  function openVolume(volume_description, callback){
    var loader = VolumeViewer.volume_loaders[volume_description.type];
    var error_message;
    
    if(loader){
      loader(volume_description, callback);
    } else {
      error_message = "Unsuported Volume Type";

      BrainBrowser.events.triggerEvent("error", { message: error_message });
      throw new Error(error_message);
    }
  }

  // Place a volume at a certain position in the volumes array.
  // This function should be used with care as empty places in the volumes
  // array will cause problems with rendering.
  function setVolume(vol_id, volume_description, callback) {
    openVolume(volume_description, function(volume) {
      var slices_loaded = 0;
      var views = volume_description.views || ["xspace","yspace","zspace"];

      BrainBrowser.events.addEventModel(volume);

      volume.addEventListener("eventmodelcleanup", function() {
        volume.display.triggerEvent("eventmodelcleanup");
      });

      viewer.volumes[vol_id] = volume;
      volume.color_map = default_color_map;
      volume.display = createVolumeDisplay(viewer.dom_element, vol_id, volume_description);
      volume.propagateEventTo("*", viewer);

      ["xspace", "yspace", "zspace"].forEach(function(axis) {
        volume.position[axis] = Math.floor(volume.header[axis].space_length / 2);
        volume.position_continuous[axis] = Math.floor(volume.header[axis].space_length / 2);
      });

      volume.display.forEach(function(panel) {
        panel.updateSlice(function() {
          if (++slices_loaded === views.length) {
            viewer.triggerEvent("volumeloaded", {
              volume: volume
            });
            if (BrainBrowser.utils.isFunction(callback)) {
              callback(volume);
            }
          }
        });
      });

    });
  }

  function setDefaultColorMap(color_map, cursor_color, callback) {
    color_map.cursor_color = cursor_color;
    default_color_map = color_map;

    viewer.volumes.forEach(function(volume) {
      volume.color_map = volume.color_map || default_color_map;
    });

    if (BrainBrowser.utils.isFunction(callback)) {
      callback(color_map);
    }
  }

  function setVolumeColorMap(vol_id, color_map, cursor_color, callback) {
    color_map.cursor_color = cursor_color;
    viewer.setVolumeColorMap(vol_id, color_map);
    
    if (BrainBrowser.utils.isFunction(callback)) {
      callback(viewer.volumes[vol_id], color_map);
    }
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
    if(volume_description.id !== undefined){
      if(dom_element.id === "brainbrowser-" + volume_description.id){
        dom_element.appendChild(container);
      }
    }else{
      dom_element.appendChild(container);
    }
    

    if(volume_description.style){
      var att = document.createAttribute("style");
      att.value = volume_description.style;
      container.setAttributeNode(att);
    }

    var volume = viewer.volumes[vol_id];
          
    var display = VolumeViewer.createDisplay();
    var template_options = volume_description.template || {};
    var views = volume_description.views || ["xspace", "yspace", "zspace"];
    var template;

    display.propagateEventTo("*", volume);

    container.className = "volume-container";
    
    views.forEach(function(axis_name) {

      var canvas = document.createElement("canvas");
      canvas.id = "canvas_" + axis_name + "_vol" + vol_id;
      canvas.width = default_panel_width;
      canvas.height = default_panel_height;
      canvas.style.backgroundColor = "#000000";
      canvas.style.position = "absolute";
      canvas.top = 5;
      canvas.left = 5;
      canvas.style["z-index"] = 0;

      var canvasBuffer = document.createElement("canvas");
      canvasBuffer.id = "canvas_buffer_" + axis_name + "_vol" + vol_id;
      canvasBuffer.width = volume.header[axis_name].width;
      canvasBuffer.height = volume.header[axis_name].height;

      var div = document.createElement("div");
      div.id = "div_" + axis_name + "_vol" + vol_id;
      div.appendChild(canvas);
      div.style.position = "relative";
      div.style.height = default_panel_height + 10 + "px";
      div.style.width = default_panel_width + 10 + "px";
      container.appendChild(div);

      var view_description;
      if(volume_description.views_description && volume_description.views_description[axis_name]){
        view_description = volume_description.views_description[axis_name];
      }

      var canvas_layers = [];

      if(volume_description.canvas_layers){

        for(var i = 0; i < volume_description.canvas_layers.length; i++){
          var canvas_layer = document.createElement("canvas");
          canvas_layer.id = "canvas_layer_" + axis_name + "_vol" + vol_id;
          canvas_layer.width = default_panel_width;
          canvas_layer.height = default_panel_height;
          canvas_layer.style.position = "absolute";
          canvas_layer.top = 5;
          canvas_layer.left = 5;
          canvas_layer.style["z-index"] = i + 1;

          var canvas_layer_buffer = document.createElement("canvas");
          canvas_layer_buffer.id = "canvas_layer_buffer_" + axis_name + "_vol" + vol_id;
          canvas_layer_buffer.width = volume.header[axis_name].width;
          canvas_layer_buffer.height = volume.header[axis_name].height;

          canvas_layers.push({
            canvas_buffer: canvas_layer_buffer,
            canvas: canvas_layer,
            draw: volume_description.canvas_layers[i].draw
          });
          div.appendChild(canvas_layer);
        }
      }

      display.setPanel(
        axis_name,
        VolumeViewer.createPanel({
          volume: volume,
          volume_id: vol_id,
          axis: axis_name,
          canvas_div: div,
          canvas: canvas,
          canvas_buffer: canvasBuffer,
          view_description: view_description,
          canvas_layers: canvas_layers,
          image_translate: {
            x: default_panel_width/2,
            y: default_panel_height/2
          }
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
  
    ///////////////////////////////////
    // Mouse Events
    ///////////////////////////////////
    
    (function() {
      var current_target = null;
      
      views.forEach(function(axis_name) {
        var panel = display.getPanel(axis_name);
        var canvas = panel.canvas;
        if(panel.canvas_layers && panel.canvas_layers.length > 0){
          canvas = panel.canvas_layers[panel.canvas_layers.length - 1].canvas;
        }
        var last_touch_distance = null;

        function startDrag(pointer, shift_key, ctrl_key) {

          if (ctrl_key) {
            if(viewer.interaction_type === 1){
              
            }else{
              viewer.volumes.forEach(function(volume) {
                volume.display.forEach(function(panel) {
                  panel.anchor = null;
                });
              });

              panel.anchor = panel.getCursorPosition();
            }
          }

          if (!shift_key) {
            panel.updateVolumePosition(pointer.x, pointer.y);
            volume.display.forEach(function(other_panel) {
              if (panel !== other_panel) {
                other_panel.updateSlice();
              }
            });

            if (viewer.synced){
              viewer.volumes.forEach(function(synced_volume, synced_vol_id) {
                var synced_panel;
                
                if (synced_vol_id !== vol_id) {
                  synced_panel = synced_volume.display.getPanel(axis_name);
                  synced_panel.updateVolumePosition(pointer.x, pointer.y);
                  synced_volume.display.forEach(function(panel) {
                    if (panel !== synced_panel) {
                      panel.updateSlice();
                    }
                  });
                }
              });
            }
          }

          panel.updated = true;
        }

        function drag(pointer, shift_key, ctrl_key) {
          var drag_delta;

          if(shift_key) {

            drag_delta = panel.followPointer(pointer);

            panel.translateImage(drag_delta.dx, drag_delta.dy);

            if (viewer.synced){
              viewer.volumes.forEach(function(synced_volume, synced_vol_id) {
                var synced_panel;

                if (synced_vol_id !== vol_id) {
                  synced_panel = synced_volume.display.getPanel(axis_name);
                  synced_panel.translateImage(drag_delta.dx, drag_delta.dy);

                }
              });
            }
          }else if(ctrl_key && viewer.interaction_type === 1){
            
            drag_delta = panel.followPointer(pointer);

            if(drag_delta.dx > 0 && panel.contrast < 2){
              panel.contrast+=0.05;
            }else if(drag_delta.dx < 0 && panel.contrast > 0){
              panel.contrast-=0.05;
            }
            if(panel.contrast > 2){
              panel.contrast = 2;
            }
            if(panel.contrast < 0){
              panel.contrast = 0;
            }

            if(drag_delta.dy > 0 && panel.brightness > -1){
              panel.brightness-=0.05;
            }else if(drag_delta.dy < 0 && panel.brightness < 1){
              panel.brightness+=0.05;
            }
            if(panel.brightness > 1){
              panel.brightness = 1;
            }
            if(panel.brightness < -1){
              panel.brightness = -1;
            }
            panel.updateSlice();
            
            
          }else{
            panel.updateVolumePosition(pointer.x, pointer.y);
            volume.display.forEach(function(other_panel) {
              if (panel !== other_panel) {
                other_panel.updateSlice();
              }
            });

            if (viewer.synced){
              viewer.volumes.forEach(function(synced_volume, synced_vol_id) {
                var synced_panel;
                
                if (synced_vol_id !== vol_id) {
                  synced_panel = synced_volume.display.getPanel(axis_name);
                  synced_panel.updateVolumePosition(pointer.x, pointer.y);
                  synced_volume.display.forEach(function(panel) {
                    if (panel !== synced_panel) {
                      panel.updateSlice();
                    }
                  });
                }
              });
            }
          }

          panel.updated = true;
        }

        function mouseDrag(event) {
          if(event.target === current_target) {
            event.preventDefault();
            drag(panel.mouse, event.shiftKey, event.ctrlKey);
          }
        }

        function touchDrag(event) {
          if(event.target === current_target) {
            event.preventDefault();
            drag(panel.touches[0], panel.touches.length === views.length, event.ctrlKey);
          }
        }
        
        function mouseDragEnd() {
          document.removeEventListener("mousemove", mouseDrag, false);
          document.removeEventListener("mouseup", mouseDragEnd, false);
          viewer.volumes.forEach(function(volume) {
            volume.display.forEach(function(panel) {
              panel.anchor = null;
            });
          });
          current_target = null;
        }

        function touchDragEnd() {
          document.removeEventListener("touchmove", touchDrag, false);
          document.removeEventListener("touchend", touchDragEnd, false);
          viewer.volumes.forEach(function(volume) {
            volume.display.forEach(function(panel) {
              panel.anchor = null;
            });
          });
          current_target = null;
        }

        function touchZoom(event) {
          var dx = panel.touches[0].x - panel.touches[1].x;
          var dy = panel.touches[0].y - panel.touches[1].y;

          var distance = Math.sqrt(dx * dx + dy * dy);
          var delta;

          event.preventDefault();

          if (last_touch_distance !== null) {
            delta = distance - last_touch_distance;

            zoom(delta * 0.2);
          }

          last_touch_distance = distance;
        }

        function touchZoomEnd() {
          document.removeEventListener("touchmove", touchZoom, false);
          document.removeEventListener("touchend", touchZoomEnd, false);

          last_touch_distance = null;
        }
        
        canvas.addEventListener("mousedown", function(event) {
          event.preventDefault();

          current_target = event.target;
          
          if (viewer.active_panel) {
            viewer.active_panel.updated = true;
          }
          viewer.active_panel = panel;

          document.addEventListener("mousemove", mouseDrag , false);
          document.addEventListener("mouseup", mouseDragEnd, false);

          startDrag(panel.mouse, event.shiftKey, event.ctrlKey);
        }, false);

        canvas.addEventListener("touchstart", function(event) {
          event.preventDefault();

          current_target = event.target;

          if (viewer.active_panel) {
            viewer.active_panel.updated = true;
          }
          viewer.active_panel = panel;

          if (panel.touches.length === 2) {
            document.removeEventListener("touchmove", touchDrag, false);
            document.removeEventListener("touchend", touchDragEnd, false);
            document.addEventListener("touchmove", touchZoom, false);
            document.addEventListener("touchend", touchZoomEnd, false);
          } else {
            document.removeEventListener("touchmove", touchZoom, false);
            document.removeEventListener("touchend", touchZoomEnd, false);
            document.addEventListener("touchmove", touchDrag, false);
            document.addEventListener("touchend", touchDragEnd, false);

            startDrag(panel.touches[0], panel.touches.length === 3, true);
          }

        }, false);
        
        function wheelHandler(event) {
          event.preventDefault();

          zoom(Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail))));
        }

        function zoom(delta) {
          panel.zoom = Math.max(panel.zoom + delta * 0.05, 0.05);
          panel.updateSlice();

          if (viewer.synced){
            viewer.volumes.forEach(function(synced_volume, synced_vol_id) {
              var synced_panel = synced_volume.display.getPanel(axis_name);

              if (synced_vol_id !== vol_id) {
                synced_panel.zoom = panel.zoom;
                synced_panel.updateVolumePosition();
                synced_panel.updateSlice();
              }
            });
          }
        }

        canvas.addEventListener("mousewheel", wheelHandler, false);
        canvas.addEventListener("DOMMouseScroll", wheelHandler, false); // Dammit Firefox
      });
    })();

    viewer.triggerEvent("volumeuiloaded", {
      container: container,
      volume: volume,
      volume_id: vol_id
    });

    return display;
  }
};