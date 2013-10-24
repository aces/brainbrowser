/*
 * Copyright (c) 2011-2012, McGill University
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided this the following conditions are met:
 *   * Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *   * Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *   * Neither the name of McGill University nor the
 *     names of its contributors may be used to endorse or promote products
 *     derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL McGill University  BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/*
 * Author: Nicolas Kassis <nic.kassis@gmail.com>
 */

BrainCanvas.mincData = (function() {
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
        this.order = this.order.slice(1,this.order.length);
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
      
      //figure out height and length of each slices in each direction
      //width and length are the same, I'm doing this until I replace
      //all references to length in code. Bad naming duh! :(
      this[this.order[0]].height        = parseFloat(this[this.order[1]].space_length);
      this[this.order[0]].height_space  = this[this.order[1]];
      this[this.order[0]].length        = parseFloat(this[this.order[2]].space_length);
      this[this.order[0]].length_space  = this[this.order[2]];
      this[this.order[0]].width         = parseFloat(this[this.order[2]].space_length);
      this[this.order[0]].width_space   = this[this.order[2]];

      this[this.order[1]].height=parseFloat(this[this.order[2]].space_length);
      this[this.order[1]].height_space=this[this.order[2]];
      this[this.order[1]].length=parseFloat(this[this.order[0]].space_length);
      this[this.order[1]].length_space = this[this.order[0]];
      this[this.order[1]].width=parseFloat(this[this.order[0]].space_length);
      this[this.order[1]].width_space = this[this.order[0]];

      this[this.order[2]].height=parseFloat(this[this.order[1]].space_length);
      this[this.order[2]].height_space=this[this.order[1]];
      this[this.order[2]].length=parseFloat(this[this.order[0]].space_length);
      this[this.order[2]].length_space = this[this.order[0]];
      this[this.order[2]].width=parseFloat(this[this.order[0]].space_length);
      this[this.order[2]].width_space = this[this.order[0]];

      //calculate the offsets for each element of a slice
      this[this.order[0]].offset=parseFloat(this[this.order[1]].space_length)*parseFloat(this[this.order[2]].space_length);
      this[this.order[1]].offset=parseFloat(this[this.order[0]].space_length);
      this[this.order[2]].offset=parseFloat(this[this.order[0]].space_length);
      this[this.order[0]].slice_length = this[this.order[0]].height*this[this.order[0]].length;
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
        time_offset = time * this[this.order[0]].height*this[this.order[0]].length * parseFloat(this[this.order[0]].space_length);
      }
      
      
      var length_step = this[axis].length_space.step;
      var height_step = this[axis].height_space.step;
      slice = {};
      var slice_data;
      var slice_length, height, row_length, element_offset, row_offset, slice_offset;
      var i, j, k;
      
      if(this.order[0] === axis) {
        slice_length = this[axis].height*this[axis].length;
        height = this[axis].height;
        row_length = this[axis].length;
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
        slice_length = this[axis].height*this[axis].length;
        row_length = this[axis].length;
        element_offset = 1;
        row_offset = this[this.order[0]].slice_length;
        slice_offset = this[this.order[0]].length;
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
        slice_length = this[axis].height*this[axis].length;
        row_length = this[axis].length;
        element_offset = this[this.order[0]].slice_length;
        row_offset= this[this.order[0]].length;
        slice_offset = 1;
        slice_data = new Uint16Array(slice_length);
        
        
        
        
        for ( j = 0; j < height; j++) {
          for( k = 0; k < row_length; k++){
            slice_data[j*row_length+k] = this.data[time_offset+number+this[this.order[0]].length*j+k*this[this.order[0]].slice_length];
          }
        }
      }
      
      //set the spaces on each axis
      slice.x = this[axis].length_space;
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
        slice.y = this[axis].length_space;
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
        slice.y = this[axis].length_space;
        slice.width = height;
        slice.height = row_length;
        
      }
      //zspace should be XxY
      if(axis === "zspace" && this.zspace.height_space.name === "xspace"){
        slice_data = rotateUint16Array90Left(slice_data,slice.width,slice.height);
        slice.x = this[axis].length_space;
        slice.y = this[axis].height_space;
        slice.width = height;
        slice.height = row_length;
        
      }
      
      slice.data = slice_data;
      //set the spaces on each axis
      slice.x = slice.x || this[axis].length_space;
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


