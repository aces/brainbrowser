/* 
* Copyright (C) 2011 McGill University
* 
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
*   the Free Software Foundation, either version 3 of the License, or
*  (at your option) any later version.
* 
*  This program is distributed in the hope that it will be useful,
*  but WITHOUT ANY WARRANTY; without even the implied warranty of
*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*  GNU General Public License for more details.
*
*  You should have received a copy of the GNU General Public License
*  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
* @author: Tarek Sherif
*/

$(function() {
  "use strict";
  
  BrainBrowser.VolumeViewer.start("brainbrowser", function(viewer) {
    var loading_div = $("#loading");
  
    viewer.addEventListener("ready", function() {
      $(".button").button();

      $("#sync-volumes").change(function() {
        viewer.synced = $(this).is(":checked");
      });

      $("#capture-slices").click(function() {
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

      $(".world-coords").change(function() {
        var div = $(this);
        var vol_id = div.data("volume-id");

        var x = parseFloat(div.find("#world-x-" + vol_id).val());
        var y = parseFloat(div.find("#world-y-" + vol_id).val());
        var z = parseFloat(div.find("#world-z-" + vol_id).val());
        if (!BrainBrowser.utils.isNumeric(x)) {
          x = 0;
        }
        if (!BrainBrowser.utils.isNumeric(y)) {
          y = 0;
        }
        if (!BrainBrowser.utils.isNumeric(z)) {
          z = 0;
        }

        viewer.volumes[vol_id].setWorldCoords(x, y, z);

        viewer.redrawVolumes();
      });

      $(".color-map-select").change(function(event) {
        var volume = viewer.volumes[$(this).data("volume-id")];
        volume.color_map = BrainBrowser.VolumeViewer.color_maps[+$(event.target).val()];
        viewer.redrawVolumes();
      });

      $(".threshold-div").each(function() {
        var div = $(this);
        var vol_id = div.data("volume-id");
        var volume = viewer.volumes[vol_id];

        var min_input = div.find("#min-threshold-" + vol_id);
        var max_input = div.find("#max-threshold-" + vol_id);
        var slider = div.find(".slider");

        slider.slider({
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

        min_input.change(function() {
          var value = parseFloat(this.value);
          if (!BrainBrowser.utils.isNumeric(value)) {
            value = 0;
          }

          value = Math.max(0, Math.min(value, 255));

          this.value = value;
          slider.slider("values", 0, value);
          volume.min = value;
          viewer.redrawVolumes();
        });

        max_input.change(function() {
          var value = parseFloat(this.value);
          if (!BrainBrowser.utils.isNumeric(value)) {
            value = 255;
          }

          value = Math.max(0, Math.min(value, 255));

          this.value = value;
          slider.slider("values", 1, value);
          volume.max = value;
          viewer.redrawVolumes();
        });

      });

      $(".time-div").each(function() {
        var div = $(this);
        var vol_id = div.data("volume-id");
        var volume = viewer.volumes[vol_id];
        
        var slider = div.find(".slider");
        var time_input = div.find("#time-val-" + vol_id);
        var play_button = div.find("#play-" + vol_id);

        var min = 0;
        var max = volume.data.time.space_length - 1;
        var play_interval;
    
        slider.slider({
          min: min,
          max: max,
          value: 0,
          step: 1,
          slide: function(event, ui) {
            var value = +ui.value;
            time_input.val(value);
            volume.current_time = value;
            viewer.redrawVolumes();
          },
          stop: function() {
            $(this).find("a").blur();
          }
        });
        
        time_input.change(function() {
          var value = parseInt(this.value, 10);
          if (!BrainBrowser.utils.isNumeric(value)) {
            value = 0;
          }

          value = Math.max(min, Math.min(value, max));

          this.value = value;
          time_input.val(value);
          slider.slider("value", value);
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
              time_input.val(value);
              slider.slider("value", value);
              viewer.redrawVolumes();
            }, 200);
          } else {
            clearInterval(play_interval);
          }
        });

      });

      $(".slice-series-div").each(function() {
        var div = $(this);
        var vol_id = div.data("volume-id");
        var volume = viewer.volumes[vol_id];

        var space_names = {
          xspace: "Sagittal",
          yspace: "Coronal",
          zspace: "Transverse"
        };

        div.find(".slice-series-button").click(function() {
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
      });


      loading_div.hide();
      $("#brainbrowser-wrapper").slideDown({duration: 600});
      $(".button").button();
    });

    // Update coordinate display as slices are updated
    // by the user.
    viewer.addEventListener("sliceupdate", function() {
      viewer.volumes.forEach(function(volume, vol_id) {
        var world_coords = volume.getWorldCoords();
        var voxel_coords = volume.getVoxelCoords();
        $("#world-x-" + vol_id).val(world_coords.x.toPrecision(6));
        $("#world-y-" + vol_id).val(world_coords.y.toPrecision(6));
        $("#world-z-" + vol_id).val(world_coords.z.toPrecision(6));

        $("#voxel-x-" + vol_id).val(voxel_coords.x.toPrecision(6));
        $("#voxel-y-" + vol_id).val(voxel_coords.y.toPrecision(6));
        $("#voxel-z-" + vol_id).val(voxel_coords.z.toPrecision(6));
      });
    });
    
    loading_div.show();

    viewer.loadVolumes({
      volumes: [
        {
          type: 'minc',
          header_url: "data/ibis_410023_LIVING_PHANTOM_STL_SD_HOS_20121212_SCAN1_ep2d_bold_001.mnc?minc_headers=true",
          raw_data_url: "data/ibis_410023_LIVING_PHANTOM_STL_SD_HOS_20121212_SCAN1_ep2d_bold_001.mnc?raw_data=true",
          template: {
            element_id: "volume-ui-template",
            viewer_insert_class: "volume-viewer-display"
          }
        },
        {
          type: 'minc',
          header_url: "data/ibis_410023_LIVING_PHANTOM_STL_SD_HOS_20121212_SCAN1_dti_001.mnc?minc_headers=true",
          raw_data_url: "data/ibis_410023_LIVING_PHANTOM_STL_SD_HOS_20121212_SCAN1_dti_001.mnc?raw_data=true",
          template: {
            element_id: "volume-ui-template",
            viewer_insert_class: "volume-viewer-display"
          }
        }
      ],
      panel_width: 256,
      panel_height: 256
    });
  });
});

