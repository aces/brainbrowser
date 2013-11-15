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
*      viewer.loadModelFromUrl("/models/brain_surface.obj");
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
* @doc object
* @name Events
*
* @description
* The Surface Viewer event model can be used to listen for certain events 
* occuring of the lifetime of a viewer. Currently, the following viewer events can be listened for:
* 
* * **displaymodel** A new model has been displayed on the viewer.
* * **loadcolordata** New color data has been loaded.
* * **loadspectrum** A new spectrum has been loaded.
* * **rangechange** The color range has been modified.
* * **blendcolormaps** Two color maps have been loaded and blended.
* * **clearscreen** The viewer has been cleared of objects.
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
/**
* @doc object
* @name Events.events:displaymodel
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
* @name Events.events:loadcolordata
*
* @description
* Triggered when a new color map is loaded. The new color data
* object will be passed to the event handler:
*
* ```js
*    viewer.addEventListener("loadcolordata", function(color_data) {
*      //...
*    });
* ```
*/
/**
* @doc object
* @name Events.events:loadspectrum
*
* @description
* Triggered when a new spectrum has finished loading. The loaded spectrum
* object will be passed to the event handler:
*
* ```js
*    viewer.addEventListener("loadspectrum", function(spectrum) {
*      //...
*    });
* ```
*/
/**
* @doc object
* @name Events.events:clearscreen
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
* @name Events.events:rangechange
*
* @description
* Triggered when the color range changes. The modified color data
* object will be passed to the event handler:
*
* ```js
*    viewer.addEventListener("rangechange", function(color data) {
*      //...
*    });
* ```
*/
/**
* @doc object
* @name Events.events:blenddata
*
* @description
* Triggered when two color maps have been loaded and blended. The event handler receives
* no arguments.
*
* ```js
*    viewer.addEventListener("blenddata", function() {
*      //...
*    });
* ```
*
*/

(function() {
  "use strict";

  var BrainBrowser = window.BrainBrowser = window.BrainBrowser || {};
  
  var SurfaceViewer = BrainBrowser.SurfaceViewer = {

    /**
    *  @doc function
    *  @name start
    *  @param {string} element_id ID of the DOM element 
    *  in which the viewer will be inserted.
    *  @param {function} callback Callback function to which the viewer objec
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
    *      viewer.loadModelFromUrl("/models/brain_surface.obj");
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
      *  @doc object
      *  @name viewer
      *  @property {DOMElement} view_window The DOM element where the viewer
      *  will be inserted.
      *  @property {THREE.Object3D} model The currently loaded surface model.
      * 
      *  @description
      *  The viewer object encapsulates all functionality of the Surface Viewer.
      */
      var viewer = {
        view_window: document.getElementById(element_id), // Div where the canvas will be loaded.
        model: null                                       // The currently loaded model. Should be set by rendering.
      };

      var module;
      
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
      BrainBrowser.utils.eventModel(viewer);

      for (module in SurfaceViewer.core) {
        if (SurfaceViewer.core.hasOwnProperty(module)) {
          SurfaceViewer.core[module](viewer);
        }
      }

      for (module in SurfaceViewer.core) {
        if (SurfaceViewer.core.hasOwnProperty(module)) {
          SurfaceViewer.core[module](viewer);
        }
      }
      
      for (module in SurfaceViewer.modules) {
        if (SurfaceViewer.modules.hasOwnProperty(module)) {
          SurfaceViewer.modules[module](viewer);
        }
      }
      
      for (module in SurfaceViewer.plugins) {
        if (SurfaceViewer.plugins.hasOwnProperty(module)) {
          SurfaceViewer.plugins[module](viewer);
        }
      }
      
      //////////////////////////////////////////////////////  
      // Pass SurfaceViewer instance to calling application. 
      ////////////////////////////////////////////////////// 
      callback(viewer);
    }
  };

  // Core modules.
  SurfaceViewer.core = {};
  
  // Standard modules.
  SurfaceViewer.modules = {};
  
  // Application specific plugins.
  SurfaceViewer.plugins = {};
  
  // 3D Model filetype handlers.
  SurfaceViewer.filetypes = {};
  
})();


