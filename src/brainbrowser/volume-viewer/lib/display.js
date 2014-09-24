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
* @doc object
* @name display
* @description
* Object representing the set of display panels.
*/
(function() {
  "use strict";

  BrainBrowser.VolumeViewer.createDisplay = function() {

    var panels = {};

    var display = {
      /**
      * @doc function
      * @name display.display:setPanel
      * @param {string} axis_name The axis the panel is to be used for.
      * @param {object} panel The panel used to display the given axis.
      * @description
      * Set the panel for a given axis.
      * ```js
      * display.setPanel("xspace", panel);
      * ```
      */
      setPanel: function(axis_name, panel) {
        if (panels[axis_name]) {
          panels[axis_name].triggerEvent("eventmodelcleanup");
        }

        panel.propagateEventTo("*", display);
        panels[axis_name] = panel;
      },

      /**
      * @doc function
      * @name display.display:getPanel
      * @param {string} axis_name The axis for which to retrieve the panel.
      * @description
      * Retrieve the panel for the given axis.
      * ```js
      * display.getPanel("xspace");
      * ```
      */
      getPanel: function(axis_name) {
        return panels[axis_name];
      },

      /**
      * @doc function
      * @name display.display:refreshPanels
      * @description
      * Refresh slices on all panels.
      * ```js
      * display.refreshPanels();
      * ```
      */
      refreshPanels: function() {
        display.forEach(function(panel) {
          panel.updateSlice();
        });
      },

      /**
      * @doc function
      * @name display.display:setContrast
      * @param {number} contrast The contrast value.
      * @description
      * Set contrast for all panels in the display.
      * ```js
      * display.setContrast(1.5);
      * ```
      */
      setContrast: function(contrast) {
        display.forEach(function(panel) {
          panel.contrast = contrast;
        });
      },

      /**
      * @doc function
      * @name display.display:setBrightness
      * @param {number} brightness The brightness value.
      * @description
      * Set brightness for all panels in the display.
      * ```js
      * display.setBrightness(0.5);
      * ```
      */
      setBrightness: function(brightness) {
        display.forEach(function(panel) {
          panel.brightness = brightness;
        });
      },

      /**
      * @doc function
      * @name display.display:forEach
      * @param {function} callback Function called for each panel.
      * The panel itself, the axis name and index are passed as 
      * arguments.
      * @description
      * Iterate over the current panels.
      * ```js
      * display.forEach(function(panel, axis_name) {
      *   // Do something...
      * });
      * ```
      */
      forEach: function(callback) {
        Object.keys(panels).forEach(function(axis_name, i) {
          callback(panels[axis_name], axis_name, i);
        });
      }
    };

    BrainBrowser.events.addEventModel(display);

    display.addEventListener("eventmodelcleanup", function() {
      display.forEach(function(panel) {
        panel.triggerEvent("eventmodelcleanup");
      });
    });

    return display;
  };

})();

