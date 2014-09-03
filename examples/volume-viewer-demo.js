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

// This script is meant to be a demonstration of how to
// use most of the functionality available in the
// BrainBrowser Volume Viewer.
$(function() {
  "use strict";
  
  $(".button").button();

  /////////////////////////////////////
  // Start running the Volume Viewer
  /////////////////////////////////////
  window.viewer = BrainBrowser.VolumeViewer.start("brainbrowser", function(viewer) {
    var loading_div = $("#loading");

    ///////////////////////////
    // Set up global UI hooks.
    ///////////////////////////

    $("#volume-type").change(function() {
      $("#sync-volumes-wrapper").hide();
      $("#volume-file").hide();

      if ($(this).val() === "functional") {
        viewer.clearVolumes();
        viewer.loadVolume({
          type: "minc",
          header_url: "models/functional.mnc.header",
          raw_data_url: "models/functional.mnc.raw",
          template: {
            element_id: "volume-ui-template",
            viewer_insert_class: "volume-viewer-display"
          }
        }, function() {
          $(".slice-display").css("display", "inline");
          $(".volume-controls").css("width", "auto");
        });
      } else if ($(this).val() === "structural") {
        $("#sync-volumes-wrapper").show();
        viewer.clearVolumes();
        viewer.loadVolumes({
          volumes: [
            {
              type: "minc",
              header_url: "models/structural1.mnc.header",
              raw_data_url: "models/structural1.mnc.raw",
              template: {
                element_id: "volume-ui-template",
                viewer_insert_class: "volume-viewer-display"
              }
            },
            {
              type: 'minc',
              header_url: "models/structural2.mnc.header",
              raw_data_url: "models/structural2.mnc.raw",
              template: {
                element_id: "volume-ui-template",
                viewer_insert_class: "volume-viewer-display"
              }
            }
          ],
          overlay: {
            template: {
              element_id: "overlay-ui-template",
              viewer_insert_class: "overlay-viewer-display"
            }
          }
        });
      } else {
        $("#volume-file").show();
        viewer.clearVolumes();
      }
    });

    // Change viewer panel canvas size.
    $("#panel-size").change(function() {
      var size = parseInt($(this).val(), 10);

      viewer.setPanelSize(size, size, { scale_image: true });
    });

    // Should cursors in all panels be synchronized?
    $("#sync-volumes").change(function() {
      var synced = $(this).is(":checked");
      if (synced) {
        viewer.resetDisplays();
        viewer.redrawVolumes();
      }
      
      viewer.synced = synced;
    });

    // This will create an image of all the display panels
    // currently being shown in the viewer.
    $("#screenshot").click(function() {
      var width = viewer.panel_width;
      var height = viewer.panel_height;
      var active_canvas = viewer.active_canvas;
      
      // Create a canvas on which we'll draw the images.
      var canvas = document.createElement("canvas");
      var context = canvas.getContext("2d");
      var img = new Image();
      
      canvas.width = width * viewer.volumes.length;
      canvas.height = height * 3;
      context.fillStyle = "#000000";
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // The active canvas is highlighted by the viewer,
      // so we set it to null and redraw the highlighting
      // isn't shown in the image.
      viewer.active_canvas = null;
      viewer.draw();
      viewer.volumes.forEach(function(volume, x) {
        volume.display.forEach(function(panel, y) {
          context.drawImage(panel.canvas, x * width, y * height);
        });
      });

      // Restore the active canvas.
      viewer.active_canvas = active_canvas;
      viewer.draw();
      
      // Show the created image in a dialog box.
      img.onload = function() {
        $("<div></div>").append(img).dialog({
          title: "Slices",
          height: img.height,
          width: img.width
        });
      };

      img.src = canvas.toDataURL();
    });

    // Load a new model from a file that the user has
    // selected.
    $("#volume-file-submit").click(function() {
      viewer.loadVolume({
        type: "minc",
        header_file: document.getElementById("header-file"),
        raw_data_file: document.getElementById("raw-data-file"),
        template: {
          element_id: "volume-ui-template",
          viewer_insert_class: "volume-viewer-display"
        }
      }, function() {
        $(".slice-display").css("display", "inline");
        $(".volume-controls").css("width", "auto");
      });
    });

    //////////////////////////////////
    // Per volume UI hooks go in here.
    //////////////////////////////////
    viewer.addEventListener("volumeuiloaded", function(container, volume, vol_id) {
      container = $(container);

      container.find(".button").button();

      // The world coordinate input fields.
      container.find(".world-coords").change(function() {
        var div = $(this);

        var x = parseFloat(div.find("#world-x-" + vol_id).val());
        var y = parseFloat(div.find("#world-y-" + vol_id).val());
        var z = parseFloat(div.find("#world-z-" + vol_id).val());
        
        // Make sure the values are numeric.
        if (!BrainBrowser.utils.isNumeric(x)) {
          x = 0;
        }
        if (!BrainBrowser.utils.isNumeric(y)) {
          y = 0;
        }
        if (!BrainBrowser.utils.isNumeric(z)) {
          z = 0;
        }

        // Set coordinates and redraw.
        viewer.volumes[vol_id].setWorldCoords(x, y, z);

        viewer.redrawVolumes();
      });

      // The world coordinate input fields.
      container.find(".voxel-coords").change(function() {
        var div = $(this);

        var x = parseInt(div.find("#voxel-x-" + vol_id).val(), 10);
        var y = parseInt(div.find("#voxel-y-" + vol_id).val(), 10);
        var z = parseInt(div.find("#voxel-z-" + vol_id).val(), 10);
        
        // Make sure the values are numeric.
        if (!BrainBrowser.utils.isNumeric(x)) {
          x = 0;
        }
        if (!BrainBrowser.utils.isNumeric(y)) {
          y = 0;
        }
        if (!BrainBrowser.utils.isNumeric(z)) {
          z = 0;
        }

        // Set coordinates and redraw.
        viewer.volumes[vol_id].setVoxelCoords(x, y, z);

        viewer.redrawVolumes();
      });

      // Color map URLs are read from the config file and added to the
      // color map select box.
      var color_map_select = $('<select id="color-map-select"></select>').change(function() {
        var selection = $(this).find(":selected");

        viewer.loadVolumeColorMapFromURL(vol_id, selection.val(), selection.data("cursor-color"), function() {
          viewer.redrawVolumes();
        });
      });

      BrainBrowser.config.get("color_maps").forEach(function(color_map) {
        color_map_select.append('<option value="' + color_map.url +
          '" data-cursor-color="' + color_map.cursor_color + '">' +
          color_map.name +'</option>'
        );
      });

      $("#color-map-" + vol_id).append(color_map_select);

      // Load a color map select by the user.
      container.find(".color-map-file").change(function() {
        viewer.loadVolumeColorMapFromFile(vol_id, this, "#FF0000", function() {
          viewer.redrawVolumes();
        });
      });

      // Change the range of intensities that will be displayed.
      container.find(".threshold-div").each(function() {
        var div = $(this);

        // Input fields to input min and max thresholds directly.
        var min_input = div.find("#min-threshold-" + vol_id);
        var max_input = div.find("#max-threshold-" + vol_id);

        // Slider to modify min and max thresholds.
        var slider = div.find(".slider");

        slider.slider({
          range: true,
          min: 0,
          max: 255,
          values: [0, 255],
          step: 1,
          slide: function(event, ui){
            var values = ui.values;

            // Update the input fields.
            min_input.val(values[0]);
            max_input.val(values[1]);

            // Update the volume and redraw.
            volume.min = values[0];
            volume.max = values[1];
            viewer.redrawVolumes();
          },
          stop: function() {
            $(this).find("a").blur();
          }
        });

        // Input field for minimum threshold.
        min_input.change(function() {
          var value = parseFloat(this.value);
          
          // Make sure input is numeric and in range.
          if (!BrainBrowser.utils.isNumeric(value)) {
            value = 0;
          }
          value = Math.max(0, Math.min(value, 255));
          this.value = value;

          // Update the slider.
          slider.slider("values", 0, value);

          // Update the volume and redraw.
          volume.min = value;
          viewer.redrawVolumes();
        });

        max_input.change(function() {
          var value = parseFloat(this.value);
          
          // Make sure input is numeric and in range.
          if (!BrainBrowser.utils.isNumeric(value)) {
            value = 255;
          }
          value = Math.max(0, Math.min(value, 255));
          this.value = value;

          // Update the slider.
          slider.slider("values", 1, value);
          
          // Update the volume and redraw.
          volume.max = value;
          viewer.redrawVolumes();
        });

      });

      container.find(".time-div").each(function() {
        var div = $(this);

        if (volume.data.time) {
          div.show();
        } else {
          return;
        }
        
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

      // Create an image of all slices in a certain
      // orientation.
      container.find(".slice-series-div").each(function() {
        var div = $(this);

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

          // Canvas on which to draw the images.
          var canvas = document.createElement("canvas");
          var context = canvas.getContext("2d");

          // Get first slice to set dimensions of the canvas.
          var image_data = volume.slice(axis_name, 0, time).getImage(zoom);
          var img = new Image();
          canvas.width = per_column * image_data.width;
          canvas.height = Math.ceil(space_length / per_column) * image_data.height;
          context.fillStyle = "#000000";
          context.fillRect(0, 0, canvas.width, canvas.height);

          // Draw the slice on the canvas.
          context.putImageData(image_data, 0, 0);

          // Draw the rest of the slices on the canvas.
          for (i = 1; i < space_length; i++) {
            image_data = volume.slice(axis_name, i, time).getImage(zoom);
            x = i % per_column * image_data.width;
            y = Math.floor(i / per_column) * image_data.height;
            context.putImageData(image_data, x, y);
          }

          // Retrieve image from canvas and display it
          // in a dialog box.
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

      // Blend controls for a multivolume overlay.
      container.find(".blend-div").each(function() {
        var div = $(this);
        var slider = div.find(".slider");
        var blend_input = div.find("#blend-val");

        // Slider to select blend value.
        slider.slider({
          min: 0,
          max: 1,
          step: 0.01,
          value: 0.5,
          slide: function(event, ui) {
            var value = parseFloat(ui.value);
            volume.blend_ratios[0] = 1 - value;
            volume.blend_ratios[1] = value;
            


            blend_input.val(value);
            viewer.redrawVolumes();
          },
          stop: function() {
            $(this).find("a").blur();
          }
        });
        
        // Input field to select blend values explicitly.
        blend_input.change(function() {
          var value = parseFloat(this.value);
          
          // Check that input is numeric and in range.
          if (!BrainBrowser.utils.isNumeric(value)) {
            value = 0;
          }
          value = Math.max(0, Math.min(value, 1));
          this.value = value;

          // Update slider and redraw volumes.
          slider.slider("value", value);
          volume.blend_ratios[0] = 1 - value;
          volume.blend_ratios[1] = value;
          viewer.redrawVolumes();
        });
      });

       /////////////////////////////////////////////////////
      // UI updates to be performed after each slice update.
      //////////////////////////////////////////////////////
      volume.addEventListener("sliceupdate", function() {
        var world_coords = volume.getWorldCoords();
        var voxel_coords = volume.getVoxelCoords();
        var value;
        
        $("#world-x-" + vol_id).val(world_coords.x.toPrecision(6));
        $("#world-y-" + vol_id).val(world_coords.y.toPrecision(6));
        $("#world-z-" + vol_id).val(world_coords.z.toPrecision(6));

        $("#voxel-x-" + vol_id).val(parseInt(voxel_coords.x, 10));
        $("#voxel-y-" + vol_id).val(parseInt(voxel_coords.y, 10));
        $("#voxel-z-" + vol_id).val(parseInt(voxel_coords.z, 10));

        value = volume.getIntensityValue();
        $("#intensity-value-" + vol_id)
        .css("background-color", "#" + volume.color_map.colorFromValue(value, {
          format: "hex",
          min: volume.min,
          max: volume.max
        }))
        .html(Math.floor(value));
        
        if (volume.data && volume.data.time) {
          $("#time-slider-" + vol_id).slider("option", "value", volume.current_time);
          $("#time-val-" + vol_id).val(volume.current_time);
        }
      });
    });

    var color_map_config = BrainBrowser.config.get("color_maps")[0];

    loading_div.show();

    //////////////////////////////
    // Load the default color map.
    //////////////////////////////
    viewer.loadDefaultColorMapFromURL(color_map_config.url, color_map_config.cursor_color);

    ////////////////////////////////////////
    // Set the size of slice display panels.
    ////////////////////////////////////////
    viewer.setDefaultPanelSize(256, 256);

    ///////////////////
    // Start rendering.
    ///////////////////
    viewer.render();

    /////////////////////
    // Load the volumes.
    /////////////////////
    viewer.loadVolumes({
      volumes: [
        {
          type: "minc",
          header_url: "models/structural1.mnc.header",
          raw_data_url: "models/structural1.mnc.raw",
          template: {
            element_id: "volume-ui-template",
            viewer_insert_class: "volume-viewer-display"
          }
        },
        {
          type: 'minc',
          header_url: "models/structural2.mnc.header",
          raw_data_url: "models/structural2.mnc.raw",
          template: {
            element_id: "volume-ui-template",
            viewer_insert_class: "volume-viewer-display"
          }
        }
      ],
      overlay: {
        template: {
          element_id: "overlay-ui-template",
          viewer_insert_class: "overlay-viewer-display"
        }
      },
      complete: function() {
        loading_div.hide();
        $("#brainbrowser-wrapper").slideDown({duration: 600});
      }
    });

  });

});

