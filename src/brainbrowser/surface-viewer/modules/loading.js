/*
* BrainBrowser: Web-based Neurological Visualization Tools
* (https://brainbrowser.cbrain.mcgill.ca)
*
* Copyright (C) 2011
* The Royal Institution for the Advancement of Learning
* McGill University
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
* @author: Tarek Sherif
* @author: Nicolas Kassis
*/

BrainBrowser.SurfaceViewer.modules.loading = function(viewer) {
  "use strict";
  
  var SurfaceViewer = BrainBrowser.SurfaceViewer;

  ////////////////////////////////////
  // Interface
  ////////////////////////////////////
  
  /**
  * @doc function
  * @name viewer.loading:loadModelFromURL
  * @param {string} url URL of the model file to load.
  * @param {object} options Options for the color update, which include the following:
  *
  * * **format** The format of input file. Should be one of the filetypes described in
  *   BrainBrowser.config.
  * * **render_depth** Force rendering at the given depth (can help with transparency).
  * * **parse** Parsing options to pass to the worker that will be used to parse the
  *   input file.
  * * **before** A callback to be called before loading starts.
  * * **error** A callback function that will be called if there's a parsing error.
  *
  * @description
  * Load and parse a model from the specified URL.
  */
  viewer.loadModelFromURL = function(url, options) {
    loadFromURL(url, options, loadModel);
  };

  /**
  * @doc function
  * @name viewer.loading:loadModelFromFile
  * @param {object} file_input Object representing the local file to load.
  * @param {object} options Options for the color update, which include the following:
  *
  * * **format** The format of input file. Should be one of the filetypes described in
  *   BrainBrowser.config.
  * * **render_depth** Force rendering at the given depth (can help with transparency).
  * * **parse** Parsing options to pass to the worker that will be used to parse the
  *   input file.
  * * **before** A callback to be called before loading starts.
  *
  * @description
  * Load and parse a model from a local file.
  */
  viewer.loadModelFromFile = function(file_input, options) {
    loadFromFile(file_input, options, loadModel);
  };
  
  /**
  * @doc function
  * @name viewer.loading:loadIntensityDataFromURL
  * @param {object} file_input Object representing the local file to load.
  * @param {object} options Options for the color update, which include the following:
  *
  * * **min** Minimum value of the intensity.
  * * **max** Maximum value of the intensity.
  * * **shape** The name of a specific shape to which this map will be applied.
  * * **blend_index** Index of this map in the array of blended color data (0 or 1).
  * * **before** A callback to be called before loading starts.
  * * **complete** Callback function to call when the color update is done.
  *
  * @description
  * Load a color map from the specified URL.
  */
  viewer.loadIntensityDataFromURL = function(url, options) {
    loadFromURL(url, options, loadIntensityData);
  };
  
  
  /**
  * @doc function
  * @name viewer.loading:loadIntensityDataFromFile
  * @param {object} file_input Object representing the local file to load.
  * @param {object} options Options for the color update, which include the following:
  *
  * * **min** Minimum value of the intensity.
  * * **max** Maximum value of the intensity.
  * * **shape** The name of a specific shape to which this map will be applied.
  * * **blend_index** Index of this map in the array of blended color data (0 or 1).
  * * **before** A callback to be called before loading starts.
  * * **complete** Callback function to call when the color update is done.
  *
  * @description
  * Load a color map from a local file.
  */
  viewer.loadIntensityDataFromFile = function(file_input, options) {
    var filename = file_input.files[0].name;

    if(filename.match(/.*.mnc|.*.nii/)) {
      evaluate_volume(filename, loadIntensityData);
    } else {
      loadFromFile(file_input, options, loadIntensityData);
    }
  };

  /**
  * @doc function
  * @name viewer.loading:loadColorMapFromURL
  * @param {string} url URL of the model file to load.
  * @param {object} options Options for the color map loading, which include the following:
  *
  * * **before** A callback to be called before loading starts.
  *
  * @description
  * Load and parse color map data from the specified URL.
  */
  viewer.loadColorMapFromURL  = function(url, options) {
    loadFromURL(url, options, loadColorMap);
  };

  

  /**
  * @doc function
  * @name viewer.loading:loadColorMapFromFile
  * @param {object} file_input Object representing the local file to load.
  * @param {object} options Options for the color map loading, which include the following:
  *
  * * **before** A callback to be called before loading starts.
  *
  * @description
  * Load and parse color map data from a local file.
  */
  viewer.loadColorMapFromFile = function(file_input, options){
    loadFromFile(file_input, options, loadColorMap);
  };
  
  
  ////////////////////////////////////
  // PRIVATE FUNCTIONS
  ////////////////////////////////////
  
  // General function for loading data from a url.
  // Callback should interpret data as necessary.
  function loadFromURL(url, options, callback) {
    options = options || {};
    var before = options.before;
    var request = new XMLHttpRequest();
    var status;
    var parts = url.split("/");
    var filename = parts[parts.length-1];

    if (before) {
      before();
      delete options.before;
    }

    request.open("GET", url);
    request.onreadystatechange = function() {
      if (request.readyState === 4){
        status = request.status;

        // Based on jQuery's "success" codes.
        if(status >= 200 && status < 300 || status === 304) {
          if (!cancelLoad(options)) {
            callback(request.response, filename, options);
          }
        } else {
          var error_message = "error loading URL: " + url + "\n" +
            "HTTP Response: " + request.status + "\n" +
            "HTTP Status: " + request.statusText + "\n" +
            "Response was: \n" + request.response;
          viewer.triggerEvent("error", error_message);
          throw new Error(error_message);
        }
      }
    };
    request.send();

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
    var parts = file_input.value.split("\\");
    var filename = parts[parts.length-1];
    
    reader.file = files[0];
    
    if (before) {
      before();
      delete options.before;
    }
    
    reader.onloadend = function(e) {
      callback(e.target.result, filename, options);
    };
    
    reader.readAsText(files[0]);
  }

  function loadModel(data, filename, options) {
    options = options || {};
    var type = options.format || "mniobj";
    var parse_options = options.parse || {};
    
    // Parse model info based on the given file type.
    parseModel(data, type, parse_options, function(obj) {
      if (!cancelLoad(options)) {
        displayModel(obj, filename, options);
      }
    });
  }

  function loadIntensityData(text, filename, options) {
    options = options || {};
    var name = options.name || filename;
    var type = options.format || "mniobj";
    var model_data = viewer.model_data;
    var blend_index = options.blend_index || 0;
    var other_index = 1 - blend_index; // 1 or 0
    
    var old_range = {};

    if (viewer.getAttribute("fix_color_range") && model_data.intensity_data) {
      old_range = {
        min: model_data.intensity_data.range_min,
        max: model_data.intensity_data.range_max
      };
    }


    viewer.blendData = viewer.blendData || [];

    SurfaceViewer.parseIntensityData(text, type, function(data) {
      var min;
      var max;

      if (viewer.getAttribute("fix_color_range") &&
          old_range.min !== undefined && old_range.max !== undefined) {
        min = old_range.min;
        max = old_range.max;
      } else {
        min = options.min === undefined ? data.min : options.min;
        max = options.max === undefined ? data.max : options.max;
      }
      
      data.filename = name;
      data.apply_to_shape = options.shape;
      data.applied = false;
      model_data.intensity_data = data;
      viewer.blendData[blend_index] = data;
      data.range_min = min;
      data.range_max = max;
      
      if (viewer.blendData[other_index] && viewer.blendData[other_index].applied) {
        viewer.blendData[other_index].range_min = BrainBrowser.utils.min(viewer.blendData[other_index].values);
        viewer.blendData[other_index].range_max = BrainBrowser.utils.max(viewer.blendData[other_index].values);

        viewer.blend(0.5);

        viewer.triggerEvent("loadintensitydata", viewer.blendData);
        viewer.triggerEvent("blendcolormaps", data.range_min, data.range_max, data);
      } else {
        viewer.triggerEvent("loadintensitydata", data);
        viewer.updateColors(data, {
          complete: options.complete
        });
      }
      
      data.applied = true;
    });
  }
  
  function loadColorMap(data) {
    var model_data = viewer.model_data;
    viewer.color_map = BrainBrowser.createColorMap(data);
    
    viewer.triggerEvent("loadcolormap", viewer.color_map);

    if (model_data && model_data.intensity_data) {
      viewer.updateColors(model_data.intensity_data);
    }
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
  // PARSE LOADED MODELS
  ///////////////////////////////////////////

  function parseModel(data, type, options, callback) {
    var error_message;

    var worker_url_type = type + "_model";

    if (!BrainBrowser.utils.checkConfig("surface_viewer.worker_dir")) {
      throw new Error(
        "error in SurfaceViewer configuration.\n" +
        "BrainBrowser.config.surface_viewer.worker_dir not defined."
      );
    }

    if (!SurfaceViewer.worker_urls[worker_url_type]) {
      error_message = "error in SurfaceViewer configuration.\n" +
        "Model worker URL for " + type + " not defined.";

      viewer.triggerEvent("error", error_message);
      throw new Error(error_message);
    }
    
    var parse_worker = new Worker(SurfaceViewer.worker_urls[worker_url_type]);
    var deindex_worker;
    
    parse_worker.addEventListener("message", function(e) {
      var result = e.data;

      if (result.error){
        error_message = "error parsing model.\n" +
          result.error_message + "\n" +
          "File type: " + type + "\n" +
          "Options: " + JSON.stringify(options);
        viewer.triggerEvent("error", error_message);
        throw new Error(error_message);
      } else if (callback) {
        deindex_worker = new Worker(SurfaceViewer.worker_urls.deindex);

        deindex_worker.addEventListener("message", function(e) {
          callback(e.data);
        });

        deindex_worker.postMessage(result);
      }
      
      parse_worker.terminate();
    });
    
    parse_worker.postMessage({
      data: data,
      options: options
    });
        
  }

  ///////////////////////////////////////////
  // DISPLAY OF LOADED MODELS
  ///////////////////////////////////////////

  // Creates a object based on the description in **model_data** and
  // displays in on the viewer.
  function displayModel(model_data, filename, options) {
    options = options || {};
    var render_depth = options.render_depth;
    var complete = options.complete;

    addObject(model_data, filename, render_depth);

    viewer.triggerEvent("displaymodel", viewer.model);

    if (complete) complete();
  }

  // Add a polygon object to the scene.
  function addObject(model_data, filename, render_depth){
    var model = viewer.model;
    var shape, shape_data;
    var i, count;
    var shapes = model_data.shapes;

    var is_line = model_data.type === "line";

    viewer.model_data = model_data;
    if (shapes){
      for (i = 0, count = shapes.length; i < count; i++){
        shape_data = model_data.shapes[i];
        shape = createObject(shape_data, is_line);
        shape.name = shape_data.name || filename;
        
        shape.geometry.original_data = {
          vertices: model_data.vertices,
          indices: shape_data.indices,
          normals: model_data.normals,
          colors: model_data.colors
        };

        if (render_depth) {
          shape.renderDepth = render_depth;
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
  
