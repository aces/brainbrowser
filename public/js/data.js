function Data(data) {
  var that = this;
  that.parse = function(string) {
    string = string.replace(/\s+$/, '');
    string = string.replace(/^\s+/, '');
    that.values = string.split(/\s+/);
    for(var i = 0; i < that.values.length; i++) {
      that.values[i] = parseFloat(that.values[i]);
    }
    that.min = that.values.min();
    that.max = that.values.max();

  };

  that.createColorArray = function(min,max,spectrum,flip) {
    var spectrum = spectrum.colors;
    var colorArray = new Array();

    //calculate a slice of the data per color
    var increment = ((max-min)+(max-min)/spectrum.length)/spectrum.length;
    //for each value, assign a color
    for(var i=0; i<that.values.length; i++) {
      if(that.values[i]<= min ) {
	var color_index = 0;
      }else if(that.values[i]> max){
	var color_index = spectrum.length-1;
      }else {
	var color_index = parseInt((that.values[i]-min)/increment);
      }
      //This inserts the RGBA values (R,G,B,A) independently
      if(flip) {
        colorArray.push.apply(colorArray,spectrum[spectrum.length-1-color_index]);
      }else {
	colorArray.push.apply(colorArray,spectrum[color_index]);
      }


    }
    return colorArray;


  };



  if(data) {
    that.parse(data);
  }



}