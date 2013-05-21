function WavefrontObj(data) {
  var obj = this;
  var current_shape;
  var vertexArray = [];
  var texCoordArray = [];
  var normalArray = [];
  var line;
  var line_marker;
  var line_length, numberOfShapes;
  var i, n, k, l, lastIndex;
  var face, shape, elem;
  
  data = data.split('\n');
  obj.shapes = [];
  current_shape = {name: data.name | "undefined", faces: [], positionArray: [], colorArray: [], indexArray: [], texIndexArray:[], normalIndexArray: []};
  obj.shapes.push(current_shape);
  for(i = 0; i < data.length; i++) {
    line = data[i].split(/\s+/);
    line_marker = line[0];
    line_length = line.length;

    if(!(line_marker.match("#")) || line === "") {
      switch(line_marker) {
        case "o":
        case "g":
          current_shape = {name: line[1], faces: [], positionArray: [], colorArray: [], indexArray: [], texIndexArray:[],  normalIndexArray: []};
          obj.shapes.push(current_shape);
          break;
        case "v":
          vertexArray.push(parseFloat(line[1]));
          vertexArray.push(parseFloat(line[2]));
          vertexArray.push(parseFloat(line[3]));
          break;
        case "vt":
          for(n = 1; n < line_length; n++){
            texCoordArray.push(parseFloat(line[n]));
          }
          break;
        case "vn": 
          normalArray.push(parseFloat(line[1]));
          normalArray.push(parseFloat(line[2]));
          normalArray.push(parseFloat(line[3]));
          break;
        case "f":
          face = [];
          for(k = 1; k < 4; k++){
            elem = line[k].split('/');
            face.push(parseInt(elem[0])-1);
            current_shape.indexArray.push(parseInt(elem[0], 10) - 1);
            current_shape.texIndexArray.push(parseInt(elem[1], 10) - 1);
            if(elem[2]) {
              current_shape.normalIndexArray.push(parseInt(elem[2], 10) - 1);
            }
          }

          if(line_length >= 4) {
            while(k< line_length){
              elem = line[k].split('/');
              face.push(parseInt(elem[0], 10) - 1);
              lastIndex = current_shape.indexArray.length;
              current_shape.indexArray.push(current_shape.indexArray[lastIndex - 1]);		

              current_shape.indexArray.push(current_shape.indexArray[lastIndex - 3]);	
              current_shape.indexArray.push(elem[0] - 1);	
              k++;
            }
          }
          current_shape.faces.push(face);
          break;
      } 
    }
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
  obj.texCoordArray = texCoordArray;
};