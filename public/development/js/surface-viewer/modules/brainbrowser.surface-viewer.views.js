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
 
BrainBrowser.SurfaceViewer.modules.views = function(sv) {
  "use strict";
  
  //////////////
  // INTERFACE
  //////////////
  
  // Change the opacity of an object in the scene.
  sv.changeShapeTransparency = function(shape_name, alpha) {
    var shape = sv.model.getChildByName(shape_name);
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
  sv.setupView = function() {
    var params = sv.getViewParams(); //Must be defined by calling app
    var method_name = params.view + "View";
    sv.resetView();
    if(sv.model_data && sv.model_data.num_hemispheres === 2) {
      if (typeof sv[method_name] === "function") {
        sv[method_name]();
      } else {
        sv.superiorView();
      }
    }

    /*
     * Decides if the hemispheres need to be shown
     */
    if (sv.model.getChildByName("left")) {
      sv.leftHemisphereVisible(params.left);
    }
    if (sv.model.getChildByName("right")) {
      sv.rightHemisphereVisible(params.right);
    }
  };
  


  /**
   * functions turn the left hemisphere shapes visibility on off
   * @param {Bool} state  boolean (true == visible, false == not visible)
   */
  sv.leftHemisphereVisible = function(state)  {
    sv.model.getChildByName("left").visible = state;
  };
  

  /**
   * functions turn the right hemisphere shapes visibility on off
   * @param {Bool} state  boolean (true == visible, false == not visible)
   */
  sv.rightHemisphereVisible = function(state)  {
    sv.model.getChildByName("right").visible = state;
  };

  //Returns the position and info about a vertex
  //currently a wrapper for model.getVertexInfo
  //Should theoretically return thei same infor as click and
  //click should use this to build that info object
  sv.getInfoForVertex = function(vertex) {
    var model_data = sv.model_data.getVertexInfo(vertex);
    var vertex_data = {
      vertex: model_data.vertex,
      point: new THREE.Vector3(model_data.position_vector[0], model_data.position_vector[1], model_data.position_vector[2])
    };
    return vertex_data;
  };

  /**
   * function to handle to preset views of the system.
   *
   */
  sv.medialView = function() {
    var model = sv.model;

    if(sv.model_data.num_hemispheres === 2 ) {
      model.getChildByName("left").position.x -= 100;
      model.getChildByName("left").rotation.z -= degToRad(90);
      model.getChildByName("right").position.x += 100;
      model.getChildByName("right").rotation.z += degToRad(90);
      model.rotation.x += degToRad(-90);
    }
  };

  /**
   * function to handle to preset views of the system.
   */
  sv.lateralView = function() {
    var model = sv.model;
    var left_child, right_child;

    if(sv.model_data.num_hemispheres === 2 ) {
      left_child = model.getChildByName("left");
      right_child = model.getChildByName("right");

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
  sv.superiorView = function() {
    //nothing should be already done with reset view, placeholder
  };

  /**
   * function to handle to preset views of the system.
   */
  sv.inferiorView = function() {
    sv.model.rotation.y += degToRad(180);
  };

  /**
   * function to handle to preset views of the system.
   */
  sv.anteriorView = function() {
    sv.resetView();
    sv.model.rotation.x += degToRad(-90);
    sv.model.rotation.z += degToRad(180);
  };

  /**
   * function to handle to preset views of the system.
   */
  sv.posteriorView = function() {
    sv.resetView();
    sv.model.rotation.x += degToRad(-90);
  };


  /**
   * Adds space between the hemispheres
   */
  sv.separateHemispheres = function() {
    if(sv.model_data.num_hemispheres === 2 ) {
      sv.model.children[0].position.x -= 1;
      sv.model.children[1].position.x += 1;
    }
  };
  
  ///////////////////////
  // PRIVATE FUNCTIONS
  ///////////////////////
  
  function degToRad(deg) {
    return deg * Math.PI/180;
  }
};

