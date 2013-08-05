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

BrainBrowser.macaccCollection = function(brainbrowser, path, dont_build_path) {
  var collection = {};
  collection.brainbrowser = brainbrowser;
  collection.dataSet = BrainBrowser.dataSet(path, dont_build_path);

  //Defining properties I will use
  collection.debugLineGroup;
  collection.debugLine;
  collection.selectedInfo = null;
  collection.treeInfo;  // information about the transform graph.
  collection.pickInfoElem;
  collection.flashTimer = 0;
  collection.highlightMaterial;
  collection.highlightShape;
  collection.vertex;
  collection.positionVector;
  collection.primitiveIndex;
  collection.dataArray;
  collection.data_max; //Max of data
  collection.data_min; //Min of data
  collection.range_max; //Max of range bar
  collection.range_min; //Min of range bar
  collection.spectrum;
  collection.coordinates = $("#coordinates");
  collection.selectPoint = null;

  function setVertexCoord(vertex_data, value) {
    var vertex = vertex_data.vertex;
    if (vertex != undefined && value != undefined) {
      $("#x-coord").val(vertex_data.point.x);
      $("#y-coord").val(vertex_data.point.y);
      $("#z-coord").val(vertex_data.point.z);
      $("#v-coord").val(vertex);
      $("#value-coord").val(value);
    }
  }


  //Gets the data related to a vertex in the image.
  collection.pickClick = function(e, vertex_data) {
    collection.vertex = vertex_data.vertex;
    
    if (vertex_data.object && vertex_data.object.model_num) {
      collection.vertex += vertex_data.object.model_num * vertex_data.object.geometry.vertices.length;
    } 
   
    if(collection.vertex) {
      update_map();
      setVertexCoord(vertex_data, 0);
      if(brainbrowser.secondWindow != undefined && true) {
        brainbrowser.secondWindow.postMessage(collection.vertex, "*");
      }
    }else {
      $(collection.pickInfoElem).html('--nothing--');
    }
  };
  
  collection.change_model = function(event, options) {
    var type = $(event.target).val();
    options.format = "MNIObject";
    
    brainbrowser.clearScreen();
    brainbrowser.loadModelFromUrl('/data/surfaces/surf_reg_model_both_' + type + '.obj', options);
  };

  collection.flipXCoordinate = function() {
    if (!collection.dataArray) return;
    
    if(collection.vertex > collection.dataArray.length/2) {
      collection.vertex -= collection.dataArray.length/2;
    }else {
      collection.vertex += collection.dataArray.length/2;
    }
    setVertexCoord(brainbrowser.getInfoForVertex(collection.vertex), 0);
    update_map();
  };

  //Finds out what the value is at a certain point and displays it
  collection.valueAtPoint = function(e, vertex_data) {
    var value = collection.dataArray ? collection.dataArray[vertex_data.vertex] : 0;
    setVertexCoord(vertex_data, value);
  };

  function get_data_controls() {
    var data_modality = $("[name=modality]:checked").val(); //CT,AREA or Volume
    var data_sk = $("#data-sk").val(); //Smoothing Kernel
    var data_statistic = $("[name=statistic]:checked").val();


    return {modality: data_modality, sk: data_sk, statistic: data_statistic };
  }

  collection.update_model = function (dataset) {
    var flip;
    var clamped;
    
    if (!dataset) {
      $("#loading").hide();
      return;
    }
    
    collection.dataArray = dataset.current_data.values;
    brainbrowser.current_dataset = dataset;
    if($("#fix_range").is(":checked")) {
      if(!(collection.data_min = parseFloat($("#data-range-min").val()))) {
        if(!collection.data_min === 0 ) {
          collection.data_min = dataset.current_data.min;
        }
      }
      if(!(collection.data_max = parseFloat($("#data-range-max").val()))) {
        if(!collection.data_max === 0 ) {
          collection.data_max = dataset.current_data.max;
        }
      }
    } else if(get_data_controls().statistic === "T") {
      collection.data_min = dataset.current_data.min;
      collection.data_max = dataset.current_data.max;
    }

    flip = $("#flip_range").is(":checked");
    clamped = $("#clamp_range").is(":checked");
    if (get_data_controls().statistic === "T") {
      collection.flipRange = flip;
      brainbrowser.updateColors(collection.dataSet.current_data, collection.data_min, collection.data_max, brainbrowser.spectrum, flip, clamped, false, {
        afterUpdate: function() {
          $("#loading").hide();
        }
      });
    } else {
      collection.flipRange = !flip;
      $("#range-slider").slider("option", "min", "0");
      $("#range-slider").slider("option", "max", "1");
      brainbrowser.updateColors(collection.dataSet.current_data, 0, 1, brainbrowser.spectrum, !flip, clamped, false, {
        afterUpdate: function() {
          $("#loading").hide();
        }
      });
    }

  };

  function update_map() {
    $("#loading").show();
    collection.dataSet.get_data(collection.vertex, get_data_controls(), collection.update_model);
    $(collection.pickInfoElem).html("Viewing data for vertex: " + collection.vertex  );
    
  }

  collection.show_atlas = function() {
    brainbrowser.loadDataFromUrl("/assets/aal_atlas.txt");
  };

  function update_range(min,max) {
    if (!$("#fix_range").is(":checked")) {
      $("#data-range-min").val(min);
      $("#data-range-max").val(max);
      $("#range-slider").slider("values", 0, min);
      $("#range-slider").slider("values", 1, max);
    }
    if (collection.afterRangeChange != undefined) {
      collection.afterRangeChange(min,max);
    }
  }

  collection.range_change = function() {
    var min = parseFloat($("#data-range-min").val());
    var max = parseFloat($("#data-range-max").val());
    $("#loading").show();
    brainbrowser.updateColors(collection.dataSet.current_data, min, max, brainbrowser.spectrum, $("#flip_range").is(":checked"), $("#clamp_range").is(":checked"), false, {
      afterUpdate: function() {
        $("#loading").hide();
      }
    });

    if(collection.afterRangeChange) {
      collection.afterRangeChange(min, max);
    }
  };


  collection.data_control_change = function() {
    var controls  = get_data_controls();
    
    if (controls.modality == "AAL") {
      collection.show_atlas();  
    } else if (collection.vertex) {
      update_map();
    }
  };


  brainbrowser.loadSpectrumFromUrl("/assets/spectral_spectrum.txt");
  brainbrowser.valueAtPointCallback = collection.valueAtPoint;
  brainbrowser.clickCallback = collection.pickClick; //associating pickClick for brainbrowser which handles events.

  return collection;
}





