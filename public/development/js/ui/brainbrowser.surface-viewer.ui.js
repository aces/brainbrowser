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

/*
* @author: Tarek Sherif
*/

// Plugin for UI functionality used by both
// surface viewer and macacc.
//
// The object BrainBrowser.SurfaceViewer.modules contains
// functions that will automatically be run when the viewer
// is started. The created viewer object will be passed to it
// before the the viewer begins running. This can be a way 
// to add functionality to the viewer. (Just make sure
// the name of your module doesn't conflict with the 
// modules that already exist!)
BrainBrowser.SurfaceViewer.modules.ui = function(viewer) {
  "use strict";

  // Add the three.js 3D anaglyph effect to the viewer.
  viewer.addEffect("AnaglyphEffect");

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
  $("#autorotate-controls").children().change(function () {
    viewer.autorotate.x = $("#autorotateX").is(":checked");
    viewer.autorotate.y = $("#autorotateY").is(":checked");
    viewer.autorotate.z = $("#autorotateZ").is(":checked");
  });
};
