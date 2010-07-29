/*
 * Creates the BrainBrowser viewer using the direct WebGL API
 */
var ctx;
function BrainBrowser(canvas) {
  var that = this;

  that.canvas = canvas;
  ctx = WebGLDebugUtils.makeDebugContext(canvas.getContext("experimental-webgl"));
  this.setup = function(url) {
    that.preload_data(url,that.init);
  };




  that.init = function() {
    that.initGL(that.canvas);
    that.initShaders();
    that.initBuffers();


    that.gl.clearColor(0.0, 0.0, 0.0, 1.0);

    that.gl.clearDepth(1.0);

    that.gl.enable(that.gl.DEPTH_TEST);
    that.gl.depthFunc(that.gl.LEQUAL);

    setInterval(that.drawScene, 15);
  };

 this.preload_data = function (url,callback) {
    jQuery.ajax({ type: 'GET',
      url: url ,
      dataType: 'text',
      success: function(data) {
	that.model_data = new MNIObject(data);
	callback();
      },
      error: function(request,textStatus,e) {
	alert("Failure: " +  textStatus);
      },
      data: {},
      async: true,
      timeout: 100000
    });

  }

  //Initialize the canvas
  this.initGL = function(canvas) {
    that.canvas = canvas;
    if(!canvas){
      return -1;
    }
    try {
      that.gl = canvas.getContext("experimental-webgl");
      that.gl.viewportWidth = canvas.width;
      that.gl.viewportHeight = canvas.height;
    }catch(e) {
      alert(e);
    }

    if(!that.gl) {
      alert("error initializing webgl");
    }
    return 0;

  };

  /*
   * Gets the GLSL shader code at url
   */
  function getShaderString(url) {

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
      async: false, //simplifies the flow a bit, performance penality is minimal and the
                   // program can't run if the shaders aren't initialized.
      timeout: 10000
    });

    return shaderString;

  }
  //initialize the blinnphong shader used.
  this. initShaders = function() {

    //Split the string in vertex and fragment shader code
    var shaders = getShaderString('/webgl/shaders/blinnphong2.txt').split("// #o3d SplitMarker");

    //compile the shaders
    var vertexShader = that.gl.createShader(that.gl.VERTEX_SHADER);
    var fragmentShader = that.gl.createShader(that.gl.FRAGMENT_SHADER);
    that.gl.shaderSource(vertexShader,shaders[0]);
    that.gl.shaderSource(fragmentShader,shaders[1]);
    that.gl.compileShader(vertexShader);
    that.gl.compileShader(fragmentShader);


    that.shaderProgram = that.gl.createProgram();
    that.gl.attachShader(that.shaderProgram, vertexShader);
    that.gl.attachShader(that.shaderProgram, fragmentShader);
    that.gl.linkProgram(that.shaderProgram);

    if(!that.gl.getProgramParameter(that.shaderProgram, that.gl.LINK_STATUS)) {
      alert("Could not initialize shaders");
    }

    that.gl.useProgram(that.shaderProgram);
    that.shaderProgram.light_pos_param = that.gl.getAttribLocation(that.shaderProgram, "lightWorlPos");
    that.shaderProgram.light_ambient_param = that.gl.getAttribLocation(that.shaderProgram, "ambient");
    that.shaderProgram.light_diffuse_param = that.gl.getAttribLocation(that.shaderProgram, "diffuse");
    that.shaderProgram.light_ambientIntensity_param = that.gl.getAttribLocation(that.shaderProgram, "ambientIntensity");
    that.shaderProgram.light_specular_param = that.gl.getAttribLocation(that.shaderProgram, "specular");
    that.shaderProgram.light_emissive_param = that.gl.getAttribLocation(that.shaderProgram, "eimissive");
    that.shaderProgram.light_colorMult_param = that.gl.getAttribLocation(that.shaderProgram, "colorMult");

    that.shaderProgram.light_ambient_param.value = [0.04, 0.04, 0.04, 1];
    that.shaderProgram.light_diffuse_param.value = [0.5,0.5,0.7,1];
    that.shaderProgram.light_ambientIntensity_param.value = [1, 1, 1, 1];
    //that.shaderProgram.light_lightIntensity_param.value = [0.8, 0.8, 0.8, 1];
    that.shaderProgram.light_specular_param.value = [0.5, 0.5, 0.5, 1];
    that.shaderProgram.light_emissive_param.value = [0, 0, 0, 1];
    that.shaderProgram.light_colorMult_param.value = [1, 1, 1, 1];

    // Shininess of the myMaterial (for specular lighting)
    that.shaderProgram.shininess_param = that.gl.getAttribLocation(that.shaderProgram, "shininess");
    that.shaderProgram.shininess_param.value = 30.0;

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




  that.initBuffers = function() {
      var left = unIndexModel(that.model_data.left);

      var right = unIndexModel(that.model_data.right);
    
      that.leftVertexPositionBuffer  = that.gl.createBuffer();
      that.gl.bufferData(that.gl.ARRAY_BUFFER, new WebGLFloatArray(left.positionArray),
			 that.gl.STATIC_DRAW);
      that.leftVertexPositionBuffer.itemSize = 3;
      that.leftVertexPositionBuffer.numItems = left.positionArray.length/3;

      that.rightVertexPositionBuffer  = that.gl.createBuffer();
      that.gl.bufferData(that.gl.ARRAY_BUFFER, new WebGLFloatArray(right.positionArray),
			 that.gl.STATIC_DRAW);
      that.rightVertexPositionBuffer.itemSize = 3;
      that.rightVertexPositionBuffer.numItems = right.positionArray.length/3;


  };
  that.drawScene = function() {
    that.gl.viewport(0,0,that.gl.viewportWidth, that.gl.viewportHeight);
    that.gl.clear(that.gl.COLOR_BUFFER_BIT | that.gl.DEPTH_BUFFER_BIT);

    //perspective(45, that.gl.viewportWidth / that.gl.viewportHeight, 0.1, 100.0);


    that.gl.bindBuffer(that.gl.ARRAY_BUFFER, that.leftVertexPositionBuffer);
    that.gl.drawArrays(that.gl.TRIANGLES, 0, that.leftVertexPositionBuffer.numItems);
    that.gl.bindBuffer(that.gl.ARRAY_BUFFER, that.rightVertexPositionBuffer);
    that.gl.drawArrays(that.gl.TRIANGLES, 0, that.rightVertexPositionBuffer.numItems);

  };

};


var brainbrowser;
jQuery(function () {
  jQuery("<canvas id=\"brainbrowser\" style=\"width: 100%; height: 100%\"></canvas>").appendTo("#o3d");
  var canvas = document.getElementById("brainbrowser");
  brainbrowser = new BrainBrowser(canvas);
  brainbrowser.setup('/models/surf_reg_model_both.obj');
});


