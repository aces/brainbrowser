/*
* BrainBrowser: Web-based Neurological Visualization Tools
* (https://brainbrowser.cbrain.mcgill.ca)
*
* Copyright (C) 2011
* The Royal Institution for the Advancement of Learning
* McGill University
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
* Author: Tarek Sherif <tsherif@gmail.com> (http://tareksherif.ca/)
* Author: Paul Mougel
* Author: Lindsay Lewis <lindsayblewis@gmail.com>
* Author: Natacha Beck <natabeck@gmail.com>
*/


/*

  A quick overview of how the elements are arranged within the scene:

                   +-------+
        +----------+ scene +-----------+
        |          +-------+           |
        |                              |
        |                              |
        |                              |
        |                              |
        |                              |
+-------+-------+             +--------+---------+
|  lightSystem  |             |  graphicObjects  +------------+
+---------------+     +-------+-+-----------+----+            |
                      |         |            |                |
                      |         |            |                |
                      |         |            |                |
                      |         |            |                |
                      |         |            |                |
           +----------+-+  +----+-+      +---+---+        +---+---+
           | pickMarker |  | axis |      |  grid |        | model |
           +------------+  +------+      +-------+        +-+-----+
                                                              |
                                                          +---+----+
                                                          | mesh01 |
                                                          | mesh02 |
                                                          | mesh03 |
                                                          | ...    |
                                                          +--------+

  When dragging, graphicObjects is spinning around its center so that the shapes
  (aka. model), the grid and the axis are turning all together.

*/

