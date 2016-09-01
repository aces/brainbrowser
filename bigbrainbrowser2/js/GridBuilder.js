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
GridBuilder.prototype.updateBoundingBox = function(t){
  var that = this;
  var shapeCounter = 0;


  viewer.model_data.forEach(function(model_data, model_name){
    console.log(model_name);
    console.log(model_data);

    // init the bounding box
    if(shapeCounter == 0){
      that.boundingBox = {
        xMin : model_data.shapes[0].bounding_box.min_x,
        xMax : model_data.shapes[0].bounding_box.max_x,
        yMin : model_data.shapes[0].bounding_box.min_y,
        yMax : model_data.shapes[0].bounding_box.max_y,
        zMin : model_data.shapes[0].bounding_box.min_z,
        zMax : model_data.shapes[0].bounding_box.max_z
      };
    }


    model_data.shapes.forEach(function(elem){



      // finding the equivalent graphic shape (THREE object)

      shapeCounter ++;
    });


  });
}
