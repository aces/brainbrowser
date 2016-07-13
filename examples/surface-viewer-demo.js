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
// BrainBrowser Surface Viewer.
$(function() {
  "use strict";

  var THREE = BrainBrowser.SurfaceViewer.THREE;
  var atlas_labels = {};

  // Request variables used to cancel the current request
  // if another request is started.
  var current_request = 0;
  var current_request_name = "";

  // Hide or display loading icon.
  var loading_div = $("#loading");
  function showLoading() { loading_div.show(); }
  function hideLoading() { loading_div.hide(); }


  // Make sure WebGL is available.
  if (!BrainBrowser.WEBGL_ENABLED) {
    $("#brainbrowser").html(BrainBrowser.utils.webGLErrorMessage());
    return;
  }

  $.get("models/atlas-labels.txt", function(data) {
    var lines = data.split("\n");
    var regex = /'(.+)'\s+(\d+)/;

    lines.forEach(function(line) {
      var match = line.match(regex);
      if (match) {
        atlas_labels[match[2]] = match[1];
      }
    });
  });

  /////////////////////////////////////
  // Start running the Surface Viewer
  /////////////////////////////////////
  window.viewer = BrainBrowser.SurfaceViewer.start("brainbrowser", function(viewer) {

    var picked_object = null;

    // Add the three.js 3D anaglyph effect to the viewer.
    viewer.addEffect("AnaglyphEffect");

    ///////////////////////////////////
    // Event Listeners
    ///////////////////////////////////

    // If something goes wrong while loading, we don't
    // want the loading icon to stay on the screen.
    BrainBrowser.events.addEventListener("error", hideLoading);

    // When a new model is added to the viewer, create a transparancy slider
    // for each shape that makes up the model.
    viewer.addEventListener("displaymodel", function(event) {
      var slider, slider_div;
      var children = event.model.children;
      var current_count = $("#shapes").children().length;

      if(children.length - current_count > 0 ) {
        children.slice(current_count).forEach(function(shape, i) {
          slider_div = $("<div id=\"shape_" + i + "\" class=\"shape\">" +
            "<h4>Shape "+ (i + 1 + current_count) + "</h4>" +
            "Name: " + shape.name + "<br />" +
            "Opacity: " +
            "</div>");
          slider = $("<div class=\"opacity-slider slider\" data-shape-name=\"" + shape.name + "\"></div>");
          slider.slider({
            value: 100,
            min: -1,
            max: 101,
            slide: function(event) {
              var target = event.target;
              var shape_name = $(target).attr("data-shape-name");
              var alpha = $(target).slider("value");
              alpha = Math.min(100, Math.max(0, alpha)) / 100.0;

              viewer.setTransparency(alpha, {
                shape_name: shape_name
              });
            }
          });
          slider.appendTo(slider_div);
          slider_div.appendTo("#shapes");
        });
      }
    });

    // When the screen is cleared, remove all UI related
    // to the displayed models.
    viewer.addEventListener("clearscreen", function() {
      $("#shapes").html("");
      $("#data-range-box").hide();
      $("#color-map-box").hide();
      $("#vertex-data-wrapper").hide();
      $("#pick-value-wrapper").hide();
      $("#pick-label-wrapper").hide();
      $("#pick-x").html("");
      $("#pick-y").html("");
      $("#pick-z").html("");
      $("#pick-index").html("");
      $("#pick-value").val("");
      $("#pick-color").css("background-color", "transparent");
      $("#pick-label").html("");
      $("#intensity-data-export").hide();
      $("#annotation-media").html("");
      $("#annotation-display").hide();
      $("#annotation-wrapper").hide();
      viewer.annotations.reset();
      picked_object = null;
    });

    // When the intensity range changes, adjust the displayed spectrum.
    viewer.addEventListener("changeintensityrange", function(event) {
      var intensity_data = event.intensity_data;
      var canvas = viewer.color_map.createElement(intensity_data.range_min, intensity_data.range_max);
      canvas.id = "spectrum-canvas";
      $("#color-bar").html(canvas);
    });

    // When new intensity data is loaded, create all UI related to
    // controlling the relationship between the instensity data and
    // the color mapping (range, flip colors, clamp colors, fix range).
    viewer.addEventListener("loadintensitydata", function(event) {
      var model_data = event.model_data;
      var intensity_data = event.intensity_data;
      var container = $("#data-range");
      var headers = '<div id="data-range-multiple"><ul>';
      var controls = "";
      var i, count;
      var data_set = model_data.intensity_data;

      container.html("");
      for(i = 0, count = data_set.length; i < count; i++) {
        headers += '<li><a href="#data-file' + i + '">' + data_set[i].name + '</a></li>';
        controls += '<div id="data-file' + i + '" class="box range-controls">';
        controls += 'Min: <input class="range-box" id="data-range-min" type="text" name="range_min" size="5" >';
        controls += '<div id="range-slider' + i + '" data-blend-index="' + i + '" class="slider"></div>';
        controls += 'Max: <input class="range-box" id="data-range-max" type="text" name="range_max" size="5">';
        controls += '<input type="checkbox" class="button" id="fix_range"' +
                    (viewer.getAttribute("fix_color_range") ? ' checked="true"' : '') +
                    '><label for="fix_range">Fix Range</label>';
        controls += '<input type="checkbox" class="button" id="clamp_range"' +
                    (viewer.color_map && viewer.color_map.clamp ? ' checked="true"' : '') +
                    '><label for="clamp_range">Clamp range</label>';
        controls += '<input type="checkbox" class="button" id="flip_range"' +
                    (viewer.color_map && viewer.color_map.flip ? ' checked="true"' : '') +
                    '><label for="flip_range">Flip Colors</label>';
        controls += '</div>';
      }
      headers += "</ul>";


      container.html(headers + controls + "</div>");
      $("#data-range-box").show();
      $("#color-map-box").show();
      container.find("#data-range-multiple").tabs();

      container.find(".range-controls").each(function(index) {
        var controls = $(this);
        var intensity_data = data_set[index];

        var data_min = intensity_data.min;
        var data_max = intensity_data.max;
        var range_min = intensity_data.range_min;
        var range_max = intensity_data.range_max;
        var min_input = controls.find("#data-range-min");
        var max_input = controls.find("#data-range-max");
        var slider = controls.find(".slider");

        slider.slider({
          range: true,
          min: data_min,
          max: data_max,
          values: [range_min, range_max],
          step: (range_max - range_min) / 100.0,
          slide: function(event, ui) {
            var min = ui.values[0];
            var max = ui.values[1];
            min_input.val(min);
            max_input.val(max);
            intensity_data.range_min = min;
            intensity_data.range_max = max;

            viewer.setIntensityRange(intensity_data, min, max);
          }
        });

        slider.slider("values", 0, parseFloat(range_min));
        slider.slider("values", 1, parseFloat(range_max));
        min_input.val(range_min);
        max_input.val(range_max);

        function inputRangeChange() {
          var min = parseFloat(min_input.val());
          var max = parseFloat(max_input.val());

          slider.slider("values", 0, min);
          slider.slider("values", 1, max);
          viewer.setIntensityRange(intensity_data, min, max);
        }

        $("#data-range-min").change(inputRangeChange);
        $("#data-range-max").change(inputRangeChange);

        $("#fix_range").click(function() {
          viewer.setAttribute("fix_color_range", $(this).is(":checked"));
        });

        $("#clamp_range").change(function() {
          var min = parseFloat(min_input.val());
          var max = parseFloat(max_input.val());

          if (viewer.color_map) {
            viewer.color_map.clamp = $(this).is(":checked");
          }

          viewer.setIntensityRange(intensity_data, min, max);
        });


        $("#flip_range").change(function() {
          var min = parseFloat(min_input.val());
          var max = parseFloat(max_input.val());

          if (viewer.color_map) {
            viewer.color_map.flip = $(this).is(":checked");
          }

          viewer.setIntensityRange(intensity_data, min, max);
        });
      });

      $("#paint-value").val(intensity_data.values[0]);
      $("#paint-color").css("background-color", "#" + viewer.color_map.colorFromValue(intensity_data.values[0], {
        hex: true,
        min: intensity_data.range_min,
        max: intensity_data.range_max
      }));

      blendUI(data_set.length > 1);

    }); // end loadintensitydata listener

    viewer.addEventListener("updatecolors", function(event) {
      var model_data = event.model_data;
      var intensity_data = model_data.intensity_data[0];
      var value = parseFloat($("#pick-value").val());
      var spectrum_div = document.getElementById("color-bar");
      var min, max;
      var canvas;

      if (BrainBrowser.utils.isNumeric(value)) {
        $("#pick-color").css("background-color", "#" + viewer.color_map.colorFromValue(value, {
          hex: true,
          min: intensity_data.range_min,
          max: intensity_data.range_max
        }));
      }

      value = parseFloat($("#paint-value").val());

      if (BrainBrowser.utils.isNumeric(value)) {
        $("#paint-color").css("background-color", "#" + viewer.color_map.colorFromValue(value, {
          hex: true,
          min: intensity_data.range_min,
          max: intensity_data.range_max
        }));
      }

      if (model_data && intensity_data) {
        min = intensity_data.range_min;
        max = intensity_data.range_max;
      } else {
        min = 0;
        max = 100;
      }

      canvas = viewer.color_map.createElement(min, max);
      canvas.id = "spectrum-canvas";
      if (!spectrum_div) {
        $("<div id=\"color-bar\"></div>").html(canvas).appendTo("#data-range-box");
      } else {
        $(spectrum_div).html(canvas);
      }

    });

    viewer.addEventListener("updateintensitydata", function(event) {
      var intensity_data = event.intensity_data;
      var link = $("#intensity-data-export-link");
      var values = Array.prototype.slice.call(intensity_data.values);

      link.attr("href", BrainBrowser.utils.createDataURL(values.join("\n")));
      $("#intensity-data-export-link").attr("download", "intensity-values.txt");
      $("#intensity-data-export").show();
    });

    ////////////////////////////////////
    //  START RENDERING
    ////////////////////////////////////
    viewer.render();

    // Load a color map (required for displaying intensity data).
    viewer.loadColorMapFromURL(BrainBrowser.config.get("color_maps")[0].url);

    ///////////////////////////////////
    // UI
    ///////////////////////////////////

    // Set the background color.
    $("#clear_color").change(function(e){
      viewer.setClearColor(parseInt($(e.target).val(), 16));
    });

    // Reset to the default view.
    $("#resetview").click(function() {
      // Setting the view to its current view type will
      // automatically reset its position and opacity.
      viewer.setView($("[name=hem_view]:checked").val());

      // Reset all opacity sliders in the UI to 100%
      $(".opacity-slider").each(function(idx,opacity_slider) {
        $(opacity_slider).slider("value",100);
      });
    });

    // Set the visibility of the currently loaded model.
    $(".visibility").change(function() {
      var input  = $(this);
      var hemisphere = input.data("hemisphere");
      var shape = viewer.model.getObjectByName(hemisphere);

      if (!shape) return;

      shape.visible = input.is(":checked");
      viewer.updated = true;
    });

    // Set the view type (medial, lateral,
    // inferior, anterior, posterior).
    $("[name=hem_view]").change(function() {
      viewer.setView($("[name=hem_view]:checked").val());
    });

    // Toggle wireframe.
    $("#meshmode").change(function() {
      viewer.setWireframe($(this).is(":checked"));
    });

    // Toggle 3D anaglyph effect.
    $("#threedee").change(function() {
      viewer.setEffect($(this).is(":checked") ? "AnaglyphEffect" : "None");
    });

    // Grab a screenshot of the canvas.
    $("#screenshot").click(function() {
      var dom_element = viewer.dom_element;
      var canvas = document.createElement("canvas");
      var spectrum_canvas = document.getElementById("spectrum-canvas");
      var context = canvas.getContext("2d");
      var viewer_image = new Image();

      canvas.width = dom_element.offsetWidth;
      canvas.height = dom_element.offsetHeight;

      // Display the final image in a dialog box.
      function displayImage() {
        var result_image = new Image();

        result_image.onload = function() {
          $("<div></div>").append(result_image).dialog({
            title: "Screenshot",
            height: result_image.height,
            width: result_image.width
          });
        };

        result_image.src = canvas.toDataURL();
      }

      // Grab the spectrum canvas to display with the
      // image.
      function getSpectrumImage() {
        var spectrum_image = new Image();
        spectrum_image.onload = function(){
          context.drawImage(spectrum_image, 0, 0);
          displayImage();
        };
        spectrum_image.src = spectrum_canvas.toDataURL();
      }

      // Draw an image of the viewer area, add the spectrum
      // image it its available, and display everything
      // in a dialog box.
      viewer_image.onload = function(){
        context.drawImage(viewer_image, 0, 0);
        if ($(spectrum_canvas).is(":visible")) {
          getSpectrumImage();
        } else {
          displayImage();
        }
      };

      viewer_image.src = viewer.canvasDataURL();
    });

    // Control autorotation.
    $("#autorotate-controls").children().change(function() {
      viewer.autorotate.x = $("#autorotateX").is(":checked");
      viewer.autorotate.y = $("#autorotateY").is(":checked");
      viewer.autorotate.z = $("#autorotateZ").is(":checked");
    });

    // Control grid
    $("#grid-controls").children().change(function() {
      var grid_name = this.id;
      var grid = viewer.model.getObjectByName(grid_name);
      var rotation;
      var color_grid;
      var is_checked = $(this).is(":checked");

      // If the grid already exists
      if (grid !== undefined) {
        grid.visible   = is_checked;
        viewer.updated = true;
        return;
      }

      // Create and display the grid.
      rotation = new THREE.Euler();
      if (grid_name === "gridX") {
        rotation.set(0, 0, Math.PI/2, "XYZ");
        color_grid = 0x00ff00;
      }
      if (grid_name === "gridY") {
        rotation.set(0, Math.PI/2, 0, "XYZ");
        color_grid = 0x0000ff;
      }
      if (grid_name === "gridZ") {
        rotation.set(Math.PI/2, 0, 0, "XYZ");
        color_grid = 0xff0000;
      }

      viewer.drawGrid(100, 10, {euler_rotation: rotation, name: grid_name, color_grid: color_grid});

    });

    // Control Axes
    $("#axes-controls").change(function() {
      var axes_name  = this.id;
      var is_checked = $(this).is(":checked");
      var axes       = viewer.model.getObjectByName(axes_name);

      // If the axes already exists
      if (axes !== undefined) {
        axes.visible   = is_checked;
        viewer.updated = true;
        return;
      }

      viewer.drawAxes();

    });

    // Color map URLs are read from the config file and added to the
    // color map select box.
    var color_map_select = $('<select id="color-map-select"></select>').change(function() {
      viewer.loadColorMapFromURL($(this).val());
    });

    BrainBrowser.config.get("color_maps").forEach(function(color_map) {
      color_map_select.append('<option value="' + color_map.url + '">' + color_map.name +'</option>');
    });

    $("#color-map-box").append(color_map_select);

    // Remove currently loaded models.
    $("#clearshapes").click(function() {
      viewer.clearScreen();
      current_request = 0;
      current_request_name = "";
      loading_div.hide();
    });

    $("#centric_rotation").change(function(){
      var is_checked = $(this).is(":checked");
      if (!is_checked && $("#pick-x").html() === "" && $("#pick-y").html() === "" && $("#pick-z").html() === "") {return;}
      setCenterRotation();
    });

    $("#brainbrowser").click(function(event) {
      if (!event.shiftKey && !event.ctrlKey) return;
      if (viewer.model.children.length === 0) return;

      var annotation_display = $("#annotation-display");
      var media              = $("#annotation-media");
      var pick_info          = viewer.pick();
      var model_data, intensity_data;
      var annotation_info;
      var value, label, text;

      if (pick_info) {
        $("#pick-x").html(pick_info.point.x.toPrecision(4));
        $("#pick-y").html(pick_info.point.y.toPrecision(4));
        $("#pick-z").html(pick_info.point.z.toPrecision(4));
        $("#pick-index").html(pick_info.index);
        $("#annotation-wrapper").show();

        picked_object  = pick_info.object;
        model_data     = viewer.model_data.get(picked_object.userData.model_name);
        intensity_data = model_data.intensity_data[0];

        if (intensity_data) {
          if (event.ctrlKey) {
            value = parseFloat($("#paint-value").val());

            if (BrainBrowser.utils.isNumeric(value)) {
              viewer.setIntensity(intensity_data, pick_info.index, value);
            }
          }

          value = intensity_data.values[pick_info.index];
          $("#pick-value").val(value.toString().slice(0, 7));
          $("#pick-color").css("background-color", "#" + viewer.color_map.colorFromValue(value, {
            hex: true,
            min: intensity_data.range_min,
            max: intensity_data.range_max
          }));
          label = atlas_labels[value];
          if (label) {
            text = label + '<BR><a target="_blank" href="http://www.ncbi.nlm.nih.gov/pubmed/?term=' +
              label.split(/\s+/).join("+") +
              '">Search on PubMed</a>';
            text += '<BR><a target="_blank" href="http://scholar.google.com/scholar?q=' +
              label.split(/\s+/).join("+") +
              '">Search on Google Scholar</a>';
          } else {
            text = "None";
          }
          $("#pick-label").html(text);
        }

        if ($("#centric_rotation").is(":checked")) {
          if ($("#pick-x").html() === "" && $("#pick-y").html() === "" && $("#pick-z").html() === "") {return;}
          setCenterRotation();
        }

        annotation_info = pick_info.object.userData.annotation_info;

        if (annotation_info) {
          viewer.annotations.activate(annotation_info.vertex, {
            model_name: annotation_info.model_name
          });
        } else {
          annotation_info = { data : {} };
        }

        $("#annotation-image").val(annotation_info.data.image);
        $("#annotation-url").val(annotation_info.data.url);
        $("#annotation-text").val(annotation_info.data.text);

        annotation_display.hide();
        media.html("");

        if (annotation_info.data.image) {
          var image    = new Image();
          image.height = 200;
          image.src    = annotation_info.data.image;
          annotation_display.show();
          media.append(image);
        }
        if (annotation_info.data.url) {
          annotation_display.show();
          media.append($('<div><a href="' + annotation_info.data.url + '" target="_blank">' + annotation_info.data.url + '</a></div>'));
        }
        if (annotation_info.data.text) {
          annotation_display.show();
          media.append($('<div>' + annotation_info.data.text + '</div>'));
        }
      } else {
        $("#pick-x").html("");
        $("#pick-y").html("");
        $("#pick-z").html("");
        $("#pick-index").html("");
        $("#annotation-wrapper").hide();
      }

    });

    function setCenterRotation() {
      var offset = viewer.model.userData.model_center_offset || new THREE.Vector3(0,0,0);
      var center = new THREE.Vector3(parseFloat($("#pick-x").html()) + -offset.x, parseFloat($("#pick-y").html()) + -offset.y, parseFloat($("#pick-z").html()) + -offset.z);
      viewer.changeCenterRotation(center);
    }


    $("#pick-value").change(function() {
      var index = parseInt($("#pick-index").html(), 10);
      var value = parseFloat(this.value);
      var intensity_data = viewer.model_data.getDefaultIntensityData();

      if (BrainBrowser.utils.isNumeric(index) && BrainBrowser.utils.isNumeric(value)) {
        viewer.setIntensity(intensity_data, index, value);
      }
    });

    $("#paint-value").change(function() {
      var value = parseFloat(this.value);
      var intensity_data = viewer.model_data.getDefaultIntensityData();

      if (BrainBrowser.utils.isNumeric(value)) {
        $("#paint-color").css("background-color", "#" + viewer.color_map.colorFromValue(value, {
          hex: true,
          min: intensity_data.range_min,
          max: intensity_data.range_max
        }));
      }
    });

    $("#annotation-save").click(function() {
      var vertex_num         = parseInt($("#pick-index").html(), 10);
      var annotation_display = $("#annotation-display");
      var media              = $("#annotation-media");

      var annotation, annotation_data;
      var vertex;

      if (BrainBrowser.utils.isNumeric(vertex_num)) {
        annotation = viewer.annotations.get(vertex_num, {
          model_name: picked_object.model_name
        });

        if (annotation) {
          annotation_data = annotation.annotation_info.data;
        } else {
          annotation_data = {};
          viewer.annotations.add(vertex_num, annotation_data, {
            model_name: picked_object.model_name
          });
        }

        vertex = viewer.getVertex(vertex_num);

        annotation_data.image = $("#annotation-image").val();
        annotation_data.url   = $("#annotation-url").val();
        annotation_data.text  = $("#annotation-text").val();

        media.html("");

        if (annotation_data.image) {
          var image   = new Image();
          image.width = 200;
          image.src   = annotation_data.image;
          annotation_display.show();
          media.append(image);
        }
        if (annotation_data.url) {
          annotation_display.show();
          media.append($('<div><a href="' + annotation_data.url + '" target="_blank">' + annotation_data.url + '</a></div>'));
        }

        if (annotation_data.text) {
          annotation_display.show();
          media.append($('<div>' + annotation_data.text + '</div>'));
        }
      }
    });

    // Load demo models.
    $("#examples").click(function(e) {
      current_request++;

      var name = $(e.target).attr("data-example-name");
      var matrixRotX, matrixRotY, matrixRotZ;

      if (current_request_name === name) return;
      current_request_name = name;

      //Create a closure to compare current request number to number
      // at the time request was sent.
      function defaultCancelOptions(request_number) {
        return function() { return request_number !== current_request; };
      }

      loading_div.show();
      viewer.clearScreen();

      var examples = {
        atlas: function() {
          viewer.annotations.setMarkerRadius(1);
          viewer.loadModelFromURL("models/brain-surface.obj", {
            format: "mniobj",
            complete: function() {
              $("#vertex-data-wrapper").show();
              $("#pick-value-wrapper").show();
              $("#pick-label-wrapper").show();
              viewer.loadIntensityDataFromURL("models/atlas-values.txt", {
                complete: hideLoading
              });
            },
            cancel: defaultCancelOptions(current_request),
            parse: { split: true }
          });
        },
        dti: function() {
          viewer.loadModelFromURL("models/dti.obj", {
            format: "mniobj",
            render_depth: 999,
            complete: hideLoading,
            cancel: defaultCancelOptions(current_request)
          });
          viewer.loadModelFromURL("models/left-color-mesh.obj", {
            format: "mniobj",
            recenter: true,
            cancel: defaultCancelOptions(current_request)
          });
          viewer.loadModelFromURL("models/right-color-mesh.obj", {
            format: "mniobj",
            recenter: true,
            cancel: defaultCancelOptions(current_request)
          });
        },
        cortical_thickness: function() {
          viewer.annotations.setMarkerRadius(1);
          viewer.loadModelFromURL("models/brain-surface.obj", {
            format: "mniobj",
            parse: { split: true },
            complete: function() {
              $("#vertex-data-wrapper").show();
              $("#pick-value-wrapper").show();
              viewer.loadIntensityDataFromURL("models/cortical-thickness.txt", {
                name: "Cortical Thickness",
                complete: hideLoading,
                cancel: defaultCancelOptions(current_request)
              });
            },
            cancel: defaultCancelOptions(current_request)
          });
        },
        blend: function() {
          viewer.annotations.setMarkerRadius(1);
          viewer.loadModelFromURL("models/brain-surface.obj", {
            format: "mniobj",
            parse: { split: true },
            complete: function() {
              $("#vertex-data-wrapper").show();
              $("#pick-value-wrapper").show();
              viewer.loadIntensityDataFromURL("models/cortical-thickness.txt", {
                name: "Cortical Thickness",
                complete: hideLoading,
                cancel: defaultCancelOptions(current_request),
                blend: true
              });
              viewer.loadIntensityDataFromURL("models/atlas-values.txt", {
                complete: hideLoading,
                cancel: defaultCancelOptions(current_request),
                blend: true
              });
            },
            cancel: defaultCancelOptions(current_request)
          });
        },
        car: function() {
          viewer.annotations.setMarkerRadius(0.3);
          viewer.loadModelFromURL("models/car.obj", {
            format: "wavefrontobj",
            complete: function() {
              $("#vertex-data-wrapper").show();
              hideLoading();
            },
            cancel: defaultCancelOptions(current_request)
          });

          // This model is somewhat small so zoom in and
          // give it a dramatic angle.
          viewer.zoom = 5;

          matrixRotX = new THREE.Matrix4();
          matrixRotX.makeRotationX(-0.25 * Math.PI);
          matrixRotY = new THREE.Matrix4();
          matrixRotY.makeRotationY(0.4 * Math.PI);

          viewer.model.applyMatrix(matrixRotY.multiply(matrixRotX));
        },
        freesurferbin: function() {
          viewer.annotations.setMarkerRadius(1);
          viewer.loadModelFromURL("models/freesurfer-binary-surface", {
            format: "freesurferbin",
            complete: function() {
              $("#vertex-data-wrapper").show();
              $("#pick-value-wrapper").show();
              viewer.loadIntensityDataFromURL("models/freesurfer-binary-thickness", {
                  format: "freesurferbin",
                  name: "Cortical Thickness",
                  complete: hideLoading,
                  cancel: defaultCancelOptions(current_request)
                }
              );
            },
            cancel: defaultCancelOptions(current_request)
          });
        },
        freesurferasc: function() {
          viewer.annotations.setMarkerRadius(1);
          viewer.loadModelFromURL("models/freesurfer-surface.asc", {
            format: "freesurferasc",
            complete: function() {
              $("#vertex-data-wrapper").show();
              $("#pick-value-wrapper").show();
              viewer.loadIntensityDataFromURL("models/freesurfer-thickness.asc", {
                  format: "freesurferasc",
                  name: "Cortical Thickness",
                  complete: hideLoading,
                  cancel: defaultCancelOptions(current_request)
                }
              );
            },
            cancel: defaultCancelOptions(current_request)
          });
        },
        dbs: function() {
          viewer.annotations.setMarkerRadius(0.3);

          viewer.loadModelFromURL("models/dbs.json", {
            format: "json",
            complete: function() {
              var i;

              hideLoading();
              $("#vertex-data-wrapper").show();

              for (i = 17; i <= 93; i++) {
                viewer.setTransparency(0.5, {
                  shape_name: "dbs.json_" + i
                });
              }

              viewer.setTransparency(0.2, {
                shape_name: "dbs.json_24"
              });
              viewer.setTransparency(0.2, {
                shape_name: "dbs.json_25"
              });
              viewer.setTransparency(0.2, {
                shape_name: "dbs.json_62"
              });
              viewer.setTransparency(0.2, {
                shape_name: "dbs.json_63"
              });
            },
            cancel: defaultCancelOptions(current_request)
          });

          viewer.loadModelFromURL("models/dbs-fibers.json", {
            format: "json",
            cancel: defaultCancelOptions(current_request)
          });

          viewer.loadModelFromURL("models/dbs-vat.json", {
            format: "json",
            cancel: defaultCancelOptions(current_request)
          });

          viewer.zoom = 1.8;

          matrixRotX = new THREE.Matrix4();
          matrixRotX.makeRotationX(-0.5 * Math.PI);
          matrixRotY = new THREE.Matrix4();
          matrixRotY.makeRotationY(-0.8 * Math.PI);
          matrixRotZ = new THREE.Matrix4();
          matrixRotZ.makeRotationZ(-0.1 * Math.PI);

          viewer.model.applyMatrix(matrixRotY.multiply(matrixRotZ.multiply(matrixRotX)));
        }
      };

      if (examples.hasOwnProperty(name)) {
        examples[name]();
      }

      return false;
    });

    // If the user changes the format that's being submitted,
    // display a hint if one has been configured.
    $(".file-format").change(function() {
      var div = $(this).closest(".file-select");
      var format = div.find("option:selected").val();
      var config_base = this.id === "data-file-format" ? "intensity_data_types" : "model_types";

      div.find(".format-hint").html(BrainBrowser.config.get(config_base + "." + format).format_hint || "");
    });

    // Load a new model from a file that the user has
    // selected.
    $("#obj_file_submit").click(function() {
      var format = $(this).closest(".file-select").find("option:selected").val();
      $('#centric_rotation').prop('checked', false);
      viewer.model.userData.model_center_offset = undefined;
      showLoading();
      viewer.loadModelFromFile(document.getElementById("objfile"), {
        format: format,
        complete: function() {
          viewer.modelCentric();
          $("#vertex-data-wrapper").show();
          $("#pick-value-wrapper").show();
          $("#pick-label-wrapper").show();
          hideLoading();
        }
      });

      return false;
    });

    $("#data-submit").click(function() {
      var format = $(this).closest(".file-select").find("option:selected").val();
      var file = document.getElementById("datafile");
      viewer.loadIntensityDataFromFile(file, {
        format: format,
        blend: true
      });
    });

    // Load a color map select by the user.
    $("#color-map").change(function() {
      viewer.loadColorMapFromFile(this);
    });

    $(window).resize(function() {
      viewer.updateViewport();
    });

    // Load first model.
    $("a.example[data-example-name=atlas]").click();

    // If two color maps are loaded to be blended, create
    // slider to control the blending ratios.
    function blendUI(show){
      var div = $("#blend-box");

      div.html("");

      if (!show) {
        return;
      }

      var blend_text = $("<span id=\"blend_value\">0.5</span>");

      div.html("Blend Ratio: ");
      blend_text.appendTo(div);
      $("<div class=\"blend_slider\" id=\"blend_slider\" width=\"100px\" + height=\"10\"></div>").slider({
        min: 0.1,
        max: 0.99,
        value: 0.5,
        step: 0.01,
        slide: function() {
          var value = $(this).slider("value");
          viewer.blend(value);
          blend_text.html(value);
        }
      }).appendTo(div);
    }

  });
});

