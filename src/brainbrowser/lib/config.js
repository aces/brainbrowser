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

  var config = BrainBrowser.createTreeStore();

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
      var config_params = config_string.split(".");

      config_params.push(value);
     
      config.set.apply(config, config_params);
    },

    /**
    * @doc function
    * @name BrainBrowser.config:get
    * @param {string} config_string Namespaced configuration property.
    *
    * @returns {any} The value of the configuration parameter (or **null** if it doesn't exist).
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
      var config_params = config_string.split(".");

      return config.get.apply(config, config_params);
    }
  };

})();
