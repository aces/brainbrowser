Array.prototype.min = function() {
  var increment = 50000;
  if(this.length > increment){
    var reduced_array = [];
    for(var i=0;i<this.length;i+=increment) {
      reduced_array.push(Math.min.apply(Math, this.slice(i,i+increment-1)));
    }
  }else {
    return Math.min.apply(Math, this);
  }
  return reduced_array.min();

};
Array.prototype.max = function(array) {
  var increment = 50000;
  if(this.length > increment){
    var reduced_array = [];
    for(var i=0;i<this.length;i+=increment) {
      reduced_array.push(Math.max.apply(Math, this.slice(i,i+increment-1)));
    }
  }else {
    return Math.max.apply(Math, this);
  }
  return reduced_array.max();
};


function rotateUint16Array90Left(array,width,height){
  var new_array = new Uint16Array(width*height);
  
  for(var i = 0; i< width; i++){
    for(var j=0; j< height; j++)  {
      new_array[i*height+j] = array[j*width+(width-i)];

      
    }
  }
  return new_array;
}
