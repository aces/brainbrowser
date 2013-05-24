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
  function createColorMap(spectrum,canvaspixelarray,values,min,max,convert,brightness,contrast,alpha) {
    var spectrum = spectrum.colors;
    //calculate a slice of the data per color
    var increment = ((max-min)+(max-min)/spectrum.length)/spectrum.length;
   
    //for each value, assign a color
    for(var i=0; i<values.length; i++) {
      if(values[i]<= min ) {
	var color_index = 0;
      }else if(values[i]> max){
	var color_index = spectrum.length-1;
      }else {
	var color_index = parseInt((values[i]-min)/increment);
      }
      //This inserts the RGBA values (R,G,B,A) independently
      
      //should the numbers be from 0,255 or 0,1.0 convert == true means 0-255
      if(convert) {
	var scale = 255;
      }else
	var scale = 1;
      canvaspixelarray[i*4+0]=scale*spectrum[color_index][0]*contrast+brightness*scale;
      canvaspixelarray[i*4+1]=scale*spectrum[color_index][1]*contrast+brightness*scale;      
      canvaspixelarray[i*4+2]=scale*spectrum[color_index][2]*contrast+brightness*scale;
      if(alpha) {
	canvaspixelarray[i*4+3]=scale*alpha;
      }else {
	canvaspixelarray[i*4+3]=scale;
      }
      
    }
    return canvaspixelarray;
    
    
  };
  this.createColorMap = createColorMap; 

  /**
   * Blend multiple color_arrays into one using their alpha values
   */
  function blendColors(color_arrays) {
    var final_color = color_arrays[0];
    for(var i = 0; i < color_arrays[0].length/4; i++){
      for(var j = 1;  j < color_arrays.length; j++) {
	var old_alpha = final_color[i*4+3];
	var new_alpha = color_arrays[j][i*4+3];
	final_color[i*4] = final_color[i*4]*old_alpha+color_arrays[j][i*4]*new_alpha;
	final_color[i*4+1] = final_color[i*4+1]*old_alpha+color_arrays[j][i*4+1]*new_alpha;
	final_color[i*4+2] = final_color[i*4+2]*old_alpha+color_arrays[j][i*4+2]*new_alpha;
	final_color[i*4+3] = old_alpha + new_alpha;
      }   
    }
    return final_color;
    
  }
  this.blendColors = blendColors;


  /**
   * Blends two or more arrays of values into one color array
   */
  function blendColorMap(spectrum,value_arrays,brightness,contrast)
  {
    var number_arrays = value_arrays.length;
    var color_arrays = new Array(number_arrays);
    
    var final_alpha = 0;
    for(var i = 0; i< number_arrays; i++){
      color_arrays[i] = createColorMap(spectrum,
				       new Array(value_arrays[i].values.length),
				       value_arrays[i].values,
				       value_arrays[i].rangeMin,
				       value_arrays[i].rangeMax,
				       false,
				       0,
				       1,
				       value_arrays[i].alpha);
    }
    return blendColors(color_arrays);
    
  }
  this.blendColorMap = blendColorMap;


}
