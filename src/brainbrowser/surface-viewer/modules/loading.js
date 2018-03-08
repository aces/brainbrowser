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
* Author: Tarek Sherif <tsherif@gmail.com> (http://tareksherif.ca/)
* Author: Nicolas Kassis
*/

BrainBrowser.SurfaceViewer.modules.loading = function(viewer) {
  "use strict";

  var SurfaceViewer = BrainBrowser.SurfaceViewer;
  var THREE = SurfaceViewer.THREE;
  var loader = BrainBrowser.loader;

  var model_data_store = {};

  ////////////////////////////////////
  // Interface
  ////////////////////////////////////

  viewer.model_data = {
    /**
    * @doc function
    * @name viewer.model_data:add
    * @param {string} name Identifier for the model description to
    * retrieve.
    *
    * @param {object} data The model data.
    *
    * @description
    * Add a new model or intensity data description.
    *
    * ```js
    * viewer.model_data.add("brain.obj", data);
    * ```
    */
    add: function(name, data) {
      model_data_store[name] = data;
      data.intensity_data = [];
    },

    /**
    * @doc function
    * @name viewer.model_data:get
    * @param {string} name (Optional) Identifier for the model description to
    * retrieve.
    *
    * @returns {object} Object containing a model data.
    *
    * @description
    * Retrieve the data describing a loaded model.
    *
    * ```js
    * viewer.model_data.get("brain.obj");
    * ```
    * Note that model_data **get()** methods will return the first loaded model
    * if no argument is given, and this can act as a convenient shorthand if only
    * one model is loaded.
    * ```js
    * viewer.model_data.get();
    * ```
    */
    get: function(name) {
      name = name || Object.keys(model_data_store)[0];

      return model_data_store[name] || null;
    },

    /**
    * @doc function
    * @name viewer.model_data:getDefaultIntensityData
    * @param {string} name (Optional) Identifier for the model description to
    * retrieve.
    *
    * @description
    * Return the first loaded intensity data for the named model. If
    * no model name is given, will return the first available intensity
    * data set on any loaded model.
    *
    * ```js
    * viewer.model_data.getDefaultIntensityData(model_name);
    * ```
    */
    getDefaultIntensityData: function(name) {
      var model_data;
      var intensity_data;
      var i, count;

      if (name) {
        model_data = this.get(name);
        intensity_data = model_data ? model_data.intensity_data[0] : null;
      } else {
        model_data = Object.keys(model_data_store).map(function(name) { return model_data_store[name]; });

        for (i = 0, count = model_data.length; i < count; i++) {
          intensity_data = model_data[i].intensity_data[0];
          if (intensity_data) {
            break;
          }
        }
      }

      return intensity_data || null;
    },

    /**
    * @doc function
    * @name viewer.model_data:count
    *
    * @description
    * Return the number of models loaded.
    *
    * ```js
    * viewer.model_data.count();
    * ```
    */
    count: function() {
      return Object.keys(model_data_store).length;
    },

    /**
    * @doc function
    * @name viewer.model_data:clear
    *
    * @description
    * Clear stored model data.
    *
    * ```js
    * viewer.model_data.clear();
    * ```
    */
    clear: function() {
      model_data_store = {};
    },

    /**
    * @doc function
    * @name viewer.model_data:forEach
    * @param {function} callback Callback function to which the
    * model descriptions will be passed.
    *
    * @description
    * Iterate over a set of model data and pass them to the provided callback
    * function. The function will receive the model description and the model name
    * as arguments.
    * ```js
    * viewer.model_data.forEach(function(model_data, model_name) {
    *   console.log(model_name, model_data.vertices.length);
    * });
    * ```
    */
    forEach: function(callback) {
      Object.keys(model_data_store).forEach(function(name) {
        callback(model_data_store[name], name);
      });
    }
  };

  /**
  * @doc function
  * @name viewer.loading:loadModelFromURL
  * @param {string} url URL of the model file to load.
  * @param {object} options Options for the color update, which include the following:
  *
  * * **format** The format of input file. Should be configured using
  *   BrainBrowser.config.
  * * **render_depth** Force rendering at the given depth (can help with transparency).
  * * **pick_ignore** Ignore this object when picking.
  * * **recenter** Shift object vertex positions to be relative to the centroid (can
  *   help with transparency).
  * * **parse** Parsing options to pass to the worker that will be used to parse the
  *   input file.
  *
  * @description
  * Load and parse a model from the specified URL.
  * ```js
  * viewer.loadModelFromURL(url, {
  *   format: "mniobj"
  * });
  * ```
  */
  viewer.loadModelFromURL = function(url, options) {
    options = checkBinary("model_types", options);

    loader.loadFromURL(url, loadModel, options);
  };

  /**
  * @doc function
  * @name viewer.loading:loadModelFromFile
  * @param {DOMElement} file_input File input element representing the local file to load.
  * @param {object} options Options for the color update, which include the following:
  *
  * * **format** The format of input file. Should be configured using
  *   BrainBrowser.config.
  * * **render_depth** Force rendering at the given depth (can help with transparency).
  * * **pick_ignore** Ignore this object when picking.
  * * **recenter** Shift object vertex positions to be relative to the centroid (can
  *   help with transparency).
  * * **parse** Parsing options to pass to the worker that will be used to parse the
  *   input file.
  *
  * @description
  * Load and parse a model from a local file.
  * ```js
  * viewer.loadModelFromFile(file_input, {
  *   format: "mniobj"
  * });
  * ```
  */
  viewer.loadModelFromFile = function(file_input, options) {
    options = checkBinary("model_types", options);

    loader.loadFromFile(file_input, loadModel, options);
  };

    /**
  * @doc function
  * @name viewer.loading:loadModelFromLocal
  * @param {object} model_data An object containing model data
  * @param {string} name A name to give to this model
  * @param {object} options Options for the color update, which include the following:
  *
  * * **render_depth** Force rendering at the given depth (can help with transparency).
  * * **pick_ignore** Ignore this object when picking.
  * * **recenter** Shift object vertex positions to be relative to the centroid (can
  *   help with transparency).
  *
  * @description
  * Display a pre-loaded and parsed model from a local javascript object
  * ```js
  * viewer.loadModelFromLocal(model_data, "local_model");
  * ```
  */
  viewer.loadModelFromLocal = function(model_data, name, options) {
    options            = options || {};
    if(! options.hasOwnProperty("dont_parse")){
      options.dont_parse = true;
    }
    
    loadModel(model_data, name, options);
  };
  

  /**
  * @doc function
  * @name viewer.loading:loadIntensityDataFromURL
  * @param {string} url URL of the intensity data file to load.
  * @param {object} options Options for the color update, which include the following:
  *
  * * **format** The format of input file. Should be configured using
  *   BrainBrowser.config.
  * * **min** Minimum value of the intensity.
  * * **max** Maximum value of the intensity.
  * * **model\_name** The name of a specific model to which this map will be applied.
  * * **shape\_name** The name of a specific shape to which this map will be applied.
  * * **name* Name to give the intensity data.
  * * **blend** Blend this data map with previously loaded data.
  * * **complete** Callback function to call when the color update is done.
  *
  * @description
  * Load a color map from the specified URL.
  * ```js
  * viewer.loadIntensityDataFromURL(url, {
  *   min: 1.0,
  *   max: 7.0,
  *   model_name: "brain.obj"
  * });
  * ```
  */
  viewer.loadIntensityDataFromURL = function(url, options) {
    options = checkBinary("intensity_data_types", options);

    loader.loadFromURL(url, loadIntensityData, options);
  };


  /**
  * @doc function
  * @name viewer.loading:loadIntensityDataFromFile
  * @param {DOMElement} file_input File input element representing the local file to load.
  * @param {object} options Options for the color update, which include the following:
  *
  * * **format** The format of input file. Should be configured using
  *   BrainBrowser.config.
  * * **min** Minimum value of the intensity.
  * * **max** Maximum value of the intensity.
  * * **model\_name** The name of a specific model to which this map will be applied.
  * * **shape\_name** The name of a specific shape to which this map will be applied.
  * * **name* Name to give the intensity data.
  * * **blend** Blend this data map with previously loaded data.
  * * **complete** Callback function to call when the color update is done.
  *
  * @description
  * Load a color map from a local file.
  * ```js
  * viewer.loadIntensityDataFromFile(file_input, {
  *   min: 1.0,
  *   max: 7.0,
  *   model_name: "brain.obj"
  * });
  * ```
  */
  viewer.loadIntensityDataFromFile = function(file_input, options) {
    options = checkBinary("intensity_data_types", options);

    loader.loadFromFile(file_input, loadIntensityData, options);
  };

  /**
  * @doc function
  * @name viewer.loading:loadIntensityDataFromFileLocal
  * @param {array} data An array containing the intensities, one per vertex in the
  * @param {string} name A string specifying a name for the intensity data
    active model (or model specified in the **BrainBrowser.config** **name**
  * @param {object} options Options for the color update, which include the following:
  *
  * * **format** The format of input file. Should be configured using
  *   BrainBrowser.config.
  * * **min** Minimum value of the intensity.
  * * **max** Maximum value of the intensity.
  * * **model\_name** The name of a specific model to which this map will be applied.
  * * **shape\_name** The name of a specific shape to which this map will be applied.
  * * **name* Name to give the intensity data.
  * * **blend** Blend this data map with previously loaded data.
  * * **complete** Callback function to call when the color update is done.
  *
  * @description
  * Load a color map from a local file.
  * ```js
  * viewer.loadIntensityDataFromLocal(object, {
  *   min: 1.0,
  *   max: 7.0,
  *   model_name: "brain.obj"
  * });
  * ```
  */
  viewer.loadIntensityDataFromLocal = function(data, name, options) {
    options            = options || {};
    if(! options.hasOwnProperty("dont_parse")){
      options.dont_parse = true;
    }

    loadIntensityData(data, name, options);
  };


  /**
  * @doc function
  * @name viewer.loading:loadColorMapFromURL
  * @param {string} url URL of the color map file to load.
  * @param {object} options Options are passed on to
  * **BrainBrowser.loader.loadColorMapFromURL()**
  *
  * @description
  * Load and parse color map data from the specified URL.
  * ```js
  * viewer.loadColorMapFromURL(url);
  * ```
  */
  viewer.loadColorMapFromURL  = function(url, options) {
    loader.loadColorMapFromURL(url, loadColorMap, options);
  };



  /**
  * @doc function
  * @name viewer.loading:loadColorMapFromFile
  * @param {DOMElement} file_input File input element representing the local file to load.
  * @param {object} options Options are passed on to
  * **BrainBrowser.loader.loadColorMapFromFile()**
  *
  * @description
  * Load and parse color map data from a local file.
  * ```js
  * viewer.loadColorMapFromFile(file_input);
  * ```
  */
  viewer.loadColorMapFromFile = function(file_input, options){
    loader.loadColorMapFromFile(file_input, loadColorMap, options);
  };

    /**
  * @doc function
  * @name viewer.loading:loadColorMapFromString
  * @param {string} string A string containing the colour map to be used
  * **BrainBrowser.loader.loadColorMapFromString()**
  *
  * @description
  * Load and parse color map data from a local file.
  * ```js
  * viewer.loadColorMapFromString(
  *   "0.0 0.0 0.0 1.0\n" +
  *     "0.1 0.15 0.8 1.0\n" +
  *     "0.2 0.35 0.8 1.0\n" +
  *     "0.3 0.45 0.8 1.0\n" +
  *     "0.4 0.5 0.9 1.0\n" +
  *     " \n" +
  *     "0.4 0.5 0.9 1.0\n" +
  *     "0.3 0.45 0.8 1.0\n" +
  *     "0.2 0.35 0.8 1.0\n" +
  *     "0.1 0.15 0.8 1.0\n" +
  *     "0.0 0.0 0.0 1.0\n");
  * ```
  */
  viewer.loadColorMapFromString = function(string){
    var colmap = BrainBrowser.createColorMap(string);
    loadColorMap(colmap);
  };

  /**
  * @doc function
  * @name viewer.loading:clearScreen
  * @description
  * Remove all loaded models on the screen.
  * ```js
  * viewer.clearScreen();
  * ```
  */
  viewer.clearScreen = function() {
    var children = viewer.model.children;

    while (children.length > 0) {
      viewer.model.remove(children[0]);
    }

    viewer.model_data.clear();

    viewer.resetView();
    viewer.triggerEvent("clearscreen");
  };


  ////////////////////////////////////
  // PRIVATE FUNCTIONS
  ////////////////////////////////////

  function loadModel(data, filename, options) {
    options           = options        || {};
    var type          = options.format || "mniobj";
    var parse_options = options.parse  || {};
    var dont_parse    = options.dont_parse;
    
    // Parse model info based on the given file type.
    if(dont_parse){
      if (!BrainBrowser.loader.checkCancel(options.cancel)) {
        displayModel(data, filename, options);
      }
    } else {
      parseModel(data, type, parse_options, function(model_data) {
        if (!BrainBrowser.loader.checkCancel(options.cancel)) {
          displayModel(model_data, filename, options);
        }
      });
    }
  }

  function loadIntensityData(text, filename, options) {
    options            = options        || {};
    var name           = options.name   || filename;
    var type           = options.format || "text";
    var blend          = options.blend;
    var model_name     = options.model_name;
    var model_data     = viewer.model_data.get(model_name);
    var intensity_data = model_data.intensity_data[0];
    var dont_parse     = options.dont_parse;

    var old_range = {};

    var updateIntensityData = function(intensity_data) {
      var min;
      var max;

      if (intensity_data.colors) {
        loadColorMap(BrainBrowser.createColorMap(intensity_data.colors));
      }

      if (viewer.getAttribute("fix_color_range") &&
          old_range.min !== undefined && old_range.max !== undefined) {
        min = old_range.min;
        max = old_range.max;
      } else {
        min = options.min === undefined ? intensity_data.min : options.min;
        max = options.max === undefined ? intensity_data.max : options.max;
      }

      intensity_data.name = name;

      if (!blend) {
        model_data.intensity_data.length = 0;
      }

      model_data.intensity_data.push(intensity_data);
      intensity_data.model_data = model_data;

      intensity_data.range_min = min;
      intensity_data.range_max = max;

      if (model_data.intensity_data.length > 1) {
        viewer.blend(options.complete);
      } else {
        viewer.updateColors({
          model_name: model_name,
          complete: options.complete
        });
      }

      viewer.triggerEvent("loadintensitydata", {
        model_data: model_data,
        intensity_data: intensity_data
      });
    };

    model_name = model_name || model_data.name;
    
    if (viewer.getAttribute("fix_color_range") && intensity_data) {
      old_range = {
        min: intensity_data.range_min,
        max: intensity_data.range_max
      };
    }

    if(dont_parse){
      var intens_obj = {values : text};
      var min = intens_obj.values[0];
      var max = intens_obj.values[0];

      for(var i = 1; i < intens_obj.values.length; i++){
        min = Math.min(min, intens_obj.values[i]);
        max = Math.max(max, intens_obj.values[i]);
      }

      intens_obj.min = min;
      intens_obj.max = max;
      
      updateIntensityData(intens_obj); //not text in this case
    } else {
      SurfaceViewer.parseIntensityData(text, type, updateIntensityData);
    }
  }

  

  function loadColorMap(color_map) {
    viewer.color_map = color_map;

    viewer.triggerEvent("loadcolormap", {
      color_map: color_map
    });

    viewer.model_data.forEach(function(model_data) {
      if (model_data.intensity_data[0]) {
        viewer.updateColors({
          model_name: model_data.name
        });
      }
    });
  }

  ///////////////////////////////////////////
  // PARSE LOADED MODELS
  ///////////////////////////////////////////

  function parseModel(data, type, options, callback) {
    var error_message;

    var worker_url_type = type + "_model";

    if (!SurfaceViewer.worker_urls[worker_url_type]) {
      error_message = "error in SurfaceViewer configuration.\n" +
        "Model worker URL for " + type + " not defined.\n" +
        "Use 'BrainBrowser.config.set(\"model_types." + type + ".worker\", ...)' to set it.";

      BrainBrowser.events.triggerEvent("error", { message: error_message });
      throw new Error(error_message);
    }

    var parse_worker = new Worker(SurfaceViewer.worker_urls[worker_url_type]);
    var deindex_worker;

    parse_worker.addEventListener("message", function(event) {
      var model_data = event.data;
      var transfer;

      if (model_data.error){
        error_message = "error parsing model.\n" +
          model_data.error_message + "\n" +
          "File type: " + type + "\n" +
          "Options: " + JSON.stringify(options);

        BrainBrowser.events.triggerEvent("error", { message: error_message });
        throw new Error(error_message);
      }

      model_data.colors = model_data.colors || new Float32Array([0.7, 0.7, 0.7, 1.0]);

      if (BrainBrowser.WEBGL_UINT_INDEX_ENABLED) {
        loadIndexedModel(model_data, callback);
      } else {
        deindex_worker = new Worker(SurfaceViewer.worker_urls.deindex);

        deindex_worker.addEventListener("message", function(event) {
          callback(event.data);
        });

        transfer = [model_data.vertices.buffer];

        if (model_data.normals) {
          transfer.push(model_data.normals.buffer);
        }

        if (model_data.colors) {
          transfer.push(model_data.colors.buffer);
        }

        model_data.shapes.forEach(function(shape) {
          transfer.push(shape.indices.buffer);
        });

        deindex_worker.postMessage(model_data, transfer);
      }

      parse_worker.terminate();
    });

    var import_url = BrainBrowser.utils.getWorkerImportURL();
    parse_worker.postMessage({
      data: data,
      options: options,
      url: import_url
    });

  }

  function loadIndexedModel(model_data, callback) {
    var verts = model_data.vertices;

    if(model_data.colors.length === 4) {
      model_data.colors = unrollColors(model_data.colors, verts.length / 3);
    }

    findCentroid(model_data);

    callback(model_data);
  }

  function unrollColors(color, num_verts) {
    var data_color_0, data_color_1, data_color_2, data_color_3;
    var unrolled_colors;
    var i, count;

    unrolled_colors = new Float32Array(num_verts * 4);

    data_color_0 = color[0];
    data_color_1 = color[1];
    data_color_2 = color[2];
    data_color_3 = color[3];

    for (i = 0, count = unrolled_colors.length; i < count; i += 4) {
      unrolled_colors[i]     = data_color_0;
      unrolled_colors[i + 1] = data_color_1;
      unrolled_colors[i + 2] = data_color_2;
      unrolled_colors[i + 3] = data_color_3;
    }

    return unrolled_colors;
  }

  ///////////////////////////////////////////
  // DISPLAY OF LOADED MODELS
  ///////////////////////////////////////////

  // Creates three.js objects based on the
  // description in **model_data** and
  // displays in on the viewer.
  function displayModel(model_data, filename, options) {
    options      = options || {};
    var complete = options.complete;

    var new_shapes = createModel(model_data, filename, options);

    viewer.triggerEvent("displaymodel", {
      model:      viewer.model,
      model_data: model_data,
      new_shapes: new_shapes,
    });

    if (complete) complete();
  }

  // Create a model that may be composed of several
  // shapes. Each shape will get their own three.js
  // object, though they may share attributes and
  // buffers.
  function createModel(model_data, filename, options){
    var model         = viewer.model;
    var shapes        = model_data.shapes;
    var is_line       = model_data.type === "line";
    var render_depth  = options.render_depth;
    var pick_ignore   = options.pick_ignore;
    var recenter      = options.recenter || model_data.split;
    var new_shapes    = [];
    var shape, shape_data;
    var i, count;
    var object_description = {is_line: is_line};
    var position_buffer, normal_buffer, color_buffer;

    if (BrainBrowser.WEBGL_UINT_INDEX_ENABLED) {

      position_buffer = new THREE.BufferAttribute(new Float32Array(model_data.vertices), 3);

      if (model_data.normals) {
        normal_buffer = new THREE.BufferAttribute(new Float32Array(model_data.normals), 3);
      }

      if (model_data.colors) {
        color_buffer = new THREE.BufferAttribute(new Float32Array(model_data.colors), 4);
      }
    }

    model_data.name = model_data.name || filename;

    viewer.model_data.add(model_data.name, model_data);

    if (shapes) {
      for (i = 0, count = shapes.length; i < count; i++) {
        shape_data = model_data.shapes[i];

        if (shape_data.indices.length === 0) {
          continue;
        }

        if (BrainBrowser.WEBGL_UINT_INDEX_ENABLED) {
          setShapeColors(color_buffer.array, shape_data.color, shape_data.indices);

          object_description = {
            position: position_buffer,
            normal:   normal_buffer,
            color:    color_buffer,
            index:    new THREE.BufferAttribute(new Uint32Array(shape_data.indices), 1),
          };

        } else {

          position_buffer = normal_buffer = color_buffer = null;

          position_buffer = new THREE.BufferAttribute(new Float32Array(shape_data.unindexed.position), 3);

          if (shape_data.unindexed.normal) {
            normal_buffer = new THREE.BufferAttribute(new Float32Array(shape_data.unindexed.normal), 3);
          }

          if (shape_data.unindexed.color) {
            color_buffer = new THREE.BufferAttribute(new Float32Array(shape_data.unindexed.color), 4);
          }

          object_description = {
            position: position_buffer,
            normal:   normal_buffer,
            color:    color_buffer
          };

        }

        object_description.is_line  = is_line;
        object_description.centroid = shape_data.centroid;
        object_description.recenter = recenter;

        shape      = createShape(object_description);
        shape.name = shape_data.name || filename + "_" + (i + 1);

        shape.userData.model_name = model_data.name;

        shape.userData.original_data = {
          vertices: model_data.vertices,
          indices:  shape_data.indices,
          normals:  model_data.normals,
          colors:   model_data.colors,
        };

        shape.userData.pick_ignore = pick_ignore;

        if (render_depth) {
          shape.renderDepth = render_depth;
        }

        new_shapes.push(shape);
        model.add(shape);
      }

      if (model_data.split) {
        model.children[0].name = "left";
        model.children[1].name = "right";
      }
    }

    return new_shapes;
  }

  // Create a three.js object to represent
  // a shape from the model data 'shapes'
  // array.
  function createShape(object_description) {
    var position       = object_description.position;
    var position_array = position.array;
    var normal         = object_description.normal;
    var color          = object_description.color;
    var index          = object_description.index;
    var centroid       = object_description.centroid;
    var is_line        = object_description.is_line;
    var recenter       = object_description.recenter;

    var geometry = new THREE.BufferGeometry();
    var index_array, tmp_position_array, position_index;
    var material, shape;
    var i, count;

    geometry.dynamic = true;

    if (recenter) {
      if (index) {
        index_array = index.array;
        // tmp_position_array used because there will be repeats in the index array.
        tmp_position_array = new Float32Array(position_array);
        for (i = 0, count = index_array.length; i < count; i++) {
          position_index = index_array[i] * 3;
          position_array[position_index]     = tmp_position_array[position_index]     - centroid.x;
          position_array[position_index + 1] = tmp_position_array[position_index + 1] - centroid.y;
          position_array[position_index + 2] = tmp_position_array[position_index + 2] - centroid.z;
        }
      } else {
        for (i = 0, count = position_array.length; i < count; i += 3) {
          position_array[i]     -= centroid.x;
          position_array[i + 1] -= centroid.y;
          position_array[i + 2] -= centroid.z;
        }
      }
    }

    geometry.addAttribute("position", position);

    if (index) {
      geometry.addAttribute("index", index);
    }

    if (normal) {
      geometry.addAttribute("normal", normal);
    } else {
      geometry.computeVertexNormals();
    }

    if(color) {
      geometry.addAttribute("color", color);
    }

    if (is_line) {
      material = new THREE.LineBasicMaterial({vertexColors: THREE.VertexColors});
      shape    = new THREE.Line(geometry, material, THREE.LinePieces);
    } else {
      material = new THREE.MeshPhongMaterial({color: 0xFFFFFF, ambient: 0xFFFFFF, specular: 0x101010, shininess: 150, vertexColors: THREE.VertexColors});
      shape    = new THREE.Mesh(geometry, material);
      shape.userData.has_wireframe = true;
    }

    shape.userData.centroid = centroid;

    if (recenter) {
      shape.userData.recentered = true;
      shape.position.set(centroid.x, centroid.y, centroid.z);
    }

    return shape;
  }

  // Find centroid and bounding box of a shape.
  function findCentroid(model_data) {
    var verts = model_data.vertices;

    // Global bounding box.
    var global_min_x, global_max_x, global_min_y, global_max_y, global_min_z, global_max_z;
    global_min_x = global_min_y = global_min_z = Number.POSITIVE_INFINITY;
    global_max_x = global_max_y = global_max_z = Number.NEGATIVE_INFINITY;

    model_data.shapes.forEach(function(shape) {
      var indices = shape.indices;
      var index;
      var x, y, z;
      var i, count;

      // Shape bounding box
      var min_x, max_x, min_y, max_y, min_z, max_z;
      min_x = min_y = min_z = Number.POSITIVE_INFINITY;
      max_x = max_y = max_z = Number.NEGATIVE_INFINITY;

      for (i = 0, count = indices.length; i < count; i++) {
        index = indices[i];
        x = verts[index * 3];
        y = verts[index * 3 + 1];
        z = verts[index * 3 + 2];

        min_x = Math.min(min_x, x);
        min_y = Math.min(min_y, y);
        min_z = Math.min(min_z, z);
        max_x = Math.max(max_x, x);
        max_y = Math.max(max_y, y);
        max_z = Math.max(max_z, z);
      }

      shape.bounding_box = {
        min_x: min_x,
        min_y: min_y,
        min_z: min_z,
        max_x: max_x,
        max_y: max_y,
        max_z: max_z
      };

      shape.centroid = {
        x: min_x + (max_x - min_x) / 2,
        y: min_y + (max_y - min_y) / 2,
        z: min_z + (max_z - min_z) / 2
      };

      // Find global min for bounding box
      global_min_x = Math.min(global_min_x, min_x);
      global_min_y = Math.min(global_min_y, min_y);
      global_min_z = Math.min(global_min_z, min_z);
      // Find global max for bounding box
      global_max_x = Math.max(global_max_x, max_x);
      global_max_y = Math.max(global_max_y, max_y);
      global_max_z = Math.max(global_max_z, max_z);
    });

    // Set the bounding box
    model_data.bounding_box = {
        min_x: global_min_x,
        min_y: global_min_y,
        min_z: global_min_z,
        max_x: global_max_x,
        max_y: global_max_y,
        max_z: global_max_z
      };

    // Set size of the model in x, y and z
    model_data.size = {
        x: global_max_x - global_min_x,
        y: global_max_y - global_min_y,
        z: global_max_z - global_min_z,
      };
  }

  // Used for indexed models.
  // Will adjust the color buffer by putting shape
  // colors at the right positions.
  function setShapeColors(model_colors, shape_colors, indices) {
    if (!shape_colors) {
      return;
    }

    var mono_color = shape_colors.length === 4;
    var r, g, b, a;
    var i, ic, count;

    r = shape_colors[0];
    g = shape_colors[1];
    b = shape_colors[2];
    a = shape_colors[3];

    for (i = 0, count = indices.length; i < count; i++) {
      if (!mono_color) {
        ic = i * 4;
        r = shape_colors[ic];
        g = shape_colors[ic + 1];
        b = shape_colors[ic + 2];
        a = shape_colors[ic + 3];
      }

      ic = indices[i] * 4;

      model_colors[ic]     = r;
      model_colors[ic + 1] = g;
      model_colors[ic + 2] = b;
      model_colors[ic + 3] = a;
    }
  }

  // Check if request format is binary.
  function checkBinary(config_base, options) {
    options = options || {};
    var format = options.format || "mniobj";
    var format_config = BrainBrowser.config.get(config_base + "." + format);

    if (format_config && format_config.binary) {
      options.result_type = options.result_type || "arraybuffer";
    }

    return options;
  }

};

