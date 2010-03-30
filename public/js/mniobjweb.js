jQuery.noConflict();

var NORMAL_SCALE_FACTOR = 2.0;



o3djs.require('o3djs.util');
o3djs.require('o3djs.math');
o3djs.require('o3djs.rendergraph');
o3djs.require('o3djs.pack');
o3djs.require('o3djs.picking');
o3djs.require('o3djs.arcball');
o3djs.require('o3djs.quaternions');
o3djs.require('o3djs.scene');
//o3djs.require('o3djs.debug');
// Events
// Run the init() function once the page has finished loading.
// Run the uninit() function when the page has is unloaded.
//window.onloa = init;

// global variables
var g_o3d;
var g_math;
var g_client;
var g_pack;
var g_clock = 0;
var g_timeMult = 1;
var g_brainTransform;
var g_keyPressDelta = 0.1;
var g_zoomFactor = 1.03;
var g_eyeView;
var g_lightPosParam;
var g_o3dElement;
var g_viewInfo;
var g_aball;
var g_thisRot;
var g_lastRot;
var g_dragging = false;
var g_quaternions;
var g_o3dWidth = -1;
var g_o3dHeight = -1;
var g_camera = {

  farPlane: 5000,
  nearPlane:0.1
};
//for Picking
var g_debugLineGroup;
var g_debugLine;
var g_selectedInfo = null;
var g_treeInfo;  // information about the transform graph.
var g_pickInfoElem;
var g_flashTimer = 0;
var g_highlightMaterial;
var g_highlightShape;
//var g_debugHelper;


function startDragging(e) {

  g_lastRot = g_thisRot;

  g_aball.click([e.x, e.y]);

  g_dragging = true;
}

function drag(e) {

  if (g_dragging) {

    var rotationQuat = g_aball.drag([e.x, e.y]);
    var rot_mat = g_quaternions.quaternionToRotation(rotationQuat);
    g_thisRot = g_math.matrix4.mul(g_lastRot, rot_mat);

    var m = g_brainTransform.localMatrix;
    g_math.matrix4.setUpper3x3(m, g_thisRot);
    g_brainTransform.localMatrix = m;
  }
}


function stopDragging(e) {

  g_dragging = false;
}


function updateCamera() {

  var up = [0, 1, 0];
  g_viewInfo.drawContext.view = g_math.matrix4.lookAt(g_camera.eye,
						      g_camera.target,
						      up);
  g_lightPosParam.value = g_camera.eye;
}

function updateProjection() {

    // Create a perspective projection matrix.
  g_viewInfo.drawContext.projection = g_math.matrix4.perspective(
  g_math.degToRad(45), g_o3dWidth / g_o3dHeight, g_camera.nearPlane,
  g_camera.farPlane);
}



//from picking example
function updateInfo() {

  if (!g_treeInfo) {

    g_treeInfo = o3djs.picking.createTransformInfo(g_client.root,
						   null);
  }
  g_treeInfo.update();
}


function unSelectAll() {

  if (g_selectedInfo) {


    g_highlightShape = null;
    g_selectedInfo = null;
      }
  }
function select(pickInfo) {

  unSelectAll();
  if (pickInfo) {

    g_selectedInfo = pickInfo;

  }
}






