/*
* Copyright (C) 2011 McGill University
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
*   the Free Software Foundation, either version 3 of the License, or
*  (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
*  but WITHOUT ANY WARRANTY; without even the implied warranty of
*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*  GNU General Public License for more details.
*
*  You should have received a copy of the GNU General Public License
*  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/


/**
* @param {String} data data file in string format to parse
*/
/**
 * @doc function
 * @name SurfaceViewer.static methods:parseColorData
 * @param {string} raw The color data as a string of text
 * @param {function} callback Callback to which the new color data object 
 * will be passed when parsing is complete.
 * 
 * @description
 * Parse vertex color data from a string of text.
 */
BrainBrowser.SurfaceViewer.parseColorData = function(raw, callback) {
  "use strict";
  
  if (!BrainBrowser.utils.checkConfig("surface_viewer.worker_dir")) {
    throw new Error(
      "error in SurfaceViewer configuration.\n" +
      "BrainBrowser.config.surface_viewer.worker_dir not defined."
    );
  }

  // Allows a prototype to be defined for data object
  var data_obj = {};
  var worker_dir = BrainBrowser.config.surface_viewer.worker_dir;
  
  function parse() {
    var worker = new Worker(worker_dir + "/data.worker.js");
  
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
  
  data_obj.createColorArray = function createColorArray(min, max, spectrum, flip, clamped, original_colors, model, callback) {
    spectrum = spectrum.colors;
    var values = data_obj.values;
    var colors = [];
    //calculate a slice of the data per color
    var increment = ((max-min)+(max-min)/spectrum.length)/spectrum.length;
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
          color_index = spectrum.length - 1;
        }
      } else {
        color_index = parseInt((value-min)/increment, 10);
      }
      //This inserts the RGBA values (R,G,B,A) independently
      if (flip && color_index !== -1) {
        colors.push.apply(colors, spectrum[spectrum.length-1-color_index]);
      } else {
        if(color_index === -1) {
          if(original_colors.length === 4){
            colors.push.apply(colors, original_colors);
          } else {
            colors.push(original_colors[i*4], original_colors[i*4+1], original_colors[i*4+2], original_colors[i*4+3]);
          }
        } else {
          colors.push.apply(colors, spectrum[color_index]);
        }
      }
    }

    //return colors;
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
