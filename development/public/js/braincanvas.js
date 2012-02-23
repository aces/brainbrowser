/* 
 * Copyright (C) 2011 McGill University
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

function BrainCanvas(opt) {
  if(!opt) {
    opt = {};
  }
  var that  = this;
  var colorManager = new ColorManager()
  , xcanvas = opt.xcanvas || document.createElement('canvas')
  , ycanvas = opt.ycanvas || document.createElement('canvas')
  , zcanvas = opt.zcanvas || document.createElement('canvas')
  , xcontext = xcanvas.getContext("2d")
  , ycontext = ycanvas.getContext("2d")
  , zcontext = zcanvas.getContext("2d");

  xcanvas.zoom = 1;
  ycanvas.zoom = 1;
  zcanvas.zoom = 1;

  xcanvas.translate_origin = {x: 0,y:0};
  ycanvas.translate_origin = {x: 0,y:0};
  zcanvas.translate_origin = {x: 0,y:0};
  xcanvas.translate_vector = {x: 0,y:0};
  ycanvas.translate_vector = {x: 0,y:0};
  zcanvas.translate_vector = {x: 0,y:0};


  //Object to load elements, absctracts javascript calls
  var loader = new Loader();


  //Holds the slice numbers 
  that.slices = {};

  //initial brightness adjustment is 0;
  that.brightness = 0;
  //initial contrast at 1
  that.contrast = 1;

  //the different color specturms. 
  var spectrums = {
    spectral: loader.loadSpectrumFromUrl("/spectrum/spectral-brainview.txt")
    , grayscale:  loader.loadSpectrumFromUrl("/spectrum/gray_scale256.txt")
  };
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
 
  
  this.update_space = function(axis,canvas,context, number, minc,time) {
    that.slices[axis] = number;
    that.slices[axis].space_height = Math.ceil(Math.abs(minc[axis].height_space.step)
					  * minc[axis].height_space.space_length
					  * canvas.zoom);

    var width = Math.ceil(Math.abs(minc[axis].length_space.step)
					      * minc[axis].length_space.space_length
					      * canvas.zoom);
    var height = Math.ceil(Math.abs(minc[axis].height_space.step)
					       * minc[axis].height_space.space_length
					       * canvas.zoom);
    canvas.current_image = {width: width,
                             height: height};
    

    //Checks if the slices are need to be rotated
    //xspace should have yspace on the x axis and zspace on the y axis
    if(axis == "xspace" && minc.xspace.height_space.name=="yspace"){
      canvas.current_image.width = height;
      canvas.current_image.height = width;
    };

    //yspace should be XxZ
    if(axis == "yspace" && minc.yspace.height_space.name=="xspace"){
      canvas.current_image.width = height;
      canvas.current_image.height = width;
    }
    //zspace should be XxY 
    if(axis == "zspace" && minc.zspace.height_space.name=="xspace"){
      canvas.current_image.width = height;
      canvas.current_image.height = widht;
    }


    var slice_image_data = context.createImageData(
      canvas.current_image.width,
      canvas.current_image.height);




    var slice = minc.getScaledSlice(axis,number,time,canvas.zoom);
    
    //get the area of canvas to insert image into
    //Make sure that area uses the step of the axises
        
    slice_image_data.data = colorManager.createColorMap(spectrum
							, slice_image_data.data
							, slice,minc.min,minc.max
							, true
							, that.brightness
							, that.contrast
						       );

    context.putImageData(slice_image_data
			 , canvas.translate_vector.x
			 , canvas.translate_vector.y);  

  };

  function drawCrosshair(context,x,y) {
    context.fillStyle = "#FF0000";
    context.fillRect(x-2,y-2,4,4);
  };

  this.updateXSpace = function(number,minc,time) {
    that.update_space("xspace",xcanvas,xcontext, number,minc,time);
  };

  this.updateYSpace = function(number,minc,time) {
    that.update_space("yspace",ycanvas, ycontext,number,minc,time);
  };
  
  this.updateZSpace = function(number,minc,time) {

   that.update_space("zspace", zcanvas, zcontext, number, minc, time);
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
      var zheight = that.slices.zspace*Math.abs(that.current_minc.zspace.step);
      var zwidth = zheight;
    }


    drawCrosshair(xcontext,
		  ywidth*xcanvas.zoom+xcanvas.translate_vector.x,
		  zheight*xcanvas.zoom+xcanvas.translate_vector.y);
       
    drawCrosshair(ycontext,
		  xwidth*ycanvas.zoom+ycanvas.translate_vector.x,
		  zheight*ycanvas.zoom+ycanvas.translate_vector.y);
    
    
    drawCrosshair(zcontext,
		  xwidth*zcanvas.zoom+zcanvas.translate_vector.x,
		  yheight*zcanvas.zoom+zcanvas.translate_vector.y);
    
    



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
 

  /*
   * Zoom, scroll wheel zoom in out
   */
  this.zoomIn = function(event,canvas,delta) {
    if(canvas.zoom == undefined) {
      canvas.zoom = 1 * 1.01;
    }else {
      canvas.zoom = canvas.zoom * 1.10;
    }
    
    that.updateSlices(null,that.current_time);

  };

  this.zoomOut = function(event,canvas,delta) {
    if(canvas.zoom == undefined) {
      canvas.zoom = 0.90;
    }else {
      canvas.zoom = canvas.zoom*0.90;
    }
    that.updateSlices(null,that.current_time);
  };

  /*
   * translate a slice around (useful when zoomed)
   */
  this.translate = function(event,canvas) {
    var new_position =  getCursorPosition(event);
    if(canvas.translate_origin) {
      canvas.translate_vector = {x: (canvas.translate_origin.x  - new_position.x2), y: (canvas.translate_origin.y - new_position.y)};
      that.updateSlices(null,that.current_time);
    };
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
    return {target: e.target,x: x,y: y,x2: e.target.width - x};
    
    
    
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

  /*
   * Take x,y from the top left corner of the canvas and convert it to slice space. 
   */
  this.getSliceNumbersFromPosition = function(position){
    that.position = position;
    if(position.target.id == xcanvas.id) {
      var slices = {
	x: that.slices.xspace,
	y: parseInt((position.x-xcanvas.translate_vector.x)/Math.abs(that.current_minc.xspace.height_space.step)/xcanvas.zoom),
	  //we have to adjust the y coordinate by the amount of difference between 
	  //the canvas height and the image height since the image
	  // is a little higher then the bottom of the canvas and y is counted up from the bottom

	z: parseInt((position.y+xcanvas.translate_vector.y-(xcanvas.height-xcanvas.current_image.height))/Math.abs(that.current_minc.xspace.length_space.step)/xcanvas.zoom)
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
	x: parseInt((position.x-ycanvas.translate_vector.x)
		    / (Math.abs(that.current_minc.xspace.step)
		       * ycanvas.zoom)),
	  //we have to adjust the y coordinate by the amount of difference between 
	  //the canvas height and the image height since the image
	  // is a little higher then the bottom of the canvas and y is counted up from the bottom

	z: parseInt((position.y+ycanvas.translate_vector.y - (ycanvas.height-ycanvas.current_image.height))/(Math.abs(that.current_minc.zspace.step)*ycanvas.zoom))
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
	  x:parseInt((position.x-zcanvas.translate_vector.x)/(Math.abs(that.current_minc.zspace.length_space.step)*zcanvas.zoom)),
	  
	  //we have to adjust the y coordinate by the amount of difference between 
	  //the canvas height and the image height since the image
	  // is a little higher then the bottom of the canvas and y is counted up from the bottom
	  y:parseInt((position.y+zcanvas.translate_vector.y - (zcanvas.height-zcanvas.current_image.height))/(Math.abs(that.current_minc.yspace.step)*zcanvas.zoom))
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

  

  /*
   * All event handlers on the canvases are registered here. 
   */
  this.addListeners = function(canvas) {
    canvas.onmousedown = function(event) {
      that.drag = true;
      if(event.shiftKey) {
	var position = getCursorPosition(event);
	canvas.translate_origin = {x: canvas.translate_vector.x+position.x2, y: canvas.translate_vector.y + position.y};


      }
      return false;
    };
    
    canvas.onmouseup = function(event) {
      that.drag = false;
    };
    

    canvas.onmousemove = function(event) {
      if(that.drag) {
	if(event.shiftKey) {
	  that.translate(event,canvas);	  
	}else {
	  that.updateSlices(event);	  
	}
      }
    };
    
    jQuery(canvas).mousewheel(function(event,delta) {
				if(delta > 0) {
				  that.zoomIn(event,canvas,delta);
				}else {
				  that.zoomOut(event,canvas,delta);
				}
				
				return false;
			      });
    
  };
  
  /*
   * The following are Methods to create UI elements
   * 
   */

  //Show time slider for 4D datasets
  this.showTime = function() {
    $("<div id=\"time\">Time Index: </div>").appendTo($(xcanvas).parent());



    var playStatus = {
        playing:false
      , position: 0
    };


    var div = $($(xcanvas).parent().children("#time"));
    $("<span id=\"time-value\">1</span>").appendTo(div);
    

    $("<div id=\"time-slider\" width=\""+xcanvas.width+"\" + height=\"10\"></div>").slider({
						  value: 0,
						  min: 0,
						  max: that.current_minc.time.space_length,
						  step: 1,
						  change: function(event,ui) {
						    console.log("BLAH!");
					            that.updateSlices(null,ui.value);	    

						    playStatus.position = ui.value;
						    $(div).children("#time-value").html(ui.value);
						  },
	                                          slide: function(event,ui) {
						    console.log("BLAH!");
					            that.updateSlices(null,ui.value);
						    playStatus.position = ui.value;	    
						    $(div).children("#time-value").html(ui.value);
						  }}).appendTo(div);

    //Play buttons
    $("<div class=\"toolbar\"><span id=\"time-toolbar\" class=\"ui-widget-header ui-corner-all\">"
      + "<button id=\"play\">play</button>"
      + "<button id=\"stop\">stop</button>"
      + "</span></div>"
     ).appendTo(div);
    

											   
    
    function tick(){
      if(playStatus.playing) {
	playStatus.position+=1;
	if(playStatus.position > that.current_minc.time.space_length) {
	  playStatus.position = 0;
	};
	$(div).children("#time-slider").slider("value", playStatus.position);
	
	
	setTimeout(tick, 500);
      }
    }

    function play() {
      playStatus.playing = true;
      tick();
    }
    

    function pause() {
      playStatus.playing = false;
    }

    function stop() {
      playStatus.playing = false;
      playStatus.position = 0;
      $(div).children("#time-slider").slider("value", playStatus.position);
    }
    
    $("#time-toolbar").children("#play").button({
						    label: "play"
						  , text: false
						  , icons: {
						      primary: "ui-icon-play"
						  }
						})
    .click(function(){
	     var options;
			if ( $( this ).text() === "play" ) {
				options = {
					label: "pause",
					icons: {
						primary: "ui-icon-pause"
					}
				};
			  play();
			} else {
				options = {
					label: "play",
					icons: {
						primary: "ui-icon-play"
					}
				};
			  pause();
			}
			$( this ).button( "option", options );
	   });
    $("#time-toolbar").children("#stop").button({
						    label: "stop"
						  , text: false
						  , icons: {
						      primary: "ui-icon-stop"
						  }
						})

      .click(function() {
	       $( "#play" ).button( "option", {
				      label: "play",
				      icons: {
					primary: "ui-icon-play"
				      }
				    });
	       stop();
	     });
    
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
  
  /*
   * Recalculates the colors when a user changes the spectrum
   */ 
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
    this.current_minc = new Minc(filename, opt ,function(minc,extraArgs){
				   /*
				    * Height and Width of the canvas for each space
				    * 
				    * xspace: height is zspace; width is yspace
				    * yspace: height is zspace; width is xspace
				    * zspace: height is yspace; width is xspace
				    *  
				    */ 
				   //Initializes the canvas to the right height width, and clears them
				   var height = opt.canvasHeight || 256
				   ,   width  = opt.canvasWidth  || 256;
				  
				   that.initCanvas(xcanvas, width, height);
				   that.initCanvas(ycanvas, width, height);
				   that.initCanvas(zcanvas, width, height);
				   
				   //Builds and displays the UI elements for each 
				   that.showCoordinates();
				   that.showMinc(minc);
				   //if it's a 4D dataset time will be defined. 
				   if(minc.time) {
				     that.showTime();
				   }
				   that.showBrightness();
				   that.showContrast();
                                   that.showSpectrum();

				   //Binds events to all three elements
				   that.addListeners(xcanvas);
				   that.addListeners(ycanvas);
				   that.addListeners(zcanvas);



				   
				   ;});
  };


};


