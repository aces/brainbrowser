//WebGL version of Macacc

//Global Variables
var g_model_data;
var g_data_set = new DataSet();


function preload_model()  {
  jQuery.ajax({ type: 'GET',
    url: '/models/surf_reg_model_both.obj' ,
    dataType: 'text',
    success: function(data) {
      g_model_data = new MNIObject(data);
      init();
    },
    error: function(request,textStatus,e) {
      alert("Failure: " +  textStatus);
    },
    data: {},
    async: true,
    timeout: 100000
  });
};


function webGLStart() {
  var canvas = jQuery("#BrainBrowser");
  initGL(canvas);
  initShader();
  initBuffers();

  gl.clearColor(0.0,0.0,0.0,1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);


  setInterval(drawScene, 15);

}

function initBuffers(){
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new WebGLFloatArray(g_model_data.positionArray),gl.STATIC_DRAW);
  positionBuffer.itemSize=3;
  positionBuffer.numItems=g_model_data.numberVertices;
}

function drawScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  perspective(45,1.0,0.1,500.0);
  loadIdentity();
}