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
* The BrainBrowser Surface Viewer is a tool for displaying and manipulating 3D datasets in real
* time. Basic usage consists of calling the **start()** method of the **SurfaceViewer** module, 
* which takes a callback function as its second argument, and then using the **viewer** object passed
* to that callback function to control how models are displayed:
*  ```js
*    BrainBrowser.SurfaceViewer.start("brainbrowser", function(viewer) {
*      
*      //Add an event listener.
*      viewer.addEventListener("displaymodel", function() {
*        console.log("We have a model!");
*      });
*
*      // Start rendering the scene.
*      viewer.render();
*
*      // Load a model into the scene.
*      viewer.loadModelFromURL("/models/brain_surface.obj");
*       
*      // Hook viewer behaviour into UI.
*      $("#wireframe").change(function(e) {
*        viewer.setWireframe($(this).is(":checked"));
*      });
*
*    });
*  ```
*/

/**
* @doc overview
* @name Configuration
*
* @description
* The Surface Viewer can be configured using the **set** and **get**
* methods of the **BrainBrowser.config** object. The only configuration
* parameter that must be manually set is **worker\_dir** which indicates
* the path to the directory where the Web Worker scripts are stored: 
*
* ```js
* BrainBrowser.config.set("worker_dir", "js/brainbrowser/workers");
* ```
* Configuration parameters used internally by the Surface Viewer also
* include **model\_types** and **intensity\_data\_types** which are used to 
* associate a Web Worker with each supported file type. Any other parameters
* can be used without issue to create custom configuration for a given
* app. 
*
* Configuration parameters can be retrieved using the **get** method:
*
* ```js
* var worker_dir = BrainBrowser.config.get("worker_dir");
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
* @name Object Model
*
* @description
* Data parsers producing models to be read by BrainBrowser must
* output their data according to the following object model:
* ```js
* {
*   type: ("line" | "polygon"),
*   name: "...",
*   vertices: [...],
*   normals: [...],
*   colors: [...],
*   shapes: [
*     {
*       name: "...",
*       color: [...],
*       indices: [...]  
*     },
*     {
*       name: "...",
*       color: [...],
*       indices: [...]  
*     }
*   ]
* }
* ```
* 
* Assuming a model with **n** vertices:
*
* * **type** (optional) is a string indicating whether the model consists 
*   of line or triangle data. Default: "polygon".  
* * **name** (optional) is a string identifier for the model. Default: 
*   the name of the file that the data was parsed from.  
* * **vertices** is a flat array of vertex **x**, **y**, **z** coordinates. 
*   Size: **n** X 3.
* * **normals** (optional) is a flat array of vertex normal vector **x**, 
*   **y**, **z** components. Size: **n** X 3. If a **normals** array is not 
*   provided, the Surface Viewer will attempt to appoximate the normals based 
*   on the vertex data.
* * **colors** (optional) is a flat array of **r**, **g**, **b**, **a** color 
*   values. Size: **n** X 4 or 4. If a 4-element array is given, that color
*   will be used for the entire model. If no color data is provided vertex 
*   colors will all be set to gray.
* * **shapes** is an array containing objects describing the different 
*   shapes the model represents. Each object will contain an **indices**
*   property which contains an array of indices pointing into the 
*   **vertices**, **colors** and **normals** arrays, indicating how to 
*   assemble them into triangles or line pieces. For **polygon** models,
*   each triplet of indices should describe a triangle. For **line** models,
*   each pair of indices should describe a line segment. Optionally, each
*   shape can also be given a **color** property, which indicates the color
*   of the shape (overriding model and vertex colors at the top level). The
*   color should be given as a 4-element array indicating **r**, **g**, **b**, 
*   **a** color values. An optional **name** property can also be given to 
*   identify the shape. If no **name** is provided, the **name** property 
*   defaults to a value based on the name of the file that contained the model 
*   and the shape's index number.   
*/
(function() {
  "use strict";
  
  var SurfaceViewer = BrainBrowser.SurfaceViewer = {

    /**
    * @doc function
    * @name SurfaceViewer.static methods:start
    * @param {string} element ID of a DOM element, or the DOM element itself, 
    * into which the viewer will be inserted.
    * @param {function} callback Callback function to which the viewer object
    * will be passed after creation.
    * @description
    * The start() function is the main point of entry to the Surface Viewer.
    * It creates a viewer object that is then passed to the callback function 
    * supplied by the user.
    *
    * ```js
    *   BrainBrowser.SurfaceViewer.start("brainbrowser", function(viewer) {
    *     
    *     //Add an event listener.
    *     viewer.addEventListener("displaymodel", function() {
    *       console.log("We have a model!");
    *     });
    *
    *     // Start rendering the scene.
    *     viewer.render();
    *
    *     // Load a model into the scene.
    *     viewer.loadModelFromURL("/models/brain_surface.obj");
    *      
    *     // Hook viewer behaviour into UI.
    *     $("#wireframe").change(function(e) {
    *       viewer.setWireframe($(this).is(":checked"));
    *     });
    *
    *   });
    * ```
    */
    start: function(element, callback) {

      console.log("BrainBrowser Surface Viewer v" + BrainBrowser.version);

      /**
      * @doc object
      * @name viewer
      * @property {DOMElement} dom_element The DOM element where the viewer
      * will be inserted.
      * @property {THREE.Object3D} model The currently loaded surface model.
      * @property {object} model_data Parameters about the current model that
      * were actually parsed from the source file.
      * @property {object} mouse Object tracking the mouse **x** and **y** coordinates
      * of the mouse on the viewer canvas.
      * @property {object} touches Object tracking the **x** and **y** coordinates
      * of all touches currently active on the canvas.
      * @property {boolean} updated Whether the canvas should redrawn on the next
      * render loop.
      * @property {float} zoom The zoom level (default: 1.0).
      * @property {object} autorotate Automatic rotations around the **x**, **y**
      * and **z** axes can be set.
      * @property {object} annotations Current annotations.
      * 
      * @description
      * The viewer object encapsulates all functionality of the Surface Viewer.
      * Handlers can be attached to the **viewer** object to listen 
      * for certain events occuring over the viewer's lifetime. Currently, the 
      * following viewer events can be listened for:
      * 
      * * **displaymodel** A new model has been displayed on the viewer.
      * * **loadintensitydata** New intensity data has been loaded.
      * * **updateintensitydata** The intensity data has been updated.
      * * **changeintensityrange** The intensity data range has been modified.
      * * **updatecolors** The model's colors have been updated.
      * * **loadcolormap** A new color map has been loaded.
      * * **blendcolormaps** Two color maps have been loaded and blended.
      * * **clearscreen** The viewer has been cleared of objects.
      * * **draw** The scene has been redrawn.
      *
      * To listen for an event, simply use the **viewer.addEventListener()** method with 
      * with the event name and a callback funtion:
      *
      * ```js
      *    viewer.addEventListener("displaymodel", function() {
      *      console.log("Model displayed!");
      *    });
      * ```
      */

      var attributes = {};

      // Element where the viewer canvas will be loaded.
      var dom_element;

      if (typeof element === "string") {
        dom_element = document.getElementById(element);
      } else {
        dom_element = element;
      }

      var viewer = {
        dom_element: dom_element,
        model: null,                                      // Scene graph root. Created in rendering module.
        model_data: null,                                 // Descriptions of all models. Created in loading module.
        mouse: BrainBrowser.utils.captureMouse(dom_element),
        touches: BrainBrowser.utils.captureTouch(dom_element),
        updated: true,
        zoom: 1,
        autorotate: {
          x: false,
          y: false,
          z: false
        },
        /**
        * @doc function
        * @name viewer.attributes:getAttribute
        * @param {string} name Name of the attribute to retrieve.
        * 
        * @description
        * Retrieve the value of an attribute.
        *
        * The viewer object can maintain an arbitrary set of key-value
        * to aid in the functioning of various parts of the system.
        * ```js
        * viewer.getAttribute("fix_color_range");
        * ```
        *
        * Currently, the following attributes are used by the Surface Viewer:
        *
        * * **fix\_color\_range** Maintain the current intensity range, even if new data is 
        *   loaded.
        */
        getAttribute: function(name) {
          return attributes[name];
        },
        /**
        * @doc function
        * @name viewer.attributes:setAttribute
        * @param {string} name Name of the attribute to retrieve.
        * @param {any} value Value to set the attribute to.
        * 
        * @description
        * Set the value of an attribute. 
        *
        * The viewer object can maintain an arbitrary set of key-value
        * pairs to aid in the functioning of various parts of the system.
        * ```js
        * viewer.setAttribute("fix_color_range", false);
        * ```
        *
        * Currently, the following attributes are used by the Surface Viewer:
        *
        * * **fix\_color\_range** Maintain the current intensity range, even if new data is 
        *   loaded.
        */
        setAttribute: function(name, value) {
          attributes[name] = value;
        },

        /**
        * @doc function
        * @name viewer.viewer:getVertex
        * @param {number} index Index of the vertex.
        * @returns {THREE.Vertex3} The vertex.
        *
        * @description
        * Get the vertex at the given index
        * ```js
        * viewer.getVertex(2356);
        * ```
        *
        * If more than one model file has been loaded, refer to the appropriate
        * model using the **model_name** option:
        * ```js
        * viewer.getVertex(2356, { model_name: "brain.obj" });
        * ```
        */
        getVertex: function(index, options) {
          options = options || {};
          var vertices = viewer.model_data.get(options.model_name).vertices;
          var i = index * 3;
          
          return new SurfaceViewer.THREE.Vector3(vertices[i], vertices[i+1], vertices[i+2]);
        }
      };
      
      //////////////////////////////
      // Load modules.
      //////////////////////////////

      /**
      * @doc object
      * @name viewer.events:displaymodel
      *
      * @description
      * Triggered when a new model is displayed on the viewer. The following information 
      * will be passed in the event object:
      *
      * * **event.model**: the visualized model as a THREE.Object3D object.
      * * **event.model\_data**: the data that the model represents.
      * * **event.new\_shapes**: an array of newly added shapes as THREE.Object3D objects.
      *
      * ```js
      *    viewer.addEventListener("displaymodel", function(event) {
      *      //...
      *    });
      * ```
      */
      /**
      * @doc object
      * @name viewer.events:loadintensitydata
      *
      * @description
      * Triggered when a new intensity is loaded. The following information 
      * will be passed in the event object:
      *
      * * **event.model\_data**: the model data with which the intensity data is associated.
      * * **event.intensity\_data**: the loaded intensity data.
      *
      * ```js
      *    viewer.addEventListener("loadintensitydata", function(event) {
      *      //...
      *    });
      * ```
      */
      /**
      * @doc object
      * @name viewer.events:loadcolormap
      *
      * @description
      * Triggered when a new color map has finished loading. The following information 
      * will be passed in the event object:
      *
      * * **event.color\_map**: the loaded color map.
      *
      * ```js
      *    viewer.addEventListener("loadcolormap", function(event) {
      *      //...
      *    });
      * ```
      */
      /**
      * @doc object
      * @name viewer.events:clearscreen
      *
      * @description
      * Triggered when the screen is cleared. No special information is
      * passed in the event object.
      *
      * ```js
      *    viewer.addEventListener("clearscreen", function(event) {
      *      //...
      *    });
      * ```
      */
      /**
      * @doc object
      * @name viewer.events:updateintensitydata
      *
      * @description
      * Triggered when the intensity is updated. The following information 
      * will be passed in the event object:
      *
      * * **event.model\_data**: the model data on which the intensity data was updated.
      * * **event.intensity\_data**: the intensity data that was updated.
      * * **event.index**: the index at which the intensity value was updated.
      * * **event.value**: the new intensity value.
      *
      * ```js
      *    viewer.addEventListener("updateintensitydata", function(event) {
      *      //...
      *    });
      * ```
      */
      /**
      * @doc object
      * @name viewer.events:changeintensityrange
      *
      * @description
      * Triggered when the intensity range changes. The following information 
      * will be passed in the event object:
      *
      * * **event.model\_data**: the model data on which the intensity data was updated.
      * * **event.intensity\_data**: the intensity data that was updated.
      * * **event.min**: the new minimum intensity value.
      * * **event.max**: the new maximum intensity value.
      *
      * ```js
      *    viewer.addEventListener("changeintensityrange", function(event) {
      *      //...
      *    });
      * ```
      */
      /**
      * @doc object
      * @name viewer.events:updatecolors
      *
      * @description
      * Triggered when model's colors are udpated. The following information 
      * will be passed in the event object:
      *
      * * **event.model\_data**: the model data on representing the model that was updated.
      * * **event.intensity\_data**: the intensity data used to update the colors.
      * * **event.colors**: newly created array of colors.
      * * **event.blend**: was the the color array created by blending multiple intensity sets?
      *
      * ```js
      *    viewer.addEventListener("updatecolors", function(event) {
      *      //...
      *    });
      * ```
      */
      /**
      * @doc object
      * @name viewer.events:blendcolors
      *
      * @description
      * Triggered when multiple sets of intensity data have been loaded and blended. 
      * The following information will be passed in the event object:
      *
      * * **event.model\_data**: the model data on representing the model that was updated.
      * * **event.intensity\_data**: the intensity data used to update the colors.
      * * **event.colors**: newly created array of colors.
      *
      * ```js
      *    viewer.addEventListener("blendcolors", function(event) {
      *      //...
      *    });
      * ```
      *
      */
      /**
      * @doc object
      * @name viewer.events:draw
      *
      * @description
      * Triggered when the scene is redrawn. The following information 
      * will be passed in the event object:
      *
      * * **event.renderer**: the three.js renderer being used to draw the scene.
      * * **event.scene**: the THREE.Scene object representing the scene.
      * * **event.camera**: the THREE.PerspectiveCamera object being used to draw the scene.
      *
      * ```js
      *    viewer.addEventListener("draw", function(event) {
      *      //...
      *    });
      * ```
      */
      /**
      * @name viewer.events:zoom
      *
      * @description
      * Triggered when the user changes the zoom level of the viewer (scroll or touch events).
      * The following information will be passed in the event object:
      *
      * * **event.zoom**: the new zoom level.
      *
      * ```js
      *    viewer.addEventListener("zoom", function(event) {
      *      //...
      *    });
      * ```
      *
      */
      Object.keys(SurfaceViewer.modules).forEach(function(m) {
        SurfaceViewer.modules[m](viewer);
      });

      BrainBrowser.events.addEventModel(viewer);

      // Trigger a redraw on any event.
      BrainBrowser.events.addEventListener("*", function(event_name) {
        if (event_name !== "draw") {
          viewer.updated = true;
        }
      });

      //////////////////////////////////////////////////////  
      // Prepare workers and pass SurfaceViewer instance 
      // to calling application. 
      ////////////////////////////////////////////////////// 
      
      setupWorkers(function() {
        callback(viewer);
      });

      return viewer;
    }
  };

  // Standard modules.
  SurfaceViewer.modules = {};

  // URLS for Web Workers.
  // May be network or Blob URLs
  SurfaceViewer.worker_urls = {};

  // Configuration for built-in parsers.
  BrainBrowser.config.set("model_types.json.worker", "json.worker.js");
  BrainBrowser.config.set("model_types.mniobj.worker", "mniobj.worker.js");
  BrainBrowser.config.set("model_types.wavefrontobj.worker", "wavefrontobj.worker.js");
  BrainBrowser.config.set("model_types.freesurferbin.worker", "freesurferbin.worker.js");
  BrainBrowser.config.set("model_types.freesurferbin.binary", true);
  BrainBrowser.config.set("model_types.freesurferasc.worker", "freesurferasc.worker.js");
  BrainBrowser.config.set("intensity_data_types.text.worker", "text.intensity.worker.js");
  BrainBrowser.config.set("intensity_data_types.freesurferbin.worker", "freesurferbin.intensity.worker.js");
  BrainBrowser.config.set("intensity_data_types.freesurferbin.binary", true);
  BrainBrowser.config.set("intensity_data_types.freesurferasc.worker", "freesurferasc.intensity.worker.js");

  // Build worker URLs and attempt to inline 
  // them using Blob URLs if possible.
  function setupWorkers(callback) {
    
    var worker_dir = BrainBrowser.config.get("worker_dir");
    var error_message;

    if (worker_dir === null) {
      error_message = "error in SurfaceViewer configuration.\n" +
        "BrainBrowser configuration parameter 'worker_dir' not defined.\n" +
        "Use 'BrainBrowser.config.set(\"worker_dir\", ...)' to set it.";
      
      BrainBrowser.events.triggerEvent("error", { message: error_message });
      throw new Error(error_message);
    }

    var workers = {
      deindex: "deindex.worker.js",
      wireframe: "wireframe.worker.js"
    };

    var workers_loaded = 0;
    var worker_names;
    var model_types = BrainBrowser.config.get("model_types");
    var intensity_data_types = BrainBrowser.config.get("intensity_data_types");

    if (model_types !== null) {
      Object.keys(model_types).forEach(function(type) {
        workers[type + "_model"] = model_types[type].worker;
      });
    }

    if (intensity_data_types !== null) {
      Object.keys(intensity_data_types).forEach(function(type) {
        workers[type + "_intensity"] = intensity_data_types[type].worker;
      });
    }

    worker_names = Object.keys(workers);

    if (worker_names.length === 0) {
      callback();
      return;
    }

    if (window.URL && window.URL.createObjectURL) {

      worker_names.forEach(function(name) {
        var url = worker_dir + "/" + workers[name];

        var request = new XMLHttpRequest();
        var status;

        request.open("GET", url);
        request.onreadystatechange = function() {
          if (request.readyState === 4){
            status = request.status;

            // Based on jQuery's "success" codes.
            if(status >= 200 && status < 300 || status === 304) {
              SurfaceViewer.worker_urls[name] = BrainBrowser.utils.createDataURL(request.response, "application/javascript");
            } else {
              SurfaceViewer.worker_urls[name] = url;
            }

            if (++workers_loaded === worker_names.length) {
              callback();
            }
          }
        };

        request.send();

      });

    } else {

      worker_names.forEach(function(name) {
        SurfaceViewer.worker_urls[name] = worker_dir + "/" + workers[name];
      });

      callback();

    }

  }
  
})();


