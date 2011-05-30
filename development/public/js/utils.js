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

/*
 * Only works with primitive. 
 */
function cloneArray(original) {
  var new_array = new Array(original.length);
  for(var i=0; i< new_array.length; i++) {
    new_array[i] = original[i];
  }
    
  return new_array;
}

function rotateUint16Array90Left(array,width,height){
  var new_array = new Uint16Array(width*height);
  
  for(var i = 0; i< width; i++){
    for(var j=0; j< height; j++)  {
      new_array[i*height+j] = array[j*width+(width-i)];

      
    }
  }
  return new_array;
}


function rotateUint16Array90Right(array,width,height){
  var new_array = new Uint16Array(width*height);
  
  for(var i = 0; i< width; i++){
    for(var j=0; j< height; j++)  {
      new_array[i*height+j] = array[(height-j)*width+i];

      
    }
  }
  return new_array;
}

function interpolateDataArray(first,second,percentage) {
  console.log(first.values.length);
//  if(first.length != second.length) {
  //  console.log("can't interpolate different array size");
    //throw "can't interpolate different array size";
 // }
  var length = first.values.length;  

  var new_array = new Array(length);
  for(var i = 0; i< length; i++) {
    if(first.values[i]<second.values[i]) {
      new_array[i] = (first.values[i]*percentage+second.values[i]*(100-percentage))/100;      
    }else {
      new_array[i] = (first.values[i]*(100-percentage)+second.values[i]*percentage)/100;      
    }

  }
  console.log(new_array.length);
  return new_array;
}