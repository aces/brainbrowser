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

  brainbrowser.afterInit = function(bb) {
    var macacc = new MacaccObject(bb,"/data/gaolang_data/");


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
				     step: 0.1,
				     //stop: macacc.range_change

				   });
    jQuery('#range_change').click(macacc.range_change);


    jQuery(".range-box").keypress(function(e) {
				    if(e.keyCode == '13'){
				      macacc.range_change(e);
				    }
				  }
				 );

    jQuery("#data-range-min").change(function(e) {
      jQuery("#range-slider").slider('values', 0, jQuery(this).val());
    });

    jQuery("#data-range-min").change(function(e) {
      jQuery("#range-slider").slider('values', 0, jQuery(this).val());
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

  };
  brainbrowser.setup('/models/surf_reg_model_both.obj');
  jQuery('#resetview').click(brainbrowser.setupView);



  jQuery('.view_button').change(brainbrowser.setupView);
  jQuery('[name=hem_view]').change(brainbrowser.setupView);
  jQuery(".button").button();
  jQuery(".button_set").buttonset();

  //document.onselectstart = function() {return false;} // ie
  //document.onmousedown = function() {return false;} // mozilla


});
