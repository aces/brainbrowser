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

  BrainBrowser.SurfaceViewer.createModelData = function() {
    var model_data = {};

    return {
      add: function(name, data) {
        model_data[name] = data;
      },

      get: function(name) {
        name = name || Object.keys(model_data)[0];

        return model_data[name] || null;
      },

      clear: function() {
        model_data = {};
      },

      forEach: function(callback) {
        Object.keys(model_data).forEach(function(name, i) {
          callback(model_data[name], name, i)
        });
      }
    }
  };

})();

