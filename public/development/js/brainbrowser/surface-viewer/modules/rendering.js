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
  
  viewer.canvasDataURL = function() {
    return renderer.domElement.toDataURL();
  };
  
  viewer.anaglyphEffect = function() {
    effect = anaglyphEffect;
  };

  viewer.noEffect = function() {
    effect = renderer;
  };
  
  viewer.setCamera = function(x, y, z) {
    camera.position.set(x, y, z);
  };
  
  /**
    * Resets the view of the scene by resetting its local matrix to the identity
    * matrix.
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

  viewer.zoom = function(zoom) {
    camera.fov *= zoom;
    camera.updateProjectionMatrix();
  };

  
  /**
   * Delete all the shapes on screen
   * For this the function travels down the scenegraph and removes every shape.
   *
   * Tip: when you remove a shape, the shapes array lenght will be decremented so if you need to count the number of shapes, you must save that length value before removing shapes.
   */
  viewer.clearScreen = function() {
    var children = viewer.model.children;
    
    while (children.length > 0) {
      viewer.model.remove(children[0]);
    }
        
    viewer.resetView();
    viewer.triggerEvent("clearscreen");
  };
  
  /**
   * Updates the clear color or background of the view window
   * @param {Number[]} color Takes an array with 4 elements, the color must be represented as for values from 0-1.0 [red,green,blue,alpha]
    *
   */
  viewer.updateClearColor = function(color)  {
    renderer.setClearColor(color, 1.0);
  };
  
  /*
    * This method can be used to detect where the user clicked
    * it takes a callback method which will receive the event and
    * and info object.
    *
   */
  viewer.click = function(e, click_callback) {
    var view_window = viewer.view_window;
    
    var offset = BrainBrowser.utils.getOffset(view_window);
    var projector = new THREE.Projector();
    var raycaster = new THREE.Raycaster();
    var mouseX = ((e.clientX - offset.left + window.scrollX)/view_window.offsetWidth) * 2 - 1;
    var mouseY = -((e.clientY - offset.top + window.scrollY)/view_window.offsetHeight) * 2 + 1;
    var vector = new THREE.Vector3(mouseX, mouseY, 1);
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
        vertex: intersect_vertex_index,
        point: new THREE.Vector3(intersection.point.x, intersection.point.y, intersection.point.z),
        object: intersection.object
      };

      return click_callback(e, vertex_data);
    } else {
      return false;
    }
  };
  
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
 
 
 
