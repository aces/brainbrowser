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

  var event_listeners = [];

  BrainBrowser.events = {

    /**
    * @doc function
    * @name BrainBrowser.events:addEventListener
    * @param {string} event The event name.
    * @param {function} callback The event handler. 
    *
    * @description
    * Add an event handler to handle event **event**.
    * ```js
    * BrainBrowser.events.addEventListener("error", function(message) {
    *   // Handle error.
    * });
    * ```
    *
    * The arguments passed to the handler are those passed to **triggerEvent()**. 
    * Consult documentation for the **Surface Viewer** or **Volume Viewer** for 
    * details about normal lifecycle events for each app.
    */
    addEventListener: function(event, callback) {
      if (!event_listeners[event]) {
        event_listeners[event] = [];
      }
      
      event_listeners[event].push(callback);
    },

    /**
    * @doc function
    * @name BrainBrowser.events:triggerEvent
    * @param {string} event The event name. 
    *
    * @description
    * Trigger all handlers associated with event **event**.
    * Any arguments after the first will be passed to the 
    * event handler.
    * ```js
    * BrainBrowser.events.triggerEvent("error", "There was an error!");
    * ```
    */
    triggerEvent: function(event) {
      var args = Array.prototype.slice.call(arguments, 1);
      if (event_listeners[event]) {
        event_listeners[event].forEach(function(callback) {
          setTimeout(function() {
            callback.apply(null, args);
          }, 0);
        });
      }
    }
  };

})();
