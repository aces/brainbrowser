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

/**
* @doc overview
* @name index
*
* @description
* The main BrainBrowser namespace. Contains:
*
*  * **version**: the version of the current instance of BrainBrowser.
*  * **CANVAS_ENABLED** Indicates whether the HTML5 canvas is
*    available in the current browser.
*  * **WEB\_WORKERS_ENABLED** Indicates whether Web Workers are
*    available in the current browser.
*  * **WEBGL_ENABLED** Indicates whether WebGL is available
*    in the current browser.
*  * **WEBGL\_UINT\_INDEX\_ENABLED** Indicates whether the WebGL
*    OES_element_index_uint extension is available in the current browser.
*  * **utils**: general utilities for all applications.
*  * **events**: event handler functions.
*  * **createColorMap**: a factory function for creating color map objects.
*  * **loader**: utility functions for loading data from URLs or from local files.
*  * **SurfaceViewer**: The Surface Viewer application.
*  * **VolumeViewer**: The Volume Viewer application.
*/

/**
* @doc overview
* @name Configuration
*
* @description
* BrainBrowser configuration is done using the **set** and **get**
* methods on the **BrainBrowser.config** object. Configuration
* properties can be namespaced using a "." to separate namespaces.
*
* ```js
* BrainBrowser.set("color_maps.spectral.name", "Spectral");
*
* var name = BrainBrowser.get("color_maps.spectral.name");
* ```
* Namespaces are implemented as objects, so if a namespace is 
* requested with **get**, the namespace object will be
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
*/

/**
* @doc object
* @name BrainBrowser
* @property {string} version The current version of BrainBrowser.
* @property {boolean} CANVAS_ENABLED Indicates whether the HTML5 canvas is
* available in the current browser.
* @property {boolean} WEB_WORKERS_ENABLED Indicates whether Web Workers are
* available in the current browser.
* @property {boolean} WEBGL_ENABLED Indicates whether WebGL is available
* in the current browser.
* @property {boolean} WEBGL_UINT_INDEX_ENABLED Indicates whether the WebGL 
* OES\_element\_index\_uint extension is available in the current browser.
* @property {object} utils General utilities for all applications.
* @property {object} events Event handler functions.
* @property {function} createColorMap A factory function for creating color map objects.
* @property {object} loader utility Functions for loading data from URLs or from local files.
* @property {object} SurfaceViewer The Surface Viewer application.
* @property {object} VolumeViewer The Volume Viewer application.
*
* @description
* The main BrainBrowser namespace.
*/
(function() {
  "use strict";
 
  
  var version = "<%= BRAINBROWSER_VERSION %>";
  version = version.indexOf("BRAINBROWSER_VERSION") > 0 ? "D.E.V" : version;

  var BrainBrowser = window.BrainBrowser = {
    version: version
  };

  checkBrowser(BrainBrowser);

  // Shims for requestAnimationFrame (mainly for old Safari)
  window.requestAnimationFrame = window.requestAnimationFrame ||
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

  // Check capabilities of the browser.
  function checkBrowser(BrainBrowser) {
    var CANVAS_ENABLED = false;
    var WEB_WORKERS_ENABLED = false;
    var WEBGL_ENABLED = false;
    var WEBGL_UINT_INDEX_ENABLED = false;
    var canvas = document.createElement("canvas");
    var gl = null;

    CANVAS_ENABLED = !!canvas;
    WEB_WORKERS_ENABLED = !!window.Worker;

    try {
      if(canvas && window.WebGLRenderingContext) {
        gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      }
      WEBGL_ENABLED = !!gl;
    } catch(e) {
      WEBGL_ENABLED = false;
    }

    if (WEBGL_ENABLED) {
      WEBGL_UINT_INDEX_ENABLED = !!gl.getExtension("OES_element_index_uint");
    }

    BrainBrowser.CANVAS_ENABLED = CANVAS_ENABLED;
    BrainBrowser.WEB_WORKERS_ENABLED = WEB_WORKERS_ENABLED;
    BrainBrowser.WEBGL_ENABLED = WEBGL_ENABLED;
    BrainBrowser.WEBGL_UINT_INDEX_ENABLED = WEBGL_UINT_INDEX_ENABLED;
  }

})();


