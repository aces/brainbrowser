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

  var config = {};

  BrainBrowser.config = {

    /**
    * @doc function
    * @name BrainBrowser.config:set
    * @param {string} config_string Namespaced configuration property.
    * @param {any} value The value of the configuration property.
    *
    * @description
    * Set a configuration parameter.
    *
    * ```js
    * BrainBrowser.config.set("color_map_path", "color-maps/spectral.txt");
    * ```
    *
    * Configuration parameters can be namespaced, so for example:
    *
    * ```js
    * BrainBrowser.set("color_maps.spectral.name", "Spectral")
    * ```
    *
    * Will set the **name** property in the **spectral** namespace of the
    * **color_maps** namespace.
    *
    */
    set: function(config_string, value) {
      config_string = config_string || "";
      var config_item = config;
      var config_params = config_string.split(".");
      var current_param;
      var i, count;
      var error_message;

      for (i = 0, count = config_params.length - 1; i < count; i++) {
        current_param = config_params[i];
        if (config_item[current_param] && typeof config_item[current_param] !== "object") {
          error_message = "Configuration parameter '" + config_params.slice(0, i + 1).join(".") +
            "' has already been set to a non-object value.\n" +
            "Cannot set '" + config_string + "'";

          BrainBrowser.events.triggerEvent("error", error_message);
          throw new Error(error_message);
        }
        if (!config_item[current_param]) {
          config_item[current_param] = {};
        }
        config_item = config_item[current_param];
      }

      current_param = config_params[i];

      config_item[current_param] = value;
    },

    /**
    * @doc function
    * @name BrainBrowser.config:get
    * @param {string} config_string Namespaced configuration property.
    *
    * @description
    * Retrieve a configuration parameter.
    *
    * ```js
    * var color_map_path = BrainBrowser.config.get("color_map_path");
    * ```
    *
    * If the requested parameter does not exist, **null** will be returned.
    *
    * Namespaces are implemented as objects, so if a namespace is requested
    * with **get** the namespace object will be returned. For example, if a property
    * were set as follows:
    *
    * ```js
    * BrainBrowser.set("color_maps.spectral.name", "Spectral")
    * ```
    *
    * the the following **get** call:
    *
    * ```js
    * BrainBrowser.set("color_map.spectral")
    * ```
    *
    * would return the object:
    *
    * ```js
    *  { name: "Spectral" }
    * ```
    *
    */
    get: function(config_string) {
      config_string = config_string || "";
      var config_item = config;
      var config_params = config_string.split(".");
      var current_param;
      var i, count;


      for (i = 0, count = config_params.length - 1; i < count; i++) {
        current_param = config_params[i];
        if (config_item[current_param] === undefined) {
          return null;
        }
        config_item = config_item[current_param];
      }

      current_param = config_params[i];

      return config_item[current_param] !== undefined ? config_item[current_param] : null;
    }
  };

})();
