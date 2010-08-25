var brainbrowser;
jQuery(function () {

  brainbrowser = new BrainBrowser();
  brainbrowser.afterInit = function(bb) {
    var macacc = new MacaccObject(bb,"/data/gaolang_data/");


    jQuery('#fillmode').toggle(bb.set_fill_mode_wireframe,bb.set_fill_mode_solid);
    jQuery('#range_change').click(macacc.range_change);
    jQuery('.data_controls').change(macacc.data_control_change);
    macacc.pickInfoElem=jQuery("#vertex_info");
    jQuery('#screenshot').click(function(event) {jQuery(this).attr("href",bb.client.toDataURL());});

  };
  brainbrowser.setup('/models/surf_reg_model_both.obj');
  jQuery('#resetview').click(brainbrowser.resetView);
  jQuery('#sagitalView').click(brainbrowser.sagitalView);
  jQuery('#exteriorSagital').click(brainbrowser.reverseSagitalView);
  jQuery('#leftView').click(brainbrowser.leftView);
  jQuery('#rightView').click(brainbrowser.rightView);
  jQuery('#anteriorView').click(brainbrowser.anteriorView);
  jQuery('#posteriorView').click(brainbrowser.posteriorView);

  jQuery(".button").button();
  jQuery(".button_set").buttonset();

});












