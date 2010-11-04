function MNCFile(filename) {
  var that = this;


    //Loads the file display parameters
  this.loadParams = function(filename) {
    var params = {};
    $.ajax({
	     url: filename+'/params',
	     async: false, //this shouldn't take long
	     dataType: 'json',
	     success: function(data){
	       params = data;
	     },
	     error: function(request, textStatus) {
	       throw {
		 request: request,
		 textStatus: textStatus
	       };
	     }

	   });
    return params;
  };

  //loads the data and calls parseData on it once it's loaded
  this.loadData = function(filename,callback,extraArgs) {
     $.ajax( {
     	      url: filename+'/content',
     	      async: true,
     	      dataType: 'text',
     	      success: function(data) {
     		var dataArray = that.parseData(data);
     		callback(mindframe,dataArray,extraArgs);
     	      },
     	      error: function(request,textStatus) {
     	       throw {
     		 request: request,
     		 textStatus: textStatus
     	       };

     	       }
	     });
  };



  //Parses the data and returns an array
  this.parseData = function(data_string) {

    data_string = data_string.replace(/\s+$/, '');
    data_string = data_string.replace(/^\s+/, '');
    var data = data_string.split(/\s+/);
    data_string = "";
    for(var i = 0; i < data.length; i++) {
      data[i]=parseFloat(data[i]);
    }

    //Why waste time, 16bit values ;p
    data.minVal = 0;
    data.maxVal = 65535;
    return data;
  };

  function setData() {
    that.data = that; 
  }


  that.init=function(filename) {
    that.params = that.loadParams(filename);
    loadData(filename,setData,null);
  };

}