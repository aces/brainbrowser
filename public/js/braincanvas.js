function BrainCanvas(xcanvas,ycanvas,zcanvas) {
  var that  = this;
  var xcontext = xcanvas.getContext("2d");
  var ycontext = ycanvas.getContext("2d");
  var zcontext = zcanvas.getContext("2d");


  
  var loader = new Loader();


  //Holds the slice numbers 
  that.slices = {};

  //initial brightness adjustment is 0;
  that.brightness = 0;
  //initial contrast at 1
  that.contrast = 1;

  //the different color specturms. 
  var spectrums = {spectral: loader.loadSpectrumFromUrl("/spectrum/spectral-brainview.txt"),grayscale:  loader.loadSpectrumFromUrl("/spectrum/gray_scale256.txt")};
  var spectrum = spectrums['spectral']; //default spectrum
  
  that.spectrums = spectrums;
 
  //Initialized a canvas and turns it black. 
  this.initCanvas = function(canvas,width,heigth) {
    canvas.width  = width;
    canvas.height = heigth;
    var context   = canvas.getContext("2d");
    context.fillStyle = "#000000";
    context.fillRect(0,0,width,heigth);
  };
 
  
  this.update_space = function(axis,slice_image_data, number, minc,time) {
    var slice = minc.getScaledSlice(axis,number,time);

    //get the area of canvas to insert image into
    //Make sure that area uses the step of the axises
        
    slice_image_data.data = createColorMap(spectrum,slice_image_data.data,slice,minc.min,minc.max,true,that.brightness,that.contrast);

    return slice_image_data;
  };

  function drawCrosshair(context,x,y) {
    context.fillStyle = "#FF0000";
    context.fillRect(x-2,y-2,4,4);
  };

  this.updateXSpace = function(number,minc,time) {
    that.slices.xspace = number;
    var slice_image_data = xcontext.createImageData(
      Math.ceil(Math.abs(minc.yspace.step)*minc.yspace.space_length),
      Math.ceil(Math.abs(minc.zspace.step)*minc.zspace.space_length));

    var xslice_image_data = that.update_space("xspace",slice_image_data, number,minc,time);
    xcontext.putImageData(xslice_image_data,0,0);  
  };

  this.updateYSpace = function(number,minc,time) {
    that.slices.yspace = number;
    var slice_image_data = ycontext.createImageData(
      Math.ceil(Math.abs(minc.xspace.step)*minc.xspace.space_length),
      Math.ceil(Math.abs(minc.zspace.step)*minc.zspace.space_length));

    var yslice_image_data = that.update_space("yspace",slice_image_data, number,minc,time);

    ycontext.putImageData(yslice_image_data,0,0);   
    
  };
  
  this.updateZSpace = function(number,minc,time) {
    that.slices.zspace = number;
    var slice_image_data = zcontext.createImageData(
      Math.ceil(Math.abs(minc.xspace.step)*minc.xspace.space_length),
      Math.ceil(Math.abs(minc.yspace.step)*minc.yspace.space_length));

    var zslice_image_data = that.update_space("zspace",slice_image_data, number,minc,time);
    zcontext.putImageData(zslice_image_data,0,0);

  };

  this.showCrosshairs= function(){
    if(that.current_minc.xspace.step < 0 ) {
      var xheight = (that.current_minc.xspace.space_length - that.slices.xspace)*Math.abs(that.current_minc.yspace.step);
      var xwidth = xheight;
    }else {
      var xheight = that.slices.xspace*Math.abs(that.current_minc.yspace.step);
      var xwidth = xheight;
    }


    if(that.current_minc.yspace.step > 0 ) {
      var yheight = (that.current_minc.yspace.space_length - that.slices.yspace)*Math.abs(that.current_minc.yspace.step);
      var ywidth = that.slices.yspace*Math.abs(that.current_minc.yspace.step);
    }else {
      var yheight = that.slices.yspace*Math.abs(that.current_minc.yspace.step);
      var ywidth = (that.current_minc.yspace.space_length - that.slices.yspace)*Math.abs(that.current_minc.yspace.step);
    }



    if(that.current_minc.zspace.step > 0 ) {
      var zheight = (that.current_minc.zspace.space_length - that.slices.zspace)*Math.abs(that.current_minc.zspace.step);
      var zwidth = zheight;
    }else {
      var zheight = that.slices.zspace*Math.abs(that.current_minc.yspace.step);
      var zwidth = zheight;
    }



    drawCrosshair(xcontext,
		  ywidth,
		  zheight);

    drawCrosshair(ycontext,
		  xwidth,
		  zheight);

    drawCrosshair(zcontext,
		  xwidth,
		  yheight);
  };


  that.showCoordinates = function() {
    $("<div id=\"coordinates\">x:<span id=\"x\"></span> y:<span id=\"y\"></span> z:<span id=\"z\"></span></div>").appendTo($(xcanvas).parent());
  };

  that.updateCoordinates = function(world){
    $(xcanvas).siblings("#coordinates").children("#x").html(world.x);
    $(xcanvas).siblings("#coordinates").children("#y").html(world.y);
    $(xcanvas).siblings("#coordinates").children("#z").html(world.z);
  };


  this.updateSlices = function(event,time){
    that.current_time = time;
    if(event) {
      var slice_numbers = that.getSliceNumbersFromPosition(getCursorPosition(event));      
    }else {
      var slice_numbers = {
	x: that.slices.xspace,
	y: that.slices.yspace,
	z: that.slices.zspace
      };
    }
    //clear canvas
    that.initCanvas(xcanvas,xcanvas.width, xcanvas.height);    
    that.initCanvas(ycanvas,ycanvas.width, ycanvas.height);    
    that.initCanvas(zcanvas,zcanvas.width, zcanvas.height);    

    //insert slices
    that.updateXSpace(slice_numbers.x,that.current_minc,time);
    that.updateYSpace(slice_numbers.y,that.current_minc,time);    
    that.updateZSpace(slice_numbers.z,that.current_minc,time);
    that.showCrosshairs();
    that.updateCoordinates(that.sliceToWorldCoordinates(slice_numbers));
  };
 


  this.showMinc=function(minc){
    $(xcanvas).siblings("#mincinfo").append("Minc Information: <br>"+
			  "order: "+ minc.order +
			  "<br>xspace.height: " + minc.xspace.height + " yspace.height: " + minc.yspace.height + " zspace.height: " + minc.zspace.height + 
			  "<br> xspace.length: " + minc.xspace.length + " yspace.length: " + minc.yspace.length + " zspace.length: " + minc.zspace.length + "xspace step: " + minc.xspace.step + "yspace step: " + minc.yspace.step + "zspace step: " + minc.zspace.step);
    

    that.slices.xspace = parseInt(minc.xspace.length/2);
    that.slices.yspace = parseInt(minc.yspace.length/2);
    that.slices.zspace = parseInt(minc.zspace.length/2);
    that.updateXSpace(that.slices.xspace,minc);
    that.updateYSpace(that.slices.yspace,minc);
    that.updateZSpace(that.slices.zspace,minc);
    
    that.showCrosshairs();
    that.updateCoordinates(minc.xspace.length/2,minc.yspace.length/2,minc.zspace.length/2);
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
    
    
    x -= e.target.offsetLeft;
    y -= e.target.offsetTop;
    y = e.target.height-y;
    return {target: e.target,x: x,y: y};
  }
  
  //Will calculate the location of your click from the screen to the 
  //coordinate of the minc file
  this.sliceToWorldCoordinates = function(slices) {
    var xstart = that.current_minc.xspace.start;
    var xstep = that.current_minc.xspace.step;
    var ystart = that.current_minc.yspace.start;
    var ystep = that.current_minc.yspace.step;
    var zstart = that.current_minc.zspace.start;
    var zstep = that.current_minc.zspace.step;

    return {
      x: xstart+slices.x*xstep,
      y: ystart+slices.y*ystep,
      z: zstart+slices.z*zstep
    };

  };

  this.getSliceNumbersFromPosition = function(position){
    that.position = position;
    if(position.target.id == xcanvas.id) {
      var slices = {
	x: that.slices.xspace,
	y: parseInt(position.x/Math.abs(that.current_minc.xspace.height_space.step)),
	z: parseInt(position.y/Math.abs(that.current_minc.xspace.length_space.step))
      };

      if(that.current_minc.yspace.step < 0 ) {
	slices.y = that.current_minc.yspace.space_length - slices.y;
      }
      if(that.current_minc.zspace.step < 0 ) {
	slices.z = that.current_minc.zspace.space_length - slices.z;
      }


    }else if(position.target.id == ycanvas.id ) {
      var slices = {
	y: that.slices.yspace,
	x: parseInt(position.x/Math.abs(that.current_minc.xspace.step)),
	z: parseInt(position.y/Math.abs(that.current_minc.zspace.step))
      };  
      if(that.current_minc.xspace.step < 0 ) {
	slices.x = that.current_minc.xspace.space_length - slices.x;
      }
      if(that.current_minc.zspace.step < 0 ) {
	slices.z = that.current_minc.zspace.space_length - slices.z;
      }
      
    }else {
      var slices = {
	  z:that.slices.zspace,
	  x:parseInt(position.x/Math.abs(that.current_minc.zspace.length_space.step)),
	  y:parseInt(position.y/Math.abs(that.current_minc.yspace.step))
	};
      if(that.current_minc.xspace.step < 0 ) {
	slices.x = that.current_minc.xspace.space_length - slices.x;
      }
      if(that.current_minc.yspace.step < 0 ) {
	slices.y = that.current_minc.yspace.space_length - slices.y;
      }
      
    }
    

    

    
  
  return slices;  

  };

  

  
  this.addListeners = function(canvas) {
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
  
  //Show time slider for 4D datasets
  this.showTime = function() {
    $("<div id=\"time\">Time Index: </div>").appendTo($(canvas).parent());

    var div = $($(canvas).parent().children("#time"));
    $("<span id=\"time-value\">1</span>").appendTo(div);
    $("<div id=\"time-slider\" width=\""+canvas.width+"\" + height=\"10\"></div>").slider({
						  value: 0,
						  min: 0,
						  max: that.current_minc.time.space_length,
						  step: 1,
	                                          slide: function(event,ui) {
					            that.updateSlices(null,ui.value);	    
						    $(div).children("#time-value").html(ui.value);
						  }
						}).appendTo(div);
  };

  //Brightness slider 
  this.showBrightness = function() {
    $("<div id=\"brightness\">Brightness: </div>").appendTo($(xcanvas).parent());
    var div = $($(xcanvas).parent().children("#brightness"));
    $("<span id=\"brightness-value\">0%</span>").appendTo(div);
    $("<div id=\"brightness-slider\" width=\"100px\" + height=\"10\"></div>").slider({
						  value: 0,
						  min: -1,
						  max:1,	       
                                                  step: .1,
	                                          slide: function(event,ui) {
						    that.brightness = ui.value;
						    that.updateSlices(null,that.current_time);
						    $(div).children("#brightness-value").html(ui.value*100 + "%");
						  }
						}).appendTo(div);
    

  };

 //contrast slider 
 this.showContrast = function() {
    $("<div id=\"contrast\">Contrast: </div>").appendTo($(xcanvas).parent());
    var div = $($(xcanvas).parent().children("#contrast"));
    $("<span id=\"contrast-value\">1</span>").appendTo(div);
    $("<div id=\"contrast-slider\" width=\"100px\" + height=\"10\"></div>").slider({
						  value: 1,
						  min: 1,
						  max:5,	       
                                                  step: .1,
	                                          slide: function(event,ui) {
						    that.contrast = ui.value;
						    that.updateSlices(null,that.current_time);
						    $(div).children("#contrast-value").html(ui.value);
						  }
						}).appendTo(div);
    

  };

  this.changeSpectrum = function(name){
    spectrum = spectrums[name];
    that.updateSlices(null,that.time);
  };
 

  this.showSpectrum=function() {
    $("<div id=\"spectrum\">Color Scale</div>").appendTo($(xcanvas).parent());
    var div = $($(xcanvas).parent().children("#spectrum"));
    $("<select id=\"spectrum-select\">"
      +"<option value=\"spectral\">Spectral</option>"
      +"<option value=\"grayscale\">Gray Scale</option>"
      + "</select>").appendTo(div);
    $(div).children("#spectrum-select").change(function(event){
			    that.changeSpectrum($(event.target).val());
			   });
  };
  //Open a Minc file, initiates the UI elements Basicly the main function. 
  this.openFile =function(filename) {
    this.current_minc = new Minc(filename, null,function(minc,extraArgs){
				   /*
				    * Height and Width of the canvas for each space
				    * 
				    * xspace: height is zspace; width is yspace
				    * yspace: height is zspace; width is xspace
				    * zspace: height is yspace; width is xspace
				    *  
				    */ 
				   var xheight = minc.zspace.space_length*Math.abs(minc.zspace.step);
				   var xwidth  = minc.yspace.space_length*Math.abs(minc.yspace.step);

				   var yheight = minc.zspace.space_length*Math.abs(minc.zspace.step);
				   var ywidth  = minc.xspace.space_length*Math.abs(minc.xspace.step); 

				   var zheight = minc.yspace.space_length*Math.abs(minc.yspace.step);
				   var zwidth  = minc.xspace.space_length*Math.abs(minc.xspace.step);

				   //Initializes the canvas to the right height width, and clears them
				   that.initCanvas(xcanvas,xwidth,xheight);
				   that.initCanvas(ycanvas,ywidth,yheight);
				   that.initCanvas(zcanvas,zwidth,zheight);
				   
				   that.showCoordinates();
				   that.showMinc(minc);
				   that.showBrightness();
				   that.showContrast();
				   
				  
				   that.addListeners(xcanvas);
				   that.addListeners(ycanvas);
				   that.addListeners(zcanvas);

                                   that.showSpectrum();

				   if(minc.time) {
				     that.showTime();
				   }
				   
				   ;});
  };


};


