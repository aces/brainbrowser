var brainbrowser;
function initMacacc(path_prefix,dont_build_path) {

  brainbrowser = new BrainBrowser();

  brainbrowser.getViewParams = function() {
    return {
      view: jQuery('[name=hem_view]:checked').val(),
      left: jQuery('#left_hem_visible').attr("checked"),
      right: jQuery('#right_hem_visible').attr("checked")
    };

  };

  brainbrowser.afterLoadSpectrum = function (spectrum) {
    var canvas = spectrum.createSpectrumCanvasWithScale(0,5,null,false);
    jQuery("#spectrum").html(jQuery(canvas));
    brainbrowser.spectrumObj = spectrum;
  };




  brainbrowser.afterInit = function(bb) {

    bb.loadObjFromUrl('/models/surf_reg_model_both.obj');
    var macacc = new MacaccObject(bb,path_prefix,dont_build_path);
    brainbrowser.afterCreateBrain = function() {
      if(bb.current_dataset != undefined) {
	macacc.update_model(bb.current_dataset);
      }
    };


    macacc.afterRangeChange= function(min,max) {
      if(macacc.flipRange == true) {
	var canvas = bb.spectrumObj.createSpectrumCanvasWithScale(min,max,null,true);
      }
      else {
	var canvas = bb.spectrumObj.createSpectrumCanvasWithScale(min,max,null,false);
      }

      jQuery("#spectrum").html(jQuery(canvas));
    };


    jQuery('#meshmode').change(function(e) {
				   if(jQuery(e.target).attr("checked") == true) {
				     bb.set_fill_mode_wireframe();
				   }else {
				     bb.set_fill_mode_solid();
				   }
				 });

    jQuery("#range-slider").slider({
				     range: true,
				     min: -10,
				     max: 15,
				     values: [0, 5],
				     slide: function(event, ui) {
				       jQuery("#data-range-min").val(ui.values[0]);
				       jQuery("#data-range-max").val(ui.values[1]);
				       if(bb.current_dataset) {
					 macacc.range_change();
				       }
				     },
				     step: 0.1
				     //stop: macacc.range_change

				   });



    jQuery(".range-box").keypress(function(e) {
				    if(e.keyCode == '13'){
				      macacc.range_change(e);
				    }
				  }
				 );

    jQuery("#data-range-min").change(function(e) {
				       jQuery("#range-slider").slider('values', 0, jQuery(this).val());
				       macacc.afterRangeChange(parseFloat(jQuery("#data-range-min").val()),parseFloat(jQuery("#data-range-max").val()));
				     });

    jQuery("#data-range-max").change(function(e) {
				       jQuery("#range-slider").slider('values', 1, jQuery(this).val());
				       macacc.afterRangeChange(parseFloat(jQuery("#data-range-min").val()),parseFloat(jQuery("#data-range-max").val()));
				     });

    jQuery('.data_controls').change(macacc.data_control_change);
    macacc.pickInfoElem=jQuery("#vertex_info");
    jQuery("#x-coord-flip").click(macacc.flipXCoordinate); //flip x from one hemisphere to the other.

    jQuery("[name=pointer]").change(function(e) {
				      if(jQuery("[name=pointer]:checked").val() == "AAL_atlas") {
					macacc.show_atlas();
				      }
				    });

    jQuery("#model").change(macacc.change_model);

    jQuery('#screenshot').click(function(event) {jQuery(this).attr("href",bb.client.toDataUR());});
    o3djs.event.addEventListener(bb.o3dElement, 'mousedown', function (e) {
				   var pointer_setting=jQuery('[name=pointer]:checked').val();

				   if(pointer_setting=="rotate" && !e.shiftKey  && !e.ctrlKey){
				     bb.startDragging(e);
				   }if(e.ctrlKey || pointer_setting == "check") {
				     if(bb.valueAtPointCallback) {
				       bb.click(e,bb.valueAtPointCallback);
				     }
				   }if(e.shiftKey || pointer_setting == "select") {

				     if(bb.clickCallback) {
				       bb.click(e,bb.clickCallback);
				     }

				   }


				 });
    o3djs.event.addEventListener(bb.o3dElement, 'mousemove', function (e) {
				   var pointer_setting=jQuery('[name=pointer]:checked').val();
				   if( pointer_setting == "check" && e.shiftKey) {
				     if(bb.valueAtPointCallback) {
				       bb.click(e,bb.valueAtPointCallback);
				     }
				   }else if(pointer_setting == "select" && e.shiftKey) {

				     if(bb.clickCallback) {
				       bb.click(e,bb.clickCallback);
				     }
				   }else
				   {
				     bb.drag(e);
				   }

				 });
    o3djs.event.addEventListener(bb.o3dElement, 'mouseup', function (e) {
				   if(!e.shiftKey || e.button == bb.o3d.Event.BUTTON_RIGHT){
				     bb.stopDragging(e);
				   }
				 });

    jQuery("#flip_range").change(function(e) {
				   if(jQuery(e.target).attr("checked") == true) {
				     macacc.update_model(brainbrowser.current_dataset);
				   }else {
				     macacc.update_model(brainbrowser.current_dataset);
				   }
				 });
    jQuery("#flip_correlation").click(function(e) {
					var min = -1*parseFloat(jQuery("#data-range-max").val());
					var max = -1*parseFloat(jQuery("#data-range-min").val());
					jQuery("#data-range-min").val(min).change();
					jQuery("#data-range-max").val(max).change();

					jQuery("#flip_range").attr("checked",!jQuery("#flip_range").attr("checked")).change();


				      });

  };
  jQuery('#resetview').click(brainbrowser.setupView);

  jQuery('.view_button').change(brainbrowser.setupView);
  jQuery('[name=hem_view]').change(brainbrowser.setupView);
  jQuery(".button").button();
  jQuery(".button_set").buttonset();
};
