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
 
BrainBrowser.SurfaceViewer.modules.views = function(viewer) {
  "use strict";
  
  //////////////
  // INTERFACE
  //////////////
  
  // Change the opacity of an object in the scene.
  viewer.changeShapeTransparency = function(shape_name, alpha) {
    var shape = viewer.model.getObjectByName(shape_name);
    var material;
    if (shape) {
      material = shape.material;
      material.opacity = alpha;
      if (alpha === 1) {
        material.transparent = false;
      } else {
        material.transparent = true;
      }
    }
  };
  
  /**
   * Figures out what view has been selected and activates it
   */
  viewer.setupView = function() {
    var params = viewer.getViewParams(); //Must be defined by calling app
    var method_name = params.view + "View";
    viewer.resetView();
    if(viewer.model_data && viewer.model_data.num_hemispheres === 2) {
      if (typeof viewer[method_name] === "function") {
        viewer[method_name]();
      } else {
        viewer.superiorView();
      }
    }

    /*
     * Decides if the hemispheres need to be shown
     */
    if (viewer.model.getObjectByName("left")) {
      viewer.leftHemisphereVisible(params.left);
    }
    if (viewer.model.getObjectByName("right")) {
      viewer.rightHemisphereVisible(params.right);
    }
  };
  


  /**
   * functions turn the left hemisphere shapes visibility on off
   * @param {Bool} state  boolean (true == visible, false == not visible)
   */
  viewer.leftHemisphereVisible = function(state)  {
    viewer.model.getObjectByName("left").visible = state;
  };
  

  /**
   * functions turn the right hemisphere shapes visibility on off
   * @param {Bool} state  boolean (true == visible, false == not visible)
   */
  viewer.rightHemisphereVisible = function(state)  {
    viewer.model.getObjectByName("right").visible = state;
  };

  //Returns the position and info about a vertex
  //currently a wrapper for model.getVertexInfo
  //Should theoretically return thei same infor as click and
  //click should use this to build that info object
  viewer.getInfoForVertex = function(vertex) {
    var positions = viewer.model_data.positionArray;
    var i = vertex * 3;
    
    return {
      vertex: vertex,
      point: new THREE.Vector3(positions[i], positions[i+1], positions[i+2])
    };
  };

  /**
   * function to handle to preset views of the system.
   *
   */
  viewer.medialView = function() {
    var model = viewer.model;

    if(viewer.model_data.num_hemispheres === 2 ) {
      model.getObjectByName("left").position.x -= 100;
      model.getObjectByName("left").rotation.z -= degToRad(90);
      model.getObjectByName("right").position.x += 100;
      model.getObjectByName("right").rotation.z += degToRad(90);
      model.rotation.x += degToRad(-90);
    }
  };

  /**
   * function to handle to preset views of the system.
   */
  viewer.lateralView = function() {
    var model = viewer.model;
    var left_child, right_child;

    if(viewer.model_data.num_hemispheres === 2 ) {
      left_child = model.getObjectByName("left");
      right_child = model.getObjectByName("right");

      left_child.position.x -= 100;
      left_child.rotation.z += degToRad(-90);
      right_child.position.x += 100;
      right_child.rotation.z += degToRad(90);
      model.rotation.x += degToRad(90);
      model.rotation.y += degToRad(180);
    }
  };

  /**
   * function to handle to preset views of the system.
   */
  viewer.superiorView = function() {
    //nothing should be already done with reset view, placeholder
  };

  /**
   * function to handle to preset views of the system.
   */
  viewer.inferiorView = function() {
    viewer.model.rotation.y += degToRad(180);
  };

  /**
   * function to handle to preset views of the system.
   */
  viewer.anteriorView = function() {
    viewer.resetView();
    viewer.model.rotation.x += degToRad(-90);
    viewer.model.rotation.z += degToRad(180);
  };

  /**
   * function to handle to preset views of the system.
   */
  viewer.posteriorView = function() {
    viewer.resetView();
    viewer.model.rotation.x += degToRad(-90);
  };


  /**
   * Adds space between the hemispheres
   */
  viewer.separateHemispheres = function() {
    if(viewer.model_data.num_hemispheres === 2 ) {
      viewer.model.children[0].position.x -= 1;
      viewer.model.children[1].position.x += 1;
    }
  };
  
  ///////////////////////
  // PRIVATE FUNCTIONS
  ///////////////////////
  
  function degToRad(deg) {
    return deg * Math.PI/180;
  }
};

