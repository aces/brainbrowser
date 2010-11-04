/*
 * MindFrame is a library of functions usefull for developing WebGL apps for
 * Scientific applications
 *
 */
o3djs.base.o3d = o3d;
o3djs.require('o3djs.webgl');
o3djs.require('o3djs.math');
o3djs.require('o3djs.rendergraph');

o3djs.require('o3djs.arcball');
//Some quick utilities (should be move to a special js file) BEHOLD THEIR AWESOMENESS
Array.prototype.min = function() {
  var increment = 50000;
  if(this.length > increment){
    var reduced_array = [];
    for(var i=0;i<this.length;i+=increment) {
      reduced_array.push(Math.min.apply(Math, this.slice(i,i+increment-1)));
    }
  }else {
    return Math.min.apply(Math, this);
  }
  return reduced_array.min();

};
Array.prototype.max = function(array) {
  var increment = 50000;
  if(this.length > increment){
    var reduced_array = [];
    for(var i=0;i<this.length;i+=increment) {
      reduced_array.push(Math.max.apply(Math, this.slice(i,i+increment-1)));
    }
  }else {
    return Math.max.apply(Math, this);
  }
  return reduced_array.max();
};

function MindFrame() {
  var that = this;

  this.init = function() {
    o3djs.webgl.makeClients(initStep2);
  };

  this.uninit = function() {
    if(that.client) {
      that.client.cleanup();
    }
  };

  function initStep2(clientElements) {

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
      nearPlane: 1
    };
    o3djs.base.init(o3dElement);
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
      that.math.degToRad(50), // 50 degree fov.
      that.client.width / that.client.height,
      0.1,                  // Near plane.
      5000);              // Far plane.

    // Set up our view transformation to look towards the world origin
    // where the brain is located.
    that.eyeView = [0,0,2000];
    viewInfo.drawContext.view = that.math.matrix4.lookAt(
      that.eyeView, // eye
      [0, 0, 0],  // target
      [0, 1, 0]); // up

    that.viewInfo = viewInfo;

    //Used for rotating the shapes
    that.aball = o3djs.arcball.create(100, 100);

    //This method is called on every render
    that.client.setRenderCallback(that.renderCallback);

    //events
    o3djs.event.addEventListener(that.o3dElement, 'wheel', that.scrollMe);


    if(that.afterInit !=null){
      //call the display callback which will create shapes
      //display must be defined before calling this function
      that.afterInit(that);
    }else {
      alert("no afterInit");
    }
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

  this.updateProjection = function() {

    // Create a perspective projection matrix.
    that.viewInfo.drawContext.projection = that.math.matrix4.perspective(
      that.math.degToRad(45), that.o3dWidth / that.o3dHeight, that.camera.nearPlane,
      that.camera.farPlane);

  };


  this.renderCallback = function() {
    that.setClientSize();
  };

  /*
   * Creates a 3D hypercube of points
   */
  this.create3DVolume = function(params){

    //Build a 3 dimensional volume filled with vertices

    var x0=params.order[0];
    var x1=params.order[1];
    var x2=params.order[2];

    //We don't know the order of the axis
    var x0_length =  parseInt(params[x0].space_length);
    var x1_length =  parseInt(params[x1].space_length);
    var x2_length =  parseInt(params[x2].space_length);

    //create array of undefined values
    var positionArray = new Array(x0_length*x1_length*x2_length*3);

    var x0_start = parseFloat(params[x0].start);
    var x1_start = parseFloat(params[x1].start);
    var x2_start = parseFloat(params[x2].start);

    var x0_end = x0_start + x0_length;
    var x1_end = x1_start + x1_length;
    var x2_end = x2_start + x2_length;

    var x0_offset = (x0_start + x0_end)/2;
    var x1_offset = (x1_start + x1_end)/2;
    var x2_offset = (x2_start + x2_end)/2;

    var x0_first = x0_start - x0_offset;
    var x1_first = x1_start - x1_offset;
    var x2_first = x2_start - x2_offset;



    var z = 0;
    for(var i = 0; i< x0_length; i++) {
      for(var k = 0; k < x1_length; k++ ) {
	for(var j = 0; j < x2_length; j++ ) {
	  positionArray[z]   = x0_first + i;
	  positionArray[z+1] = x1_first + j;
	  positionArray[z+2] = x2_first + k;
	  z+=3;
	}
      }
    }

    return positionArray;
  };

  /*
   * Creates a shape from a model and material.
   * Ex: mni obj file, Volume from minc file
   */
  this.createShape = function(type,positionArray,indexArray,colorArray,normalArray,material,transform,name) {
    var shape = that.pack.createObject('Shape');
    var primitive = that.pack.createObject('Primitive');
    var streamBank = that.pack.createObject('StreamBank');

    primitive.material = material;
    primitive.owner = shape;
    primitive.streamBank = streamBank;
    shape.name = name;

    if(type) {
      primitive.primitiveType = type;
    }else {
      primitive.primitiveType = that.o3d.Primitive.TRIANGLELIST;
    }

    shape.createDrawElements(that.pack, null);
    transform.addShape(shape);
    var state = that.pack.createObject('State');

    //create Position buffer (vertices) and set the number of vertices global variable
    var positionsBuffer = that.pack.createObject('VertexBuffer');
    var positionsField = positionsBuffer.createField('FloatField', 3);
    if(!positionArray) {
      alert("PositionArray nil");
      return false;
    }
    positionsBuffer.set(positionArray);
    that.numberVertices = positionArray.length/3;
    primitive.numberVertices = that.numberVertices;
    streamBank.setVertexStream(
      that.o3d.Stream.POSITION, //  That stream stores vertex positions
      0,                     // First (and only) position stream
      positionsField,        // field: the field that stream uses.
      0);                    // start_index:




    //create indexBuffer and make sure number of primitive is set OPTIONAL
    if(indexArray != null) {

      var indexBuffer = that.pack.createObject('IndexBuffer');
      indexBuffer.set(indexArray);
      primitive.indexBuffer = indexBuffer;
    }
    //if(type == that.o3d.Primitive.POINTLIST) {
      primitive.numberPrimitives = positionArray.length/3;
    //}

    positionArray = [];
    //Create normal buffer OPTIONAL
    if(normalArray != null) {
      var normalBuffer = that.pack.createObject('VertexBuffer');
      var normalField = normalBuffer.createField('FloatField', 3);
      normalBuffer.set(normalArray);
      streamBank.setVertexStream(
	that.o3d.Stream.NORMAL,
	0,
	normalField,
	0);
    }


    //Create colorBuffer from base color of model OPTIONAL
    if(colorArray !=null) {
      var colorBuffer = that.pack.createObject('VertexBuffer');
      var colorField = colorBuffer.createField('FloatField', 4);
      colorBuffer.set(colorArray);
      streamBank.setVertexStream(
	that.o3d.Stream.COLOR,
	0,
	colorField,
	0);
    };




    if(that.loading){
      jQuery(that.loading).html("Buffers Loaded");
    }
    return shape;
  };

  this.createMaterial = function(url,callback) {
    // Create an Effect object and initialize it using the shaders
    // from a file on the server through an ajax request.
    var effect = that.pack.createObject('Effect');
    var shaderString;
    jQuery.ajax({ type: 'GET',
      url: url,
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
    var material = that.pack.createObject('Material');



    // Set the material's drawList.
    material.drawList = that.viewInfo.performanceDrawList;

    // Apply our effect to that material. The effect tells the 3D
    // hardware which shaders to use.
    material.effect = effect;

    effect.createUniformParameters(material);

    if(callback !=null) {
      callback(material);
    }

    return material;

  };

  this.loadSpectrum = function(url) {
    var spectrum;
    $.ajax({
      url: url,
      async: false, //this shouldn't take long
      dataType: 'text',
      success: function(data){
	spectrum = new Spectrum(data);
      },
      error: function(request, textStatus) {
	throw {
	  request: request,
	  textStatus: textStatus
	};
      }

    });
    return spectrum;
  };

  /*
   * This create a color map for each value in the values array
   * This can be slow and memory intensive for large arrays
   */
  this.createColorMap = function(spectrum,values,min,max) {

    var colorArray = new Array();

    //calculate a slice of the data per color
    var increment = ((max-min)+(max-min)/spectrum.length)/spectrum.length;
    //for each value, assign a color
    for(var i=0; i<values.length; i++) {
      if(values[i]<= min ) {
	var color_index = 0;
      }else if(values[i]> max){
	var color_index = spectrum.length-1;
      }else {
	var color_index = parseInt((values[i]-min)/increment);
      }
      //This inserts the RGBA values (R,G,B,A) independently
      colorArray.push.apply(colorArray,spectrum[color_index]);
    }
    return colorArray;


  };

  /*
   * Zoom features
   */
  that.zoomFactor = 1.10;
  // The following methods implement the zoom in and out
  that.ZoomInOut = function(zoom) {
    for (var i = 0; i < that.eyeView.length; i += 1) {
      that.eyeView[i] = that.eyeView[i] / zoom;
    }

    that.viewInfo.drawContext.view = that.math.matrix4.lookAt(
      that.eyeView, // eye
      [0, 0, 0],   // target
      [0, 1, 0]);  // up
  };

  //Using the mouse wheel zoom in and out of the model.
  that.scrollMe = function(e) {
    var zoom = (e.deltaY < 0) ? 1 / that.zoomFactor : that.zoomFactor ;
    that.ZoomInOut(zoom);
    that.client.render();
  };


  /*
   * Rotation with drag features
   */
  that.dragging = false;

  //start dragging
  that.startDragging = function(e) {
    that.lastRot = that.thatRot;
    that.aball.click([e.x, e.y]);
    that.dragging = true;
  };

  //while dragging
  that.drag = function(e) {

    if (that.dragging) {

      var rotationQuat = that.aball.drag([e.x, e.y]);
      var rot_mat = that.quaternions.quaternionToRotation(rotationQuat);
      that.thatRot = that.math.matrix4.mul(that.lastRot, rot_mat);
      var m = that.rotationTransform.localMatrix;
      that.math.matrix4.setUpper3x3(m, that.thatRot);
      that.rotationTransform.localMatrix = m;

    }


  };



  that.stopDragging = function(e) {
    that.dragging = false;
  };



};
