function BrainCanvas(canvas) {
  var that  = this;
  var context = canvas.getContext("2d");
  var loader = new Loader();
  
  var cursor = {
    x: [0,0],
    y: [0,0],
    z: [0,0]
  };
  
  var spectrum = loader.loadSpectrumFromUrl("/spectrum/spectral.txt");
   
  this.initCanvas = function(width,heigth) {
    canvas.width = width;
    canvas.height = heigth;
    
    context.fillStyle = "#000000";
    context.fillRect(0,0,width,heigth);

  
  };
 
  
  this.update_space = function(axis, number, minc,time) {
    var slice = minc.slice(axis,number,time);
    var slice_image_data = context.createImageData(minc[axis].length,minc[axis].height);
    slice_image_data.data = createColorMap(spectrum,slice_image_data.data,slice,minc.min,minc.max,true);

    return slice_image_data;
  };

  function drawCrosshair(x,y) {
    context.fillStyle = "#FF0000";
    context.fillRect(x-2,y-2,4,4);
  };

  this.updateXSpace = function(number,minc,time) {
    that.x_slice_number = number;
    var xslice_image_data = that.update_space("xspace", number,minc,time);
    context.putImageData(xslice_image_data,0,0);  

  };

  this.updateYSpace = function(number,minc,time) {
    that.y_slice_number = number;
    var yslice_image_data = that.update_space("yspace", number,minc,time);

    context.putImageData(yslice_image_data,0,minc.xspace.height);   
    
  };
  
  this.updateZSpace = function(number,minc,time) {
    that.z_slice_number = number;
    var zslice_image_data = that.update_space("zspace", number,minc,time);
    context.putImageData(zslice_image_data,0,minc.xspace.height+minc.yspace.height);    

  };

  this.updateSlices = function(event,time){
    if(event) {
      var slice_numbers = that.getSliceNumbersFromPosition(getCursorPosition(event));      
    }else {
      var slice_numbers = {
	x: that.x_slice_number,
	y: that.y_slice_number,
	z: that.z_slice_number
      }      
    }
    //clear canvas
    that.initCanvas(canvas.width, canvas.height);    

    //insert slices
    that.updateXSpace(slice_numbers.x,that.current_minc,time);
    that.updateYSpace(slice_numbers.y,that.current_minc,time);    
    that.updateZSpace(slice_numbers.z,that.current_minc,time);


    //draw x or square whatever 
    drawCrosshair(that.y_slice_number,that.z_slice_number);
    drawCrosshair(that.x_slice_number,that.z_slice_number+that.current_minc.xspace.height);
    drawCrosshair(that.y_slice_number,that.x_slice_number+that.current_minc.xspace.height+that.current_minc.yspace.height);    

  };

  this.showMinc=function(minc){
    $(canvas).siblings("#mincinfo").append("Minc Information: <br>"+
			  "order: "+ minc.order +
			  "<br>xspace.height: " + minc.xspace.height + " yspace.height: " + minc.yspace.height + " zspace.height: " + minc.zspace.height + 
			  "<br> xspace.length: " + minc.xspace.length + " yspace.length: " + minc.yspace.length + " zspace.length: " + minc.zspace.length);
    

    that.x_slice_number = 100;
    that.y_slice_number = 100;
    that.z_slice_number = 100;
    that.updateXSpace(that.x_slice_number,minc);
    that.updateYSpace(that.y_slice_number,minc);
    that.updateZSpace(that.z_slice_number,minc);

    drawCrosshair(that.y_slice_number,that.x_slice_number);
    drawCrosshair(that.x_slice_number,that.z_slice_number+that.current_minc.xspace.height);
    drawCrosshair(that.y_slice_number,that.x_slice_number+that.current_minc.xspace.height+that.current_minc.yspace.height);    
   //alert("Typeof xlsice: " + typeof xslice + " Lenght of xslice: " + xslice.length + " xslice max: " + minc.max + " xslice.min: " + minc.min + " xslice[5000]: " + xslice[5000] + " xslice[20000]: " + xslice[20000] + " xslice_image_data.data[10000*4]: "   + " " + xslice_image_data.data[2] );
    
    //var yslice = Minc.slice('yspace',1);
    //var zslice = Minc.slice('zspace',1);

  };

  function getCursorPosition(e){
    var x;
    var y;
    if (e.pageX != undefined && e.pageY != undefined) {
	x = e.pageX;
	y = e.pageY;
    }
    else {
	x = e.clientX + document.body.scrollLeft +
            document.documentElement.scrollLeft;
	y = e.clientY + document.body.scrollTop +
            document.documentElement.scrollTop;
    }
    
    
    x -= canvas.offsetLeft;
    y -= canvas.offsetTop;
    
    return {x: x,y: y};
  }
  

  this.getSliceNumbersFromPosition = function(position){
    that.position = position;
    if(position.y < that.current_minc.xspace.height) {
      return {
	x: that.x_slice_number,
	y: position.x,
	z: position.y
      };
    }else if(position.y < that.current_minc.xspace.height + that.current_minc.yspace.height){
      return {
	x: position.x,
	y: that.y_slice_number,
	z: position.y -  that.current_minc.xspace.height
      };
    }else {
      return {
	x: position.y - that.current_minc.xspace.height - that.current_minc.yspace.height,
	y: position.x,
	z: that.z_slice_number
      };
    };
  };

  

  
  this.addListeners = function() {
    canvas.onmousedown = function(event) {
      that.drag = true;
    };
    
    canvas.onmouseup = function(event) {
      that.drag = false;
    };
    

    canvas.onmousemove = function(event) {
      if(that.drag){
	that.updateSlices(event);	
      }
    };
  };

  this.showTime = function() {
    var div = $(canvas).parent();
    $("<input type='text' name='time' value=\"0\" size=4>").appendTo(div);
    $("<div id=\"time-slider\" width=\""+canvas.width+"\" + height=\"10\"></div>").slider({
						  value: 0,
						  min: 0,
						  max: that.current_minc.time.space_length,
						  step: 1,
	                                          slide: function(event,ui) {
					           that.updateSlices(null,ui.value);	    
						  }
						}).appendTo(div);
  };

  this.openFile =function(filename) {
    this.current_minc = new Minc(filename, null,function(minc,extraArgs){
				   var height = minc.xspace.height+minc.yspace.height+minc.zspace.height;
				   var length = Math.max(minc.xspace.length,minc.yspace.length,minc.zspace.length);
				   
				   that.initCanvas(length,height);
				   that.showMinc(minc);
				   that.addListeners();
				   if(minc.time) {
				     that.showTime();
				   }
				   ;});
  };





};
