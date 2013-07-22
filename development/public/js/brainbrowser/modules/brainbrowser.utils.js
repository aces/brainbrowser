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

// Allow it to be used without loading BrainBrowser core.
var BrainBrowser = BrainBrowser || {};

// Module for updating colours on models currently being displayed.
BrainBrowser.utils = (function() {
 
  /*! 
   * WebGL test taken from Detector.js by
   * alteredq / http://alteredqualia.com/
   * mr.doob / http://mrdoob.com/
  */
  
  function webglEnabled() { 
    try { 
      return !!window.WebGLRenderingContext && !!document.createElement('canvas').getContext('experimental-webgl'); 
    } catch(e) { 
      return false; 
    } 
  }
  
  // Test for webworkers.
  function webWorkersEnabled() {
    return !!window.Worker;
  }
  
  
  // Simple error message for non-webgl browsers.
  function webGLErrorMessage() {
    var el;
    var text = 'BrainBrowser requires <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation">WebGL</a>.<br/>';
    text += window.WebGLRenderingContext ? 'Your browser seems to support it, but it is <br/> disabled or unavailable.<br/>' : 
            "Your browser does not seem to support it.<br/>";
  	text += 'Test your browser\'s WebGL support <a href="http://get.webgl.org/">here</a>.';
  	
  	el = document.createElement("div");
  	el.id = "webgl-error";
  	el.innerHTML = text;
        
    return el;
  }
  
  // Test if an object is a function.
  function isFunction(obj) {
    return obj instanceof Function || typeof obj === "function"; 
  }
  
  return {
    webglEnabled: webglEnabled,
    webWorkersEnabled: webWorkersEnabled,
    webGLErrorMessage: webGLErrorMessage,
    isFunction: isFunction
  };
})();


