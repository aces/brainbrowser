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
*      BrainBrowser.events.addEventListener("displaymodel", function(model) {
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
(function() {
  "use strict";
  
  var SurfaceViewer = BrainBrowser.SurfaceViewer = {

    /**
    *  @doc function
    *  @name SurfaceViewer.static methods:start
    *  @param {string} element_id ID of the DOM element 
    *  in which the viewer will be inserted.
    *  @param {function} callback Callback function to which the viewer object
    *  will be passed after creation.
    *  @description
    *  The start() function is the main point of entry to the Surface Viewer.
    *  It creates a viewer object that is then passed to the callback function 
    *  supplied by the user.
    *
    *  ```js
    *    BrainBrowser.SurfaceViewer.start("brainbrowser", function(viewer) {
    *      
    *      //Add an event listener.
    *      BrainBrowser.events.addEventListener("displaymodel", function(model) {
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
    start: function(element_id, callback) {

      console.log("BrainBrowser Surface Viewer v" + BrainBrowser.version);

      /////////////////////////////////
      // Browser compatibility checks.
      /////////////////////////////////
      
      if (!BrainBrowser.utils.webWorkersEnabled() ) {
        alert("Can't find web workers. Exiting.");
        return;
      }
      
      if (!BrainBrowser.utils.webglEnabled()) {
        alert("Can't get WebGL context. Exiting.");
        return;
      }

      /**
      * @doc object
      * @name viewer
      * @property {DOMElement} dom_element The DOM element where the viewer
      * will be inserted.
      * @property {THREE.Object3D} model The currently loaded surface model.
      * 
      * @description
      * The viewer object encapsulates all functionality of the Surface Viewer.
      * Handlers can be attached to the **BrainBrowser.events** object to listen 
      * for certain events occuring over the viewer's lifetime. Currently, the 
      * following viewer events can be listened for:
      * 
      * * **displaymodel** A new model has been displayed on the viewer.
      * * **loadintensitydata** New intensity data has been loaded.
      * * **loadcolormap** A new color map has been loaded.
      * * **rangechange** The color range has been modified.
      * * **blendcolormaps** Two color maps have been loaded and blended.
      * * **clearscreen** The viewer has been cleared of objects.
      * * **error** An error has occured.
      *
      * To listen for an event, simply use the **BrainBrowser.events.addEventListener()** method with 
      * with the event name and a callback funtion:
      *
      * ```js
      *    BrainBrowser.events.addEventListener("displaymodel", function() {
      *      console.log("Model displayed!");
      *    });
      *
      * ```
      */

      var attributes = {};

      var viewer = {
        dom_element: document.getElementById(element_id), // Div where the canvas will be loaded.
        model: null,                                      // The currently loaded model. Should be set by rendering.
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
        * viewer.getAttribute("clamp_colors");
        * ```
        *
        * Currently, the following attributes are used by the Surface Viewer:
        *
        * * **clamp\_colors** Clamp intensity values outside the current range to maximum
        *   and minimum values of the color map.
        * * **flip\_colors** Invert the intensity to color map relationship.
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
        * viewer.setAttribute("clamp_colors", false);
        * ```
        *
        * Currently, the following attributes are used by the Surface Viewer:
        *
        * * **clamp\_colors** Clamp intensity values outside the current range to maximum
        *   and minimum values of the color map.
        * * **flip\_colors** Invert the intensity to color map relationship.
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
        */
        getVertex: function(index) {
          var vertices = viewer.model_data.vertices;
          var i = index * 3;
          
          return new THREE.Vector3(vertices[i], vertices[i+1], vertices[i+2]);
        }
      };
      
      //////////////////////////////
      // Load modules.
      //////////////////////////////

      /**
      * @doc object
      * @name SurfaceViewer.events:displaymodel
      *
      * @description
      * Triggered when a model new model is displayed on the viewer. The displayed model, as a THREE.Object3D
      * object, will be passed to the event handler:
      *
      * ```js
      *    BrainBrowser.events.addEventListener("displaymodel", function(model) {
      *      //...
      *    });
      * ```
      */
      /**
      * @doc object
      * @name SurfaceViewer.events:loadintensitydata
      *
      * @description
      * Triggered when a new intensity is loaded. The new intensity data
      * object will be passed to the event handler:
      *
      * ```js
      *    BrainBrowser.events.addEventListener("loadintensitydata", function(intensity_data) {
      *      //...
      *    });
      * ```
      */
      /**
      * @doc object
      * @name SurfaceViewer.events:loadcolormap
      *
      * @description
      * Triggered when a new color map has finished loading. The loaded color map
      * object will be passed to the event handler:
      *
      * ```js
      *    BrainBrowser.events.addEventListener("loadcolormap", function(color_map) {
      *      //...
      *    });
      * ```
      */
      /**
      * @doc object
      * @name SurfaceViewer.events:clearscreen
      *
      * @description
      * Triggered when the screen is cleared. The event handler receives
      * no arguments.
      *
      * ```js
      *    BrainBrowser.events.addEventListener("clearscreen", function() {
      *      //...
      *    });
      * ```
      */
      /**
      * @doc object
      * @name SurfaceViewer.events:rangechange
      *
      * @description
      * Triggered when the intensity range changes. The modified intensity data
      * object will be passed to the event handler:
      *
      * ```js
      *    BrainBrowser.events.addEventListener("rangechange", function(intensity_data) {
      *      //...
      *    });
      * ```
      */
      /**
      * @doc object
      * @name SurfaceViewer.events:blenddata
      *
      * @description
      * Triggered when two sets of intensity data have been loaded and blended. 
      * The event handler receives no arguments.
      *
      * ```js
      *    BrainBrowser.events.addEventListener("blenddata", function() {
      *      //...
      *    });
      * ```
      *
      */
      /**
      * @doc object
      * @name SurfaceViewer.events:error
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

      Object.keys(SurfaceViewer.modules).forEach(function(m) {
        SurfaceViewer.modules[m](viewer);
      });

      //////////////////////////////////////////////////////  
      // Prepare workers and pass SurfaceViewer instance 
      // to calling application. 
      ////////////////////////////////////////////////////// 
      
      setupWorkers(function() {
        callback(viewer);
      });

    }
  };

  // Standard modules.
  SurfaceViewer.modules = {};

  // URLS for Web Workers.
  // May be network or Blob URLs
  SurfaceViewer.worker_urls = {};

  // Configuration for built-in parsers.
  BrainBrowser.config.set("model_types.mniobj.worker", "mniobj.worker.js");
  BrainBrowser.config.set("model_types.wavefrontobj.worker", "wavefrontobj.worker.js");
  BrainBrowser.config.set("model_types.freesurferasc.worker", "freesurferasc.worker.js");
  BrainBrowser.config.set("intensity_data_types.mniobj.worker", "mniobj.intensity.worker.js");
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
      
      BrainBrowser.events.triggerEvent("error", error_message);
      throw new Error(error_message);
    }

    var workers = {
      deindex: "deindex.worker.js"
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
        var status, blob;

        request.open("GET", url);
        request.onreadystatechange = function() {
          if (request.readyState === 4){
            status = request.status;

            // Based on jQuery's "success" codes.
            if(status >= 200 && status < 300 || status === 304) {
              blob = new Blob([request.response], {type : "application/javascript"});
              SurfaceViewer.worker_urls[name] = window.URL.createObjectURL(blob);
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


