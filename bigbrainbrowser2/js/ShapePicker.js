/*
  Author: Jonathan Lurie (https://github.com/jonathanlurie)
  Project: BrainBrowser https://github.com/aces/brainbrowser
  Date: September 2016
  Institution: MCIN - Neuro - McGill University
  Licence: MIT


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
    var shapeInfo = that.viewer.pick(that.viewer.mouse.x, that.viewer.mouse.y);

    if(shapeInfo){
      callback(event, shapeInfo);
    }

  });
}


/*
  TODO: doc
*/
ShapePicker.prototype.genericPickModelAndAnnot = function(callback){
  var that = this;

  $("#brainbrowser").click(function(event) {
    var mouse = new THREE.Vector2();
    mouse.x = (that.viewer.mouse.x / that.viewer.dom_element.offsetWidth) * 2 - 1;
    mouse.y = (- that.viewer.mouse.y / that.viewer.dom_element.offsetHeight) * 2 + 1;

    // raycaster, the old fashioned way (I don't think it's like like in recent release)
    var raycaster = new THREE.Raycaster();
    var vector       = new THREE.Vector3(mouse.x, mouse.y, that.viewer.camera.near);
    vector.unproject(that.viewer.camera);

    raycaster.set(
      that.viewer.camera.position,
      vector.sub(that.viewer.camera.position).normalize()
    );

    var intersectsModel = raycaster.intersectObject(that.viewer.model, true);
    var intersectsAnnotations = raycaster.intersectObject(that.viewer.annotationSystem, true);

    callback(
      event,
      intersectsModel.length ? intersectsModel[0] : null,
      intersectsAnnotations.length ? intersectsAnnotations[0] : null
    );

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

  Contrary to ctrlAndShiftPickScene, takes only ontersection to model!
*/
ShapePicker.prototype.ctrlAndShiftPick = function(callback){
  this.genericPick(function(event, shapeInfo){
    if((event.ctrlKey || event.metaKey) &&  event.shiftKey){
      console.log("both shift AND ctrl/cmd");
      callback(shapeInfo);
    }
  });
}


/*
  Perform a pick and call the callback only it the CTRL key was pressed.
  Works with CMD on mac.

  Contrary to ctrlAndShiftPick, this one takes all the children of the scene.
*/
ShapePicker.prototype.ctrlAndShiftPickModelAndAnnot = function(callback){
  this.genericPickModelAndAnnot(function(event, intersectModel, intersectAnnot){
    if((event.ctrlKey || event.metaKey) &&  event.shiftKey){
      console.log("both shift AND ctrl/cmd");
      callback(intersectModel, intersectAnnot);
    }
  });
}
