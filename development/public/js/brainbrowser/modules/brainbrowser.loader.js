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


// BrainBrowser module for loading data from the server or from a 
// file.
BrainBrowser.modules.loader = function(bb) {
  
  // Load a model from the given url.
  bb.loadModelFromUrl = function(url, opts) {
    var options = opts || {};
    var parts;
    var filename;
    var filetype = options.format || "MNIObject";
    loadFromUrl(url, opts, function(data) {
        parts = url.split("/");
        //last part of url will be shape name
        filename = parts[parts.length-1];
        // Parse model info based on the given file type.
        BrainBrowser.filetypes.parse(filetype, data, function(obj) {
          if (obj.objectClass !== "__FAIL__") {
            // Display model to the canvas after parsing.
            if (!cancelLoad(options)) bb.displayObjectFile(obj, filename, options);
          } else if (options.onError !== undefined) {
            options.onError();
          }
        });
    });
  };

  //Load model from local file.
  bb.loadModelFromFile = function(file_input, opts) {
    var options = opts || {};
    var parts;
    var filename;
    var filetype = options.format || "MNIObject";
    
    loadFromTextFile(file_input, options, function(data) {
      parts = file_input.value.split("\\");
      //last part of path will be shape name
      filename = parts[parts.length-1];
      // Parse model info based on the given file type.
      BrainBrowser.filetypes.parse(filetype, data, function(obj) {
        if (obj.objectClass !== "__FAIL__") {
          // Display model to the canvas after parsing.
          bb.displayObjectFile(obj, filename, options);
        } else if (options.onError != undefined) {
          options.onError();
        }
      });
      
    });
  };
  
  // Load a colour map from the server.
  bb.loadDataFromUrl = function(file_input, name, opts) {
    var options = opts || {};

    loadFromUrl(file_input, options, function(text, file) {
      BrainBrowser.data(text, function(data) {
        if (cancelLoad(options)) return;
        
        var max = options.max === undefined ? data.max : options.max;
        var min = options.min === undefined ? data.min : options.min;
        
        bb.model_data.data = data;
        data.fileName = name;
        data.apply_to_shape = options.shape;
        initRange(min, max);
        
        if (bb.afterLoadData) {
          bb.afterLoadData(data.rangeMin, data.rangeMax, data);
        }

        bb.updateColors(data, data.rangeMin, data.rangeMax, bb.spectrum, bb.flip, bb.clamped, false, options);
      });
    });
   };

   
   //Load text data from file and update colors
   bb.loadDataFromFile = function(file_input, opts) {
     var options = opts || {};
     var filename = file_input.files[0].name;
     var model_data = bb.model_data;
     var positionArray = model_data.positionArray;
     var positionArrayLength = positionArray.length;
     var blend_index = options.blend_index || 0;
     var other_index = 1 - blend_index; // 1 or 0
     bb.blendData = bb.blendData || [];

     var onfinish = function(text) {
      BrainBrowser.data(text, function(data) {
        var max = options.max === undefined ? data.max : options.max;
        var min = options.min === undefined ? data.min : options.min;
        
        data.fileName = filename;
        data.apply_to_shape = options.shape;
        data.applied = false;
        if (data.values.length < positionArrayLength/4) {
          alert("Not enough color points to cover vertices - " + data.values.length + " color points for "+ positionArrayLength/3 + " vertices." );
          return -1;
        }
        model_data.data = data;
        bb.blendData[blend_index] = data;
        initRange(min, max, data);
        if (bb.blendData[other_index] && bb.blendData[other_index].applied) {          

          initRange(bb.blendData[other_index].values.min(),
            bb.blendData[other_index].values.max(),
            bb.blendData[other_index]);
          if(bb.afterLoadData != null) {
            bb.afterLoadData(null, null, bb.blendData, true); //multiple set to true
          }

          bb.blend(0.5);
          bb.setupBlendColors();
        } else {
          if(bb.afterLoadData) {
            bb.afterLoadData(data.rangeMin, data.rangeMax, data);
          }
          bb.updateColors(data, data.rangeMin, data.rangeMax, bb.spectrum, bb.flip, bb.clamped, false, options);
        }
        data.applied = true;
      });
     };

     if(filename.match(/.*.mnc|.*.nii/)) {
       evaluate_volume(filename, onfinish);
     } else {
       loadFromTextFile(file_input, null, onfinish);
     }
   };

  // Load files to blend 
  // TODO: NEED TO TEST THIS.
  //bb.loadBlendDataFromFile = function(file_input, alpha) {
  //  var numberFiles = file_input.files.length;
  //  var files = file_input.files;
  //  var reader;
  //  var i, k;
  //  var counter = 0;
  //  
  //  bb.blendData = new Array(numberFiles);
  //  bb.blendData.numberFiles = numberFiles;
  // 
  //  for(i = 0; i < numberFiles; i++) {
  //    
  //    reader = new FileReader();
  //    reader.file = files[i];
  //    /*
  //    * Using a closure to keep the value of i around to put the 
  //    * data in an array in order. 
  //    */
  //    reader.onloadend = (function(file, num) {
  //      return function(e) {
  //        BrainBrowser.data(e.target.result, function(data) {
  //          bb.blendData[num] = data; 
  //          bb.blendData.alpha = 1.0/numberFiles;
  //
  //          bb.blendData[num].fileName = file.name;
  //          counter++;
  //          
  //          if (counter < numberFiles) {
  //            console.log("Not done yet.");
  //            return;
  //          }
  //          console.log("Finishing");
  //          //for(k = 0; k < 2; k++) {
  //          //  if(bb.blendData[k] == undefined) {                 
  //          //    console.log("not done yet");
  //          //    return;
  //          //  }
  //
  //          //}    
  //          initRange(bb.blendData[0].values.min(),
  //              bb.blendData[0].values.max(),
  //              bb.blendData[0]);
  //
  //          initRange(bb.blendData[1].values.min(),
  //              bb.blendData[1].values.max(),
  //              bb.blendData[1]);
  //          if(bb.afterLoadData != null) {
  //            bb.afterLoadData(null, null, bb.blendData, true); //multiple set to true
  //          }
  //
  //          bb.blend(alpha);
  //          bb.setupBlendColors();
  //        });
  //      };
  //    })(reader.file, i);
  //        
  //    reader.readAsText(files[i]);
  //  }
  //}; 
  
  // Blend colours.
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

  //Load spectrum data from the server.
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
   
     if (bb.model_data && bb.model_data.data) {
       bb.updateColors(bb.model_data.data, bb.model_data.data.rangeMin, bb.model_data.data.rangeMax, bb.spectrum, bb.flip, bb.clamped);
     }
   });
  };

  

  // Load a color bar spectrum definition file.
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
 
  // Load a series of data files to be viewed with a slider. 
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
          
          BrainBrowser.data(e.target.result, function(data) {
            bb.seriesData[num] = data;
            bb.seriesData[num].fileName = file.name; 
          });  
        };
      })(reader.file, i);
      
      reader.readAsText(files[i]);
    }
    bb.setupSeries();
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
    bb.updateColors(data, data.rangeMin, data.rangeMax, bb.spectrum, bb.flip, clamped, false, options);

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
  
  // General function for loading data from a url.
  // Callback should interpret data as necessary.
  function loadFromUrl(url, opts, callback) {
    var options = opts || {};    
    var beforeLoad = options.beforeLoad;
    
    if (beforeLoad) beforeLoad();
    
    jQuery.ajax({ type: 'GET',
      url: url ,
      dataType: 'text',
      success: function(data) {
        if (!cancelLoad(options)) {
          callback(data);
        }    
      },
      error: function(request,textStatus,e) {
        alert("Failure in loadFromURL: " +  textStatus);
      },
      timeout: 100000
    });

  }
  
  // General function for loading data from a local file.
  // Callback should interpret data as necessary.
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
  
  // Allows the loading of data to be cancelled after the request is sent
  // or processing has begun (it must happen before the model begins to be
  // loaded to the canvas though). 
  // Argument 'opts' should either be a function that returns 'true' if the
  // loading should be cancelled or a hash containting the test function in 
  // the property 'test' and optionally, a function to do cleanup after the 
  // cancellation in the property 'cleanup'.
  function cancelLoad(opts) {
    var options = opts || {};
    var cancel_opts = options.cancel || {};
    if (BrainBrowser.utils.isFunction(cancel_opts)) {
      cancel_opts = { test: cancel_opts };
    } 
    
    var cancelTest = cancel_opts.test
    var cancelCleanup = cancel_opts.cleanup;
    var cancelled = false;
    
    if (cancelTest && cancelTest()) {
      cancelled = true;
      if (cancelCleanup) cancelCleanup();
    } 
    
    return cancelled;
  }
  
};
  
