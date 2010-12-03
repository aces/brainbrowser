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
		mindframe.worker.addEventListener('message', function(e) {
	          alert("done");
	          callback(mindframe,e.data,extraArgs);
						  }, false);

		mindframe.worker.postMessage({'cmd': 'parseMinc','string': data});
     	      },
     	      error: function(request,textStatus) {
     	       throw {
     		 request: request,
     		 textStatus: textStatus
     	       };

     	      }
     	    });



  };

  that.materialArgsSetup = function(material) {
    // Light position
    var isovalue = material.getParam('isovalue');
    isovalue.value = parseFloat(jQuery("#isovalue").val());
    return material;
  };


  //Create the volume/transform/color map
  this.setup = function(params) {
    //Creating the volume to display after init

    var brainloaf=that;
    that.mindframe.afterInit = function(that) {

      var url = "/shaders/dumb.txt";
      var material = that.createMaterial(url, brainloaf.materialArgsSetup);



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
				   null, //color Array
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


        that.worker.addEventListener('message', 
    function(e) {

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
      
      that.shape = shape;
      that.colorArray = colorArray;
    },false);

    var colorArray = mindframe.worker.postMessage({'cmd': 'createColorMap',
						   'spectrum': spectrum, //spectrum
						   'values': data.values, //values
						   'min':50000, //min (precomputed)
						   'max':data.max}); //max (precomputed)

  };
  
  
  
  
  this.changeIsovalue = function() {
     var material = that.shape.elements[0].material;
     that.materialArgsSetup(material);
  };

  if(filename) {
    this.init(filename);
  }

}

$( function() {
  var brainloaf = new BrainLoaf('/data/test.mnc');
  jQuery("#isovalue").change(brainloaf.changeIsovalue);
     
});