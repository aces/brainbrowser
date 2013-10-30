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
BrainBrowser.SurfaceViewer.modules.loader = function(viewer) {
  "use strict";
  
  var SurfaceViewer = BrainBrowser.SurfaceViewer;

  ////////////////////////////////////
  // Interface
  ////////////////////////////////////
  
  // Load a model from the given url.
  viewer.loadModelFromUrl = function(url, options) {
    options = options || {};
    var parts;
    var filename;
    var filetype = options.format || "MNIObject";
    loadFromUrl(url, options, function(data) {
      parts = url.split("/");
      //last part of url will be shape name
      filename = parts[parts.length-1];
      // Parse model info based on the given file type.
      SurfaceViewer.filetypes.parse(filetype, data, function(obj) {
        if (obj.objectClass !== "__FAIL__") {
          // Display model to the canvas after parsing.
          if (!cancelLoad(options)) viewer.displayObjectFile(obj, filename, options);
        } else if (options.onError !== undefined) {
          options.onError();
        }
      });
    });
  };

  //Load model from local file.
  viewer.loadModelFromFile = function(file_input, options) {
    options = options || {};
    var parts;
    var filename;
    var filetype = options.format || "MNIObject";
    
    loadFromTextFile(file_input, options, function(data) {
      parts = file_input.value.split("\\");
      //last part of path will be shape name
      filename = parts[parts.length-1];
      // Parse model info based on the given file type.
      SurfaceViewer.filetypes.parse(filetype, data, function(obj) {
        if (obj.objectClass !== "__FAIL__") {
          // Display model to the canvas after parsing.
          viewer.displayObjectFile(obj, filename, options);
        } else if (options.onError) {
          options.onError();
        }
      });
      
    });
  };
  
  // Load a colour map from the server.
  viewer.loadDataFromUrl = function(file_input, name, options) {
    options = options || {};
    
    loadFromUrl(file_input, options, function(text) {
      SurfaceViewer.data(text, function(data) {
        if (cancelLoad(options)) return;
        
        var max = options.max === undefined ? data.max : options.max;
        var min = options.min === undefined ? data.min : options.min;
        
        viewer.model_data.data = data;
        data.fileName = name;
        data.apply_to_shape = options.shape;
        initRange(min, max);
        
        viewer.triggerEvent("loaddata", data.rangeMin, data.rangeMax, data);
    
        viewer.updateColors(data, {
          min: data.rangeMin,
          max: data.rangeMax,
          spectrum: viewer.spectrum,
          flip: viewer.flip,
          clamped: viewer.clamped,
          afterUpdate: options.afterUpdate
        });
      });
    });
  };
  
  
  //Load text data from file and update colors
  viewer.loadDataFromFile = function(file_input, options) {
    options = options || {};
    var filename = file_input.files[0].name;
    var model_data = viewer.model_data;
    var positionArray = model_data.positionArray;
    var positionArrayLength = positionArray.length;
    var blend_index = options.blend_index || 0;
    var other_index = 1 - blend_index; // 1 or 0
    viewer.blendData = viewer.blendData || [];

    var onfinish = function(text) {
      SurfaceViewer.data(text, function(data) {
        var max = options.max === undefined ? data.max : options.max;
        var min = options.min === undefined ? data.min : options.min;
        
        data.fileName = filename;
        data.apply_to_shape = options.shape;
        data.applied = false;
        if (data.values.length < positionArrayLength/4) {
          alert("Not enough color points to cover vertices - " + data.values.length + " color points for " + positionArrayLength/3 + " vertices." );
          return -1;
        }
        model_data.data = data;
        viewer.blendData[blend_index] = data;
        initRange(min, max, data);
        if (viewer.blendData[other_index] && viewer.blendData[other_index].applied) {
          initRange(BrainBrowser.utils.min(viewer.blendData[other_index].values),
            BrainBrowser.utils.max(viewer.blendData[other_index].values),
            viewer.blendData[other_index]
          );
          viewer.triggerEvent("loaddata", null, null, viewer.blendData, true); //multiple set to true
      
          viewer.blend(0.5);
          viewer.triggerEvent("blenddata", data.rangeMin, data.rangeMax, data);
        } else {
          viewer.triggerEvent("loaddata", data.rangeMin, data.rangeMax, data);
          viewer.updateColors(data, {
            min: data.rangeMin,
            max: data.rangeMax,
            spectrum: viewer.spectrum,
            flip: viewer.flip,
            clamped: viewer.clamped,
            afterUpdate: options.afterUpdate
          });
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
  
  // Blend colours.
  viewer.blend = function(value) {
    var blendData = viewer.blendData;
    var blendDataLength = blendData.length;
    var i;
    
    blendData[0].alpha = value;
    blendData[1].alpha = 1.0 - value;
    for(i = 2; i < blendDataLength; i++) {
      blendData[i].alpha = 0.0;
    }
    

    viewer.updateColors(blendData, {
      spectrum: viewer.spectrum,
      flip: viewer.flip,
      clamped: viewer.clamped,
      blend: true
    });
  };

  //Load spectrum data from the server.
  viewer.loadSpectrumFromUrl  = function(url, options) {
    options = options || {};
    var spectrum;
    
    //get the spectrum of colors
    loadFromUrl(url, options, function (data) {
      spectrum = SurfaceViewer.spectrum(data);
      viewer.spectrum = spectrum;
        
      viewer.triggerEvent("loadspectrum", spectrum);
    
      if (viewer.model_data && viewer.model_data.data) {
        viewer.updateColors(viewer.model_data.data, {
          min: viewer.model_data.data.rangeMin,
          max: viewer.model_data.data.rangeMax,
          spectrum: viewer.spectrum,
          flip: viewer.flip,
          clamped: viewer.clamped
        });
      }
    });
  };

  

  // Load a color bar spectrum definition file.
  viewer.loadSpectrumFromFile = function(file_input){
    var spectrum;
    var model_data = viewer.model_data;
    
    loadFromTextFile(file_input, null, function(data) {
      spectrum = SurfaceViewer.spectrum(data);
      viewer.spectrum = spectrum;
      
      viewer.triggerEvent("loadspectrum", spectrum);

      if(model_data.data) {
        viewer.updateColors(model_data.data, {
          min: model_data.data.rangeMin,
          max: model_data.data.rangeMax,
          spectrum: viewer.spectrum,
          flip: viewer.flip,
          clamped: viewer.clamped
        });
      }
    });
  };
 
  // Load a series of data files to be viewed with a slider.
  viewer.loadSeriesDataFromFile = function(file_input) {
    var numberFiles = file_input.files.length;
    var files = file_input.files;
    var reader;
    var i;
    
    viewer.seriesData = new Array(numberFiles);
    viewer.seriesData.numberFiles = numberFiles;
    
    files.forEach(function(file, num) {
      reader = new FileReader();
      reader.file = file;
      /*
      * Using a closure to keep the value of i around to put the
      * data in an array in order.
      */
      reader.onloadend = function(e) {
        
        SurfaceViewer.data(e.target.result, function(data) {
          viewer.seriesData[num] = data;
          viewer.seriesData[num].fileName = file.name;
        });
      };
      
      reader.readAsText(files[i]);
    });
    viewer.setupSeries();
  };


  
  /*
   * Called when the range of colors is changed in the interface
   * Clamped signifies that the range should be clamped and values above or bellow the
   * thresholds should have the color of the maximum/mimimum.
   */
  viewer.rangeChange = function(min, max, clamped, options) {
    options = options || {};
    var afterChange = options.afterChange;
    var data = viewer.model_data.data;
    
    data.rangeMin = min;
    data.rangeMax = max;
    viewer.updateColors(data, {
      min: data.rangeMin,
      max: data.rangeMax,
      spectrum: viewer.spectrum,
      flip: viewer.flip,
      clamped: clamped,
      afterUpdate: options.afterUpdate
    });

    /*
     * This callback allows users to
     * do things like update ui elements
     * when brainbrowser change it internally
     *
     */

    if (afterChange) {
      afterChange();
    }

    viewer.triggerEvent("rangechange", min, max);
  };
  
  
  
  ////////////////////////////////////
  // PRIVATE FUNCTIONS
  ////////////////////////////////////
  
  // General function for loading data from a url.
  // Callback should interpret data as necessary.
  function loadFromUrl(url, options, callback) {
    options = options || {};
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
      error: function(request, textStatus) {
        alert("Failure in loadFromURL: " +  textStatus);
      },
      timeout: 100000
    });

  }
  
  // General function for loading data from a local file.
  // Callback should interpret data as necessary.
  function loadFromTextFile(file_input, options, callback) {
    var files = file_input.files;
    if (files.length === 0) {
      return;
    }
    options = options || {};
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
    text_data = xhr.response;
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
      file = viewer.model_data.data;
    }
    if (!file.fixRange) {
      file.rangeMin = min;
      file.rangeMax = max;
    }
  }
  
  // Allows the loading of data to be cancelled after the request is sent
  // or processing has begun (it must happen before the model begins to be
  // loaded to the canvas though).
  // Argument 'options' should either be a function that returns 'true' if the
  // loading should be cancelled or a hash containting the test function in
  // the property 'test' and optionally, a function to do cleanup after the
  // cancellation in the property 'cleanup'.
  function cancelLoad(options) {
    options = options || {};
    var cancel_opts = options.cancel || {};
    if (BrainBrowser.utils.isFunction(cancel_opts)) {
      cancel_opts = { test: cancel_opts };
    }
    
    var cancelTest = cancel_opts.test;
    var cancelCleanup = cancel_opts.cleanup;
    var cancelled = false;
    
    if (cancelTest && cancelTest()) {
      cancelled = true;
      if (cancelCleanup) cancelCleanup();
    }
    
    return cancelled;
  }
  
};
  
