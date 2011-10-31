/* 
 * Copyright (C) 2011 McGill University
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/*
 * This file defines MNIObj object.
 * Given a url, the constructor will fetch the file specified which should be an
 * MNI .obj file. It will then pars this file and return an object with the properties
 * needed to display the file.
 *
 */
function MNIObject(string) {

  var stack;

  var that = this;

  this.parse = function (string) {
    that.num_hemispheres = 1; //setting it to one here by default,
                              //it will be set to two later if there are two hemispheres
    //replacing all new lines with spaces (obj files can be structure with or without them)
    //get all the fields as seperate strings.
    var string1 = string.replace(/\s+$/, '');
    var string2 = string1.replace(/^\s+/, '');
    stack = string2.split(/\s+/).reverse();
    that.objectClass = stack.pop();
    if( that.objectClass == 'P') {
      parseSurfProp();
      that.numberVertices = parseInt(stack.pop());
      parsePositionArray();
      parseNormalArray();
      that.nitems = parseInt(stack.pop());
    }else if (that.objectClass == 'L') {
      parseSurfProp();
      that.numberVertices = parseInt(stack.pop());
      parsePositionArray();
      that.nitems = parseInt(stack.pop());
    }else { 
      throw new Error("That object class is not supported currently");
    }
    parseColorArray();
    parseEndIndices();
    parseIndexArray();    
 
    // alert("objectClass: " + that.objectClass + " indexArray: " 
    // 	  + that.indexArray.length + " normalArray: "

    // 	  + that.positionArray.length  + " nitems: " 
    // 	  + that.nitems  + " colorArray: " 
    // 	  + that.colorArray.length + " endindices: " 
    // 	  + that.endIndicesArray.length);

    //If there is two hemispheres, might need to be a better test one day
    if(that.objectClass == 'P' ) {
      if(that.positionArray.length ==  81924*3){
	that.brainSurface = true;
	that.split_hemispheres();
      }
      
    }

  };

  function parseSurfProp() {
    if(that.objectClass == 'P') {
      that.surfaceProperties = {
	ambient: parseFloat(stack.pop()),
	diffuse: parseFloat(stack.pop()),
	specular_reflectance: parseFloat(stack.pop()),
	specular_scattering: parseFloat(stack.pop()),
	transparency: parseFloat(stack.pop())
      };
    }else if(that.objectClass == 'L') {
      that.surfaceProperties = {
	width: stack.pop()
      };
    }
  }

  function parsePositionArray() {
    that.positionArray = new Array();
    for(var v=0; v < that.numberVertices; v++) {
      for(var i=0; i<3;i++) {
	that.positionArray.push(parseFloat(stack.pop()));
      }
    }
  }


  function parseNormalArray() {
    //Normals for each vertex
    that.normalArray = new Array();
    for(var n=0; n < that.numberVertices; n++){
      for(var i=0; i<3; i++) {
        that.normalArray.push(parseFloat(stack.pop()));
      }
    }
  }

  function parseColorArray() {
    that.colorFlag = parseInt(stack.pop());
    //alert('ColorFlag: ' + that.colorFlag);
    that.colorArray = new Array();
    if(that.colorFlag === 0) {
      for(var i=0; i<4; i++){
	that.colorArray.push(parseFloat(stack.pop()));
      }
    }else if(that.colorFlag === 1) {
      for(var c=0;c < that.numberPolygons; c++){
	for(var i=0; i<4; i++){
	  that.colorArray.push(parseFloat(stack.pop()));
	}
      }
    }else if(that.colorFlag === 2) {
      for(var c=0;c < that.numberVertices; c++){
	for(var i=0; i<4; i++){
	  that.colorArray.push(parseFloat(stack.pop()));
	}
      }
    }else {
      throw new Error("colorFlag not valid in that file");
    }
  }

  function parseEndIndices() {
    that.endIndicesArray = new Array();
    for(var p=0; p < that.nitems;p++){
      that.endIndicesArray.push(parseInt(stack.pop()));
    }

  }

  function parseIndexArray() {
    that.indexArray = new Array();
    var numberIndex = stack.length;
    //alert("Stack length " + stack.length + " END: " + stack[0] + "END-1 : " + stack[1]);
    for(var i=0; i<numberIndex;i++) {
      that.indexArray.push(parseInt(stack.pop()));
    }
    
    //alert(" "+ that.indexArray[0] + " " +  " "+ that.indexArray[that.indexArray.length -1] + " " );

  }

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


  this.getVertexInfo = function(vertex) {
    var position_vector = [
      this.positionArray[vertex*3],
      this.positionArray[vertex*3+1],
      this.positionArray[vertex*3+2]
    ];
    return { vertex: vertex, position_vector: position_vector};
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