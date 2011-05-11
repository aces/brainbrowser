/*
 * This file defines a class called Dataset that is used to fetch and parse the macacc
 * dataset from the server
 */

function Dataset() {


  /*
   * This function generates the path to the data file on the server
   * ex : /data/ICBM152_MACACC_Area/ICBM152_20mm_MACACC/T_map/T_2567.txt
   */
  this.path = function(vertex,settings) {

    var sk =  "ICBM152_" + settings.sk;
    if(settings.modality == 'CT') {
      var modality = "ICBM152_"+settings.modality+"_MACACC_mean";
    }else {
      var modality = "ICBM152_"+settings.modality+"_MACACC_size";
    }

    if(settings.statistic == 'T') {
      var statistic = "T_map/T_";
    } else if(settings.statistic == 'P1') {
      var statistic = "RTF_C_map/RTF_C_";
    } else if(settings.statistic == 'P2') {
      var statistic = "RTF_V_map/RTF_V_";
    }
    return "/data/"+modality + "/" +sk+"/"+statistic+vertex+".txt";
  };

  /*
   * Parses the text from the ajax request into an array of values
   */
  this.parse = function(data) {
    var string = data;
    string = string.replace(/\s+$/, '');
    string = string.replace(/^\s+/, '');
    this.data = string.split(/\s+/);
    this.min = this.data.min();
    this.max = this.data.max();
  };

  /*
   * Issues a request to the server for the data, sends it to parse and then calls
   * the callback
   */
  this.get_data = function(vertex,settings,callback){
    var path = this.path(vertex,settings);

    var that = this;
    jQuery.ajax({
      type: 'GET',
      url: path,
      dataType: 'text',
      success: function(data) {
	that.parse(data);
	callback(that);
      },
      error: function () {
	jQuery(g_pickInfoElem).html("Error loading map");
      }

    });

  };

};