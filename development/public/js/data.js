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
BrainBrowser.data.Data = function(data) {
  var that = this;
  that.parse = function(string) {
    var i, count, min, max;
  
    string = string.replace(/^\s+/, '').replace(/\s+$/, '');
    that.values = string.split(/\s+/);
    min = that.values[0];
    max = that.values[0];
    for(i = 0, count = that.values.length; i < count; i++) {
      that.values[i] = parseFloat(that.values[i]);
      min = Math.min(min, that.values[i]);
      max = Math.max(max, that.values[i]);
    }
    that.min = min;
    that.max = max;
  };

  this.createColorArray = function(min, max, spectrum, flip, clamped, original_colors, model) {
    var spectrum = spectrum.colors;
    var colorArray = new Array();
    //calculate a slice of the data per color
    var increment = ((max-min)+(max-min)/spectrum.length)/spectrum.length;
    var i, j, count;
    var color_index;
    var value;
    var newColorArray;

    //for each value, assign a color
    for (i = 0, count = that.values.length; i < count; i++) {
      value = that.values[i];
      if(value <= min ) {
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
      }else {
        color_index = parseInt((value-min)/increment);
      }
      //This inserts the RGBA values (R,G,B,A) independently
      if (flip && color_index != -1) {
        colorArray.push.apply(colorArray, spectrum[spectrum.length-1-color_index]);
      } else {
        if(color_index === -1) {
          if(original_colors.length === 4){
            colorArray.push.apply(colorArray, original_colors);   
          }else {
            colorArray.push(original_colors[i*4], original_colors[i*4+1], original_colors[i*4+2], original_colors[i*4+3]);    
          }
        }else {
          colorArray.push.apply(colorArray, spectrum[color_index]);
        } 
      }
    }

    if(model.num_hemisphere != 2) {
      count = model.indexArray.length
      newColorArray = new Array(count * 4);
      for (j = 0; j < count; j++ ) {
        newColorArray[j*4]     = colorArray[model.indexArray[j]*4];
        newColorArray[j*4 + 1] = colorArray[model.indexArray[j]*4 + 1];
        newColorArray[j*4 + 2] = colorArray[model.indexArray[j]*4 + 2];
        newColorArray[j*4 + 3] = colorArray[model.indexArray[j]*4 + 3];
      }
      colorArray.nonIndexedColorArray = newColorArray;
    }

    return colorArray;


  };



  if (data) {
    if (typeof data === "string") {
      this.parse(data);      
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