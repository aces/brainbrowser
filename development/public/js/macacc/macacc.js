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

// Module for fetching MACACC data from the server and updating
// the displayed map.
var MACACC = (function() {
  
  function createCollection (brainbrowser, path, dont_build_path) {
    var collection = {
      brainbrowser: brainbrowser,
      dataset: createDataset(path, dont_build_path)
    };
    
    // Gets the data related to a vertex in the image.
    collection.pickClick = function(e, vertex_data) {
      collection.vertex = vertex_data.vertex;
      
      if (vertex_data.object && vertex_data.object.model_num) {
        collection.vertex += vertex_data.object.model_num * vertex_data.object.geometry.vertices.length;
      } 
      
      if (collection.vertex) {
        loadMap();
        if (collection.afterVertexUpdate) collection.afterVertexUpdate(vertex_data, 0);
        if (brainbrowser.secondWindow) {
          brainbrowser.secondWindow.postMessage(collection.vertex, "*");
        }
      }
    };
  
    // Main method for updating the displayed map based on the vertex selected
    // and other parameters.
    collection.updateMap = function(dataset, options) {
      dataset = dataset || collection.dataset;
      options = options || (collection.dataOptions && collection.dataOptions()) || {};
      
      var flip = options.flip;
      var clamped = options.clamped;
      var fix_range = options.fix_range;
      var data_range_min = parseFloat(options.data_range_min);
      var data_range_max = parseFloat(options.data_range_max);
      var statistic = collection.getDataControls().statistic;
      var min, max;
      
      
      if (!dataset) {
        if (collection.afterInvalidMap) collection.afterInvalidMap();
        return;
      }
      
      collection.dataArray = dataset.current_data.values;
      if(fix_range) {
        collection.data_min = isFinite(data_range_min) ? data_range_min : dataset.current_data.min;
        collection.data_max = isFinite(data_range_max) ? data_range_max : dataset.current_data.max;
      } else if(statistic === "T") {
        collection.data_min = dataset.current_data.min;
        collection.data_max = dataset.current_data.max;
      }
  
      if (statistic === "T") {
        min = collection.data_min;
        max = collection.data_max;
      } else {
        flip = !flip;
        min = 0;
        max = 1;
      }
      collection.flipRange = flip;
      
      brainbrowser.updateColors(collection.dataset.current_data, {
        min: min, 
        max: max, 
        spectrum: brainbrowser.spectrum, 
        flip: flip, 
        clamped: clamped
      });
      
      if (collection.afterUpdateModel) collection.afterUpdateModel(statistic);
  
    };
    
    // Change surface on which maps will be displayed.
    collection.changeModel = function(type, options) {
      options.format = "MNIObject";
      
      brainbrowser.clearScreen();
      brainbrowser.loadModelFromUrl('/data/surfaces/surf_reg_model_both_' + type + '.obj', options);
    };
  
    // Callback to update map after a change in range.
    collection.rangeChange = function(options) {
      options = options || (collection.dataOptions && collection.dataOptions()) || {};
      var min = parseFloat(options.data_range_min);
      var max = parseFloat(options.data_range_max);
      
      if(collection.beforeRangeChange) {
        collection.beforeRangeChange(min, max);
      }
      
      collection.updateMap();
  
      if(collection.afterRangeChange) {
        collection.afterRangeChange(min, max);
      }
    };
  
    // Flip mapping along x axix.
    collection.flipXCoordinate = function() {
      if (!collection.dataArray) return;
      
      if(collection.vertex > collection.dataArray.length/2) {
        collection.vertex -= collection.dataArray.length/2;
      }else {
        collection.vertex += collection.dataArray.length/2;
      }
      if (collection.afterVertexUpdate) collection.afterVertexUpdate(brainbrowser.getInfoForVertex(collection.vertex), 0);
      loadMap();
    };
  
    // Callback for changes in data controls.
    collection.dataControlChange = function() {
      var controls  = collection.getDataControls();
      
      if (controls.modality === "AAL") {
        if (collection.beforeUpdateMap) collection.beforeUpdateMap();
        collection.showAtlas();  
      } else {
        loadMap();
      }
    };
  
    //Finds out what the value is at a certain point and displays it
    collection.valueAtPoint = function(e, vertex_data) {
      var value = collection.dataArray ? collection.dataArray[vertex_data.vertex] : 0;
      if (collection.afterVertexUpdate) collection.afterVertexUpdate(vertex_data, value);
    };
    
    // Show the atlas.
    collection.showAtlas = function() {
      brainbrowser.loadDataFromUrl("/assets/aal_atlas.txt");
    };
    
    // Default should be redefined by appliction.
    collection.getDataControls = function () {
      return {modality: "", sk: "", statistic: "" };
    };
    
    // Utility function to load a new datamap from the server and display it.
    function loadMap() {
      if (collection.vertex) {
        if (collection.beforeUpdateMap) collection.beforeUpdateMap();
        collection.dataset.getData(collection.vertex, collection.getDataControls(), collection.updateMap); 
      }
    }
  
    brainbrowser.loadSpectrumFromUrl("/assets/spectral_spectrum.txt");
    brainbrowser.valueAtPointCallback = collection.valueAtPoint;
    brainbrowser.clickCallback = collection.pickClick; //associating pickClick for brainbrowser which handles events.
  
    return collection;
  }

  // Create a data set object. This object encapsulates interactions
  // with the MACACC dataset on the server.
  function createDataset(path_prefix, dont_build_pathp) {
    
    var dataset = {};
    
  
    dataset.path = dont_build_pathp ? function() { return path_prefix; } 
                      : function(vertex, settings) {
                          var sk =  "ICBM152_" + settings.sk;
                          var modality = "ICBM152_" + settings.modality + "_MACACC_" + (settings.modality === 'CT' ? "mean" : "size");
                          var statistic = settings.statistic === "T"  ? "T_map/T_" :
                                          settings.statistic === "P1" ? "RTF_C_map/RTF_C_" : 
                                          settings.statistic === "P2" ? "RTF_V_map/RTF_V_" : "";
                          
                          
                          return (path_prefix || "/data/") + modality + "/" + sk + "/" + statistic + vertex + ".txt";
                        };
                      
    // Primary data set method.
    // Sends a request to the server and then parses the response.
    dataset.getData = function(vertex, settings, callback){
      var path = vertex === "aal_atlas" ? "/assets/aal_atlas.txt" : dataset.path(vertex, settings);
      var data_object = dont_build_pathp ? { vertex: vertex, modality: settings.modality, sk: settings.sk, statistic: settings.statistic } 
                                         : {};
  
      $.ajax({
        type: 'GET',
        url: path,
        data: data_object,
        dataType: 'text',
        success: function(result) {
          BrainBrowser.data(result, function(data) {
            dataset.current_data = data;
            callback(dataset);
          });
        },
        error: function () {
          alert("Error loading map");
        }
      });
  
    };
    
    return dataset;
  }

  return {
    collection: createCollection
  };
})();