//Picking a vertex
function pickClick(e) {
  var worldRay = o3djs.picking.clientPositionToWorldRay(
    e.x,
    e.y,
    g_viewInfo.drawContext,
    g_client.width,
    g_client.height);
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
  g_treeInfo.update();

  var pickInfo = g_treeInfo.pick(worldRay);
  if (pickInfo) {

    select(pickInfo);

    var primitiveIndex = pickInfo.rayIntersectionInfo.primitiveIndex;
    var positionVector = pickInfo.rayIntersectionInfo.position;
    var element = pickInfo.element;



    var vertex = [];
    var colorArray = [];
    jQuery(g_pickInfoElem).html("LOADING MAP................");
    jQuery.ajax({
		type: 'GET',
		url: '/model/colors.json.1',
		dataType: 'json',
		success: function(model_data) {
		  vertex = model_data.vertex;
		  colorArray = colorArray.concat(colorArray,model_data.colors);

		},
		data: {index: primitiveIndex,
		       position: positionVector
			},

		async: false
	      });
    jQuery.ajax({
		type: 'GET',
		url: '/model/colors.json.2',
		dataType: 'json',
		success: function(model_data) {
		  vertex = model_data.vertex;
		  colorArray=colorArray.concat(colorArray,model_data.colors);

		},
		  data: {index: primitiveIndex,
		         position: positionVector
			},
		async: false
		  });

    jQuery(g_pickInfoElem).html("Vertex:"+ vertex + " Index of Primitive " + primitiveIndex + " Position Vector of point " + positionVector );
    var colorBuffer = g_pack.createObject('VertexBuffer');
    var colorField = colorBuffer.createField('FloatField', 4);
    colorBuffer.set(colorArray);
    colorArray = [];
    var brainShape = g_brainTransform.shapes[0];
    var streamBank = brainShape.elements[0].streamBank;
    streamBank.setVertexStream(
      g_o3d.Stream.COLOR, //  This stream stores vertex positions
      0,                     // First (and only) position stream
      colorField,        // field: the field this stream uses.
      0);                    // start_index:
    g_client.render();


        // Display the normal
    // NOTE: Lookup the normal with this function is very SLOW!!
    // If you need performance, for a game or something, you should consider
    // other methods.
    var normal = o3djs.element.getNormalForTriangle(
      pickInfo.element,
      pickInfo.rayIntersectionInfo.primitiveIndex);

      // Convert the normal from local to world space.
    normal = g_math.matrix4.transformNormal(
      pickInfo.shapeInfo.parent.transform.worldMatrix,
      normal);

      // Remove the scale from the normal.
    normal = g_math.normalize(normal);

        // Get the world position of the collision.
    var worldPosition = pickInfo.worldIntersectionPosition;

        // Add the normal to it to get a point in space above it with some
    // multiplier to scale it.
    var normalSpot = g_math.addVector(
      worldPosition,
      g_math.mulVectorScalar(normal, NORMAL_SCALE_FACTOR));

        // Move our debug line to show the normal
    //g_debugLine.setVisible(true);
    //g_debugLine.setEndPoints(worldPosition, normalSpot);
  } else {

	//g_debugLine.setVisible(false);
	jQuery(g_pickInfoElem).html('--nothing--');
      }


}






/**
 * Function performing the rotate action in response to a key-press.
 * Rotates the scene based on key pressed. (w ,s, a, d). Note that the x and
 * y-axis referenced here are relative to the current view of the scene.
 * @param {keyPressed} The letter pressed, in lower case.
 * @param {delta} The angle by which the scene should be rotated.
 * @return true if an action was taken.
 */
function keyPressedAction(keyPressed, delta) {
  var actionTaken = false;
  switch(keyPressed) {
  case 'a':
    g_brainTransform.localMatrix =
      g_math.matrix4.mul(g_brainTransform.localMatrix,
                         g_math.matrix4.rotationY(-delta));
    actionTaken = true;
    break;
  case 'd':
    g_brainTransform.localMatrix =
      g_math.matrix4.mul(g_brainTransform.localMatrix,
                         g_math.matrix4.rotationY(delta));
    actionTaken = true;
    break;
  case 'w':
    g_brainTransform.localMatrix =
      g_math.matrix4.mul(g_brainTransform.localMatrix,
                         g_math.matrix4.rotationX(-delta));
    actionTaken = true;
    break;
  case 's':
    g_brainTransform.localMatrix =
      g_math.matrix4.mul(g_brainTransform.localMatrix,
                         g_math.matrix4.rotationX(delta));
    actionTaken = true;
    break;
  }
  return actionTaken;
}

/**
 * Callback for the keypress event.
 * Invokes the action to be performed for the key pressed.
 * @param {event} keyPress event passed to us by javascript.
 */
function keyPressedCallback(event) {
  event = event || window.event;

  // Ignore accelerator key messages.
  if (event.metaKey)
    return;

  var keyChar = String.fromCharCode(o3djs.event.getEventKeyChar(event));
  // Just in case they have capslock on.
  keyChar = keyChar.toLowerCase();

  if (keyPressedAction(keyChar, g_keyPressDelta)) {
    o3djs.event.cancel(event);
  }
}

/**
 * Resets the view of the scene by resetting its local matrix to the identity
 * matrix.
 */
function resetView() {
  g_brainTransform.identity();
}







