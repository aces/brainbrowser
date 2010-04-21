jQuery.noConflict();
/*
 * This file defines MNIObj object.
 * Given a url, the constructor will fetch the file specified which should be an
 * MNI .obj file. It will then pars this file and return an object with the properties
 * needed to display the file.
 *
 */
function MNIObject(string) {

  var stack;

  this.parse = function (string) {
    //replacing all new lines with spaces (obj files can be structure with or without them)
    //get all the fields as seperate strings.
    string = string.replace(/\s+$/, '');
    string = string.replace(/^\s+/, '');
    stack = string.split(/\s+/).reverse();
    this.objectClass = stack.pop();
    if( this.objectClass === 'P') {
      this.parse_polygon_class();
    }else {
      throw new Error("This object class is not supported currently");
    }



  };



    this.parse_polygon_class = function() {
    //surface properties of the polygons
    this.surfaceProperties = {
      ambient: parseFloat(stack.pop()),
      diffuse: parseFloat(stack.pop()),
      specular_reflectance: parseFloat(stack.pop()),
      specular_scattering: parseFloat(stack.pop()),
      transparency: parseFloat(stack.pop())
    };
    //number of vertices
    this.numberVertices = parseFloat(stack.pop());
    //vertices
    //alert("Number of vertices: " + this.numberVertices);
    this.positionArray = new Array();
    for(var v=0; v < this.numberVertices; v++) {
      for(var i=0; i<3;i++) {
	this.positionArray.push(parseFloat(stack.pop()));
      }
    }
    //alert("Position Array length: "+this.positionArray.length + " First vertex: " + this.positionArray[0] + " Last vertex: " + this.positionArray[this.positionArray.length - 1]);


    //Normals for each vertex
    this.normalArray = new Array();
    for(var n=0; n < this.numberVertices; n++){
      for(var i=0; i<3; i++) {
        this.normalArray.push(parseFloat(stack.pop()));
      }
    }
    //alert("normal Array length: "+this.normalArray.length + " first normal: " + this.normalArray[0] + " Last normal: " + this.normalArray[this.positionArray.length - 1]);
    this.numberPolygons = parseInt(stack.pop());
    //alert("Number of polygons: "+  this.numberPolygons);
    //alert(this.positionArray.length);
    this.colorFlag = parseInt(stack.pop());
    //alert('ColorFlag: ' + this.colorFlag);
    this.colorArray = new Array();
    if(this.colorFlag === 0) {
      for(var i=0; i<4; i++){
	this.colorArray.push(parseFloat(stack.pop()));
      }
    }else if(this.colorFlag === 1) {
      for(var c=0;c < this.numberPolygons; c++){
	for(var i=0; i<4; i++){
	  this.colorArray.push(parseFloat(stack.pop()));
	}
      }
    }else if(this.colorFlag === 2) {
      for(var c=0;c < this.numberVertices; c++){
	for(var i=0; i<4; i++){
	  this.colorArray.push(parseFloat(stack.pop()));
	}
      }
    }else {
      throw new Error("colorFlag not valid in this file");
    }
    //alert("ColorArray: " + this.colorArray);
    //Polygons end indices
    var endIndicesArray = new Array();
    for(var p=0;p<this.numberPolygons;p++){
      endIndicesArray.push(parseInt(stack.pop()));
    }

    //alert(endIndicesArray[endIndicesArray.length-1]);
    //Polygon indices
    this.indexArray = new Array();
    var numberIndex = stack.length;
    //alert("Stack length " + stack.length + " END: " + stack[0] + "END-1 : " + stack[1]);
    for(var i=0; i<numberIndex;i++) {
      this.indexArray.push(parseInt(stack.pop()));
    }
    //alert("index Array length: "+this.indexArray.length + " first index: " + this.indexArray[0] + " Last index: " + this.indexArray[this.indexArray.length - 1]);
  };




  if(string){
    this.parse(string);
  };


};