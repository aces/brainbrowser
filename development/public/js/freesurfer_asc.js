function FreeSurferAsc(data) {
  var obj = this;
  var current_shape;
  var vertexArray = [];
  var texCoordArray = [];
  var normalArray = [];
  var counts;
  var vertexCount;
  var faceCount;
  var line;
  var face, shape;
  var numberOfShapes;
  var i, l;
  
  data = data.split('\n');
  obj.shapes = [];
  current_shape = {name: data.name | "undefined", faces: [], positionArray: [], colorArray: [], indexArray: [], texIndexArray:[], normalIndexArray: []};
  obj.shapes.push(current_shape);
  
  counts = data[1].split(/\s+/);
  vertexCount = parseInt(counts[0], 10);
  faceCount = parseInt(counts[1], 10);
  
  for (i = 2; i < vertexCount + 2; i++) {
    line = data[i].split(/\s+/);
    vertexArray.push(parseFloat(line[0]));
    vertexArray.push(parseFloat(line[1]));
    vertexArray.push(parseFloat(line[2]));
  }
  
  for (i = vertexCount + 2; i < vertexCount + faceCount + 2; i++) {
    line = data[i].split(/\s+/);
    face = [];
    face.push(parseInt(line[0], 10));
    face.push(parseInt(line[1], 10));
    face.push(parseInt(line[2], 10));
    current_shape.faces.push(face);
  }
  
  numberOfShapes = obj.shapes.length;
  for(l = 0; l < numberOfShapes; l++){
    shape = obj.shapes[l];
    
    shape.positionArray = vertexArray;
    if (shape.colorArray.length == 0) {
      shape.colorArray = [0.8,0.8,0.8,1.0];
    }
  }
  
  obj.objectClass = 'P';
  obj.vertexArray = vertexArray;
};