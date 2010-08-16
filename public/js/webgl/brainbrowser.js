/* BrainBrowser.js
 * This file defines the brainbrowser object used to initialize an O3D client and display a brain
 * model.
 *
 * This object requires that a div with o3d is defined in the page
 * This file currently depends on mniobj.js
 */

//Required o3d librairies

o3djs.base.o3d = o3d;
o3djs.require('o3djs.webgl');
o3djs.require('o3djs.math');
o3djs.require('o3djs.rendergraph');
o3djs.require('o3djs.pack');
o3djs.require('o3djs.picking');
o3djs.require('o3djs.arcball');
o3djs.require('o3djs.quaternions');
o3djs.require('o3djs.scene');





function BrainBrowser(url) {
  var that = this;

  this.setup = function(url) {
    that.preload_model(url);
  };

  this.init = function() {

    o3djs.webgl.makeClients(that.initStep2);
  };



  /*
   * Initialize the global variables of BrainBrowser,
   * the brain model, apply material & shader
   */
   that.initStep2 = function(clientElements) {
    // Initializes global variables and libraries.
    var o3dElement = clientElements[0];
    that.o3dElement = o3dElement;
    that.client = o3dElement.client;
    that.o3d = o3dElement.o3d;
    that.math = o3djs.math;
    that.dragging = false;
    that.o3dWidth = -1;
    that.o3dHeight = -1;
    that.quaternions = o3djs.quaternions;
    that.lastRot = that.math.matrix4.identity();
    that.thatRot = that.math.matrix4.identity();
    that.zoomFactor = 1.10;
    that.keyPressDelta = 0.1;
    that.clock = 0;
    that.timeMult = 1;
    that.camera = {
      farPlane: 5000,
      nearPlane:0.1
    };



    that.loading = jQuery("#o3d_loading");

    // Initialize O3D sample libraries. o3dElement is the o3d div in the page
    o3djs.base.init(o3dElement);
    // Create a pack to manage the objects created.
    that.pack = that.client.createPack();

    // Create the render graph for a view.
    var viewInfo = o3djs.rendergraph.createBasicView(
      that.pack,
      that.client.root,
      that.client.renderGraphRoot,
      [0,0,0,0]);
    that.viewInfo = viewInfo;
    // Set up a simple orthographic view.
    viewInfo.drawContext.projection = that.math.matrix4.perspective(
      that.math.degToRad(30), // 30 degree fov.
      that.client.width / that.client.height,
      1,                  // Near plane.
      5000);              // Far plane.

    // Set up our view transformation to look towards the world origin
    // where the brain is located.
    that.eyeView = [0,0,500];
    viewInfo.drawContext.view = that.math.matrix4.lookAt(
      that.eyeView, // eye
      [0, 0, 0],  // target
      [0, 1, 0]); // up

    // Create an Effect object and initialize it using the shaders
    // from a file on the server through an ajax request.
    var effect = that.pack.createObject('Effect');
    var shaderString;
    jQuery.ajax({ type: 'GET',
      url: '/webgl/shaders/blinnphong.txt',
      dataType: 'text',
      success: function(data) {
	shaderString = data;
      },
      error: function(request,textStatus,e) {
	alert("Failure: " +  textStatus);
      },
      data: {},
      async: false,
      timeout: 10000
    });


    effect.loadFromFXString(shaderString);

    // Create a material for the mesh.
    var myMaterial = that.pack.createObject('Material');



    // Set the material's drawList.
    myMaterial.drawList = viewInfo.performanceDrawList;

    // Apply our effect to that myMaterial. The effect tells the 3D
    // hardware which shaders to use.
    myMaterial.effect = effect;

    effect.createUniformParameters(myMaterial);

    /*
     * Create the Shape for the brain mesh and assign its material.
     * two shapes will be created if the brain model has two hemispheres
     */
     if(that.model_data.num_hemispheres == 2) {

       var brainShape= {
	 left: that.createBrain(myMaterial,that.model_data.left, "left"),
	 right: that.createBrain(myMaterial, that.model_data.right, "right"),
	 num_hemisphere: 2
       };

     } else {
       var brainShape = that.createBrain(myMaterial, that.model_data);
       num_hemisphere: 2
     }



    // Create a new transform and parent the Shape under it.
     that.brainTransform = that.pack.createObject('Transform');
     if(that.model_data.num_hemispheres == 2) {
       that.brainHemisphereTransforms = {};
       that.brainHemisphereTransforms.left = that.pack.createObject('Transform');
       that.brainHemisphereTransforms.right = that.pack.createObject('Transform');
    }


    // Light position
    var light_pos_param = myMaterial.getParam('lightWorldPos');
    light_pos_param.value = that.eyeView;

    // Phong components of the light source
    var light_ambient_param = myMaterial.getParam('ambient');
    var light_ambientIntensity_param = myMaterial.getParam('ambientIntensity');
    var light_lightIntensity_param = myMaterial.getParam('lightIntensity');
    var light_specular_param = myMaterial.getParam('specular');
    var light_emissive_param = myMaterial.getParam('emissive');
    var light_colorMult_param = myMaterial.getParam('colorMult');

    // White ambient light
    light_ambient_param.value = [0.04, 0.04, 0.04, 1];
    light_ambientIntensity_param.value = [1, 1, 1, 1];
    light_lightIntensity_param.value = [0.8, 0.8, 0.8, 1];

    // White specular light
    light_specular_param.value = [0.5, 0.5, 0.5, 1];
    light_emissive_param.value = [0, 0, 0, 1];
    light_colorMult_param.value = [1, 1, 1, 1];

    // Shininess of the myMaterial (for specular lighting)
    var shininess_param = myMaterial.getParam('shininess');
    shininess_param.value = 30.0;


    // Parent the brain's transform to the client root.
     that.brainTransform.parent = that.client.root;

    if(brainShape.num_hemisphere == 1 ) {

      that.brainTransform.addShape(brainShape);
      brainShape.createDrawElements(that.pack, null);
    }else {
      that.brainHemisphereTransforms.left.parent = that.brainTransform;
      that.brainHemisphereTransforms.right.parent = that.brainTransform;
      that.brainHemisphereTransforms.left.addShape(brainShape.left);
      that.brainHemisphereTransforms.right.addShape(brainShape.right);
      brainShape.left.createDrawElements(that.pack, null);
      brainShape.right.createDrawElements(that.pack, null);

    }




    // Generate the draw elements for the brain shape.




    that.aball = o3djs.arcball.create(100, 100);


    that.client.setRenderCallback(that.renderCallback);
    o3djs.event.addEventListener(o3dElement, 'wheel', that.scrollMe);
    window.document.onkeypress = that.keyPressedCallback;
    o3djs.event.addEventListener(o3dElement, 'mousedown', function (e) {
      if(e.shiftKey && e.button == that.o3d.Event.BUTTON_LEFT && !e.ctrlKey) {
	if(that.clickCallback){
	  click(e,that.clickCallback);
	}

      }else if(e.ctrlKey && e.button == that.o3d.Event.BUTTON_LEFT && !e.shiftKey) {
	if(that.valueAtPointCallback) {
	  that.click(e,that.valueAtPointCallback);
	}

      }else if(e.button == that.o3d.Event.BUTTON_LEFT){
	that.startDragging(e);
      }



    });
    o3djs.event.addEventListener(o3dElement, 'mousemove', function (e) {
      that.drag(e);
    });
    o3djs.event.addEventListener(o3dElement, 'mouseup', function (e) {
      if(!e.shiftKey || e.button == that.o3d.Event.BUTTON_RIGHT){
	that.stopDragging(e);
      }
    });

     //This allows a programmer to define a function that runs after initialization
     if(that.afterInit) {
       that.afterInit(that);
     }
     that.updateInfo();

     jQuery('#screenshot').click(function(event) {jQuery(this).attr("href",bb.client.toDataURL());});
  };


  this.uninit = function() {
    if (this.client) {
      this.client.cleanup();
    }
  };


  /*
   * This function is ran on every render.
   */
  this.renderCallback = function(renderEvent) {
    that.setClientSize();
  };

  /*
   * Adds space between the hemispheres
   */
  this.separateHemispheres = function(e) {
    if(that.model_data.num_hemispheres == 2 ) {
      this.brainTransform.children[0].translate([-1,0,0]);
      this.brainTransform.children[1].translate([1,0,0]);
    }
  };

  /*
   * The following functions handle to preset views of the system.
   */
  this.sagitalView = function(e) {

    if(that.model_data.num_hemispheres == 2 ) {
      that.resetView();
      that.brainTransform.children[0].translate([-100,0,0]);
      that.brainTransform.children[1].translate([100,0,0]);
      that.brainTransform.children[0].rotateZ(that.math.degToRad(-90));
      that.brainTransform.children[1].rotateZ(that.math.degToRad(90));
      that.brainTransform.rotateX(that.math.degToRad(-90));
    }
  };

  this.reverseSagitalView = function(e) {

    if(that.model_data.num_hemispheres == 2 ) {
      that.resetView();
      that.brainTransform.children[0].translate([-100,0,0]);
      that.brainTransform.children[1].translate([100,0,0]);
      that.brainTransform.children[0].rotateZ(that.math.degToRad(-90));
      that.brainTransform.children[1].rotateZ(that.math.degToRad(90));
      that.brainTransform.rotateX(that.math.degToRad(90));
      that.brainTransform.rotateY(that.math.degToRad(180));

    }
  };

  this.leftView = function(e) {
    that.resetView();
    that.brainTransform.children[1].visible = false;
    that.brainTransform.rotateX(that.math.degToRad(-90));
    that.brainTransform.rotateZ(that.math.degToRad(90));
  };

  this.rightView = function(e) {
    that.resetView();
    that.brainTransform.children[0].visible = false;
    that.brainTransform.rotateX(that.math.degToRad(-90));
    that.brainTransform.rotateZ(that.math.degToRad(-90));
  };

  this.anteriorView = function(e) {
    that.resetView();
    that.brainTransform.rotateX(that.math.degToRad(-90));
    that.brainTransform.rotateZ(that.math.degToRad(180));
  };

  this.posteriorView = function(e) {
    that.resetView();
    that.brainTransform.rotateX(that.math.degToRad(-90));
  };

  /*
   * Creates the client area.
   */

  this.setClientSize= function() {

    var newWidth  = parseInt(that.client.width);
    var newHeight = parseInt(that.client.height);

    if (newWidth != that.o3dWidth || newHeight != that.o3dHeight) {

      that.o3dWidth = newWidth;
      that.o3dHeight = newHeight;

      that.updateProjection();

      // Sets a new area size for arcball.
      that.aball.setAreaSize(that.o3dWidth, that.o3dHeight);
    }
  };


  /*
   * The following methods implement the zoom in and out
   */
  that.ZoomInOut = function(zoom) {
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
  function click(e,click_callback) {
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
      var position_vector = pickInfo.rayIntersectionInfo.position;
      var hemisphere      = pickInfo.element.owner.name;
      var info = {
	primitive_index: primitive_index,
	position_vector: position_vector,
	element: pickInfo.element,
	hemisphere: hemisphere,
	vertex:  that.model_data.get_vertex(primitive_index,position_vector,hemisphere)
      };
	return click_callback(e,info);
    } else {

      //that.debugLine.setVisible(false);
      jQuery(that.pickInfoElem).html('--nothing--');
    }


  };

  that.startDragging = function(e) {
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

  that.drag = function(e) {

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

    }else if(that.dragging) {
      that.stopDragging(e);
    }
  };



  that.stopDragging = function(e) {
    that.drag_hemisphere = false;
    that.dragging = false;
  };






  that.updateCamera = function() {

    var up = [0, 1, 0];
    that.viewInfo.drawContext.view = that.math.matrix4.lookAt(that.camera.eye,
							      that.camera.target,
							      up);
    that.lightPosParam.value = that.camera.eye;
  };

  that.updateProjection = function() {

    // Create a perspective projection matrix.
    that.viewInfo.drawContext.projection = that.math.matrix4.perspective(
      that.math.degToRad(45), that.o3dWidth / that.o3dHeight, that.camera.nearPlane,
      that.camera.farPlane);

  };


  /**
   * Function performing the rotate action in response to a key-press.
   * Rotates the scene based on key pressed. (w ,s, a, d). Note that the x and
   * y-axis referenced here are relative to the current view of the scene.
   * @param {keyPressed} The letter pressed, in lower case.
   * @param {delta} The angle by which the scene should be rotated.
   * @return true if an action was taken.
   */
  that.keyPressedAction = function(keyPressed, delta) {
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
  }

  /**
   * Callback for the keypress event.
   * Invokes the action to be performed for the key pressed.
   * @param {event} keyPress event passed to us by javascript.
   */
   that.keyPressedCallback = function(event) {

     event = event || window.event;

    // Ignore accelerator key messages.
    if (event.metaKey)
      return true;

    var keyChar = String.fromCharCode(o3djs.event.getEventKeyChar(event));
    // Just in case they have capslock on.
    keyChar = keyChar.toLowerCase();

    if (that.keyPressedAction(keyChar, that.keyPressDelta)) {
      o3djs.event.cancel(event);
      return false;
    }
     return true;
   };

  /**
   * Resets the view of the scene by resetting its local matrix to the identity
   * matrix.
   */
  that.resetView = function() {
    that.brainTransform.children[0].visible=true;
    that.brainTransform.children[1].visible=true;
    that.brainTransform.identity();
    that.brainTransform.children[0].identity();
    that.brainTransform.children[1].identity();

  };



  /*
   * Sets the fillmode of the brain to wireframe or filled
   */
  that.set_fill_mode_wireframe= function() {
    if(that.model_data.num_hemispheres == 2){

      var brainMaterial = that.brainTransform.children[0].shapes[0].elements[0].material;
      that.state = that.pack.createObject('State');
      brainMaterial.state = that.state;
      that.state.getStateParam('FillMode').value = that.o3d.State.WIREFRAME;

      brainMaterial = that.brainTransform.children[1].shapes[0].elements[0].material;
      that.state = that.pack.createObject('State');
      brainMaterial.state = that.state;
      that.state.getStateParam('FillMode').value = that.o3d.State.WIREFRAME;
    } else {
      var brainMaterial = that.brainTransform.shapes[0].elements[0].material;
      that.state = that.pack.createObject('State');
      brainMaterial.state = that.state;
      that.state.getStateParam('FillMode').value = that.o3d.State.WIREFRAME;
    }

  };

  that.set_fill_mode_solid = function() {
    if(that.model_data.num_hemispheres == 2){

      var brainMaterial = that.brainTransform.children[0].shapes[0].elements[0].material;
      that.state = that.pack.createObject('State');
      brainMaterial.state = that.state;
      that.state.getStateParam('FillMode').value = that.o3d.State.SOLID;

      brainMaterial = that.brainTransform.children[1].shapes[0].elements[0].material;
      that.state = that.pack.createObject('State');
      brainMaterial.state = that.state;
      that.state.getStateParam('FillMode').value = that.o3d.State.SOLID;
    } else {
      var brainMaterial = that.brainTransform.shapes[0].elements[0].material;
      that.state = that.pack.createObject('State');
      brainMaterial.state = that.state;
      that.state.getStateParam('FillMode').value = that.o3d.State.SOLID;
    }

  };

  //Removes the indexing of the model
  //Requires a reordering of the vertices to make polygons next to each other.
  //returns the new model (avoiding side effects ;0p)
  function unIndexModel(model) {
    var newPositionArray = [];
    var newNormalArray = [];
    var newColorArray = model.colorArray;

    var numberOfIndices = model.indexArray.length;

    var fix_colors = false;
    if((model.colorArray.length/4) === (model.positionArray.length/3)) {
      fix_colors = true;
      newColorArray = [];
    }
    for(var i=0; i < numberOfIndices; i++) {
      for(var j=0; j<3; j++) {

	newPositionArray.push(model.positionArray[model.indexArray[i]*3 + j]);
	newNormalArray.push(model.normalArray[model.indexArray[i]*3 + j]);
      }

      if(fix_colors) {
	for(var k=0; j<4; j++){
	  newColorArray.push(model.colorArray[model.indexArray[i]*4 + j]);
	}
      }
    }
    return {
      positionArray: newPositionArray,
      normalArray: newNormalArray,
      colorArray: newColorArray
    };
  }




  /*
   * Creates the brain shape with the material provide.
   */
  that.createBrain = function(material,model,name) {
    //model = unIndexModel(model);
    var brainShape = that.pack.createObject('Shape');
    var brainPrimitive = that.pack.createObject('Primitive');
    var streamBank = that.pack.createObject('StreamBank');

    brainPrimitive.material = material;
    brainPrimitive.owner = brainShape;
    brainPrimitive.streamBank = streamBank;
    brainShape.name = name;

    brainPrimitive.primitiveType = that.o3d.Primitive.TRIANGLE_LIST;

    var state = that.pack.createObject('State');

    //create Position buffer (vertices) and set the number of vertices global variable
    var positionsBuffer = that.pack.createObject('VertexBuffer');
    var positionsField = positionsBuffer.createField('FloatField', 3);
    if(!model.positionArray) {
      alert("PositionArray nil");
      return false;
    }
    positionsBuffer.set(model.positionArray);
    //positionsBuffer.set(newPositionArray);
    that.numberVertices = model.numberVertices;
    var numberVertices = (model.positionArray.length/3);
    brainPrimitive.numberVertices = that.numberVertices;

    //create indexBuffer and make sure number of primitive is set
    if(!model.indexArray) {
      alert("Index Array nil");
      return false;
    }
    brainPrimitive.numberPrimitives = model.indexArray.length/3;
    var indexBuffer = that.pack.createObject('IndexBuffer');
    indexBuffer.set(model.indexArray);
    brainPrimitive.indexBuffer = indexBuffer;


    //Create normal buffer
    var normalBuffer = that.pack.createObject('VertexBuffer');
    var normalField = normalBuffer.createField('FloatField', 3);
    normalBuffer.set(model.normalArray);
    //normalBuffer.set(newNormalArray);



    //Create colorBuffer from base color of model

    var colorArray=[];
    if(model.colorArray.length == 4) {
      for(var i=0;i<numberVertices;i++) {
	colorArray.push.apply(colorArray,[0.5,0.5,0.7,1]);
      }
    }
    if(colorArray.length < model.positionArray.length) {
      alert('Problem with the colors: ' + colorArray.length);
    }
    var colorBuffer = that.pack.createObject('VertexBuffer');
    var colorField = colorBuffer.createField('FloatField', 4);
    colorBuffer.set(colorArray);
    colorArray = [];

    if(that.loading){
      jQuery(that.loading).html("Buffers Loaded");
    }


    streamBank.setVertexStream(
      that.o3d.Stream.POSITION, //  That stream stores vertex positions
      0,                     // First (and only) position stream
      positionsField,        // field: the field that stream uses.
      0);                    // start_index:

    streamBank.setVertexStream(
      that.o3d.Stream.NORMAL,
      0,
      normalField,
      0);


    streamBank.setVertexStream(
      that.o3d.Stream.COLOR,
      0,
      colorField,
      0);

    return brainShape;

  };

  that.preload_model = function(url) {

    jQuery.ajax({ type: 'GET',
      url: url ,
      dataType: 'text',
      success: function(data) {
	that.model_data = new MNIObject(data);
	that.init();
      },
      error: function(request,textStatus,e) {
	alert("Failure: " +  textStatus);
      },
      data: {},
      async: true,
      timeout: 100000
    });
  };


  if(url) {
    that.preload_model(url);
  }


}