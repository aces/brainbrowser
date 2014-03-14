/*
* BrainBrowser: Web-based Neurological Visualization Tools
* (https://brainbrowser.cbrain.mcgill.ca)
*
* Copyright (C) 2011 Alan Evans, McGill University 
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
* The BrainBrowser Surface Viewer is a tool for displayed and manipulating 3D datasets in real
* time. Basic usage consists of calling the **start()** method of the **SurfaceViewer** module, 
* which takes a callback function as its second argument, and then using the **viewer** object passed
* to that callback function to control how models are displayed:
*  ```js
*    BrainBrowser.SurfaceViewer.start("brainbrowser", function(viewer) {
*      
*      //Add an event listener.
*      viewer.addEventListener("displaymodel", function(model) {
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
*      $('#wireframe').change(function(e) {
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
* The Surface Viewer is configured by defining the object **BrainBrowser.config.surface_viewer**.
* Currently the properties available for configuration are the directory in which worker scripts 
* are stored and desciptions of supported filetypes for defining models. The **worker\_dir** 
* option indicates the base URL at which all worker scripts are stored, and the **filetypes** 
* indicate the names of the filetypes as well as the specific worker script used to parse them:
* 
* ```js
* BrainBrowser.config = {
* 
*   surface_viewer: {
*
*     worker_dir: "js/brainbrowser/workers/",
*
*     filetypes: {
*       mniobj: {
*         worker: "mniobj.worker.js",
*       },
*       wavefrontobj: {
*         worker: "wavefrontobj.worker.js"
*       },
*       freesurferasc: {
*         worker: "freesurferasc.worker.js",
*       }
*     }
*
*   }
*   
* }
* ```
* 
*/
(function() {
  "use strict";

  var BrainBrowser = window.BrainBrowser = window.BrainBrowser || {};
  
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
    *      viewer.addEventListener("displaymodel", function(model) {
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
    *      $('#wireframe').change(function(e) {
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
      * @property {DOMElement} view_window The DOM element where the viewer
      * will be inserted.
      * @property {THREE.Object3D} model The currently loaded surface model.
      * 
      * @description
      * The viewer object encapsulates all functionality of the Surface Viewer.
      * Handlers can be attached to the viewer to listen for certain events 
      * occuring over its lifetime. Currently, the following viewer events 
      * can be listened for:
      * 
      * * **displaymodel** A new model has been displayed on the viewer.
      * * **loadintensitydata** New intensity data has been loaded.
      * * **loadcolormap** A new color map has been loaded.
      * * **rangechange** The color range has been modified.
      * * **blendcolormaps** Two color maps have been loaded and blended.
      * * **clearscreen** The viewer has been cleared of objects.
      * * **error** An error has occured.
      *
      * To listen for an event, simply use the viewer's **addEventListener()** method with 
      * with the event name and a callback funtion:
      *
      * ```js
      *    viewer.addEventListener("displaymodel", function() {
      *      console.log("Model displayed!");
      *    });
      *
      * ```
      */

      var attributes = {};

      var viewer = {
        view_window: document.getElementById(element_id), // Div where the canvas will be loaded.
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
        *
        * Currently, the following attributes are used by the Surface Viewer:
        *
        * * clamp_colors: clamp intensity values outside the current range to maximum
        *   and minimum values of the color map.
        * * flip_colors: invert the intensity to color map relationship.
        * * fix_color_range: maintain the current intensity range, even if new data is 
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
        *
        * Currently, the following attributes are used by the Surface Viewer:
        *
        * * clamp_colors: clamp intensity values outside the current range to maximum
        *   and minimum values of the color map.
        * * flip_colors: invert the intensity to color map relationship.
        * * fix_color_range: maintain the current intensity range, even if new data is 
        *   loaded.
        */
        setAttribute: function(name, value) {
          attributes[name] = value;
        }
      };
      
      //////////////////////////////
      // Load modules.
      //////////////////////////////

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
      * @name viewer.events:displaymodel
      *
      * @description
      * Triggered when a model new model is displayed on the viewer. The displayed model, as a THREE.Object3D
      * object, will be passed to the event handler:
      *
      * ```js
      *    viewer.addEventListener("displaymodel", function(model) {
      *      //...
      *    });
      * ```
      */
      /**
      * @doc object
      * @name viewer.events:loadintensitydata
      *
      * @description
      * Triggered when a new intensity is loaded. The new intensity data
      * object will be passed to the event handler:
      *
      * ```js
      *    viewer.addEventListener("loadintensitydata", function(intensity_data) {
      *      //...
      *    });
      * ```
      */
      /**
      * @doc object
      * @name viewer.events:loadcolormap
      *
      * @description
      * Triggered when a new color map has finished loading. The loaded color map
      * object will be passed to the event handler:
      *
      * ```js
      *    viewer.addEventListener("loadcolormap", function(color_map) {
      *      //...
      *    });
      * ```
      */
      /**
      * @doc object
      * @name viewer.events:clearscreen
      *
      * @description
      * Triggered when the screen is cleared. The event handler receives
      * no arguments.
      *
      * ```js
      *    viewer.addEventListener("clearscreen", function() {
      *      //...
      *    });
      * ```
      */
      /**
      * @doc object
      * @name viewer.events:rangechange
      *
      * @description
      * Triggered when the intensity range changes. The modified intensity data
      * object will be passed to the event handler:
      *
      * ```js
      *    viewer.addEventListener("rangechange", function(intensity_data) {
      *      //...
      *    });
      * ```
      */
      /**
      * @doc object
      * @name viewer.events:blenddata
      *
      * @description
      * Triggered when two sets of intensity data have been loaded and blended. 
      * The event handler receives no arguments.
      *
      * ```js
      *    viewer.addEventListener("blenddata", function() {
      *      //...
      *    });
      * ```
      *
      */
      /**
      * @doc object
      * @name viewer.events:error
      *
      * @description
      * Triggered when an error of some sort has occured. The error message, if any,
      * is passed as the callbacks sole argument.
      *
      * ```js
      *    viewer.addEventListener("error", function(error_message) {
      *      //...
      *    });
      * ```
      *
      */
      BrainBrowser.utils.eventModel(viewer);

      Object.keys(SurfaceViewer.modules).forEach(function(m) {
        SurfaceViewer.modules[m](viewer);
      });

      if (BrainBrowser.utils.checkConfig("surface_viewer.worker_dir")) {
        setupWorkers();
      }

      //////////////////////////////////////////////////////  
      // Pass SurfaceViewer instance to calling application. 
      ////////////////////////////////////////////////////// 
      callback(viewer);
    }
  };

  // Standard modules.
  SurfaceViewer.modules = {};

  // URLS for Web Workers.
  // May be network or Blob URLs
  SurfaceViewer.worker_urls = {};

  // Build worker URLs and attempt to inline 
  // them using Blob URLs if possible.
  function setupWorkers() {
    var workers = {
      deindex: "deindex.worker.js"
    };
    var config = BrainBrowser.config.surface_viewer;

    if (BrainBrowser.utils.checkConfig("surface_viewer.model_types")) {
      Object.keys(config.model_types).forEach(function(type) {
        workers[type + "_model"] = config.model_types[type].worker;
      });
    }

    if (BrainBrowser.utils.checkConfig("surface_viewer.intensity_data_types")) {
      Object.keys(config.intensity_data_types).forEach(function(type) {
        workers[type + "_intensity"] = config.intensity_data_types[type].worker;
      });
    }

    Object.keys(workers).forEach(function(type) {
      var url = config.worker_dir + "/" + workers[type];
      if (window.URL && window.URL.createObjectURL) {
        var request = new XMLHttpRequest();
        var status, blob;

        request.open("GET", url);
        request.onreadystatechange = function() {
          if (request.readyState === 4){
            status = request.status;

            // Based on jQuery's "success" codes.
            if(status >= 200 && status < 300 || status === 304) {
              blob = new Blob([request.response], {type : "application/javascript"});
              SurfaceViewer.worker_urls[type] = window.URL.createObjectURL(blob);
            } else {
              SurfaceViewer.worker_urls[type] = url;
            }
          }
        };

        request.send();
      } else {
        SurfaceViewer.worker_urls[type] = url;
      }
    });
  }
  
})();


