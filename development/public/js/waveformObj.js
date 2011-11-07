function WaveformObj(data) {
  var obj = this;
  data = data.split('\n');

  obj.shapes = [];
  var current_shape;
  var vertexArray = [];
  var texCoordArray = [];
  for(var i =0; i< data.length; i++) {
    var line = data[i].split(' ');
    if(!(line[0].match("#"))) {
      if(line[0] == "o" | line[0] == 'g') {
	current_shape = {name: line[1], indexArray:[], texIndexArray:[]};
	obj.shapes.push(current_shape);
      }else if(line[0] == "v") {
	vertexArray.push(parseFloat(line[1]));
	vertexArray.push(parseFloat(line[2]));
	vertexArray.push(parseFloat(line[3]));
      }else if(line[0] == "vt") {
	  for(var n=1; n < line.length; n++){
	      texCoordArray.push(parseFloat(line[n]));
	  }
      }else if(line[0] == 'f') {
	for(var k = 1; k< 4; k++){
	  var elem = line[k].split('/');
  	  current_shape.indexArray.push(parseInt(elem[0]) -1 );
	  current_shape.texIndexArray.push(parseInt(elem[1]) -1);
	}
	if(line.length >= 4) {
	    for(k; k< line.length; k++){
		var elem = line[k].split('/');
		var lastIndex = current_shape.indexArray.length;
		current_shape.indexArray.push(current_shape.indexArray[lastIndex - 1]);		

		current_shape.indexArray.push(current_shape.indexArray[lastIndex - 3]);	
		current_shape.indexArray.push(elem[0]-1);	
	    }
	}

      }
      
      
    }
  }
  var numberOfShapes = obj.shapes.length;
  for(var l=0; l < numberOfShapes; l++){
    var shape = obj.shapes[l];
    shape.positionArray = [];
    shape.texCoordArray = [];
    shape.colorArray = [1.0,0.2,0.0,1.0];
    var numberOfIndexes = shape.indexArray.length;
    for(var m=0; m < numberOfIndexes; m++) {
      shape.positionArray.push(vertexArray[(shape.indexArray[m])*3]);
      shape.positionArray.push(vertexArray[(shape.indexArray[m])*3+1]);
      shape.positionArray.push(vertexArray[(shape.indexArray[m])*3+2]);
    }
    shape.normalArray = [];
    for(i=0; i< numberOfIndexes; i+=3){
      var points = [];
      points[0]=[shape.positionArray[i*3],
	     shape.positionArray[i*3+1],
	     shape.positionArray[i*3+2]];
      points[1]=[shape.positionArray[(i+1)*3],
	     shape.positionArray[(i+1)*3+1],
	     shape.positionArray[(i+1)*3+2]];

      points[2]=[shape.positionArray[(i+2)*3],
	     shape.positionArray[(i+2)*3+1],
	     shape.positionArray[(i+2)*3+2]];
      var vec1 = [points[1][0]-points[0][0], points[1][1]-points[0][1], points[1][2]-points[0][2]];
      var vec2 = [points[2][0]-points[0][0], points[2][1]-points[0][1], points[2][2]-points[0][2]];
      var normal = vec3.normalize(vec3.cross(vec1,vec2,[]));
      for(var z = 0; z < 3; z++){
	shape.normalArray.push(normal[0]);
	shape.normalArray.push(normal[1]);
	shape.normalArray.push(normal[2]);
      }
    
    };

    
    shape.numberVertices = shape.positionArray.length/3;
    shape.nonindexed = true;
  }
  obj.objectClass = 'P';
  obj.vertexArray = vertexArray;
  obj.texCoordArray = texCoordArray;
};