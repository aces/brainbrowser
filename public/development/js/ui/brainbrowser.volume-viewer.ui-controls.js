/*
 * Copyright (c) 2011-2012, McGill University
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *   * Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *   * Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *   * Neither the name of McGill University nor the
 *     names of its contributors may be used to endorse or promote products
 *     derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNEstSS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL McGill University  BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/*
* @author Tarek Sherif
*/

BrainBrowser.VolumeViewer.modules.uiControls = function(viewer) {
  "use strict";

  var VolumeViewer = BrainBrowser.VolumeViewer;

  viewer.globalUIControls = function(element) {
    var controls = $('<div id="global-controls" class="volume-viewer-controls"></div>');
    var sync_button, image_button;

    if (viewer.volumes.length > 1) {
      sync_button = $('<input type="checkbox" class="button" id="sync"><label for="sync">Sync Volumes</label>');
    
      sync_button.change(function() {
        viewer.synced = sync_button.is(":checked");
      });
      
      controls.append(sync_button);
    }
    
    image_button = $('<span id="capture" class="button">Capture Slices</span>');
    
    image_button.click(function() {
      var width = viewer.displays[0][0].canvas.width;
      var height = viewer.displays[0][0].canvas.height;
      var active_canvas = viewer.active_canvas;
      
      var canvas = document.createElement("canvas");
      var context = canvas.getContext("2d");
      var img = new Image();
      canvas.width = width * viewer.displays.length;
      canvas.height = height * 3;
      context.fillStyle = "#000000";
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      viewer.active_canvas = null;
      viewer.draw();
      viewer.displays.forEach(function(display, x) {
        display.forEach(function(panel, y) {
          context.drawImage(panel.canvas, x * width, y * height);
        });
      });
      viewer.active_canvas = active_canvas;
      viewer.draw();
      
      img.onload = function() {
        $("<div></div>").append(img).dialog({
          title: "Slices",
          height: img.height,
          width: img.width
        });
      };

      img.src = canvas.toDataURL();
    });
    
    controls.append(image_button);
    
    $(element).append(controls);
  };
  
  viewer.volumeUIControls = function(controls, volume, volID) {
    controls = $(controls);

    viewer.coordinateUI(controls, volume, volID);
    
    if(volume.type === "multivolume") {
      viewer.blendUI(controls, volume, volID);
    } else {
      viewer.colorScaleUI(controls, volume, volID);
      viewer.thresholdUI(controls, volume, volID);
      if (volume.data.time) {
        viewer.timeUI(controls, volume, volID);
      }
      viewer.sliceSeriesUI(controls, volume, volID);
    }
  };
  
  viewer.coordinateUI = function(controls, volume, volID) {
    var coords, world_coords_div, voxel_coords_div;
    if (volume.getWorldCoords) {
      coords = $('<div class="coords"></div>');

      world_coords_div = $(
        '<div class="control-heading" id="world-coordinates-heading'+volID+'">World Coordinates: </div>' +
        '<div class="world-coords">' +
        
        'X:<input id="world-x" class="control-inputs"></input>' +
        'Y:<input id="world-y" class="control-inputs"></input>' +
        'Z:<input id="world-z" class="control-inputs"></input>' +
        '</div>'
      );

      var world_coord_inputs = {
        x: world_coords_div.find("#world-x"),
        y: world_coords_div.find("#world-y"),
        z: world_coords_div.find("#world-z")
      };


      world_coords_div.change(function() {
        var x = parseFloat(world_coord_inputs.x.val());
        var y = parseFloat(world_coord_inputs.y.val());
        var z = parseFloat(world_coord_inputs.z.val());
        if (!BrainBrowser.utils.isNumeric(x)) {
          x = 0;
        }
        if (!BrainBrowser.utils.isNumeric(y)) {
          y = 0;
        }
        if (!BrainBrowser.utils.isNumeric(z)) {
          z = 0;
        }

        volume.setWorldCoords(x, y, z);

        viewer.redrawVolumes();
      });
      
      voxel_coords_div = $(
        '<div class="control-heading" id="voxel-coordinates-heading'+volID+'">Voxel Coordinates: </div>' +
        '<div class="voxel-coords">' +
        
        'X:<input id="voxel-x" class="control-inputs"></input>' +
        'Y:<input id="voxel-y" class="control-inputs"></input>' +
        'Z:<input id="voxel-z" class="control-inputs"></input>' +
        '</div>'
      );

      var voxel_coord_inputs = {
        x: voxel_coords_div.find("#voxel-x"),
        y: voxel_coords_div.find("#voxel-y"),
        z: voxel_coords_div.find("#voxel-z")
      };

      voxel_coords_div.change(function() {
        var x = parseInt(voxel_coord_inputs.x.val(), 10);
        var y = parseInt(voxel_coord_inputs.y.val(), 10);
        var z = parseInt(voxel_coord_inputs.z.val(), 10);
        if (!BrainBrowser.utils.isNumeric(x)) {
          x = 0;
        }
        if (!BrainBrowser.utils.isNumeric(y)) {
          y = 0;
        }
        if (!BrainBrowser.utils.isNumeric(z)) {
          z = 0;
        }
        
        volume.setVoxelCoords(x, y, z);
        viewer.redrawVolumes();
      });
      
      viewer.addEventListener("sliceupdate", function() {
        var world_coords = volume.getWorldCoords();
        var voxel_coords = volume.getVoxelCoords();
        world_coord_inputs.x.val(world_coords.x.toPrecision(6));
        world_coord_inputs.y.val(world_coords.y.toPrecision(6));
        world_coord_inputs.z.val(world_coords.z.toPrecision(6));

        voxel_coord_inputs.x.val(voxel_coords.x.toPrecision(6));
        voxel_coord_inputs.y.val(voxel_coords.y.toPrecision(6));
        voxel_coord_inputs.z.val(voxel_coords.z.toPrecision(6));
      });
    }
    
    coords.append(world_coords_div);
    coords.append(voxel_coords_div);
    controls.append(coords);
  };
  
  viewer.blendUI = function(controls, volume, volID) {
    var blendSlider = $("<div id=\"blend-slider\" class=\"slider volume-viewer-blend\"></div>");
    var blend = $("<div class=\"control-heading\" id=\"blend-heading"+volID+"\">Blend (-50 to 50): </div>");
    var blend_val = $("<input class=\"control-inputs\" value=\"0\" id =\"blend-val\"/>");
    blend.append(blend_val);
    
    blend.append(blendSlider);
    controls.append(blend);

    blendSlider.slider({
      min: -50,
      max: 50,
      step: 1,
      slide: function(event, ui) {
        var newVal = parseInt(ui.value, 10);
        volume.updateBlendRatio(newVal);
        viewer.redrawVolumes();
        blend_val.val( newVal );
      },
      stop: function() {
        $(this).find("a").blur();
      }
    });
    
    //change blend value based on user input in text field
    blend_val.change(function () {
      var value = parseFloat(this.value);
      if (!BrainBrowser.utils.isNumeric(value)) {
        value = 0;
      }

      value = Math.max(-50, Math.min(value, 50));

      this.value = value;
      blendSlider.slider("value", value);
      volume.updateBlendRatio(value);
      viewer.redrawVolumes();
    });
  };
  
  viewer.colorScaleUI = function(controls, volume, volID) {
    var colorScaleOption = $("<select></select>");
    var list = "";
    VolumeViewer.colorScales.forEach(function(scale, i) {
      list += "<option value=\"" + i + "\"" +
              (viewer.defaultScale === scale ? " SELECTED" : "") +
              ">" + scale.name + "</option>";
    });
    colorScaleOption.html(list);
    
    //On change update color scale of volume and redraw.
    colorScaleOption.change(function(event) {
      volume.colorScale = VolumeViewer.colorScales[+$(event.target).val()];
      viewer.redrawVolumes();
    });
    
    controls.append($("<div class=\"control-heading\" id=\"color-scale-heading"+volID+"\" >Color Scale: </div>").append(colorScaleOption));
  };
  
  viewer.thresholdUI = function(controls, volume, volID) {
    var thresh_slider = $('<div class="slider volume-viewer-threshold" id="threshold-slider'+volID+'"></div>');
    var thresholds = $("<div class=\"control-heading\" class=\"slider-div\">Threshold: </div>");
    var min_input = $('<input class="control-inputs thresh-input-left" value="0"/>');
    var max_input = $('<input class="control-inputs thresh-input-right" value="255"/>');
    var inputs = $('<div class="thresh-inputs"></div>');
    inputs.append(min_input).append(max_input);
    thresholds.append(inputs);
    
    controls.append(thresholds);
    thresholds.append(thresh_slider);
    
    thresh_slider.slider({
      range: true,
      min: 0,
      max: 255,
      values: [0, 255],
      step: 1,
      slide: function(event, ui){
        var values = ui.values;
        volume.min = values[0];
        volume.max = values[1];
        viewer.redrawVolumes();
        min_input.val(values[0]);
        max_input.val(values[1]);
      },
      stop: function() {
        $(this).find("a").blur();
      }
    });
        
    //change min value based on user input and update slider
    min_input.change(function () {
      var value = parseFloat(this.value);
      if (!BrainBrowser.utils.isNumeric(value)) {
        value = 0;
      }

      value = Math.max(0, Math.min(value, 255));

      this.value = value;
      thresh_slider.slider("values", 0, value);
      volume.min = value;
      viewer.redrawVolumes();
    });
    
    //change max value based on user input and update slider
    max_input.change(function () {
      var value = parseFloat(this.value);
      if (!BrainBrowser.utils.isNumeric(value)) {
        value = 255;
      }

      value = Math.max(0, Math.min(value, 255));

      this.value = value;
      thresh_slider.slider("values", 1, value);
      volume.max = value;
      viewer.redrawVolumes();
    });
  };
  
  viewer.timeUI = function(controls, volume, volID) {
    var time_controls = $("<div class=\"control-heading\" class=\"slider-div\">Time: </div>");
    var time_slider = $('<div class="slider volume-viewer-threshold" id="threshold-time-slider'+volID+'"></div>');
    var time_val = $("<input class=\"control-inputs\" value=\"0\" id =\"time-val\"/>");
    var play_button = $('<input type="checkbox" class="button" id="play-' + volID +'"><label for="play-' + volID + '">Play</label>');
    var min = 0;
    var max = volume.data.time.space_length - 1;
    var play_interval;
    
    time_slider.slider({
      min: min,
      max: max,
      value: 0,
      step: 1,
      slide: function(event, ui) {
        var value = +ui.value;
        time_val.val(value);
        volume.current_time = value;
        viewer.redrawVolumes();
      },
      stop: function() {
        $(this).find("a").blur();
      }
    });
    
    time_val.change(function () {
      var value = parseInt(this.value, 10);
      if (!BrainBrowser.utils.isNumeric(value)) {
        value = 0;
      }

      value = Math.max(min, Math.min(value, max));

      this.value = value;
      time_val.val(value);
      time_slider.slider("value", value);
      volume.current_time = value;
      viewer.redrawVolumes();
    });
    
    play_button.change(function() {
      if(play_button.is(":checked")){
        clearInterval(play_interval);
        play_interval = setInterval(function() {
          var value = volume.current_time + 1;
          value = value > max ? 0 : value;
          volume.current_time = value;
          time_val.val(value);
          time_slider.slider("value", value);
          viewer.redrawVolumes();
        }, 200);
      } else {
        clearInterval(play_interval);
      }
    });
    
    time_controls.append(time_val);
    time_controls.append(time_slider);
    controls.append(time_controls);
    controls.append(play_button);
  };
  
  viewer.sliceSeriesUI = function(controls, volume, volID) {
    var slice_controls = $("<div class=\"control-heading\" id=\"slice-series-heading"+volID+"\">All slices: </div>");
    var button_div = $("<div id=\"slice-series-buttons"+volID+"\"></div>");
    var xspace_button = $('<span class="slice-series button" data-axis="xspace" style="font-size: 11px">Sagittal</span>');
    var yspace_button = $('<span class="slice-series button" data-axis="yspace" style="font-size: 11px">Coronal</span>');
    var zspace_button = $('<span class="slice-series button" data-axis="zspace" style="font-size: 11px">Transverse</span>');
    var space_names = {
      xspace: "Sagittal",
      yspace: "Coronal",
      zspace: "Transverse"
    };
    
    button_div.append((xspace_button));
    button_div.append((yspace_button));
    button_div.append((zspace_button));

    button_div.find(".slice-series").click(function() {
      var axis_name = $(this).data("axis");
      var axis = volume.data[axis_name];
      var space_length = axis.space_length;
      var time = volume.current_time;
      var per_column = 10;
      var zoom = 0.5;
      var i, x, y;

      var canvas = document.createElement("canvas");
      var context = canvas.getContext("2d");
      var image_data = volume.slice(axis_name, 0, time).getImage(zoom);
      var img = new Image();
      canvas.width = per_column * image_data.width;
      canvas.height = (space_length / per_column + 1) * image_data.height;
      context.fillStyle = "#000000";
      context.fillRect(0, 0, canvas.width, canvas.height);

      for (i = 0; i < space_length; i++) {
        image_data = volume.slice(axis_name, i, time).getImage(zoom);
        x = i % per_column * image_data.width;
        y = Math.floor(i / per_column) * image_data.height;
        context.putImageData(image_data, x, y);
      }

      img.onload = function() {
        $("<div></div>").append(img).dialog({
          title: space_names[axis_name] + " Slices",
          height: 600,
          width: img.width
        });
      };
      
      img.src = canvas.toDataURL();
    });

    slice_controls.append(button_div);

    controls.append(slice_controls);
  };
};

