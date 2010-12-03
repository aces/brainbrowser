function Minc() {
  var worker = new Worker('/js/minc-worker.js');
  var that = this;
  this.load_data = function (filename,callback,extraArgs){  
    $.ajax( {
     	      url: filename+'/content',
     	      async: true,
     	      dataType: 'text',
     	      success: function(data) {
		that.parseData(data,callback,extraArgs) ;
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
      worker.addEventListener('message',function(e) {
	callback(e.data,extraArgs);
      });
      worker.postMessage(data_string);
  };

}



