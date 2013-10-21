/**
 * ColorScale object constructor also called color bar
 *
 * @constructor
 * @param {String} data String of data from loaded color file to parse to make colorScale obj
 */
(function() {
  "use strict";
  
  BrainCanvas.ColorScale = function(data) {
    if(!(this instanceof BrainCanvas.ColorScale)){
      return new BrainCanvas.ColorScale(data);
    }
    var that = this;

    /*
     * Parse the colorScale data from a string
     */
    function parseColorScale(data) {
      data = data.replace(/\s+$/, '');
      data = data.replace(/^\s+/, '');
      var tmp = data.split(/\n/);
      var colors = [];
      for (var i=0;i<tmp.length;  i++) {
        var tmp_color = tmp[i].replace(/\s+$/, '').split(/\s+/);
        for (var k=0; k<tmp_color.length; k++) {
          tmp_color[k]=parseFloat(tmp_color[k]);
        }
        if (tmp_color.length < 4) {
          tmp_color.push(1.0000);
        }
        
        colors.push(tmp_color);
      }
      that.colors = colors;
      return colors;
    }

    if (data !== undefined) {
      parseColorScale(data);
    }
  };


  /*
   * Creates an canvas with the colorScale of colors
   * from low(left) to high(right) values
   * colors == array of colors
   * color_height  == height of the color bar
   * full_height == height of the canvas
   * flip == boolean should the colors be reversed
   */
  function createCanvas(colorScale,color_height,full_height,flip) {
    var canvas = document.createElement("canvas");

    jQuery(canvas).attr("width",256);
    jQuery(canvas).attr("height",full_height);

    //using colorManager.createColorMap to create a array of 256 colors from the colorScale
    var value_array  = new Array(256);
    for(var i = 0; i < 256; i++){
      if(flip) {
        value_array[255-i] = i;
      } else {
        value_array[i] = i;
      }

    }

    var data = [];
    for(i =0; i<256;i++) {
      data.push(i);
    }

    var colors = colorScale.colorizeArray(data,0,255,true,0,1,false,[]);
    var context = canvas.getContext("2d");
    for(var k = 0; k < 256; k++) {
      context.fillStyle = "rgb(" + parseInt(colors[k*4], 10) + "," +
                                   parseInt(colors[k*4+1], 10) + "," +
                                   parseInt(colors[k*4+2], 10)+ ")";
      context.fillRect(k,0,1,color_height);
    }

    return canvas;

  }


  /**
   * Returns a html canvas element of the color bar from the colors
   */
  BrainCanvas.ColorScale.prototype.createColorScaleCanvas = function()  {
    var canvas = createCanvas(this,20,20,false);
    return canvas;
  };


  /**
   * Returns a html canvas element of the color bar from the colors
   * and adds a numbered scale
   *
   * @param {Number} min minimum value of scale
   * @param {Number} max maximum value of scale
   * @param {Boolean} flip flip the colors to show flipped scale
   */
  BrainCanvas.ColorScale.prototype.createColorScaleCanvasWithScale = function(min,max,flip) {
    var canvas = createCanvas(this,20,40,flip);
    var context = canvas.getContext("2d");

    context.fillStyle = "#FFA000";

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



  BrainCanvas.ColorScale.prototype.colorizeArray = function(data, min, max, convert, brightness, contrast, alpha, dest){
    //dest can be a pixel array or just null and a new one will be created
    if(!dest) {
      dest = [];
    }

    var colors = this.colors;
    var scale = 1;
    var colors_index;

    //calculate a slice of the data per colors
    //var increment = ((max-min)+(max-min)/colors.length)/colors.length;
    var numColors = colors.length*1.0;
    var increment = (max-min)/numColors;

    //for each value, assign a colors
    for (var i = 0; i < data.length; i++) {
      if (data[i] <= min ) {
        colors_index = 0;
      } else if(data[i] >= max) {
        colors_index = colors.length-1;
      } else {
        colors_index = parseInt((data[i]-min) / increment, 10);
      }
      //This inserts the RGBA data (R,G,B,A) independently

      //should the numbers be from 0,255 or 0,1.0 convert == true means 0-255
      if (convert) {
        scale = 255;
      }

      dest[i*4+0] = scale * colors[colors_index][0] * contrast + brightness * scale;
      dest[i*4+1] = scale * colors[colors_index][1] * contrast + brightness * scale;
      dest[i*4+2] = scale * colors[colors_index][2] * contrast + brightness * scale;
      if (alpha !== undefined) {
        dest[i*4+3]=alpha*scale;
      } else {
        dest[i*4+3]=scale;
      }

    }
    
    return dest;
  };


}());
