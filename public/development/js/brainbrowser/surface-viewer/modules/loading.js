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

BrainBrowser.SurfaceViewer.modules.loading = function(viewer) {
  "use strict";
  
  var SurfaceViewer = BrainBrowser.SurfaceViewer;

  ////////////////////////////////////
  // Interface
  ////////////////////////////////////
  
  /**
  * @doc function
  * @name viewer.loading:loadModelFromUrl
  * @param {string} url URL of the model file to load.
  * @param {object} options Options for the color update, which include the following: 
  * 
  * * **format** The format of input file. Should be one of the filetypes described in 
  *   BrainBrowser.config.
  * * **parse** Parsing options to pass to the worker that will be used to parse the 
  *   input file.
  * * **before** A callback to be called before loading starts.
  * * **error** A callback function that will be called if there's a parsing error.
  *
  * @description 
  * Load and parse a model from the specified URL.
  */
  viewer.loadModelFromUrl = function(url, options) {
    options = options || {};
    var parts;
    var filename;
    var filetype = options.format || "MNIObject";
    var parse_options = options.parse || {};

    loadFromUrl(url, options, function(data) {
      parts = url.split("/");
      //last part of url will be shape name
      filename = parts[parts.length-1];
      // Parse model info based on the given file type.
      SurfaceViewer.filetypes.parse(filetype, data, parse_options, function(obj) {
        if (obj.objectClass !== "__FAIL__") {
          // Display model to the canvas after parsing.
          if (!cancelLoad(options)) displayModel(obj, filename, options);
        } else if (options.error) {
          options.error();
        }
      });
    });
  };

  /**
  * @doc function
  * @name viewer.loading:loadModelFromFile
  * @param {object} file_input Object representing the local file to load.
  * @param {object} options Options for the color update, which include the following: 
  * 
  * * **format** The format of input file. Should be one of the filetypes described in 
  *   BrainBrowser.config.
  * * **parse** Parsing options to pass to the worker that will be used to parse the 
  *   input file.
  * * **before** A callback to be called before loading starts.
  * * **error** A callback function that will be called if there's a parsing error.
  *
  * @description 
  * Load and parse a model from a local file.
  */
  viewer.loadModelFromFile = function(file_input, options) {
    options = options || {};
    var parts;
    var filename;
    var filetype = options.format || "MNIObject";
    var parse_options = options.parse || {};
    
    loadFromFile(file_input, options, function(data) {
      parts = file_input.value.split("\\");
      //last part of path will be shape name
      filename = parts[parts.length-1];
      // Parse model info based on the given file type.
      SurfaceViewer.filetypes.parse(filetype, data, parse_options, function(obj) {
        if (obj.objectClass !== "__FAIL__") {
          // Display model to the canvas after parsing.
          displayModel(obj, filename, options);
        } else if (options.error) {
          options.error();
        }
      });
      
    });
  };
  
  /**
  * @doc function
  * @name viewer.loading:loadColorFromUrl
  * @param {string} url URL of the model file to load.
  * @param {object} options Options for the color update, which include the following: 
  * 
  * * **min** Minimum value of the color samples.
  * * **max** Maximum value of the color samples.
  * * **shape** The name of a specific shape to which this map will be applied.
  * * **before** A callback to be called before loading starts.
  * * **complete** Callback function to call when the color update is done.
  *
  * @description 
  * Load a color map from the specified URL.
  */
  viewer.loadColorFromUrl = function(url, name, options) {
    options = options || {};
    
    loadFromUrl(url, options, function(text) {
      SurfaceViewer.data(text, function(data) {
        if (cancelLoad(options)) return;
        
        var max = options.max === undefined ? data.max : options.max;
        var min = options.min === undefined ? data.min : options.min;
        
        viewer.model_data.data = data;
        data.fileName = name;
        data.apply_to_shape = options.shape;
        initRange(min, max);
        
        viewer.triggerEvent("loadcolor", data);
    
        viewer.updateColors(data, {
          min: data.rangeMin,
          max: data.rangeMax,
          spectrum: viewer.spectrum,
          flip: viewer.flip,
          clamped: viewer.clamped,
          complete: options.complete
        });
      });
    });
  };
  
  
  /**
  * @doc function
  * @name viewer.loading:loadColorFromFile
  * @param {object} file_input Object representing the local file to load.
  * @param {object} options Options for the color update, which include the following: 
  * 
  * * **min** Minimum value of the color samples.
  * * **max** Maximum value of the color samples.
  * * **shape** The name of a specific shape to which this map will be applied.
  * * **blend_index** Index of this map in the array of blended color data (0 or 1).
  * * **before** A callback to be called before loading starts.
  * * **complete** Callback function to call when the color update is done.
  *
  * @description 
  * Load a color map from a local file.
  */
  viewer.loadColorFromFile = function(file_input, options) {
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
        if (data.values.length < positionArrayLength / 4) {
          alert("Not enough color points to cover vertices - " + data.values.length + " color points for " + positionArrayLength / 3 + " vertices." );
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
          viewer.triggerEvent("loadcolor", viewer.blendData);
      
          viewer.blend(0.5);
          viewer.triggerEvent("blendcolormaps", data.rangeMin, data.rangeMax, data);
        } else {
          viewer.triggerEvent("loadcolor", data);
          viewer.updateColors(data, {
            min: data.rangeMin,
            max: data.rangeMax,
            spectrum: viewer.spectrum,
            flip: viewer.flip,
            clamped: viewer.clamped,
            complete: options.complete
          });
        }
        data.applied = true;
      });
    };

    if(filename.match(/.*.mnc|.*.nii/)) {
      evaluate_volume(filename, onfinish);
    } else {
      loadFromFile(file_input, null, onfinish);
    }
  };

  /**
  * @doc function
  * @name viewer.loading:loadSpectrumFromUrl
  * @param {string} url URL of the model file to load.
  * @param {object} options Options for the spectrum loading, which include the following: 
  * 
  * * **before** A callback to be called before loading starts.
  *
  * @description 
  * Load and parse spectrum data from the specified URL.
  */
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

  

  /**
  * @doc function
  * @name viewer.loading:loadSpectrumFromUrl
  * @param {object} file_input Object representing the local file to load.
  * @param {object} options Options for the spectrum loading, which include the following: 
  * 
  * * **before** A callback to be called before loading starts.
  *
  * @description 
  * Load and parse spectrum data from a local file.
  */
  viewer.loadSpectrumFromFile = function(file_input){
    var spectrum;
    var model_data = viewer.model_data;
    
    loadFromFile(file_input, null, function(data) {
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
  
  
  ////////////////////////////////////
  // PRIVATE FUNCTIONS
  ////////////////////////////////////
  
  // General function for loading data from a url.
  // Callback should interpret data as necessary.
  function loadFromUrl(url, options, callback) {
    options = options || {};
    var before = options.before;

    if (before) {
      before();
      delete options.before;
    }

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
  function loadFromFile(file_input, options, callback) {
    var files = file_input.files;
    
    if (files.length === 0) {
      return;
    }

    options = options || {};
    var before = options.before;
    var reader = new FileReader();
    
    reader.file = files[0];
    
    if (before) {
      before();
      delete options.before;
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


  ///////////////////////////////////////////
  // DISPLAY OF LOADED MODELS
  ///////////////////////////////////////////

  // Creates a object based on the description in **model_data** and 
  // displays in on the viewer.
  function displayModel(model_data, filename, options) {
    options = options || {};
    var renderDepth = options.renderDepth;
    var complete = options.complete;

    addObject(model_data, filename, renderDepth);

    viewer.triggerEvent("displaymodel", viewer.model);

    if (complete) complete();
  }

  // Add a polygon object to the scene.
  function addObject(model_data, filename, renderDepth){
    var model = viewer.model;
    var shape, shape_data;
    var i, count;
    var shapes = model_data.shapes;

    var is_line = model_data.objectClass === "L";

    viewer.model_data = model_data;
    if (shapes){
      for (i = 0, count = shapes.length; i < count; i++){
        shape_data = model_data.shapes[i];
        shape = createObject(shape_data, is_line);
        shape.name = shape_data.name || filename;
        
        shape.geometry.original_data = {
          vertices: model_data.positionArray,
          indices: shape_data.indexArray,
          normals: model_data.normalArray,
          colors: model_data.colorArray
        };

        if (renderDepth) {
          shape.renderDepth = renderDepth;
        }
        model.add(shape);
      }

      if (model_data.split) {
        model.children[0].name = "left";
        model.children[0].model_num = 0;
        model.children[1].name = "right";
        model.children[1].model_num = 1;
      }
    }
  }

  function createObject(shape_data, is_line) {
    var unindexed = shape_data.unindexed;
    var wireframe = shape_data.wireframe;
    var centroid = shape_data.centroid;

    var position = unindexed.position;
    var normal = unindexed.normal || [];
    var color = unindexed.color || [];


    var geometry = new THREE.BufferGeometry();
    var material, shape;

    geometry.dynamic = true;

    geometry.attributes.position = {
      itemSize: 3,
      array: new Float32Array(position),
      numItems: position.length
    };


    if (normal.length > 0) {
      geometry.attributes.normal = {
        itemSize: 3,
        array: new Float32Array(normal),
      };
    } else {
      geometry.computeVertexNormals();
    }

    if(color.length > 0) {
      geometry.attributes.color = {
        itemSize: 4,
        array: new Float32Array(color),
      };
    }

    if (is_line) {
      material = new THREE.LineBasicMaterial({vertexColors: THREE.VertexColors});
      shape = new THREE.Line(geometry, material, THREE.LinePieces);
    } else {
      material = new THREE.MeshPhongMaterial({color: 0xFFFFFF, ambient: 0x0A0A0A, specular: 0xFFFFFF, shininess: 100, vertexColors: THREE.VertexColors});
      shape = new THREE.Mesh(geometry, material);
      shape.add(createWireframe(shape, wireframe));
    }

    shape.centroid = centroid;
    shape.position.set(centroid.x, centroid.y, centroid.z);
  
    return shape;
  }

  function createWireframe(object, wireframe_data) {
    var wire_geometry = new THREE.BufferGeometry();
    var material, wireframe;

    wire_geometry.attributes.position = {
      itemSize: 3,
      array: wireframe_data.position,
      numItems: wireframe_data.position.length
    };

    wire_geometry.attributes.color = {
      itemSize: 4,
      array: wireframe_data.color,
    };

    wire_geometry.attributes.color.needsUpdate = true;

    material = new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors });
    wireframe = new THREE.Line(wire_geometry, material, THREE.LinePieces);

    wireframe.name = "__wireframe__";
    wireframe.visible = false;
    object.wireframe_active = false;

    return wireframe;
  }
  
};
  
