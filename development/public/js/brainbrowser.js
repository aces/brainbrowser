/* 
 * BrainBrowser.js
 * 
 * Copyright (C) 2011 McGill University
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 * 
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */


/**
 * Create new BrainBrowser viewer object
 * @constructor
 *  
 */
function BrainBrowser() {
  var that = this; //Brainbrowser object. Makes sure that if "this" is remapped then we can still
                   // refer to original object. Also for local functions "this" is not available 
                   // but "that" is and can be used for special helper methods. 
  
  //add object management functions from object.js file to brainbrowser 
  bbObject(this); 
  
  var colorManager = new ColorManager();
  var view_window; //canvas element
  var renderer; //THREE.js renderer
  var camera; //THREE.js camera
  var pointLight;
  var scene; //THREE.js scene
  var brain = new THREE.Object3D();
  var camera_controls;
  var light_controls;
  var current_frame;
  var last_frame;
  
  this.start = function() {
    window.onload = function() {
      setTimeout(function(){
        that.init();
      }, 1);
    };
  }
  
  this.init = function() {
    
    scene = new THREE.Scene();
    view_window = $("#view-window");
    camera = new THREE.PerspectiveCamera(30, view_window.width()/view_window.height(), 0.1, 5000);
    
    if (webgl_enabled()) {
      renderer = new THREE.WebGLRenderer({clearColor: 0x888888, clearAlpha: 1, preserveDrawingBuffer: true});
    } else {
      view_window.html(webGLErrorMessage());
      return;
    }
    
    renderer.setSize(view_window.width(), view_window.height());
    view_window.append(renderer.domElement);  
    
    camera.position.z = 500;
    
    pointLight = new THREE.PointLight(0xFFFFFF);

    pointLight.position.x = 0;
    pointLight.position.y = 0;
    pointLight.position.z = 500;

    scene.add(pointLight);
    
    camera_controls = new THREE.TrackballControls(camera, view_window[0]);
    light_controls = new THREE.TrackballControls(pointLight, view_window[0]);
    camera_controls.zoomSpeed = 2;                 
    light_controls.zoomSpeed = 2;
    
    function render(timestamp) {
    	requestAnimationFrame(render);
      
      last_frame = current_frame || timestamp;
      current_frame = timestamp;
      
      camera_controls.update();
      light_controls.update();
      that.renderCallback(timestamp);
    }
    
    if(that.afterInit) {
      that.afterInit(that); 
    }
    
    window.onresize();      
    
    render();
  };
  
  /*! 
   * WebGL test taken from Detector.js by
   * alteredq / http://alteredqualia.com/
   * mr.doob / http://mrdoob.com/
  */
  function webgl_enabled() { 
    try { 
      return !!window.WebGLRenderingContext && !!document.createElement( 'canvas' ).getContext( 'experimental-webgl' ); 
    } catch(e) { 
      return false; 
    } 
  }

  function webGLErrorMessage() {
    var text = 'BrainBrowser requires <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation">WebGL</a>.<br/>';
    text += window.WebGLRenderingContext ? 'Your browser seems to support it, but it is <br/> disabled or unavailable.<br/>' : 
            "Your browser does not seem to support it.<br/>";
		text += 'Test your browser\'s WebGL support <a href="http://get.webgl.org/">here</a>.';
		
    var el = $('<div id="webgl-error">' + text + '</div>');
        
    return el;
  }

  
  this.setCamera = function(x, y, z) {
    camera.position.set(x, y, z);
  }
  
  this.getModel = function() {
    return brain;
  }
  
  function addBrain(obj, renderDepth) {
    that.model_data = obj;
    var left = createHemisphere(obj.left);
    left.name = "left";
    left.model_num = 0;
    var right = createHemisphere(obj.right);
    right.name = "right"
    right.model_num = 1;
    brain.add(left);
    brain.add(right);
    
    scene.add(brain);
  }
  
  function createHemisphere(obj) {
    var verts = obj.positionArray;
    var ind = obj.indexArray;
    var bounding_box = {};
    var centroid = {};
    
    //Calculate center so positions of objects relative to each other can
    // defined (mainly for transparency).
    for(var i = 0; i+2 < verts.length; i+=3) {
      boundingBoxUpdate(bounding_box, verts[i], verts[i+1], verts[i+2]);
    }
    centroid.x = bounding_box.minX + 0.5 * (bounding_box.maxX - bounding_box.minX);
    centroid.y = bounding_box.minY + 0.5 * (bounding_box.maxY - bounding_box.minY);
    centroid.z = bounding_box.minY + 0.5 * (bounding_box.maxZ - bounding_box.minZ);
    
    var geometry = new THREE.Geometry();
    for(var i = 0; i+2 < verts.length; i+=3) {
      geometry.vertices.push(new THREE.Vector3(verts[i]-centroid.x, verts[i+1]-centroid.y, verts[i+2]-centroid.z));
    }
    for(var i = 0; i+2 < ind.length; i+=3) {
      geometry.faces.push(new THREE.Face3(ind[i], ind[i+1], ind[i+2]));
    }
    
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    
    var material = new THREE.MeshPhongMaterial({color: 0xFFFFFF, ambient: 0x0A0A0A, specular: 0x080808, vertexColors: THREE.VertexColors});
    var hemisphere = new THREE.Mesh(geometry, material);
    hemisphere.centroid = centroid;
    hemisphere.position.set(centroid.x, centroid.y, centroid.z);
    
    return hemisphere;
  }

  function addLineObject(obj, filename, mesh, renderDepth) {
    var lineObject = createLineObject(obj, mesh);
    lineObject.name = filename; 
    if(renderDepth) {
      lineObject.renderDepth = renderDepth;
    }

    brain.add(lineObject);
    
    scene.add(brain);  
  }

  function createLineObject(obj, mesh) {
    that.model_data = obj;
  
    var indices = [];
    var verts = []; 
    var colors = [];
    var bounding_box = {};
    var centroid = {};

    for(var i = 0; i < that.model_data.nitems; i ++){
      if(i == 0){
        var start = 0;
      }else {
        var start = that.model_data.endIndicesArray[i-1];
      }
      indices.push(that.model_data.indexArray[start]);
      for(var k = start+1; k < that.model_data.endIndicesArray[i]-1; k++) {
        indices.push(that.model_data.indexArray[k]);
        indices.push(that.model_data.indexArray[k]);
      }
      indices.push(that.model_data.indexArray[that.model_data.endIndicesArray[i]-1]);
    }   
    
    var posArray = that.model_data.positionArray;
  
    //Calculate center so positions of objects relative to each other can be determined.
    //Mainly for transparency.
    for(var j = 0; j < indices.length; j++) {
      boundingBoxUpdate(bounding_box, posArray[indices[j]*3], posArray[indices[j]*3+1], posArray[indices[j]*3+2]);
    }
    
    centroid.x = bounding_box.minX + 0.5 * (bounding_box.maxX - bounding_box.minX);
    centroid.y = bounding_box.minY + 0.5 * (bounding_box.maxY - bounding_box.minY);
    centroid.z = bounding_box.minY + 0.5 * (bounding_box.maxZ - bounding_box.minZ);
    
    if(!mesh) {   
    
      for(var j = 0; j < indices.length; j++) {
        verts.push(new THREE.Vector3(
                      posArray[indices[j]*3] - centroid.x,
                      posArray[indices[j]*3+1] - centroid.y,
                      posArray[indices[j]*3+2] - centroid.z
                    ));
      }
      var colorArray=[];
      if(that.model_data.colorArray.length == 4) {
	      for(var i=0;i<numberVertices;i++) {
	        colorArray.push.apply(colorArray,[0.5,0.5,0.7,1]);
	      }
      }else {
	      //colorArray = new Float32Array(indexArray.length*4);
	      var colorArray = that.model_data.colorArray;
	      
	      for(var j = 0; j < indices.length; j++) {
	        var col = new THREE.Color();
          col.setRGB(colorArray[indices[j]*4], colorArray[indices[j]*4+1], colorArray[indices[j]*4+2]);
          colors.push(col);
	      }
      }
      
    }else {
      verts = that.model_data.meshPositionArray;
      colors = that.model_data.meshColorArray;
    }

    
    var geometry = new THREE.Geometry();
    geometry.vertices = verts; 
    geometry.colors = colors;

    geometry.colorsNeedUpdate = true;
    
    var material = new THREE.LineBasicMaterial({vertexColors: THREE.VertexColors});
    var lineObject = new THREE.Line(geometry, material, THREE.LinePieces);
    lineObject.position.set(centroid.x, centroid.y, centroid.z);
    lineObject.centroid = centroid;
    
    return lineObject;
  }
  
  function addPolygonObject(obj,filename, renderDepth){
    that.model_data = obj;

    if (that.model_data.shapes){
      for (var i = 0; i < that.model_data.shapes.length; i++){
	      var shape = createPolygonShape(that.model_data.shapes[i]);
	      shape.name = that.model_data.shapes[i].name;
	      brain.add(shape);      	
      }
    }else {
      var shape = createPolygonShape(that.model_data);
      shape.name = filename;
      brain.add(shape);      
    }

    if(that.afterCreate != undefined) {
      that.afterCreate(that.model_data);
    }
    
    scene.add(brain);
  }
  
  function createPolygonShape(model_data) {
    
    var positionArray = model_data.positionArray;
    var indexArray  = model_data.indexArray;
    
    var colorArray=[];

    
    if(model_data.colorArray.length == 4) {
      for (var i = 0; i < positionArray.length / 3; i++) {
	      colorArray.push(model_data.colorArray[0]);
	      colorArray.push(model_data.colorArray[1]);
	      colorArray.push(model_data.colorArray[2]);
      }
    }else {
      colorArray = [];
      var indexArrayLength = indexArray.length;
      for(var j = 0; j + 2 < model_data.colorArray.length; j += 4) {
	      colorArray.push(model_data.colorArray[j]);
	      colorArray.push(model_data.colorArray[j+1]);
	      colorArray.push(model_data.colorArray[j+2]);
      }
    }
    
    var colors = [];
    var col;

    var geometry = new THREE.Geometry();
    for (var i = 0; i + 2 < positionArray.length; i += 3) {
      geometry.vertices.push(new THREE.Vector3(positionArray[i], positionArray[i+1], positionArray[i+2]));
                    
      col = new THREE.Color();
      col.setRGB(colorArray[i], colorArray[i+1], colorArray[i+2]);
      colors.push(col);
    }
    
    if (model_data.faces && model_data.faces.length > 0) {
      var faces = model_data.faces;
      for(var i = 0; i < faces.length; i++) {
        if (faces[i].length < 3) continue;
        if (faces[i].length <= 4){
          if (faces[i].length <= 3) {
            var face = new THREE.Face3(faces[i][0], faces[i][1], faces[i][2]);
          } else if (faces[i].length == 4){
            var face = new THREE.Face4(faces[i][0], faces[i][1], faces[i][2], faces[i][3]);
          }
          face.vertexColors[0] = colors[face.a];
          face.vertexColors[1] = colors[face.b];
          face.vertexColors[2] = colors[face.c];
          if (faces[i].length > 3) {
            face.vertexColors[3] = colors[face.d];
          }
          geometry.faces.push(face);
        } else {
          for (var j = 1; j + 1 < faces[i].length; j++) {
            var face = new THREE.Face3(faces[i][0], faces[i][j], faces[i][j+1]);
            face.vertexColors[0] = colors[face.a];
            face.vertexColors[1] = colors[face.b];
            face.vertexColors[2] = colors[face.c];
            geometry.faces.push(face);
          }
        }      
      }
    } else {
      for(var i = 0; i + 2 < indexArray.length; i+=3) {
        var face = new THREE.Face3(indexArray[i], indexArray[i+1], indexArray[i+2]);
        face.vertexColors[0] = colors[face.a];
        face.vertexColors[1] = colors[face.b];
        face.vertexColors[2] = colors[face.c];
        geometry.faces.push(face);
      }
    }
    
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    geometry.colorsNeedUpdate = true;

    var material = new THREE.MeshPhongMaterial({color: 0xFFFFFF, ambient: 0x0A0A0A, specular: 0x080808, vertexColors: THREE.VertexColors});
    
    var polygonShape = new THREE.Mesh(geometry, material);
      
    if(that.loading){
      jQuery(that.loading).html("Buffers Loaded");
    }
    
    
    
    return polygonShape;
  }

  /*
   * unregisters the event handlers 
   */
  this.uninit = function() {
    if (this.client) {
      this.client.cleanup();
    }
  };

  
  /*
   * Called at every render events. 
   */
  this.renderCallback = function() {
    var delta = current_frame - last_frame;
    var rotation = delta * 0.00015;
    
    if(that.autoRotate) {
      
      if(that.autoRotate.x){
	       brain.rotation.x += rotation;
      }
      if(that.autoRotate.y){
        brain.rotation.y += rotation;
      }
      if(that.autoRotate.z){
	      brain.rotation.z += rotation;
      }
      
    }
    renderer.render(scene, camera);
  };

  /** 
   * Delete all the shapes on screen
   * For this the function travels down the scenegraph and removes every shape.
   * 
   * Tip: when you remove a shape, the shapes array lenght will be decremented so if you need to count the number of shapes, you must save that length value before removing shapes. 
   */
  this.clearScreen = function() {
    if(brain) {
      scene.remove(brain)
    }
    that.resetView();
    
    brain = new THREE.Object3D();
    
    if(that.afterClearScreen != undefined) {
      that.afterClearScreen();
    }
  };

  /**
   * Display and MNI object file.
   * It uses different function depending on if it's a polygon(triange) shape denoted by P
   * if it's a polygon shape and has exactly 81924 vertices than it's probably a braina and
   * we handle that specialy to seperate the hemispheres. 
   *
   * @param {Object} obj object of the parsed MNI Object file to be displayed
   * @param {String} filename filename of the original object file   
   */
  this.displayObjectFile = function(obj, filename, opts) {
    var options = opts || {};
    var renderDepth = options.renderDepth;
    if(obj.objectClass == 'P' && obj.numberVertices == 81924) {
      addBrain(obj, renderDepth);
    }else if(obj.objectClass == 'P') {
	    addPolygonObject(obj,filename, renderDepth);	  
    }else if(obj.objectClass == 'L') {
      addLineObject(obj, filename, false, renderDepth);
    }else {
      alert("Object file not supported");
    }
    if(that.afterDisplayObject != undefined) {
      that.afterDisplayObject(brain);      
    }
    var options = opts || {};    
    var afterDisplay = options.afterDisplay;
    if (afterDisplay) afterDisplay();
  };

  /**
   * Initialize the range for a file if it's not already set or 
   * fixed by the user. 
   * @param {Number} min minimum value of the range if the  range is not fixed
   * @param {Number} max maximum value of the range if the range is not fixed 
   * @param {Object} file Data file on which the range will be set
   */ 
  function initRange(min,max,file) {
    if(file == null) {
     file = that.model_data.data;
    }
    if(file.fixRange == false || file.fixRange == null) {
      file.rangeMin = min;
      file.rangeMax = max;
    }
  }


  /**
   * Updates the clear color or background of the view window
   * @param {Number[]} color Takes an array with 4 elements, the color must be represented as for values from 0-1.0 [red,green,blue,alpha] 
    * 
   */
  this.updateClearColor = function(color)  {
    renderer.setClearColor(new THREE.Color(color));
  };

  /**
   * Used to select some predefined colors
   * @param {String} name name of color from pre defined list (white,black,pink)
   */
  this.updateClearColorFromName = function(name) {
    if (name == "white") {
      that.updateClearColor(0xFFFFFF);
    }else if(name == "black") {
      that.updateClearColor(0x000000);
    } else if(name == "pink"){
      that.updateClearColor(0xFF00FF);
    }else{
      that.updateClearColor(0x888888);
    }
  };

  

  /**
   * Resets the view of the scene by resetting its local matrix to the identity
   * matrix.
   */
  this.resetView = function() {
    camera_controls.reset();                 
    light_controls.reset();
    brain.position.set(0, 0, 0);
    brain.rotation.set(0, 0, 0);
    for(var i = 0; i < brain.children.length; i++) {
      var child = brain.children[i];
      child.visible = true;
      if (child.centroid) {
        child.position.set(child.centroid.x, child.centroid.y, child.centroid.z);
      } else {
        child.position.set(0, 0, 0);
      }
      child.rotation.set(0, 0, 0);
    }
  };



  /**
   * Figures out what view has been selected and activates it
   */
  this.setupView = function(e) {
    that.resetView();
    if(that.model_data && that.model_data.num_hemispheres == 2) {
      var params=that.getViewParams(); //Must be defined by calling app
      switch(params.view) {
        case 'superior':
        that.superiorView();
        break;
        case 'medial':
        that.medialView();
        break;
        case 'anterior':
        that.anteriorView();
        break;
        case 'inferior':
        that.inferiorView();
        break;
        case 'lateral':
        that.lateralView();
        break;
        case 'posterior':
        that.posteriorView();
        break;
        default:
        that.superiorView();
        break;
      }

    }

    /*
     * Decides if the hemispheres need to be shown
     */
    if (brain.getChildByName("left")) {
      if(params.left  == true) {
        that.leftHemisphereVisible(true);
      }else {
        that.leftHemisphereVisible(false);
      }
    }
    if (brain.getChildByName("right")) {
      if(params.right == true ) {
        that.rightHemisphereVisible(true);
      }else {
        that.rightHemisphereVisible(false);
      }
    }
    //that.thatRot = that.math.matrix4.mul(that.brainTransform.localMatrix, that.math.matrix4.identity());
  };
  
  function degToRad(deg) {
    return deg * Math.PI/180;
  }

  /**
   * functions turn the left hemisphere shapes visibility on off
   * @param {Bool} state  boolean (true == visible, false == not visible) 
   */
  this.leftHemisphereVisible = function(state)  {
    brain.getChildByName("left").visible = state;
  };


  /**
   * functions turn the right hemisphere shapes visibility on off
   * @param {Bool} state  boolean (true == visible, false == not visible) 
   */
  this.rightHemisphereVisible = function(state)  {
    brain.getChildByName("right").visible = state;
  };



  /**
   * function to handle to preset views of the system.
   * 
   */
  this.medialView = function(e) {
    if(that.model_data.num_hemispheres == 2 ) {
      brain.getChildByName("left").position.x -= 100;
      brain.getChildByName("left").rotation.z -= degToRad(90);
      brain.getChildByName("right").position.x += 100;
      brain.getChildByName("right").rotation.z += degToRad(90);     
      brain.rotation.x += degToRad(-90);
    }
  };

  /**
   * function to handle to preset views of the system.
   */
  this.lateralView = function(e) {

    if(that.model_data.num_hemispheres == 2 ) {
      brain.getChildByName("left").position.x -= 100;
      brain.getChildByName("left").rotation.z += degToRad(-90);
      brain.getChildByName("right").position.x += 100;
      brain.getChildByName("right").rotation.z += degToRad(90);
      brain.rotation.x += degToRad(90);
      brain.rotation.y += degToRad(180);
    }
  };


  /**
   * function to handle to preset views of the system.
   */
  this.superiorView = function() {
    //nothing should be already done with reset view, placeholder
  };

  /**
   * function to handle to preset views of the system.
   */
  this.inferiorView = function() {
    brain.rotation.y += degToRad(180);
  };

  /**
   * function to handle to preset views of the system.
   */
  this.anteriorView = function(e) {
    that.resetView();
    brain.rotation.x += degToRad(-90);
    brain.rotation.z += degToRad(180);
  };

  /**
   * function to handle to preset views of the system.
   */
  this.posteriorView = function(e) {
    that.resetView();
    brain.rotation.x += degToRad(-90);
  };


  /**
   * Adds space between the hemispheres
   */
  this.separateHemispheres = function(e) {
    if(that.model_data.num_hemispheres == 2 ) {
      brain.children[0].position.x -= 1;
      brain.children[1].position.x += 1;
    }
  };
  


  /**
   * The following methods implement the zoom in and out
   */
  this.ZoomInOut = function(zoom) {
    camera.fov *= zoom;
    camera.updateProjectionMatrix();
    // for (var i = 0; i < that.eyeView.length; i += 1) {
    //    that.eyeView[i] = that.eyeView[i] / zoom;
    //  }
    // 
    //  that.viewInfo.drawContext.view = that.math.matrix4.lookAt(
    //    that.eyeView, // eye
    //    [0, 0, 0],   // target
    //    [0, 1, 0]);  // up
  };

  /**
   * Using the mouse wheel zoom in and out of the model.
   */
  that.scrollMe = function(e) {
    var zoom = (e.deltaY < 0) ? 1 / that.zoomFactor : that.zoomFactor ;
    that.ZoomInOut(zoom);
    that.client.render();
  };

  function select(pickInfo) {

    unSelectAll();
      if (pickInfo) {
      that.selectedInfo = pickInfo;
    }
  }


  function unSelectAll() {

    if (that.selectedInfo) {
      that.highlightShape = null;
      that.selectedInfo = null;
    }
  }


  /*
   * This method can be used to detect where the user clicked
   * it takes a callback method which will receive the event and
   * and info object containing the following:
   *
   * primitiveIndex: the index of the polygon clicked on the object
   * positionVector: the x,y,z of the click
   * element: the element (whitin the shape) that was clicked
   * hemisphere: the name of the hemisphere clicked right or left or
   *             undefined if not a hemisphere
   *
   *
   *
  */
  this.click = function(e, click_callback) {
    var offset = view_window.offset();
    mouseX = ((e.clientX - offset.left + $(window).scrollLeft())/view_window.width()) * 2 - 1;
    mouseY = -((e.clientY - offset.top + $(window).scrollTop())/view_window.height()) * 2 + 1;
    
    var projector = new THREE.Projector();
    var raycaster = new THREE.Raycaster();
     
    unSelectAll();
    
    var vector = new THREE.Vector3(mouseX, mouseY, 1);
    projector.unprojectVector(vector, camera);
    raycaster.set(camera.position, vector.sub(camera.position).normalize() );
    var intersects = raycaster.intersectObject(brain, true);
    if (intersects.length > 0) {      
      var intersection = intersects[0];
      var vertex_data = {
        vertex: intersection.face.a,
        point: new THREE.Vector3(intersection.point.x, intersection.point.y, intersection.point.z),
        object: intersection.object
      };
      return click_callback(e, vertex_data);
    } else {
      jQuery(that.pickInfoElem).html('--nothing--');
      return false;
    }
  };


  //Returns the position and info about a vertex
  //currently a wrapper for model.getVertexInfo
  //Should theoretically return thei same infor as click and
  //click should use this to build that info object
  this.getInfoForVertex = function(vertex) {
    var model_data = that.model_data.getVertexInfo(vertex);
    var vertex_data = {
      vertex: model_data.vertex,
      point: new THREE.Vector3(model_data.position_vector[0], model_data.position_vector[1], model_data.position_vector[2])
    };
    return vertex_data;
  };
 
  /**
   * Callback for the keypress event.
   * Invokes the action to be performed for the key pressed.
   * @param {event} keyPress event passed to us by javascript.
   */
  this.keyPressedCallback = function(event) {

    var action_taken = false;
    switch(event.which) {
     case 38:
      that.ZoomInOut(1.1);
      action_taken = "ZoomIn";
      break;
     case 40:
      that.ZoomInOut(1/1.1);
      action_taken = "ZoomOut";
      break;
    
     case 32:
      that.separateHemispheres();
      action_taken = "Seperate";
      break;
    };
    if(action_taken){
      return false;
    }else {
      return true;
    }
    
  };
   
   function boundingBoxUpdate(bb, x, y, z) {
     if (! bb.minX || bb.minX > x) {
       bb.minX = x;
     } 
     if (! bb.maxX || bb.maxX < x) {
       bb.maxX = x;
     }
     if (! bb.minY || bb.minY > y) {
       bb.minY = y;
     } 
     if (! bb.maxY || bb.maxY < y) {
       bb.maxY = y;
     }
     if (! bb.minZ || bb.minZ > z) {
       bb.minZ = z;
     } 
     if (! bb.maxZ || bb.maxZ < z) {
       bb.maxZ = z;
     }

   }
   
  function drawDot(x, y, z) {
    var geometry = new THREE.SphereGeometry(2);
    var material = new THREE.MeshBasicMaterial({color: 0xFF0000});
  
    var sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(x, y, z);
  
    scene.add(sphere);
  }
  
  /*
   * Sets the fillmode of the brain to wireframe or filled
   */
  this.set_fill_mode_wireframe = function() {
    var children = brain.children;
    
    for (var i = 0; i < children.length; i++) {
      var material = children[i].material;
      material.wireframe = true;
      if (material.emissive) {
        material.emissive.setHex(0x7777777);
      }
    }
  };
  
  this.set_fill_mode_solid = function() {
    var children = brain.children;
    
    for (var i = 0; i < children.length; i++) {
      var material = children[i].material;
      material.wireframe = false;
      if (material.emissive) {
        material.emissive.setHex(0x000000);
      }
    }
  };


  function loadFromUrl(url, opts, callback) {
    var options = opts || {};    
    var beforeLoad = options.beforeLoad;
    if (beforeLoad) beforeLoad();
    
    jQuery.ajax({ type: 'GET',
      url: url ,
      dataType: 'text',
      success: function(data) {
	      callback(data);
      },
      error: function(request,textStatus,e) {
	      alert("Failure in loadFromURL: " +  textStatus);
      },
      data: {},
      timeout: 100000
    });

  }

  function loadFromTextFile(file_input, opts, callback) {
    var files = file_input.files;
    
    if (files.length === 0) {
      return;
    }
    
    var options = opts || {};    
    var beforeLoad = options.beforeLoad;
    var reader = new FileReader();
    reader.file = files[0];
    
    if (beforeLoad) {
      beforeLoad();
    }
    
    reader.onloadend = function(e) {
      callback(e.target.result);
    };
    
    reader.readAsText(files[0]);
  }


  this.loadObjFromUrl = function(url, opts) {
    loadFromUrl(url, opts, function(data) {
		    var parts = url.split("/");
		    //last part of url will be shape name
		    var filename = parts[parts.length-1];
		    that.displayObjectFile(new MNIObject(data), filename, opts);
		});
  };

  this.loadWavefrontObjFromUrl = function(url, opts) {
    loadFromUrl(url, opts, function(data) {
		    var parts = url.split("/");
		    //last part of url will be shape name
		    var filename = parts[parts.length-1];
		    that.displayObjectFile(new WavefrontObj(data), filename, opts);
		});
  };

  this.loadObjFromFile = function(file_input, opts) {
    var options = opts || {};
    loadFromTextFile(file_input, options, function(result) {
      var parts = file_input.value.split("\\");
			//last part of path will be shape name
			var filename = parts[parts.length-1];
      var obj;
      if (options.format === "wavefront") {
        obj = new WavefrontObj(result);
      } else {
        obj = new MNIObject(result);
      }
      if (obj.objectClass !== "__FAIL__") {
        that.displayObjectFile(obj, filename, options);
      } else if (options.onError != undefined) {
        options.onError();
      }
	  });
  };

  this.loadSpectrumFromUrl  = function(url) {
    //get the spectrum of colors
    loadFromUrl(url, null, function (data) {
		    var spectrum = new Spectrum(data);
		    that.spectrum = spectrum;


		    if(that.afterLoadSpectrum != null) {
		      that.afterLoadSpectrum(spectrum);
		    }

		    if(that.model_data.data) {
		      that.updateColors(that.model_data.data,that.model_data.data.rangeMin, that.model_data.data.rangeMax,that.spectrum,that.flip,that.clamped);
		    }

		});
  };

  

  //Load a color bar spectrum definition file
  this.loadSpectrumFromFile = function(file_input){
    loadFromTextFile(file_input, null, function(data) {
		    var spectrum = new Spectrum(data);
		    that.spectrum = spectrum;
		    if(that.afterLoadSpectrum != null) {
		      that.afterLoadSpectrum(spectrum);
		    }
		    if(that.model_data.data) {
		      that.updateColors(that.model_data.data,that.model_data.data.rangeMin, that.model_data.data.rangeMax,that.spectrum,that.flip,that.clamped);
		    }

		});
      
  };

  /*
   * Load text data from file and update colors
   */
  this.loadDataFromFile = function(file_input) {
    var filename = file_input.files[0].name;
    var onfinish = function(text) {
	    var data = new Data(text);
      data.fileName = filename;
	    if(data.values.length < that.model_data.positionArray.length/4) {
	      alert("Number of numbers in datafile lower than number of vertices Vertices" + that.model_data.positionArray.length/3 + " data values:" + data.values.length );
	      return -1;
	    }else {
	      that.model_data.data = data;
	    }
      initRange(that.model_data.data.min,
		    that.model_data.data.max);
      if(that.afterLoadData !=null) {
	      that.afterLoadData(that.model_data.data.rangeMin,that.model_data.data.rangeMax,that.model_data.data);
      }
      
      
      that.updateColors(that.model_data.data,that.model_data.data.rangeMin, that.model_data.data.rangeMax,that.spectrum,that.flip,that.clamped);
      return null;
    };

    /*
     * If the data file is a mnc or nii, we need to send it to the server and 
     * have the server process it with volume_object_evaluate which projects the 
     * data on the surface file. 
     */
    if(filename.match(/.*.mnc|.*.nii/)) {
      var xhr = new XMLHttpRequest();
      if(filename.match(/.*.mnc/)) {
	      xhr.open('POST', '/minc/volume_object_evaluate', false);  
      }else {
	      xhr.open('POST', '/nii/volume_object_evaluate', false);  
      }
      var form = document.getElementById('datafile-form');
      var data = new FormData(form);
      xhr.send(data);
      var text_data = xhr.response;
      onfinish(text_data);
      
    }else {
      loadFromTextFile(file_input, null, onfinish);
    }
  };

  /*
   * Load a series of data files to be viewed with a slider. 
   */
  this.loadSeriesDataFromFile = function(file_input) {
    console.log(file_input.files.length);
		var numberFiles = file_input.files.length;
		that.seriesData = new Array(numberFiles);
		that.seriesData.numberFiles = numberFiles;
		var files = file_input.files;
   
 		for(var i = 0; i < numberFiles; i++) {
		  
		  var reader = new FileReader();
		   reader.file = files[i];
		  /*
		   * Using a closure to keep the value of i around to put the 
		   * data in an array in order. 
		   */
		  var onfinish = reader.onloadend = (function(file,num) {
						       return function(e) {
		   					 console.log(e.target.result.length);
							 console.log(num);
							 that.seriesData[num] = new Data(e.target.result);
							 
							 that.seriesData[num].fileName = file.name;
							 
						       };
						     })(reader.file,i);
		  
		  reader.readAsText(files[i]);
			
			

    }
    that.setupSeries();
  };


  /*
   * Setup for series data, creates a slider to switch between files. 
   */
   this.setupSeries = function() {
     $("<div id=\"series\">Series: </div>").appendTo("#surface_choice");
     var div = $("#series");
     $("<span id=\"series-value\">0</span>").appendTo(div);
     $("<div id=\"series-slider\" width=\"100px\" + height=\"10\"></div>")
      .slider({
        value: 0,
        min: 0,
        max: that.seriesData.numberFiles-1,	       
        step: .1,
        slide: function(event,ui) {
          if(ui.value -  Math.floor(ui.value) < 0.01) { //is it at an integer? then just return the array			
            that.model_data.data = that.seriesData[ui.value];											     
            } else { //interpolate
              if(that.seriesData[0].fileName.match("pval.*")){
                that.model_data.data = new Data(interpolateDataArray(that.seriesData[Math.floor(ui.value)],
                that.seriesData[Math.floor(ui.value)+1],
                (ui.value -  Math.floor(ui.value)),true));		
              }else {
                that.model_data.data = new Data(interpolateDataArray(that.seriesData[Math.floor(ui.value)],
                that.seriesData[Math.floor(ui.value)+1],
                (ui.value -  Math.floor(ui.value))));
              }    
            }
            if(that.seriesData[0].fileName.match("mt.*")) {
              $("#age_series").html("Age: " + (ui.value*3+5).toFixed(1));

            }else if(that.seriesData[0].fileName.match("pval.*")) {
              $("#age_series").html("Age: " + (ui.value*1+10));
            }
            $(div).children("#series-value").html(ui.value);
            if(that.model_data.data.values.length < that.model_data.positionArray.length/4) {
              console.log("Number of numbers in datafile lower than number of vertices Vertices" 
              + that.model_data.positionArray.length/3 + " data values:" 
              + that.model_data.data.values.length );
              return -1;
            }
            initRange(that.model_data.data.min,that.model_data.data.max);
            if(that.afterLoadData !=null) {
              that.afterLoadData(that.model_data.data.rangeMin,that.model_data.data.rangeMax,that.model_data.data);
            }

            that.updateColors(that.model_data.data,that.model_data.data.rangeMin, that.model_data.data.rangeMax,that.spectrum,that.flip,that.clamped);
            return null;


          }
      }).appendTo(div);

   };

  

  /*
   * Load files to blend 
   */
  this.loadBlendDataFromFile = function(file_input) {
		var numberFiles = file_input.files.length;
		that.blendData = new Array(numberFiles);
		that.blendData.numberFiles = numberFiles;
		var files = file_input.files;
   
 		for(var i = 0; i < numberFiles; i++) {
		  
		  var reader = new FileReader();
		   reader.file = files[i];
		  /*
		   * Using a closure to keep the value of i around to put the 
		   * data in an array in order. 
		   */
		  var onfinish = reader.onloadend = (function(file,num) {
						       return function(e) {
		   					 that.blendData[num] = new Data(e.target.result);
							 that.blendData.alpha = 1.0/numberFiles;
							 
							 that.blendData[num].fileName = file.name;
							 for(var k = 0; k < 2; k++) {
							   if(that.blendData[k] == undefined) {						     
							     console.log("not done yet");
							     return;
							   }
							  
							 }		 
							 initRange(that.blendData[0].values.min(),
								   that.blendData[0].values.max(),
								   that.blendData[0]);
							 
							 initRange(that.blendData[1].values.min(),
								   that.blendData[1].values.max(),
								   that.blendData[1]);
							 if(that.afterLoadData !=null) {
							   that.afterLoadData(null,null,that.blendData,true); //multiple set to true
							 }
							 
							 that.blend($(".blend_slider").slider("value"));
							 
							 
						       };
						     })(reader.file,i);
		  
		  reader.readAsText(files[i]);
			
			

    }
    that.setupBlendColors();
  };

  



  this.setupBlendColors = function(){
    
    
    console.log("Blend colors has ran " + that.blendData.numberFiles);
    $("#blend").remove();
    $("<div id=\"blend\">Blend ratios: </div>").appendTo("#surface_choice");
    var div = $("#blend");
    $("<span id=\"blend_value"+i+"\">0</span>").appendTo(div);
    $("<div class=\"blend_slider\" id=\"blend_slider"+i+"\" width=\"100px\" + height=\"10\"></div>")
      .slider({
		value: 0,
		min: 0.1,
	        max: 0.99,
		value: 0.5,
		step:.01,
	        /*
		 * When the sliding the slider, change all the other sliders by the amount of this slider
		 */
		slide: function(event,ui) {
		  that.blend($(this).slider("value"));  
		}
	      }).appendTo(div);
    
    


  };



  this.blend = function(value) {
    that.blendData[0].alpha = value;
    that.blendData[1].alpha = 1.0 - value;
    for(var i = 2; i<that.blendData.length; i++) {
      that.blendData[i].alpha = 0.0;
    }
    

    that.updateColors(that.blendData,null,null,that.spectrum,that.flip,that.clamped,true); //last parameter says to blend data.
  };

  this.loadDataFromUrl = function(file_input, name) {
    loadFromUrl(file_input, null, function(text,file) {
		  that.model_data.data = new Data(text);
		  that.model_data.data.fileName = name;
		  initRange(that.model_data.data.min,that.model_data.data.max);
		  if(that.afterLoadData != undefined) {
		    that.afterLoadData(that.model_data.data.rangeMin,
				       that.model_data.data.rangeMax,
				       that.model_data.data);
		  }
		  

		  that.updateColors(that.model_data.data,that.model_data.data.rangeMin, that.model_data.data.rangeMax,that.spectrum);
		});
  };
  

  // this.loadCombinedShaderFromUrl = function(url){
  //   var shaderString;
  //   loadFromUrl(url,function(data){
  //     shaderString = data;     
  //   });
  //   return shaderString;
  // };


  /*
   * This updates the colors of the brain model
   */
  this.updateColors = function(data, min, max, spectrum, flip, clamped, blend, shape) {
    that.clamped = clamped;
    if(blend) {
      var color_array = colorManager.blendColorMap(spectrum,data,0,1);
    }else {
      var color_array = data.createColorArray(min,max,spectrum,flip,clamped,that.model_data.colorArray,that.model_data);      
    }


    if(that.model_data.num_hemispheres == 2) {
      var left_color_array = color_array.slice(0, color_array.length/2);
      var right_color_array = color_array.slice(color_array.length/2, color_array.length);
      var left_color_buffer = [];
      var right_color_buffer = [];
      for (var i = 0; i + 2 < color_array.length; i += 4) {
        var col = new THREE.Color()
        col.setRGB(left_color_array[i], left_color_array[i+1], left_color_array[i+2]);
        left_color_buffer.push(col);
        col = new THREE.Color()
        col.setRGB(right_color_array[i], right_color_array[i+1], right_color_array[i+2]);
        right_color_buffer.push(col);
      }

      var left_hem = brain.getChildByName("left");
      var left_hem_faces = left_hem.geometry.faces;
      for (var i = 0; i < left_hem_faces.length; i++) {
        var face = left_hem_faces[i];
        face.vertexColors[0] = left_color_buffer[face.a];
        face.vertexColors[1] = left_color_buffer[face.b];
        face.vertexColors[2] = left_color_buffer[face.c];
        if (face.d) {
          face.vertexColors[3] = left_color_buffer[face.d];
        }
      }
 
      left_hem.geometry.colorsNeedUpdate = true;
      
      var right_hem = brain.getChildByName("right");
      var right_hem_faces = right_hem.geometry.faces;
      for (var i = 0; i < right_hem_faces.length; i++) {
        var face = right_hem_faces[i];
        face.vertexColors[0] = right_color_buffer[face.a];
        face.vertexColors[1] = right_color_buffer[face.b];
        face.vertexColors[2] = right_color_buffer[face.c];
        if (face.d) {
          face.vertexColors[3] = right_color_buffer[face.d];
        }
      }
      right_hem.geometry.colorsNeedUpdate = true;

    } else {
      var color_buffer = [];
      for (var i = 0; i + 2 < color_array.length; i += 4) {
        var col = new THREE.Color()
        col.setRGB(color_array[i], color_array[i+1], color_array[i+2]);
        color_buffer.push(col);
      }
      var children = brain.children;
      for (var i = 0; i < children.length; i++) {
        var faces = children[i].geometry.faces;
        for (var j = 0; j < faces.length; j++) {
          var face = faces[j];
          face.vertexColors[0] = color_buffer[face.a];
          face.vertexColors[1] = color_buffer[face.b];
          face.vertexColors[2] = color_buffer[face.c];
          if (face.d) {
            face.vertexColors[3] = color_buffer[face.d];
          }
        }
        children[i].geometry.colorsNeedUpdate = true;
      }
    }

    if (that.afterUpdateColors !=null ) {
      that.afterUpdateColors(data,min,max,spectrum);
    }


    return 1;
  };

  
  /*
   * Called when the range of colors is changed in the interface
   * Clamped signifies that the range should be clamped and values above or bellow the 
   * thresholds should have the color of the maximum/mimimum.
   */
  this.rangeChange = function(min,max,clamped) {
    that.model_data.data.rangeMin = min;
    that.model_data.data.rangeMax = max;
    that.updateColors(that.model_data.data,that.model_data.data.rangeMin, that.model_data.data.rangeMax, that.spectrum,that.flip,clamped);

    /*
     * This callback allows users to
     * do things like update ui elements
     * when brainbrowser change it internally
     *
     */

    if(that.afterRangeChange != null) {
      that.afterRangeChange(min,max);
    }


  };


  /*
   * First this will lookup shape in the scenegraph whit it's name
   * it then changes the value of for the alpha channel in the shaders
   * of the specific shape. 
   */
  this.changeShapeTransparency = function(shape_name, alpha) {
    var shape = brain.getChildByName(shape_name);
    if (shape) {
      shape.material.opacity = alpha;
      if (alpha == 1) {
        shape.material.transparent = false;
      } else {
        shape.material.transparent = true;
      }
    }
  };
  
  /*
   * Used to get a url for a screenshot.
   * The URL is will be long and contain the image inside. 
   * 
   */
  this.getImageUrl = function() {
    var canvas = document.createElement("canvas");
    var spectrumCanvas = document.getElementById("spectrum_canvas");
    canvas.width = view_window.width();
    canvas.height = view_window.height();
            
    var context = canvas.getContext("2d");
    var img = new Image();

    function getSpectrumImage() {
	    var img = new Image();
	    img.onload = function(){
	      context.drawImage(img,0,0); // Or at whatever offset you like
	      window.open(canvas.toDataURL(), "screenshot");
	    };
	    img.src = spectrumCanvas.toDataURL();
    }
      
    img.onload = function(){
	    context.drawImage(img,0,0); // Or at whatever offset you like
	    if (spectrumCanvas) {
  	    getSpectrumImage();	      
	    } else {
	      window.open(canvas.toDataURL(), "screenshot");
	    }
    };
    
    img.src = renderer.domElement.toDataURL();
  };

  window.onresize = function() {
    view_window = $("#view-window");
    renderer.setSize(view_window.width(), view_window.height());
    camera.aspect = view_window.width()/view_window.height();
    camera.updateProjectionMatrix();
  };
    
  that.start();

}
