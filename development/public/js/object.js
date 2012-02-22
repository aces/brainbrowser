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

/**
 * Manages object creation
 * Brains/polygon shapes/line objects ...
 *
 * @augments BrainBrowser
 */
function bbObject(brainbrowser) {
  var that = brainbrowser;

    /*
   * Creates a brains with two hemispheres as seperate shapes. 
   */
  that.createBrain = function(model_data,filename) {
    that.model_data= model_data;

    /*
     * Create the Shape for the brain mesh and assign its material.
     * two shapes will be created if the brain model has two hemispheres
     */
     if(model_data.num_hemispheres == 2) {
       
       var brainShape= {
	 left: that.createHemisphere(model_data.left, "left"),
	 right: that.createHemisphere(model_data.right, "right"),
	 num_hemisphere: 2
       };

     } else{ 
       var brainShape = that.createHemisphere(model_data,"filename");
       brainShape.num_hemisphere= 1;
     }



    // Create a new transform and parent the Shape under it.
    if(that.brainTransform == null) {

      that.brainTransform = that.pack.createObject('Transform');
      if(model_data.num_hemispheres == 2) {
	that.brainHemisphereTransforms = {};
	that.brainHemisphereTransforms.left = that.pack.createObject('Transform');
	that.brainHemisphereTransforms.right = that.pack.createObject('Transform');
      }
    }else {
      that.brainTransform.removeShape(that.brainTransform.shapes[0]);

      if(that.brainTransform.children[0] != null) {
	that.brainTransform.children[0].removeShape(that.brainTransform.children[0].shapes[0]);
      }

      if(that.brainTransform.children[1] !=null ) {
	that.brainTransform.children[1].removeShape(
	  that.brainTransform.children[1].shapes[0]);
      }
    };

    if(model_data.num_hemispheres != 2) {
      that.brainTransform.removeParam(that.brainTransform.children[0]);
      that.brainTransform.removeParam(that.brainTransform.children[1]);
    }

    if(model_data.num_hemispheres == 2 && that.brainHemisphereTransforms == null) {
    	that.brainHemisphereTransforms = {};
	that.brainHemisphereTransforms.left = that.pack.createObject('Transform');
	that.brainHemisphereTransforms.right = that.pack.createObject('Transform');
    }





    // Parent the brain's transform to the client root.
     that.brainTransform.parent = that.client.root;

    if(brainShape.num_hemisphere == 1 ) {

      that.brainTransform.addShape(brainShape);
      brainShape.createDrawElements(that.pack, null);
    }else {
      that.brainHemisphereTransforms.left.parent = that.brainTransform;
      that.brainHemisphereTransforms.right.parent = that.brainTransform;
      that.brainHemisphereTransforms.left.addShape(brainShape.left);
      that.brainHemisphereTransforms.right.addShape(brainShape.right);
      brainShape.left.createDrawElements(that.pack, null);
      brainShape.right.createDrawElements(that.pack, null);

    }
    that.model_data = model_data;

    if(that.afterCreateBrain != undefined) {
      that.afterCreateBrain(that.model_data);
    }
  };

  /*
   * Object that are composed of lines
   * 
   */
  that.createLineObject = function(model_data,filename,mesh) {
    that.model_data= model_data;
    
    var myMaterial = that.createMaterial("/shaders/line.txt");

    
    // Transparency 
    var transAlpha = myMaterial.getParam('transAlpha');
    transAlpha.value = 1.0;

    /*
     * Create the Shape for the  mesh and assign its material.
     * two shapes will be created if the  model has two hemispheres
     */
    if(mesh) {
      console.log("mesh");      
    }

    var shape = that.createLineShape(myMaterial,model_data,filename,mesh);
    shape.name = filename;

    if(that.brainTransform == undefined ){
      that.brainTransform = that.pack.createObject('Transform');
    }

    // Parent the 's transform to the client root.
    that.brainTransform.parent = that.client.root;
    that.brainTransform.addShape(shape);
    shape.createDrawElements(that.pack, null);
    that.model_data = model_data;
    if(that.afterCreate != undefined) {
      that.afterCreate(that.model_data);
    }
  };

  /*
   * Creates a generic polygon object. 
   */
  that.createPolygonObject = function(model_data,filename) {
    
    that.model_data= model_data;
    var myMaterial = that.createMaterial("/shaders/blinnphong.txt");
    myMaterial = that.blinnphongParams(myMaterial);
    

    if(that.brainTransform == undefined ){
      that.brainTransform = that.pack.createObject('Transform');
    }



    
    // Parent the 's transform to the client root.
    that.brainTransform.parent = that.client.root;
    /*
     * Create the Shape for the  mesh and assign its material.
     * two shapes will be created if the  model has two hemispheres
     */
    if(model_data.shapes){
      console.log("multi_shape");
      console.log(model_data);
      for(var z =0; z< model_data.shapes.length; z++){
	console.log(model_data.shapes[z]);
	var shape = that.createPolygonShape(myMaterial, model_data.shapes[z]);
	shape.name = model_data.shapes[z].name;
	that.brainTransform.addShape(shape);      
	shape.createDrawElements(that.pack, null);
	
      }
    }else {
      var shape = that.createPolygonShape(myMaterial, model_data);
      shape.name = filename;
      that.brainTransform.addShape(shape);      
      shape.createDrawElements(that.pack, null);
      
    }


    that.model_data = model_data;
    if(that.afterCreate != undefined) {
      that.afterCreate(that.model_data);
    }
  };


  /*
   * Creates the hemisphere shape with the material provide.
   */
  that.createHemisphere = function(model,name) {
    var material = that.createMaterial("/shaders/blinnphong.txt");
    
    material = that.blinnphongParams(material);

    //model = unIndexModel(model);
    var hemShape = that.pack.createObject('Shape');
    var hemPrimitive = that.pack.createObject('Primitive');
    var streamBank = that.pack.createObject('StreamBank');

    hemPrimitive.material = material;
    hemPrimitive.owner = hemShape;
    hemPrimitive.streamBank = streamBank;
    hemShape.name = name;

    hemPrimitive.primitiveType = that.o3d.Primitive.TRIANGLELIST;

    var state = that.pack.createObject('State');

    that.enableAlphaBlending(state);
    hemPrimitive.material.state = state;


    //create Position buffer (vertices) and set the number of vertices global variable
    var positionsBuffer = that.pack.createObject('VertexBuffer');
    var positionsField = positionsBuffer.createField('FloatField', 3);
    if(!model.positionArray) {
      alert("PositionArray nil");
      return false;
    }
    positionsBuffer.set(model.positionArray);
    //positionsBuffer.set(newPositionArray);
    that.numberVertices = model.numberVertices;
    var numberVertices = (model.positionArray.length/3);
    hemPrimitive.numberVertices = that.numberVertices;

    //create indexBuffer and make sure number of primitive is set
    if(!model.indexArray) {
      alert("Index Array nil");
      return false;
    }
    hemPrimitive.numberPrimitives = model.indexArray.length/3;
    var indexBuffer = that.pack.createObject('IndexBuffer');
    indexBuffer.set(model.indexArray);
    hemPrimitive.indexBuffer = indexBuffer;


    //Create normal buffer
    var normalBuffer = that.pack.createObject('VertexBuffer');
    var normalField = normalBuffer.createField('FloatField', 3);
    normalBuffer.set(model.normalArray);
    //normalBuffer.set(newNormalArray);

    var colorArray=[];
    if(model.colorArray.length == 4) {
      for(var i=0;i<numberVertices;i++) {
	colorArray.push.apply(colorArray,model.colorArray);
      }
    }else {
      colorArray = model.colorArray;
    }
    if(colorArray.length < model.positionArray.length) {
      alert('Problem with the colors: ' + colorArray.length);
    }
    var colorBuffer = that.pack.createObject('VertexBuffer');
    var colorField = colorBuffer.createField('FloatField', 4);
    colorBuffer.set(colorArray);
    colorArray = [];

    if(that.loading){
      jQuery(that.loading).html("Buffers Loaded");
    }


    streamBank.setVertexStream(
      that.o3d.Stream.POSITION, //  That stream stores vertex positions
      0,                     // First (and only) position stream
      positionsField,        // field: the field that stream uses.
      0);                    // start_index:

    streamBank.setVertexStream(
      that.o3d.Stream.NORMAL,
      0,
      normalField,
      0);


    streamBank.setVertexStream(
      that.o3d.Stream.COLOR,
      0,
      colorField,
      0);

    return hemShape;

  };

  
  /*
   * Creates the hemisphere shape with the material provide.
   */
  that.createLineShape = function(material,model,name,mesh) {

    var lineShape = that.pack.createObject('Shape');
    var streamBank = that.pack.createObject('StreamBank');
    lineShape.name = name;
    
    if(!model.positionArray) {
      alert("PositionArray nil");
      return false;
    }
    
    
    
    
    
    
    that.numberVertices = model.numberVertices; 
    
    
    
    
    var linePrimitive = that.pack.createObject('Primitive');      
    
    linePrimitive.material = material;
    linePrimitive.owner = lineShape;
    linePrimitive.streamBank = streamBank;
    linePrimitive.primitiveType = that.o3d.Primitive.LINELIST;
    var state = that.pack.createObject('State'); 
    that.enableAlphaBlending(state);
       
    linePrimitive.material.state = state;
    //positionsBuffer.set(newPositionArray);
    //create Position buffer (vertices) and set the number of vertices global variable
    

    var indexArray  = new Array();
    for(var i = 0; i < model.nitems; i ++){
      if(i == 0){
     	var start = 0;
      }else {
	var start = model.endIndicesArray[i-1];
      }
      indexArray.push(model.indexArray[start]);
      for(var k = start+1; k < model.endIndicesArray[i]-1; k++) {
     	indexArray.push(model.indexArray[k]);
     	indexArray.push(model.indexArray[k]);
      }
      indexArray.push(model.indexArray[model.endIndicesArray[i]-1]);
      
    }    
    
    if(!mesh) {   

      var indexBuffer = that.pack.createObject('IndexBuffer');
      linePrimitive.numberPrimitives = indexArray.length/2;
      linePrimitive.numberVertices = indexArray.length;
      that.indexArray = indexArray;
      //indexBuffer.set(indexArray);
      //linePrimitive.indexBuffer = indexBuffer;
      var positionArray = new Float32Array(indexArray.length*3);
      for(var j = 0; j < indexArray.length; j++) {
	positionArray[j*3] = model.positionArray[indexArray[j]*3];
	positionArray[j*3+1] = model.positionArray[indexArray[j]*3+1];
	positionArray[j*3+2] = model.positionArray[indexArray[j]*3+2];
      }
      var colorArray=[];
      if(model.colorArray.length == 4) {
	for(var i=0;i<numberVertices;i++) {
	  colorArray.push.apply(colorArray,[0.5,0.5,0.7,1]);
	}
      }else {
	colorArray = new Float32Array(indexArray.length*4);
	for(var j = 0; j < indexArray.length; j++) {
	  colorArray[j*4] = model.colorArray[indexArray[j]*4];
	  colorArray[j*4+1] = model.colorArray[indexArray[j]*4+1];
	  colorArray[j*4+2] = model.colorArray[indexArray[j]*4+2];
	  colorArray[j*4+3] = model.colorArray[indexArray[j]*4+3];
	}
      }
      
    }else {
      console.log('mesh shape');
      linePrimitive.numberVertices = model.meshPostionArray.length/3;
      linePrimitive.numberPrimitives = linePrimitive.numberVertices/2;
      var positionArray =model.meshPositionArray;
      var colorArray    =model.meshColorArray;
    }

    var positionsBuffer = that.pack.createObject('VertexBuffer');
    var positionsField = positionsBuffer.createField('FloatField', 3);
    
    
    
    positionsBuffer.set(positionArray);
    

    streamBank.setVertexStream(
      that.o3d.Stream.POSITION, //  That stream stores vertex positions
      0,                     // First (and only) position stream
      positionsField,        // field: the field that stream uses.
      0);                    // start_index:
    
    
    if(colorArray.length/4 < positionArray.length/3) {
      alert('Problem with the colors: ' + colorArray.length);
    }
    var colorBuffer = that.pack.createObject('VertexBuffer');
    var colorField = colorBuffer.createField('FloatField', 4);
    colorBuffer.set(colorArray);
    
    
    
    
    streamBank.setVertexStream(
      that.o3d.Stream.COLOR,
      0,
      colorField,
      0);
    
      
    if(that.loading){
      jQuery(that.loading).html("Buffers Loaded");
    }
    
    
      
    
    
    that.pack.gl.lineWidth(1.0);
    return lineShape;

  };


  

  /*
   * Creates the hemisphere shape with the material provide.
   */
  that.createPolygonShape = function(material,model,name) {
    //model = unIndexModel(model);
    var polygonShape = that.pack.createObject('Shape');
    var streamBank = that.pack.createObject('StreamBank');
    polygonShape.name = name;
    
    if(!model.positionArray) {
      alert("PositionArray nil");
      return false;
    }
       
    that.numberVertices = model.numberVertices; 
    
    var polygonPrimitive = that.pack.createObject('Primitive');      
    
    polygonPrimitive.material = material;
    polygonPrimitive.owner = polygonShape;
    polygonPrimitive.streamBank = streamBank;
    polygonPrimitive.primitiveType = that.o3d.Primitive.TRIANGLELIST;
    var state = that.pack.createObject('State'); 

    that.enableAlphaBlending(state);
    
    polygonPrimitive.material.state = state;
    //positionsBuffer.set(newPositionArray);
    //create Position buffer (vertices) and set the number of vertices global variable
    
    
    if(model.nonindexed == undefined) {
      
      var indexArray  = model.indexArray;
      //var indexBuffer = that.pack.createObject('IndexBuffer');
      polygonPrimitive.numberPrimitives = indexArray.length/3;
      polygonPrimitive.numberVertices = indexArray.length;
      that.indexArray = indexArray;
      //indexBuffer.set(indexArray);
      //polygonPrimitive.indexBuffer = indexBuffer;
      var positionArray = new Float32Array(indexArray.length*3);
      var meshPositionArray = new Array(indexArray.length*3);
      var meshColorArray = new Array(indexArray.length*4);
      var normalArray = new Float32Array(indexArray.length*3);
      var indexArrayLength = indexArray.length;
      for(var j = 0; j < indexArrayLength ; j++) {
	positionArray[j*3] = model.positionArray[indexArray[j]*3];
	positionArray[j*3+1] = model.positionArray[indexArray[j]*3+1];
	positionArray[j*3+2] = model.positionArray[indexArray[j]*3+2];
	
	normalArray[j*3] = model.normalArray[indexArray[j]*3];
	normalArray[j*3+1] = model.normalArray[indexArray[j]*3+1];
	normalArray[j*3+2] = model.normalArray[indexArray[j]*3+2];
	
      }
      //for mesh mode;
      for(var k = 0; k < indexArrayLength; k+=3) {

	var vert = [];
	vert[0] = [model.positionArray[indexArray[k]*3],
		   model.positionArray[indexArray[k]*3+1],
		   model.positionArray[indexArray[k]*3+2]];
	

	vert[1] = [model.positionArray[indexArray[k+1]*3],
		    model.positionArray[indexArray[k+1]*3+1],
		    model.positionArray[indexArray[k+1]*3+2]];
	
	vert[2] = [model.positionArray[indexArray[k+2]*3],
		   model.positionArray[indexArray[k+2]*3+1],
		   model.positionArray[indexArray[k+2]*3+2]];
	
	meshPositionArray.push.apply(meshPositionArray, vert[0]);
	meshPositionArray.push.apply(meshPositionArray, vert[1]);

	meshPositionArray.push.apply(meshPositionArray, vert[1]);
	meshPositionArray.push.apply(meshPositionArray, vert[2]);

	meshPositionArray.push.apply(meshPositionArray, vert[2]);
	meshPositionArray.push.apply(meshPositionArray, vert[0]);
		     
      };
      
      polygonShape.meshPositionArray = meshPositionArray;
    }else {
      polygonPrimitive.numberPrimitives = model.positionArray.length/3/3;
      polygonPrimitive.numberVertices = model.positionArray.length/3;
      var positionArray = new Float32Array(model.positionArray);
      var normalArray = new Float32Array(model.normalArray);
      console.log(model);
    }
    
    var colorArray=[];

    
    if(model.colorArray.length == 4) {
      for(var i=0;i<polygonPrimitive.numberVertices;i++) {
	colorArray.push.apply(colorArray,model.colorArray);
      }
    }else {
      colorArray = new Float32Array(indexArray.length*4);
      var indexArrayLength = indexArray.length;
      for(var j = 0; j < indexArrayLength ; j++) {
	colorArray[j*4] = 
	colorArray[j*4+1] = model.colorArray[indexArray[j]*4+1];
	colorArray[j*4+2] = model.colorArray[indexArray[j]*4+2];
	colorArray[j*4+3] = model.colorArray[indexArray[j]*4+3];
      }
      for(var l=0; l < indexArrayLenght; l+=3 ) {
	var color = [];
	color[0] = [model.colorArray[indexArray[j]*4],
		    model.colorArray[indexArray[j]*4 +1],
		    model.colorArray[indexArray[j]*4 +2],
		    model.colorArray[indexArray[j]*4 +3]
		   ];

	color[1] = [model.colorArray[indexArray[j+1]*4],
		    model.colorArray[indexArray[j+1]*4 +1],
		    model.colorArray[indexArray[j+1]*4 +2],
		    model.colorArray[indexArray[j+1]*4 +3]
		   ];

	color[2] = [model.colorArray[indexArray[j+2]*4],
		    model.colorArray[indexArray[j+2]*4 +1],
		    model.colorArray[indexArray[j+2]*4 +2],
		    model.colorArray[indexArray[j+2]*4 +3]
		   ];
	
	meshColorArray.push.apply(meshColorArray, color[0]);
	meshColorArray.push.apply(meshColorArray, color[1]);

	meshColorArray.push.apply(meshColorArray, color[1]);
	meshColorArray.push.apply(meshColorArray, color[2]);

	meshColorArray.push.apply(meshColorArray, color[2]);
	meshColorArray.push.apply(meshColorArray, color[0]);	
      }

    }


    model.meshPositionArray = meshPositionArray;
    model.meshColorArray = meshColorArray;
    //Create normal buffer
    var normalBuffer = that.pack.createObject('VertexBuffer');
    var normalField = normalBuffer.createField('FloatField', 3);
    normalBuffer.set(normalArray);
    //normalBuffer.set(newNormalArray);

    streamBank.setVertexStream(
      that.o3d.Stream.NORMAL,
      0,
      normalField,
      0);
    



    var positionsBuffer = that.pack.createObject('VertexBuffer');
    var positionsField = positionsBuffer.createField('FloatField', 3);
    
    
    
    positionsBuffer.set(positionArray);
    

    streamBank.setVertexStream(
      that.o3d.Stream.POSITION, //  That stream stores vertex positions
      0,                     // First (and only) position stream
      positionsField,        // field: the field that stream uses.
      0);                    // start_index:
    
    
    if(colorArray.length < model.positionArray.length) {
      alert('Problem with the colors: ' + colorArray.length);
    }
    var colorBuffer = that.pack.createObject('VertexBuffer');
    var colorField = colorBuffer.createField('FloatField', 4);
    colorBuffer.set(colorArray);
    colorArray = [];
    
    
    
    streamBank.setVertexStream(
      that.o3d.Stream.COLOR,
      0,
      colorField,
      0);
    
      
    if(that.loading){
      jQuery(that.loading).html("Buffers Loaded");
    }
    
    
    
    return polygonShape;

  };


  
}