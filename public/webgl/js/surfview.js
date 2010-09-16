function SurfView() {
  var brainbrowser = new BrainBrowser();
  brainbrowser.getViewParams = function() {
    return {
      view: jQuery('[name=hem_view]:checked').val(),
      left: jQuery('#left_hem_visible').attr("checked"),
      right: jQuery('#right_hem_visible').attr("checked")
    };

  };
  brainbrowser.afterInit = function(bb) {

    //Add event handlers
    jQuery("body").keydown(bb.keyPressedCallback);

    o3djs.event.addEventListener(bb.o3dElement, 'mousedown', function (e) {
	bb.startDragging(e);
    });

    o3djs.event.addEventListener(bb.o3dElement, 'mousemove', function (e) {
      bb.drag(e);
    });

    o3djs.event.addEventListener(bb.o3dElement, 'mouseup', function (e) {
      if(!e.shiftKey || e.button == bb.o3d.Event.BUTTON_RIGHT){
	bb.stopDragging(e);
      }
    });

    jQuery("#objfile").change(function() {
	alert("triggered");
	bb.loadObjFromFile(document.getElementById("objfile"));
      });
  };
}

$(function() {
    var surfview = new SurfView();
  }
);