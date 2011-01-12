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
	       that[that.order[2]].height=that[that.order[0]].space_length;
	       that[that.order[2]].length=that[that.order[1]].space_length;
	      
	       //calculate the offsets for each element of a slice
	       that[that.order[0]].offset=that[that.order[1]].space_length*that[that.order[2]].space_length;
	       that[that.order[1]].offset=that[that.order[0]].space_length;
	       that[that.order[2]].offset=that[that.order[0]].space_length;

	       

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
    $.ajax( {
     	      url: filename+'/content',
     	      async: true,
     	      dataType: 'text',
     	      success: function(data) {
		that.parseData(data,callback,extraArgs);
	      },
     	      error: function(request,textStatus) {
     		throw {
     		 request: request,
     		 textStatus: textStatus
     	       };

	      }});

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
    data = new Uint16Array(data);
    //Why waste time, 16bit values ;p
    that.data = data;
    that.min =  0;
    that.max = 65535;
    callback(this,extraArgs);
  };


  this.slice = function(axis,number) {
    if(that.order == undefined ) {
      return false;
    }
    var height = that[axis].height;
    var slice_length = that[axis].height*that[axis].length;
    var row_length = that[axis].length;
    var element_offset = 1; //that[axis].element_offset;
    var row_offset = 1; //that[axis].row_offset;
    var slice_offset = slice_length;//that[axis].slice_offset;
    var slice = new Uint16Array(slice_length);

    


    for(var i=0; i < slice_length; i++){
      slice[i] = that.data[slice_length*number+i];
    };
    return slice;
 };


  if(filename != null && callback != null) {
    this.load_params(filename);
    this.load_data(filename,callback,extraArgs);
  }


  

}



