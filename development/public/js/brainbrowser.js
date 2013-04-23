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
  var scene; //THREE.js scene
  var brain = new THREE.Object3D();
  var camera_controls;
  var light_controls;
  
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
    
    renderer = new THREE.WebGLRenderer({clearColor: 0x888888, clearAlpha: 1, preserveDrawingBuffer: true});
    renderer.setSize(view_window.width(), view_window.height());
    view_window.append(renderer.domElement);  
    
    camera.position.z = 500;
    
    var pointLight = new THREE.PointLight(0xFFFFFF);

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
      camera_controls.update();
      light_controls.update();
      if(brain.getChildByName("left")) {
       // brain.getChildByName("left").rotation.x -= 0.1;
        //brain.getChildByName("right").rotation.x += 0.1;
      }
      that.renderCallback();    
    }
    if(this.afterInit) {
       this.afterInit(that);
    }
    
    window.onresize();      
    //that.updateInfo();
    
    that.loadSpectrumFromUrl('/assets/spectral_spectrum.txt');
    
    render();
    
  };
  
  function addBrain(obj) {
    that.model_data = obj;
    var left = createHemisphere(obj.left);
    left.name = "left";
    var right = createHemisphere(obj.right);
    right.name = "right"
    brain.add(left);
    brain.add(right);
    
    scene.add(brain);
  }
  
  function createHemisphere(obj) {
    //that.createBrain(obj,filename);
    var verts = obj.positionArray;
    var ind = obj.indexArray;
    
    var geometry = new THREE.Geometry();
    for(var i = 0; i+2 < verts.length; i+=3) {
      geometry.vertices.push(new THREE.Vector3(verts[i], verts[i+1], verts[i+2]));
    }
    for(var i = 0; i+2 < ind.length; i+=3) {
      geometry.faces.push(new THREE.Face3(ind[i], ind[i+1], ind[i+2]));
    }
    
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    
    var material = new THREE.MeshPhongMaterial({color: 0xFFFFFF, ambient: 0x0A0A0A, specular: 0x080808, transparent: true, vertexColors: THREE.VertexColors});
    var hemisphere = new THREE.Mesh(geometry, material);
            
    return hemisphere;
  }

  function addLineObject(obj, filename, mesh) {
    var lineObject = createLineObject(obj, mesh);
    lineObject.name = filename; 
    
    brain.add(lineObject);
    
    scene.add(brain)
  
  }

  function createLineObject(obj, mesh) {
    var model_data = obj;
  
    var indices = [];
    var verts = []; 
    var colors = [];

    for(var i = 0; i < model_data.nitems; i ++){
      if(i == 0){
        var start = 0;
      }else {
        var start = model_data.endIndicesArray[i-1];
      }
      indices.push(model_data.indexArray[start]);
      for(var k = start+1; k < model_data.endIndicesArray[i]-1; k++) {
        indices.push(model_data.indexArray[k]);
        indices.push(model_data.indexArray[k]);
      }
      indices.push(model_data.indexArray[model_data.endIndicesArray[i]-1]);
    }    
    
    if(!mesh) {   
    
      for(var j = 0; j < indices.length; j++) {
	      verts.push(model_data.positionArray[indices[j]*3]) ;
	      verts.push(model_data.positionArray[indices[j]*3+1]);
	      verts.push(model_data.positionArray[indices[j]*3+2]);
      }
      var colorArray=[];
      if(model_data.colorArray.length == 4) {
	      for(var i=0;i<numberVertices;i++) {
	        colorArray.push.apply(colorArray,[0.5,0.5,0.7,1]);
	      }
      }else {
	      //colorArray = new Float32Array(indexArray.length*4);
	      for(var j = 0; j < indices.length; j++) {
	        colors.push(model_data.colorArray[indices[j]*4]);
	        colors.push(model_data.colorArray[indices[j]*4+1]);
	        colors.push(model_data.colorArray[indices[j]*4+2]);
	        //colors[j*4+3] = model.colorArray[indexArray[j]*4+3];
	      }
      }
      //~ //indexBuffer.set(indexArray);
      //~ //linePrimitive.indexBuffer = indexBuffer;
      //~ for(var j = 0; j < indexArray.length; j++) {
	      //~ positionArray[j*3] = model.positionArray[indexArray[j]*3];
	      //~ positionArray[j*3+1] = model.positionArray[indexArray[j]*3+1];
	      //~ positionArray[j*3+2] = model.positionArray[indexArray[j]*3+2];
      //~ }
      //~ var colorArray=[];
      //~ if(model.colorArray.length == 4) {
	      //~ for(var i=0;i<numberVertices;i++) {
	        //~ colorArray.push.apply(colorArray,[0.5,0.5,0.7,1]);
	      //~ }
      //~ }else {
	      //~ colorArray = new Float32Array(indexArray.length*4);
	      //~ for(var j = 0; j < indexArray.length; j++) {
	        //~ colorArray[j*4] = model.colorArray[indexArray[j]*4];
	        //~ colorArray[j*4+1] = model.colorArray[indexArray[j]*4+1];
	        //~ colorArray[j*4+2] = model.colorArray[indexArray[j]*4+2];
	        //~ colorArray[j*4+3] = model.colorArray[indexArray[j]*4+3];
	      //~ }
      //~ }
      
    }else {
      console.log('mesh shape');
      //linePrimitive.numberVertices = model.meshPostionArray.length/3;
      //linePrimitive.numberPrimitives = linePrimitive.numberVertices/2;
      verts = model_data.meshPositionArray;
      colors = model_data.meshColorArray;
    }

    
    var geometry = new THREE.Geometry();
    for(var i = 0; i+2 < verts.length; i+=3) {
      geometry.vertices.push(new THREE.Vector3(verts[i], verts[i+1], verts[i+2]));
      var col = new THREE.Color();
      col.setRGB(colors[i], colors[i+1], colors[i+2]);
      geometry.colors.push(col);
    }
    geometry.colorsNeedUpdate = true;
    
    //~ for(var i = 0; i+2 < indices.length; i+=3) {
      //~ var face = new THREE.Face3(indices[i], indices[i+1], indices[i+2]);
      //~ face.vertexColors[0] = geometry.colors[face.a];
      //~ face.vertexColors[1] = geometry.colors[face.b];
      //~ face.vertexColors[2] = geometry.colors[face.c];
      //~ geometry.faces.push(face);
    //~ }
    
    //geometry.computeFaceNormals();
    //geometry.computeVertexNormals();
    
    var material = new THREE.LineBasicMaterial({transparent: true, vertexColors: THREE.VertexColors});
    var lineObject = new THREE.Line(geometry, material, THREE.LinePieces);
    
    return lineObject;
  }
  
  /*
   * Creates the hemisphere shape with the material provide.
   */
  that.xxxcreateLineShape = function(material,model,name,mesh) {

    var lineShape = that.pack.createObject('Shape');
    var streamBank = that.pack.createObject('StreamBank');
    lineShape.name = name;
    
    if(!model.positionArray) {
      alert("PositionArray nil");
      return false;
    }
    
    that.numberVertices = model.numberVertices; 
        
    var linePrimitive = that.pack.createObject('Primitive');      
    
    linePrimitive.material = material;
    linePrimitive.owner = lineShape;
    linePrimitive.streamBank = streamBank;
    linePrimitive.primitiveType = that.o3d.Primitive.LINELIST;
    var state = that.pack.createObject('State'); 
    that.enableAlphaBlending(state);
       
    linePrimitive.material.state = state;
    //positionsBuffer.set(newPositionArray);
    //create Position buffer (vertices) and set the number of vertices global variable
    

    var indexArray  = new Array();
    for(var i = 0; i < model.nitems; i ++){
      if(i == 0){
     	var start = 0;
      }else {
	      var start = model.endIndicesArray[i-1];
      }
      indexArray.push(model.indexArray[start]);
      for(var k = start+1; k < model.endIndicesArray[i]-1; k++) {
     	indexArray.push(model.indexArray[k]);
     	indexArray.push(model.indexArray[k]);
      }
      indexArray.push(model.indexArray[model.endIndicesArray[i]-1]);
    }    
    
    if(!mesh) {   

      var indexBuffer = that.pack.createObject('IndexBuffer');
      linePrimitive.numberPrimitives = indexArray.length/2;
      linePrimitive.numberVertices = indexArray.length;
      that.indexArray = indexArray;
      //indexBuffer.set(indexArray);
      //linePrimitive.indexBuffer = indexBuffer;
      var positionArray = new Float32Array(indexArray.length*3);
      for(var j = 0; j < indexArray.length; j++) {
	      positionArray[j*3] = model.positionArray[indexArray[j]*3];
	      positionArray[j*3+1] = model.positionArray[indexArray[j]*3+1];
	      positionArray[j*3+2] = model.positionArray[indexArray[j]*3+2];
      }
      var colorArray=[];
      if(model.colorArray.length == 4) {
	      for(var i=0;i<numberVertices;i++) {
	        colorArray.push.apply(colorArray,[0.5,0.5,0.7,1]);
	      }
      }else {
	      colorArray = new Float32Array(indexArray.length*4);
	      for(var j = 0; j < indexArray.length; j++) {
	        colorArray[j*4] = model.colorArray[indexArray[j]*4];
	        colorArray[j*4+1] = model.colorArray[indexArray[j]*4+1];
	        colorArray[j*4+2] = model.colorArray[indexArray[j]*4+2];
	        colorArray[j*4+3] = model.colorArray[indexArray[j]*4+3];
	      }
      }
      
    }else {
      console.log('mesh shape');
      linePrimitive.numberVertices = model.meshPostionArray.length/3;
      linePrimitive.numberPrimitives = linePrimitive.numberVertices/2;
      var positionArray =model.meshPositionArray;
      var colorArray    =model.meshColorArray;
    }

    var positionsBuffer = that.pack.createObject('VertexBuffer');
    var positionsField = positionsBuffer.createField('FloatField', 3);
    
    
    
    positionsBuffer.set(positionArray);
    

    streamBank.setVertexStream(
      that.o3d.Stream.POSITION, //  That stream stores vertex positions
      0,                     // First (and only) position stream
      positionsField,        // field: the field that stream uses.
      0);                    // start_index:
    
    
    if(colorArray.length/4 < positionArray.length/3) {
      alert('Problem with the colors: ' + colorArray.length);
    }
    var colorBuffer = that.pack.createObject('VertexBuffer');
    var colorField = colorBuffer.createField('FloatField', 4);
    colorBuffer.set(colorArray);
    
    streamBank.setVertexStream(
      that.o3d.Stream.COLOR,
      0,
      colorField,
      0);
    
      
    if(that.loading){
      jQuery(that.loading).html("Buffers Loaded");
    }
    
    that.pack.gl.lineWidth(1.0);
    return lineShape;

  };

  /** 
   * Initialize the global variables of BrainBrowser,
   * the brain model, apply material & shader
   */
  // this.initStep2 = function(clientElements) {
  //     
  //     // Initializes global variables and libraries.
  //     var o3dElement = clientElements[0];
  //     that.o3dElement = o3dElement;
  //     that.client = o3dElement.client;
  //     that.o3d = o3dElement.o3d;
  //     that.math = o3djs.math;
  //     that.dragging = false;
  //     that.o3dWidth = -1;
  //     that.o3dHeight = -1;
  //     that.quaternions = o3djs.quaternions;
  //     that.lastRot = that.math.matrix4.identity();
  //     that.thatRot = that.math.matrix4.identity();
  //     that.zoomFactor = 1.10;
  //     that.keyPressDelta = 0.1;
  //     that.clock = 0;
  //     that.timeMult = 1.0;
  //     that.camera = {
  //       farPlane: 5000,
  //       nearPlane:0.1
  //     };
  //     that.object_origin = [0,0,0];
  //      
  //      
  //      that.loading = jQuery("#o3d_loading");
  //      
  //      // Initialize O3D sample libraries. o3dElement is the o3d div in the page
  //      o3djs.base.init(o3dElement);
  //      // Create a pack to manage the objects created.
  //      that.pack = that.client.createPack();
  //      
  //      
  //      // Create the render graph for a view.
  //      var viewInfo = o3djs.rendergraph.createBasicView(
  //       that.pack,
  //       that.client.root,
  //       that.client.renderGraphRoot,
  //       [0.5,0.5,0.5,1]);
  //      that.viewInfo = viewInfo;
  //      // Set up a simple orthographic view.
  //      viewInfo.drawContext.projection = that.math.matrix4.perspective(
  //       that.math.degToRad(30), // 30 degree fov.
  //       that.client.width / that.client.height,
  //       1,                  // Near plane.
  //       5000);              // Far plane.
  //      
  //      // Set up our view transformation to look towards the world origin
  //      // where the brain is located.
  //      that.eyeView = [0,0,500];
  //      viewInfo.drawContext.view = that.math.matrix4.lookAt(
  //       that.eyeView, // eye
  //       [0, 0, 0],  // target
  //       [0, 1, 0]); // up
  //      
  //      that.aball = o3djs.arcball.create(100, 100);
  //      
  //      that.client.setRenderCallback(that.renderCallback);
  //      
  //      //Add event handlers
  //      jQuery("body").keydown(that.keyPressedCallback);
  //      o3djs.event.addEventListener(o3dElement, 'wheel', that.scrollMe);
  // 
  //      that.loadSpectrumFromUrl('/assets/spectral_spectrum.txt');
  // 
  // 
  //     jQuery('#screenshot').click(function(event) {jQuery(this).attr("href",bb.client.toDataURL());});
  // 
  //      //This allows a programmer to define a function that runs after initialization
  //      if(that.afterInit) {
  //        that.afterInit(that);
  //      }
  //      window.onresize();      
  //      that.updateInfo();
  // 
  // 
  //   };


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
  this.renderCallback = function(renderEvent) {
    //that.setClientSize();
    if(that.autoRotate) {
       //that.clock = 0;
       //that.clock += renderEvent.elapsedTime * that.timeMult;
       if(that.autoRotate.x){
	       brain.rotation.x += 0.01;
       }
      if(that.autoRotate.y){
        brain.rotation.y += 0.01;
      }
      if(that.autoRotate.z){
	      brain.rotation.z += 0.01;
      }
      
    }
    renderer.render(scene, camera);
  };

  /**
   * Materials are basically shaders and properties applied to shapes
   * the effect is where the shader programs resided
   * changes attributes and uniforms of a shader are done using the effect object
   *
   * @param {String} url url of shader code to load, this is the combined shader.   
   */
  this.createMaterial = function(url) {
    console.log("createMaterial commented out!");
    // var effect = that.pack.createObject('Effect');
    //     var shaderString = that.loadCombinedShaderFromUrl(url);
    //     effect.loadFromFXString(shaderString);
    //     var material = that.pack.createObject('Material');
    //     material.drawList = that.viewInfo.performanceDrawList;
    //     material.effect = effect;
    // 
    //     effect.createUniformParameters(material);
    //     
    //     return material;
  };

  /**
   * Turn on alpha blending on the materials state object passed in.  
   * @param {o3d.State} state State object of the material's effect on which we want to enable alpha blending
   */
  function enableAlphaBlending(state) {
    
    state.getStateParam('AlphaBlendEnable').value = true;
    state.getStateParam('SourceBlendFunction').value =
      o3djs.base.o3d.State.BLENDFUNC_SOURCE_ALPHA;
    state.getStateParam('DestinationBlendFunction').value =
      o3djs.base.o3d.State.BLENDFUNC_INVERSE_SOURCE_ALPHA;
    state.getStateParam('AlphaTestEnable').value = true;
    state.getStateParam('AlphaComparisonFunction').value =
      o3djs.base.o3d.State.CMP_GREATER;

  }

  that.enableAlphaBlending = enableAlphaBlending;

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
    
    brain = new THREE.Object3D();
    
    if(that.afterClearScreen != undefined) {
      that.afterClearScreen();
    }
    
    // if(brainbrowser.brainTransform != undefined) {
    //       if(brainbrowser.brainTransform.shapes != undefined) {
    //        var num = brainbrowser.brainTransform.shapes.length;
    //  
    //        for(var i = 0; i < num; i++) { 
    //          brainbrowser.brainTransform.removeShape(brainbrowser.brainTransform.shapes[0]);
    //        };
    //       }
    //       if(brainbrowser.brainTransform.children.length) {
    //        var number_children = brainbrowser.brainTransform.children.length;
    //        for(var i = 0; i < number_children; i++ ) {
    //          var num = brainbrowser.brainTransform.children[i].length;
    //          brainbrowser.brainTransform.children[i].removeShape(brainbrowser.brainTransform.children[i].shapes[0]);
    //        };
    //       }
    //       
    //       if(that.afterClearScreen != undefined) {
    //        that.afterClearScreen();
    //       }
    //     };
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
  this.displayObjectFile = function(obj,filename) {
    if(obj.objectClass == 'P' && obj.numberVertices == 81924) {
      addBrain(obj);
    }else if(obj.objectClass == 'P') {
	    that.createPolygonObject(obj,filename);	  
    }else if(obj.objectClass == 'L') {
      addLineObject(obj, filename);
    }else {
      alert("Object file not supported");
    }
    if(that.afterDisplayObject != undefined) {
      that.afterDisplayObject(brain);      
    }

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
    //that.viewInfo.clearBuffer.clearColor = color;
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
   *setups the uniforms for a shader that implements blinnphong shading. 
   *@param {o3d.Material} material material on which to set the shader params 
   */

  // this.blinnphongParams = function(material){
    
    // // Transparency 
    // var transAlpha = material.getParam('transAlpha');
    // transAlpha.value = 1.0;
    // // Light position
    // var light_pos_param = material.getParam('lightWorldPos');
    // light_pos_param.value = that.eyeView;

    // // Phong components of the light source
    // var light_ambient_param = material.getParam('ambient');
    // var light_ambientIntensity_param = material.getParam('ambientIntensity');
    // var light_lightIntensity_param = material.getParam('lightIntensity');
    // var light_specular_param = material.getParam('specular');
    // var light_emissive_param = material.getParam('emissive');
    // var light_colorMult_param = material.getParam('colorMult');

    // //bool to state if we are displaying wireframe models or not, if true it turns off the lighting 
    // var wires = material.getParam('wires');
    // wires.value = false;
    // // White ambient light
    // light_ambient_param.value = [0.04, 0.04, 0.04, 1];
    // light_ambientIntensity_param.value = [1, 1, 1, 1];
    // light_lightIntensity_param.value = [0.8, 0.8, 0.8, 1];

    // // White specular light
    // light_specular_param.value = [0.5, 0.5, 0.5, 1];
    // light_emissive_param.value = [0, 0, 0, 1];
    // light_colorMult_param.value = [1, 1, 1, 1];

    // // Shininess of the material (for specular lighting)
    // var shininess_param = material.getParam('shininess');
    // shininess_param.value = 10000.0;
    
    // return material;

  // }

  

  /**
   * Resets the view of the scene by resetting its local matrix to the identity
   * matrix.
   */
  this.resetView = function() {
    // that.brainTransform.children[0].visible=true;
    //  that.brainTransform.children[1].visible=true;
    //  that.brainTransform.identity();
    //  that.brainTransform.children[0].identity();
    //  that.brainTransform.children[1].identity();
    camera_controls.reset();                 
    light_controls.reset();
    brain.position.set(0, 0, 0);
    brain.rotation.set(0, 0, 0);
    for(var i = 0; i < brain.children.length; i++) {
      brain.children[i].visible = true;
      brain.children[i].position.set(0, 0, 0);
      brain.children[i].rotation.set(0, 0, 0);
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

      //that.brainTransform.children[0].translate([-100,0,0]);
      //that.brainTransform.children[1].translate([100,0,0]);
      //that.brainTransform.children[0].rotateZ(that.math.degToRad(-90));
      //that.brainTransform.children[1].rotateZ(that.math.degToRad(90));
      //that.brainTransform.rotateX(that.math.degToRad(-90));
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

      // that.brainTransform.children[0].translate([-100,0,0]);
      //   that.brainTransform.children[1].translate([100,0,0]);
      //   that.brainTransform.children[0].rotateZ(that.math.degToRad(-90));
      //   that.brainTransform.children[1].rotateZ(that.math.degToRad(90));
      //   that.brainTransform.rotateX(that.math.degToRad(90));
      //   that.brainTransform.rotateY(that.math.degToRad(180));

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
    //that.brainTransform.rotateY(that.math.degToRad(180));
  };

  /**
   * function to handle to preset views of the system.
   */
  this.anteriorView = function(e) {
    that.resetView();
    brain.rotation.x += degToRad(-90);
    brain.rotation.z += degToRad(180);
    //that.brainTransform.rotateX(that.math.degToRad(-90));
    //that.brainTransform.rotateZ(that.math.degToRad(180));
  };

  /**
   * function to handle to preset views of the system.
   */
  this.posteriorView = function(e) {
    that.resetView();
    brain.rotation.x += degToRad(-90);
    //that.brainTransform.rotateX(that.math.degToRad(-90));
  };


  /**
   * Adds space between the hemispheres
   */
  this.separateHemispheres = function(e) {
    if(that.model_data.num_hemispheres == 2 ) {
      this.brainTransform.children[0].translate([-1,0,0]);
      this.brainTransform.children[1].translate([1,0,0]);
    }
  };
  

  /**
   * Creates the client area.
   */
  // this.setClientSize= function() {
  // 
  //     var newWidth  = parseInt(view_window.width());
  //     var newHeight = parseInt(view_window.height());
  // 
  //     if (newWidth != that.o3dWidth || newHeight != that.o3dHeight) {
  // 
  //       that.o3dWidth = newWidth;
  //       that.o3dHeight = newHeight;
  // 
  //       that.updateProjection();
  // 
  //       // Sets a new area size for arcball.
  //       //that.aball.setAreaSize(that.o3dWidth, that.o3dHeight);
  //       console.log("ARC BALL CODE COMMENTED OUT!");
  //     }
  //   };


  /**
   * The following methods implement the zoom in and out
   */
  this.ZoomInOut = function(zoom) {
    for (var i = 0; i < that.eyeView.length; i += 1) {
      that.eyeView[i] = that.eyeView[i] / zoom;
    }

    that.viewInfo.drawContext.view = that.math.matrix4.lookAt(
      that.eyeView, // eye
      [0, 0, 0],   // target
      [0, 1, 0]);  // up
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

  this.updateInfo = function() {
    if (!that.treeInfo) {
      that.treeInfo = o3djs.picking.createPickManager(that.client.root);
    }
    that.treeInfo.update();
  };

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
  this.click = function(e,click_callback) {

    var worldRay = o3djs.picking.clientPositionToWorldRay(
      e.x,
      e.y,
      that.viewInfo.drawContext,
      that.client.width,
      that.client.height);
    unSelectAll();

    // Update the entire tree in case anything moved.
    // NOTE: This function is very SLOW!
    // If you really want to use picking you should manually update only those
    // transforms and shapes that moved, were added, or deleted by writing your
    // own picking library. You should also make sure that you are only
    // considering things that are pickable. By that I mean if you have a scene of
    // a meadow with trees, grass, bushes, and animals and the only thing the user
    // can pick is the animals then put the animals on their own sub branch of the
    // transform graph and only pick against that subgraph.
    // Even better, make a separate transform graph with only cubes on it to
    // represent the animals and use that instead of the actual animals.
    that.treeInfo.update();

    var pickInfo = that.treeInfo.pick(worldRay);
    if (pickInfo) {

      select(pickInfo);
      var primitive_index = pickInfo.rayIntersectionInfo.primitiveIndex;
      var position        = pickInfo.rayIntersectionInfo.position;
      var hemisphere      = pickInfo.element.owner.name;
      var vertex_info     = that.model_data.get_vertex(primitive_index,position,hemisphere);
      var info = {
	      ray_position:    position,
	      position_vector: vertex_info.position_vector,
	      element:         pickInfo.element,
	      hemisphere:      hemisphere,
	      vertex:          vertex_info.vertex
      };
	    return click_callback(e,info);
    } else {

      //that.debugLine.setVisible(false);
      jQuery(that.pickInfoElem).html('--nothing--');
    }

    return false;
  };


  //Returns the position and info about a vertex
  //currently a wrapper for model.getVertexInfo
  //Should theoretically return thei same infor as click and
  //click should use this to build that info object
  this.getInfoForVertex = function(vertex) {
    return  that.model_data.getVertexInfo(vertex);
  };

  function getCursorPosition(e){
    var x;
    var y;
    if (e.pageX != undefined && e.pageY != undefined) {
	    x = e.pageX;
	    y = e.pageY;
    }
    else {
	    x = e.clientX + document.body.scrollLeft +
            document.documentElement.scrollLeft;
	          y = e.clientY + document.body.scrollTop +
            document.documentElement.scrollTop;
    }
    
    
    x -= that.o3dElement.offsetLeft;
    y -= that.o3dElement.offsetTop;
   

    return {x: x,y: y};
  }


  this.startDragging = function(e) {

    if(e.button == that.o3d.Event.BUTTON_RIGHT) {
        var screenPosition = getCursorPosition(e);
	      that.startPosition =  o3djs.picking.clientPositionToWorldRay(screenPosition.x,screenPosition.y,that.viewInfo.drawContext,that.client.height,that.client.width).far;
	      that.dragging = true;
    }else {
      if(e.shiftKey && e.ctrlKey && that.model_data.num_hemispheres == 2) {
        that.drag_hemisphere = click(e, function(event,info) {
          if(info.hemisphere == "left") {
            return 0;
          }else if(info.hemisphere == "right") {
            return 1;
          }else {
            return false;
          }
        });
      }
      that.lastRot = that.thatRot;
      that.aball.click([e.x, e.y]);
      that.dragging = true;
    };
  };

  this.drag = function(e) {

    if (that.dragging && e.button == that.o3d.Event.BUTTON_LEFT ) {

      var rotationQuat = that.aball.drag([e.x, e.y]);
      var rot_mat = that.quaternions.quaternionToRotation(rotationQuat);
      that.thatRot = that.math.matrix4.mul(that.lastRot, rot_mat);


      if(that.drag_hemisphere === 0 || that.drag_hemisphere === 1) {

	      var m = that.brainTransform.children[that.drag_hemisphere].localMatrix;
	      that.math.matrix4.setUpper3x3(m, that.thatRot);
	      that.brainTransform.children[that.drag_hemisphere].localMatrix = m;

      } else {
	      var m = that.brainTransform.localMatrix;
	      that.math.matrix4.setUpper3x3(m, that.thatRot);
	      that.brainTransform.localMatrix = m;

      }

    }else if(that.dragging && e.button == that.o3d.Event.BUTTON_RIGHT) {

      var screenPosition = getCursorPosition(e);
      var new_position = o3djs.picking.clientPositionToWorldRay(screenPosition.x,screenPosition.y,that.viewInfo.drawContext,that.client.height,that.client.width).far;
      change = [0,0,0];
      var distance_from_zero = that.eyeView[0];
      var change = [(new_position[0] - that.startPosition[0])/5000*that.eyeView[2],(new_position[1] - that.startPosition[1])/5000*that.eyeView[2],0];
      that.startPosition = new_position;
      
      that.brainTransform.translate(change);
    
    }else if(that.dragging) {
      that.stopDragging(e);
    }
  };



  this.stopDragging = function(e) {
    that.drag_hemisphere = false;
    that.dragging = false;
  };






  this.updateCamera = function() {

    var up = [0, 1, 0];
    that.viewInfo.drawContext.view = that.math.matrix4.lookAt(that.camera.eye,
							      that.camera.target,
							      up);
    that.lightPosParam.value = that.camera.eye;
  };

  this.updateProjection = function() {
    console.log("updateProjection commented out!");
    // Create a perspective projection matrix.
    //that.viewInfo.drawContext.projection = that.math.matrix4.perspective(
    //  that.math.degToRad(45), that.o3dWidth / that.o3dHeight, that.camera.nearPlane,
    //  that.camera.farPlane);

  };


  /**
   * Function performing the rotate action in response to a key-press.
   * Rotates the scene based on key pressed. (w ,s, a, d). Note that the x and
   * y-axis referenced here are relative to the current view of the scene.
   * @param {keyPressed} The letter pressed, in lower case.
   * @param {delta} The angle by which the scene should be rotated.
   * @return true if an action was taken.
   */
  this.keyPressedAction = function(keyPressed, delta) {
    var actionTaken = false;
    switch(keyPressed) {
    case '&':
      that.ZoomInOut(that.zoomFactor);
      actionTaken = 'zoom_in';
      break;
    case '(':
      that.ZoomInOut(1/that.zoomFactor);
      actionTaken = 'zoom_out';
      break;

    case ' ':
      that.separateHemispheres();
      actionTaken = 'separate';
      break;
    }

    return actionTaken;
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
     that.ZoomInOut(that.zoomFactor);
     action_taken = "ZoomIn";
     break;
    case 40:
     that.ZoomInOut(1/that.zoomFactor);
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
  this.set_fill_mode_wireframe= function() {
    brain.getChildByName("left").material =  new THREE.MeshBasicMaterial({color: 0xFFFFFF, wireframe: true, transparent: true});
    brain.getChildByName("right").material =  new THREE.MeshBasicMaterial({color: 0xFFFFFF, wireframe: true, transparent: true});
  };
  
  this.set_fill_mode_solid = function() {
    brain.getChildByName("left").material = new THREE.MeshPhongMaterial({color: 0xFFFFFF, ambient: 0x0A0A0A, specular: 0x080808, transparent: true, vertexColors: THREE.VertexColors});
    brain.getChildByName("right").material = new THREE.MeshPhongMaterial({color: 0xFFFFFF, ambient: 0x0A0A0A, specular: 0x080808, transparent: true, vertexColors: THREE.VertexColors});
  };


  function loadFromUrl(url,sync,callback) {
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
      async: sync,
      timeout: 100000
    });

  }

  function loadFromTextFile(file_input,callback) {
    var reader = new FileReader();
    var files = file_input.files;
    reader.file = files[0];

    reader.onloadend = function(e) {
      callback(e.target.result);
    };

    reader.readAsText(files[0]);

  }


  this.loadObjFromUrl = function(url) {
    loadFromUrl(url, false,function(data) {
		    var parts = url.split("/");
		    //last part of url will be shape name
		    var filename = parts[parts.length-1];
		    that.displayObjectFile(new MNIObject(data),filename);
		});
  };

  this.loadWaveformObjFromUrl = function(url) {
    loadFromUrl(url, false,function(data) {
		    var parts = url.split("/");
		    //last part of url will be shape name
		    var filename = parts[parts.length-1];
		    that.displayObjectFile(new WaveformObj(data),filename);
		});
  };

  this.loadObjFromFile = function(file_input) {
    loadFromTextFile(file_input, function(result) {
                       	 var parts = file_input.value.split("\\");
			 //last part of path will be shape name
			 var filename = parts[parts.length-1];

			 that.displayObjectFile(new MNIObject(result),filename);
		     });
  };

  this.loadSpectrumFromUrl  = function(url) {
    //get the spectrum of colors
    loadFromUrl(url,true,function (data) {
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
    loadFromTextFile(file_input,function(data) {
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

  function setupDataUi(data) {

  }



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
      loadFromTextFile(file_input, onfinish);
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
		    that.model_data.data = that.seriesData[ui.value];											     }else { //interpolate
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

  this.loadDataFromUrl = function(file_input,name) {
    loadFromUrl(file_input, true, function(text,file) {
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
  

  this.loadCombinedShaderFromUrl = function(url){
    var shaderString;
    loadFromUrl(url,false,function(data){
      shaderString = data;		  
    });
    return shaderString;
  };


  /*
   * This updates the colors of the brain model
   */
  this.updateColors = function(data,min,max,spectrum,flip,clamped,blend,shape) {
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
      }
 
      left_hem.geometry.colorsNeedUpdate = true;
      
      var right_hem = brain.getChildByName("right");
      var right_hem_faces = right_hem.geometry.faces;
      for (var i = 0; i < right_hem_faces.length; i++) {
        var face = right_hem_faces[i];
        face.vertexColors[0] = right_color_buffer[face.a];
        face.vertexColors[1] = right_color_buffer[face.b];
        face.vertexColors[2] = right_color_buffer[face.c];
      }
      right_hem.geometry.colorsNeedUpdate = true;
      
      // brain.getChildByName("left").geometry.colors = left_color_buffer;
      //       brain.getChildByName("left").geometry.colorsNeedUpdate = true;
      //       brain.getChildByName("right").geometry.colors = right_color_buffer;
      //       brain.getChildByName("right").geometry.colorsNeedUpdate = true;
      
 

      // var left_color_buffer = that.pack.createObject('VertexBuffer');
      //       var left_color_field = left_color_buffer.createField('FloatField', 4);
      //       left_color_buffer.set(left_color_array);
      //       var left_brain_shape = that.brainTransform.children[0].shapes[0];
      //       var left_stream_bank = left_brain_shape.elements[0].streamBank;
      //       left_stream_bank.setVertexStream(
      //        that.o3d.Stream.COLOR, //  This stream stores vertex positions
      //        0,                     // First (and only) position stream
      //        left_color_field,        // field: the field this stream uses.
      //        0);                    // start_index:
      // 
      // 
      // 
      //       var right_color_buffer = that.pack.createObject('VertexBuffer');
      //       var right_color_field = right_color_buffer.createField('FloatField', 4);
      //       right_color_buffer.set(right_color_array);
      //       var right_brain_shape = that.brainTransform.children[1].shapes[0];
      //       var right_stream_bank = right_brain_shape.elements[0].streamBank;
      //       right_stream_bank.setVertexStream(
      //        that.o3d.Stream.COLOR, //  This stream stores vertex positions
      //        0,                     // First (and only) position stream
      //        right_color_field,        // field: the field this stream uses.
      //        0);                    // start_index:
      // 
      //       that.client.render();

    } else {
      
      var color_buffer = that.pack.createObject('VertexBuffer');
      var color_field = color_buffer.createField('FloatField', 4);
      color_buffer.set(color_array.nonIndexedColorArray);
      var brain_shape = that.brainTransform.shapes[0];
      console.log(brain_shape);
      var stream_bank = brain_shape.elements[0].streamBank;
      stream_bank.setVertexStream(
	      that.o3d.Stream.COLOR, //  This stream stores vertex positions
	      0,                     // First (and only) position stream
	      color_field,        // field: the field this stream uses.
	      0);                    // start_index:
        that.client.render();
      };

    if(that.afterUpdateColors !=null ) {
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
