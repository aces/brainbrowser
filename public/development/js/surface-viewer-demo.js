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


$(function() {
  "use strict";
  
  var current_request = 0;
  var current_request_name = "";
  var loading_div = $("#loading");
  
  if (!BrainBrowser.utils.webglEnabled()) {
    $("#brainbrowser").html(BrainBrowser.utils.webGLErrorMessage());
    return;
  }

  BrainBrowser.SurfaceViewer.start("brainbrowser", function(viewer) {
 
    //setting up some defaults
    viewer.clamped = true; //By default clamp range.
    viewer.flip = false;

    ///////////////////////////////////
    // Event Listeners
    ///////////////////////////////////

    viewer.addEventListener("loadspectrum", function (spectrum) {
      var canvas = spectrum.createSpectrumCanvasWithScale(0, 100, null);
      var spectrum_div = document.getElementById("color-bar");
      
      canvas.id = "spectrum-canvas";
      if (!spectrum_div) {
        $("<div id=\"color-bar\"></div>").html(canvas).appendTo("#data-range-box");
      } else {
        $(spectrum_div).html(canvas);
      }

      viewer.spectrumObj = spectrum;
    });

    viewer.addEventListener("displayobject", function(object) {
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
          slider = $("<div class=\"opacity-slider slider\"  data-shape-name=\"" + shape.name + "\"></div>");
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
    });

    viewer.addEventListener("rangechange", function(min, max) {
      $("#data-range-min").val(min);
      $("#data-range-max").val(max);
      var canvas = viewer.spectrumObj.createSpectrumCanvasWithScale(min, max, null);
      canvas.id = "spectrum-canvas";
      $("#color-bar").html($(canvas));
    });

    viewer.addEventListener("loaddata", function(min, max, data, multiple) {
      var rangeBox = $("#data-range");
      var headers = "<div id=\"data-range-multiple\"><ul>";
      var controls = "";
      data = Array.isArray(data) ? data : [data];
      var i, count;
      rangeBox.html("");
      for(i = 0, count = data.length; i < count; i++) {
        headers += "<li><a href=\"#data_file" + i + "\">" + data[i].fileName + "</a></li>";
        controls += "<div id=\"data_file" + i + "\" class=\"box\">";
        controls += "Min: <input class=\"range-box\" id=\"data-range-min\" type=\"text\" name=\"range_min\" size=\"5\" >";
        controls += "<div id=\"range-slider+" + i + "\" data-blend-index=\"" + i + "\" class=\"slider\"></div>";
        controls += "Max: <input class=\"range-box\" id=\"data-range-max\" type=\"text\" name=\"range_max\" size=\"5\" >";
        controls += "<input type=\"checkbox\" class=\"button\" id=\"fix_range\"><label for=\"fix_range\">Fix Range</label>";
        controls += "<input type=\"checkbox\" class=\"button\" id=\"clamp_range\" checked=\"true\"><label for=\"clamp_range\">Clamp range</label>";
        controls += "<input type=\"checkbox\" class=\"button\" id=\"flip_range\"><label for=\"flip_range\">Flip Colors</label>";
        controls += "</div>";
      }
      headers += "</ul>";


      rangeBox.html(headers + controls + "</div>");
      $("#data-range-box").show();
      rangeBox.find("#data-range-multiple").tabs();

      $("#data-range").find(".slider").each(function(index, element) {
        var min = BrainBrowser.utils.min(data[0].values);
        var max = BrainBrowser.utils.max(data[0].values);
        $(element).slider({
          range: true,
          min: min,
          max: max,
          values: [data[index].rangeMin,data[index].rangeMax],
          step: (max - min) / 100.0,
          slide: function(event, ui) {
            $("#data-range-min").val(ui.values[0]);
            $("#data-range-max").val(ui.values[1]);
            loading_div.show();
            data[0].rangeMin = ui.values[0];
            data[0].rangeMax = ui.values[1];
            viewer.model_data.data = data[0];
            viewer.rangeChange(data[0].rangeMin, data[0].rangeMax, viewer.clamped, {
              afterUpdate: function () {
                loading_div.hide();
              }
            });
          }
        });
      });

      function dataRangeChange(e) {
        loading_div.show();
        var min = $("#data-range-min").val();
        var max = $("#data-range-max").val();
        $(e.target).siblings(".slider").slider('values', 0, min);
        $(e.target).siblings(".slider").slider('values', 1, max);
        viewer.rangeChange(min, max, $(e.target).siblings("#clamp_range").is(":checked"), {
          afterUpdate: function () {
            loading_div.hide();
          }
        });

      }
      $("#data-range-min").change(dataRangeChange);

      $("#data-range-max").change(dataRangeChange);

      $("#fix_range").click(function(event) {
        viewer.fixRange = $(event.target).is(":checked");
      });

      $("#clamp_range").change(function(e) {
        var min = parseFloat($(e.target).siblings("#data-range-min").val());
        var max = parseFloat($(e.target).siblings("#data-range-max").val());

        if($(e.target).is(":checked")) {
          viewer.rangeChange(min,max,true);
        }else {
          viewer.rangeChange(min,max,false);
        }
      });


      $("#flip_range").change(function(e) {
        viewer.flip = $(e.target).is(":checked");
        loading_div.show();
        viewer.updateColors(viewer.model_data.data, {
          min: viewer.model_data.data.rangeMin,
          max: viewer.model_data.data.rangeMax,
          spectrum: viewer.spectrum,
          flip: viewer.flip,
          clamped: viewer.clamped,
          afterUpdate: function() {
            loading_div.hide();
          }
        });
      });
      
      if (!multiple) {
        $("#range-slider").slider('values', 0, parseFloat(min));
        $("#range-slider").slider('values', 1, parseFloat(max));
        viewer.triggerEvent("rangechange", min, max);
      }

    }); // end loaddata listener
    
    viewer.addEventListener("blenddata", function(){
      var div = $("#blend-box");
      div.html("Blend Ratio: ");
      //$("<div id=\"blend\">Blend ratios: </div>").appendTo("#surface_choice");
      //var div = $("#blend");
      $("<span id=\"blend_value\">0.5</span>").appendTo(div);
      $("<div class=\"blend_slider\" id=\"blend_slider\" width=\"100px\" + height=\"10\"></div>")
        .slider({
          min: 0.1,
          max: 0.99,
          value: 0.5,
          step: 0.01,
          /*
          * When the sliding the slider, change all the other sliders by the amount of this slider
          */
          slide: function() {
            var slider = $(this);
            slider.siblings("span").html(slider.slider("value"));
            viewer.blend($(this).slider("value"));
          }
        }).appendTo(div);
    });


    ///////////////////////////////////
    // UI
    ///////////////////////////////////

    viewer.loadSpectrumFromUrl('/assets/spectral_spectrum.txt');

    $('#clearshapes').click(function() {
      viewer.clearScreen();
      current_request = 0;
      current_request_name = "";
      loading_div.hide();
    });

    /********************************************************
    * This section implements the range change events
    * It takes care of updating the UI elements related to
    * the threshold range
    * It also defines the BrainBrowser::afterRangeChange
    * callback which is called in the BrainBrowser::rangeChange
    * Method.
    ********************************************************/

    //Create a range slider for the thresholds
    $("#range-slider").slider({
      range: true,
      min: -50,
      max: 50,
      value: [-10, 10],
      slider: function(event, ui) {
        var min = parseFloat(ui.values[0]);
        var max = parseFloat(ui.values[1]);
        viewer.rangeChange(min, max, $("#clamp_range").is(":checked"));
      },
      step: 0.1
    });

    $(".range-box").keypress(function(e) {
      if(e.keyCode === '13'){
        viewer.rangeChange(parseFloat($("#data-range-min").val()),parseFloat($("#data-range-max").val()));
      }
    });

    $("#examples").click(function(e) {
      current_request++;
      
      var name = $(e.target).attr('data-example-name');
      var matrixRotX, matrixRotY;
      
      if (current_request_name === name) return;
      current_request_name = name;
      
      //Create a closure to compare current request number to number
      // at the time request was sent.
      function default_cancel_opts(request_number) {
        return function() { return request_number !== current_request; };
      }
      
      function loadFinished() {
        loading_div.hide();
      }
      
      loading_div.show();
      viewer.clearScreen();

      var examples = {
        basic: function() {
          viewer.loadModelFromUrl('/models/surf_reg_model_both.obj', {
            format: "MNIObject",
            afterDisplay: loadFinished,
            cancel: default_cancel_opts(current_request)
          });
        },
        punkdti: function() {
          viewer.loadModelFromUrl('/models/dti.obj', {
            format: "MNIObject",
            renderDepth: 999,
            afterDisplay: loadFinished,
            cancel: default_cancel_opts(current_request)
          });
          viewer.loadModelFromUrl('/models/left_color.obj', {
            format: "MNIObject",
            cancel: default_cancel_opts(current_request)
          });
          viewer.loadModelFromUrl('/models/right_color.obj', {
            format: "MNIObject",
            cancel: default_cancel_opts(current_request)
          });
        },
        realct: function() {
          viewer.loadModelFromUrl('/models/realct.obj', {
            format: "MNIObject",
            afterDisplay: function() {
              viewer.loadDataFromUrl('/models/realct.txt','Cortical Thickness', {
                afterUpdate: loadFinished,
                cancel: default_cancel_opts(current_request)
              });
            },
            cancel: default_cancel_opts(current_request)
          });
        },
        car: function() {
          viewer.loadModelFromUrl('/models/car.obj', {
            format: "WavefrontObj",
            afterDisplay: loadFinished,
            cancel: default_cancel_opts(current_request)
          });
          viewer.setCamera(0, 0, 100);

          matrixRotX = new THREE.Matrix4();
          matrixRotX.makeRotationX(-0.25 * Math.PI);
          matrixRotY = new THREE.Matrix4();
          matrixRotY.makeRotationY(0.4 * Math.PI);

          viewer.model.applyMatrix(matrixRotY.multiply(matrixRotX));
        },
        plane: function() {
          viewer.loadModelFromUrl('/models/dlr_bigger.streamlines.obj', {
            format: "MNIObject",
            cancel: default_cancel_opts(current_request)
          });
          viewer.loadModelFromUrl('/models/dlr.model.obj', {
            format: "MNIObject",
            afterDisplay: function() {
              loadFinished();
            },
            cancel: default_cancel_opts(current_request)
          });
          viewer.setCamera(0, 0, 75);

          matrixRotX = new THREE.Matrix4();
          matrixRotX.makeRotationX(-0.25 * Math.PI);
          matrixRotY = new THREE.Matrix4();
          matrixRotY.makeRotationY(0.4 * Math.PI);

          viewer.model.applyMatrix(matrixRotY.multiply(matrixRotX));
        },
        mouse: function() {
          viewer.loadModelFromUrl('/models/mouse_surf.obj', {
            format: "MNIObject",
            afterDisplay: function() {
              viewer.loadDataFromUrl('/models/mouse_alzheimer_map.txt',
                'Cortical Amyloid Burden, Tg AD Mouse, 18 Months Old', {
                  shape: "mouse_surf.obj",
                  min: 0.0,
                  max: 0.25,
                  afterUpdate: loadFinished,
                  cancel: default_cancel_opts(current_request)
                }
              );
            },
            cancel: default_cancel_opts(current_request)
          });
          viewer.loadModelFromUrl('/models/mouse_brain_outline.obj', {
            format: "MNIObject",
            afterDisplay: function() {
              $(".opacity-slider[data-shape-name='mouse_brain_outline.obj']").slider("value", 50);
              viewer.setTransparency('mouse_brain_outline.obj', 0.5);
            },
            cancel: default_cancel_opts(current_request)
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
        beforeLoad: function() {
          loading_div.show();
        },
        afterDisplay: function() {
          loading_div.hide();
        },
        onError: function() {
          loading_div.hide();
        }
      });

      return false;
    });

    $(".datafile").change(function() {
      var filenum = parseInt(this.id.slice(-1), 10);
      viewer.loadDataFromFile(this, { blend_index : filenum - 1 });
    });

    $("#spectrum").change(function() {
      viewer.loadSpectrumFromFile(document.getElementById("spectrum"));
    });

    // Load first model.
    $("a.example[data-example-name=realct]").click();
  });
});

