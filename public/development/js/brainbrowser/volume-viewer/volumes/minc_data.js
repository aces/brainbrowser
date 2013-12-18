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

/*
* @author: Nicolas Kassis
* @author: Tarek Sherif
*/

BrainBrowser.VolumeViewer.mincData = (function() {
  "use strict";

  /*
   * some utilities
   */
  function rotateUint16Array90Left(array, width, height){
    var new_array = new Uint16Array(width*height);
    
    for(var i = 0; i < width; i++){
      for(var j = 0; j < height; j++)  {
        new_array[i*height+j] = array[j*width+(width-i)];
  
      }
    }
    return new_array;
  }
  
  
  function rotateUint16Array90Right(array, width, height){
    var new_array = new Uint16Array(width*height);
    
    for(var i = 0; i < width; i++){
      for(var j = 0; j < height; j++)  {
        new_array[i*height+j] = array[(height-j)*width+i];
      }
    }
    return new_array;
  }

  var minc_data_proto = {
    parseHeader: function(data) {
      this.header = data;
      this.order = data.order;
      if(this.order.length === 4) {
        this.order = this.order.slice(1);
        this.time = data.time;
      }
      this.xspace = data.xspace;
      this.yspace = data.yspace;
      this.zspace = data.zspace;
      this.xspace.name = "xspace";
      this.yspace.name = "yspace";
      this.zspace.name = "zspace";
      
      this.xspace.space_length = parseFloat(this.xspace.space_length);
      this.yspace.space_length = parseFloat(this.yspace.space_length);
      this.zspace.space_length = parseFloat(this.zspace.space_length);

      this.xspace.start = parseFloat(this.xspace.start);
      this.yspace.start = parseFloat(this.yspace.start);
      this.zspace.start = parseFloat(this.zspace.start);

      this.xspace.step = parseFloat(this.xspace.step);
      this.yspace.step = parseFloat(this.yspace.step);
      this.zspace.step = parseFloat(this.zspace.step);


      if(this.order.length === 4) {
        this.time.space_length = parseFloat(this.time.space_length);
        this.time.start = parseFloat(this.time.start);
        this.time.step = parseFloat(this.time.step);
      }
      
      //figure out height and width of each slices in each direction
      var order0 = this[this.order[0]];
      var order1 = this[this.order[1]];
      var order2 = this[this.order[2]];


      order0.height        = parseFloat(order1.space_length);
      order0.height_space  = order1;
      order0.width         = parseFloat(order2.space_length);
      order0.width_space   = order2;

      order1.height=parseFloat(order2.space_length);
      order1.height_space=order2;
      order1.width=parseFloat(order0.space_length);
      order1.width_space = order0;

      order2.height=parseFloat(order1.space_length);
      order2.height_space=order1;
      order2.width=parseFloat(order0.space_length);
      order2.width_space = order0;

      //calculate the offsets for each element of a slice
      order0.offset=parseFloat(order1.space_length)*parseFloat(order2.space_length);
      order1.offset=parseFloat(order0.space_length);
      order2.offset=parseFloat(order0.space_length);
      order0.slice_length = order0.height * order0.width;
    },
    /*
     * Warning: This function can get a little crazy
     * We are trying to get a slice out of the array. To do this we need to be careful this
     * we check for the orientation of the slice (steps positive or negative affect the orientation)
     *
     */
    slice: function(axis, number, time) {
      var slice;
      var cachedSlices = this.cachedSlices;
      var order0 = this[this.order[0]];
      time = time || 0;
      
      cachedSlices[axis] = cachedSlices[axis] || [];
      cachedSlices[axis][time] =  cachedSlices[axis][time] || [];
      if(this[axis].step < 0) {
        number = this[axis].space_length - number;
      }
      if(cachedSlices[axis][time][number] !== undefined) {
        slice = cachedSlices[axis][time][number];
        slice.alpha = 1;
        slice.number = number;
        return slice;
      }
      
      if(this.order === undefined ) {
        return false;
      }
      
      var time_offset = 0;
      
      if(this.time) {
        time_offset = time * order0.height * order0.width * parseFloat(order0.space_length);
      }
      
      
      var length_step = this[axis].width_space.step;
      var height_step = this[axis].height_space.step;
      slice = {};
      var slice_data;
      var slice_length, height, row_length, element_offset, row_offset, slice_offset;
      var i, j, k;
      
      if(this.order[0] === axis) {
        slice_length = this[axis].height*this[axis].width;
        height = this[axis].height;
        row_length = this[axis].width;
        element_offset = 1;
        row_offset = row_length;
        slice_offset = slice_length;
        slice_data = new Uint16Array(slice_length);
        
        if(length_step > 0) {
          if(height_step > 0) {
            for (i = 0; i < slice_length; i++) {
              slice_data[i]=this.data[time_offset+ slice_offset*number+i];
            }
          } else {
            for(i = height; i > 0; i--) {
              for(j = 0; j < row_length; j++) {
                slice_data[(height-i)*row_length+j] = this.data[time_offset+slice_offset*number+i*row_length + j];
              }
            }
          }
        } else {
          if(height_step < 0) {
            for(i = 0; i < height; i++) {
              for(j = 0; j < row_length; j++) {
                slice_data[i*row_length+j] = this.data[time_offset+slice_offset*number+i*row_length + row_length - j];
              }
            }
          } else {
            for(i = height; i > 0; i--) {
              for(j = 0; j < row_length; j++) {
                slice_data[(height-i)*row_length+j] = this.data[time_offset+slice_offset*number+i*row_length + row_length - j];
              }
            }
          }
        }
        
      } else if (this.order[1] === axis ) {
        
        height = this[axis].height;
        slice_length = this[axis].height*this[axis].width;
        row_length = this[axis].width;
        element_offset = 1;
        row_offset = order0.slice_length;
        slice_offset = order0.width;
        slice_data = new Uint8Array(slice_length);
        
        
        if(height_step < 0) {
          for(j = 0; j<height; j++) {
            for(k = 0; k< row_length; k++){
              slice_data[j*(row_length)+k] = this.data[time_offset+number*slice_offset+row_offset*k+j];
            }
          }
        } else {
          for (j = height; j >= 0; j--) {
            for(k = 0; k < row_length; k++) {
              slice_data[(height-j)*(row_length)+k] = this.data[time_offset+number*slice_offset+row_offset*k+j];
            }
          }
        }
        
        
      } else {
        height = this[axis].height;
        slice_length = this[axis].height*this[axis].width;
        row_length = this[axis].width;
        element_offset = order0.slice_length;
        row_offset= order0.width;
        slice_offset = 1;
        slice_data = new Uint16Array(slice_length);
        
        
        
        
        for ( j = 0; j < height; j++) {
          for( k = 0; k < row_length; k++){
            slice_data[j*row_length+k] = this.data[time_offset+number+order0.width*j+k*order0.slice_length];
          }
        }
      }
      
      //set the spaces on each axis
      slice.x = this[axis].width_space;
      slice.y = this[axis].height_space;
      slice.width = row_length;
      slice.height = height;
      
      
      //Checks if the slices are need to be rotated
      //xspace should have yspace on the x axis and zspace on the y axis
      if(axis === "xspace" && this.xspace.height_space.name === "yspace"){
        if (this.zspace.step < 0){
          slice_data = rotateUint16Array90Right(slice_data,slice.width,slice.height);
        } else {
          slice_data = rotateUint16Array90Left(slice_data,slice.width,slice.height);
        }
        slice.x = this[axis].height_space;
        slice.y = this[axis].width_space;
        slice.width = height;
        slice.height = row_length;
        
      }
      //yspace should be XxZ
      if(axis === "yspace" && this.yspace.height_space.name === "xspace"){
        if(this.zspace.step < 0){
          slice_data = rotateUint16Array90Right(slice_data,slice.width,slice.height);
        }else {
          slice_data = rotateUint16Array90Left(slice_data,slice.width,slice.height);
        }
        slice.x = this[axis].height_space;
        slice.y = this[axis].width_space;
        slice.width = height;
        slice.height = row_length;
        
      }
      //zspace should be XxY
      if(axis === "zspace" && this.zspace.height_space.name === "xspace"){
        slice_data = rotateUint16Array90Left(slice_data,slice.width,slice.height);
        slice.x = this[axis].width_space;
        slice.y = this[axis].height_space;
        slice.width = height;
        slice.height = row_length;
        
      }
      
      slice.data = slice_data;
      //set the spaces on each axis
      slice.x = slice.x || this[axis].width_space;
      slice.y = slice.y || this[axis].height_space;
      slice.width = slice.width || row_length;
      slice.height = slice.height || height;
      cachedSlices[axis][time][number] = slice;

      return slice;
    }
  };


  // The actual factory function!!
  return function(filename, headers, data) {
    
    var minc_data = Object.create(minc_data_proto);
    minc_data.cachedSlices = {};
    minc_data.parseHeader(headers);
    minc_data.data = data;

    return minc_data;
  };
})();


