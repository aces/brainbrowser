/*
 * Library to encapsulate Minc. 
 * It request the parameters needed and then request the data block from the server
 * The data block is a binary array
 * The library can fetch slices in one of the three axese
 */
function Minc(filename,extraArgs,callback) {
  var that = this;


  /*
   * Parameters of the minc file. 
   * Most important  
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
	       that[that.order[0]].height=that[that.order[1]].space_length;
	       that[that.order[0]].height_space=that[that.order[1]];
	       that[that.order[0]].length=that[that.order[2]].space_length;
	       that[that.order[0]].length_space = that[that.order[2]];
	       that[that.order[1]].height=that[that.order[2]].space_length;
	       that[that.order[1]].height_space=that[that.order[2]];
	       that[that.order[1]].length=that[that.order[0]].space_length;
	       that[that.order[1]].length_space = that[that.order[0]];
	       that[that.order[2]].height=that[that.order[1]].space_length;
	       that[that.order[2]].height_space=that[that.order[1]];
	       that[that.order[2]].length=that[that.order[0]].space_length;
	       that[that.order[2]].length_space = that[that.order[0]];
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
    //Are we counting slices backwards? 
    //if(step < 0) {
      //number = space_length - number;
    //}
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
	for(var i=0; i< slice_length; i++) {
	  slice[i]=this.data[time_offset+ slice_offset*number+i];
	}
	
      }else {
	for(var i=0; i < height; i++) {
	  for(var j=0; j < row_length; j++) {
	    slice[i*row_length+j]=this.data[time_offset+slice_offset*number+i*row_length + row_length - j];
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
      if(height_step < 0 ) {
	number = space_length - number;
      }
      for(var j=0; j<height; j++)
	for(var k=0; k< row_length; k++){
	  slice[j*(row_length)+k] = that.data[time_offset+number+that[that.order[0]].length*j+k*that[that.order[0]].slice_length];    
	}
      

    }
    

    return slice;
 };


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

  this.getScaledSlice = function(axis,number,time) { 
    
   var original_slice= that.slice(axis,number,time);
   var width      =  that[axis].length;
   var height     = that[axis].height;
   var new_width  = Math.ceil(Math.abs(that[axis].length_space.step)*width);
   var new_height = Math.ceil(Math.abs(that[axis].height_space.step)*height);

   return this.nearestNeighboor(original_slice,width,height,new_width,new_height);
    
  };


  if(filename != null && callback != null) {
    this.load_headers(filename);
    this.load_data(filename,callback,extraArgs);
  }


  

}



