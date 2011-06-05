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

  that.createColorArray = function(min,max,spectrum,flip,clamped,original_colors) {
    var spectrum = spectrum.colors;
    var colorArray = new Array();
    //calculate a slice of the data per color
    var increment = ((max-min)+(max-min)/spectrum.length)/spectrum.length;
    //for each value, assign a color
    for(var i=0; i<that.values.length; i++) {
      if(that.values[i] <= min ) {
	if(that.values[i] < min && !clamped) {
	  var color_index = -1;
	}else {
	  var color_index = 0; 
	}
      }else if(that.values[i]> max){
	if(!clamped){
	  var color_index = -1;
	}else {
	  var color_index = spectrum.length-1;
	}
      }else {
	var color_index = parseInt((that.values[i]-min)/increment);
      }
      //This inserts the RGBA values (R,G,B,A) independently
      if(flip && color_index != -1) {
        colorArray.push.apply(colorArray,spectrum[spectrum.length-1-color_index]);
      }else {
	if(color_index == -1) {
	  if(original_colors.length == 4){
	    	  colorArray.push.apply(colorArray,original_colors);	  
	  }else {
	    colorArray.push.apply(colorArray,[original_colors[i*4],original_colors[i*4+1],original_colors[i*4+2],original_colors[i*4+3]]);	  
	  }
	}else {
	  colorArray.push.apply(colorArray,spectrum[color_index]);
	}
	
      }


    }
    return colorArray;


  };



  if(data) {
    if(typeof data == "string") {
      that.parse(data);      
    }else if(data.values !=undefined){
      this.values = cloneArray(data.values);
      this.min = this.values.min();
      this.max = this.values.max();
    }else {
      console.log("copying data length: " + data.length );
      this.values = data;
      this.min = data.min();
      this.max = data.max();
    }

  }



}