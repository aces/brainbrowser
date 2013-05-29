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
 
BrainBrowser.modules.data = function(bb) {
  
  var Data = BrainBrowser.data.Data;
  var filetypes = BrainBrowser.filetypes;

  bb.loadModelFromUrl = function(url, opts) {
    var options = opts || {};
    var parts;
    var filename;
    var filetype = options.format || "MNIObject";
    loadFromUrl(url, opts, function(data) {
		    parts = url.split("/");
		    //last part of url will be shape name
		    filename = parts[parts.length-1];
		    bb.displayObjectFile(new filetypes[filetype](data), filename, options);
		});
  };

  bb.loadModelFromFile = function(file_input, opts) {
    var options = opts || {};
    var parts;
    var filename;
    var obj;
    var filetype = options.format || "MNIObject";
    
    loadFromTextFile(file_input, options, function(data) {
      parts = file_input.value.split("\\");
			//last part of path will be shape name
			filename = parts[parts.length-1];
			obj = new filetypes[filetype](data)
      
      if (obj.objectClass !== "__FAIL__") {
        bb.displayObjectFile(obj, filename, options);
      } else if (options.onError != undefined) {
        options.onError();
      }
	  });
  };
  
  bb.loadDataFromUrl = function(file_input, name) {

     loadFromUrl(file_input, null, function(text,file) {
       var data;

 		  bb.model_data.data  = new Data(text);
 		  data = bb.model_data.data;

 		  data.fileName = name;
 		  initRange(data.min, data.max);
 		  if (bb.afterLoadData != undefined) {
 		    bb.afterLoadData(data.rangeMin, data.rangeMax, data);
 		  }

 		  bb.updateColors(data, data.rangeMin, data.rangeMax, bb.spectrum);
 		});
   };

   /*
    * Load text data from file and update colors
    */
   bb.loadDataFromFile = function(file_input) {
     var filename = file_input.files[0].name;
     var model_data = bb.model_data;
     var positionArray = model_data.positionArray;
     var positionArrayLength = positionArray.length;

     var onfinish = function(text) {
 	    var data = new Data(text);
       data.fileName = filename;
 	    if (data.values.length < positionArrayLength/4) {
 	      alert("Number of numbers in datafile lower than number of vertices Vertices" + positionArrayLength/3 + " data values:" + data.values.length );
 	      return -1;
 	    } else {
 	      model_data.data = data;
 	    }
       initRange(data.min,
 		    data.max);
       if(bb.afterLoadData !=null) {
 	      bb.afterLoadData(data.rangeMin, data.rangeMax, data);
       }


       bb.updateColors(data, data.rangeMin, data.rangeMax, bb.spectrum, bb.flip, bb.clamped);
     };

     if(filename.match(/.*.mnc|.*.nii/)) {
       evaluate_volume(filename, onfinish);
     } else {
       loadFromTextFile(file_input, null, onfinish);
     }
   };

  bb.loadSpectrumFromUrl  = function(url, opts) {
    var options = opts || {};
    var afterLoadSpectrum = options.afterLoadSpectrum
    var spectrum;
    
    //get the spectrum of colors
    loadFromUrl(url, options, function (data) {
		    spectrum = new Spectrum(data);
		    bb.spectrum = spectrum;

        if (afterLoadSpectrum) afterLoadSpectrum();

		    if (bb.afterLoadSpectrum != null) {
		      bb.afterLoadSpectrum(spectrum);
		    }

		    if (bb.model_data.data) {
		      bb.updateColors(bb.model_data.data, bb.model_data.data.rangeMin, bb.model_data.data.rangeMax, bb.spectrum, bb.flip, bb.clamped);
		    }

		});
  };

  

  //Load a color bar spectrum definition file
  bb.loadSpectrumFromFile = function(file_input){
    var spectrum;
    var model_data = bb.model_data;
    
    loadFromTextFile(file_input, null, function(data) {
		    spectrum = new Spectrum(data);
		    bb.spectrum = spectrum;
		    if(bb.afterLoadSpectrum != null) {
		      bb.afterLoadSpectrum(spectrum);
		    }
		    if(model_data.data) {
		      bb.updateColors(model_data.data, model_data.data.rangeMin, model_data.data.rangeMax, bb.spectrum, bb.flip, bb.clamped);
		    }
		});
  };
  
  bb.blend = function(value) {
    var blendData = bb.blendData;
    var blendDataLength = blendData.length;
    var i;
    
    blendData[0].alpha = value;
    blendData[1].alpha = 1.0 - value;
    for(i = 2; i < blendDataLength; i++) {
      blendData[i].alpha = 0.0;
    }
    

    bb.updateColors(blendData, null, null, bb.spectrum, bb.flip, bb.clamped, true); //last parameter says to blend data.
  };

  /*
   * Load a series of data files to be viewed with a slider. 
   */
  bb.loadSeriesDataFromFile = function(file_input) {
		var numberFiles = file_input.files.length;
		var files = file_input.files;
		var reader;
		var i;
		
		bb.seriesData = new Array(numberFiles);
		bb.seriesData.numberFiles = numberFiles;
		
 		for(i = 0; i < numberFiles; i++) {
		  reader = new FileReader();
		  reader.file = files[i];
		  /*
		  * Using a closure to keep the value of i around to put the 
		  * data in an array in order. 
		  */
		  reader.onloadend = (function(file, num) {
			  return function(e) {
		   	  console.log(e.target.result.length);
					console.log(num);
					bb.seriesData[num] = new Data(e.target.result);
				  bb.seriesData[num].fileName = file.name;
							 
				};
			})(reader.file, i);
		  
		  reader.readAsText(files[i]);
    }
    bb.setupSeries();
  };

  
  function interpolateDataArray(first,second,percentage,blah) {
    console.log(first.values.length);
    //  if(first.length != second.length) {
    //  console.log("can't interpolate different array size");
      //throw "can't interpolate different array size";
    // }
    var i;
    var count = first.values.length;  
    var new_array = new Array(count);
    console.log("Percentage: " + percentage);
    
    
    for(i = 0; i < count; i++) {
      if(blah){
        new_array[i] = (first.values[i]*(100-percentage*100)+second.values[i]*(percentage*100))/100;            
      }else {
        new_array[i] = (first.values[i]*(100-percentage*100)+second.values[i]*(percentage*100))/100;            
      }

    }
    console.log(new_array.length);
    return new_array;
  }

  /*
   * Setup for series data, creates a slider to switch between files. 
   */
  bb.setupSeries = function() {
    var model_data = bb.model_data;
    var seriesData = bb.seriesData;
    var positionArray = bb.model_data.positionArray;
    
    $("<div id=\"series\">Series: </div>").appendTo("#surface_choice");
    var div = $("#series");
    $("<span id=\"series-value\">0</span>").appendTo(div);
    $("<div id=\"series-slider\" width=\"100px\" + height=\"10\"></div>")
     .slider({
       value: 0,
       min: 0,
       max: seriesData.numberFiles-1,	       
       step: 0.1,
       slide: function(event,ui) {
         if (ui.value -  Math.floor(ui.value) < 0.01) { //is it at an integer? then just return the array			
           model_data.data = seriesData[ui.value];											     
           } else { //interpolate
             if (seriesData[0].fileName.match("pval.*")){
               model_data.data = new Data(interpolateDataArray(seriesData[Math.floor(ui.value)],
               seriesData[Math.floor(ui.value)+1],
               (ui.value -  Math.floor(ui.value)),true));		
             } else {
               model_data.data = new Data(interpolateDataArray(seriesData[Math.floor(ui.value)],
               seriesData[Math.floor(ui.value)+1],
               (ui.value -  Math.floor(ui.value))));
             }    
           }
           if (seriesData[0].fileName.match("mt.*")) {
             $("#age_series").html("Age: " + (ui.value*3+5).toFixed(1));
  
           } else if (seriesData[0].fileName.match("pval.*")) {
             $("#age_series").html("Age: " + (ui.value*1+10));
           }
           $(div).children("#series-value").html(ui.value);
           if (model_data.data.values.length < positionArray.length/4) {
             console.log("Number of numbers in datafile lower than number of vertices Vertices" 
             + positionArray.length/3 + " data values:" 
             + model_data.data.values.length );
             return -1;
           }
           initRange(model_data.data.min, model_data.data.max);
           if (bb.afterLoadData !=null) {
             bb.afterLoadData(model_data.data.rangeMin, model_data.data.rangeMax, model_data.data);
           }
  
           bb.updateColors(model_data.data, model_data.data.rangeMin, model_data.data.rangeMax, bb.spectrum, bb.flip, bb.clamped);
           
           return null;
         }
     }).appendTo(div);
  
  };

  

  /*
   * Load files to blend 
   */
  bb.loadBlendDataFromFile = function(file_input) {
		var numberFiles = file_input.files.length;
	  var files = file_input.files;
	  var reader;
	  var i, k;
		
		bb.blendData = new Array(numberFiles);
		bb.blendData.numberFiles = numberFiles;
   
 		for(i = 0; i < numberFiles; i++) {
		  
		  reader = new FileReader();
		  reader.file = files[i];
		  /*
		  * Using a closure to keep the value of i around to put the 
		  * data in an array in order. 
		  */
		  reader.onloadend = (function(file,num) {
			  return function(e) {
		   	  bb.blendData[num] = new Data(e.target.result);
					bb.blendData.alpha = 1.0/numberFiles;
					
					bb.blendData[num].fileName = file.name;
					for(k = 0; k < 2; k++) {
					  if(bb.blendData[k] == undefined) {						     
					    console.log("not done yet");
					    return;
					  }
					 
					}		 
					initRange(bb.blendData[0].values.min(),
					    bb.blendData[0].values.max(),
					    bb.blendData[0]);
					
					initRange(bb.blendData[1].values.min(),
					    bb.blendData[1].values.max(),
					    bb.blendData[1]);
					if(bb.afterLoadData !=null) {
					  bb.afterLoadData(null, null, bb.blendData, true); //multiple set to true
					}
					
					bb.blend($(".blend_slider").slider("value"));
				};
			})(reader.file,i);
		      
		  reader.readAsText(files[i]);
    }
    bb.setupBlendColors();
  }; 
  
  /*
   * Called when the range of colors is changed in the interface
   * Clamped signifies that the range should be clamped and values above or bellow the 
   * thresholds should have the color of the maximum/mimimum.
   */
  bb.rangeChange = function(min, max, clamped, opts) {
    var options = opts || {};
    var afterChange = options.afterChange;
    var data = bb.model_data.data;
    
    data.rangeMin = min;
    data.rangeMax = max;
    bb.updateColors(data, data.rangeMin, data.rangeMax, bb.spectrum, bb.flip, clamped);

    /*
     * This callback allows users to
     * do things like update ui elements
     * when brainbrowser change it internally
     *
     */

    if (afterChange) {
      afterChange();
    }

    if(bb.afterRangeChange != null) {
      bb.afterRangeChange(min, max);
    }
  };
  
  
  function loadFromUrl(url, opts, callback) {
    var options = opts || {};    
    var beforeLoad = options.beforeLoad;
    if (beforeLoad) beforeLoad();
    
    jQuery.ajax({ type: 'GET',
      url: url ,
      dataType: 'text',
      success: function(data) {
	      callback(data);
      },
      error: function(request,textStatus,e) {
	      alert("Failure in loadFromURL: " +  textStatus);
      },
      data: {},
      timeout: 100000
    });

  }

  function loadFromTextFile(file_input, opts, callback) {
    var files = file_input.files;
    if (files.length === 0) {
      return;
    }
    var options = opts || {};    
    var beforeLoad = options.beforeLoad;
    var reader = new FileReader();
    
    reader.file = files[0];
    
    if (beforeLoad) {
      beforeLoad();
    }
    
    reader.onloadend = function(e) {
      callback(e.target.result);
    };
    
    reader.readAsText(files[0]);
  }
  
  /*
   * If the data file is a mnc or nii, we need to send it to the server and 
   * have the server process it with volume_object_evaluate which projects the 
   * data on the surface file. 
  */
  
  function evaluate_volume(filename, onfinish) {
    var xhr;
    var form;
    var form_data;
    var text_data;
    
    
    xhr = new XMLHttpRequest();
    if(filename.match(/.*.mnc/)) {
      xhr.open('POST', '/minc/volume_object_evaluate', false);  
    }else {
      xhr.open('POST', '/nii/volume_object_evaluate', false);  
    }
    form_data = new FormData(document.getElementById('datafile-form'));
    xhr.send(form_data);
    var text_data = xhr.response;
    onfinish(text_data);
  }
  
  /**
   * Initialize the range for a file if it's not already set or 
   * fixed by the user. 
   * @param {Number} min minimum value of the range if the  range is not fixed
   * @param {Number} max maximum value of the range if the range is not fixed 
   * @param {Object} file Data file on which the range will be set
   */ 
  function initRange(min, max, file) {
    
    if (!file) {
     file = bb.model_data.data;
    }
    if (!file.fixRange) {
      file.rangeMin = min;
      file.rangeMax = max;
    }
  }
  
};
  