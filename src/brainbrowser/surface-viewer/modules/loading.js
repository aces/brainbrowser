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
    * @name viewer.model\_data:add
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
    * @name viewer.model\_data:get
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
    * Note that model\_data **get()** methods will return the first loaded model
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
    * @name viewer.model\_data:getDefaultIntensityData
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
    * @name viewer.model\_data:count
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
    * @name viewer.model\_data:clear
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
    * @name viewer.model\_data:forEach
    * @param {function} callback Callback function to which the
    * model descriptions will be passed.
    *
    * @description
    * Iterate over a set of model data and pass them to the provided callback
    * function. The function will receive the model description and the model name
    * as arguments.
    * ```js
    * viewer.model_data.forEach(function(mode_data, model_name) {
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
    options = checkBinary(options);

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
    options = checkBinary(options);

    loader.loadFromFile(file_input, loadModel, options);
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
    options = checkBinary(options);

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
    options = checkBinary(options);

    loader.loadFromFile(file_input, loadIntensityData, options);
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
    options = options || {};
    var type = options.format || "mniobj";
    var parse_options = options.parse || {};

    // Parse model info based on the given file type.
    parseModel(data, type, parse_options, function(obj) {
      if (!BrainBrowser.loader.checkCancel(options.cancel)) {
        displayModel(obj, filename, options);
      }
    });
  }

  function loadIntensityData(text, filename, options) {
    options = options || {};
    var name = options.name || filename;
    var type = options.format || "mniobj";
    var blend = options.blend;
    var model_name = options.model_name;
    var model_data = viewer.model_data.get(model_name);
    var intensity_data = model_data.intensity_data[0];

    var old_range = {};

    model_name = model_name || model_data.name;

    if (viewer.getAttribute("fix_color_range") && intensity_data) {
      old_range = {
        min: intensity_data.range_min,
        max: intensity_data.range_max
      };
    }

    SurfaceViewer.parseIntensityData(text, type, function(intensity_data) {
      var min;
      var max;

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
    });
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

      if (model_data.error){
        error_message = "error parsing model.\n" +
          model_data.error_message + "\n" +
          "File type: " + type + "\n" +
          "Options: " + JSON.stringify(options);

        BrainBrowser.events.triggerEvent("error", { message: error_message });
        throw new Error(error_message);
      }

      model_data.colors = model_data.colors || [0.7, 0.7, 0.7, 1.0];

      deindex_worker = new Worker(SurfaceViewer.worker_urls.deindex);

      deindex_worker.addEventListener("message", function(event) {
        callback(event.data);
      });

      deindex_worker.postMessage(model_data);

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
    var complete = options.complete;

    var new_shapes = addObject(model_data, filename, options);

    viewer.triggerEvent("displaymodel", {
      model: viewer.model,
      model_data: model_data,
      new_shapes: new_shapes
    });

    if (complete) complete();
  }

  // Add a polygon object to the scene.
  function addObject(model_data, filename, options){
    var model = viewer.model;
    var shapes = model_data.shapes;
    var is_line = model_data.type === "line";
    var render_depth = options.render_depth;
    var pick_ignore = options.pick_ignore;
    var new_shapes = [];
    var shape, shape_data;
    var i, count;

    model_data.name = model_data.name || filename;

    viewer.model_data.add(model_data.name, model_data);

    if (shapes) {
      for (i = 0, count = shapes.length; i < count; i++){
        shape_data = model_data.shapes[i];
        shape = createObject(shape_data, is_line);
        shape.name = shape_data.name || filename + "_" + (i + 1);

        shape.userData.model_name = model_data.name;

        shape.userData.original_data = {
          vertices: model_data.vertices,
          indices: shape_data.indices,
          normals: model_data.normals,
          colors: model_data.colors
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

  function createObject(shape_data, is_line) {
    var unindexed = shape_data.unindexed;
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
      material = new THREE.MeshPhongMaterial({color: 0xFFFFFF, ambient: 0xFFFFFF, specular: 0x101010, shininess: 150, vertexColors: THREE.VertexColors});
      shape = new THREE.Mesh(geometry, material);
      shape.has_wireframe = true;
    }

    shape.centroid = centroid;
    shape.position.set(centroid.x, centroid.y, centroid.z);

    return shape;
  }

  function checkBinary(options) {
    options = options || {};
    var format = options.format || "mniobj";
    var format_config = BrainBrowser.config.get("model_types." + format);

    if (format_config && format_config.binary) {
      options.result_type = options.result_type || "arraybuffer";
    }

    return options;
  }

};

