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
 
BrainBrowser.SurfaceViewer.core.rendering = function(sv) {
  "use strict";
  
  var renderer; //THREE.js renderer
  var scene = new THREE.Scene();
  var pointLight;
  var camera = new THREE.PerspectiveCamera(30, sv.view_window.offsetWidth/sv.view_window.offsetHeight, 0.1, 5000);
  var camera_controls;
  var light_controls;
  var current_frame;
  var last_frame;
  var effect;
  var anaglyphEffect;

  sv.model = new THREE.Object3D();
  
  scene.add(sv.model);
  
  sv.render = function() {
    var view_window = sv.view_window;
    renderer = new THREE.WebGLRenderer({clearColor: 0x888888, clearAlpha: 1, preserveDrawingBuffer: true});

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
    camera_controls.zoomSpeed = 2;
    light_controls.zoomSpeed = 2;
    
    sv.autoRotate = {};
    
    window.onresize = function() {
      effect.setSize(view_window.offsetWidth, view_window.offsetHeight);
      camera.aspect = view_window.offsetWidth/view_window.offsetHeight;
      camera.updateProjectionMatrix();
    };
    
    window.onresize();
    
    render_frame();
  };
  
  sv.canvasDataURL = function() {
    return renderer.domElement.toDataURL();
  };
  
  sv.anaglyphEffect = function() {
    effect = anaglyphEffect;
  };

  sv.noEffect = function() {
    effect = renderer;
  };
  
  sv.setCamera = function(x, y, z) {
    camera.position.set(x, y, z);
  };
  
  /**
    * Resets the view of the scene by resetting its local matrix to the identity
    * matrix.
    */
  sv.resetView = function() {
    var model = sv.model;
    var child;
    var i, count;
    var inv = new THREE.Matrix4();
    inv.getInverse(model.matrix);
  
    camera_controls.reset();
    light_controls.reset();
    model.applyMatrix(inv);
    
    for (i = 0, count = sv.model.children.length; i < count; i++) {
      child = model.children[i];
      child.visible = true;
      if (child.centroid) {
        child.position.set(child.centroid.x, child.centroid.y, child.centroid.z);
      } else {
        child.position.set(0, 0, 0);
      }
      child.rotation.set(0, 0, 0);
    }
  };
  
  /**
   * Delete all the shapes on screen
   * For this the function travels down the scenegraph and removes every shape.
   *
   * Tip: when you remove a shape, the shapes array lenght will be decremented so if you need to count the number of shapes, you must save that length value before removing shapes.
   */
  sv.clearScreen = function() {
    var children = sv.model.children;
    
    while (children.length > 0) {
      sv.model.remove(children[0]);
    }
        
    sv.resetView();
    if(sv.afterClearScreen) {
      sv.afterClearScreen();
    }
  };
  
  /**
   * Updates the clear color or background of the view window
   * @param {Number[]} color Takes an array with 4 elements, the color must be represented as for values from 0-1.0 [red,green,blue,alpha]
    *
   */
  sv.updateClearColor = function(color)  {
    renderer.setClearColorHex(color, 1.0);
  };
 
  /*
   * Sets the fillmode of the brain to wireframe or filled
   */
  sv.set_fill_mode_wireframe = function() {
    var children = sv.model.children;
    var material;
    
    for (var i = 0; i < children.length; i++) {
      material = children[i].material;
      material.wireframe = true;
      if (material.emissive) {
        material.emissive.setHex(0x7777777);
      }
    }
  };
  
  sv.set_fill_mode_solid = function() {
    var children = sv.model.children;
    var material;
    
    for (var i = 0; i < children.length; i++) {
      material = children[i].material;
      material.wireframe = false;
      if (material.emissive) {
        material.emissive.setHex(0x000000);
      }
    }
  };

  /**
   * The following methods implement the zoom in and out
   */
  sv.ZoomInOut = function(zoom) {
    camera.fov *= zoom;
    camera.updateProjectionMatrix();
  };
  
  /*
    * This method can be used to detect where the user clicked
    * it takes a callback method which will receive the event and
    * and info object.
    *
   */
  sv.click = function(e, click_callback) {
    var view_window = sv.view_window;
    
    var offset = getOffset(view_window);
    var projector = new THREE.Projector();
    var raycaster = new THREE.Raycaster();
    var mouseX = ((e.clientX - offset.left + window.scrollX)/view_window.offsetWidth) * 2 - 1;
    var mouseY = -((e.clientY - offset.top + window.scrollY)/view_window.offsetHeight) * 2 + 1;
    var vector = new THREE.Vector3(mouseX, mouseY, 1);
    var intersects, intersection, vertex_data;
  
    projector.unprojectVector(vector, camera);
    raycaster.set(camera.position, vector.sub(camera.position).normalize() );
    intersects = raycaster.intersectObject(sv.model, true);
    if (intersects.length > 0) {
      intersection = intersects[0];
      vertex_data = {
        vertex: intersection.face.a,
        point: new THREE.Vector3(intersection.point.x, intersection.point.y, intersection.point.z),
        object: intersection.object
      };
      return click_callback(e, vertex_data);
    } else {
      return false;
    }
  };
  
  function getOffset(elem) {
    var top = 0;
    var left = 0;
    
    while (elem.offsetParent) {
      top += elem.offsetTop;
      left += elem.offsetLeft;
      
      elem = elem.offsetParent;
    }
    
    return {top: top, left: left};
  }
  
  
  function render_frame(timestamp) {
    var model = sv.model;
    var delta;
    var rotation;
    
    window.requestAnimationFrame(render_frame);
    
    last_frame = current_frame || timestamp;
    current_frame = timestamp;
    
    camera_controls.update();
    light_controls.update();
    delta = current_frame - last_frame;
    rotation = delta * 0.00015;

    if (sv.autoRotate.x) {
      model.rotation.x += rotation;
    }
    if (sv.autoRotate.y) {
      model.rotation.y += rotation;
    }
    if (sv.autoRotate.z) {
      model.rotation.z += rotation;
    }

    effect.render(scene, camera);
  }
};
 
 
 