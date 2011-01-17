function BrainCanvas(canvas) {
  var that  = this;
  var context = canvas.getContext("2d");
  
  var loader = new Loader();
  
  var spectrum = loader.loadSpectrumFromUrl("/spectrum/gray_scale.txt");
 

  this.init = function() {
  };

  this.openFile =function(filename) {
    this.current_minc = new Minc(filename, null,function(minc,extraArgs){
				var height = minc.xspace.height+minc.yspace.height+minc.zspace.height;
				var length = Math.max(minc.xspace.length,minc.yspace.length,minc.zspace.length);
				   
			       that.initCanvas(length,height);
			       that.showMinc(minc);
			     ;});
  };

  this.initCanvas = function(width,heigth) {
   canvas.width = width;
   canvas.height = heigth;
   context.fillColor = "#0000ff";
   context.fillRect(0,0,width,heigth);
   
  };
  
  this.showMinc=function(minc){
    $("#mincinfo").append("Minc Information: <br>"+
			  "order: "+ minc.order +
			  "<br>xspace.height: " + minc.xspace.height + " yspace.height: " + minc.yspace.height + " zspace.height: " + minc.zspace.height + 
			  "<br> xspace.length: " + minc.xspace.length + " yspace.length: " + minc.yspace.length + " zspace.length: " + minc.zspace.length);
    var xslice = minc.slice('xspace',100);
    var xslice_image_data = context.createImageData(minc.xspace.length,minc.xspace.height);
    xslice_image_data.data = createColorMap(spectrum,xslice_image_data.data,xslice,minc.min,minc.max);
    context.putImageData(xslice_image_data,0,0);
    var yslice = minc.slice('yspace',150);
    var yslice_image_data = context.createImageData(minc.yspace.length,minc.yspace.height);
    yslice_image_data.data = createColorMap(spectrum,yslice_image_data.data,yslice,minc.min,minc.max);
    context.putImageData(yslice_image_data,0,minc.xspace.height);
    var zslice = minc.slice('zspace',100);
    var zslice_image_data = context.createImageData(minc.zspace.length,minc.zspace.height);
    zslice_image_data.data = createColorMap(spectrum,zslice_image_data.data,zslice,minc.min,minc.max);
    context.putImageData(zslice_image_data,0,minc.xspace.height+minc.yspace.height);


    
   alert("Typeof xlsice: " + typeof xslice + " Lenght of xslice: " + xslice.length + " xslice max: " + minc.max + " xslice.min: " + minc.min + " xslice[5000]: " + xslice[5000] + " xslice[20000]: " + xslice[20000] + " xslice_image_data.data[10000*4]: "   + " " + xslice_image_data.data[2] );
    
    //var yslice = Minc.slice('yspace',1);
    //var zslice = Minc.slice('zspace',1);

  };

};
