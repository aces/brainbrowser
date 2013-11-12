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

BrainBrowser.SurfaceViewer.core.models = function(viewer) {
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
  viewer.displayObjectFile = function(obj, filename, options) {
    options = options || {};
    var renderDepth = options.renderDepth;
    var complete = options.complete;

    addObject(obj, filename, renderDepth);

    viewer.triggerEvent("displayobject", viewer.model);

    if (complete) complete();
  };

  //////////////////////////////
  // PRIVATE FUNCTIONS
  /////////////////////////////

  // Add a polygon object to the scene.
  function addObject(model_data, filename, renderDepth){
    var model = viewer.model;
    var shape, shape_data;
    var i, count;
    var shapes = model_data.shapes;

    var is_line = model_data.objectClass === "L";

    viewer.model_data = model_data;
    if (shapes){
      for (i = 0, count = shapes.length; i < count; i++){
        shape_data = model_data.shapes[i];
        shape = createObject(shape_data, is_line);
        shape.name = shape_data.name || filename;
        
        shape.geometry.original_data = {
          vertices: model_data.positionArray,
          indices: shape_data.indexArray,
          normals: model_data.normalArray,
          colors: model_data.colorArray
        };

        if (renderDepth) {
          shape.renderDepth = renderDepth;
        }
        model.add(shape);
      }

      if (model_data.split) {
        model.children[0].name = "left";
        model.children[0].model_num = 0;
        model.children[1].name = "right";
        model.children[1].model_num = 1;
      }
    }
  }

  function createObject(shape_data, is_line) {
    var unindexed = shape_data.unindexed;
    var wireframe = shape_data.wireframe;
    var centroid = shape_data.centroid;

    var position = unindexed.position;
    var normal = unindexed.normal || [];
    var color = unindexed.color || [];


    var geometry = new THREE.BufferGeometry();
    var material, shape;

    geometry.dynamic = true;

    geometry.attributes.position = {
      itemSize: 3,
      array: new Float32Array(position),
      numItems: position.length
    };


    if (normal.length > 0) {
      geometry.attributes.normal = {
        itemSize: 3,
        array: new Float32Array(normal),
      };
    } else {
      geometry.computeVertexNormals();
    }

    if(color.length > 0) {
      geometry.attributes.color = {
        itemSize: 4,
        array: new Float32Array(color),
      };
    }

    if (is_line) {
      material = new THREE.LineBasicMaterial({vertexColors: THREE.VertexColors});
      shape = new THREE.Line(geometry, material, THREE.LinePieces);
    } else {
      material = new THREE.MeshPhongMaterial({color: 0xFFFFFF, ambient: 0x0A0A0A, specular: 0xFFFFFF, shininess: 100, vertexColors: THREE.VertexColors});
      shape = new THREE.Mesh(geometry, material);
      shape.add(createWireframe(shape, wireframe));
    }

    shape.centroid = centroid;
    shape.position.set(centroid.x, centroid.y, centroid.z);
  
    return shape;
  }

  function createWireframe(object, wireframe_data) {
    var wire_geometry = new THREE.BufferGeometry();
    var material, wireframe;

    wire_geometry.attributes.position = {
      itemSize: 3,
      array: wireframe_data.position,
      numItems: wireframe_data.position.length
    };

    wire_geometry.attributes.color = {
      itemSize: 4,
      array: wireframe_data.color,
    };

    wire_geometry.attributes.color.needsUpdate = true;

    material = new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors });
    wireframe = new THREE.Line(wire_geometry, material, THREE.LinePieces);

    wireframe.name = "__wireframe__";
    wireframe.visible = false;
    object.wireframe_active = false;

    return wireframe;
  }

};
