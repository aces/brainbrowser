function BrainCanvas(canvas) {
  var that  = this;
  var context = canvas.getContext("2d");
  var loader = new Loader();

  var cursor = {
    x: [0,0],
    y: [0,0],
    z: [0,0]
  };
  //Holds the slice numbers 
  that.slices = {};

  //initial brightness adjustment is 0;
  that.brightness = 0;
  //initial contrast at 1
  that.contrast = 1;

  //the different color specturms. 
  var spectrums = {spectral: loader.loadSpectrumFromUrl("/spectrum/spectral.txt"),grayscale:  loader.loadSpectrumFromUrl("/spectrum/gray_scale256.txt")};
  var spectrum = spectrums['spectral']; //default spectrum
  

 
  //Initialized a canvas and turns it black. 
  this.initCanvas = function(width,heigth) {
    canvas.width = width;
    canvas.height = heigth;
    
    context.fillStyle = "#000000";
    context.fillRect(0,0,width,heigth);

  
  };
 
  
  this.update_space = function(axis, number, minc,time) {
    var slice = minc.getScaledSlice(axis,number,time);

    //get the area of canvas to insert image into
    //Make sure that area uses the step of the axises
    var slice_image_data = context.createImageData(
      minc[axis].length*Math.abs(minc[minc[axis].length_space].step),
      minc[axis].height*Math.abs(minc[minc[axis].height_space].step));
    
    slice_image_data.data = createColorMap(spectrum,slice_image_data.data,slice,minc.min,minc.max,true,that.brightness,that.contrast);

    return slice_image_data;
  };

  function drawCrosshair(x,y) {
    context.fillStyle = "#FF0000";
    context.fillRect(x-2,y-2,4,4);
  };

  this.updateXSpace = function(number,minc,time) {
    that.slices.xspace = number;
    var xslice_image_data = that.update_space("xspace", number,minc,time);
    context.putImageData(xslice_image_data,0,0);  
  };

  this.updateYSpace = function(number,minc,time) {
    that.slices.yspace = number;
    var yslice_image_data = that.update_space("yspace", number,minc,time);

    context.putImageData(yslice_image_data,0,parseInt(minc.xspace.height*Math.abs(minc[minc.xspace.height_space].step)));   
    
  };
  
  this.updateZSpace = function(number,minc,time) {
    that.slices.zspace = number;
    var zslice_image_data = that.update_space("zspace", number,minc,time);
    context.putImageData(zslice_image_data,0,parseInt(minc.xspace.height*Math.abs(minc[minc.xspace.height_space].step)+minc.yspace.height*Math.abs(minc[minc.yspace.height_space].step)));    

  };

  this.showCrosshairs= function(){
    drawCrosshair(parseInt(that.slices[that.current_minc.xspace.length_space]*Math.abs(that.current_minc[that.current_minc.xspace.length_space].step)),
                  parseInt(that.slices[that.current_minc.xspace.height_space]*Math.abs(that.current_minc[that.current_minc.xspace.length_space].step)));
    drawCrosshair(parseInt(that.slices[that.current_minc.yspace.length_space]*Math.abs(that.current_minc[that.current_minc.yspace.length_space].step)),
		  parseInt(that.slices[that.current_minc.yspace.height_space]*Math.abs(that.current_minc[that.current_minc.yspace.height_space].step)+that.current_minc.xspace.height*Math.abs(that.current_minc[that.current_minc.xspace.height_space].step)));
    drawCrosshair(parseInt(that.slices[that.current_minc.zspace.length_space]*Math.abs(that.current_minc[that.current_minc.zspace.length_space].step)),
		  parseInt(that.slices[that.current_minc.zspace.height_space]*Math.abs(that.current_minc[that.current_minc.zspace.height_space].step)
			   +that.current_minc.xspace.height*Math.abs(that.current_minc[that.current_minc.xspace.height_space].step)
			   +that.current_minc.yspace.height*Math.abs(that.current_minc[that.current_minc.yspace.height_space].step)));    

  }

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
    that.initCanvas(canvas.width, canvas.height);    

    //insert slices
    that.updateXSpace(slice_numbers.x,that.current_minc,time);
    that.updateYSpace(slice_numbers.y,that.current_minc,time);    
    that.updateZSpace(slice_numbers.z,that.current_minc,time);
    that.showCrosshairs();

  };
 


  this.showMinc=function(minc){
    $(canvas).siblings("#mincinfo").append("Minc Information: <br>"+
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
    if(position.y/Math.abs(that.current_minc[that.current_minc.xspace.height_space].step) < that.current_minc.xspace.height) {
      var slices = {
	x: that.slices.xspace
      };
      if(that.current_minc.xspace.height_space == "yspace") {
	slices.y = parseInt(position.y/Math.abs(that.current_minc[that.current_minc.xspace.height_space].step));
	slices.z = parseInt(position.x/Math.abs(that.current_minc[that.current_minc.xspace.length_space].step));
      }else {
        slices.y = parseFloat(position.x/Math.abs(that.current_minc[that.current_minc.xspace.height_space].step));
	slices.z = parseFloat(position.y/Math.abs(that.current_minc[that.current_minc.xspace.length_space].step));
   	
      }

    }else if(position.y < (that.current_minc.xspace.height*Math.abs(that.current_minc[that.current_minc.xspace.height_space].step) + that.current_minc.yspace.height*Math.abs(that.current_minc[that.current_minc.yspace.height_space].step))){
      var slices = {
	y: that.slices.yspace
      };
      
      if(that.current_minc.yspace.height_space == "zspace"){
	
	slices.x = parseInt(position.x/Math.abs(that.current_minc[that.current_minc.yspace.length_space].step));	
	slices.z = parseInt((position.y -  that.current_minc.xspace.height*Math.abs(that.current_minc[that.current_minc.xspace.height_space].step))/Math.abs(that.current_minc.zspace.step)); 
      } else {	
        slices.z = parseInt(position.x/Math.abs(that.current_minc[that.current_minc.yspace.length_space].step));	
	slices.x = parseInt((position.y -  that.current_minc.xspace.height*Math.abs(that.current_minc[that.current_minc.xspace.height_space].step))/Math.abs(that.current_minc.xspace.step));
			    
      }

    }else {
      var slices = 
	{
	  z: that.slices.zspace,
	  x:parseInt(position.x/Math.abs(that.current_minc[that.current_minc.zspace.length_space].step)),
	  y:parseInt((position.y - that.current_minc.xspace.height*Math.abs(that.current_minc[that.current_minc.xspace.height_space].step) - that.current_minc.yspace.height*Math.abs(that.current_minc[that.current_minc.yspace.height_space].step))/Math.abs(that.current_minc[that.current_minc.zspace.height_space].step))
	};
      
    }
    
  return slices;  

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
    $("<div id=\"brightness\">Brightness: </div>").appendTo($(canvas).parent());
    var div = $($(canvas).parent().children("#brightness"));
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
    $("<div id=\"contrast\">Contrast: </div>").appendTo($(canvas).parent());
    var div = $($(canvas).parent().children("#contrast"));
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
    $("<div id=\"spectrum\">Color Scale</div>").appendTo($(canvas).parent());
    var div = $($(canvas).parent().children("#spectrum"));
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
				   var height = minc.xspace.height*Math.abs(minc[minc.xspace.height_space].step)+minc.yspace.height*Math.abs(minc[minc.yspace.height_space].step)+minc.zspace.height*Math.abs(minc[minc.zspace.height_space].step);
				   var length = Math.max(minc.xspace.length*Math.abs(minc[minc.xspace.length_space].step),minc.yspace.length*Math.abs(minc[minc.yspace.length_space].step),minc.zspace.length*Math.abs(minc[minc.zspace.length_space].step));
				   
				   that.initCanvas(length,height);
				   that.showMinc(minc);
				   that.showBrightness();
				   that.showContrast();
				   that.addListeners();
                                   that.showSpectrum();
				   if(minc.time) {
				     that.showTime();
				   }
				   ;});
  };


};


