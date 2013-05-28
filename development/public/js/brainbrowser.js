/* 
 * BrainBrowser.js
 * 
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
 * Create new BrainBrowser viewer object
 * @constructor
 *  
 */
function BrainBrowser(callback) {

  
  if(!(this instanceof BrainBrowser)) {
    return new BrainBrowser(callback);
  }
    
  var that = this;
                   
  this.view_window = $("#brainbrowser");
  this.model = undefined; 
  this.scene = undefined;
  this.camera = undefined;
  
  var module;
  
  for (module in BrainBrowser.core) {
    if (BrainBrowser.core.hasOwnProperty(module)) {
      BrainBrowser.core[module](this);
    }
  }
  
  for (module in BrainBrowser.modules) {
    if (BrainBrowser.modules.hasOwnProperty(module)) {
      BrainBrowser.modules[module](this);
    }
  }
  
  for (module in BrainBrowser.plugins) {
    if (BrainBrowser.plugins.hasOwnProperty(module)) {
      BrainBrowser.plugins[module](this);
    }
  }
  
  if (BrainBrowser.webgl_enabled()) {
    this.render();
  } else {
    alert("Can't get WebGL constext. Exiting.")
    return;
  }
  callback(this);
}

BrainBrowser.core = {};
BrainBrowser.modules = {};
BrainBrowser.plugins = {};
BrainBrowser.filetypes = {};

/*! 
 * WebGL test taken from Detector.js by
 * alteredq / http://alteredqualia.com/
 * mr.doob / http://mrdoob.com/
*/

BrainBrowser.webgl_enabled = function () { 
  try { 
    return !!window.WebGLRenderingContext && !!document.createElement('canvas').getContext('experimental-webgl'); 
  } catch(e) { 
    return false; 
  } 
}

BrainBrowser.webGLErrorMessage = function() {
  var el;
  var text = 'BrainBrowser requires <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation">WebGL</a>.<br/>';
  text += window.WebGLRenderingContext ? 'Your browser seems to support it, but it is <br/> disabled or unavailable.<br/>' : 
          "Your browser does not seem to support it.<br/>";
	text += 'Test your browser\'s WebGL support <a href="http://get.webgl.org/">here</a>.';
	
  el = $('<div id="webgl-error">' + text + '</div>');
      
  return el;
}



