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
 
BrainBrowser.plugins.ui = function(bb) {
  
  var doc = document;
  var loading_div = $("#loading");
  
  /**
   * Callback for the keypress event.
   * Invokes the action to be performed for the key pressed.
   * @param {event} keyPress event passed to us by javascript.
   */
  bb.keyPressedCallback = function(event) {

    var action_taken = false;

    switch(event.which) {
      case 38:
        bb.ZoomInOut(1/1.1);
        action_taken = true;
        break;
      case 40:
        bb.ZoomInOut(1.1);
        action_taken = true;
        break;
      case 32:
       bb.separateHemispheres();
       action_taken = true;
       break;
    };

    return !action_taken;
  };
  
  bb.setupBlendColors = function(){
    var div = $("#blend-box");
    div.html("Blend Ratio: ");
    //$("<div id=\"blend\">Blend ratios: </div>").appendTo("#surface_choice");
    //var div = $("#blend");
    $("<span id=\"blend_value\">0.5</span>").appendTo(div);
    $("<div class=\"blend_slider\" id=\"blend_slider\" width=\"100px\" + height=\"10\"></div>")
      .slider({
        value: 0,
        min: 0.1,
        max: 0.99,
        value: 0.5,
        step: 0.01,
        /*
        * When the sliding the slider, change all the other sliders by the amount of this slider
        */
        slide: function(event, ui) {
          var slider = $(this);
          slider.siblings("span").html(slider.slider("value"));
        },
        stop: function(event, ui) {
          bb.blend($(this).slider("value"));  
        }
      }).appendTo(div);
  };
  
  //Setup for series data, creates a slider to switch between files. 
  bb.setupSeries = function() {
    var model_data = bb.model_data;
    var seriesData = bb.seriesData;
    var positionArray = bb.model_data.positionArray;
    var interpolatedData;
    
    $("<div id=\"series\">Series: </div>").appendTo("#surface_choice");
    var div = $("#series");
    $("<span id=\"series-value\">0</span>").appendTo(div);
    $("<div id=\"series-slider\" width=\"100px\" + height=\"10\"></div>")
      .slider({
        value: 0,
        min: 0,
        max: seriesData.numberFiles-1,         
        step: 0.1,
        slide: function(event, ui) {
          if (seriesData[0].fileName.match("mt.*")) {
            $("#age_series").html("Age: " + (ui.value*3+5).toFixed(1));
          
          } else if (seriesData[0].fileName.match("pval.*")) {
            $("#age_series").html("Age: " + (ui.value*1+10));
          }
        },
        stop: function(event, ui) {
          loading_div.show();
          $(div).children("#series-value").html(ui.value);
          
          if (ui.value -  Math.floor(ui.value) < 0.01) { //is it at an integer? then just return the array      
              model_data.data = seriesData[ui.value];
              updateSeries(model_data.data);                           
          } else { //interpolate
            //////////////////////////////////////////////////////////////////////
            //TODO: NOT SURE IF THIS PART WORKS WITH WEB WORKERS. NEED TEST DATA!
            //////////////////////////////////////////////////////////////////////
            interpolatedData = interpolateDataArray(seriesData[Math.floor(ui.value)], seriesData[Math.floor(ui.value)+1], ui.value -  Math.floor(ui.value));
            BrainBrowser.data(interpolatedData, updateSeries);
          }
        }
     }).appendTo(div);
  
  };
  
  function updateSeries(data) {
    if (data.values.length < positionArray.length/4) {
      console.log("Number of numbers in datafile lower than number of vertices Vertices" 
      + positionArray.length/3 + " data values:" 
      + data.values.length );
      return -1;
    }
    //bb.initRange(model_data.data.min, model_data.data.max);
    
    if (bb.afterLoadData != null) {
      bb.afterLoadData(data.rangeMin, data.rangeMax, data);
    }
    
    bb.updateColors(data, data.rangeMin, data.rangeMax, bb.spectrum, bb.flip, bb.clamped, { 
      afterUpdate: function () { loading_div.hide(); } 
    });
  }

    // Interpolate data 
  function interpolateDataArray(first, second, percentage) {
    console.log(first.values.length);
    var i;
    var count = first.values.length;  
    var new_array = new Array(count);
    console.log("Percentage: " + percentage);
    
    
    for (i = 0; i < count; i++) {
      new_array[i] = (first.values[i]*(100-percentage*100)+second.values[i]*(percentage*100))/100;            
    }
    console.log(new_array.length);
    return new_array;
  }

  
  /*
   * Used to get a url for a screenshot.
   * The URL is will be long and contain the image inside. 
   * 
   */
  bb.getImageUrl = function() {
    var view_window = bb.view_window;
    var canvas = doc.createElement("canvas");
    var spectrum_canvas = doc.getElementById("spectrum-canvas");
    var context = canvas.getContext("2d");
    var img = new Image();
    
    canvas.width = view_window.offsetWidth;
    canvas.height = view_window.offsetHeight;

    function getSpectrumImage() {
      var img = new Image();
      img.onload = function(){
        context.drawImage(img, 0, 0); // Or at whatever offset you like
      };
      img.src = spectrum_canvas.toDataURL();
    }
      
    img.onload = function(){
      context.drawImage(img, 0, 0); // Or at whatever offset you like
      if (spectrum_canvas) {
        getSpectrumImage();       
      }
    };
    
    img.src = bb.canvasDataURL();
    
    $("<div></div>").append(canvas).dialog({
      title: "Screenshot",
      height: canvas.height,
      width: canvas.width
    });
  };
  
  bb.getViewParams = function() {
    return {
      view: $('[name=hem_view]:checked').val(),
      left: $('#left_hem_visible').is(":checked"),
      right: $('#right_hem_visible').is(":checked")
    };

  };
  
  function changeAutoRotate(e) {
    bb.autoRotate.x = $("#autorotateX").is(":checked");
    bb.autoRotate.y = $("#autorotateY").is(":checked");
    bb.autoRotate.z = $("#autorotateZ").is(":checked");
  }
  
  $("body").keydown(bb.keyPressedCallback);
  
  $("#clear_color").change(function(e){
     bb.updateClearColor(parseInt($(e.target).val(), 16));
  });
  
  //Setups the view events and handlers
  $('#resetview').click(bb.setupView);
  $('.view_button').change(bb.setupView);
  $('[name=hem_view]').change(bb.setupView);
  
  $('#meshmode').change(function(e) {
    if ($(e.target).is(":checked")) {
      bb.set_fill_mode_wireframe();
    } else {
      bb.set_fill_mode_solid();
    }
  });

  $('#threedee').change(function(e) {
    if ($(e.target).is(":checked")) {
      bb.anaglyphEffect();
    } else {
      bb.noEffect();
    }
  });

  $("#openImage").click(function(e) {
    bb.getImageUrl();
  });

  $("#autorotate-controls").children().change(changeAutoRotate);
  $("#autorotate").change(changeAutoRotate);
  
  
};  
