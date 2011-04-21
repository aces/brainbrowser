/*
 * Image manipulation Library
 * 
 */
function Image() {
  var that = this;

  this.nearestNeighboor = function(data,width,height,new_width,new_height) {
    var new_array = new Uint16Array(new_width * new_height);
    var x_ratio = width/new_width;
    var y_ratio = height/new_height;
    
    for(var i = 0; i< new_height; i++) {
     for(var j = 0; j < new_width; j++)  {
       var px = Math.floor(j*x_ratio);  
       var py = Math.floor(i*y_ratio);
       new_array[Math.floor(i*new_width+j)] = data[Math.floor(py*width+px)];
     }
   
    }
    return new_array;
  };


  this.rotate90left = function(data,width,height){
    
  };

  this.rotate90right = function(data,width,height){

  };
}