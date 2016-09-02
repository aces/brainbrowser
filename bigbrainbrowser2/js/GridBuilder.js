/*
  GridBuilder builds grids that fits the size of the displayed shapes.
*/
var GridBuilder = function(BrainBrowserViewer){
  // to access shapes and all
  this.viewer = BrainBrowserViewer;

  this.boundingBox = null

  this.gridCenter = new THREE.Vector3();
  this.setGridCenterAuto();

  // below this threshold, a shape is too transparent to be considered
  // when adjusting the bounding box.
  this.opacityThreshold = 0.15;

  // will contain the grid but also the mockup (rectangles)
  this.gridSystem = new THREE.Object3D();
  this.gridSystem.name = "grid";
  this.viewer.model.add(this.gridSystem);
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
  var shapeCounter = 1; // the first is the grid

  // reinit the boundingBox
  this.boundingBox = null;

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
        if(!that.boundingBox){
          that.boundingBox = new THREE.Box3(min, max);
        }else{
          that.boundingBox.expandByPoint(min);
          that.boundingBox.expandByPoint(max);
        }

      }
      shapeCounter ++;
    });
  });



}


/*
  Return the bounding box. Possibly null.
*/
GridBuilder.prototype.getBoundingBox = function(){
  return this.boundingBox;
}


/*
  defines the center of the grid.
  Args:
    center: array [x, y, z] -- will be deep copied
*/
GridBuilder.prototype.setGridCenter = function(center){
  this.gridCenter.set(center[0], center[1], center[2]);
}


/*
  If the _this.boundingBox_ exists, takes the center of it,
  if it doesn't, just take (0, 0, 0).
*/
GridBuilder.prototype.setGridCenterAuto = function(){
  if(this.boundingBox){
    this.gridCenter = this.boundingBox.center();
  }else{
    this.gridCenter.set(0, 0, 0);
  }
}


/*
  Defines automatically the size of the grid using the
  bounding box and the grid center.
  The bounding box center will NOT be the center of the grid because we want
  the grid to be equally large on each side of the center (in every dimension).
  In addition, the center has to be within the bounding box, which is not
  supposed to be an issue since it's most likely a hit point.
*/
GridBuilder.prototype.defineGridSizeAuto = function(){
  // we need a boundingbox for auto define
  if(!this.boundingBox){
    console.warn("GridBuilder.defineGridSizeAuto, the bounding box is undefined.");
    return;
  }

  // center must be inside the bbox
  if(!this.boundingBox.containsPoint(this.gridCenter)){
    console.warn("GridBuilder.defineGridSizeAuto, the predefined center is out of the bounding box.");
    return;
  }

  // removing (potentially) existing grid components
  var xyPlaneToRemove = this.gridSystem.getObjectByName("xyPlane");
  var xzPlaneToRemove = this.gridSystem.getObjectByName("xzPlane");
  var yzPlaneToRemove = this.gridSystem.getObjectByName("yzPlane");
  this.gridSystem.remove(xyPlaneToRemove);
  this.gridSystem.remove(xzPlaneToRemove);
  this.gridSystem.remove(yzPlaneToRemove);

  // computing grid sizes
  var xSize = 2 * Math.max(this.boundingBox.max.x - this.gridCenter.x, this.gridCenter.x - this.boundingBox.min.x);

  var ySize = 2 * Math.max(this.boundingBox.max.y - this.gridCenter.y, this.gridCenter.y - this.boundingBox.min.y);

  var zSize = 2 * Math.max(this.boundingBox.max.z - this.gridCenter.z, this.gridCenter.z - this.boundingBox.min.z);


  // TODO: maybe remove that, we may not use it
  // computing planes dimensions.
  var xyPlaneSize = new THREE.Vector3(xSize, ySize, 0);
  var xzPlaneSize = new THREE.Vector3(xSize, 0, zSize);
  var yzPlaneSize = new THREE.Vector3(0, ySize, zSize);

  // we will now using a mockup consisting in using planes instead of grids
  // because it's easier to build for testing

  // building all the materials
  var xyBoxMaterial = new THREE.MeshLambertMaterial( {
    transparent: true,
    opacity: 0.5,
    color: 0xff3333,
    emissive: 0x000000,
    depthWrite: true,
    depthTest: true,
    side: THREE.DoubleSide
  });

  var xzBoxMaterial = new THREE.MeshLambertMaterial( {
    transparent: true,
    opacity: 0.5,
    color: 0x00ff55,
    emissive: 0x000000,
    depthWrite: true,
    depthTest: true,
    side: THREE.DoubleSide
  });

  var yzBoxMaterial = new THREE.MeshLambertMaterial( {
    transparent: true,
    opacity: 0.5,
    color: 0x0088ff,
    emissive: 0x000000,
    depthWrite: true,
    depthTest: true,
    side: THREE.DoubleSide
  });

  //building the geometries
  var xyPlaneGeometry = new THREE.PlaneGeometry(xSize, ySize);
  var xzPlaneGeometry = new THREE.PlaneGeometry(xSize, zSize);
  //xzPlaneGeometry.rotateX(Math.PI / 2);
  var yzPlaneGeometry = new THREE.PlaneGeometry(zSize, ySize);
  //yzPlaneGeometry.rotateY(Math.PI / 2);

  // assembling the meshes
  var xyPlaneMesh = new THREE.Mesh( xyPlaneGeometry, xyBoxMaterial );
  xyPlaneMesh.name = "xyPlane";
  var xzPlaneMesh = new THREE.Mesh( xzPlaneGeometry, xzBoxMaterial );
  xzPlaneMesh.rotateX(Math.PI / 2);
  xzPlaneMesh.name = "xzPlane";
  var yzPlaneMesh = new THREE.Mesh( yzPlaneGeometry, yzBoxMaterial );
  yzPlaneMesh.rotateY(Math.PI / 2);
  yzPlaneMesh.name = "yzPlane";

  // adding the mesh to the grid system object
  this.gridSystem.add( xyPlaneMesh );
  this.gridSystem.add( xzPlaneMesh );
  this.gridSystem.add( yzPlaneMesh );

  // translate the grid system so that it centers on the _this.gridCenter_
  this.gridSystem.position.copy(this.gridCenter);

}