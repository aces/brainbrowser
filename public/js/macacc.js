var brainbrowser;
jQuery(function () {

  brainbrowser = new BrainBrowser();

  brainbrowser.getViewParams = function() {
    return {
      view: jQuery('[name=hem_view]:checked').val(),
      left: jQuery('#left_hem_visible').attr("checked"),
      right: jQuery('#right_hem_visible').attr("checked")
    };

  };

  brainbrowser.afterLoadSpectrum = function (spectrum) {
    var canvas = spectrum.createSpectrumCanvasWithScale(0,100,null);
    jQuery("#spectrum").html(jQuery(canvas));
    brainbrowser.spectrumObj = spectrum;
  };



  brainbrowser.afterInit = function(bb) {
    bb.loadObjFromUrl('/models/surf_reg_model_both.obj');
    var macacc = new MacaccObject(bb,"/data/gaolang_data/");
    macacc.afterRangeChange= function(min,max) {
      var canvas = bb.spectrumObj.createSpectrumCanvasWithScale(min,max,null);
      jQuery("#spectrum").html(jQuery(canvas));
    };


    jQuery('#fillmode').toggle(bb.set_fill_mode_wireframe,bb.set_fill_mode_solid);
    jQuery("#range-slider").slider({
				     range: true,
				     min: -100,
				     max: 200,
				     value: [-10, 10],
				     slide: function(event, ui) {
				       jQuery("#data-range-min").val(ui.values[0]);
				       jQuery("#data-range-max").val(ui.values[1]);
				       macacc.range_change();
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
    });

    jQuery("#data-range-max").change(function(e) {
      jQuery("#range-slider").slider('values', 1, jQuery(this).val());
    });

    jQuery('.data_controls').change(macacc.data_control_change);
    macacc.pickInfoElem=jQuery("#vertex_info");
    jQuery("#x-coord-flip").click(macacc.flipXCoordinate); //flip x from one hemisphere to the other.

    jQuery("[name=pointer]").change(function(e) {
      if(jQuery("[name=pointer]:checked").val() == "AAL_atlas") {
	macacc.show_atlas();
      }
    });

    jQuery('#screenshot').click(function(event) {jQuery(this).attr("href",bb.client.toDataUR());});
    o3djs.event.addEventListener(bb.o3dElement, 'mousedown', function (e) {

      var pointer_setting=jQuery('[name=pointer]:checked').val();

      if(pointer_setting=="rotate" && !e.shiftKey ){
	bb.startDragging(e);
      }else if(e.shiftKey || pointer_setting == "select") {;

	if(bb.clickCallback) {
	  bb.click(e,bb.clickCallback);
	}

      }else if((e.ctrlKey && e.button == bb.o3d.Event.BUTTON_LEFT) || pointer_setting == "check") {
	if(that.valueAtPointCallback) {
	  bb.click(e,that.valueAtPointCallback);
	}
      }


    });
    o3djs.event.addEventListener(bb.o3dElement, 'mousemove', function (e) {
      bb.drag(e);
    });
    o3djs.event.addEventListener(bb.o3dElement, 'mouseup', function (e) {
      if(!e.shiftKey || e.button == bb.o3d.Event.BUTTON_RIGHT){
	bb.stopDragging(e);
      }
    });

  };
  jQuery('#resetview').click(brainbrowser.setupView);
  jQuery('.view_button').change(brainbrowser.setupView);
  jQuery('[name=hem_view]').change(brainbrowser.setupView);
  jQuery(".button").button();
  jQuery(".button_set").buttonset();





  //document.onselectstart = function() {return false;} // ie
  //document.onmousedown = function() {return false;} // mozilla





});
