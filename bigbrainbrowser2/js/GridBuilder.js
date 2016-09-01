/*
  GridBuilder builds grids that fits the size of the displayed shapes.
*/
var GridBuilder = function(BrainBrowserViewer){
  // to access shapes and all
  this.viewer = BrainBrowserViewer;

  // to be updated
  this.boundingBox = {
    xMin : undefined,
    xMax : undefined,
    yMin : undefined,
    yMax : undefined,
    zMin : undefined,
    zMax : undefined
  };

  // below this threshold, a shape is too transparent to be considered
  // when adjusting the bounding box.
  this.opacityThreshold = 0.15;
}


/*
  Set the opacity threshold to this value.
  below this threshold, a shape is too transparent to be considered
  when adjusting the bounding box.
*/
GridBuilder.prototype.setOpacityThreshold = function(t){
  this.opacityThreshold = t;
}


/*
  The bounding box takes under consideration the opacity of the shapes.
*/
GridBuilder.prototype.updateBoundingBox = function(){
  var that = this;
  var shapeCounter = 0;

  var bbox = null;//THREE.Box3();

  this.viewer.model_data.forEach(function(model_data, model_name){

    model_data.shapes.forEach(function(logicShape){

      // finding the equivalent graphic shape (THREE object)
      var graphicShape = that.viewer.model.children[shapeCounter];

      if(graphicShape.visible &&
        parseFloat(graphicShape.material.opacity) > that.opacityThreshold ){

        var min = new THREE.Vector3(
            logicShape.bounding_box.min_x,
            logicShape.bounding_box.min_y,
            logicShape.bounding_box.min_z
          );

        var max = new THREE.Vector3(
            logicShape.bounding_box.max_x,
            logicShape.bounding_box.max_y,
            logicShape.bounding_box.max_z
          );

        // init the box with the first point
        if(!bbox){
          bbox = new THREE.Box3(min, max);
        }else{
          bbox.expandByPoint(min, max);
        }

      }

      shapeCounter ++;
    });

  });

  console.log(bbox);

}
