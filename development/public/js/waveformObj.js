function WaveformObj(data) {
  var obj = this;
  data = data.split('\n');

  obj.shapes = [];
  var current_shape;
  var vertexArray = [];
  var texCoordArray = [];
  var normalArray = [];
  current_shape = {name: data.name | "undefined", faces: [], positionArray: [], colorArray: [], indexArray:[], texIndexArray:[], normalIndexArray: []};
  obj.shapes.push(current_shape);
  for(var i =0; i< data.length; i++) {
    var line = data[i].split(/\s+/);

    if(!(line[0].match("#")) || line == "") {
      if(line[0] == "o" | line[0] == 'g') {
        console.log(line[1]);
        current_shape = {name: line[1], faces: [], positionArray: [], colorArray: [], indexArray:[], texIndexArray:[],  normalIndexArray: []};
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
  var smoothNormals = Array(vertexArray.length/3);
  var numberOfShapes = obj.shapes.length;
  for(var l=0; l < numberOfShapes; l++){
    var shape = obj.shapes[l];
    //     shape.vertexArray = [];
    //     shape.normalArray = [];
    //     shape.texCoordArray = [];
    //     var numberOfIndexes = shape.indexArray.length;
    // for(var m=0; m < numberOfIndexes; m++) {
    //       shape.vertexArray.push(vertexArray[(shape.indexArray[m])*3]);
    //       shape.vertexArray.push(vertexArray[(shape.indexArray[m])*3+1]);
    //       shape.vertexArray.push(vertexArray[(shape.indexArray[m])*3+2]);
    //       if(shape.normalIndexArray.length > 0) {
    //         shape.normalArray.push(normalArray[(shape.normalIndexArray[m])*3]);
    //         shape.normalArray.push(normalArray[(shape.normalIndexArray[m])*3+1]);
    //         shape.normalArray.push(normalArray[(shape.normalIndexArray[m])*3+2]);
    //       }
    // 
    //     }
    //if(shape.normalArray.length == 0) {
    // for(var y=0; y< numberOfIndexes; y+=3) {
    //       var index = [];
    //       index[0]  = (shape.indexArray[y]);
    //       index[1]  = (shape.indexArray[y+1]); 
    //       index[2]  = (shape.indexArray[y+2]);
    //     
    //       var points = [];
    //       points[0]=[vertexArray[index[0]*3],
    //       vertexArray[index[0]*3+1],
    //       vertexArray[index[0]*3+2]];
    //       points[1]=[vertexArray[index[1]*3],
    //       vertexArray[index[1]*3+1],
    //       vertexArray[index[1]*3+2]];
    //     
    //       points[2]=[vertexArray[index[2]*3],
    //       vertexArray[index[2]*3+1],
    //       vertexArray[index[2]*3+2]];
    //       var vec1 = [points[1][0]-points[0][0], points[1][1]-points[0][1], points[1][2]-points[0][2]];
    //       var vec2 = [points[2][0]-points[0][0], points[2][1]-points[0][1], points[2][2]-points[0][2]];
    //       var normal = vec3.normalize(vec3.cross(vec1,vec2,[]));
    //     
    //       for(var d = 0; d < 3; d++) {
    //         if(smoothNormals[index[d]] != undefined) {
    //           vec3.add(smoothNormals[index[d]],normal);
    //           smoothNormals[index[d]] = normal;
    //         }else {
    //           smoothNormals[index[d]] = normal;
    //         }
    //       }
    //     
    //     }; 
    
    // for(var y=0; y< numberOfIndexes; y++) {
    //       var normal = vec3.normalize(smoothNormals[shape.indexArray[y]],[]);
    //       shape.normalArray.push(normal[0]);
    //       shape.normalArray.push(normal[1]);
    //       shape.normalArray.push(normal[2]);
    //       if(y ==0){
    //         console.log(normal);
    //         console.log(shape.normalArray[shape.normalArray.length-1]);
    //         console.log(shape.normalArray[shape.normalArray.length-2]);
    //         console.log(shape.normalArray[shape.normalArray.length-3]);
    //       }
    //     }  
    
    
    
    
    //}
    
    //console.log("VERTICES: " + shape.vertexArray.length);
    //console.log("NORMALS: " + shape.normalArray.length);
    shape.positionArray = vertexArray;
    if (shape.colorArray.length == 0) {
      shape.colorArray = [0.8,0.8,0.8,1.0];
    }
    //shape.colorArray = [0.8,0.8,0.8,1.0];
    //shape.nonindexed = true;
  }
  
  obj.objectClass = 'P';
  obj.vertexArray = vertexArray;
  obj.texCoordArray = texCoordArray;
};