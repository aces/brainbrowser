/*
  Author: Jonathan Lurie (https://github.com/jonathanlurie)
  Project: BrainBrowser https://github.com/aces/brainbrowser
  Date: September 2016
  Institution: MCIN - Neuro - McGill University
  Licence: MIT

  GridManager builds grids that fits the size of the displayed shapes.
*/
var GridManager = function(BrainBrowserViewer){
  "use strict";
  // to access shapes and all
  this.viewer = BrainBrowserViewer;

  this.boundingBox = null;

  // the grid center is always at the origin
  this.gridCenter = new THREE.Vector3(0, 0, 0);

  // below this threshold, a shape is too transparent to be considered
  // when adjusting the bounding box.
  this.opacityThreshold = 0.15;

  // will contain the grid but also the mockup (rectangles)
  this.gridSystem = new THREE.Object3D();
  this.gridSystem.name = "grid";

  // default value, will be updated by this.defineGridStep()
  this.gridStepFactor = 1.0;

  // the grid is not visible by default, a button has to be clicked to show them
  this.gridSystem.visible = false;

   // adding to parent = adding to the scene
  this.viewer.graphicObjects.add(this.gridSystem);

  this.initCallbacks();

  this.viewer.gridSystem = this.gridSystem;
};


(function() {
  "use strict";
  /*
    Define some callback related to the grid
  */
  GridManager.prototype.initCallbacks = function(){
    var that = this;

    // SLIDER: grid step factor is changing with the slider
    $("#gridStepFactorSlider").on("input change", function(e){
      var sliderValue = parseFloat($(e.target).val());
      that.defineGridStepFactor(sliderValue);
      $("#gridStepFactorField").val(sliderValue);
    });

    // TEXT FIELD: to manually tune the factor by writing a number
    $("#gridStepFactorField").on("keyup", function(e){
      if(e.which === 13){
        var fieldValue = $(this).val();
        $("#gridStepFactorSlider").val(fieldValue);
        $("#gridStepFactorSlider").trigger("change");
      }
    });

  };


  /*
    Set the opacity threshold to this value.
    below this threshold, a shape is too transparent to be considered
    when adjusting the bounding box.
  */
  GridManager.prototype.setOpacityThreshold = function(t){
    this.opacityThreshold = t;
  };


  /*
    The bounding box takes under consideration the opacity of the shapes.
  */
  GridManager.prototype.updateBoundingBoxVisible = function(){
    var that = this;
    var shapeCounter = 0; // the first is the grid

    // reinit the boundingBox
    this.boundingBox = null;

    this.viewer.model_data.forEach(function(model_data){

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


    // we may have no bounding box at all (when shapes are all invisible)
    if(this.boundingBox){
      // add 10% to the box, so that shapes are not just at the border or it.
      // (average over the 3 dim)
      var size = new THREE.Vector3();
      this.boundingBox.size( size );
      this.boundingBox.expandByScalar( 0.1 * (size.x + size.y + size.z)/3 );
    }

  };


  /*
    Uses the center or a point of a given shape as center of the grid.
    Args:
      shapeNameOverall: String - unique name identifier for a shape
  */
  GridManager.prototype.centerShape = function(shapeNameOverall, center){
    var that = this;
    var shapeNotFound = true;

    this.viewer.model_data.forEach(function(model_data){

      model_data.shapes.forEach(function(logicShape){
        if(logicShape.name !== shapeNameOverall){ return; }

        viewer.resetCenterRotation();

        if (center === undefined) {
          $("#pick-index").html("");
          center = new THREE.Vector3(
            logicShape.centroid.x,
            logicShape.centroid.y,
            logicShape.centroid.z
          );
        }

        $("#pick-name").html(shapeNameOverall);
        $("#pick-x").html(center.x.toPrecision(4));
        $("#pick-y").html(center.y.toPrecision(4));
        $("#pick-z").html(center.z.toPrecision(4));

        that.centerOnPoint(center);
        shapeNotFound = false;
        return;
      });

      if(!shapeNotFound){
        return;
      }

    });

  };

  /*
    Return the bounding box. Possibly null.
  */
  GridManager.prototype.getBoundingBox = function(){
    return this.boundingBox;
  };


  /*
    Moves all the shapes so that newCenter is shifted to the origin (0, 0, 0)
    Args:
      center: THREE.Vector3 -- will be deep copied
  */
  GridManager.prototype.centerOnPoint = function(newCenter){
    this.viewer.changeCenterRotation2(newCenter);
  };


  /*
    Defines automatically the size of the grid using the
    bounding box and the grid center.
    The bounding box center will NOT be the center of the grid because we want
    the grid to be equally large on each side of the center (in every dimension).
    In addition, the center has to be within the bounding box, which is not
    supposed to be an issue since it's most likely a hit point.
  */
  GridManager.prototype.defineGridSizeAutoPlane = function(){
    // we need a boundingbox for auto define
    if(!this.boundingBox){
      console.warn("GridManager.defineGridSizeAuto, the bounding box is undefined.");
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

    // we will now using a mockup consisting in using planes instead of grids
    // because it's easier to build for testing

    // building all the materials
    var xyBoxMaterial = new THREE.MeshLambertMaterial( {
      transparent: true,
      opacity: 0.5,
      color: 0x0088ff,
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
      color: 0xff3333,
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
    // names are given to each plane but we dont really need that.
    // It comes pretty handy for debugging though
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

    // compute the bounding sphere (needed for resizing the axes)
    xyPlaneGeometry.computeBoundingSphere();
    xzPlaneGeometry.computeBoundingSphere();
    yzPlaneGeometry.computeBoundingSphere();

    // translate the grid system so that it centers on the _this.gridCenter_
    this.gridSystem.position.copy(this.gridCenter);

    // refresh
    this.viewer.updated = true;

  };


  /*
    Contrary to this.defineGridSizeAutoPlane(), this method creates a real grid
    (and not planes). When this.gridStepFactor is 1 (default) the step is chosen
    so that the smallest side of the bounding box contains 20 steps of grid
    (10 of each side of origin). Then, the same step is applied to the other
    ortho planes. When this.gridStepFactor is 2, the step are twice smaller but
    cover the same surface (cause they are more numerous, you know...)
  */
  GridManager.prototype.defineGridSizeAuto = function(){

    // we need a boundingbox for auto define
    if(!this.boundingBox){
      console.warn("GridManager.defineGridSizeAuto, the bounding box is undefined.");
      return;
    }

    // removing (potentially) existing grid components
    var xyPlaneToRemove = this.gridSystem.getObjectByName("xyPlane");
    var xyVisible       = true;
    if (xyPlaneToRemove !== undefined) { xyVisible = xyPlaneToRemove.visible; }
    var xzPlaneToRemove = this.gridSystem.getObjectByName("xzPlane");
    var xzVisible       = true;
    if (xzPlaneToRemove !== undefined) { xzVisible = xzPlaneToRemove.visible; }
    var yzPlaneToRemove = this.gridSystem.getObjectByName("yzPlane");
    var yzVisible       = true;
    if (yzPlaneToRemove !== undefined) { yzVisible = yzPlaneToRemove.visible; }
    this.gridSystem.remove(xyPlaneToRemove);
    this.gridSystem.remove(xzPlaneToRemove);
    this.gridSystem.remove(yzPlaneToRemove);


    // computing grid sizes
    var xSize = 2 * Math.max(
      Math.abs(this.boundingBox.max.x),
      Math.abs(this.boundingBox.min.x)
    );

    var ySize = 2 * Math.max(
      Math.abs(this.boundingBox.max.y),
      Math.abs(this.boundingBox.min.y)
    );

    var zSize = 2 * Math.max(
      Math.abs(this.boundingBox.max.z),
      Math.abs(this.boundingBox.min.z)
    );

    var smallest = Math.min(xSize, ySize, zSize) / 2;
    var step = smallest / (10 * this.gridStepFactor);


    // number of steps on a quarter of grid (we start from origin)
    var xNbStep = Math.ceil( (xSize/2) / step );
    var yNbStep = Math.ceil( (ySize/2) / step );
    var zNbStep = Math.ceil( (zSize/2) / step );
    // x = green = 0x00ff55
    var xzPlaneMesh = this.buildFlatGrid(xNbStep, zNbStep, step, 0x00ff55);
    xzPlaneMesh.rotateX(Math.PI / 2);
    xzPlaneMesh.name = "xzPlane";
    // y = blue  = 0x0088ff
    var xyPlaneMesh = this.buildFlatGrid(xNbStep, yNbStep, step, 0x0088ff);
    xyPlaneMesh.name = "xyPlane";
    // z = red   = 0xff3333
    var yzPlaneMesh = this.buildFlatGrid(zNbStep, yNbStep, step, 0xff3333);
    yzPlaneMesh.rotateY(Math.PI / 2);
    yzPlaneMesh.name = "yzPlane";

    // adding the mesh to the grid system object
    this.gridSystem.add( xyPlaneMesh );
    this.gridSystem.getObjectByName("xyPlane").visible = xyVisible;
    this.gridSystem.add( xzPlaneMesh );
    this.gridSystem.getObjectByName("xzPlane").visible = xzVisible;
    this.gridSystem.add( yzPlaneMesh );
    this.gridSystem.getObjectByName("yzPlane").visible = yzVisible;

    // compute the bounding sphere (needed for resizing the axes)
    xyPlaneMesh.geometry.computeBoundingSphere();
    xzPlaneMesh.geometry.computeBoundingSphere();
    yzPlaneMesh.geometry.computeBoundingSphere();

    // translate the grid system so that it centers on the _this.gridCenter_
    this.gridSystem.position.copy(this.gridCenter);

    // refresh
    this.viewer.updated = true;

  };


  /*
    Draws a generic grid on the plane XY
    quarterNbStepX: goes to x direction (convention we take)
    quarterNbStepY: goes to y direction (convention we take)
  */
  GridManager.prototype.buildFlatGrid = function(quarterNbStepX, quarterNbStepY, stepSize, color){
    var material = new THREE.LineBasicMaterial( { linewidth: 1, color: color });
    var geometry = new THREE.Geometry();

    // extrema position
    var xMin = -quarterNbStepX * stepSize;
    var xMax = quarterNbStepX * stepSize;
    var yMin = -quarterNbStepY * stepSize;
    var yMax = quarterNbStepY * stepSize;

    // lines parallel to x axis
    for(var j=yMin; j<yMax; j+=stepSize){
      geometry.vertices.push( new THREE.Vector3(xMin, j, 0) );
      geometry.vertices.push( new THREE.Vector3(xMax, j, 0) );
    }
    geometry.vertices.push( new THREE.Vector3(xMin, yMax, 0) );
    geometry.vertices.push( new THREE.Vector3(xMax, yMax, 0) );


    // lines parallel to y axis
    for(var i=xMin; i<xMax; i+=stepSize){
      geometry.vertices.push( new THREE.Vector3(i, yMin, 0) );
      geometry.vertices.push( new THREE.Vector3(i, yMax, 0) );
    }
    geometry.vertices.push( new THREE.Vector3(xMax, yMin, 0) );
    geometry.vertices.push( new THREE.Vector3(xMax, yMax, 0) );


    // TODO: when updating to a newer THREEjs, change to that:
    //var line = new THREE.LineSegments( geometry, material );

    var grid = new THREE.Line( geometry, material, THREE.LinePieces );
    return grid;
  };


  /*
    Updated the grid in one single function.
    (I was tired of always calling updateBoundingBoxVisible followed
    by defineGridSizeAuto)

  */
  GridManager.prototype.updateGrid = function(){
    this.updateBoundingBoxVisible();
    this.defineGridSizeAuto();
  };


  /*
    Display or hide the grid
  */
  GridManager.prototype.toggleGrid = function(){
    this.gridSystem.visible = !this.gridSystem.visible;
    this.viewer.updated = true;
  };


  /*
    hide the grid system
  */
  GridManager.prototype.hideGrid = function(){
    this.gridSystem.visible = false;
  };


  /*
    Compute the grid step so that half of the smallest dimension of the bounding box contains 10 steps. The same step is used over the 2 other dimensions.
  */
  GridManager.prototype.defineGridStepFactor = function(factor){
    this.gridStepFactor = factor;
    this.updateGrid();
  };
})();
