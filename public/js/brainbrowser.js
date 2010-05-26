/* BrainBrowser.js
 * This file defines the brainbrowser object used to initialize an O3D client and display a brain
 * model.
 *
 * This object requires that a div with o3d is defined in the page
 * This file currently depends on mniobj.js
 */

//Required o3d librairies
o3djs.require('o3djs.util');
o3djs.require('o3djs.math');
o3djs.require('o3djs.rendergraph');
o3djs.require('o3djs.pack');
o3djs.require('o3djs.picking');
o3djs.require('o3djs.arcball');
o3djs.require('o3djs.quaternions');
o3djs.require('o3djs.scene');





function BrainBrowser(url) {
  var that = this;

  this.init = function() {
    o3djs.util.makeClients(that.initStep2,"LargeGeometry");
  };



  /*
   * Initialize the global variables of BrainBrowser, the brain model, apply material & shader
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

    // Initialize O3D sample libraries.
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
    // from the text area.
    var effect = that.pack.createObject('Effect');
    //var shaderString = document.getElementById('shader').value;
    var shaderString;
    jQuery.ajax({ type: 'GET',
      url: '/shaders/blinnphong.txt',
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

    // Create a MyMaterial for the mesh.
    var myMaterial = that.pack.createObject('Material');



    // Set the myMaterial's drawList.
    myMaterial.drawList = viewInfo.performanceDrawList;

    // Apply our effect to that myMaterial. The effect tells the 3D
    // hardware which shaders to use.
    myMaterial.effect = effect;

    effect.createUniformParameters(myMaterial);

    // Create the Shape for the brain mesh and assign its myMaterial.
    var brainShape = that.createBrain(myMaterial);

    // Create a new transform and parent the Shape under it.
    that.brainTransform = that.pack.createObject('Transform');
    // Light position
    var light_pos_param = myMaterial.getParam('lightWorldPos');
    light_pos_param.value = that.eyeView;

    // Phong components of the light source
    var light_ambient_param = myMaterial.getParam('ambient');
    var light_ambientIntensity_param = myMaterial.getParam('ambientIntensity');
    var light_lightIntensity_param = myMaterial.getParam('lightIntensity');
    var light_diffuse_param = myMaterial.getParam('diffuse');
    var light_specular_param = myMaterial.getParam('specular');
    var light_emissive_param = myMaterial.getParam('emissive');
    var light_colorMult_param = myMaterial.getParam('colorMult');

    // White ambient light
    light_ambient_param.value = [0.04, 0.04, 0.04, 1];
    light_ambientIntensity_param.value = [1, 1, 1, 1];
    light_lightIntensity_param.value = [0.8, 0.8, 0.8, 1];
    // BLUE!!!! diffuse light
    light_diffuse_param.value = [0.5, 0.5, 0.7, 0];
    // White specular light
    light_specular_param.value = [0.5, 0.5, 0.5, 1];
    light_emissive_param.value = [0, 0, 0, 1];
    light_colorMult_param.value = [1, 1, 1, 1];

    // Shininess of the myMaterial (for specular lighting)
    var shininess_param = myMaterial.getParam('shininess');
    shininess_param.value = 30.0;


    that.brainTransform.addShape(brainShape);

    // Parent the brain's transform to the client root.
    that.brainTransform.parent = that.client.root;

    // Generate the draw elements for the brain shape.
    brainShape.createDrawElements(that.pack, null);


    that.aball = o3djs.arcball.create(100, 100);


    that.client.setRenderCallback(that.renderCallback);
    o3djs.event.addEventListener(o3dElement, 'wheel', that.scrollMe);
    window.document.onkeypress = that.keyPressedCallback;
    o3djs.event.addEventListener(o3dElement, 'mousedown', function (e) {
      if(!e.shiftKey || e.button == that.o3d.Event.BUTTON_RIGHT){
	that.startDragging(e);
      }
      if(e.shiftKey && e.button == that.o3d.Event.BUTTON_LEFT) {
	if(pickClick){
	  pickClick(e);
	}

      }
      if(e.ctrlKey && e.button == that.o3d.Event.BUTTON_LEFT) {
	if(valueAtPoint) {
	  valueAtPoint(e);
	}

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
     if(afterInit) {
       afterInit();
     }

  };


  this.uninit = function() {
    if (this.client) {
      this.client.cleanup();
    }
  };

  this.renderCallback = function(renderEvent) {
    //this.clock += renderEvent.elapsedTime * this.timeMult;
    // Rotate the brain around the Y axis.
    //this.brainTransform.identity();
    //this.brainTransform.rotateY(0.5 * this.clock);
    //this.brainTransform.rotateZ(0.5 * this.clock);
    // this.brainTransform.rotateX(0.5 * this.clock);
    that.setClientSize();

  }





  /**
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
   * @param {event} e event.
   */
  that.scrollMe = function(e) {
    var zoom = (e.deltaY < 0) ? 1 / that.zoomFactor : that.zoomFactor ;
    that.ZoomInOut(zoom);
    that.client.render();
  };



  that.startDragging = function(e) {

    that.lastRot = that.thatRot;

    that.aball.click([e.x, e.y]);

    that.dragging = true;
  };

  that.drag = function(e) {

    if (that.dragging) {

      var rotationQuat = that.aball.drag([e.x, e.y]);
      var rot_mat = that.quaternions.quaternionToRotation(rotationQuat);
      that.thatRot = that.math.matrix4.mul(that.lastRot, rot_mat);

      var m = that.brainTransform.localMatrix;
      that.math.matrix4.setUpper3x3(m, that.thatRot);
      that.brainTransform.localMatrix = m;
    }
  };


  that.stopDragging = function(e) {

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
      break;
    case '(':
      that.ZoomInOut(1/that.zoomFactor);
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
      return;

    var keyChar = String.fromCharCode(o3djs.event.getEventKeyChar(event));
    // Just in case they have capslock on.
    keyChar = keyChar.toLowerCase();

    if (that.keyPressedAction(keyChar, that.keyPressDelta)) {
      o3djs.event.cancel(event);
    }
   };

  /**
   * Resets the view of the scene by resetting its local matrix to the identity
   * matrix.
   */
  function resetView() {
    that.brainTransform.identity();
  }



  /*
   * Sets the fillmode of the brain to wireframe or filled
   */
  that.set_fill_mode_wireframe= function() {
    var brainMaterial = that.brainTransform.shapes[0].elements[0].material;
    that.state = that.pack.createObject('State');
    brainMaterial.state = that.state;
    that.state.getStateParam('FillMode').value = that.o3d.State.WIREFRAME;
  };

  that.set_fill_mode_solid = function() {
    var brainMaterial = that.brainTransform.shapes[0].elements[0].material;
    that.state = that.pack.createObject('State');
    brainMaterial.state = that.state;
    that.state.getStateParam('FillMode').value = that.o3d.State.SOLID;
  };



  /*
   * Creates the brain shape with the material provide.
   */
  that.createBrain = function(material) {

    var brainShape = that.pack.createObject('Shape');
    var brainPrimitive = that.pack.createObject('Primitive');
    var streamBank = that.pack.createObject('StreamBank');

    brainPrimitive.material = material;
    brainPrimitive.owner = brainShape;
    brainPrimitive.streamBank = streamBank;

    brainPrimitive.primitiveType = that.o3d.Primitive.TRIANGLELIST;

    var state = that.pack.createObject('State');


    //create Position buffer (vertices) and set the number of vertices global variable
    var positionsBuffer = that.pack.createObject('VertexBuffer');
    var positionsField = positionsBuffer.createField('FloatField', 3);
    if(!that.model_data.positionArray) {
      alert("PositionArray nil");
    }
    positionsBuffer.set(that.model_data.positionArray);
    that.numberVertices = (that.model_data.positionArray.length/3.0);
    brainPrimitive.numberVertices = that.numberVertices;

    //create indexBuffer and make sure number of primitive is set
    if(!that.model_data.indexArray) {
      alert("Index Array nil");
    }
    that.numberPrimitives = that.model_data.numberPolygons;
    brainPrimitive.numberPrimitives = that.numberPrimitives;
    var indexBuffer = that.pack.createObject('IndexBuffer');
    indexBuffer.set(that.model_data.indexArray);



    //Create normal buffer
    var normalBuffer = that.pack.createObject('VertexBuffer');
    var normalField = normalBuffer.createField('FloatField', 3);
    normalBuffer.set(that.model_data.normalArray);



    //Create colorBuffer from base color of model

    var colorArray=[];
    if(that.model_data.colorArray.length == 4) {
      for(var i=0;i<that.model_data.numberVertices;i++) {
	colorArray.push.apply(colorArray,[0.5,0.5,0.7,1]);
      }
    }
    if(colorArray.length < that.model_data.positionArray.length) {
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
      that.o3d.Stream.NORMAL, //  That stream stores vertex positions
      0,                     // First (and only) position stream
      normalField,        // field: the field that stream uses.
      0);                    // start_index:


    streamBank.setVertexStream(
      that.o3d.Stream.COLOR, //  That stream stores vertex positions
      0,                     // First (and only) position stream
      colorField,        // field: the field that stream uses.
      0);                    // start_index:





    // Associate the triangle indices Buffer with the primitive.
    brainPrimitive.indexBuffer = indexBuffer;



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