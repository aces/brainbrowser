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
BrainBrowser.SurfaceViewer.data = function(raw, callback) {
  "use strict";
  
  // Allows a prototype to be defined for data object
  var data_obj = {};
  var worker_url = BrainBrowser.config.surface_viewer.data.worker;
  
  function parse() {
    var worker = new Worker(worker_url);
  
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
  
  data_obj.createColorArray = function(min, max, spectrum, flip, clamped, original_colors, model, callback) {
    var worker = new Worker(worker_url);
    worker.addEventListener("message", function(e) {
      var color_array = e.data;
  
      if (callback) callback(color_array);
      worker.terminate();
    });
  
    worker.postMessage({ cmd: "createColorArray", data: {
      values: data_obj.values,
      min: min,
      max: max,
      spectrum: spectrum.colors,
      flip: flip,
      clamped: clamped,
      original_colors: original_colors,
      model: { num_hemisphere: model.num_hemisphere, indexArray: model.indexArray }
    }});
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
