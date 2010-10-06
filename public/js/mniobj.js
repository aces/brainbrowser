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
    this.num_hemispheres = 1; //setting it to one here by default,
                              //it will be set to two later if there are two hemispheres
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

    //If there is two hemispheres, might need to be a better test one day
    if(this.positionArray.length > 80000*3){
      this.split_hemispheres();
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


  /*
   * Splits the model into two hemispheres
   * Making it easier to move the parts around (rotate the hemispheres 90 degrees,...)
   *
   */
  this.split_hemispheres = function() {

    this.left = {};
    this.right = {};

    var num_vertices = this.positionArray.length;
    this.left.positionArray = this.positionArray.slice(0,num_vertices/2);			this.right.positionArray = this.positionArray.slice(num_vertices/2, num_vertices);

    var num_indices = this.indexArray.length;
    this.left.indexArray = this.indexArray.slice(0,num_indices/2);
    this.right.indexArray = this.indexArray.slice(num_indices/2, num_indices);

    for(var i = 0; i < this.right.indexArray.length; i++) {
      this.right.indexArray[i] = this.right.indexArray[i]- 2 - num_indices/3/2/2;
    }
    var num_normals = this.normalArray.length;
    this.left.normalArray = this.normalArray.slice(0,num_normals/2);
    this.right.normalArray = this.normalArray.slice(num_normals/2, num_normals);


    this.left.colorFlag = this.colorFlag;
    this.right.colorFlag = this.colorFlag;


    if(this.colorFlag == 0 || this.colorFlag == 1) {

      this.left.colorArray = this.colorArray;
      this.right.colorArray = this.colorArray;

    }else {
      var num_colors = this.colorArray.length;
      this.left.colorArray = this.colorArray.slice(0,num_colors/2);
      this.right.colorArray = this.colorArray.slice(num_colors/2+1,-1);
    };

    this.left.numberVertices = this.numberVertices/2;
    this.right.numberVertices = this.numberVertices/2;

    this.left.numberPolygons = this.numberPolygons/2;
    this.right.numberPolygons = this.numberPolygons/2;

    this.num_hemispheres = 2;

  };


  this.get_vertex = function(index,position,hemisphere) {

    if(this.num_hemispheres > 1 ) {
      var model = this[hemisphere];
      var offset = 0;
      if(hemisphere == "right") {
	offset = 2 + model.indexArray.length/3/2; //Since the index is offset when splitting the hemispheres, we have to make it right again to find the correct one.
      }

    }else {
      var model = this;
      var offset = 0;
    }




    var triangle = new Array();
    var start_index = index*3;
    for(var i=0; i<3; i++) {
      triangle.push(model.indexArray[start_index+i]);
    }
    var vertices = new Array();
    for(var i=0; i<3; i++) {
      var start_pos = triangle[i]*3;
      vertices[i] = new Array();
      for(var k=0;k<3;k++){
	vertices[i][k] = model.positionArray[start_pos+k];
      }
    }
    var distances = new Array();
    for(var i=0; i<3; i++) {
      distances.push(o3djs.math.distance(position,vertices[i]));
    }
    var closest = 0;
    if(distances[1] < distances[0]) {
      closest = 1;
    }
    if(distances[2] < distances[closest]) {
      closest = 2;
    }
    var vertex = triangle[closest] + offset;
    var position_vector = vertices[closest];
    return {vertex: vertex, position_vector: position_vector};


  };

  if(string){
    this.parse(string);
  };


};