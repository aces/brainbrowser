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
* @author: Tarek Sherif
* @author: Nicolas Kassis
*/

$(function() {
  "use strict";
  
  var macacc;
  var path_prefix = "/data/";
  var loading_div = $("#loading");
  function showLoading() { loading_div.show(); }
  function hideLoading() { loading_div.hide(); }
        
  if (!BrainBrowser.utils.webglEnabled()) {
    $("#brainbrowser").html(BrainBrowser.utils.webGLErrorMessage());
    return;
  }
  
  loading_div.show();
  
  BrainBrowser.SurfaceViewer.start("brainbrowser", function(viewer) {

    // Add the three.js 3D anaglyph effect to the viewer.
    viewer.addEffect("AnaglyphEffect");

    viewer.addEventListener("loadcolormap", function(color_map) {
      var canvas = color_map.createCanvasWithScale(0, 5);
      canvas.id = "spectrum-canvas";
      $("#spectrum").html($(canvas));
    });

    viewer.render();
    
    viewer.loadModelFromURL('/models/surf_reg_model_both.obj', {
      format: "mniobj",
      parse: { split: true },
      complete: function() {
        hideLoading();
        macacc = MACACC.collection(viewer, path_prefix);
                
        macacc.dataOptions = function() {
          return {
            flip: $("#flip_range").is(":checked"),
            clamped: $("#clamp_range").is(":checked"),
            fix_range: $("#fix_range").is(":checked"),
            data_range_min: parseFloat($("#data-range-min").val()),
            data_range_max: parseFloat($("#data-range-max").val()),
          };
        };
        
        macacc.afterUpdateMap = function(statistic) {
          hideLoading();
          if (statistic !== "T") {
            $("#range-slider").slider("option", "min", "0");
            $("#range-slider").slider("option", "max", "1");
          }
        };
        
        macacc.afterVertexUpdate = function(vertex_data, value) {
          var vertex = vertex_data.index;
          if (vertex !== undefined && value !== undefined) {
            $("#x-coord").val(vertex_data.point.x);
            $("#y-coord").val(vertex_data.point.y);
            $("#z-coord").val(vertex_data.point.z);
            $("#v-coord").val(vertex);
            $("#value-coord").val(value);
          }
        };
        
        macacc.beforeUpdateMap = showLoading;
        macacc.afterInvalidMap = hideLoading;
        
        macacc.afterRangeChange = function(min,max) {
          var canvas = viewer.color_map.createCanvasWithScale(min, max, macacc.flipRange);
          canvas.id = "spectrum-canvas";
          $("#spectrum").html($(canvas));
        };
        
        macacc.getDataControls = function() {
          var data_modality = $("[name=modality]:checked").val(); //CT,AREA or Volume
          var data_sk = $("#data-sk").val(); //Smoothing Kernel
          var data_statistic = $("[name=statistic]:checked").val();
        
        
          return {modality: data_modality, sk: data_sk, statistic: data_statistic };
        };
        
        $('.data_controls').change(macacc.dataControlChange);
        
        $("#x-coord-flip").click(macacc.flipXCoordinate); //flip x from one hemisphere to the other.
        
        $("#model").change(function(event) {
          showLoading();
          macacc.changeModel($(event.target).val(), {
            complete: hideLoading,
            format: "mniobj",
            parse: { split: true }
          });
        });
      }
    });

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

    $("#range-slider").slider({
      range: true,
      min: -10,
      max: 15,
      values: [0, 5],
      slide: function(event, ui) {
        $("#data-range-min").val(ui.values[0]);
        $("#data-range-max").val(ui.values[1]);
        macacc.setIntensityRange();
      },
      step: 0.1
    });



    $(".range-box").keypress(function(e) {
      if(e.keyCode === '13'){
        macacc.setIntensityRange();
      }
    });

    $("#data-range-min").change(function() {
      $("#range-slider").slider('values', 0, $(this).val());
      macacc.afterRangeChange(parseFloat($("#data-range-min").val()), parseFloat($("#data-range-max").val()));
    });

    $("#data-range-max").change(function() {
      $("#range-slider").slider('values', 1, $(this).val());
      macacc.afterRangeChange(parseFloat($("#data-range-min").val()), parseFloat($("#data-range-max").val()));
    });

    $('#screenshot').click(function() {$(this).attr("href", viewer.client.toDataUR());});
    
    $("#brainbrowser").mousedown(function(e) {
      var view_window = viewer.view_window;
      var pointer_setting = $('[name=pointer]:checked').val();
      var offset = BrainBrowser.utils.getOffset(view_window);
      var mouseX = e.clientX - offset.left + window.scrollX;
      var mouseY = e.clientY - offset.top + window.scrollY;
      
      if(e.ctrlKey || pointer_setting === "check") {
        macacc.valueAtPoint(viewer.pick(mouseX, mouseY));
      } else if(e.shiftKey || pointer_setting === "select") {
        macacc.pick(viewer.pick(mouseX, mouseY));
      }
    });

    $("#flip_range").change(function() {
      showLoading();
      macacc.updateMap();
    });
    
    $("#clamp_range").change(function() {
      showLoading();
      macacc.updateMap();
    });
    


    $("#flip_correlation").click(function() {
      var min = -1 * parseFloat($("#data-range-max").val());
      var max = -1 * parseFloat($("#data-range-min").val());
      $("#data-range-min").val(min).change();
      $("#data-range-max").val(max).change();
      
      $("#flip_range").attr("checked", !$("#flip_range").is(":checked")).change();
    });

    $("#secondWindow").click(function(){
      viewer.secondWindow = window.open('/macacc.html','secondWindow');
    });

    window.addEventListener('message', function(e){

      var vertex = parseInt(e.data, 10);
      var position_vector = [
        viewer.model_data.vertices[vertex*3],
        viewer.model_data.vertices[vertex*3+1],
        viewer.model_data.vertices[vertex*3+2]
      ];

      macacc.pickClick(e, {
        position_vector: position_vector,
        vertex: vertex,
        stop: true //tell pickClick to stop propagating the
                   //click so we don't get an infinite loop.
      });

    }, false);
    
    if (window.opener) {
      viewer.secondWindow = window.opener;
    }
  });
});
