/*
  AxisBox manages the axis visualization that is independant from the regular
  instance of BrainBrowser. An axisBox is a THREEjs context on its own but not
  a BrainBrowser instance.

  Constructor args:
    - BrainBrowserViewer: viewer object of the brainBrowser instance
    - domElement: String - ID of the div to put the AxisBox and make it work
*/
var AxisBox = function(BrainBrowserViewer, domElement){
  this.lineLength = 180;
  this.axisSystem = new THREE.Object3D();

  this.viewer = BrainBrowserViewer;

  this.camera = null;
  this.scene = null;
  this.renderer = null;
  this.domContainer = $('#' + domElement);

  this.init();
  this.animate();
  this.buildAxes();
}


/*
  Initialize the THREEjs context
*/
AxisBox.prototype.init = function(){
  var width = this.domContainer.width();
  var height = this.domContainer.height();
  var viewAngle = 45; // degrees
  var aspectRatio = width / height;
  var near = 0.1;
  var far = 1000;

  // init the camera
  this.camera = new THREE.PerspectiveCamera(
    viewAngle,
    aspectRatio,
    near,
    far
  );

  this.camera.position.set(0, 0, 500);

  // init the scene
  this.scene = new THREE.Scene();

  // add the camera to the scene
  this.scene.add(this.camera);

  // init the renderer
  this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
  this.renderer.setSize(width, height);

  this.domContainer.append(this.renderer.domElement);
}


/*

*/
AxisBox.prototype.animate = function(){
  requestAnimationFrame( this.animate.bind(this) );
	this.render();
}


/*

*/
AxisBox.prototype.render = function(){
  this.renderer.render( this.scene, this.camera );
}


AxisBox.prototype.buildAxes = function(){
  //var axisHelper = new THREE.AxisHelper( 50 );
  //this.scene.add( axisHelper );


  // x axis, positive side
  var xPos = this.drawLineGeneric(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(this.lineLength, 0, 0),
    {
      color: 0xbb0000,
      dashed: false
    }
  );

  // x axis, negative side
  var xNeg = this.drawLineGeneric(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-this.lineLength, 0, 0),
    {
      color: 0xFF8888,
      dashed: false
    }
  );

  // y axis, positive side
  var yPos = this.drawLineGeneric(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, this.lineLength, 0),
    {
      color: 0x006600,
      dashed: false
    }
  );

  // y axis, negative side
  var yNeg = this.drawLineGeneric(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, -this.lineLength, 0),
    {
      color: 0x66ff77,
      dashed: false
    }
  );

  // z axis, positive side
  var zPos = this.drawLineGeneric(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, this.lineLength),
    {
      color: 0x0000bb,
      dashed: false
    }
  );

  // z axis, negative side
  var zNeg = this.drawLineGeneric(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -this.lineLength),
    {
      color: 0x5588ff,
      dashed: false
    }
  );


  this.axisSystem.add(xPos);
  this.axisSystem.add(xNeg);
  this.axisSystem.add(yPos);
  this.axisSystem.add(yNeg);
  this.axisSystem.add(zPos);
  this.axisSystem.add(zNeg);

  this.scene.add( this.axisSystem )
}


/*

*/
AxisBox.prototype.drawLineGeneric = function(from, to, options){
  options      = options || {};
  var color    = options.color >= 0 ? options.color : 0x777777;

  // Create the geometry
  var geometry = new THREE.Geometry();
  geometry.vertices.push( from.clone() );
  geometry.vertices.push( to.clone() );
  geometry.computeLineDistances();

  // Set the material according with the dashed option
  var material = null;
  if(options.dashed){
    material = new THREE.LineDashedMaterial({ linewidth: 3, color: color, gapSize: 3 });
  }else{
    material = new THREE.LineBasicMaterial( { linewidth: 3, color: color });
  }

  var line = new THREE.Line( geometry, material, THREE.LinePieces );

  return line;

}


AxisBox.prototype.applyQuaternion = function(q){
  this.axisSystem.quaternion.copy( q );
}
