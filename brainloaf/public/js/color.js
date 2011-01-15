
  /*
   * This create a color map for each value in the values array
   * This can be slow and memory intensive for large arrays
   */
function createColorMap(spectrum,canvaspixelarray,values,min,max) {
  

  var spectrum = spectrum.colors;

  //calculate a slice of the data per color
  var increment = ((max-min)+(max-min)/spectrum.length)/spectrum.length;
  alert("min:" + min +"  "+ values.min() + " " + "Max : " + max + " "+ values.max()+ "inc : " + increment + " spectrum.length" +spectrum.length);
  //for each value, assign a color
  for(var i=0; i<values.length; i++) {
    if(values[i]<= min ) {
      var color_index = 0;
    }else if(values[i]> max){
      var color_index = spectrum.length-1;
    }else {
      var color_index = parseInt((values[i]-min)/increment);
    }
    //This inserts the RGBA values (R,G,B,A) independently
    canvaspixelarray[i*4+0]=255*spectrum[color_index][0];
    canvaspixelarray[i*4+1]=255*spectrum[color_index][1];      
    canvaspixelarray[i*4+2]=255*spectrum[color_index][2];
    canvaspixelarray[i*4+3]=255;
  }
  return canvaspixelarray;
  
  
};

