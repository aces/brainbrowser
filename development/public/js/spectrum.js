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


/**
* Spectrum object constructor also called color bar
*  
* @constructor
* @param {String} data String of data from loaded color file to parse to make spectrum obj
*/
function Spectrum(data) {
  var that = this;
  var colorManager = new ColorManager()

  /*
  * Creates an canvas with the spectrum of colors
  * from low(left) to high(right) values
  * colors == array of colors 
  * color_height  == height of the color bar
  * full_height == height of the canvas
  * flip == boolean should the colors be reversed
  */
  function createCanvas(colors, color_height, full_height, flip) {
    var canvas = document.createElement("canvas");
    var value_array  = new Array(256);
    var i, k;
    var context;

    $(canvas).attr("width", 256);
    $(canvas).attr("height", full_height);

    //using colorManager.createColorMap to create a array of 256 colors from the spectrum
    
    for (i = 0; i < 256; i++) {
      if (flip) {
        value_array[255-i] = i; 
      } else {
        value_array[i] = i; 
      }
    }
    
    colors = colorManager.createColorMap(that, [], value_array, 0, 255, true, 0, 1);

    context = canvas.getContext("2d");
    for (k = 0; k < 256; k++) {
      context.fillStyle = "rgb(" + parseInt(colors[k*4], 10) + ", " + parseInt(colors[k*4+1]) 
        + ", " + parseInt(colors[k*4+2] )
        + ")"; 
      context.fillRect(k, 0, 1, color_height);
    }

    return canvas;

  }
  
  //Returns a html canvas element of the color bar from the colors
  that.createSpectrumCanvas = function(colors)  {
    var canvas;
    
    if (colors === null ) {
      colors = that.colors;
    }
    
    canvas = createCanvas(colors, 20, 20, false);

    return canvas;
  };


  that.createSpectrumCanvasWithScale = function(min, max, colors, flip) {
    var canvas;
    var context;
  
    if (colors === null) {
      colors = that.colors;
    }
    canvas = createCanvas(colors, 20, 40, flip);
    context = canvas.getContext("2d");

    context.fillStyle = "#FFA000";

    //min mark
    context.fillRect(0.5, 20, 1, 10);
    context.fillText(min.toPrecision(3), 0.5, 40 );

    //quater mark
    context.fillRect(canvas.width/4.0, 20, 1, 10);
    context.fillText(((min+max)/4.0).toPrecision(3), canvas.width/4.0, 40);

    //middle mark
    context.fillRect(canvas.width/2.0, 20, 1, 10);
    context.fillText(((min+max)/2.0).toPrecision(3), canvas.width/2.0, 40);

    //3quater mark
    context.fillRect(3*(canvas.width/4.0), 20, 1, 10);
    context.fillText((3*((min+max)/4.0)).toPrecision(3), 3*(canvas.width/4.0), 40);


    //max mark
    context.fillRect(canvas.width-0.5, 20, 1, 10);
    context.fillText(max.toPrecision(3), canvas.width - 20, 40);

    return canvas;
  };

  /*
  * Parse the spectrum data from a string
  */
  function parseSpectrum(data) {
    data = data.replace(/^\s+/, '').replace(/\s+$/, '');
    var tmp = data.split(/\n/);
    var colors = [];
    var i, k, count1, count2;
    var tmp_color;
    
    for (i = 0, count1 = tmp.length; i < count1; i++) {
      tmp_color = tmp[i].replace(/\s+$/, '').split(/\s+/);
      count2 = tmp_color.length;
      for (k=0; k < count2; k++) {
        tmp_color[k] = parseFloat(tmp_color[k]);
      }
      if (count2 < 4) {
        tmp_color.push(1.0000); 
      }

      colors.push(tmp_color);
    }
    that.colors = colors;
    
    return colors;
  }

  if(data != undefined) {
    parseSpectrum(data);
  }


}
