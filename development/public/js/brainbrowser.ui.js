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
 
BrainBrowser.modules.ui = function(bb) {
  
  var doc = document;
  
  /**
   * Callback for the keypress event.
   * Invokes the action to be performed for the key pressed.
   * @param {event} keyPress event passed to us by javascript.
   */
  bb.keyPressedCallback = function(event) {

    var action_taken = false;

    switch(event.which) {
      case 38:
        bb.ZoomInOut(1.1);
        action_taken = true;
        break;
      case 40:
        bb.ZoomInOut(1/1.1);
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
    console.log("Blend colors has run " + bb.blendData.numberFiles);
    $("#blend").remove();
    $("<div id=\"blend\">Blend ratios: </div>").appendTo("#surface_choice");
    var div = $("#blend");
    $("<span id=\"blend_value"+i+"\">0</span>").appendTo(div);
    $("<div class=\"blend_slider\" id=\"blend_slider" + i + "\" width=\"100px\" + height=\"10\"></div>")
      .slider({
		    value: 0,
		    min: 0.1,
	      max: 0.99,
		    value: 0.5,
		    step: 0.01,
	      /*
		    * When the sliding the slider, change all the other sliders by the amount of this slider
		    */
		    slide: function(event,ui) {
		      bb.blend($(this).slider("value"));  
		    }
	    }).appendTo(div);
  };

  
  /*
   * Used to get a url for a screenshot.
   * The URL is will be long and contain the image inside. 
   * 
   */
  bb.getImageUrl = function() {
    var canvas = doc.createElement("canvas");
    var spectrumCanvas = doc.getElementById("spectrum_canvas");
    var context = canvas.getContext("2d");
    var img = new Image();
    
    canvas.width = view_window.width();
    canvas.height = view_window.height();

    function getSpectrumImage() {
	    var img = new Image();
	    img.onload = function(){
	      context.drawImage(img, 0, 0); // Or at whatever offset you like
	      window.open(canvas.toDataURL(), "screenshot");
	    };
	    img.src = spectrumCanvas.toDataURL();
    }
      
    img.onload = function(){
	    context.drawImage(img, 0, 0); // Or at whatever offset you like
	    if (spectrumCanvas) {
  	    getSpectrumImage();	      
	    } else {
	      window.open(canvas.toDataURL(), "screenshot");
	    }
    };
    
    img.src = renderer.domElement.toDataURL();
  };
};  
