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
 * Library to encapsulate Minc. 
 * It request the parameters needed and then request the data block from the server
 * The data block is a binary array
 * The library can fetch slices in one of the three axese
 */
function Minc(filename,extraArgs,callback) {
  var that = this;


  /*
   * Fetch the parameters of the minc file. 
   * 
   */
  this.load_headers = function(filename) {
    $.ajax({
	     url: filename,
	     dataType: 'json',
	     data: {
	       minc_headers: true
	     },
	     async: false,
	     success: function(data){
	       that.header = data;
	       that.order = data.order;
	       if(that.order.length == 4) {
		 that.order = that.order.slice(1,that.order.length);
		 that.time = data.time;
	       }
	       that.xspace = data.xspace;
	       that.yspace = data.yspace;
	       that.zspace = data.zspace;
	       that.xspace.name = "xspace";
	       that.yspace.name = "yspace";
	       that.zspace.name = "zspace";


	       //figure out height and length of each slices in each direction
	       //width and length are the same, I'm doing this until I replace
	       //all references to length in code. Bad naming duh! :( 
	       that[that.order[0]].height=that[that.order[1]].space_length;
	       that[that.order[0]].height_space=that[that.order[1]];
	       that[that.order[0]].length=that[that.order[2]].space_length;
	       that[that.order[0]].length_space = that[that.order[2]];
	       that[that.order[0]].width=that[that.order[2]].space_length;
	       that[that.order[0]].width_space = that[that.order[2]];

	       that[that.order[1]].height=that[that.order[2]].space_length;
	       that[that.order[1]].height_space=that[that.order[2]];
	       that[that.order[1]].length=that[that.order[0]].space_length;
	       that[that.order[1]].length_space = that[that.order[0]];
	       that[that.order[1]].width=that[that.order[0]].space_length;
	       that[that.order[1]].width_space = that[that.order[0]];

	       that[that.order[2]].height=that[that.order[1]].space_length;
	       that[that.order[2]].height_space=that[that.order[1]];
	       that[that.order[2]].length=that[that.order[0]].space_length;
	       that[that.order[2]].length_space = that[that.order[0]];
	       that[that.order[2]].width=that[that.order[0]].space_length;
	       that[that.order[2]].width_space = that[that.order[0]];

	       //calculate the offsets for each element of a slice
	       that[that.order[0]].offset=that[that.order[1]].space_length*that[that.order[2]].space_length;
	       that[that.order[1]].offset=that[that.order[0]].space_length;
	       that[that.order[2]].offset=that[that.order[0]].space_length;
	       that[that.order[0]].slice_length = that[that.order[0]].height*that[that.order[0]].length;
	       

	     },
	     error: function(request, textStatus) {
	       throw {
		 request: request,
		 textStatus: textStatus
	       };
	     }

	   });


  };

  /*
   * Make request to server for Minc file's data block. 
   */
  this.load_data = function (filename,callback,extraArgs){  
    var request = new XMLHttpRequest();
    
    request.open('GET', filename+'?raw_data=true',true);
    request.responseType = 'arraybuffer';
    request.onreadystatechange = function() {
      if(request.readyState == 4)
	if(request.status == 200) {
	  if(request.mozResponseArrayBuffer != undefined) {
	    that.data = new Uint8Array(request.mozResponseArrayBuffer);	    
	  }else {
	    that.data = new Uint8Array(request.response);
	  }

	  that.min = 0;
	  that.max = 255;
	  callback(that,extraArgs);
		
	}
      
    };
    request.send(null);
  };
  //Parses the data and returns an array
  this.parseData = function(data_string,callback,extraArgs) {
    data_string = data_string.replace(/\s+$/, '');
    data_string = data_string.replace(/^\s+/, '');
    var data = data_string.split(/\s+/);
    data_string = "";
    var data_length = data.length;
    for(var i = 0; i < data_length ; i++) {
      data[i]=parseInt(data[i]);
    }
    that.min = data.min();
    that.max = data.max();

    data = new Uint16Array(data);
    that.data = data;
    callback(this,extraArgs);
  };
  this.sliceFromCoordinates = function(axis,x,y,z) {
    
  };

  
  /*
   * Warning: This function can get a little crazy
   * We are trying to get a slice out of the array. To do this we need to be careful that
   * we check for the orientation of the slice (steps positive or negative affect the orientation)
   * 
   */
  this.slice = function(axis,number,time) {
    if(that.order == undefined ) {
      return false;
    }
    if(that.time) {
      if(!time) {
	time = 0;
      }
      var time_offset = time*that[that.order[0]].height*that[that.order[0]].length*that[that.order[0]].space_length;
    }else {
      var time_offset = 0;
    }
    var space_length = that[axis].space_length;
    var step = that[axis].step;


    var length_step = that[axis].length_space.step;      
    var height_step = that[axis].height_space.step;
    if(that.order[0] == axis) {
      var slice_length = that[axis].height*that[axis].length;
      var height = that[axis].height;
      var row_length = that[axis].length;
      var element_offset = 1; 
      var row_offset = row_length; 
      var slice_offset = slice_length;
      var slice = new Uint16Array(slice_length);

      if(length_step > 0) {
	if(height_step > 0) {
	  for(var i=0; i< slice_length; i++) {
	    slice[i]=this.data[time_offset+ slice_offset*number+i];
	  }
	  
	}else {
          for(var i=height; i > 0; i--) {
	    for(var j=0; j < row_length; j++) {
	      slice[(height-i)*row_length+j]=this.data[time_offset+slice_offset*number+i*row_length + j];
	    }	    
	  }
	  
	}

	
      }else {
	if(height_step < 0) {
          for(var i=0; i < height; i++) {
	    for(var j=0; j < row_length; j++) {
	      slice[i*row_length+j]=this.data[time_offset+slice_offset*number+i*row_length + row_length - j];
	    }	    
	  }
	}else {
          for(var i=height; i > 0; i--) {
	    for(var j=0; j < row_length; j++) {
	      slice[(height-i)*row_length+j]=this.data[time_offset+slice_offset*number+i*row_length + row_length - j];
	    }	    
	  }
	  
	}
      }

    

      
    } else if(that.order[1] == axis ) {

      var height = that[axis].height;
      var slice_length = that[axis].height*that[axis].length;
      var row_length = that[axis].length;
      var element_offset = 1; 
      var row_offset = that[that.order[0]].slice_length;
      var slice_offset = that[that.order[0]].length; 
      var slice = new Uint16Array(slice_length);
      
   
      if(height_step < 0) {
	for(var j=0; j<height; j++)
	  for(var k=0; k< row_length; k++){
	    slice[j*(row_length)+k] = that.data[time_offset+number*slice_offset+row_offset*k+j];    
	  }
	
      }else {
	for(var j=height; j>=0; j--)
	  for(var k=0; k< row_length; k++){
	    slice[(height-j)*(row_length)+k] = that.data[time_offset+number*slice_offset+row_offset*k+j];    
	  }
      
      }
      

    }else {
      var height = that[axis].height;
      var slice_length = that[axis].height*that[axis].length;
      var row_length = that[axis].length;
      var element_offset = that[that.order[0]].slice_length;
      var row_offset= that[that.order[0]].length; 
      var slice_offset = 1;
      var slice = new Uint16Array(slice_length);

      for(var j=0; j<height; j++)
	for(var k=0; k< row_length; k++){
	  slice[j*(row_length)+k] = that.data[time_offset+number+that[that.order[0]].length*j+k*that[that.order[0]].slice_length];    
	}
      

    }
    
    return slice;
 };

  /*
   * Interpolates the slice data using nearest neighboor interpolation
   */
  this.nearestNeighboor = function(data,width,height,new_width,new_height) {
    var new_array = new Uint16Array(new_width * new_height);
    var x_ratio = width/new_width;
    var y_ratio = height/new_height;
    
    for(var i = 0; i< new_height; i++) {
     for(var j = 0; j < new_width; j++)  {
       var px = Math.floor(j*x_ratio);  
       var py = Math.floor(i*y_ratio);
       new_array[Math.floor(i*new_width+j)] = data[Math.floor(py*width+px)];
     }
   
    }
    return new_array;
  };

  /*
   * Scale a slice to be at a 1 instead of whatever step it is. 
   */
  this.getScaledSlice = function(axis,number,time,zoom) { 
    
    var original_slice= that.slice(axis,number,time);
    var width      =  that[axis].length;
    var height     = that[axis].height;
    var new_width  = Math.ceil(Math.abs(that[axis].length_space.step)*width*zoom);
    var new_height = Math.ceil(Math.abs(that[axis].height_space.step)*height*zoom);
   
    var slice = this.nearestNeighboor(original_slice,width,height,new_width,new_height);

   
    //Checks if the slices are need to be rotated
    //xspace should have yspace on the x axis and zspace on the y axis
    if(axis == "xspace" && that.xspace.height_space.name=="yspace"){
      if(that.zspace.step < 0){
	slice = rotateUint16Array90Right(slice,new_width,new_height);      	
      }else {
	slice = rotateUint16Array90Left(slice,new_width,new_height);      	
      }



    }
    //yspace should be XxZ
    if(axis == "yspace" && that.yspace.height_space.name=="xspace"){
      if(that.zspace.step < 0){
	slice = rotateUint16Array90Right(slice,new_width,new_height);      	
      }else {
	slice = rotateUint16Array90Left(slice,new_width,new_height);      	
      }

    }
    //zspace should be XxY 
    if(axis == "zspace" && that.zspace.height_space.name=="xspace"){
	slice = rotateUint16Array90Left(slice,new_width,new_height);      	
    }


   return slice;
    
  };

  /*
   * Get the value of a point at location x,y,z and time index 
   * This will be used for example by the graphing tool when viewing 4D data 
   * to show intensity graphs
   */
  this.getValueAtLocation = function(x,y,z,time) {
    
  };

  /*
   * Makes calls to server for data and headers
   */
  if(filename != null && callback != null) {
    this.load_headers(filename);
    this.load_data(filename,callback,extraArgs);
  }


  

}



