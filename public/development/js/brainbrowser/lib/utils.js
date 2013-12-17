/*
 * Copyright (C) 2011 McGill University
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/*
* @author Tarek Sherif
*/

/**
* @doc overview
* @name index
* @property {string} version The current version of BrainBrowser.
*
* @description
* Utilities for all BrainBrowser tools.
*/

/**
* @doc overview
* @name Configuration
*
* @description
* BrainBrowser configuration is done by creating an object, **BrainBrowser.config**,
* with two object properties, **surface\_viewer** and **volume\_viewer** that define
* the configuration options for each of the tools. For more information on particular 
* options for each tool, see the Surface Viewer and Volume Viewer configuration sections.
* 
* ```js
* BrainBrowser.config = {
*
*   surface_viewer: {
*     // ...
*   }, 
*
*   volume_viewer: {
*     // ...
*   }
*   
* }
* ```
*/
(function() {
  "use strict";
 
  /**
  * @doc object
  * @name BrainBrowser
  * @property {string} version The current version of BrainBrowser.
  *
  * @description
  * The main BrainBrowser namespace.
  */
  var BrainBrowser = window.BrainBrowser = window.BrainBrowser || {};

  var version = "<%= BRAINBROWSER_VERSION %>";
  BrainBrowser.version = version.indexOf("BRAINBROWSER_VERSION") > 0 ? "D.E.V" : version;

  BrainBrowser.utils = {
    
    /**
    * @doc function
    * @name BrainBrowser.utils:canvasEnabled
    * @returns {boolean} Whether or not the canvas element is supported in the current browser.
    *
    * @description
    * Test for canvas element support.
    */
    canvasEnabled: function() {
      return document.createElement("canvas");
    },

    /**
    * @doc function
    * @name BrainBrowser.utils:webglEnabled
    * @returns {boolean} Whether or not WebGL is supported in the current browser.
    *
    * @description
    * Test for WebGL support.
    */
    /*!
     * WebGL test taken from Detector.js by
     * alteredq / http://alteredqualia.com/
     * mr.doob / http://mrdoob.com/
    */
    webglEnabled: function() {
      try {
        return !!window.WebGLRenderingContext && !!document.createElement('canvas').getContext('experimental-webgl');
      } catch(e) {
        return false;
      }
    },
    
    /**
    * @doc function
    * @name BrainBrowser.utils:webWorkersEnabled
    * @returns {boolean} Whether or not Web Workers are supported in the current browser.
    *
    * @description
    * Test for Web Worker support.
    */
    webWorkersEnabled: function() {
      return !!window.Worker;
    },
    
    /**
    * @doc function
    * @name BrainBrowser.utils:webGLErrorMessage
    * @returns {DOMElement} A div containing the error message.
    *
    * @description
    * Produc a simple error message for non-webgl browsers.
    */
    webGLErrorMessage: function() {
      var elem;
      var text = 'BrainBrowser requires <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation">WebGL</a>.<br/>';
      text += window.WebGLRenderingContext ? 'Your browser seems to support it, but it is <br/> disabled or unavailable.<br/>' :
              "Your browser does not seem to support it.<br/>";
      text += 'Test your browser\'s WebGL support <a href="http://get.webgl.org/">here</a>.';
      
      elem = document.createElement("div");
      elem.id = "webgl-error";
      elem.innerHTML = text;
          
      return elem;
    },
    
    /**
    * @doc function
    * @name BrainBrowser.utils:isFunction
    * @param {object} obj The object to test.
    * @returns {boolean} Whether or not the object is a function.
    *
    * @description
    * Test if the passed object is a function.
    */
    isFunction: function(obj) {
      return obj instanceof Function || typeof obj === "function";
    },

    /**
    * @doc function
    * @name BrainBrowser.utils:eventModel
    * @param {object} viewer Viewer to add the event model method to.
    *
    * @description
    * Add event model methods, **addEventListener()** and
    * **triggerEvent()** to the viewer passed as argument.
    */
    eventModel: function(viewer) {

      var event_listeners = [];

      viewer.addEventListener = function(e, fn) {
        if (!event_listeners[e]) {
          event_listeners[e] = [];
        }
        
        event_listeners[e].push(fn);
      };
      
      viewer.triggerEvent = function(e) {
        var args = Array.prototype.slice.call(arguments, 1);
        if (event_listeners[e]) {
          event_listeners[e].forEach(function(fn) {
            setTimeout(function() {
              fn.apply(viewer, args);
            }, 0);
          });
        }
      };
    },

    /**
    * @doc function
    * @name BrainBrowser.utils:min
    * @param {array|multiple} arguments List of items to processed. Can be given 
    * as an array or directly as arguments.
    * @returns {any} The smallest element of the given list.
    *
    * @description
    * Find the smallest item in a list. List can be passed as an array or 
    * directly as arguments.
    */
    min: function() {
      var array = Array.prototype.slice.call(arguments);
      array = array.length === 1 && Array.isArray(array[0]) ? array[0] : array;

      var min = array[0];
      var i, count;
      for (i = 1, count = array.length; i < count; i++) {
        if (array[i] < min) min = array[i];
      }
      return min;
    },

    /**
    * @doc function
    * @name BrainBrowser.utils:max
    * @param {array|multiple} arguments List of items to processed. Can be given 
    * as an array or directly as arguments.
    * @returns {any} The largenst element of the given list.
    *
    * @description
    * Find the largest item in a list. List can be passed as an array or 
    * directly as arguments.
    */
    max: function() {
      var array = Array.prototype.slice.call(arguments);
      array = array.length === 1 && Array.isArray(array[0]) ? array[0] : array;
      
      var max = array[0];
      var i, count;
      for (i = 1, count = array.length; i < count; i++) {
        if (array[i] > max) max = array[i];
      }
      return max;
    },

    /**
    * @doc function
    * @name BrainBrowser.utils:getOffset
    * @param {DOMElement} elem An element in the DOM.
    * @returns {object} An object containing the given element's offet info:
    *
    * * **top**: offset from the top of the window.
    * * **left**: offset from the left side of the window. 
    *
    * @description
    * Return offset information about the given element.
    */
    getOffset: function(elem) {
      var top = 0;
      var left = 0;
      
      while (elem.offsetParent) {
        top += elem.offsetTop;
        left += elem.offsetLeft;
        
        elem = elem.offsetParent;
      }
      
      return {top: top, left: left};
    },
    
    /**
    * @doc function
    * @name BrainBrowser.utils:checkConfig
    * @param {string} config_string Dot-seperated list of nested configuration options to check for.
    * @returns {boolean} Whether or not the configuration option is defined.
    *
    * @description
    * Check for the existance of a configuration parameter. Argument is a dot-separated list
    * of nested configuation parameter keys. Returns whether given parameter is set in the 
    * current configuration. For example:
    * ```js
    *   BrainBrowser.utils.checkConfig("surface_viewer.worker_dir");
    *   // returns true if BrainBrowser.config.surface_viewer.worker_dir has been set.
    * ```
    */
    checkConfig: function(config_string) {
      if (!BrainBrowser.config) {
        return false;
      }
      config_string = config_string || "";
      var config = BrainBrowser.config;
      var config_params = config_string.split(".");
      var current_param;
      var i, count;


      for (i = 0, count = config_params.length; i < count; i++) {
        current_param = config_params[i];
        if (!config[current_param]) {
          return false;
        }
        config = config[current_param];
      }

      return true;
    },

    /**
    * @doc function
    * @name BrainBrowser.utils:drawDot
    * @param {scene} The THREE.Scene to draw in.
    * @param {number} The x coordinate.
    * @param {number} The y coordinate.
    * @param {number} The z coordinate.
    *
    * @description Draw a red dot in a THREE.Scene. Handy for debugging.
    * 
    */
    drawDot: function(scene, x, y, z) {
      var geometry = new THREE.SphereGeometry(2);
      var material = new THREE.MeshBasicMaterial({color: 0xFF0000});
    
      var sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(x, y, z);
    
      scene.add(sphere);
    }
  
  };

  // Shims for requestAnimationFrame (mainly for old Safari)
  window.requestAnimationFrame =  window.requestAnimationFrame ||
                                  window.webkitRequestAnimationFrame ||
                                  window.mozRequestAnimationFrame ||
                                  window.oRequestAnimationFrame ||
                                  window.msRequestAnimationFrame ||
                                  function(callback){
                                    return window.setTimeout(callback, 1000 / 60);
                                  };

  window.cancelAnimationFrame = window.cancelAnimationFrame ||
                                function(id){
                                  window.clearTimeout(id);
                                };
})();


