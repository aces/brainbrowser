/*
* BrainBrowser: Web-based Neurological Visualization Tools
* (https://brainbrowser.cbrain.mcgill.ca)
*
* Copyright (C) 2011 McGill University
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
* Author: Tarek Sherif  <tsherif@gmail.com> (http://tareksherif.ca/)
* Author: Nicolas Kassis
*/

// This script is meant to be a demonstration of how to
// use most of the functionality available in the
// BrainBrowser Surface Viewer.
$(function() {
  "use strict";
  
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
  if (!BrainBrowser.utils.webglEnabled()) {
    $("#brainbrowser").html(BrainBrowser.utils.webGLErrorMessage());
    return;
  }

  $.get("/assets/aal_label.txt", function(data) {
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
  BrainBrowser.SurfaceViewer.start("brainbrowser", function(viewer) {

    // Add the three.js 3D anaglyph effect to the viewer.
    viewer.addEffect("AnaglyphEffect");

    // Set up some defaults
    viewer.setAttribute("clamp_colors", true); // By default clamp range.
    viewer.setAttribute("flip_colors", false); // Don't flip intensity-color relationship.

    ///////////////////////////////////
    // Event Listeners
    ///////////////////////////////////

    // If something goes wrong while loading, we don't
    // want the loading icon to stay on the screen.
    viewer.addEventListener("error", hideLoading);

    // When a new color map is loaded display a spectrum representing
    // the color mapping.
    viewer.addEventListener("loadcolormap", function(color_map) {
      var canvas = color_map.createCanvasWithScale(0, 100);
      var spectrum_div = document.getElementById("color-bar");
      
      canvas.id = "spectrum-canvas";
      if (!spectrum_div) {
        $("<div id=\"color-bar\"></div>").html(canvas).appendTo("#data-range-box");
      } else {
        $(spectrum_div).html(canvas);
      }
    });

    // When a new model is added to the viewer, create a transparancy slider
    // for each shape that makes up the model.
    viewer.addEventListener("displaymodel", function(object) {
      var slider, slider_div;
      var children = object.children;
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
              var shape_name = $(target).attr('data-shape-name');
              var alpha = $(target).slider('value');
              alpha = Math.min(100, Math.max(0, alpha)) / 100.0;

              viewer.setTransparency(shape_name, alpha);
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
      $("#pick-value").html("");
      $("#pick-label").html("");
    });

    // When the intensity range changes, adjust the displayed spectrum.
    viewer.addEventListener("rangechange", function(intensity_data) {
      var canvas = viewer.color_map.createCanvasWithScale(intensity_data.range_min, intensity_data.range_max);
      canvas.id = "spectrum-canvas";
      $("#color-bar").html(canvas);
    });

    // When new intensity data is loaded, create all UI related to
    // controlling the relationship between the instensity data and
    // the color mapping (range, flip colors, clamp colors, fix range).
    viewer.addEventListener("loadintensitydata", function(intensity_data) {
      var container = $("#data-range");
      var headers = '<div id="data-range-multiple"><ul>';
      var controls = "";
      var i, count;
      var data_set = Array.isArray(intensity_data) ? intensity_data : [intensity_data];

      container.html("");
      for(i = 0, count = data_set.length; i < count; i++) {
        headers += '<li><a href="#data-file' + i + '">' + data_set[i].filename + '</a></li>';
        controls += '<div id="data-file' + i + '" class="box range-controls">';
        controls += 'Min: <input class="range-box" id="data-range-min" type="text" name="range_min" size="5" >';
        controls += '<div id="range-slider' + i + '" data-blend-index="' + i + '" class="slider"></div>';
        controls += 'Max: <input class="range-box" id="data-range-max" type="text" name="range_max" size="5">';
        controls += '<input type="checkbox" class="button" id="fix_range"' +
                    (viewer.getAttribute("fix_color_range") ? ' checked="true"' : '') +
                    '><label for="fix_range">Fix Range</label>';
        controls += '<input type="checkbox" class="button" id="clamp_range"' +
                    (viewer.getAttribute("clamp_colors") ? ' checked="true"' : '') +
                    '><label for="clamp_range">Clamp range</label>';
        controls += '<input type="checkbox" class="button" id="flip_range"' +
                    (viewer.getAttribute("flip_colors") ? ' checked="true"' : '') +
                    '><label for="flip_range">Flip Colors</label>';
        controls += '</div>';
      }
      headers += "</ul>";


      container.html(headers + controls + "</div>");
      $("#data-range-box").show();
      $("#color-map-box").show();
      container.find("#data-range-multiple").tabs();

      container.find(".range-controls").each(function(index, element) {
        var controls = $(element);
        var intensity_data = data_set[index];

        var data_min = BrainBrowser.utils.min(intensity_data.values);
        var data_max = BrainBrowser.utils.max(intensity_data.values);
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
            viewer.model_data.intensity_data = intensity_data;
            viewer.setIntensityRange(min, max);
          }
        });

        slider.slider('values', 0, parseFloat(range_min));
        slider.slider('values', 1, parseFloat(range_max));
        min_input.val(range_min);
        max_input.val(range_max);

        function inputRangeChange() {
          var min = parseFloat(min_input.val());
          var max = parseFloat(max_input.val());
          
          slider.slider('values', 0, min);
          slider.slider('values', 1, max);
          viewer.setIntensityRange(min, max, controls.find("#clamp_range").is(":checked"));
        }

        $("#data-range-min").change(inputRangeChange);
        $("#data-range-max").change(inputRangeChange);

        $("#fix_range").click(function() {
          viewer.setAttribute("fix_color_range", $(this).is(":checked"));
        });

        $("#clamp_range").change(function() {
          var min = parseFloat(min_input.val());
          var max = parseFloat(max_input.val());

          viewer.setAttribute("clamp_colors", $(this).is(":checked"));

          viewer.setIntensityRange(min, max);
        });


        $("#flip_range").change(function() {
          var min = parseFloat(min_input.val());
          var max = parseFloat(max_input.val());

          viewer.setAttribute("flip_colors", $(this).is(":checked"));

          viewer.setIntensityRange(min, max);
        });

        viewer.triggerEvent("rangechange", intensity_data);
      });

    }); // end loadintensitydata listener
    
    // If two color maps are loaded to be blended, create
    // slider to control the blending ratios.
    viewer.addEventListener("blendcolormaps", function(){
      var div = $("#blend-box");
      div.html("Blend Ratio: ");
      $("<span id=\"blend_value\">0.5</span>").appendTo(div);
      $("<div class=\"blend_slider\" id=\"blend_slider\" width=\"100px\" + height=\"10\"></div>").slider({
        min: 0.1,
        max: 0.99,
        value: 0.5,
        step: 0.01,
        slide: function() {
          viewer.blend($(this).slider("value"));
        }
      }).appendTo(div);
    });

    ////////////////////////////////////
    //  START RENDERING
    ////////////////////////////////////
    viewer.render();

    // Load a color map (required for displaying intensity data).
    viewer.loadColorMapFromURL(BrainBrowser.config.surface_viewer.color_maps[0].url);

    ///////////////////////////////////
    // UI
    ///////////////////////////////////

    // Some keyboard controls for the viewer.
    $("body").keydown(function(e) {
      var key_code = e.keyCode;
      var keys = {
        // Space
        32: function() { viewer.separateHalves(); },
        // Up arrow
        38: function() { viewer.zoom(1.1); },
        // Down arrow
        40: function() { viewer.zoom(1/1.1); }
      };
    
      if (keys.hasOwnProperty(key_code)) {
        keys[key_code]();
        return false;
      }

    });

    // Set the background color.
    $("#clear_color").change(function(e){
      viewer.setClearColor(parseInt($(e.target).val(), 16));
    });
    
    // Reset to the default view.
    $("#resetview").click(function() {
      // Setting the view to its current view type will
      // automatically reset its position.
      viewer.setView($("[name=hem_view]:checked").val());
    });

    // Set the visibility of the currently loaded model.
    $(".visibility").change(function() {
      var input  = $(this);
      var hemisphere = input.data("hemisphere");
      var shape = viewer.model.getObjectByName(hemisphere);

      if (!shape) return;

      // If the shapes wireframe is currently being displayed,
      // set the wireframe's visibility.
      if (shape.wireframe_active) {
        shape = shape.getObjectByName("__wireframe__") || shape;
      }

      shape.visible = input.is(":checked");
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
    $("#openImage").click(function() {
      var view_window = viewer.view_window;
      var canvas = document.createElement("canvas");
      var spectrum_canvas = document.getElementById("spectrum-canvas");
      var context = canvas.getContext("2d");
      var viewer_image = new Image();
      
      canvas.width = view_window.offsetWidth;
      canvas.height = view_window.offsetHeight;
    
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

    // Color map URLs are read from the config file and added to the
    // color map select box.
    var color_map_select = $('<select id="color-map-select"></select>').change(function() {
      viewer.loadColorMapFromURL($(this).val());
    });

    BrainBrowser.config.surface_viewer.color_maps.forEach(function(map) {
      color_map_select.append('<option value="' + map.url + '">' + map.name +'</option>');
    });

    $("#color-map-box").append(color_map_select);

    // Remove currently loaded models.
    $('#clearshapes').click(function() {
      viewer.clearScreen();
      current_request = 0;
      current_request_name = "";
      loading_div.hide();
    });

    $("#brainbrowser").click(function(event) {
      if (!event.shiftKey) return;
      if (!viewer.model_data) return;

      var offset = BrainBrowser.utils.getOffset(viewer.view_window);
      var x = event.clientX - offset.left + window.scrollX;
      var y = event.clientY - offset.top + window.scrollY;
      
      var pick_info = viewer.pick(x, y);
      var value, label, text;

      if (pick_info) {
        $("#pick-x").html(pick_info.point.x.toPrecision(4));
        $("#pick-y").html(pick_info.point.y.toPrecision(4));
        $("#pick-z").html(pick_info.point.z.toPrecision(4));
        $("#pick-index").html(pick_info.index);

        if (viewer.model_data.intensity_data) {
          value = viewer.model_data.intensity_data.values[pick_info.index];
          $("#pick-value").html(value);
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
      }
  
    });

    // Load demo models.
    $("#examples").click(function(e) {
      current_request++;
      
      var name = $(e.target).attr('data-example-name');
      var matrixRotX, matrixRotY;
      
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
          viewer.loadModelFromURL('/models/surf_reg_model_both.obj', {
            format: "mniobj",
            complete: function() {
              $("#vertex-data-wrapper").show();
              $("#pick-value-wrapper").show();
              $("#pick-label-wrapper").show();
              viewer.loadIntensityDataFromURL("/assets/aal_atlas.txt", {
                complete: hideLoading
              });
            },
            cancel: defaultCancelOptions(current_request),
            parse: { split: true }
          });
        },
        punkdti: function() {
          viewer.loadModelFromURL('/models/dti.obj', {
            format: "mniobj",
            render_depth: 999,
            complete: hideLoading,
            cancel: defaultCancelOptions(current_request)
          });
          viewer.loadModelFromURL('/models/left_color.obj', {
            format: "mniobj",
            cancel: defaultCancelOptions(current_request)
          });
          viewer.loadModelFromURL('/models/right_color.obj', {
            format: "mniobj",
            cancel: defaultCancelOptions(current_request)
          });
        },
        realct: function() {
          viewer.loadModelFromURL('/models/realct.obj', {
            format: "mniobj",
            parse: { split: true },
            complete: function() {
              $("#vertex-data-wrapper").show();
              $("#pick-value-wrapper").show();
              viewer.loadIntensityDataFromURL('/models/realct.txt', {
                name: "Cortical Thickness",
                complete: hideLoading,
                cancel: defaultCancelOptions(current_request)
              });
            },
            cancel: defaultCancelOptions(current_request)
          });
        },
        car: function() {
          viewer.loadModelFromURL('/models/car.obj', {
            format: "wavefrontobj",
            complete: function() {
              $("#vertex-data-wrapper").show();
              hideLoading();
            },
            cancel: defaultCancelOptions(current_request)
          });

          // This model is somewhat small so zoom in and
          // give it a dramatic angle.
          viewer.zoom(5);

          matrixRotX = new THREE.Matrix4();
          matrixRotX.makeRotationX(-0.25 * Math.PI);
          matrixRotY = new THREE.Matrix4();
          matrixRotY.makeRotationY(0.4 * Math.PI);

          viewer.model.applyMatrix(matrixRotY.multiply(matrixRotX));
        },
        plane: function() {
          viewer.loadModelFromURL('/models/dlr_bigger.streamlines.obj', {
            format: "mniobj",
            cancel: defaultCancelOptions(current_request)
          });
          viewer.loadModelFromURL('/models/dlr.model.obj', {
            format: "mniobj",
            complete: function() {
              $("#vertex-data-wrapper").show();
              hideLoading();
            },
            cancel: defaultCancelOptions(current_request)
          });

          // This model is somewhat small so zoom in and
          // give it a dramatic angle.
          viewer.zoom(7);

          matrixRotX = new THREE.Matrix4();
          matrixRotX.makeRotationX(-0.25 * Math.PI);
          matrixRotY = new THREE.Matrix4();
          matrixRotY.makeRotationY(0.4 * Math.PI);

          viewer.model.applyMatrix(matrixRotY.multiply(matrixRotX));
        },
        mouse: function() {
          viewer.loadModelFromURL('/models/mouse_surf.obj', {
            format: "mniobj",
            render_depth: 999,
            complete: function() {
              $("#vertex-data-wrapper").show();
              viewer.loadIntensityDataFromURL('/models/mouse_alzheimer_map.txt', {
                  name: 'Cortical Amyloid Burden, Tg AD Mouse, 18 Months Old',
                  shape: "mouse_surf.obj",
                  min: 0.0,
                  max: 0.25,
                  complete: hideLoading,
                  cancel: defaultCancelOptions(current_request)
                }
              );
            },
            cancel: defaultCancelOptions(current_request)
          });
          viewer.loadModelFromURL('/models/mouse_brain_outline.obj', {
            format: "mniobj",
            complete: function() {
              setTimeout(function() {
                // Set the transparency of the outer shell and move the slider
                // to the right position.
                $(".opacity-slider[data-shape-name='mouse_brain_outline.obj']").slider("value", 50);
                viewer.setTransparency('mouse_brain_outline.obj', 0.5);
              }, 0);
            },
            cancel: defaultCancelOptions(current_request)
          });

          // Smaller model so zoom in.
          viewer.zoom(11);
        },
        freesurfer: function() {
          viewer.loadModelFromURL('/models/lh.white.asc', {
            format: "freesurferasc",
            complete: function() {
              $("#vertex-data-wrapper").show();
              $("#pick-value-wrapper").show();
              viewer.loadIntensityDataFromURL("/models/lh.thickness.asc", {
                  format: "freesurferasc",
                  name: "Cortical Thickness",
                  complete: hideLoading,
                  cancel: defaultCancelOptions(current_request)
                }
              );
            },
            cancel: defaultCancelOptions(current_request)
          });
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
      div.find(".format-hint").html(BrainBrowser.config.surface_viewer.model_types[format].format_hint || "");
    });

    // Load a new model from a file that the user has
    // selected.
    $("#obj_file_submit").click(function() {
      var format = $(this).closest(".file-select").find("option:selected").val();
      viewer.loadModelFromFile(document.getElementById("objfile"), {
        format: format,
        before: showLoading,
        complete: hideLoading
      });

      return false;
    });

    $("#data1-submit").click(function() {
      var format = $(this).closest(".file-select").find("option:selected").val();
      var file = document.getElementById("datafile1");
      viewer.loadIntensityDataFromFile(file, {
        format: format,
        blend_index : 0
      });
    });

    $("#data2-submit").click(function() {
      var format = $(this).closest(".file-select").find("option:selected").val();
      var file = document.getElementById("datafile2");
      viewer.loadIntensityDataFromFile(file, {
        format: format,
        blend_index : 1
      });
    });

    // Load a selected intensity data file.
    // $(".datafile").change(function() {
    //   var filenum = parseInt(this.id.slice(-1), 10);
    //   viewer.loadIntensityDataFromFile(this, { blend_index : filenum - 1 });
    // });

    // Load a color map select by the user.
    $("#color-map").change(function() {
      viewer.loadColorMapFromFile(document.getElementById("color-map"));
    });

    // Load first model.
    $("a.example[data-example-name=atlas]").click();
  });
});

