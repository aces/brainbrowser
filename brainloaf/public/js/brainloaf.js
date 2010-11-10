function BrainLoaf(filename) {
  var that = this;
  that.mindframe = new MindFrame();

  this.init = function(filename) {
    var params = that.loadParams(filename); //this is a sync fetch

    //Load the data(async) and once ready and parsed
    //run the setup.
    that.setup(params);

  };

  //Loads the file display parameters
  this.loadParams = function(filename) {
    var params = {};
    $.ajax({
	     url: filename+'/params',
	     async: false, //this shouldn't take long
	     dataType: 'json',
	     success: function(data){
	       params = data;
	     },
	     error: function(request, textStatus) {
	       throw {
		 request: request,
		 textStatus: textStatus
	       };
	     }

	   });
    return params;
  };

  //loads the data and calls parseData on it once it's loaded
  this.loadData = function(that,mindframe,filename,callback,extraArgs) {
     $.ajax( {
     	      url: filename+'/content',
     	      async: true,
     	      dataType: 'text',
     	      success: function(data) {
     		var dataArray = that.parseData(data);

     		callback(mindframe,dataArray,extraArgs);
     	      },
     	      error: function(request,textStatus) {
     	       throw {
     		 request: request,
     		 textStatus: textStatus
     	       };

     	      }
     	    });



  };

  //Create the volume/transform/color map
  this.setup = function(params) {
    //Creating the volume to display after init

    var brainloaf=that;
    that.mindframe.afterInit = function(that) {

      function materialArgsSetup(myMaterial) {
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

      }
      var url = "/shaders/dumb.txt";
      var material = that.createMaterial(url,null);
      //setup material option here



      that.mainTransform = that.pack.createObject('Transform');
      that.mainTransform.parent = that.client.root;

      /*
       * Turn on the rotation events
       *
       */

      //sets what will be rotated with drag event
      that.rotationTransform = that.mainTransform;
      o3djs.event.addEventListener(that.o3dElement, 'mousedown', that.startDragging);
      o3djs.event.addEventListener(that.o3dElement, 'mousemove', that.drag);
      o3djs.event.addEventListener(that.o3dElement, 'mouseup', that.stopDragging);



      var positionArray = that.create3DVolume(params); //positionArray

      var shape = that.createShape(that.o3d.Primitive.POINTLIST,
				   positionArray,
				   null, //index array
				   //below is the colorArray
				   null,
				   null, //normal array
				   material, //material
				   that.mainTransform, //transform
				   'volume'); //name
      that.mainTransform.visible = false;

      brainloaf.loadData(brainloaf,that,filename,brainloaf.applyColors,shape);
    };


    that.mindframe.init();
  };

  that.applyColors =function(mindframe,data,shape) {


    var spectrum = mindframe.loadSpectrum('/spectrum/gray_scale.txt');
    var colorArray = mindframe.createColorMap(spectrum, //spectrum
      data.values, //values
      50000, //min (precomputed)
      data.max); //max (precomputed)


    var streamBank = shape.elements[0].streamBank;

    var colorBuffer = mindframe.pack.createObject('VertexBuffer');
    var colorField = colorBuffer.createField('FloatField', 4);
    colorBuffer.set(colorArray);

    streamBank.setVertexStream(
      mindframe.o3d.Stream.COLOR,
      0,
      colorField,
      0);
    
    mindframe.mainTransform.visible = true;
    mindframe.client.render();
    alert("done with colors ColorArray length: " + colorArray.length + " value 5000: " + colorArray[6524] + "dataMinVal = " + data.minVal + " dataMaxVal:" +  data.maxVal );

  };


  //Parses the data and returns an array
  this.parseData = function(data_string) {

    data_string = data_string.replace(/\s+$/, '');
    data_string = data_string.replace(/^\s+/, '');
    var data = data_string.split(/\s+/);
    data_string = "";
    for(var i = 0; i < data.length; i++) {
      data[i]=parseInt(data[i]);
    }

    data = new Uint16Array(data);
    //Why waste time, 16bit values ;p
    return {values: data, min: 0, max: 65535};
  };


  if(filename) {
    this.init(filename);
  }


}

$( function() {
  var brainloaf = new BrainLoaf('/data/test.mnc');
});