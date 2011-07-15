function ColorManager(){
  /*
   * This create a color map for each value in the values array
   * This can be slow and memory intensive for large arrays
   */
  function createColorMap(spectrum,canvaspixelarray,values,min,max,convert,brightness,contrast,alpha) {
    
    
    var spectrum = spectrum.colors;
    
    //calculate a slice of the data per color
    var increment = ((max-min)+(max-min)/spectrum.length)/spectrum.length;
    //  alert("min:" + min +"  "+ values.min() + " " + "Max : " + max + " "+ values.max()+ "inc : " + increment + " spectrum.length" +spectrum.length);
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
      
      //should the numbers be from 0,255 or 0,1.0 convert == true means 0-255
      if(convert) {
	var scale = 255;
      }else
	var scale = 1;
      canvaspixelarray[i*4+0]=scale*spectrum[color_index][0]*contrast+brightness*scale;
      canvaspixelarray[i*4+1]=scale*spectrum[color_index][1]*contrast+brightness*scale;      
      canvaspixelarray[i*4+2]=scale*spectrum[color_index][2]*contrast+brightness*scale;
      if(alpha) {
	canvaspixelarray[i*4+3]=scale*alpha;
      }else {
	canvaspixelarray[i*4+3]=scale;
      }
      
    }
    return canvaspixelarray;
    
    
  };
  this.createColorMap = createColorMap; 

  /*
   * Blend multiple color_arrays into one using their alpha values
   */
  function blendColors(color_arrays) {
    var final_color = new Float32Array(color_arrays[0].length);
    for(var i = 0; i < color_arrays[0].length/4; i++){
      for(var j = 0;  j < color_arrays.length; j++) {
	var alpha_old = final_color[i*4+3];
	var alpha_new = color_array[j][i*4+3];
	final_color[i*4] = final_color[i*4]*alpha_old+color_array[j][i*4]*new_alpha;
	final_color[i*4+1] = final_color[i*4+1]*alpha_old+color_array[j][i*4+1]*new_alpha;
	final_color[i*4+2] = final_color[i*4+2]*alpha_old+color_array[j][i*4+2]*new_alpha;
	final_color[i*4+3] = alpha_old + alpha_new;
      }   
    }
    return final_color;
    
  }
  this.blendColors = blendColors;


  /*
   * Blends two or more arrays of values into one color array
   */
  function blendColorMap(spectrum,value_arrays,brightness,contrast)
  {
    var number_arrays = values_arrays.length;
    var color_arrays = new Array(number_arrays);
    
    var final_alpha = 0;
    for(var i = 0; i< number_arrays; i++) {
      final_alpha += value_arrays[i].alpha;
      color_arrays[i] = createColorMap(spectrum,new Array(value_arrays[i].values),value_arrays[i].values,value_arrays[i].min,value_arrays[i].max,false,0,1,value_arrays[i].alpha);
    }
    
    return blend_colors(color_arrays);
    
  }
  this.blendColorMap = blendColorMap;


}
