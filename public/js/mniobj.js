/*
 * This file defines MNIObj object.
 * Given a url, the constructor will fetch the file specified which should be an
 * MNI .obj file. It will then parse this file and return an object with the properties
 * needed to display the file.
 *
 */
function MNIObj(url) {

  this.parse = function (string) {
    //replacing all new lines with spaces (obj files can be structure with or without them)
    string = string.replace("\n"," ");
    //get all the fields as seperate strings.
    var stack = string.split(" ").reverse();
    this.objectClass = stack.pop();

    if( this.objectClass === 'P') {
      this.parse_polygon_class(stack);
    }else {
      throw new Error("This object class is not supported currently");
    }



  };


  function parse_polygon_class(stack) {
    //surface properties of the polygons
    this.surfaceProperties = {
      ambient: stack.pop(),
      diffuse: stack.pop(),
      specular_reflectance: stack.pop(),
      specular_scattering: stack.pop(),
      transparency: stack.pop()
    };
    //number of vertices
    this.numberVertices = stack.pop();

    //vertices
    this.positionArray = new Array();
    for(var v=0; v< this.npoints; v++) {
      for(var i=0; i<3;i++) {
	this.positionArray.push(stack.pop());
      }
    }

    //Normals for each vertex
    this.normalArray = new Array();
    for(var n=0; n< this.numberVertices; n++){
      for(var i=0; i<3; i++) {
        this.normalArray.push(stack.pop());
      }
    }

    this.numberPolygons = stack.pop();

    this.colorFlag = stack.pop();

    this.colorArray = new Array();
    if(this.colorFlag === 0) {
      for(var i=0; i<4; i++){
	this.colorArray.push(stack.pop());
      }
    }else if(colorFlag === 1) {
      for(var c=0;c < this.numberPolygons; c++){
	for(var i=0; i<4; i++){
	  this.colorArray.push(stack.pop());
	}
      }
    }else if(colorFlag === 2) {
      for(var c=0;c < this.numberVertices; c++){
	for(var i=0; i<4; i++){
	  this.colorArray.push(stack.pop());
	}
      }
    }else {
      throw new Error("Color flag invalid in file");
    }



    //Polygons end indices
    var endIndicesArray = new Array();
    for(var p=0;p<numberPolygons;p++){
      for(var i=0; i<3; i++) {
        this.endIndicesArray.push(stack.pop());
      }
    }


    //Polygon indices
    this.indexArray = new Array();
    var startIndex =0;
    var endIndex;
    while(endIndex=endIndicesArray.pop()) {
      var numVert = endIndex-startIndex;
      for(var i=0; i<numVert; i++ ){
	this.indexArray.push(stack.pop());
      }
      startIndex = endIndex;
    }

  };




  if(url){
      jQuery.ajax({ type: 'GET',
	url: url,
	dataType: 'text',
	success: this.parse,
	data: {},
	timeout: 100000
      });
  };


};