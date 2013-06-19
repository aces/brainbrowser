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
* @constructor
* @param {String} data data file in string format to parse 
*/
BrainBrowser.data.Data = function(data, callback) {
  if(!(this instanceof BrainBrowser.data.Data)) {
    return new BrainBrowser.data.Data(data, callback);
  }

  var self = this;
  
  function parse() {
    var worker = new Worker("js/data.worker.js");

    worker.addEventListener("message", function(e) {
      var result = e.data;
      var prop;

      for (prop in result) {
        if (result.hasOwnProperty(prop)){
          self[prop] = result[prop];
        }
      }
      if (callback) callback(self);
      worker.terminate();
    });

    worker.postMessage({ cmd: "parse", data: data });
  };

  self.createColorArray = function(min, max, spectrum, flip, clamped, original_colors, model, callback) {
    var worker = new Worker("js/data.worker.js");
    worker.addEventListener("message", function(e) {
      var color_array = e.data;
      var prop;

      if (callback) callback(color_array);
      worker.terminate();
    });

    worker.postMessage({ cmd: "createColorArray", data: {
      values: self.values,
      min: min,
      max: max,
      spectrum: spectrum.colors,
      flip: flip,
      clamped: clamped,
      original_colors: original_colors,
      model: { num_hemisphere: model.num_hemisphere, indexArray: model.indexArray }
    }});
  };



  if (data) {
    if (typeof data === "string") {
      parse(data);      
    } else if(data.values != undefined){
      this.values = data.values.concat();
      this.min = this.values.min();
      this.max = this.values.max();
    }else {
      console.log("copying data length: " + data.length );
      this.values = data;
      this.min = data.min();
      this.max = data.max();
    }
  }
}