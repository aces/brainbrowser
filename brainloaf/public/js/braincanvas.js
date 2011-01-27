function BrainCanvas(canvas) {
  var that  = this;
  var context = canvas.getContext("2d");
  
  var loader = new Loader();
  
  var spectrum = loader.loadSpectrumFromUrl("/spectrum/spectral.txt");
 

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
 
  
  this.update_space = function(axis, number, minc) {
    var slice = minc.slice(axis,number);
    var slice_image_data = context.createImageData(minc[axis].length,minc[axis].height);
    slice_image_data.data = createColorMap(spectrum,slice_image_data.data,slice,minc.min,minc.max);

    return slice_image_data;
  };

  this.update_xspace = function(number,minc) {
    var xslice_image_data = that.update_space("xspace", number,minc);
    context.putImageData(xslice_image_data,0,0);
  };

  this.update_yspace = function(number,minc) {
    var yslice_image_data = that.update_space("yspace", number,minc);
    context.putImageData(yslice_image_data,0,minc.xspace.height);    
  };
  
  this.update_zspace = function(number,minc) {
    var zslice_image_data = that.update_space("zspace", number,minc);
    context.putImageData(zslice_image_data,0,minc.xspace.height+minc.yspace.height);    
  };

 
  this.showMinc=function(minc){
    $(canvas).siblings("#mincinfo").append("Minc Information: <br>"+
			  "order: "+ minc.order +
			  "<br>xspace.height: " + minc.xspace.height + " yspace.height: " + minc.yspace.height + " zspace.height: " + minc.zspace.height + 
			  "<br> xspace.length: " + minc.xspace.length + " yspace.length: " + minc.yspace.length + " zspace.length: " + minc.zspace.length);
    
    that.update_xspace(100,minc);
    that.update_yspace(100,minc);
    that.update_zspace(100,minc);


    
   //alert("Typeof xlsice: " + typeof xslice + " Lenght of xslice: " + xslice.length + " xslice max: " + minc.max + " xslice.min: " + minc.min + " xslice[5000]: " + xslice[5000] + " xslice[20000]: " + xslice[20000] + " xslice_image_data.data[10000*4]: "   + " " + xslice_image_data.data[2] );
    
    //var yslice = Minc.slice('yspace',1);
    //var zslice = Minc.slice('zspace',1);

  };

};
