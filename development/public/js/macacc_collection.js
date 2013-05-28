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

function MacaccObject(brainbrowser, path, dont_build_path) {
  var that = this;
  this.brainbrowser = brainbrowser;
  this.dataSet = new Dataset(path,dont_build_path);

  //Defining properties I will use
  that.debugLineGroup;
  that.debugLine;
  that.selectedInfo = null;
  that.treeInfo;  // information about the transform graph.
  that.pickInfoElem;
  that.flashTimer = 0;
  that.highlightMaterial;
  that.highlightShape;
  that.vertex;
  that.positionVector;
  that.primitiveIndex;
  that.dataArray;
  that.data_max; //Max of data
  that.data_min; //Min of data
  that.range_max; //Max of range bar
  that.range_min; //Min of range bar
  that.spectrum;
  that.coordinates = $("#coordinates");
  that.selectPoint = null;

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
  this.pickClick = function(e, vertex_data) {
    that.vertex = vertex_data.vertex;
    
    if (vertex_data.object && vertex_data.object.model_num) {
      that.vertex += vertex_data.object.model_num * vertex_data.object.geometry.vertices.length;
    } 
   
    if(that.vertex) {
      update_map();
      setVertexCoord(vertex_data, 0);
      if(brainbrowser.secondWindow != undefined && true) {
	      brainbrowser.secondWindow.postMessage(that.vertex,"*");
      }
    }else {
      $(that.pickInfoElem).html('--nothing--');
    }
  };
  
  this.change_model = function(event, options) {
    var type = $(event.target).val();
    options.format = "MNIObject";
    
    brainbrowser.clearScreen();
    brainbrowser.loadModelFromUrl('/data/surfaces/surf_reg_model_both_'+type+'.obj', options);
  };

  this.flipXCoordinate = function() {
    if (!that.dataArray) return;
    
    if(that.vertex > that.dataArray.length/2) {
      that.vertex -= that.dataArray.length/2;
    }else {
      that.vertex += that.dataArray.length/2;
    }
    setVertexCoord(brainbrowser.getInfoForVertex(that.vertex), 0);
    update_map();
  };

  //Finds out what the value is at a certain point and displays it
  this.valueAtPoint = function(e, vertex_data) {
    var value = that.dataArray[vertex_data.vertex];
    setVertexCoord(vertex_data, value);
  };

  function get_data_controls() {
    var data_modality = $("[name=modality]:checked").val(); //CT,AREA or Volume
    var data_sk = $("#data-sk").val(); //Smoothing Kernel
    var data_statistic = $("[name=statistic]:checked").val();


    return {modality: data_modality, sk: data_sk, statistic: data_statistic };
  }

  this.update_model = function (dataset) {
    var flip;
    var clamped;
    
    that.dataArray = dataset.current_data.values;
    brainbrowser.current_dataset = dataset;
    if($("#fix_range").is(":checked")) {
      if(!(that.data_min = parseFloat($("#data-range-min").val()))) {
	      if(!that.data_min === 0 ) {
	        that.data_min = dataset.current_data.min;
	      }
      }
      if(!(that.data_max = parseFloat($("#data-range-max").val()))) {
	      if(!that.data_max === 0 ) {
	        that.data_max = dataset.current_data.max;
	      }
      }
    } else if(get_data_controls().statistic == "T") {
      that.data_min = dataset.current_data.min;
      that.data_max = dataset.current_data.max;
    }

    flip = $("#flip_range").is(":checked");
    clamped = $("#clamp_range").is(":checked");
    if (get_data_controls().statistic == "T") {
      that.flipRange = flip;
      brainbrowser.updateColors(that.dataSet.current_data, that.data_min, that.data_max, brainbrowser.spectrum, flip, clamped);
    } else {
      that.flipRange = !flip;
      $("#range-slider").slider("option", "min", "0");
      $("#range-slider").slider("option", "max", "1");
      brainbrowser.updateColors(that.dataSet.current_data, 0, 1, brainbrowser.spectrum, !flip, clamped);
    }

  };

  function update_map() {
    that.dataSet.get_data(that.vertex, get_data_controls(), that.update_model);
    $(that.pickInfoElem).html("Viewing data for vertex: " + that.vertex  );
    
  }

  this.show_atlas = function() {
    brainbrowser.loadDataFromUrl("/assets/aal_atlas.txt");
  };

  function update_range(min,max) {
    if (!$("#fix_range").is(":checked")) {
      $("#data-range-min").val(min);
      $("#data-range-max").val(max);
      $("#range-slider").slider("values", 0, min);
      $("#range-slider").slider("values", 1, max);
    }
    if (that.afterRangeChange != undefined) {
      that.afterRangeChange(min,max);
    }
  }

  this.range_change = function() {
    var min = parseFloat($("#data-range-min").val());
    var max = parseFloat($("#data-range-max").val());
    brainbrowser.updateColors(that.dataSet.current_data, min, max, brainbrowser.spectrum, $("#flip_range").is(":checked"), $("#clamp_range").is(":checked"));

    if(that.afterRangeChange != undefined) {
      that.afterRangeChange(min, max);
    }
  };


  this.data_control_change = function() {
    var controls  = get_data_controls();
    
    if (controls.modality == "AAL") {
      that.show_atlas();  
    } else if (that.vertex) {
      update_map();
    }
  };


  brainbrowser.loadSpectrumFromUrl("/assets/spectral_spectrum.txt");
  brainbrowser.valueAtPointCallback = this.valueAtPoint;
  brainbrowser.clickCallback = this.pickClick; //associating pickClick for brainbrowser which handles events.

}





