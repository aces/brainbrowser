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

    o3djs.event.addEventListener(bb.o3dElement, 'mousemove', function (e) {
      bb.drag(e);
    });

    o3djs.event.addEventListener(bb.o3dElement, 'mouseup', function (e) {
      if(!e.shiftKey || e.button == bb.o3d.Event.BUTTON_RIGHT){
	bb.stopDragging(e);
      }
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
	bb.rangeChange(min,max);
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

    jQuery("#fix_range").click(function(event,ui) {

      bb.fixRange= jQuery("#fix_range").attr("checked");
	alert("fixRange " + bb.fixRange);
    });

    jQuery(".range-box").keypress(function(e) {
      if(e.keyCode == '13'){
	bb.rangeChange(parseFloat(jQuery("#data-range-min").val()),parseFloat(jQuery("#data-range-max").val()));
      }
    });

    jQuery("#data-range-min").change(function(e) {
      jQuery("#range-slider").slider('values', 0, parseFloat(jQuery(this).val()));
    });

    jQuery("#data-range-max").change(function(e) {
      jQuery("#range-slider").slider('values', 1, parseFloat(jQuery(this).val()));
    });

  };

};