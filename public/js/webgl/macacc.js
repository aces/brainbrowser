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
    jQuery('#range_change').click(macacc.range_change);
    jQuery(".range-box").keypress(function(e) {
				    if(e.keyCode == '13'){
				      macacc.range_change(e);
				    }
				  }
				 );
    jQuery('.data_controls').change(macacc.data_control_change);
    macacc.pickInfoElem=jQuery("#vertex_info");
    jQuery('#screenshot').click(function(event) {jQuery(this).attr("href",bb.client.toDataURL());});

  };
  brainbrowser.setup('/models/surf_reg_model_both.obj');
  jQuery('#resetview').click(brainbrowser.setupView);
  jQuery('.view_button').change(brainbrowser.setupView);
  jQuery('[name=hem_view]').change(brainbrowser.setupView);
  jQuery(".button").button();
  jQuery(".button_set").buttonset();

});
