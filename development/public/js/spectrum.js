function Spectrum(data) {
  var that = this;



  /*
   * Creates an canvas with the spectrum of colors
   * from low(left) to high(right) values
   */
  function createCanvas(colors,color_height,full_height,flip) {
    var canvas = document.createElement("canvas");

    jQuery(canvas).attr("width",colors.length);
    jQuery(canvas).attr("height",full_height);

    var context = canvas.getContext("2d");
    if(flip) {
      for(var i = 0; i < colors.length; i++) {
	var color_index = colors.length-1-i;
	context.fillStyle = "rgb("
			      +parseInt(parseFloat(colors[color_index][0])*255)+','
			      +parseInt(parseFloat(colors[color_index][1])*255)+','
			      +parseInt(parseFloat(colors[color_index][2])*255)+')';
	context.fillRect(i,0,1,color_height);
      };

    }else{
      for(var i = 0; i < colors.length; i++) {
	  context.fillStyle = "rgb("+parseInt(parseFloat(colors[i][0])*255)+','+parseInt(parseFloat(colors[i][1])*255)+','+parseInt(parseFloat(colors[i][2])*255)+')';
	  context.fillRect(i,0,1,color_height);
	};



    }
    return canvas;

  }



  that.createSpectrumCanvas = function(colors)  {
    if(colors == null ) {
      colors = that.colors;
    }

    var canvas = createCanvas(colors,20,20,false);

    return canvas;
  };


  that.createSpectrumCanvasWithScale = function(min,max,colors,flip) {

    if(colors == null) {
      colors = that.colors;
    }
    var canvas = createCanvas(colors,20,40,flip);
    var context = canvas.getContext("2d");

    context.fillStyle = "#FFFFFF";

    //min mark
    context.fillRect(0.5,20,1,10);
    context.fillText(min.toPrecision(3), 0.5, 40 );

    //quater mark
    context.fillRect(canvas.width/4.0,20,1,10);
    context.fillText(((min+max)/4.0).toPrecision(3), canvas.width/4.0, 40 );

     //middle mark
    context.fillRect(canvas.width/2.0,20,1,10);
    context.fillText(((min+max)/2.0).toPrecision(3), canvas.width/2.0, 40 );

    //3quater mark
    context.fillRect(3*(canvas.width/4.0),20,1,10);
    context.fillText((3*((min+max)/4.0)).toPrecision(3), 3*(canvas.width/4.0), 40 );


    //max mark
    context.fillRect(canvas.width-0.5,20,1,10);
    context.fillText(max.toPrecision(3), canvas.width-20, 40 );

    return canvas;
  };

  /*
   * Parse the spectrum data from a string
   */
  function parseSpectrum(data) {
    data = data.replace(/\s+$/, '');
    data = data.replace(/^\s+/, '');
    var tmp = data.split(/\n/);
    var colors = new Array();
    for(var i=0;i<tmp.length;  i++) {
      var tmp_color = tmp[i].split(/\s+/);
      for(var k=0; k<3; k++) {
	tmp_color[k]=parseFloat(tmp_color[k]);
      }
      tmp_color.push(1.0000);
      colors.push(tmp_color);
    }
    that.colors = colors;
    return colors;
  }

  if(data != undefined) {
    parseSpectrum(data);
  }
  
  
}
