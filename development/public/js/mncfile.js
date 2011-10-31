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