function createBrain(material) {
  var brainShape = g_pack.createObject('Shape');
  var brainPrimitive = g_pack.createObject('Primitive');
  var streamBank = g_pack.createObject('StreamBank');

  brainPrimitive.material = material;
  brainPrimitive.owner = brainShape;
  brainPrimitive.streamBank = streamBank;

  brainPrimitive.primitiveType = g_o3d.Primitive.TRIANGLELIST;

  var state = g_pack.createObject('State');



  var positionArray = [];
  jQuery.ajax({
		type: 'GET',
		url: '/model/vertices.json',
		dataType: 'json',
		success: function(model_data) {
		  positionArray = model_data.vertices;
		},
		data: {},
		async: false
	      });
  var positionsBuffer = g_pack.createObject('VertexBuffer');
  var positionsField = positionsBuffer.createField('FloatField', 3);
  positionsBuffer.set(positionArray);
  positionArray = [];

  var indicesArray = [];
  jQuery.ajax({
		type: 'GET',
		url: '/model/polygons.json.1',
		dataType: 'json',
		success: function(model_data) {
		  indicesArray = model_data.polygons;
		},
		data: {},
		async: false
	      });
  jQuery.ajax({
		type: 'GET',
		url: '/model/polygons.json.2',
		dataType: 'json',
		success: function(model_data) {
		  indicesArray=indicesArray.concat(model_data.polygons);
		},
		data: {},
		async: false
	      });



  brainPrimitive.numberPrimitives = (indicesArray.length/3.0);
  brainPrimitive.numberVertices = (positionArray.length/3.0);
  var indexBuffer = g_pack.createObject('IndexBuffer');
  indexBuffer.set(indicesArray);
  indicesArray = [];



  var normalArray =[];
  jQuery.ajax({
		type: 'GET',
		url: '/model/normal_vectors.json',
		dataType: 'json',
		success: function(model_data) {
		  normalArray = model_data.normal_vectors;
		},
		data: {},
		async: false
	      });

  var normalBuffer = g_pack.createObject('VertexBuffer');
  var normalField = normalBuffer.createField('FloatField', 3);
  normalBuffer.set(normalArray);
  normalArray = [];






  var colorArray = [];
  jQuery.ajax({
		type: 'GET',
		url: '/model/colors.json.1',
		dataType: 'json',
		success: function(model_data) {
		  colorArray = model_data.colors;
		},
		data: {},
		async: false
	      });
  jQuery.ajax({
		type: 'GET',
		url: '/model/colors.json.2',
		dataType: 'json',
		success: function(model_data) {
		  colorArray = colorArray.concat(model_data.colors);
		},
		data: {},
		async: false
	      });

  var colorBuffer = g_pack.createObject('VertexBuffer');
  var colorField = colorBuffer.createField('FloatField', 4);
  colorBuffer.set(colorArray);
  colorArray = [];







  streamBank.setVertexStream(
    g_o3d.Stream.POSITION, //  This stream stores vertex positions
    0,                     // First (and only) position stream
    positionsField,        // field: the field this stream uses.
    0);                    // start_index:

  streamBank.setVertexStream(
    g_o3d.Stream.NORMAL, //  This stream stores vertex positions
    0,                     // First (and only) position stream
    normalField,        // field: the field this stream uses.
    0);                    // start_index:


  streamBank.setVertexStream(
    g_o3d.Stream.COLOR, //  This stream stores vertex positions
    0,                     // First (and only) position stream
    colorField,        // field: the field this stream uses.
    0);                    // start_index:





  // Associate the triangle indices Buffer with the primitive.
  brainPrimitive.indexBuffer = indexBuffer;

  updateInfo();
  g_treeInfo.dump('');


  return brainShape;
}

/**
 * This method gets called every time O3D renders a frame.
 * Here's where we update the brain's transform to make it spin.
 * @param {o3d.RenderEvent} renderEvent The render event object
 * that gives us the elapsed time since last time a frame was rendered.
 */
function renderCallback(renderEvent) {
  //g_clock += renderEvent.elapsedTime * g_timeMult;
  // Rotate the brain around the Y axis.
  //g_brainTransform.identity();
  //g_brainTransform.rotateY(0.5 * g_clock);
  //g_brainTransform.rotateZ(0.5 * g_clock);
  // g_brainTransform.rotateX(0.5 * g_clock);
  setClientSize();

}

/**
 * Creates the client area.
 */
function init() {
  o3djs.util.makeClients(initStep2,"LargeGeometry");
}

function setClientSize() {

  var newWidth  = parseInt(g_client.width);
  var newHeight = parseInt(g_client.height);

  if (newWidth != g_o3dWidth || newHeight != g_o3dHeight) {

    g_o3dWidth = newWidth;
    g_o3dHeight = newHeight;

    updateProjection();

        // Sets a new area size for arcball.
    g_aball.setAreaSize(g_o3dWidth, g_o3dHeight);
    }
}





/**
 * Initializes O3D.
 * @param {Array} clientElements Array of o3d object elements.
 */
