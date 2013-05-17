function WavefrontObj(data) {
  var obj = this;
  data = data.split('\n');

  obj.shapes = [];
  var current_shape;
  var vertexArray = [];
  var texCoordArray = [];
  var normalArray = [];
  current_shape = {name: data.name | "undefined", faces: [], positionArray: [], colorArray: [], indexArray: [], texIndexArray:[], normalIndexArray: []};
  obj.shapes.push(current_shape);
  for(var i = 0; i < data.length; i++) {
    var line = data[i].split(/\s+/);

    if(!(line[0].match("#")) || line == "") {
      if(line[0] == "o" | line[0] == 'g') {
        console.log(line[1]);
        current_shape = {name: line[1], faces: [], positionArray: [], colorArray: [], indexArray: [], texIndexArray:[],  normalIndexArray: []};
        obj.shapes.push(current_shape);

      }else if(line[0] == "v") {
        vertexArray.push(parseFloat(line[1]));
        vertexArray.push(parseFloat(line[2]));
        vertexArray.push(parseFloat(line[3]));
      }else if(line[0] == "vt") {
        for(var n=1; n < line.length; n++){
          texCoordArray.push(parseFloat(line[n]));
        }
      }else if(line[0] == "vn") {
        normalArray.push(parseFloat(line[1]));
        normalArray.push(parseFloat(line[2]));
        normalArray.push(parseFloat(line[3]));
      }else if(line[0] == 'f') {
        var face = [];
        for(var k = 1; k< 4; k++){
          var elem = line[k].split('/');
          face.push(parseInt(elem[0])-1);
          current_shape.indexArray.push(parseInt(elem[0]) -1 );
          current_shape.texIndexArray.push(parseInt(elem[1]) -1);
          if(elem[2]) {
            current_shape.normalIndexArray.push(parseInt(elem[2]) -1);
          }
        }
        
        if(line.length >= 4) {
          for(k; k< line.length; k++){
            var elem = line[k].split('/');
            face.push(parseInt(elem[0])-1);
            var lastIndex = current_shape.indexArray.length;
            current_shape.indexArray.push(current_shape.indexArray[lastIndex - 1]);		

            current_shape.indexArray.push(current_shape.indexArray[lastIndex - 3]);	
            current_shape.indexArray.push(elem[0]-1);	
          }
        }
        current_shape.faces.push(face);
      }
    }
  }
  var numberOfShapes = obj.shapes.length;
  for(var l=0; l < numberOfShapes; l++){
    var shape = obj.shapes[l];
 
    shape.positionArray = vertexArray;
    if (shape.colorArray.length == 0) {
      shape.colorArray = [0.8,0.8,0.8,1.0];
    }
  }
  
  obj.objectClass = 'P';
  obj.vertexArray = vertexArray;
  obj.texCoordArray = texCoordArray;
};