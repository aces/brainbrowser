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
  
  $(".button").button();
  $(".buttonset").buttonset();
  
  if (!BrainBrowser.webgl_enabled()) {
    $("#brainbrowser").html(BrainBrowser.webGLErrorMessage());
    return;
  }

  BrainBrowser(function(bb) {
    $("#loading").show();
    bb.clearScreen();
    bb.loadModelFromUrl('/models/realct.obj', {
      afterDisplay: function() {
        bb.loadSpectrumFromUrl('/assets/spectral_spectrum.txt', {
          afterLoadSpectrum: function() {
            bb.loadDataFromUrl('/models/realct.txt','cortical thickness'); 
          }
        });
        $("#loading").hide();
      }
    });
 
    //setting up some defaults 
    bb.clamped = true; //By default clamp range. 
    bb.flip = false;

    bb.afterLoadSpectrum = function (spectrum) {
      var canvas = spectrum.createSpectrumCanvasWithScale(0, 100, null);
      var spectrum_div = document.getElementById("color_bar");

      canvas.id = "spectrum_canvas";
      if (!spectrum_div) {
        $("<div id=\"color_bar\"></div>").html(canvas).appendTo("#data-range");      
      } else {
        $(spectrum_div).html(canvas);
      }

      bb.spectrumObj = spectrum;
    };

    bb.afterDisplayObject = function(object) {
      var shape;
      var i, count;

      $("#shapes").html("");
      if(object.children.length > 0 ) {
        for(i = 0, count = object.children.length; i < count; i++) {
          shape = object.children[i];
          $("<div id=\"shape_"+i+"\" data-shape-name=\""+shape.name+"\" class=\"shape\">"
          +"<h4>Shape "+ (i + 1) +"</h4>"
          +"Name: " +shape.name + "<br />" 
          + "Opacity: <div class=\"opacity-slider slider\"  data-shape-name="+shape.name+"></div>"
          +"</div>").appendTo("#shapes");
        }
      }


      bb.afterClearScreen = function() {
        $("#shapes").html("");
      };

      $(".opacity-slider").slider({
        value: 100,
        min: -1,
        max: 101,
        slide: function(event, ui) {
          var shape_name = $(event.target).attr('data-shape-name');
          var alpha = $(event.target).slider('value');
          alpha = Math.min(100, Math.max(0, alpha)) / 100.0;

          bb.changeShapeTransparency(shape_name,alpha);
        }
      });
    };
    
    $('#clearshapes').click(function(e) {
      bb.clearScreen();
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
      slide: function(event, ui) {
        var min = parseFloat(ui.values[0]);
        var max = parseFloat(ui.values[1]);
        bb.rangeChange(min, max, $("#clamp_range").is(":checked"));
      },
      step: 0.1
    });

    bb.afterRangeChange = function(min,max) {
      $("#data-range-min").val(min);
      $("#data-range-max").val(max);
      var canvas = bb.spectrumObj.createSpectrumCanvasWithScale(min, max, null);
      canvas.id = "spectrum_canvas";
      $("#color_bar").html($(canvas));
    };

    function createDataUI(data) {
      var rangeBox = $("#data-range");
      var range_updating = false;
      var headers = "<div id=\"data_range_multiple\"><ul>";
      var controls = "";
      var data = data.length ? data : [data];
      var i, count;

      $(rangeBox).html("");

      for(i = 0, count = data.length; i < count; i++) {
        headers += "<li><a href=\"#data_file" + i + "\">" + data[i].fileName + "</a></li>";
        controls += "<div id=\"data_file" + i + "\" class=\"box full_box\">";
        controls += "<h4>Thresholding</h4>";
        controls += "Min: <input class=\"range-box\" id=\"data-range-min\" type=\"text\" name=\"range_min\" size=\"5\" ><br />";
        controls += "<div id=\"range-slider+" + i + "\" data-blend-index=\"" + i + "\" class=\"slider\"></div><br />";
        controls += "Max: <input class=\"range-box\" id=\"data-range-max\" type=\"text\" name=\"range_max\" size=\"5\" >";
        controls += "<input type=\"checkbox\" class=\"button\" id=\"fix_range\"><label for=\"fix_range\">Fix Range</label>";
        controls += "<input type=\"checkbox\" class=\"button\" id=\"clamp_range\" checked=\"true\"><label for=\"clamp_range\">Clamp range</label>";
        controls += "<input type=\"checkbox\" class=\"button\" id=\"flip_range\"><label for=\"flip_range\">Flip Colors</label>";
        controls += "</div>";
      }
      headers += "</ul>";


      $(rangeBox).html(headers + controls + "</div>");
      $(rangeBox).tabs();

      $("#data_range").find(".slider").each(function(index, element) {
        $(element).slider({
          range:true,
          min: data[0].values.min(),
          max: data[0].values.max(),
          values: [data[index].rangeMin,data[index].rangeMax],
          step: 0.1,
          slide: function(event, ui) {
            if (!range_updating) {
              var blend_id = $(this).attr("data-blend-index");
              range_updating = true;
              data[0].rangeMin = ui.values[0];
              data[0].rangeMax = ui.values[1];
              bb.model_data.data = data[0];
              bb.rangeChange(data[0].rangeMin, data[0].rangeMax, bb.clamped, {
                afterChange: function () {
                  range_updating = false;
                }
              });
            }
          }
        });
      });

      function dataRangeChange(e) {
        var min = $("#data-range-min").val();
        var max = $("#data-range-max").val();
        $(e.target).siblings(".slider").slider('values', 0, min);
        $(e.target).siblings(".slider").slider('values', 1, max);
        bb.rangeChange(min,max,$(e.target).siblings("#clamp_range").is(":checked"));

      }
      $("#data-range-min").change(dataRangeChange);

      $("#data-range-max").change(dataRangeChange);

      $("#fix_range").click(function(event,ui) {
        bb.fixRange = $(e.target).is(":checked");
      });

      $("#clamp_range").change(function(e) {
        var min = parseFloat($(e.target).siblings("#data-range-min").val());
        var max = parseFloat($(e.target).siblings("#data-range-max").val());

        if($(e.target).is(":checked")) {
          bb.rangeChange(min,max,true);
        }else {
          bb.rangeChange(min,max,false);
        }
      });


      $("#flip_range").change(function(e) {
        bb.flip = $(e.target).is(":checked");
        bb.updateColors(bb.model_data.data, bb.model_data.data.rangeMin, bb.model_data.data.rangeMax ,bb.spectrum, bb.flip, bb.clamped);

      });

    }

    bb.afterLoadData = function(min,max,data,multiple) {

      if (multiple) {
        createDataUI(data);
      } else {
        createDataUI(data);
        $("#range-slider").slider('values', 0, parseFloat(min));
        $("#range-slider").slider('values', 1, parseFloat(max));
        bb.afterRangeChange(min,max);
      }

    };

    $(".range-box").keypress(function(e) {
      if(e.keyCode == '13'){
        bb.rangeChange(parseFloat($("#data-range-min").val()),parseFloat($("#data-range-max").val()));
      }
    });

    $("#examples").click(function(e) {
      var name = $(e.target).attr('data-example-name');
      var matrixRotX, matrixRotY;

      switch(name) {
        case	'basic':
        $("#loading").show();
        bb.clearScreen();
        bb.loadModelFromUrl('/models/surf_reg_model_both.obj', {
          format: "MNIObject",
          afterDisplay: function() {
            $("#loading").hide();
          }
        });
        break;
        case 'punkdti':
        $("#loading").show();
        bb.clearScreen();
        bb.loadModelFromUrl('/models/dti.obj', {
          format: "MNIObject",
          renderDepth: 999,
          afterDisplay: function() {
            $("#loading").hide();
          }
        });
        bb.loadModelFromUrl('/models/left_color.obj', { format: "MNIObject" });
        bb.loadModelFromUrl('/models/right_color.obj', { format: "MNIObject" });
        break;
        case 'realct':
        $("#loading").show();
        bb.clearScreen();
        bb.loadModelFromUrl('/models/realct.obj', {
          format: "MNIObject",
          afterDisplay: function() {
            bb.loadDataFromUrl('/models/realct.txt','cortical thickness'); 
            $("#loading").hide();
          }
        });    
        break;
        case 'car':
        $("#loading").show();
        bb.clearScreen();
        bb.loadModelFromUrl('/models/car.obj', {
          format: "WavefrontObj",
          afterDisplay: function() {
            $("#loading").hide();
          }
        });
        bb.setCamera(0, 0, 100);			     

        matrixRotX = new THREE.Matrix4();
        matrixRotX.makeRotationX(-0.25 * Math.PI)
        matrixRotY = new THREE.Matrix4();
        matrixRotY.makeRotationY(0.4 * Math.PI)

        bb.model.applyMatrix(matrixRotY.multiply(matrixRotX));
        break;
        case 'plane':
        $("#loading").show();
        bb.clearScreen();
        bb.loadModelFromUrl('/models/dlr_bigger.streamlines.obj', { format: "MNIObject" });
        bb.loadModelFromUrl('/models/dlr.model.obj', {
          format: "MNIObject",
          afterDisplay: function() {
            $("#loading").hide();
          }
        });
        bb.setCamera(0, 0, 75);

        matrixRotX = new THREE.Matrix4();
        matrixRotX.makeRotationX(-0.25 * Math.PI)
        matrixRotY = new THREE.Matrix4();
        matrixRotY.makeRotationY(0.4 * Math.PI)

        bb.model.applyMatrix(matrixRotY.multiply(matrixRotX));
      }

      return false; 

    });

    $("#obj_file_format").change(function () {
      var format = $("#obj_file_format").closest("#obj_file_select").find("#obj_file_format option:selected").val();
      if (format === "freesurfer") {
        $("#format_hints").html('You can use <a href="http://surfer.nmr.mgh.harvard.edu/fswiki/mris_convert" target="_blank">mris_convert</a> to convert your binary surface files into .asc format.');
      } else {
        $("#format_hints").html("");
      }
    });

    $("#obj_file_submit").click(function () {
      var format = $("#obj_file_format").closest("#obj_file_select").find("#obj_file_format option:selected").val();
      bb.loadModelFromFile(document.getElementById("objfile"), { 
        format: format, 
        beforeLoad: function() {
          $("#loading").show();
        }, 
        afterDisplay: function() {
          $("#loading").hide();
        },
        onError: function() {
          $("#loading").hide();
        }
      });

      return false;
    });

    $("#datafile").change(function() {
      bb.loadDataFromFile(document.getElementById("datafile"));
    });

    $("#spectrum").change(function() {
      bb.loadSpectrumFromFile(document.getElementById("spectrum"));
    });


    $("#dataseriesfile").change(function() {
      bb.loadSeriesDataFromFile(document.getElementById("dataseriesfile"));
    });

    $("#datablendfile").change(function() {
      bb.loadBlendDataFromFile(document.getElementById("datablendfile"));
    });
  });
});