function initStep2(clientElements) {
  // Initializes global variables and libraries.
  var o3dElement = clientElements[0];
  g_o3dElement = o3dElement;
  g_client = o3dElement.client;
  g_o3d = o3dElement.o3d;
  g_math = o3djs.math;
  g_quaternions = o3djs.quaternions;
  g_lastRot = g_math.matrix4.identity();
  g_thisRot = g_math.matrix4.identity();
  g_pickInfoElem = jQuery("#vertex_info");
  // Initialize O3D sample libraries.
  o3djs.base.init(o3dElement);

  // Create a pack to manage the objects created.
  g_pack = g_client.createPack();


  //g_debugHelper = o3djs.debug.createDebugHelper(g_client.createPack(),
	//					g_viewInfo);




  //g_debugLineGroup = g_debugHelper.createDebugLineGroup(g_client.root);
  //g_debugLine = g_debugLineGroup.addLine();
  //g_debugLine.setColor([0,1,0,1]);

  // Create the render graph for a view.
  var viewInfo = o3djs.rendergraph.createBasicView(
    g_pack,
    g_client.root,
    g_client.renderGraphRoot);
  g_viewInfo = viewInfo;
  // Set up a simple orthographic view.
  viewInfo.drawContext.projection = g_math.matrix4.perspective(
    g_math.degToRad(30), // 30 degree fov.
    g_client.width / g_client.height,
    1,                  // Near plane.
    5000);              // Far plane.

  // Set up our view transformation to look towards the world origin
  // where the brain is located.
  g_eyeView = [0,0,500];
  viewInfo.drawContext.view = g_math.matrix4.lookAt(
    g_eyeView, // eye
    [0, 0, 0],  // target
    [0, 1, 0]); // up

  // Create an Effect object and initialize it using the shaders
  // from the text area.
  var effect = g_pack.createObject('Effect');
  var shaderString = document.getElementById('shader').value;
  effect.loadFromFXString(shaderString);

  // Create a MyMaterial for the mesh.
  var myMaterial = g_pack.createObject('Material');
  var g_state = g_pack.createObject('State');
  //myMaterial.state = g_state;
  //g_state.getStateParam('FillMode').value = g_o3d.State.FILLED;



  // Set the myMaterial's drawList.
  myMaterial.drawList = viewInfo.performanceDrawList;

  // Apply our effect to this myMaterial. The effect tells the 3D
  // hardware which shaders to use.
  myMaterial.effect = effect;

  effect.createUniformParameters(myMaterial);

  // Create the Shape for the brain mesh and assign its myMaterial.
  var brainShape = createBrain(myMaterial);

  // Create a new transform and parent the Shape under it.
  g_brainTransform = g_pack.createObject('Transform');
  // Light position
  var light_pos_param = myMaterial.getParam('lightWorldPos');
  light_pos_param.value = g_eyeView;

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


  g_brainTransform.addShape(brainShape);

  // Parent the brain's transform to the client root.
  g_brainTransform.parent = g_client.root;

  // Generate the draw elements for the brain shape.
  brainShape.createDrawElements(g_pack, null);


  g_aball = o3djs.arcball.create(100, 100);


  g_client.setRenderCallback(renderCallback);
  o3djs.event.addEventListener(o3dElement, 'wheel', scrollMe);
  o3djs.event.addEventListener(o3dElement, 'mousedown', function (e) {
    if(!e.shiftKey || e.button == g_o3d.Event.BUTTON_RIGHT){
      startDragging(e);
    }
    if(e.shiftKey && e.button == g_o3d.Event.BUTTON_LEFT) {
      pickClick(e);
    }
  });
  o3djs.event.addEventListener(o3dElement, 'mousemove', function (e) {
      drag(e);
  });
  o3djs.event.addEventListener(o3dElement, 'mouseup', function (e) {
    if(!e.shiftKey || e.button == g_o3d.Event.BUTTON_RIGHT){
      stopDragging(e);
    }

  });
}
/**
 * Removes any callbacks so they not called after the page has unloaded.
 */
function uninit() {
  if (g_client) {
    g_client.cleanup();
  }
}

function ZoomInOut(zoom) {
  for (i = 0; i < g_eyeView.length; i += 1) {
    g_eyeView[i] = g_eyeView[i] / zoom;
  }

  g_viewInfo.drawContext.view = g_math.matrix4.lookAt(
    g_eyeView, // eye
    [0, 0, 0],   // target
    [0, 1, 0]);  // up
}




/**
 * Using the mouse wheel zoom in and out of the model.
 * @param {event} e event.
 */
function scrollMe(e) {
  var zoom = (e.deltaY < 0) ? 1 / g_zoomFactor : g_zoomFactor ;
  ZoomInOut(zoom);
  g_client.render();
}


jQuery(function () { init();

		     window.onunload =  uninit;
		     window.document.onkeypress = keyPressedCallback;

		   });


