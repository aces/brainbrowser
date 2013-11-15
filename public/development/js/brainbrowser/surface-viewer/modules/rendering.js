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
 
BrainBrowser.SurfaceViewer.core.rendering = function(viewer) {
  "use strict";
  
  var renderer; //THREE.js renderer
  var scene = new THREE.Scene();
  var pointLight;
  var camera = new THREE.PerspectiveCamera(30, viewer.view_window.offsetWidth/viewer.view_window.offsetHeight, 0.1, 10000);
  var camera_controls;
  var light_controls;
  var current_frame;
  var last_frame;
  var effect;
  var anaglyphEffect;

  viewer.model = new THREE.Object3D();
  
  scene.add(viewer.model);
  
  /**
   * @doc function
   * @name viewer.rendering:render
   * @description
   * Render the scene.
   */
  viewer.render = function() {
    var view_window = viewer.view_window;
    renderer = new THREE.WebGLRenderer({preserveDrawingBuffer: true});
    renderer.setClearColor(0x000000);

    renderer.setSize(view_window.offsetWidth, view_window.offsetHeight);
    effect = renderer;
    
    anaglyphEffect = new THREE.AnaglyphEffect(renderer);
    anaglyphEffect.setSize(view_window.offsetWidth, view_window.offsetHeight);
  
    view_window.appendChild(renderer.domElement);
    
    camera.position.z = 500;
    
    pointLight = new THREE.PointLight(0xFFFFFF);
    pointLight.position.set(0, 0, 500);
    scene.add(pointLight);
    
    camera_controls = new THREE.TrackballControls(camera, view_window);
    light_controls = new THREE.TrackballControls(pointLight, view_window);
    camera_controls.zoomSpeed = 0.5;
    camera_controls.maxDistance = camera.far * 0.9;
    light_controls.zoomSpeed = 0.5;
    camera_controls.maxDistance = camera.far * 0.9;
    
    viewer.autoRotate = {};
    
    window.onresize = function() {
      effect.setSize(view_window.offsetWidth, view_window.offsetHeight);
      camera.aspect = view_window.offsetWidth/view_window.offsetHeight;
      camera.updateProjectionMatrix();
    };
    
    window.onresize();
    
    render_frame();
  };

  /**
  * @doc function
  * @name viewer.rendering:getVertexInfo
  * @param {number} index Index of the vertex to give info for.
  *
  * @description
  * Change to a given view of a split data set. (**Note:** this is
  * only effective for a split dataset, e.g. two hemispheres of a brain).
  */
  viewer.getVertexInfo = function(index) {
    var positions = viewer.model_data.positionArray;
    var i = index * 3;
    
    return {
      index: index,
      point: new THREE.Vector3(positions[i], positions[i+1], positions[i+2])
    };
  };
  

  /**
   * @doc function
   * @name viewer.rendering:canvasDataURL
   * @returns {string} The data URL.
   * @description
   * Returns the Data URL of the canvas the viewer is using
   * so it can be used to create an image.
   */
  viewer.canvasDataURL = function() {
    return renderer.domElement.toDataURL();
  };
  
  /**
   * @doc function
   * @name viewer.rendering:anaglyphEffect
   * @description
   * Enables the anaglyph effect for 3D viewing with
   * red-blue 3D glasses.
   */
  viewer.anaglyphEffect = function() {
    effect = anaglyphEffect;
  };

  /**
   * @doc function
   * @name viewer.rendering:noEffect
   * @description
   * Disable any special effect active on the viewer.
   */
  viewer.noEffect = function() {
    effect = renderer;
  };
  
  /**
   * @doc function
   * @name viewer.rendering:setCamera
   * @param {number} x The x coordinate of the camera.
   * @param {number} y The y coordinate of the camera.
   * @param {number} z The z coordinate of the camera.
   * @description
   * Set the camera position.
   */
  viewer.setCamera = function(x, y, z) {
    camera.position.set(x, y, z);
  };
  
  /**
   * @doc function
   * @name viewer.rendering:resetView
   * @description
   * Resets the view of the scene.
   */
  viewer.resetView = function() {
    var model = viewer.model;
    var child, wireframe;
    var i, count;
    var inv = new THREE.Matrix4();
    inv.getInverse(model.matrix);
  
    camera_controls.reset();
    light_controls.reset();
    model.applyMatrix(inv);
    
    for (i = 0, count = viewer.model.children.length; i < count; i++) {
      child = model.children[i];
      if (child.centroid) {
        child.position.set(child.centroid.x, child.centroid.y, child.centroid.z);
      } else {
        child.position.set(0, 0, 0);
      }
      child.rotation.set(0, 0, 0);

      wireframe = child.getObjectByName("__wireframe__");
    }
  };

  /**
   * @doc function
   * @name viewer.rendering:zoom
   * @param {number} zoom The zoom level (default: 1.0).
   * @description
   * Zoom the view in or out.
   */
  viewer.zoom = function(zoom) {
    camera.fov *= zoom;
    camera.updateProjectionMatrix();
  };
  
  /**
   * @doc function
   * @name viewer.rendering:setClearColor
   * @param {number} color A hexadecimal number representing the RGB color to use.
   * @description
   * Updates the clear color of the viewer.
   */
  viewer.setClearColor = function(color)  {
    renderer.setClearColor(color, 1.0);
  };
  
  /**
   * @doc function
   * @name viewer.rendering:pick
   * @param {number} x The x coordinate on the canvas.
   * @param {number} y The y coordinate on the canvas.
   * @returns {object} If an intersection is detected, returns an object with the following information:
   *
   * * **object** The THREE.Object3D object with which the the click intersected.
   * * **point** A THREE.Vector3 object representing the point in 3D space at which the intersection occured.
   * * **index** The index of the intersection point in the list of vertices.
   *
   * Otherwise returns **null**.
   * 
   * @description
   * Given an x and y coordinate on the viewer canvas, returns information about the 
   * the point of intersection with a displayed object. 
   *
   */
  viewer.pick = function(x, y) {
    var projector = new THREE.Projector();
    var raycaster = new THREE.Raycaster();
    var vector = new THREE.Vector3(x, y, 1);
    var intersects, intersection, vertex_data;
    var intersect_object, intersect_point, intersect_vertex_index, min_distance;
    var verts, distance;
    var i, count;
  
    projector.unprojectVector(vector, camera);
    raycaster.set(camera.position, vector.sub(camera.position).normalize() );
    intersects = raycaster.intersectObject(viewer.model, true);
    if (intersects.length > 0) {
      
      // Find closest point to intersection.
      intersection = intersects[0];
      intersect_object = intersection.object;
      intersect_point = intersection.point;
      verts = intersect_object.geometry.original_data.vertices;
      min_distance = intersect_point.distanceTo(new THREE.Vector3(verts[0], verts[1], verts[2]));
      for (i = 1, count = verts.length; i < count; i++) {
        distance = intersect_point.distanceTo(new THREE.Vector3(verts[i*3], verts[i*3+1], verts[i*3+2]));
        if ( distance < min_distance) {
          intersect_vertex_index = i;
          min_distance = distance;
        }
      }

      vertex_data = {
        index: intersect_vertex_index,
        point: new THREE.Vector3(intersection.point.x, intersection.point.y, intersection.point.z),
        object: intersection.object
      };

      return vertex_data;
    } else {
      return null;
    }
  };
  
  // Render a single frame on the viewer.
  function render_frame(timestamp) {
    var model = viewer.model;
    var delta;
    var rotation;
    
    window.requestAnimationFrame(render_frame);
    
    last_frame = current_frame || timestamp;
    current_frame = timestamp;
    
    camera_controls.update();
    light_controls.update();
    delta = current_frame - last_frame;
    rotation = delta * 0.00015;

    if (viewer.autoRotate.x) {
      model.rotation.x += rotation;
    }
    if (viewer.autoRotate.y) {
      model.rotation.y += rotation;
    }
    if (viewer.autoRotate.z) {
      model.rotation.z += rotation;
    }

    effect.render(scene, camera);
  }
};
 
 
 
