/*
 * Copyright (c) 2011-2012, McGill University
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
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

BrainCanvas.MincJS = function(filename, headers, data) {
  "use strict";
  
  if( !( this instanceof BrainCanvas.MincJS ) ){
    return new BrainCanvas.MincJS(filename, headers, data);
  }
  
  /*
   * some utilities
   */
  function rotateUint16Array90Left(array,width,height){
    var new_array = new Uint16Array(width*height);
    
    for(var i = 0; i< width; i++){
      for(var j = 0; j< height; j++)  {
        new_array[i*height+j] = array[j*width+(width-i)];
  
      }
    }
    return new_array;
  }
  
  
  function rotateUint16Array90Right(array,width,height){
    var new_array = new Uint16Array(width*height);
    
    for(var i = 0; i< width; i++){
      for(var j=0; j< height; j++)  {
        new_array[i*height+j] = array[(height-j)*width+i];
      }
    }
    return new_array;
  }
  
  var that = this;
  this.parseHeader = function(data) {
    that.header = data;
    that.order = data.order;
    if(that.order.length === 4) {
      that.order = that.order.slice(1,that.order.length);
      that.time = data.time;
    }
    that.xspace = data.xspace;
    that.yspace = data.yspace;
    that.zspace = data.zspace;
    that.xspace.name = "xspace";
    that.yspace.name = "yspace";
    that.zspace.name = "zspace";
    
    that.xspace.space_length = parseFloat(that.xspace.space_length);
    that.yspace.space_length = parseFloat(that.yspace.space_length);
    that.zspace.space_length = parseFloat(that.zspace.space_length);

    that.xspace.start = parseFloat(that.xspace.start);
    that.yspace.start = parseFloat(that.yspace.start);
    that.zspace.start = parseFloat(that.zspace.start);

    that.xspace.step = parseFloat(that.xspace.step);
    that.yspace.step = parseFloat(that.yspace.step);
    that.zspace.step = parseFloat(that.zspace.step);


    if(that.order.length === 4) {
      that.time.space_length = parseFloat(that.time.space_length);
      that.time.start = parseFloat(that.time.start);
      that.time.step = parseFloat(that.time.step);
    }
    
    //figure out height and length of each slices in each direction
    //width and length are the same, I'm doing this until I replace
    //all references to length in code. Bad naming duh! :(
    that[that.order[0]].height        = parseFloat(that[that.order[1]].space_length);
    that[that.order[0]].height_space  = that[that.order[1]];
    that[that.order[0]].length        = parseFloat(that[that.order[2]].space_length);
    that[that.order[0]].length_space  = that[that.order[2]];
    that[that.order[0]].width         = parseFloat(that[that.order[2]].space_length);
    that[that.order[0]].width_space   = that[that.order[2]];

    that[that.order[1]].height=parseFloat(that[that.order[2]].space_length);
    that[that.order[1]].height_space=that[that.order[2]];
    that[that.order[1]].length=parseFloat(that[that.order[0]].space_length);
    that[that.order[1]].length_space = that[that.order[0]];
    that[that.order[1]].width=parseFloat(that[that.order[0]].space_length);
    that[that.order[1]].width_space = that[that.order[0]];

    that[that.order[2]].height=parseFloat(that[that.order[1]].space_length);
    that[that.order[2]].height_space=that[that.order[1]];
    that[that.order[2]].length=parseFloat(that[that.order[0]].space_length);
    that[that.order[2]].length_space = that[that.order[0]];
    that[that.order[2]].width=parseFloat(that[that.order[0]].space_length);
    that[that.order[2]].width_space = that[that.order[0]];

    //calculate the offsets for each element of a slice
    that[that.order[0]].offset=parseFloat(that[that.order[1]].space_length)*parseFloat(that[that.order[2]].space_length);
    that[that.order[1]].offset=parseFloat(that[that.order[0]].space_length);
    that[that.order[2]].offset=parseFloat(that[that.order[0]].space_length);
    that[that.order[0]].slice_length = that[that.order[0]].height*that[that.order[0]].length;
  };
  

  var cachedSlices = {};
  /*
   * Warning: This function can get a little crazy
   * We are trying to get a slice out of the array. To do this we need to be careful that
   * we check for the orientation of the slice (steps positive or negative affect the orientation)
   *
   */
  this.slice = function(axis, number, time) {
    var slice;
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
    
    if(that.order === undefined ) {
      return false;
    }
    
    var time_offset = 0;
    
    if(that.time) {
      time_offset = time * that[that.order[0]].height*that[that.order[0]].length*parseFloat(that[that.order[0]].space_length);
    }
    
    
    var length_step = that[axis].length_space.step;
    var height_step = that[axis].height_space.step;
    slice = {};
    var slice_data;
    var slice_length, height, row_length, element_offset, row_offset, slice_offset;
    var i, j, k;
    
    if(that.order[0] === axis) {
      slice_length = that[axis].height*that[axis].length;
      height = that[axis].height;
      row_length = that[axis].length;
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
      
    } else if (that.order[1] === axis ) {
      
      height = that[axis].height;
      slice_length = that[axis].height*that[axis].length;
      row_length = that[axis].length;
      element_offset = 1;
      row_offset = that[that.order[0]].slice_length;
      slice_offset = that[that.order[0]].length;
      slice_data = new Uint8Array(slice_length);
      
      
      if(height_step < 0) {
        for(j = 0; j<height; j++) {
          for(k = 0; k< row_length; k++){
            slice_data[j*(row_length)+k] = that.data[time_offset+number*slice_offset+row_offset*k+j];
          }
        }
      } else {
        for (j = height; j >= 0; j--) {
          for(k = 0; k < row_length; k++) {
            slice_data[(height-j)*(row_length)+k] = that.data[time_offset+number*slice_offset+row_offset*k+j];
          }
        }
      }
      
      
    } else {
      height = that[axis].height;
      slice_length = that[axis].height*that[axis].length;
      row_length = that[axis].length;
      element_offset = that[that.order[0]].slice_length;
      row_offset= that[that.order[0]].length;
      slice_offset = 1;
      slice_data = new Uint16Array(slice_length);
      
      
      
      
      for(j = 0; j<height; j++) {
        for(k = 0; k< row_length; k++){
          slice_data[j*(row_length)+k] = that.data[time_offset+number+that[that.order[0]].length*j+k*that[that.order[0]].slice_length];
        }
      }
    }
    
    //set the spaces on each axis
    slice.x = that[axis].length_space;
    slice.y = that[axis].height_space;
    slice.width = row_length;
    slice.height = height;
    
    
    //Checks if the slices are need to be rotated
    //xspace should have yspace on the x axis and zspace on the y axis
    if(axis === "xspace" && that.xspace.height_space.name === "yspace"){
      if (that.zspace.step < 0){
        slice_data = rotateUint16Array90Right(slice_data,slice.width,slice.height);
      } else {
        slice_data = rotateUint16Array90Left(slice_data,slice.width,slice.height);
      }
      slice.x = that[axis].height_space;
      slice.y = that[axis].length_space;
      slice.width = height;
      slice.height = row_length;
      
    }
    //yspace should be XxZ
    if(axis === "yspace" && that.yspace.height_space.name === "xspace"){
      if(that.zspace.step < 0){
        slice_data = rotateUint16Array90Right(slice_data,slice.width,slice.height);
      }else {
        slice_data = rotateUint16Array90Left(slice_data,slice.width,slice.height);
      }
      slice.x = that[axis].height_space;
      slice.y = that[axis].length_space;
      slice.width = height;
      slice.height = row_length;
      
    }
    //zspace should be XxY
    if(axis === "zspace" && that.zspace.height_space.name === "xspace"){
      slice_data = rotateUint16Array90Left(slice_data,slice.width,slice.height);
      slice.x = that[axis].length_space;
      slice.y = that[axis].height_space;
      slice.width = height;
      slice.height = row_length;
      
    }
    
    slice.data = slice_data;
    //set the spaces on each axis
    slice.x = slice.x || that[axis].length_space;
    slice.y = slice.y || that[axis].height_space;
    slice.width = slice.width || row_length;
    slice.height = slice.height || height;
    cachedSlices[axis][time][number] = slice;
    return slice;
  };
  
  
  /*
   * Interpolates the slice data using nearest neighboor interpolation
   */
  //this.nearestNeighboor = function(slice, width, height, new_width, new_height) {
  //  var data = slice.data;
  //  var new_slice = {};
  //  var new_array = new Uint16Array(new_width * new_height);
  //  var x_ratio = width/new_width;
  //  var y_ratio = height/new_height;
  //  
  //  for (var i = 0; i < new_height; i++) {
  //    for (var j = 0; j < new_width; j++)  {
  //      var px = Math.floor(j * x_ratio);
  //      var py = Math.floor(i * y_ratio);
  //      new_array[Math.floor(i * new_width + j)] = data[Math.floor(py * width + px)];
  //    }
  //  }
  //
  //  new_slice.data = new_array;
  //  new_slice.x = slice.x; //|| that[axis].length_space; axis not defined: copy and pasted?
  //  new_slice.y = slice.y; //|| that[axis].height_space;
  //  new_slice.width = new_width;
  //  new_slice.height = new_height;
  //  
  //  return new_slice;
  //};

  
  /*
   * Scale a slice to be at a 1 instead of whatever step it is.
   */
  //this.getScaledSlice = function(axis, number, zoom, time) {
  //  zoom = zoom || 1;
  //  var original_slice = that.slice(axis, number, time);
  //  
  //  if (zoom === 1) return original_slice;
  //  
  //  var width      = that[axis].length;
  //  var height     = that[axis].height;
  //  var new_width  = Math.ceil(Math.abs(that[axis].length_space.step) * width * zoom);
  //  var new_height = Math.ceil(Math.abs(that[axis].height_space.step) * height * zoom);
  //  var slice = original_slice; //this.nearestNeighboor(original_slice, width, height, new_width, new_height);
  //
  //  //Checks if the slices are need to be rotated
  //  //xspace should have yspace on the x axis and zspace on the y axis
  //  //if(axis === "xspace" && that.xspace.height_space.name === "yspace"){
  //  //  if (that.zspace.step < 0) {
  //  //    slice.data = rotateUint16Array90Right(slice.data,new_width,new_height);
  //  //  } else {
  //  //    slice.data = rotateUint16Array90Left(slice.data,new_width,new_height);
  //  //  }
  //  //}
  //  //
  //  ////yspace should be XxZ
  //  //if (axis === "yspace" && that.yspace.height_space.name === "xspace"){
  //  //  if (that.zspace.step < 0){
  //  //    slice.data = rotateUint16Array90Right(slice.data, new_width, new_height);
  //  //  } else {
  //  //    slice.data = rotateUint16Array90Left(slice.data, new_width, new_height);
  //  //  }
  //  //}
  //  //
  //  ////zspace should be XxY
  //  //if (axis === "zspace" && that.zspace.height_space.name === "xspace"){
  //  //  slice.data = rotateUint16Array90Left(slice.data, new_width, new_height);
  //  //}
  //
  //  return slice;
  //};

  this.parseHeader(headers);
  this.data = data;

  
};
