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
 
BrainBrowser.core.rendering = function(bb) {
  var renderer; //THREE.js renderer
  var pointLight;
  var camera_controls;
  var light_controls;
  var current_frame;
  var last_frame;
  var effect;
  var anaglyphEffect;
  
  bb.model = new THREE.Object3D();
  bb.scene = new THREE.Scene();
  bb.camera = new THREE.PerspectiveCamera(30, bb.view_window.width()/bb.view_window.height(), 0.1, 5000); 
  
  bb.render = function() {
    var view_window = bb.view_window;
    renderer = new THREE.WebGLRenderer({clearColor: 0x888888, clearAlpha: 1, preserveDrawingBuffer: true});
    
    renderer.setSize(view_window.width(), view_window.height());
    effect = renderer;
    
    anaglyphEffect = new THREE.AnaglyphEffect(renderer);
    anaglyphEffect.setSize(view_window.width(), view_window.height());
  
    view_window.append(renderer.domElement);  
    
    bb.camera.position.z = 500;
    
    pointLight = new THREE.PointLight(0xFFFFFF);

    pointLight.position.x = 0;
    pointLight.position.y = 0;
    pointLight.position.z = 500;

    bb.scene.add(pointLight);
    
    camera_controls = new THREE.TrackballControls(bb.camera, view_window[0]);
    light_controls = new THREE.TrackballControls(pointLight, view_window[0]);
    camera_controls.zoomSpeed = 2;                 
    light_controls.zoomSpeed = 2;
    
    bb.autoRotate = {};
    
    window.onresize = function() {
      effect.setSize(view_window.width(), view_window.height());
      bb.camera.aspect = view_window.width()/view_window.height();
      bb.camera.updateProjectionMatrix();
    };
    
    window.onresize();      
    
    render_frame();
  };
  
  bb.anaglyphEffect = function() {
    effect = anaglyphEffect;
  }

  bb.noEffect = function() {
    effect = renderer;
  }
  
  bb.setCamera = function(x, y, z) {
    bb.camera.position.set(x, y, z);
  }
  
  /**
    * Resets the view of the scene by resetting its local matrix to the identity
    * matrix.
    */
   bb.resetView = function() {
     var model = bb.model;
     var child;
     var i, count;

     camera_controls.reset();                 
     light_controls.reset();
     model.position.set(0, 0, 0);
     model.rotation.set(0, 0, 0);
     for (i = 0, count = bb.model.children.length; i < count; i++) {
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
  bb.clearScreen = function() {
    if (bb.model) {
      bb.scene.remove(bb.model)
    }
    bb.resetView();
    
    bb.model = new THREE.Object3D();
    
    if(bb.afterClearScreen != undefined) {
      bb.afterClearScreen();
    }
  };
  
  /**
   * Updates the clear color or background of the view window
   * @param {Number[]} color Takes an array with 4 elements, the color must be represented as for values from 0-1.0 [red,green,blue,alpha] 
    * 
   */
  bb.updateClearColor = function(color)  {
    renderer.setClearColor(new THREE.Color(color));
  };

  /**
   * Used to select some predefined colors
   * @param {String} name name of color from pre defined list (white,black,pink)
   */
  bb.updateClearColorFromName = function(name) {
    if (name == "white") {
      bb.updateClearColor(0xFFFFFF);
    }else if(name == "black") {
      bb.updateClearColor(0x000000);
    } else if(name == "pink"){
      bb.updateClearColor(0xFF00FF);
    }else{
      bb.updateClearColor(0x888888);
    }
  };
  
 
  /*
   * Sets the fillmode of the brain to wireframe or filled
   */
  bb.set_fill_mode_wireframe = function() {
    var children = bb.model.children;
    var material;
    
    for (var i = 0; i < children.length; i++) {
      material = children[i].material;
      material.wireframe = true;
      if (material.emissive) {
        material.emissive.setHex(0x7777777);
      }
    }
  };
  
  bb.set_fill_mode_solid = function() {
    var children = bb.model.children;
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
  bb.ZoomInOut = function(zoom) {
    bb.camera.fov *= zoom;
    bb.camera.updateProjectionMatrix();
  };
  
  
  function render_frame(timestamp) {
    var model = bb.model;
    var delta;
    var rotation;
    
  	requestAnimationFrame(render_frame);
    
    last_frame = current_frame || timestamp;
    current_frame = timestamp;
    
    camera_controls.update();
    light_controls.update();
    delta = current_frame - last_frame;
    rotation = delta * 0.00015;

    if (bb.autoRotate.x) {
	     model.rotation.x += rotation;
    }
    if (bb.autoRotate.y) {
      model.rotation.y += rotation;
    }
    if (bb.autoRotate.z) {
	    model.rotation.z += rotation;
    }

    effect.render(bb.scene, bb.camera);
  }
  
  function drawDot(x, y, z) {
    var geometry = new THREE.SphereGeometry(2);
    var material = new THREE.MeshBasicMaterial({color: 0xFF0000});
  
    var sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(x, y, z);
  
    bb.scene.add(sphere);
  }
};
 
 
 