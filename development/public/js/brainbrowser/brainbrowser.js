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


// Core BrainBrowser object.
//
// BrainBrowser functionality is split across various modules. The modules
// are split into four basic categories, which essentially just define the
// order in which they will be loaded. BrainBrowser.core modules are loaded first and include functionality 
// like general rendering setup, model loading and colour manipulation 
// that will likely be required by all subsequent modules. BrainBrowser.modules modules are then loaded. 
// In general, they make up a central part of the application, but they require one or more core modules
// to be loaded first in order function. Some examples include modules for requesting new data 
// from the server, displaying a given model. Finally, the BrainBrowser.plugins modules 
// are loaded. These modules are generally specific to the given instance of BrainBrowser and 
// may include such functionality as UI behaviour.  
//
// BrainBrowser also maintains the model parsing objects in the BrainBrowser.filetypes module,
// as well as helpers for colour management in BrainBrowser.data.
function BrainBrowser(callback) {

  /////////////////////////////////
  // Browser compatibility checks.
  /////////////////////////////////
  
  if (! BrainBrowser.utils.webWorkersEnabled() ) {
    alert("Can't find web workers. Exiting.")
    return;
  }
  
  if (!BrainBrowser.utils.webglEnabled()) {
    alert("Can't get WebGL context. Exiting.")
    return;
  }

  // Make sure it's always used as a contructor.
  if(!(this instanceof BrainBrowser)) {
    return new BrainBrowser(callback);
  }
  
  
  // Properties that will be used by other modules.
  this.view_window = document.getElementById("brainbrowser"); // Div where the canvas will be loaded.
  this.model = undefined;  // The currently loaded model. Should be set by rendering.
  
  //////////////////////////////
  // Load modules.
  //////////////////////////////
  
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
  
  
  ///////////////////////////////////////////////////////////
  // Start rendering the scene.
  // This method should be defined in BrainBrowser.rendering.
  ///////////////////////////////////////////////////////////
  this.render();
  
  //////////////////////////////////////////////////////  
  // Pass BrainBrowser instance to calling application. 
  ////////////////////////////////////////////////////// 
  callback(this);
}
// Core modules.
BrainBrowser.core = {};

// Standard modules.
BrainBrowser.modules = {};

// Application specific plugins.
BrainBrowser.plugins = {};

// Color map data handlers.
BrainBrowser.data = {};

// 3D Model filetype handlers.
BrainBrowser.filetypes = {};