BrainBrowser.SurfaceViewer.modules.rendering = function(viewer) {
  "use strict";

  var THREE = BrainBrowser.SurfaceViewer.THREE;

  var renderer = new THREE.WebGLRenderer({
    preserveDrawingBuffer: true,
    alpha: true,
    autoClear: false//,
    /*antialias: true*/
  });
  var scene = new THREE.Scene();
  viewer.scene = scene;
  var camera = new THREE.PerspectiveCamera(30, viewer.dom_element.offsetWidth / viewer.dom_element.offsetHeight, 1, 3000);
  viewer.camera = camera;
  var default_camera_distance = 500;

  viewer.totalOffset = new THREE.Vector3();


  viewer.lightSystem = new THREE.Object3D();
  var intensity = 1;
  var light1 = new THREE.PointLight(0xFFFFFF, intensity);
  viewer.lightSystem.add(light1);
  viewer.lightSystem.position.set(0, 0, 0);
  viewer.lightSystem.name = "lightSystem";

  var current_frame;
  var last_frame;
  var effect = renderer;
  var effects = {};
  var canvas = renderer.domElement;
  var old_zoom_level;

  viewer.model = new THREE.Object3D();
  viewer.model.name = "model";
  viewer.graphicObjects = new THREE.Object3D();
  viewer.graphicObjects.name = "viewer.graphicObjects";

  scene.add(viewer.graphicObjects);
  viewer.graphicObjects.add(viewer.model);

  viewer.annotationSystem = new THREE.Object3D();
  viewer.annotationSystem.name = "annotationSystem";
  viewer.graphicObjects.add(viewer.annotationSystem);

  viewer.pickMarker = new THREE.Object3D();
  viewer.pickMarker.name = "pickMarker";
  viewer.graphicObjects.add(viewer.pickMarker);

  // to set later
  viewer.gridSystem = null;

  // to set later
  viewer.axis = null;


  // callback for when the graphic objects are dragged
  viewer.onDraggedCallback = null;

// For debugging purpose only
// var axisHelper = new THREE.AxisHelper( 20 );
// scene.add( axisHelper );

  /**
  * @doc function
  * @name viewer.rendering:render
  * @description
  * Start the render loop.
  * ```js
  * viewer.render();
  * ```
  */
  viewer.render = function() {
    var dom_element = viewer.dom_element;
    renderer.setClearColor(0x000000);
    dom_element.appendChild(renderer.domElement);

    camera.position.z = default_camera_distance;


    // light positioning
    light1.position.set(default_camera_distance/8, default_camera_distance/4, default_camera_distance);
    //light2.position.set(-default_camera_distance, 0, default_camera_distance);
    //light3.position.set(default_camera_distance, default_camera_distance, default_camera_distance);
    //light4.position.set(default_camera_distance, -default_camera_distance, default_camera_distance);
    //light5.position.set(0, default_camera_distance, 0);
    //light6.position.set(0, -default_camera_distance, 0);

    scene.add(viewer.lightSystem);

    //scene.add( ambientLight );

    viewer.updateViewport();

    renderFrame();
  };

  /**
  * @doc function
  * @name viewer.rendering:updateViewport
  * @description
  * Update the viewport size and aspect ratio to fit
  * the current size of the viewer DOM element.
  * ```js
  * viewer.updateViewport();
  * ```
  */
  viewer.updateViewport = function() {
    var dom_element = viewer.dom_element;

    effect.setSize(dom_element.offsetWidth, dom_element.offsetHeight);
    camera.aspect = dom_element.offsetWidth / dom_element.offsetHeight;
    camera.updateProjectionMatrix();

    viewer.updated = true;
  };

  /**
  * @doc function
  * @name viewer.rendering:canvasDataURL
  * @returns {string} The data URL.
  * @description
  * Returns the Data URL of the canvas the viewer is using
  * so it can be used to create an image.
  * ```js
  * viewer.canvasDataURL();
  * ```
  */
  viewer.canvasDataURL = function() {
    return renderer.domElement.toDataURL();
  };

  /**
  * @doc function
  * @name viewer.rendering:addEffect
  * @param {string} effect_name The name of the effect as defined in three.js.
  * @description
  * Add a three.js postprocessing effect to the viewer.
  * ```js
  * viewer.addEffect("AnaglyphEffect");
  * ```
  */
  viewer.addEffect = function(effect_name) {
    var effect;
    if (BrainBrowser.utils.isFunction(THREE[effect_name])) {
      effect = new THREE[effect_name](renderer);
      effect.setSize(viewer.dom_element.offsetWidth, viewer.dom_element.offsetHeight);

      effects[effect_name] = effect;
    }
  };

  /**
  * @doc function
  * @name viewer.rendering:setEffect
  * @param {string} effect_name The name of the effect as defined in three.js.
  * @description
  * Activate a previously added postprocessing effect.
  * ```js
  * viewer.setEffect("AnaglyphEffect");
  * ```
  */
  viewer.setEffect = function(effect_name) {
    effect = effects[effect_name] ? effects[effect_name] : renderer;
    effect.setSize(viewer.dom_element.offsetWidth, viewer.dom_element.offsetHeight);
    effect.render(scene, camera);  // Not sure why: effects seem to need to render twice before they work properly.

    viewer.updated = true;
  };

  /**
  * @doc function
  * @name viewer.rendering:setCameraPosition
  * @param {number} x The x coordinate of the camera.
  * @param {number} y The y coordinate of the camera.
  * @param {number} z The z coordinate of the camera.
  * @description
  * Set the camera position.
  * ```js
  * viewer.setCameraPosition(10, 25, 12);
  * ```
  */
  viewer.setCameraPosition = function(x, y, z) {
    camera.position.set(x, y, z);
    //light.position.set(x, y, z);


    viewer.updated = true;
  };

  /**
  * @doc function
  * @name viewer.rendering:getCameraPosition
  * @description
  * Get the camera position.
  * ```js
  * viewer.getCameraPosition();
  * ```
  */
  viewer.getCameraPosition = function() {
    return camera.position;
  };


  /*
    Added by jo
  */
  viewer.resetView2 = function() {
    viewer.graphicObjects.rotation.set(0, 0, 0);
    camera.position.set(0, 0, default_camera_distance);
    viewer.lightSystem.position.set(0, 0, 0);
    viewer.zoom = 1;
    viewer.updated = true;
  };

  /**
  * @doc function
  * @name viewer.rendering:setClearColor
  * @param {number} color A hexadecimal number representing the RGB color to use.
  * @param {number} define the opacity.
  * @description
  * Updates the clear color of the viewer.
  * ```js
  * viewer.setClearColor(0xFF0000);
  * ```
  */
  viewer.setClearColor = function(color,alpha)  {
    if (alpha === undefined) alpha = 1;
    renderer.setClearColor(color, alpha);

    viewer.updated = true;
  };

  /**
  * @doc function
  * @name viewer.rendering:drawLine
  * @param {object} start A Vector3, start of the line segment
  * @param {object} end A Vector3, end of the line segment
  * @param {object} options Options, which include the following:
  *
  * * **color** The color of the line as a hexadecimal integer (default 0x444444).
  * * **dashed** If true create a dashed line
  * * **draw**   If false don't draw the line
  *
  * @returns {object} The line itself.
  *
  * @description Draw a line in the current scene.
  * ```js
  * var start = new THREE.Vector3(0,0,0);
  * var end   = new THREE.Vector3(200,200,200);
  * viewer.drawLine(start, end, {dashed: true});
  * ```
  */
  viewer.drawLine = function( start, end, options ) {
    options      = options || {};
    var color    = options.color >= 0 ? options.color : 0x444444;

    // Create the geometry
    var geometry = new THREE.Geometry();
    geometry.vertices.push( start.clone() );
    geometry.vertices.push( end.clone() );
    geometry.computeLineDistances();

    // Set the material according with the dashed option
    var material = options.dashed === true ?
                     new THREE.LineDashedMaterial({ linewidth: 3, color: color, gapSize: 3 })
                   : new THREE.LineBasicMaterial( { linewidth: 3, color: color });

    var line = new THREE.Line( geometry, material, THREE.LinePieces );

    if (options.draw === false) {return line;}

    if (viewer.model) {
      viewer.model.add(line);
    } else {
      scene.add(line);
    }

    viewer.updated = true;

    return line;
  };

  /**
  * @doc function
  * @name viewer.rendering:setPickMarker
  * @param {object} vector3 A Vector3, position of the point
  * @param {number} radius Radius of the sphere (default: 2).
  * @param {number} color Color of the sphere as a hexadecimal integer (default: 0xFF0000).
  *
  * @description Draw a sphere.
  * ```js
  * var vector3 = new THREE.Vector3(1,0,1);
  * viewer.drawDot(vector3, 0.3, 0x00FF00);
  * ```
  */
  viewer.setPickMarker = function (vector3, radius, color) {
    radius = radius || 2;
    radius = radius >= 0 ? radius : 0;
    color  = color  >= 0 ? color  : 0xFF0000;

    if (viewer.pickMarker.children.length === 0) {
      var geometry = new THREE.SphereGeometry(radius);
      var material = new THREE.MeshBasicMaterial({color: color});

      var sphere   = new THREE.Mesh(geometry, material);
      sphere.position.set(vector3.x, vector3.y, vector3.z);

      viewer.pickMarker.add(sphere);
      viewer.graphicObjects.add(viewer.pickMarker)
    } else {
      viewer.pickMarker.children[0].position.set(vector3.x, vector3.y, vector3.z);
    }

    viewer.updated = true;
  }

  /**
  * @doc function
  * @name viewer.rendering:updateAxes
  * @param {number} size Define the size of the line representing the axes.
  * @param {object} options Options, which include the following:
  *
  * * **name** The name of the axes
  * * **center** A Vector3, that represent the orgin of the axes
  * * **x_color** The color of the line as a hexadecimal integer (default 0xff0000).
  * * **y_color** The color of the line as a hexadecimal integer (default 0x00ff00).
  * * **z_color** The color of the line as a hexadecimal integer (default 0x0000ff).
  * * **complete** If true draw postive (plain) and negative axes (dashed)
  *
  *
  * @returns {object} The axes itself.
  *
  * @description
  * Draw Axes in the current scene
  * ```js
  *   viewer.updateAxes(300)
  * ```
  */
  viewer.updateAxes = function(size, options) {
    options      = options || {};
    var name     = options.name   || "axes";
    var center   = options.center || new THREE.Vector3(0,0,0);
    var x_color  = options.x_color >= 0 ? options.x_color : 0xff0000 ;
    var y_color  = options.y_color >= 0 ? options.y_color : 0x00ff00 ;
    var z_color  = options.z_color >= 0 ? options.z_color : 0x0000ff ;
    var complete = options.complete === true;
    var visible = options.visible === undefined ? false : options.visible;

    // if already existing, we just remove them and build new ones
    if(viewer.axes){
      // keep this state for later
      visible = viewer.axes.visible;
      viewer.graphicObjects.remove(viewer.axes);
    }

    viewer.axes  = new THREE.Object3D();
    viewer.axes.name = name;

    // the size is based on the size of the grid (largest bounding sphere)
    if (size === undefined || size === null) {
      var largestSize = 0;

      viewer.gridSystem.children.forEach( function(gridElem){
        var radius = gridElem.geometry.boundingSphere.radius;
        largestSize = Math.max(largestSize, radius);
      });

      size = largestSize;
    }

    // X axes
    viewer.axes.add(viewer.drawLine(center, new THREE.Vector3( center.x + size, center.y, center.z), {color: x_color, dashed: false, draw: false}));
    if (complete) { viewer.axes.add(viewer.drawLine(center, new THREE.Vector3(-size + center.x, center.y, center.z), {color: x_color, dashed: true , draw: false})); }

    // Y axes
    viewer.axes.add(viewer.drawLine(center, new THREE.Vector3(center.x, center.y + size, center.z), {color: y_color, dashed: false, draw: false}));
    if (complete) { viewer.axes.add(viewer.drawLine(center, new THREE.Vector3(center.x, -size + center.y, center.z), {color: y_color, dashed: true, draw: false})); }

    // Z axes
    viewer.axes.add(viewer.drawLine(center, new THREE.Vector3(center.x, center.y, center.z + size), {color: z_color, dashed: false, draw: false}));
    if (complete) { viewer.axes.add(viewer.drawLine(center, new THREE.Vector3(center.x, center.y, -size + center.z), {color: z_color, dashed: true,  draw: false})); }

    viewer.axes.visible = visible;
    viewer.graphicObjects.add(viewer.axes);

    viewer.updated = true;
  };


  /*
    show the axes if not visible, hide if visible, create them if not existing
  */
  viewer.toggleAxes = function(){
    if(!viewer.axes){
      viewer.updateAxes(null, {visible: true});
    }else{
      viewer.axes.visible = ! viewer.axes.visible;
      viewer.updated = true;
    }
  };


  /**
  * @doc function
  * @name viewer.rendering:pick
  * @param {number} x The x coordinate on the canvas (defaults to current mouse position).
  * @param {number} y The y coordinate on the canvas (defaults to current mouse position).
  * @param {number} opacity_threshold ignore shape that have opacity lower than the opacity_threshold integer between 0 and 100,
  * @returns {object} If an intersection is detected, returns an object with the following information:
  *
  * * **object** The THREE.Object3D object with which the the click intersected.
  * * **point** A THREE.Vector3 object representing the point in 3D space at which the intersection occured.
  * * **index** The index of the intersection point in the list of vertices.
  *
  * Otherwise returns **null**.
  *
  * @description
  * Returns information about the displayed object
  * and a certain x and y on the canvas. Defaults to
  * the current mouse position.
  * ```js
  * viewer.pick();              // Pick at current mouse position.
  * viewer.pick(125, 250);      // Pick at given position.
  * viewer.pick(125, 250, 25);  // Pick at given position only if opacity of shape is >= to 25%.
  * ```
  */
  viewer.pick = function(x, y, opacity_threshold) {
    x = x === undefined ? viewer.mouse.x : x;
    y = y === undefined ? viewer.mouse.y : y;
    opacity_threshold = opacity_threshold === undefined ? 0.25 : (opacity_threshold / 100.0);

    // Convert to normalized device coordinates.
    x = (x / viewer.dom_element.offsetWidth) * 2 - 1;
    y = (-y / viewer.dom_element.offsetHeight) * 2 + 1;

    var model = viewer.model;
    var raycaster    = new THREE.Raycaster();
    var vector       = new THREE.Vector3(x, y, camera.near);
    var intersection = null;
    var intersects, vertex_data;
    var intersect_object, intersect_point, intersect_indices, intersect_face;
    var intersect_vertex_index, intersect_vertex_coords;
    var min_distance;
    var original_vertices, original_indices;
    var index, coords, distance;
    var i, count;
    var centroid, cx, cy, cz;

    // Because we're comparing against
    // the vertices in their original positions,
    // we have move everything to place the model at its
    // original position.
    var inv_matrix = new THREE.Matrix4();

    vector.unproject(camera);
    raycaster.set(camera.position, vector.sub(camera.position).normalize());
    intersects = raycaster.intersectObject(model, true);

    for (i = 0; i < intersects.length; i++) {

      // avoid the grid
      if(intersects[i].object.parent.name === "grid"){
        continue;
      }

      intersects[i].object.userData.pick_ignore = (intersects[i].object.material.opacity < opacity_threshold) ? true : false;
      if (!intersects[i].object.userData.pick_ignore) {
        intersection = intersects[i];
        break;
      }
    }

    if (intersection !== null) {

      intersect_object = intersection.object;
      intersect_face = intersection.face;
      intersect_indices = [
        intersect_face.a,
        intersect_face.b,
        intersect_face.c
      ];

      if (intersect_object.userData.annotation_info) {
        vertex_data = {
          index: intersect_object.userData.annotation_info.vertex,
          point: intersect_object.userData.annotation_info.position,
          object: intersect_object
        };
      } else {
        // We're dealing with an imported model.

        if (intersect_object.userData.recentered) {
          // Objects have their origins centered
          // to help with transparency, so to check
          // check against original vertices we have
          // move them back.
          centroid = intersect_object.userData.centroid;
          cx = centroid.x;
          cy = centroid.y;
          cz = centroid.z;
        } else {
          cx = cy = cz = 0;
        }


        inv_matrix.getInverse(intersect_object.matrixWorld);
        intersect_point = intersection.point.applyMatrix4(inv_matrix);

        original_vertices = intersect_object.userData.original_data.vertices;
        original_indices = intersect_object.userData.original_data.indices;


        index = intersect_indices[0];
        if (!BrainBrowser.WEBGL_UINT_INDEX_ENABLED) {
          // Have to get the vertex pointed to by the original index because of
          // the de-indexing (see workers/deindex.worker.js)
          index = original_indices[index];
        }
        intersect_vertex_index = index;

        intersect_vertex_coords = new THREE.Vector3(
          original_vertices[index*3],
          original_vertices[index*3+1],
          original_vertices[index*3+2]
        );

        //Compensate for a translated center.
        min_distance = intersect_point.distanceTo(
          new THREE.Vector3(
            intersect_vertex_coords.x - cx,
            intersect_vertex_coords.y - cy,
            intersect_vertex_coords.z - cz
          )
        );

        for (i = 1, count = intersect_indices.length; i < count; i++) {
          index = intersect_indices[i];
          if (!BrainBrowser.WEBGL_UINT_INDEX_ENABLED) {
            // Have to get the vertex pointed to by the original index because of
            // the de-indexing (see workers/deindex.worker.js)
            index = original_indices[index];
          }
          coords = new THREE.Vector3(
            original_vertices[index*3],
            original_vertices[index*3+1],
            original_vertices[index*3+2]
          );
          distance = intersect_point.distanceTo(
            new THREE.Vector3(
              coords.x - cx,
              coords.y - cy,
              coords.z - cz
            )
          );

          if (distance < min_distance) {
            intersect_vertex_index = index;
            intersect_vertex_coords = coords;
            min_distance = distance;
          }

        }

        vertex_data = {
          index: intersect_vertex_index,
          point: intersect_vertex_coords,
          object: intersect_object
        };
      }


    } else {
      vertex_data = null;
    }

    return vertex_data;
  };

  /**
  * @doc function
  * @name viewer.rendering:pickByVertex
  * @param {number} index Index of the vertex.
  * @param {object} options Options, which include the following:
  *
  * * **model_name**: if more than one model file has been loaded, refer to the appropriate
  * model using the **model_name** option.
  *
  * @returns {object} If an intersection is detected, returns an object with the following information:
  *
  * * **object** The THREE.Object3D object with which the the click intersected.
  * * **point** A THREE.Vector3 object representing the point in 3D space at which the intersection occured.
  * * **index** The index of the intersection point in the list of vertices.
  *
  * Otherwise returns **null**.
  *
  * @description
  *
  * ```js
  * viewer.pickByVertex(2356);
  * viewer.pickByVertex(2356, { model_name: "brain.obj" });
  * ```
  */
  viewer.pickByVertex = function(index, options) {
    var model = viewer.model;
    options   = options || {};

    if (index === undefined) {return null;}

    var vector = viewer.getVertex(index, {model_name: options.model_name});

    var intersect_object;
    var vertex_data;
    model.children.forEach(function(child) {
      if (Object.keys(child.userData).length === 0 && child.userData.constructor === Object) { return ; }
      if (Object.keys(child.userData).length !== 0 && child.userData.model_name !== options.model_name) { return ; }

      var vertices = child.geometry.attributes.index.array;
      var j;

      index = parseInt(index,0);
      for (j = 0; j < vertices.length; j++) {
        if (vertices[j] === index){
          intersect_object = child;
          vertex_data = {
            index: index,
            point: vector,
            object: intersect_object,
          };
          break;
        }
      }
    });
    return vertex_data;
  };


  /*
    Added by jo.

    The offset is computed based on the model, and then the same offset is
    applied to all the children of graphicObjects.

    Args:
      newCenter: THREE.Vector3 - center relative to inside graphicObject
  */
  viewer.changeCenterRotation2 = function(newCenter) {
    // var scene = viewer.graphicObjects.parent;
    // moving the model
    viewer.model.position.sub(newCenter);
    viewer.pickMarker.position.sub(newCenter);

    // moving the annotation system
    viewer.annotationSystem.position.sub(newCenter);

    viewer.updated = true;

    // updating the logic shapes with their new coodinates / box
    viewer.model_data.forEach(function(model_data){
      viewer.changeCenterRotationModelDataShapes(model_data, newCenter);
    });

    // to be able to reset to the original position
    // we place it in the end so it does not affect when
    // calling resetCenterRotation()
    viewer.totalOffset.add(newCenter);
  };


  /*
    Added by jo.

    place the content to the original position (as encoded in the file)
  */
  viewer.resetCenterRotation = function(){
    viewer.totalOffset.negate();
    viewer.changeCenterRotation2(viewer.totalOffset);
    viewer.totalOffset.set(0, 0, 0);
  };


  /*
    Change the center of rotation of every logic shapes that are into modelData.

    Args:
      modelData: model_data instance
      newCenter: THREE.Vector3 - coordinates to be placed to (0, 0, 0)
  */
  viewer.changeCenterRotationModelDataShapes = function(modelData, newCenter){

    // shifting the local overall bounding box
    modelData.bounding_box.min_x -= newCenter.x;
    modelData.bounding_box.min_y -= newCenter.y;
    modelData.bounding_box.min_z -= newCenter.z;
    modelData.bounding_box.max_x -= newCenter.x;
    modelData.bounding_box.max_y -= newCenter.y;
    modelData.bounding_box.max_z -= newCenter.z;

    // shifiting the bounding boxes and centroids of every inner shapes
    modelData.shapes.forEach(function(logicShape){

      logicShape.bounding_box.min_x -= newCenter.x;
      logicShape.bounding_box.min_y -= newCenter.y;
      logicShape.bounding_box.min_z -= newCenter.z;
      logicShape.bounding_box.max_x -= newCenter.x;
      logicShape.bounding_box.max_y -= newCenter.y;
      logicShape.bounding_box.max_z -= newCenter.z;

      logicShape.centroid.x -= newCenter.x;
      logicShape.centroid.y -= newCenter.y;
      logicShape.centroid.z -= newCenter.z;
    });

  };


  /*
    This will most likely occur at the loading or a new file, while some other files
    may have already been loaded and experienced a shift (to recenter).

  */
  viewer.shiftModelDataAccordingly = function(modelData){
    viewer.changeCenterRotationModelDataShapes(modelData, viewer.totalOffset);
  };



  /*
    Added by Jo.

    return viewer.totalOffset as an array [x, y, z] rather than a THREE.Vector3
  */
  viewer.getTotalOffset = function(){
    return [viewer.totalOffset.x, viewer.totalOffset.y, viewer.totalOffset.z];
  };



  // added by JO
  // TODO: sometimes, a shape has no name, so it can not search for it to rename it.
  // We should be doing this step in loading.
  /*
    Rename a shape (children of model) after having checked
    the name is not already taken.
  */
  viewer.updateShapeName = function(currentName, newName){
    var renamed = false;

    var shapeToRename = viewer.model.getObjectByName(currentName);

    // checking if the new name is already taken
    var doesNotExist = !viewer.model.getObjectByName(newName);

    if(doesNotExist && shapeToRename){
      console.log("renaming " + currentName + " __to__ " + newName);
      shapeToRename.name = newName;
      renamed = true;
    }else {
      console.log("ERROR renaming " + currentName + " __to__ " + newName);
      console.log(doesNotExist);
      console.log(shapeToRename);
    }

    console.log("----------------------");
    return true;
  };


  /*
    Define the callback to use when the model is dragged
  */
  viewer.onDragged = function(cb){
    viewer.onDraggedCallback = cb;
  };

  ////////////////////////////////////
  // PRIVATE FUNCTIONS
  ////////////////////////////////////

  // Render a single frame on the viewer.
  function renderFrame(timestamp) {
    var graphicObjects = viewer.graphicObjects;
    var delta;
    var rotation;
    var position = camera.position;
    var new_z    = default_camera_distance / viewer.zoom;

    window.requestAnimationFrame(renderFrame);

    last_frame = current_frame || timestamp;
    current_frame = timestamp;

    delta = current_frame - last_frame;
    rotation = delta * 0.00015;

    if (viewer.autorotate.x) {
      graphicObjects.rotation.x += rotation;
      viewer.updated = true;
    }
    if (viewer.autorotate.y) {
      graphicObjects.rotation.y += rotation;
      viewer.updated = true;
    }
    if (viewer.autorotate.z) {
      graphicObjects.rotation.z += rotation;
      viewer.updated = true;
    }
    if (old_zoom_level !== viewer.zoom) {
      old_zoom_level = viewer.zoom;
      viewer.updated = true;
      viewer.triggerEvent("zoom", { zoom: viewer.zoom });
    }

    if( (viewer.autorotate.x || viewer.autorotate.y || viewer.autorotate.z) && viewer.onDraggedCallback){
      viewer.onDraggedCallback({
        goQuaternion: graphicObjects.quaternion.clone(),
        camPosition: camera.position.clone()
      });
    }

    if (viewer.updated) {
      if (new_z > camera.near && new_z < 0.9 * camera.far) {
        position.z = new_z;
        //light.position.z = new_z;
        //lightSystem.position.z = new_z + default_camera_distance;
      }
      effect.render(scene, camera);
      viewer.triggerEvent("draw", {
        renderer: effect,
        scene: scene,
        camera: camera
      });
      viewer.updated = false;
    }
  }

  ////////////////////////////////
  // CONTROLS
  ////////////////////////////////

  (function() {
    var graphicObjects = viewer.graphicObjects;

    var movement = "rotate";
    var last_x = null;
    var last_y = null;
    var last_touch_distance = null;

    function drag(pointer, multiplier) {
      var inverse = new THREE.Matrix4();
      var x       = pointer.x;
      var y       = pointer.y;
      var dx, dy;

      if (last_x !== null) {
        dx = x - last_x;
        dy = y - last_y;

        if (movement === "rotate") {

          // Want to always be rotating around world axes.
          inverse.getInverse(graphicObjects.matrix);
          var axis = new THREE.Vector3(1, 0, 0).applyMatrix4(inverse).normalize();
          graphicObjects.rotateOnAxis(axis, dy / 150);

          inverse.getInverse(graphicObjects.matrix);
          axis = new THREE.Vector3(0, 1, 0).applyMatrix4(inverse).normalize();
          graphicObjects.rotateOnAxis(axis, dx / 150);

        } else {
          multiplier  = multiplier || 1.0;
          multiplier *= camera.position.z / default_camera_distance;

          camera.position.x -= dx * multiplier * 0.25;
          camera.position.y += dy * multiplier * 0.25;
        }
      }

      last_x = x;
      last_y = y;

      // calling a callback (if defined). the event of this callback has 2 objects:
      //    goQuaternion: THREE.Quaternion - describe the rotation of the graphicObjects
      //    camPosition: THREE.Vector3 - describe the camera position
      // both are deep copies, but usually only one of them gets changed (per single call)
      if(viewer.onDraggedCallback){
        viewer.onDraggedCallback({
          goQuaternion: graphicObjects.quaternion.clone(),
          camPosition: camera.position.clone()
        });
      }

      viewer.updated = true;


    }

    function touchZoom() {
      var dx = viewer.touches[0].x - viewer.touches[1].x;
      var dy = viewer.touches[0].y - viewer.touches[1].y;

      var distance = Math.sqrt(dx * dx + dy * dy);
      var delta;

      if (last_touch_distance !== null) {
        delta = distance - last_touch_distance;

        viewer.zoom *= 1.0 + 0.01 * delta;
      }

      last_touch_distance = distance;
    }

    function mouseDrag(event) {
      event.preventDefault();
      drag(viewer.mouse, 1.1);
    }

    function touchDrag(event) {
      event.preventDefault();
      if (movement === "zoom") {
        touchZoom();
      } else {
        drag(viewer.touches[0], 2);
      }
    }

    function mouseDragEnd() {
      document.removeEventListener("mousemove", mouseDrag, false);
      document.removeEventListener("mouseup", mouseDragEnd, false);
      last_x = null;
      last_y = null;
    }

    function touchDragEnd() {
      document.removeEventListener("touchmove", touchDrag, false);
      document.removeEventListener("touchend", touchDragEnd, false);
      last_x = null;
      last_y = null;
      last_touch_distance = null;
    }

    function wheelHandler(event) {
      var delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));

      event.preventDefault();

      viewer.zoom *= 1.0 + 0.05 * delta;
    }

    canvas.addEventListener("mousedown", function(event) {
      document.addEventListener("mousemove", mouseDrag, false);
      document.addEventListener("mouseup", mouseDragEnd, false);

      movement = event.which === 1 ? "rotate" : "translate" ;
    }, false);

    canvas.addEventListener("touchstart", function(event) {
      document.addEventListener("touchmove", touchDrag, false);
      document.addEventListener("touchend", touchDragEnd, false);

      movement = event.touches.length === 1 ? "rotate" :
                 event.touches.length === 2 ? "zoom" :
                 "translate";
    }, false);

    canvas.addEventListener("mousewheel", wheelHandler, false);
    canvas.addEventListener("DOMMouseScroll", wheelHandler, false); // Dammit Firefox

    canvas.addEventListener( 'contextmenu', function(event) {
      event.preventDefault();
    }, false );

  })();

};
