/*
  ShapePicker deals with all about raycasting.
*/
var ShapePicker = function(BrainBrowserViewer){
  this.viewer = BrainBrowserViewer;
}


/*
  Performs a generic pick at the pointer location.
  Args:
    callback: function with 2 arguments (event, shapeInfo)
              event: the original jquery click event
              shapeInfo: a THREE raycaster info
*/
ShapePicker.prototype.genericPick = function(callback){
  var that = this;

  $("#brainbrowser").click(function(event) {
    var shapeInfo = viewer.pick(that.viewer.mouse.x, that.viewer.mouse.y);

    if(shapeInfo){
      callback(event, shapeInfo);
    }

  });
}


/*
  Perform a pick and call the callback only it the SHIFT key was pressed.
*/
ShapePicker.prototype.shiftPick = function(callback){
  this.genericPick(function(event, shapeInfo){
    if(event.shiftKey){
      callback(shapeInfo);
    }
  });
}
