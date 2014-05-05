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

/**
* @doc object
* @name BrainBrowser
* @property {string} version The current version of BrainBrowser.
*
* @description
* The main BrainBrowser namespace.
*/
(function() {
  "use strict";
 
  
  var version = "<%= BRAINBROWSER_VERSION %>";
  version = version.indexOf("BRAINBROWSER_VERSION") > 0 ? "D.E.V" : version;

  window.BrainBrowser = {
    version: version
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


