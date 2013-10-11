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
 
BrainBrowser.modules.views = function(bb) {
  "use strict";
  
  //////////////
  // INTERFACE
  //////////////
  
  // Change the opacity of an object in the scene.
  bb.changeShapeTransparency = function(shape_name, alpha) {
    var shape = bb.model.getChildByName(shape_name);
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
  bb.setupView = function() {
    var params = bb.getViewParams(); //Must be defined by calling app
    var method_name = params.view + "View";
    bb.resetView();
    if(bb.model_data && bb.model_data.num_hemispheres === 2) {
      if (typeof bb[method_name] === "function") {
        bb[method_name]();
      } else {
        bb.superiorView();
      }
    }

    /*
     * Decides if the hemispheres need to be shown
     */
    if (bb.model.getChildByName("left")) {
      bb.leftHemisphereVisible(params.left);
    }
    if (bb.model.getChildByName("right")) {
      bb.rightHemisphereVisible(params.right);
    }
  };
  


  /**
   * functions turn the left hemisphere shapes visibility on off
   * @param {Bool} state  boolean (true == visible, false == not visible)
   */
  bb.leftHemisphereVisible = function(state)  {
    bb.model.getChildByName("left").visible = state;
  };
  

  /**
   * functions turn the right hemisphere shapes visibility on off
   * @param {Bool} state  boolean (true == visible, false == not visible)
   */
  bb.rightHemisphereVisible = function(state)  {
    bb.model.getChildByName("right").visible = state;
  };

  //Returns the position and info about a vertex
  //currently a wrapper for model.getVertexInfo
  //Should theoretically return thei same infor as click and
  //click should use this to build that info object
  bb.getInfoForVertex = function(vertex) {
    var model_data = bb.model_data.getVertexInfo(vertex);
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
  bb.medialView = function() {
    var model = bb.model;

    if(bb.model_data.num_hemispheres === 2 ) {
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
  bb.lateralView = function() {
    var model = bb.model;
    var left_child, right_child;

    if(bb.model_data.num_hemispheres === 2 ) {
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
  bb.superiorView = function() {
    //nothing should be already done with reset view, placeholder
  };

  /**
   * function to handle to preset views of the system.
   */
  bb.inferiorView = function() {
    bb.model.rotation.y += degToRad(180);
  };

  /**
   * function to handle to preset views of the system.
   */
  bb.anteriorView = function() {
    bb.resetView();
    bb.model.rotation.x += degToRad(-90);
    bb.model.rotation.z += degToRad(180);
  };

  /**
   * function to handle to preset views of the system.
   */
  bb.posteriorView = function() {
    bb.resetView();
    bb.model.rotation.x += degToRad(-90);
  };


  /**
   * Adds space between the hemispheres
   */
  bb.separateHemispheres = function() {
    if(bb.model_data.num_hemispheres === 2 ) {
      bb.model.children[0].position.x -= 1;
      bb.model.children[1].position.x += 1;
    }
  };
  
  ///////////////////////
  // PRIVATE FUNCTIONS
  ///////////////////////
  
  function degToRad(deg) {
    return deg * Math.PI/180;
  }
};

