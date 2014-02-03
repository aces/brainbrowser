/*
* BrainBrowser: Web-based Neurological Visualization Tools
* (https://brainbrowser.cbrain.mcgill.ca)
*
* Copyright (C) 2011 McGill University 
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
* @author: Nicolas Kassis
* @author: Tarek Sherif
*/

/**
 * @doc function
 * @name SurfaceViewer.static methods:parseIntensityData
 * @param {string} raw The intensity data as a string of text
 * @param {function} callback Callback to which the new intensity data object 
 * will be passed when parsing is complete.
 * 
 * @description
 * Parse vertex intensity data from a string of text.
 */
BrainBrowser.SurfaceViewer.parseIntensityData = function(raw, type, callback) {
  "use strict";

  var worker_url_type = type + "_intensity";
  
  if (!BrainBrowser.utils.checkConfig("surface_viewer.worker_dir")) {
    throw new Error(
      "error in SurfaceViewer configuration.\n" +
      "BrainBrowser.config.surface_viewer.worker_dir not defined."
    );
  }

  if (!BrainBrowser.SurfaceViewer.worker_urls[worker_url_type]) {
    throw new Error(
      "error in SurfaceViewer configuration.\n" +
      "Intensity data worker URL for " + type + " not defined."
    );
  }

  // Allows a prototype to be defined for data object
  var data_obj = {};
  
  function parse() {


    var worker = new Worker(BrainBrowser.SurfaceViewer.worker_urls[worker_url_type]);
  
    worker.addEventListener("message", function(e) {
      var result = e.data;
      var prop;

      for (prop in result) {
        if (result.hasOwnProperty(prop)){
          data_obj[prop] = result[prop];
        }
      }
      if (callback) callback(data_obj);
      worker.terminate();
    });
  
    worker.postMessage({ cmd: "parse", data: raw });
  }
  
  data_obj.createColorArray = function createColorArray(min, max, color_map, flip, clamped, original_colors, model, callback) {
    color_map = color_map.colors;
    var values = data_obj.values;
    var colors = [];
    var color_map_length = color_map.length;
    var range = max - min;
    //calculate a slice of the data per color
    var increment = ( range + range / color_map_length ) / color_map_length;
    var i, count;
    var color_index;
    var value;

    //for each value, assign a color
    for (i = 0, count = values.length; i < count; i++) {
      value = values[i];
      if (value <= min ) {
        if (value < min && !clamped) {
          color_index = -1;
        } else {
          color_index = 0;
        }
      }else if (value > max){
        if (!clamped){
          color_index = -1;
        }else {
          color_index = color_map_length - 1;
        }
      } else {
        color_index = Math.floor((value-min)/increment);
      }
      //This inserts the RGBA values (R,G,B,A) independently
      if (flip && color_index !== -1) {
        colors.push.apply(colors, color_map[color_map_length - 1 - color_index]);
      } else {
        if(color_index === -1) {
          if(original_colors.length === 4){
            colors.push.apply(colors, original_colors);
          } else {
            colors.push(original_colors[i*4], original_colors[i*4+1], original_colors[i*4+2], original_colors[i*4+3]);
          }
        } else {
          colors.push.apply(colors, color_map[color_index]);
        }
      }
    }

    if (callback) callback(colors);
  };
  
  
  if (raw) {
    if (typeof raw === "string") {
      parse(raw);
    } else if(raw.values){
      data_obj.values = raw.values.concat();
      data_obj.min = BrainBrowser.utils.min(data_obj.values);
      data_obj.max = BrainBrowser.utils.max(data_obj.values);
    } else {
      data_obj.values = raw;
      data_obj.min = BrainBrowser.utils.min(raw);
      data_obj.max = BrainBrowser.utils.max(raw);
    }
  }
  
};
