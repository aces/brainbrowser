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


var brainbrowser;
function SurfView(model_url) {
  var that = this;
  brainbrowser = new BrainBrowser();
  this.brainbrowser = brainbrowser;
  brainbrowser.getViewParams = function() {
    return {
      view: jQuery('[name=hem_view]:checked').val(),
      left: jQuery('#left_hem_visible').attr("checked"),
      right: jQuery('#right_hem_visible').attr("checked")
    };

  };

  brainbrowser.afterLoadSpectrum = function (spectrum) {
    var canvas = spectrum.createSpectrumCanvasWithScale(0,100,null);
    canvas.id = "spectrum_canvas";
    var spectrum_div = document.getElementById("color_bar");
    if(!spectrum_div){
      jQuery("<div id=\"color_bar\"></div>").html(canvas).appendTo("#data-range");      
    }else {
      jQuery(spectrum_div).html(canvas);
    }
    

    brainbrowser.spectrumObj = spectrum;
  };

  brainbrowser.afterDisplayObject = function(object) {
    $("#shapes").html("");
    if(object.children.length > 0 ) {
	    for( var i = 0; i < object.children.length; i++) {
	      var shape = object.children[i];
	      $("<div id=\"shape_"+i+"\" data-shape-name=\""+shape.name+"\" class=\"shape\">"
	      +"<h4>Shape "+ (i + 1) +"</h4>"
	      +"Name: " +shape.name + "<br />" 
	      + "Opacity: <div class=\"opacity-slider slider\"  data-shape-name="+shape.name+"></div>"
	      +"</div>").appendTo("#shapes");
	    }
    }
      
  
    brainbrowser.afterClearScreen=function() {
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
	     
	      brainbrowser.changeShapeTransparency(shape_name,alpha);
	    }
	  });
  };
  
  //Setups the view events and handlers
  jQuery('#resetview').click(brainbrowser.setupView);
  jQuery('.view_button').change(brainbrowser.setupView);
  jQuery('[name=hem_view]').change(brainbrowser.setupView);



  this.updateCoordinates = function(position,vertex,value) {
      jQuery("#x-coord").val(position[0]);
      jQuery("#y-coord").val(position[1]);
      jQuery("#z-coord").val(position[2]);
      jQuery("#v-coord").val(vertex);
      jQuery("#value-coord").val(value);
  };


  brainbrowser.afterInit = function(bb) {
    //setting up some defaults 
    bb.clamped = true; //By default clamp range. 
    bb.flip = false;
    bb.clearScreen();
    if(typeof model_url == 'string' && model_url != '') {
      bb.loadObjFromUrl(model_url);      
    }else if(typeof model_url == 'function'){
      console.log("loading models");
      model_url(bb);
    }

    
    //Add event handlers
    jQuery("body").keydown(bb.keyPressedCallback);

    /********************************************************
     * This section implements the range change events
     * It takes care of updating the UI elements related to
     * the threshold range
     * It also defines the BrainBrowser::afterRangeChange
     * callback which is called in the BrainBrowser::rangeChange
     * Method.
     ********************************************************/

    //Create a range slider for the thresholds
    jQuery("#range-slider").slider({
      range: true,
      min: -50,
      max: 50,
      value: [-10, 10],
      slide: function(event, ui) {
	      var min = parseFloat(ui.values[0]);
	      var max = parseFloat(ui.values[1]);
	      bb.rangeChange(min,max,$("#clamp_range").attr("checked"));
      },
      step: 0.1
    });

    bb.afterRangeChange = function(min,max) {
      jQuery("#data-range-min").val(min);
      jQuery("#data-range-max").val(max);
      var canvas = bb.spectrumObj.createSpectrumCanvasWithScale(min,max,null);
      canvas.id = "spectrum_canvas";
      jQuery("#color_bar").html(jQuery(canvas));
    };

    function createDataUI(data) {
      var rangeBox = $("#data-range");
      $(rangeBox).html("");
      var html_string = "<div id=\"data_range_multiple\">"
	    + "<ul>";
      
      //Make the data object an array to make the rest work the same for both
      //multiple data files and singles. 
      if(!data.length) {
	      var data = [data];
      }
      for(var i=0; i<data.length; i++) {
	      html_string += "<li><a href=\"#data_file"+i+"\">"+data[i].fileName+"</a></li>";
      }
      html_string +="</ul>";
      for(var k=0; k<data.length; k++) {
	      html_string += "<div id=\"data_file"+k+"\" class=\"box full_box\">"
    	  + "<h4>Thresholding</h4>"
    	  +    "Min: <input class=\"range-box\" id=\"data-range-min\" type=\"text\" name=\"range_min\" size=\"5\" ><br />"
    	  + "<div id=\"range-slider+"+k+"\" data-blend-index=\""+k+"\" class=\"slider\"></div>"
    	  + "Max: <input class=\"range-box\" id=\"data-range-max\" type=\"text\" name=\"range_max\" size=\"5\" >"
    	  + "<input type=\"checkbox\" class=\"button\" id=\"fix_range\"><label for=\"fix_range\">Fix Range</label>"
    	  + "<input type=\"checkbox\" class=\"button\" id=\"clamp_range\" checked=\"true\"><label for=\"clamp_range\">Clamp range</label>"
    	  + "<input type=\"checkbox\" class=\"button\" id=\"flip_range\"><label for=\"flip_range\">Flip Colors</label>"
    	  + "</div>";
      }
      
      html_string += "</div>";
      $(rangeBox).html(html_string);
      $(rangeBox).tabs();
      $("#data_range").find(".slider").each(function(index,element) {
        $(element).slider({
          range:true,
          min: data[0].values.min(),
          max: data[0].values.max(),
          values: [data[index].rangeMin,data[index].rangeMax],
          step: 0.1,
          slide: function(event,ui) {
            var blend_id = $(this).attr("data-blend-index");
            data[0].rangeMin = ui.values[0];
            data[0].rangeMax = ui.values[1];
            bb.model_data.data = data[0];
            bb.updateColors(bb.model_data.data,bb.model_data.data.rangeMin,bb.model_data.data.rangeMax,bb.spectrum,bb.flip,bb.clamped,false);
            bb.rangeChange(data[0].rangeMin, data[0].rangeMax, bb.clamped);

          }
        });
      });
      
      function dataRangeChange(e) {
        var min = $("#data-range-min").val();
        var max = $("#data-range-max").val();
        jQuery(e.target).siblings(".slider").slider('values', 0, min);
        jQuery(e.target).siblings(".slider").slider('values', 1, max);
        bb.rangeChange(min,max,$(e.target).siblings("#clamp_range").attr("checked"));

      }
      jQuery("#data-range-min").change(dataRangeChange);

      jQuery("#data-range-max").change(dataRangeChange);

      jQuery("#fix_range").click(function(event,ui) {
        bb.fixRange= jQuery(e.target).attr("checked");
      });

      jQuery("#clamp_range").change(function(e) {
        var min = parseFloat($(e.target).siblings("#data-range-min").val());
        var max = parseFloat($(e.target).siblings("#data-range-max").val());

        if($(e.target).attr("checked") == true) {
          bb.rangeChange(min,max,true);
        }else {
          bb.rangeChange(min,max,false);
        }
      });


      jQuery("#flip_range").change(function(e) {
        bb.flip = $(e.target).attr("checked");
        bb.updateColors(bb.model_data.data,bb.model_data.data.rangeMin,bb.model_data.data.rangeMax,brainbrowser.spectrum,bb.flip,bb.clamped);

      });
      
  }
    
  bb.afterLoadData = function(min,max,data,multiple) {

    if(multiple) {
      createDataUI(data);
    }else {
      createDataUI(data);
      jQuery("#range-slider").slider('values', 0, parseFloat(min));
      jQuery("#range-slider").slider('values', 1, parseFloat(max));
      bb.afterRangeChange(min,max);
    }

  };

  jQuery('#meshmode').change(function(e) {
    if(jQuery(e.target).attr("checked") == true) {
      bb.set_fill_mode_wireframe();
    }else {
      bb.set_fill_mode_solid();
    }
  });



  jQuery('#clearshapes').click(function(e) {
	  brainbrowser.clearScreen();
	});
  
  
  
  jQuery("#openImage").click(function(e){
	  brainbrowser.getImageUrl();
	});
  
  
  function changeAutoRotate(e) {

      if($("#autorotate").attr("checked")){
	      bb.autoRotate = {};
	      bb.autoRotate.x = $("#autorotateX").attr("checked");
	      bb.autoRotate.y = $("#autorotateY").attr("checked");
	      bb.autoRotate.z = $("#autorotateZ").attr("checked");
	
	
      }else {
	      bb.autoRotate = false;
      }
      
    }
    jQuery("#autorotate-controls").children().change(changeAutoRotate);
    jQuery("#autorotate").change(changeAutoRotate);

    jQuery(".range-box").keypress(function(e) {
		  if(e.keyCode == '13'){
		    bb.rangeChange(parseFloat(jQuery("#data-range-min").val()),parseFloat(jQuery("#data-range-max").val()));
		  }
		});
        
    jQuery("#clearColor").change(function(e){
		  var color_name = $(e.target).val();
		  bb.updateClearColorFromName(color_name);
		});
        
    $("#examples").click(function(e) {
			   var name = $(e.target).attr('data-example-name');
			   switch(name) {
			   case	'basic':
			     bb.clearScreen();
			     bb.loadObjFromUrl('/models/surf_reg_model_both.obj');
			     bb.setupView();
			     break;
			   case 'punkdti':
			     bb.clearScreen();
			     bb.loadObjFromUrl('/models/dti.obj', 999);
			     bb.loadObjFromUrl('/models/left_color.obj');
			     bb.loadObjFromUrl('/models/right_color.obj');
			     bb.setupView();
			     break;
			   case 'realct':
			     bb.clearScreen();
			     bb.loadObjFromUrl('/models/realct.obj');    
			     bb.loadDataFromUrl('/models/realct.txt','cortical thickness'); 

			     bb.setupView();
			     
			     break;
         case 'car':
			     bb.clearScreen();
			     bb.loadWavefrontObjFromUrl('/models/car.obj');
			     bb.setCamera(0, 0, 100);			     
			    
			     var matrixRotX = new THREE.Matrix4();
           matrixRotX.makeRotationX(-0.25 * Math.PI)
           var matrixRotY = new THREE.Matrix4();
           matrixRotY.makeRotationY(0.4 * Math.PI)
           
           bb.getModel().applyMatrix(matrixRotY.multiply(matrixRotX));
			   break;
			   case 'plane':
			     bb.clearScreen();
			     bb.loadObjFromUrl('/models/dlr_bigger.streamlines.obj');
			     bb.loadObjFromUrl('/models/dlr.model.obj');
			     bb.setCamera(0, 0, 75);

           var matrix = new THREE.Matrix4();
           var matrixRotX = new THREE.Matrix4();
           matrixRotX.makeRotationX(-0.25 * Math.PI)
           var matrixRotY = new THREE.Matrix4();
           matrixRotY.makeRotationY(0.4 * Math.PI)
           
           matrix.multiplyMatrices(matrixRotY, matrixRotX);
           
           bb.getModel().applyMatrix(matrix);
			     
			   }
			   
			   return false; 
			   
			 });


  };
    
};