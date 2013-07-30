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
 * Utility object for doing stuff with colors
 *  
 * @constructor
 */
function ColorManager(){

  /**
   * This create a color map for each value in the values array
   * This can be slow and memory intensive for large arrays
   */
  this.createColorMap =  function(spectrum, canvaspixelarray, values, min, max, convert, brightness, contrast, alpha) {
    var spectrum = spectrum.colors;
    var spectrum_length = spectrum.length;
    //calculate a slice of the data per color
    var increment = ((max-min)+(max-min)/spectrum_length)/spectrum_length;
    var i, count;
    var color_index;
    var value;
    var scale;
    var color = [];

    //for each value, assign a color
    for (i = 0, count = values.length; i < count; i++) {
      value = values[i];
      if (value <= min) {
        color_index = 0;
      } else if (values[i] > max){
        color_index = spectrum_length - 1;
      }else {
        color_index = parseInt((value - min) / increment);
      }
      //This inserts the RGBA values (R,G,B,A) independently
      
      //should the numbers be from 0,255 or 0,1.0 convert == true means 0-255
      if(convert) {
        scale = 255;
      } else {
        scale = 1;
      }
      
      color = spectrum[color_index] || [0, 0, 0];

      canvaspixelarray[i*4+0] = scale * color[0] * contrast + brightness * scale;
      canvaspixelarray[i*4+1] = scale * color[1] * contrast + brightness * scale;      
      canvaspixelarray[i*4+2] = scale * color[2] * contrast + brightness * scale;

      if (alpha) {
        canvaspixelarray[i*4+3] = scale * alpha;
      } else {
        canvaspixelarray[i*4+3] = scale;
      }
      
    }
    return canvaspixelarray; 
  };

  /**
   * Blend multiple color_arrays into one using their alpha values
   */
  this.blendColors = function(color_arrays) {
    var final_color = color_arrays[0];
    var i, j, count1, count2;
    var old_alpha, new_alpha;
    
    for (i = 0, count1 = color_arrays[0].length/4; i < count1; i++){
      for (j = 1, count2 = color_arrays.length;  j < count2; j++) {
        old_alpha = final_color[i*4+3];
        new_alpha = color_arrays[j][i*4+3];
        final_color[i*4]   = final_color[i*4] * old_alpha+color_arrays[j][i*4] * new_alpha;
        final_color[i*4+1] = final_color[i*4+1] * old_alpha+color_arrays[j][i*4+1] * new_alpha;
        final_color[i*4+2] = final_color[i*4+2] * old_alpha+color_arrays[j][i*4+2] * new_alpha;
        final_color[i*4+3] = old_alpha + new_alpha;
      }   
    }
    return final_color;
    
  };


  /**
   * Blends two or more arrays of values into one color array
   */
  this.blendColorMap = function(spectrum, value_arrays, brightness, contrast) {
    var count = value_arrays.length;
    var color_arrays = new Array(count);
    var final_alpha = 0;
    var i;
    var value_array;
    
    for(i = 0; i < count; i++){
      value_array = value_arrays[i];
      color_arrays[i] = this.createColorMap(
        spectrum,
        new Array(value_array.values.length),
        value_array.values,
        value_array.rangeMin,
        value_array.rangeMax,
        false,
        0,
        1,
        value_array.alpha
      );
    }
    
    return this.blendColors(color_arrays);
  };

}
