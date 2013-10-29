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

(function() {
  "use strict";

  var BrainBrowser = window.BrainBrowser = window.BrainBrowser || {};
  
  var SurfaceViewer = BrainBrowser.SurfaceViewer = {
    start: function(element_id, callback) {

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
      // Allows a prototype to be defined for the browser.
      var viewer = {};

      var module;
      
      // Properties that will be used by other modules.
      viewer.view_window = document.getElementById(element_id); // Div where the canvas will be loaded.
      viewer.model = null;  // The currently loaded model. Should be set by rendering.
      
      //////////////////////////////
      // Load modules.
      //////////////////////////////

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
      
      
      ///////////////////////////////////////////////////////////
      // Start rendering the scene.
      // This method should be defined in SurfaceViewer.rendering.
      ///////////////////////////////////////////////////////////
      viewer.render();
      
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


