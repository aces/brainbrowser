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
* @author: Tarek Sherif
*/

BrainBrowser.SurfaceViewer.modules.views = function(viewer) {
  "use strict";

  //////////////////////////////
  // PRIVATE FUNCTIONS AND DATA
  //////////////////////////////

  // View change functions
  var views = {
    medialView: function() {
      var model = viewer.model;

      if(viewer.model_data.split ) {
        model.getObjectByName("left").position.x -= 100;
        model.getObjectByName("left").rotation.z -= degToRad(90);
        model.getObjectByName("right").position.x += 100;
        model.getObjectByName("right").rotation.z += degToRad(90);
        model.rotation.x += degToRad(-90);
      }
    },

    lateralView: function() {
      var model = viewer.model;
      var left_child, right_child;

      if(viewer.model_data.split ) {
        left_child = model.getObjectByName("left");
        right_child = model.getObjectByName("right");

        left_child.position.x -= 100;
        left_child.rotation.z += degToRad(-90);
        right_child.position.x += 100;
        right_child.rotation.z += degToRad(90);
        model.rotation.x += degToRad(90);
        model.rotation.y += degToRad(180);
      }
    },

    inferiorView: function() {
      viewer.model.rotation.y += degToRad(180);
    },

    anteriorView: function() {
      viewer.resetView();
      viewer.model.rotation.x += degToRad(-90);
      viewer.model.rotation.z += degToRad(180);
    },

    posteriorView : function() {
      viewer.resetView();
      viewer.model.rotation.x += degToRad(-90);
    }
  };
  
  // Convert degrees to radians
  function degToRad(deg) {
    return deg * Math.PI/180;
  }

  
  //////////////
  // INTERFACE
  //////////////
  
  /**
  * @doc function
  * @name viewer.views:setTransparency
  * @param {string} shape_name The name of the shape whose transparency
  *        is being set.
  * @param {number} alpha The value to set the opacity to (between 0 and 1).
  * @description
  * Change the opacity of an object in the scene.
  */
  viewer.setTransparency = function(shape_name, alpha) {
    var shape = viewer.model.getObjectByName(shape_name);
    var material, wireframe;
    
    if (shape) {
      material = shape.material;
      material.opacity = alpha;
      
      if (alpha === 1) {
        material.transparent = false;
      } else {
        material.transparent = true;
      }

      wireframe = shape.getObjectByName("__wireframe__");
      if (wireframe) {
        wireframe.material.opacity = material.opacity;
        wireframe.material.transparent = material.transparent;
      }
    }
  };

  /**
  * @doc function
  * @name viewer.views:setWireframe
  * @param {boolean} is_wireframe Is the viewer in wireframe mode?
  * @description
  * Set wireframe mode on or off.
  */
  viewer.setWireframe = function(is_wireframe) {
    var children = viewer.model.children;
    var child, wireframe;
    
    for (var i = 0; i < children.length; i++) {
      child = children[i];
      wireframe = child.getObjectByName("__wireframe__");
      if (wireframe) {
        child.visible = !is_wireframe;
        wireframe.visible = is_wireframe;
        child.wireframe_active = is_wireframe;
      }
    }
  };

  /**
  * @doc function
  * @name viewer.views:setView
  * @param {string} view_name The name of the view to change to.
  * @description
  * Change to a given view of a split data set. (**Note:** this is
  * only effective for a split dataset, e.g. two hemispheres of a brain).
  */
  viewer.setView = function(view_name) {
    var method_name = view_name + "View";
    viewer.resetView();
    if(viewer.model_data && viewer.model_data.split) {
      if (typeof views[method_name] === "function") {
        views[method_name]();
      }
    }
  };

  /**
   * @doc function
   * @name viewer.views:clearScreen
   * @description
   * Delete all shapes on the screen.
   */
  viewer.clearScreen = function() {
    var children = viewer.model.children;
    
    while (children.length > 0) {
      viewer.model.remove(children[0]);
    }
        
    viewer.resetView();
    BrainBrowser.events.triggerEvent("clearscreen");
  };

  /**
  * @doc function
  * @name viewer.views:separateHalves
  * @param {number} increment Amount of space to put between halves.
  * @description
  * Add space between two halves of a split dataset. (**Note:** this is
  * only effective for a split dataset, e.g. two hemispheres of a brain).
  */
  viewer.separateHalves = function(increment) {
    increment = increment || 1;

    if(viewer.model_data.split ) {
      viewer.model.children[0].position.x -= increment;
      viewer.model.children[1].position.x += increment;
    }
  };
  
};

