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

(function() {
  "use strict";

  BrainBrowser.utils = {

    /**
    * @doc function
    * @name BrainBrowser.utils:webglExtensionAvailable
    * @param {string} name Check if a given WebGL extension is available.
    * @returns {boolean} Whether or the queried WebGL extension is supported in the current browser.
    *
    * @description
    * Test for WebGL support.
    * ```js
    * BrainBrowser.utils.webglEnabled();
    * ```
    */
    webglExtensionAvailable: function(name) {
      if (!BrainBrowser.WEBGL_ENABLED) {
        return false;
      }

      var canvas = document.createElement("canvas");
      var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

      return !!gl.getExtension(name);
    },
    
    /**
    * @doc function
    * @name BrainBrowser.utils:webGLErrorMessage
    * @returns {DOMElement} A div containing the error message.
    *
    * @description
    * Produce a simple error message for non-webgl browsers.
    * ```js
    * BrainBrowser.utils.webGLErrorMessage();
    * ```
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
    * @param {object} object The object to test.
    * @returns {boolean} Whether or not the object is a function.
    *
    * @description
    * Test if the passed object is a function.
    * ```js
    * BrainBrowser.utils.isFunction(fn);
    * ```
    */
    isFunction: function(object) {
      return object instanceof Function || typeof object === "function";
    },

    /**
    * @doc function
    * @name BrainBrowser.utils:isNumeric
    * @param {anything} n The data to test.
    * @returns {boolean} Whether or not the object is a number.
    *
    * @description
    * Test if the passed data is a number.
    * ```js
    * BrainBrowser.utils.isNumeric(n);
    * ```
    */
    isNumeric: function(n) {
      return !isNaN(parseFloat(n));
    },

    /** 
    * @doc function
    * @name viewer.color:createDataURL
    * @param {any} data The data to create a URL for.
    * @param {string} mime_type MIME type to give the data (default: text/plain).
    *
    * @description
    * Create a data URL for arbitrary data.
    */
    createDataURL: function(data, mime_type) {
      if (!window.URL || !window.URL.createObjectURL) {
        throw new Error("createDataURL requires URL.createObjectURL which does not seem to be available is this browser.");
      }

      return window.URL.createObjectURL(new Blob([data], {type : mime_type || "text/plain"}));
    },

    /**
    * @doc function
    * @name BrainBrowser.utils:getWorkerImportURL
    *
    * @description
    * Assemble an absolute path for possible script imports within
    * a worker.
    */
    getWorkerImportURL: function() {
      var worker_dir = BrainBrowser.config.get("worker_dir");
      var import_url = document.location.origin + '/' + worker_dir;
      var doc_href = document.location.href;
      var slash_index = doc_href.lastIndexOf('/');
      if (slash_index >= 0) {
        import_url = doc_href.substring(0, slash_index + 1) + worker_dir;
      }
      return import_url;
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
    * ```js
    * BrainBrowser.utils.min(1, 2, 17 143 12 42);
    * ```
    */
    min: function() {
      var array = Array.prototype.slice.call(arguments);
      array = array.length === 1 && BrainBrowser.utils.isNumeric(array[0].length) ? array[0] : array;

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
    * ```js
    * BrainBrowser.utils.max(1, 2, 17 143 12 42);
    * ```
    */
    max: function() {
      var array = Array.prototype.slice.call(arguments);
      array = array.length === 1 && BrainBrowser.utils.isNumeric(array[0].length) ? array[0] : array;
      
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
    * @param {DOMElement} element An element in the DOM.
    * @returns {object} An object containing the given element's offet info:
    *
    * * **top**: offset from the top of the window.
    * * **left**: offset from the left side of the window. 
    *
    * @description
    * Return offset information about the given element.
    * ```js
    * BrainBrowser.utils.getOffset(dom_element);
    * ```
    */
    getOffset: function(element) {
      var top = 0;
      var left = 0;
      
      while (element.offsetParent) {
        top += element.offsetTop;
        left += element.offsetLeft;
        
        element = element.offsetParent;
      }
      
      return {top: top, left: left};
    },

    /**
    * @doc function
    * @name BrainBrowser.utils:captureMouse
    * @param {DOMElement} element An element in the DOM.
    * @returns {object} An object that tracks the mouse
    * coordinates over the element.
    *
    * @description
    * Return a mouse tracker for the DOM element given as argument.
    * ```js
    * BrainBrowser.utils.captureMouse(dom_element);
    * ```
    */
    captureMouse: function(element) {
      var mouse = { x: 0, y: 0, left: false, middle: false, right: false};

      document.addEventListener("mousemove", function(event) {
        var offset = BrainBrowser.utils.getOffset(element);
        var x, y;

        if (event.pageX !== undefined) {
          x = event.pageX;
          y = event.pageY;
        } else {
          x = event.clientX + window.pageXOffset;
          y = event.clientY + window.pageYOffset;
        }

        mouse.x = x - offset.left;
        mouse.y = y - offset.top;
      }, false);

      element.addEventListener("mousedown", function(event) {
        event.preventDefault();

        if (event.button === 0) {
          mouse.left = true;
        }
        if (event.button === 1) {
          mouse.middle = true;
        }
        if (event.button === 2) {
          mouse.right = true;
        }
      }, false);

      element.addEventListener("mouseup", function(event) {
        event.preventDefault();

        if (event.button === 0) {
          mouse.left = false;
        }
        if (event.button === 1) {
          mouse.middle = false;
        }
        if (event.button === 2) {
          mouse.right = false;
        }

      }, false);

      element.addEventListener("mouseleave", function(event) {
        event.preventDefault();

        mouse.left = mouse.middle = mouse.right = false;
      }, false);

      element.addEventListener("contextmenu", function(event) {
        event.preventDefault();
      }, false);

      return mouse;
    },

    /**
    * @doc function
    * @name BrainBrowser.utils:captureTouch
    * @param {DOMElement} element An element in the DOM.
    * @returns {array} An array of objects that track the touches
    * currently active on the element.
    *
    * @description
    * Return a touch tracker for the DOM element given as argument.
    * ```js
    * BrainBrowser.utils.captureTouch(dom_element);
    * ```
    */
    captureTouch: function(element) {
      var touches = [];

      function updateTouches(event) {
        var offset = BrainBrowser.utils.getOffset(element);
        var x, y;
        var i, count;
        var touch;

        touches.length = count = event.touches.length;

        for (i = 0; i < count; i++) {
          touch = event.touches[i];

          if (touch.pageX !== undefined) {
            x = touch.pageX;
            y = touch.pageY;
          } else {
            x = touch.clientX + window.pageXOffset;
            y = touch.clientY + window.pageYOffset;
          }

          touches[i] = touches[i] || {};
          
          touches[i].x = x - offset.left;
          touches[i].y = y - offset.top;
        }
      }
      
      element.addEventListener("touchstart", updateTouches, false);
      element.addEventListener("touchmove", updateTouches, false);
      element.addEventListener("touchend", updateTouches, false);
      
      return touches;
    }
  
  };

})();


