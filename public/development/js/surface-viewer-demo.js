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
* @author: Nicolas Kassis
*/

$(function() {
  "use strict";
  
  var current_request = 0;
  var current_request_name = "";
  var loading_div = $("#loading");
  function showLoading() { loading_div.show(); }
  function hideLoading() { loading_div.hide(); }
  
  if (!BrainBrowser.utils.webglEnabled()) {
    $("#brainbrowser").html(BrainBrowser.utils.webGLErrorMessage());
    return;
  }

  BrainBrowser.SurfaceViewer.start("brainbrowser", function(viewer) {
 
    var color_map_select = $('<select id="color-map-select"></select>').change(function (e) {
      viewer.loadColorMapFromURL($(this).val());
    });

    BrainBrowser.config.surface_viewer.color_maps.forEach(function(map) {
      color_map_select.append('<option value="' + map.url + '">' + map.name +'</option>');
    });

    $("#color-map-box").append(color_map_select);

    //setting up some defaults
    viewer.clamped = true; //By default clamp range.
    viewer.flip = false;

    ///////////////////////////////////
    // Event Listeners
    ///////////////////////////////////

    viewer.addEventListener("error", hideLoading);

    viewer.addEventListener("loadcolormap", function (color_map) {
      var canvas = color_map.createCanvasWithScale(0, 100, null);
      var spectrum_div = document.getElementById("color-bar");
      
      canvas.id = "spectrum-canvas";
      if (!spectrum_div) {
        $("<div id=\"color-bar\"></div>").html(canvas).appendTo("#data-range-box");
      } else {
        $(spectrum_div).html(canvas);
      }
    });

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

    viewer.addEventListener("clearscreen", function() {
      $("#shapes").html("");
      $("#data-range-box").hide();
      $("#color-map-box").hide();
    });

    viewer.addEventListener("rangechange", function(intensity_data) {
      var canvas = viewer.color_map.createCanvasWithScale(intensity_data.rangeMin, intensity_data.rangeMax, null);
      canvas.id = "spectrum-canvas";
      $("#color-bar").html(canvas);
    });

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
        controls += '<input type="checkbox" class="button" id="fix_range"><label for="fix_range">Fix Range</label>';
        controls += '<input type="checkbox" class="button" id="clamp_range" checked="true"><label for="clamp_range">Clamp range</label>';
        controls += '<input type="checkbox" class="button" id="flip_range"><label for="flip_range">Flip Colors</label>';
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
        var range_min = intensity_data.rangeMin;
        var range_max = intensity_data.rangeMax;

        var min_input = controls.find("#data-range-min");
        var max_input = controls.find("#data-range-max");
        var slider = controls.find(".slider");

        slider.slider({
          range: true,
          min: range_min,
          max: range_max,
          values: [range_min, range_max],
          step: (range_max - range_min) / 100.0,
          slide: function(event, ui) {
            var min = ui.values[0];
            var max = ui.values[1];
            min_input.val(min);
            max_input.val(max);
            intensity_data.rangeMin = min;
            intensity_data.rangeMax = max;
            viewer.model_data.intensity_data = intensity_data;
            viewer.rangeChange(min, max, viewer.clamped);
          }
        });

        slider.slider('values', 0, parseFloat(range_min));
        slider.slider('values', 1, parseFloat(range_max));
        min_input.val(data_min);
        max_input.val(data_max);

        function inputRangeChange(e) {
          var min = parseFloat(min_input.val())
          var max = parseFloat(max_input.val())
          
          slider.slider('values', 0, min);
          slider.slider('values', 1, max);
          viewer.rangeChange(min, max, controls.find("#clamp_range").is(":checked"));
        }
        $("#data-range-min").change(inputRangeChange);
        $("#data-range-max").change(inputRangeChange);

        $("#fix_range").click(function(event) {
          viewer.fixRange = $(this).is(":checked");
        });

        $("#clamp_range").change(function(e) {
          var min = parseFloat(min_input.val());
          var max = parseFloat(max_input.val());

          if($(e.target).is(":checked")) {
            viewer.rangeChange(min, max, true);
          }else {
            viewer.rangeChange(min, max, false);
          }
        });


        $("#flip_range").change(function(e) {
          viewer.flip = $(this).is(":checked");
          viewer.updateColors(viewer.model_data.intensity_data, {
            min: range_min,
            max: range_max,
            color_map: viewer.color_map,
            flip: viewer.flip,
            clamped: viewer.clamped
          });
        });

        viewer.triggerEvent("rangechange", intensity_data);
      });

    }); // end loadintensitydata listener
    
    viewer.addEventListener("blendcolormaps", function(){
      var div = $("#blend-box");
      div.html("Blend Ratio: ");
      $("<span id=\"blend_value\">0.5</span>").appendTo(div);
      $("<div class=\"blend_slider\" id=\"blend_slider\" width=\"100px\" + height=\"10\"></div>")
        .slider({
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
    //  Start rendering the scene.
    ////////////////////////////////////
    viewer.render();

    viewer.loadColorMapFromURL(BrainBrowser.config.surface_viewer.color_maps[0].url);

    ///////////////////////////////////
    // UI
    ///////////////////////////////////

    $('#clearshapes').click(function() {
      viewer.clearScreen();
      current_request = 0;
      current_request_name = "";
      loading_div.hide();
    });

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
        basic: function() {
          viewer.loadModelFromURL('/models/surf_reg_model_both.obj', {
            format: "MNIObject",
            complete: hideLoading,
            cancel: defaultCancelOptions(current_request),
            parse: { split: true }
          });
        },
        punkdti: function() {
          viewer.loadModelFromURL('/models/dti.obj', {
            format: "MNIObject",
            render_depth: 999,
            complete: hideLoading,
            cancel: defaultCancelOptions(current_request)
          });
          viewer.loadModelFromURL('/models/left_color.obj', {
            format: "MNIObject",
            cancel: defaultCancelOptions(current_request)
          });
          viewer.loadModelFromURL('/models/right_color.obj', {
            format: "MNIObject",
            cancel: defaultCancelOptions(current_request)
          });
        },
        realct: function() {
          viewer.loadModelFromURL('/models/realct.obj', {
            format: "MNIObject",
            parse: { split: true },
            complete: function() {
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
            format: "WavefrontObj",
            complete: hideLoading,
            cancel: defaultCancelOptions(current_request)
          });
          viewer.setCamera(0, 0, 100);

          matrixRotX = new THREE.Matrix4();
          matrixRotX.makeRotationX(-0.25 * Math.PI);
          matrixRotY = new THREE.Matrix4();
          matrixRotY.makeRotationY(0.4 * Math.PI);

          viewer.model.applyMatrix(matrixRotY.multiply(matrixRotX));
        },
        plane: function() {
          viewer.loadModelFromURL('/models/dlr_bigger.streamlines.obj', {
            format: "MNIObject",
            cancel: defaultCancelOptions(current_request)
          });
          viewer.loadModelFromURL('/models/dlr.model.obj', {
            format: "MNIObject",
            complete: hideLoading,
            cancel: defaultCancelOptions(current_request)
          });
          viewer.setCamera(0, 0, 75);

          matrixRotX = new THREE.Matrix4();
          matrixRotX.makeRotationX(-0.25 * Math.PI);
          matrixRotY = new THREE.Matrix4();
          matrixRotY.makeRotationY(0.4 * Math.PI);

          viewer.model.applyMatrix(matrixRotY.multiply(matrixRotX));
        },
        mouse: function() {
          viewer.loadModelFromURL('/models/mouse_surf.obj', {
            format: "MNIObject",
            render_depth: 999,
            complete: function() {
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
            format: "MNIObject",
            complete: function() {
              setTimeout(function() {
                $(".opacity-slider[data-shape-name='mouse_brain_outline.obj']").slider("value", 50);
                viewer.setTransparency('mouse_brain_outline.obj', 0.5);
              }, 0);
            },
            cancel: defaultCancelOptions(current_request)
          });
          viewer.setCamera(0, 0, 40);
        }
      };
      
      if (examples.hasOwnProperty(name)) {
        examples[name]();
      }
      
      return false;
      
    });

    $("#obj_file_format").change(function () {
      var format = $("#obj_file_format").closest("#obj_file_select").find("#obj_file_format option:selected").val();
      $("#format_hint").html(BrainBrowser.config.surface_viewer.filetypes[format].format_hint || "");
    });

    $("#obj_file_submit").click(function () {
      var format = $("#obj_file_format").closest("#obj_file_select").find("#obj_file_format option:selected").val();
      viewer.loadModelFromFile(document.getElementById("objfile"), {
        format: format,
        beforeLoad: showLoading,
        complete: hideLoading
      });

      return false;
    });

    $(".datafile").change(function() {
      var filenum = parseInt(this.id.slice(-1), 10);
      viewer.loadIntensityDataFromFile(this, { blend_index : filenum - 1 });
    });

    $("#color-map").change(function() {
      viewer.loadColorMapFromFile(document.getElementById("color-map"));
    });

    // Load first model.
    $("a.example[data-example-name=realct]").click();
  });
});

