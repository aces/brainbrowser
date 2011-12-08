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
function Data(data) {
  var that = this;
  that.parse = function(string) {
    string = string.replace(/\s+$/, '');
    string = string.replace(/^\s+/, '');
    that.values = string.split(/\s+/);
    for(var i = 0; i < that.values.length; i++) {
      that.values[i] = parseFloat(that.values[i]);
    }
    that.min = that.values.min();
    that.max = that.values.max();

  };

  this.createColorArray = function(min,max,spectrum,flip,clamped,original_colors,model) {
    var spectrum = spectrum.colors;
    var colorArray = new Array();
    //calculate a slice of the data per color
    var increment = ((max-min)+(max-min)/spectrum.length)/spectrum.length;
    //for each value, assign a color
    for(var i=0; i<that.values.length; i++) {
      if(that.values[i] <= min ) {
	if(that.values[i] < min && !clamped) {
	  var color_index = -1;
	}else {
	  var color_index = 0; 
	}
      }else if(that.values[i]> max){
	if(!clamped){
	  var color_index = -1;
	}else {
	  var color_index = spectrum.length-1;
	}
      }else {
	var color_index = parseInt((that.values[i]-min)/increment);
      }
      //This inserts the RGBA values (R,G,B,A) independently
      if(flip && color_index != -1) {
        colorArray.push.apply(colorArray,spectrum[spectrum.length-1-color_index]);
      }else {
	if(color_index == -1) {
	  if(original_colors.length == 4){
	    	  colorArray.push.apply(colorArray,original_colors);	  
	  }else {
	    colorArray.push.apply(colorArray,[original_colors[i*4],original_colors[i*4+1],original_colors[i*4+2],original_colors[i*4+3]]);	  
	  }
	}else {
	  colorArray.push.apply(colorArray,spectrum[color_index]);
	}	
	
      }



    }

    if(model.num_hemisphere != 2) {
      var newColorArray = [];
      var indexArrayLength = model.indexArray.length;
      for(var j=0; j< indexArrayLength; j++ ) {
	newColorArray[j*4]     = colorArray[model.indexArray[j]*4];
	newColorArray[j*4 + 1] = colorArray[model.indexArray[j]*4 + 1];
	newColorArray[j*4 + 2] = colorArray[model.indexArray[j]*4 + 2];
	newColorArray[j*4 + 3] = colorArray[model.indexArray[j]*4 + 3];
      }
      colorArray.nonIndexedColorArray = newColorArray;
    }
    
    return colorArray;


  };



  if(data) {
    if(typeof data == "string") {
      that.parse(data);      
    }else if(data.values !=undefined){
      this.values = cloneArray(data.values);
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