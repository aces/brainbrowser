function Minc(filename,extraArgs,callback) {
  var that = this;


  this.load_params = function(filename) {
    var params = {};
    $.ajax({
	     url: filename+'/params',
	     dataType: 'json',
	     async: false,
	     success: function(data){
	       that.order = data.order;
	       that.xspace = data.xspace;
	       that.yspace = data.yspace;
	       that.zspace = data.zspace;

	       //figure out height and length of each slices in each direction
	       that[that.order[0]].height=that[that.order[1]].space_length;
	       that[that.order[0]].length=that[that.order[2]].space_length;
	       that[that.order[1]].height=that[that.order[0]].space_length;
	       that[that.order[1]].length=that[that.order[2]].space_length;
	       that[that.order[2]].height=that[that.order[1]].space_length;
	       that[that.order[2]].length=that[that.order[0]].space_length;
	      
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
    
    request.open('GET', filename+'/content',true);
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


  this.slice = function(axis,number) {
    if(that.order == undefined ) {
      return false;
    }
    if(that.order[0] == axis) {
      var slice_length = that[axis].height*that[axis].length;
      var row_length = that[axis].length;
      var element_offset = 1; //that[axis].element_offset;
      var row_offset = row_length; //that[axis].row_offset;
      var slice_offset = slice_length;//that[axis].slice_offset;
      var slice = new Uint16Array(slice_length);
      
      for(var i=0; i< slice_length; i++) {
	slice[i]=this.data[slice_offset*number+i];
      }
      
    } else if(that.order[1] == axis ) {

      var height = that[axis].height;
      var slice_length = that[axis].height*that[axis].length;
      var row_length = that[axis].length;
      var element_offset = 1; 
      var row_offset = that[that.order[0]].slice_length;
      var slice_offset = row_length; 
      var slice = new Uint16Array(slice_length);

      for(var j=0; j<height; j++)
	for(var k=0; k< row_length; k++){
	  slice[j*(row_length)+k] = that.data[number*slice_offset+row_offset*j+k];    
	}
      
    }else {
      var height = that[axis].height;
      var slice_length = that[axis].height*that[axis].length;
      var row_length = that[axis].length;
      var element_offset = that[that.order[0]].slice_length; //that[axis].element_offset;
      var row_offset= that[that.order[0]].length; //that[axis].row_offset;
      var slice_offset = 1;//that[axis].slice_offset;
      var slice = new Uint16Array(slice_length);

      for(var j=0; j<height; j++)
	for(var k=0; k< row_length; k++){
	  slice[j*(row_length)+k] = that.data[number+that[that.order[0]].length*j+k*that[that.order[0]].slice_length];    
	}

      

    }
    

    return slice;
 };


  if(filename != null && callback != null) {
    this.load_params(filename);
    this.load_data(filename,callback,extraArgs);
  }


  

}



