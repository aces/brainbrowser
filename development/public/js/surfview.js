var brainbrowser;
function SurfView() {
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
    jQuery("<div id=\"spectrum\" class=\"box full_box\"></div>").html(canvas).appendTo("#controls");
    brainbrowser.spectrumObj = spectrum;
  };


  brainbrowser.afterDisplayObject = function(transform) {
    $("#shapes").html("");
    if(transform.shapes != undefined) {
      for( var i = 0; i < transform.shapes.length; i++) {
	var shape = transform.shapes[i];
	$("<div id=\"shape_"+i+"\" data-shape-name=\""+shape.name+"\" class=\"shape\">"
	    +"<h4>Shape "+ (i + 1) +"</h4>"
	    +"Name: " +shape.name + "<br />" +
	    "Opacity: <div class=\"opacity-slider slider\"  data-shape-name="+shape.name+"></div>"
	  +"</div>").appendTo("#shapes");
      };

    }
    if(transform.children.length > 0 ) {
      for(var k = 0; k < transform.children.length; k++) {
	for( var i = 0; i < transform.children[k].shapes.length; i++) {
	  var shape = transform.children[k].shapes[i];
	  $("<div id=\"shape_"+i+"\" data-shape-name=\""+shape.name+"\" class=\"shape\">"
	      +"<h4>Shape "+ (i + 1) +"</h4>"
	      +"Name: " +shape.name + "<br />" 
	      + "Opacity: <div class=\"opacity-slider slider\"  data-shape-name="+shape.name+"></div>"
	      +"</div>").appendTo("#shapes");
	  
		  
	      }
	  }
      }
      
  
    brainbrowser.afterClearScreen=function() {
	$("#shapes").html("");
    };
      
    $(".opacity-slider").slider({
				 value: 100,
				 min: 0,
				 max: 100,
				 slide: function(event, ui) {
				   var shape_name = $(event.target).attr('data-shape-name');
				   var alpha = $(event.target).slider('value')/100.0;
				   brainbrowser.changeShapeTransparency(shape_name,alpha);
				 }});
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
    bb.clamped = true; //By default clamp range. 
		bb.flip = false;
    bb.clearScreen();
    bb.loadObjFromUrl('/models/surf_reg_model_both.obj');
    
    //Add event handlers
    jQuery("body").keydown(bb.keyPressedCallback);

    o3djs.event.addEventListener(bb.o3dElement, 'mousedown', function (e) {
				   
      if(e.shiftKey) {
	bb.click(e,function(e,info) {
	  if(brainbrowser.data){
	    that.updateCoordinates(info.position_vector,
	    info.vertex,
	    brainbrowser.data.values[info.vertex]);
	   }
	 });
      }else {
        bb.startDragging(e);
      }

				   
    });

    o3djs.event.addEventListener(bb.o3dElement, 'mousemove', function (e){
				   				
	  bb.drag(e);	  
    });

    o3djs.event.addEventListener(bb.o3dElement, 'mouseup', function (e) {
				   if(!e.shiftKey || e.button == bb.o3d.Event.BUTTON_RIGHT){
				     bb.stopDragging(e);
				   }
				 });


    $(bb.o3dElement).bind('contextmenu',function(e){
			      return false;
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
      jQuery("#spectrum").html(jQuery(canvas));
    };

    bb.afterLoadData = function(min,max,data) {
      bb.afterRangeChange(min,max);
      jQuery("#range-slider").slider('values', 0, parseFloat(min));
      jQuery("#range-slider").slider('values', 1, parseFloat(max));
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
				 window.open(brainbrowser.getImageUrl(),"screenshot");
			       });

    jQuery("#fix_range").click(function(event,ui) {
      bb.fixRange= jQuery("#fix_range").attr("checked");
    });

    jQuery("#clamp_range").change(function(e) {
				    var min = parseFloat(jQuery("#data-range-min").val());
				    var max = parseFloat(jQuery("#data-range-max").val());

				    if($(e.target).attr("checked") == true) {
				      bb.rangeChange(min,max,true);
				    }else {
				      bb.rangeChange(min,max,false);
				    }
				  });


		jQuery("#flip_range").change(function(e) {
			 bb.flip = $(e.target).attr("checked");
			 bb.updateColors(bb.data,bb.data.min,bb.data.max,brainbrowser.spectrum,bb.flip,bb.clamped);
			
		});
    
    jQuery(".range-box").keypress(function(e) {
      if(e.keyCode == '13'){
	bb.rangeChange(parseFloat(jQuery("#data-range-min").val()),parseFloat(jQuery("#data-range-max").val()));
      }
    });

    
    jQuery("#clearColor").change(function(e){
				  var color_name = $(e.target).val();
				  bb.updateClearColorFromName(color_name);
				});
    
    jQuery("#data-range-min").change(function(e) {
      jQuery("#range-slider").slider('values', 0, parseFloat(jQuery(this).val()));
    });

    jQuery("#data-range-max").change(function(e) {
      jQuery("#range-slider").slider('values', 1, parseFloat(jQuery(this).val()));
    });
    
    $("#examples").click(function(e) {
			   var name = $(e.target).attr('data-example-name');
			   switch(name) {
			   case	'basic':
			     bb.clearScreen();
			     bb.loadObjFromUrl('/models/surf_reg_model_both.obj');
			     break;
			   case 'punkdti':
			     bb.clearScreen();
			     bb.loadObjFromUrl('/models/dti.obj');
			     bb.loadObjFromUrl('/models/left_color.obj');
			     bb.loadObjFromUrl('/models/right_color.obj');
			     break;
			   case 'realct':
			     bb.clearScreen();
			     bb.loadObjFromUrl('/models/realct.obj');    
			     bb.loadDataFromUrl('/models/realct.txt');   
			     break;
			     
			   }
			   return false; 

			 });


  };
  
};