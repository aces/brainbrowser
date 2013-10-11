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
 
BrainBrowser.core.models = function(bb) {
  "use strict";
    
  //////////////////////////////
  // INTERFACE
  /////////////////////////////
  
  // Display an object file.
  // Handles polygon-based and line-based models. Polygon models that have exactly
  // 81924 vertices are assumed to be brain models and are handled separately so the
  // hemispheres can be separated.
  //
  // @param {Object} obj object representing the model to be displayed
  // @param {String} filename name of the original file
  bb.displayObjectFile = function(obj, filename, opts) {
    var options = opts || {};
    var renderDepth = options.renderDepth;
    var afterDisplay = options.afterDisplay;
    
    if (obj.objectClass === 'P' && obj.numberVertices === 81924) {
      addBrain(obj, renderDepth);
    } else if(obj.objectClass === 'P') {
      addPolygonObject(obj,filename, renderDepth);
    } else if(obj.objectClass === 'L') {
      addLineObject(obj, filename, false, renderDepth);
    } else {
      alert("Object file not supported");
    }
    if(bb.afterDisplayObject) {
      bb.afterDisplayObject(bb.model);
    }
    
    if (afterDisplay) afterDisplay();
  };
    
  //////////////////////////////
  // PRIVATE FUNCTIONS
  /////////////////////////////

  
  // Add a brain model to the scene.
  function addBrain(obj) {
    var model = bb.model;
    var left, right;
    
    bb.model_data = obj;
    left = createHemisphere(obj.left);
    left.name = "left";
    left.model_num = 0;
    right = createHemisphere(obj.right);
    right.name = "right";
    right.model_num = 1;
    model.add(left);
    model.add(right);
  }
  
  // Add an individual brain hemisphere to the scene.
  function createHemisphere(obj) {
    var verts = obj.positionArray;
    var ind = obj.indexArray;
    var bounding_box = {};
    var centroid = {};
    var face;
    var i, count;
    var geometry, vertices, faces, material, hemisphere;
    
    //Calculate center so positions of objects relative to each other can
    // defined (mainly for transparency).
    for(i = 0, count = verts.length; i + 2 < count; i += 3) {
      boundingBoxUpdate(bounding_box, verts[i], verts[i+1], verts[i+2]);
    }
    centroid.x = bounding_box.minX + 0.5 * (bounding_box.maxX - bounding_box.minX);
    centroid.y = bounding_box.minY + 0.5 * (bounding_box.maxY - bounding_box.minY);
    centroid.z = bounding_box.minY + 0.5 * (bounding_box.maxZ - bounding_box.minZ);
    
    geometry = new THREE.Geometry();
    vertices = geometry.vertices;
    
    for (i = 0, count = verts.length; i + 2 < count; i += 3) {
      vertices.push(new THREE.Vector3(verts[i]-centroid.x, verts[i+1]-centroid.y, verts[i+2]-centroid.z));
    }
    
    faces = geometry.faces;
    for (i = 0, count = ind.length; i + 2 < count; i += 3) {
      face = new THREE.Face3(ind[i], ind[i+1], ind[i+2]);
      face.vertexColors = [new THREE.Color(), new THREE.Color(), new THREE.Color()];
      faces.push(face);
    }
    
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    
    material = new THREE.MeshPhongMaterial({color: 0xFFFFFF, ambient: 0x0A0A0A, specular: 0xFFFFFF, shininess: 100, vertexColors: THREE.VertexColors});
    hemisphere = new THREE.Mesh(geometry, material);
    hemisphere.centroid = centroid;
    hemisphere.position.set(centroid.x, centroid.y, centroid.z);
    
    return hemisphere;
  }

  //Add a line model to the scene.
  function addLineObject(obj, filename, mesh, renderDepth) {
    var model = bb.model;
    var lineObject = createLineObject(obj, mesh);
    lineObject.name = filename;
    if (renderDepth) {
      lineObject.renderDepth = renderDepth;
    }

    model.add(lineObject);
  }

  //Create a line model.
  function createLineObject(obj, mesh) {
    var model_data = obj;
    var indices = [];
    var verts = [];
    var colors = [];
    var bounding_box = {};
    var centroid = {};
    var i, j, k, count;
    var nitems = model_data.nitems;
    var start;
    var indexArray;
    var endIndex;
    var colorArray = [];
    var col;
    var geometry, material, lineObject;
    var posArray;
    
    bb.model_data = model_data;

    for (i = 0; i < nitems; i++){
      if (i === 0){
        start = 0;
      } else {
        start = model_data.endIndicesArray[i-1];
      }
      indices.push(model_data.indexArray[start]);
      indexArray = model_data.indexArray;
      endIndex = model_data.endIndicesArray[i];
      for (k = start + 1; k < endIndex - 1; k++) {
        indices.push(indexArray[k]);
        indices.push(indexArray[k]);
      }
      indices.push(indexArray[endIndex-1]);
    }
    
    posArray = bb.model_data.positionArray;
  
    //Calculate center so positions of objects relative to each other can be determined.
    //Mainly for transparency.
    for (j = 0, count = indices.length; j < count; j++) {
      boundingBoxUpdate(bounding_box, posArray[indices[j]*3], posArray[indices[j]*3+1], posArray[indices[j]*3+2]);
    }
    
    centroid.x = bounding_box.minX + 0.5 * (bounding_box.maxX - bounding_box.minX);
    centroid.y = bounding_box.minY + 0.5 * (bounding_box.maxY - bounding_box.minY);
    centroid.z = bounding_box.minY + 0.5 * (bounding_box.maxZ - bounding_box.minZ);
    
    if (!mesh) {
      for (j = 0, count = indices.length; j < count; j++) {
        verts.push(new THREE.Vector3(
                      posArray[indices[j]*3] - centroid.x,
                      posArray[indices[j]*3+1] - centroid.y,
                      posArray[indices[j]*3+2] - centroid.z
                    ));
      }
      
      if (model_data.colorArray.length === 4) {
        for (i = 0; i < verts.length; i++) {
          colorArray.push(0.5, 0.5, 0.7, 1);
        }
      } else {
        colorArray = bb.model_data.colorArray;
        
        for(j = 0, count = indices.length; j < count; j++) {
          col = new THREE.Color();
          col.setRGB(colorArray[indices[j]*4], colorArray[indices[j]*4+1], colorArray[indices[j]*4+2]);
          colors.push(col);
        }
      }
      
    } else {
      verts = bb.model_data.meshPositionArray;
      colors = bb.model_data.meshColorArray;
    }

    
    geometry = new THREE.Geometry();
    geometry.vertices = verts;
    geometry.colors = colors;

    geometry.colorsNeedUpdate = true;
    
    material = new THREE.LineBasicMaterial({vertexColors: THREE.VertexColors});
    lineObject = new THREE.Line(geometry, material, THREE.LinePieces);
    lineObject.position.set(centroid.x, centroid.y, centroid.z);
    lineObject.centroid = centroid;
    
    return lineObject;
  }
  
  // Add a polygon object to the scene.
  function addPolygonObject(obj, filename){
    var model = bb.model;
    var shape;
    var i, count;
    var model_data = obj;
    var shapes = model_data.shapes;
    
    bb.model_data = model_data;
    if (shapes){
      for (i = 0, count = shapes.length; i < count; i++){
        shape = createPolygonShape(bb.model_data.shapes[i]);
        shape.name = bb.model_data.shapes[i].name || (filename.split(".")[0] + "_" + i);
        model.add(shape);
      }
    }else {
      shape = createPolygonShape(bb.model_data);
      shape.name = filename;
      model.add(shape);
    }

    if(bb.afterCreate) {
      bb.afterCreate(bb.model_data);
    }
  }
  
  // Create a polygon object.
  function createPolygonShape(model_data) {
    var positionArray = model_data.positionArray;
    var indexArray  = model_data.indexArray;
    var model_data_color_array = model_data.colorArray;
    var i, j, count;
    var col;
    var all_gray = false;
    var geometry, material, polygonShape;
    var colors = [];
    var face;
    var faces;
    var data_faces = model_data.faces;
    var data_faces_length;
    var data_face;
    var data_face_length;
    var data_color_0, data_color_1, data_color_2;
    
    if(model_data_color_array.length === 4) {
      all_gray = true;
      data_color_0 = model_data_color_array[0];
      data_color_1 = model_data_color_array[1];
      data_color_2 = model_data_color_array[2];
    }
    
    colors = [];
    geometry = new THREE.Geometry();
    for (i = 0, count = positionArray.length/3; i < count; i++) {
      geometry.vertices.push(new THREE.Vector3(positionArray[i*3], positionArray[i*3+1], positionArray[i*3+2]));
      col = new THREE.Color();
      if (!all_gray) {
        col.setRGB(model_data_color_array[i*4], model_data_color_array[i*4+1], model_data_color_array[i*4+2]);
      } else {
        col.setRGB(data_color_0, data_color_1, data_color_2);
      }
      colors.push(col);
    }
    
    faces = geometry.faces;
    if (data_faces && data_faces.length > 0) {
      data_faces_length = data_faces.length;
      for(i = 0; i < data_faces_length; i++) {
        data_face = data_faces[i];
        data_face_length = data_face.length;
        if (data_face_length < 3) continue;
        if (data_face_length <= 4){
          if (data_face_length <= 3) {
            face = new THREE.Face3(data_face[0], data_face[1], data_face[2]);
          } else if (data_face_length === 4){
            face = new THREE.Face4(data_face[0], data_face[1], data_face[2], data_face[3]);
          }

          face.vertexColors = [colors[face.a], colors[face.b], colors[face.c]];
          if (data_face_length > 3) {
            face.vertexColors[3] = colors[face.d];
          }
          faces.push(face);
        } else {
          for (j = 1; j + 1 < data_face_length; j++) {
            face = new THREE.Face3(data_face[0], data_face[j], data_face[j+1]);
            face.vertexColors = [colors[face.a], colors[face.b], colors[face.c]];
            faces.push(face);
          }
        }
      }
    } else {
      for(i = 0; i + 2 < indexArray.length; i+=3) {
        face = new THREE.Face3(indexArray[i], indexArray[i+1], indexArray[i+2]);
        face.vertexColors[0] = colors[face.a];
        face.vertexColors[1] = colors[face.b];
        face.vertexColors[2] = colors[face.c];
        geometry.faces.push(face);
      }
    }
    
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    geometry.colorsNeedUpdate = true;

    material = new THREE.MeshPhongMaterial({color: 0xFFFFFF, ambient: 0x0A0A0A, specular: 0xFFFFFF, shininess: 100, vertexColors: THREE.VertexColors});
    
    polygonShape = new THREE.Mesh(geometry, material);
    
    return polygonShape;
  }
  
  // Update current values of the bounding box of
  // an object.
  function boundingBoxUpdate(box, x, y, z) {
    if (!box.minX || box.minX > x) {
      box.minX = x;
    }
    if (!box.maxX || box.maxX < x) {
      box.maxX = x;
    }
    if (!box.minY || box.minY > y) {
      box.minY = y;
    }
    if (!box.maxY || box.maxY < y) {
      box.maxY = y;
    }
    if (!box.minZ || box.minZ > z) {
      box.minZ = z;
    }
    if (!box.maxZ || box.maxZ < z) {
      box.maxZ = z;
    }
  }
  
};
