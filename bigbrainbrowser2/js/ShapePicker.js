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
    if(event.shiftKey && !(event.ctrlKey || event.metaKey)){
      console.log("only shift");
      callback(shapeInfo);
    }
  });
}


/*
  Perform a pick and call the callback only it the CTRL key was pressed.
  Works with CMD on mac.
*/
ShapePicker.prototype.ctrlPick = function(callback){
  this.genericPick(function(event, shapeInfo){
    if((event.ctrlKey || event.metaKey) && !event.shiftKey){
      console.log("only ctrl/cmd");
      callback(shapeInfo);
    }
  });
}


/*
  Perform a pick and call the callback only it the CTRL key was pressed.
  Works with CMD on mac.
*/
ShapePicker.prototype.ctrlAndShiftPick = function(callback){
  this.genericPick(function(event, shapeInfo){
    if((event.ctrlKey || event.metaKey) &&  event.shiftKey){
      console.log("both shift AND ctrl/cmd");
      callback(shapeInfo);
    }
  });
}
