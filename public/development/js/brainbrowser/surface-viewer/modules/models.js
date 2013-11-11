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
        shape = createObject(shape_data.unindexed, is_line);
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
      if (model_data.num_hemispheres === 2) {
        model.children[0].name = "left";
        model.children[0].model_num = 0;
        model.children[1].name = "right";
        model.children[1].model_num = 1;
      }
    }
  }

  function createObject(parameters, is_line) {
    var position = parameters.position;
    var normal = parameters.normal || [];
    var color = parameters.color || [];
    var centroid = parameters.centroid;


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
      shape.add(createWireframe(shape));
    }

    shape.centroid = centroid;
    shape.position.set(centroid.x, centroid.y, centroid.z);
  
    return shape;
  }

  function createWireframe(object) {
    var geometry = object.geometry;
    var wire_geometry = new THREE.BufferGeometry();
    var attributes = geometry.attributes;
    var verts = attributes.position.array;
    var has_color = !!attributes.color;
    var wire_verts = new Float32Array(verts.length * 2);
    var colors, wire_colors;
    var material, wireframe;
    var i, iw, iv, ic, iwc, count;
    var color_options;

    if (has_color) {
      colors = attributes.color.array;
      wire_colors = new Float32Array(colors.length * 2);
      color_options = { vertexColors: THREE.VertexColors };
    } else {
      color_options = { color: 0xFFFFFF };
    }

    // Just map triangle to a wireframe by mapping
    // v1, v2, v3 to v1, v2, v2, v3, v3, v1
    for(i = 0, count = verts.length / 3; i < count; i += 3) {
      iv = i * 3;
      iw = iv * 2;
      ic = i * 4;
      iwc = ic * 2;

      // v1 -v2
      wire_verts[iw] = verts[iv];
      wire_verts[iw + 1] = verts[iv + 1];
      wire_verts[iw + 2] = verts[iv + 2];
      wire_verts[iw + 3] = verts[iv + 3];
      wire_verts[iw + 4] = verts[iv + 4];
      wire_verts[iw + 5] = verts[iv + 5];

      // v2 - v3
      wire_verts[iw + 6] = verts[iv + 3];
      wire_verts[iw + 7] = verts[iv + 4];
      wire_verts[iw + 8] = verts[iv + 5];
      wire_verts[iw + 9] = verts[iv + 6];
      wire_verts[iw + 10] = verts[iv + 7];
      wire_verts[iw + 11] = verts[iv + 8];

      // v3 - v1
      wire_verts[iw + 12] = verts[iv + 6];
      wire_verts[iw + 13] = verts[iv + 7];
      wire_verts[iw + 14] = verts[iv + 8];
      wire_verts[iw + 15] = verts[iv];
      wire_verts[iw + 16] = verts[iv + 1];
      wire_verts[iw + 17] = verts[iv + 2];

      if (has_color) {
         // v1 -v2
        wire_colors[iwc] = colors[ic];
        wire_colors[iwc + 1] = colors[ic + 1];
        wire_colors[iwc + 2] = colors[ic + 2];
        wire_colors[iwc + 3] = colors[ic + 3];
        wire_colors[iwc + 4] = colors[ic + 4];
        wire_colors[iwc + 5] = colors[ic + 5];
        wire_colors[iwc + 6] = colors[ic + 6];
        wire_colors[iwc + 7] = colors[ic + 7];

        // v2 - v3
        wire_colors[iwc + 8] = colors[ic + 4];
        wire_colors[iwc + 9] = colors[ic + 5];
        wire_colors[iwc + 10] = colors[ic + 6];
        wire_colors[iwc + 11] = colors[ic + 7];
        wire_colors[iwc + 12] = colors[ic + 8];
        wire_colors[iwc + 13] = colors[ic + 9];
        wire_colors[iwc + 14] = colors[ic + 10];
        wire_colors[iwc + 15] = colors[ic + 11];
        
        // v3 - v1
        wire_colors[iwc + 16] = colors[ic + 8];
        wire_colors[iwc + 17] = colors[ic + 9];
        wire_colors[iwc + 18] = colors[ic + 10];
        wire_colors[iwc + 19] = colors[ic + 11];
        wire_colors[iwc + 20] = colors[ic];
        wire_colors[iwc + 21] = colors[ic + 1];
        wire_colors[iwc + 22] = colors[ic + 2];
        wire_colors[iwc + 23] = colors[ic + 3];
      }
     
    }

    wire_geometry.attributes.position = {
      itemSize: 3,
      array: wire_verts,
      numItems: wire_verts.length
    };

    if (has_color) {
      wire_geometry.attributes.color = {
        itemSize: 4,
        array: wire_colors,
        numItems: wire_colors.length
      };

      wire_geometry.attributes.color.needsUpdate = true;
    }

    material = new THREE.LineBasicMaterial(color_options);
    wireframe = new THREE.Line(wire_geometry, material, THREE.LinePieces);

    wireframe.name = "__wireframe__";
    wireframe.visible = false;
    object.wireframe_active = false;

    return wireframe;
  }

};
