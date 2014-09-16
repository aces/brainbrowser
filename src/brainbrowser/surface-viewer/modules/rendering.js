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
*/
 
BrainBrowser.SurfaceViewer.modules.rendering = function(viewer) {
  "use strict";
  
  var renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(30, viewer.dom_element.offsetWidth / viewer.dom_element.offsetHeight, 1, 3000);
  var default_camera_distance = 500;
  var light = new THREE.PointLight(0xFFFFFF);
  var current_frame;
  var last_frame;
  var effect = renderer;
  var effects = {};
  var canvas = renderer.domElement;
  var old_zoom_level;

  viewer.model = new THREE.Object3D();
  
  scene.add(viewer.model);
  
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
    renderer.setSize(dom_element.offsetWidth, dom_element.offsetHeight);
    dom_element.appendChild(renderer.domElement);
    
    camera.position.z = default_camera_distance;
    
    light.position.set(0, 0, default_camera_distance);
    scene.add(light);
    
    viewer.autorotate = {};
    
    window.onresize = function() {
      effect.setSize(dom_element.offsetWidth, dom_element.offsetHeight);
      camera.aspect = dom_element.offsetWidth / dom_element.offsetHeight;
      camera.updateProjectionMatrix();

      viewer.updated = true;
    };
    
    window.onresize();
    
    renderFrame();
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
    light.position.set(x, y, z);

    viewer.updated = true;
  };
  
  /**
  * @doc function
  * @name viewer.rendering:resetView
  * @description
  * Resets the view of the scene.
  * ```js
  * viewer.resetView();
  * ```
  */
  viewer.resetView = function() {
    var model = viewer.model;
    var child, wireframe;
    var i, count;
    var inv = new THREE.Matrix4();
    inv.getInverse(model.matrix);
  
    model.applyMatrix(inv);
    camera.position.set(0, 0, default_camera_distance);
    light.position.set(0, 0, default_camera_distance);
    viewer.zoom = 1;
    
    for (i = 0, count = viewer.model.children.length; i < count; i++) {
      child = model.children[i];
      if (child.centroid) {
        child.position.set(child.centroid.x, child.centroid.y, child.centroid.z);
      } else {
        child.position.set(0, 0, 0);
      }
      child.rotation.set(0, 0, 0);

      wireframe = child.getObjectByName("__WIREFRAME__");
    }

    viewer.updated = true;
  };
  
  /**
  * @doc function
  * @name viewer.rendering:setClearColor
  * @param {number} color A hexadecimal number representing the RGB color to use.
  * @description
  * Updates the clear color of the viewer.
  * ```js
  * viewer.setClearColor(0xFF0000);
  * ```
  */
  viewer.setClearColor = function(color)  {
    renderer.setClearColor(color, 1.0);

    viewer.updated = true;
  };

  /**
  * @doc function
  * @name viewer.rendering:drawDot
  * @param {number} x The x coordinate.
  * @param {number} y The y coordinate.
  * @param {number} z The z coordinate.
  * @param {number} radius Radius of the sphere (default: 2).
  * @param {number} color Color of the sphere as a hexadecimal integer (default: 0xFF0000).
  *
  * @description Draw a sphere in the current scene. Handy for debugging.
  * ```js
  * viewer.drawDot(10, 5, 15, 3, 0x00FF00);
  * ```
  */
  viewer.drawDot = function(x, y, z, radius, color) {
    radius = radius || 2;
    radius = radius >= 0 ? radius : 0;
    color = color >= 0 ? color : 0xFF0000;

    var geometry = new THREE.SphereGeometry(radius);
    var material = new THREE.MeshBasicMaterial({color: color});
  
    var sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(x, y, z);
  
    if (viewer.model) {
      viewer.model.add(sphere);
    } else {
      scene.add(sphere);
    }

    viewer.updated = true;

    return sphere;

  };
  
  /**
  * @doc function
  * @name viewer.rendering:pick
  * @param {number} x The x coordinate on the canvas (defaults to current mouse position).
  * @param {number} y The y coordinate on the canvas (defaults to current mouse position).
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
  * viewer.pick();          // Pick at current mouse position.
  * viewer.pick(125, 250);  // Pick at given position.
  * ```
  */
  viewer.pick = function(x, y) {
    x = x === undefined ? viewer.mouse.x : x;
    y = y === undefined ? viewer.mouse.y : y;

    // Convert to normalized coordinates.
    x = (x / viewer.dom_element.offsetWidth) * 2 - 1;
    y = (-y / viewer.dom_element.offsetHeight) * 2 + 1;

    var model = viewer.model;
    var projector = new THREE.Projector();
    var raycaster = new THREE.Raycaster();
    var vector = new THREE.Vector3(x, y, camera.near);
    var intersection = null;
    var intersects, vertex_data;
    var intersect_object, intersect_point, intersect_indices;
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

    projector.unprojectVector(vector, camera);
    raycaster.set(camera.position, vector.sub(camera.position).normalize());
    intersects = raycaster.intersectObject(model, true);

    for (i = 0; i < intersects.length; i++) {
      if (!intersects[i].object.__PICK_IGNORE__) {
        intersection = intersects[i];
        break;
      }
    }

    if (intersection !== null) {

      intersect_object = intersection.object;
      intersect_indices = intersection.indices;

      if (intersect_object.annotation_info) {
        vertex_data = {
          index: intersect_object.annotation_info.vertex,
          point: intersect_object.annotation_info.position,
          object: intersect_object
        };
      } else {
        // We're dealing with an imported model.

        // Objects have their origins centered
        // to help with transparency, so to check
        // check against original vertices we have
        // move them back.
        centroid = intersect_object.centroid;
        cx = centroid.x;
        cy = centroid.y;
        cz = centroid.z;

        inv_matrix.getInverse(intersect_object.matrixWorld);
        intersect_point = intersection.point.applyMatrix4(inv_matrix);

        original_vertices = intersect_object.geometry.original_data.vertices;
        original_indices = intersect_object.geometry.original_data.indices;

        // Have to get the vertex pointed to by the original index because of
        // the de-indexing (see workers/deindex.worker.js)
        intersect_vertex_index = index = original_indices[intersect_indices[0]];
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
          index = original_indices[intersect_indices[i]];
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
  
  ////////////////////////////////////
  // PRIVATE FUNCTIONS
  ////////////////////////////////////

  // Render a single frame on the viewer.
  function renderFrame(timestamp) {
    var model = viewer.model;
    var delta;
    var rotation;
    var position = camera.position;
    var new_z = default_camera_distance / viewer.zoom;
    
    window.requestAnimationFrame(renderFrame);
    
    last_frame = current_frame || timestamp;
    current_frame = timestamp;
    
    delta = current_frame - last_frame;
    rotation = delta * 0.00015;

    if (viewer.autorotate.x) {
      model.rotation.x += rotation;
      viewer.updated = true;
    }
    if (viewer.autorotate.y) {
      model.rotation.y += rotation;
      viewer.updated = true;
    }
    if (viewer.autorotate.z) {
      model.rotation.z += rotation;
      viewer.updated = true;
    }
    if (old_zoom_level !== viewer.zoom) {
      old_zoom_level = viewer.zoom;
      viewer.updated = true;
      viewer.triggerEvent("zoom", viewer.zoom);
    }

    if (viewer.updated) {
      if (new_z > camera.near && new_z < 0.9 * camera.far) {
        position.z = new_z;
        light.position.z = new_z;
      }
      effect.render(scene, camera);
      viewer.triggerEvent("draw", effect, scene, camera);
      viewer.updated = false;
    }
  }

  ////////////////////////////////
  // CONTROLS
  ////////////////////////////////

  (function() {
    var model = viewer.model;
    var movement = "rotate";
    var last_x = null;
    var last_y = null;
    var last_touch_distance = null;

    function drag(pointer, multiplier) {
      var inverse = new THREE.Matrix4();
      var x = pointer.x;
      var y = pointer.y;
      var dx, dy;


      if (last_x !== null) {
        dx = x - last_x;
        dy = y - last_y;

        if (movement === "rotate") {

          // Want to always be rotating around
          // world axes.
          inverse.getInverse(model.matrix);
          var axis = new THREE.Vector3(1, 0, 0).applyMatrix4(inverse).normalize();
          model.rotateOnAxis(axis, dy / 150);

          inverse.getInverse(model.matrix);
          axis = new THREE.Vector3(0, 1, 0).applyMatrix4(inverse).normalize();
          model.rotateOnAxis(axis, dx / 150);
        } else {
          multiplier = multiplier || 1.0;
          multiplier *= camera.position.z / default_camera_distance;

          camera.position.x -= dx * multiplier * 0.25;
          light.position.x -= dx * multiplier * 0.25;
          camera.position.y += dy * multiplier * 0.25;
          light.position.y += dy * multiplier * 0.25;
        }
      }

      last_x = x;
      last_y = y;

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
 
 
 
