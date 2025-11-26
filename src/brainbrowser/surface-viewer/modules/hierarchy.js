/*
* BrainBrowser: Web-based Neurological Visualization Tools
* (https://brainbrowser.cbrain.mcgill.ca)
*
* Copyright (C) 2011-2025
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
* Hierarchical Surface Management Module
* Optimized for 50-100 nested surfaces with performance-aware visibility control
*/

BrainBrowser.SurfaceViewer.modules.hierarchy = function(viewer) {
  "use strict";

  var THREE = BrainBrowser.SurfaceViewer.THREE;

  // Hierarchy tree structure
  var hierarchy_tree = {
    root: {
      id: "root",
      children: [],
      parent: null,
      model_name: null,
      visible: true,
      opacity: 1.0,
      level: 0,
      lod_enabled: true,
      lod_distance_threshold: 500 // Distance at which to switch to lower detail
    }
  };

  // Lookup table for fast access
  var model_lookup = {};

  // Performance tracking
  var visible_surface_count = 0;
  var max_visible_surfaces = 100;

  /**
  * @doc function
  * @name viewer.hierarchy:addSurfaceToHierarchy
  * @param {string} model_name Name of the model to add
  * @param {object} options Hierarchy options:
  *   - parent: parent model name (default: "root")
  *   - level: hierarchy level (default: auto-calculated)
  *   - visible: initial visibility (default: true)
  *   - opacity: initial opacity 0-1 (default: 1.0)
  *   - lod_enabled: enable level-of-detail (default: true)
  * @returns {string} Unique hierarchy ID
  *
  * @description
  * Add a surface to the hierarchical management system.
  *
  * ```js
  * viewer.addSurfaceToHierarchy("brain_outer.asc", {
  *   parent: "root",
  *   level: 1,
  *   visible: true
  * });
  *
  * viewer.addSurfaceToHierarchy("brain_inner.asc", {
  *   parent: "brain_outer.asc",
  *   level: 2
  * });
  * ```
  */
  viewer.addSurfaceToHierarchy = function(model_name, options) {
    options = options || {};

    var parent_name = options.parent || "root";
    var parent_node = model_lookup[parent_name] || hierarchy_tree.root;

    var node = {
      id: model_name,
      model_name: model_name,
      children: [],
      parent: parent_node,
      visible: options.visible !== undefined ? options.visible : true,
      opacity: options.opacity !== undefined ? options.opacity : 1.0,
      level: options.level !== undefined ? options.level : (parent_node.level + 1),
      lod_enabled: options.lod_enabled !== undefined ? options.lod_enabled : true,
      lod_distance_threshold: options.lod_distance_threshold || 500,
      bounding_sphere: null
    };

    parent_node.children.push(node);
    model_lookup[model_name] = node;

    // Calculate bounding sphere for LOD
    calculateBoundingSphere(node);

    // Update visibility based on hierarchy
    updateNodeVisibility(node);

    return model_name;
  };

  /**
  * @doc function
  * @name viewer.hierarchy:removeSurfaceFromHierarchy
  * @param {string} model_name Name of model to remove
  *
  * @description
  * Remove a surface from the hierarchy.
  *
  * ```js
  * viewer.removeSurfaceFromHierarchy("brain_inner.asc");
  * ```
  */
  viewer.removeSurfaceFromHierarchy = function(model_name) {
    var node = model_lookup[model_name];
    if (!node) return;

    // Remove from parent's children array
    if (node.parent) {
      var index = node.parent.children.indexOf(node);
      if (index >= 0) {
        node.parent.children.splice(index, 1);
      }
    }

    // Recursively remove children
    var children_to_remove = node.children.slice();
    children_to_remove.forEach(function(child) {
      viewer.removeSurfaceFromHierarchy(child.model_name);
    });

    delete model_lookup[model_name];
  };

  /**
  * @doc function
  * @name viewer.hierarchy:setSurfaceVisibility
  * @param {string} model_name Name of model
  * @param {boolean} visible Visibility state
  * @param {object} options Options:
  *   - cascade: apply to children (default: true)
  *   - animate: animate transition (default: false)
  *   - duration: animation duration ms (default: 300)
  *
  * @description
  * Set visibility of a surface and optionally its children.
  *
  * ```js
  * viewer.setSurfaceVisibility("brain_outer.asc", true, {
  *   cascade: true,
  *   animate: true
  * });
  * ```
  */
  viewer.setSurfaceVisibility = function(model_name, visible, options) {
    options = options || {};
    var cascade = options.cascade !== undefined ? options.cascade : true;
    var animate = options.animate || false;

    var node = model_lookup[model_name];
    if (!node) return;

    if (animate) {
      animateOpacity(node, visible ? node.opacity : 0, options.duration || 300);
    } else {
      node.visible = visible;
      updateNodeVisibility(node);
    }

    if (cascade) {
      node.children.forEach(function(child) {
        viewer.setSurfaceVisibility(child.model_name, visible, options);
      });
    }

    viewer.updated = true;
  };

  /**
  * @doc function
  * @name viewer.hierarchy:setSurfaceOpacity
  * @param {string} model_name Name of model
  * @param {number} opacity Opacity 0-1
  * @param {object} options Options:
  *   - cascade: apply to children (default: false)
  *
  * @description
  * Set opacity of a surface.
  *
  * ```js
  * viewer.setSurfaceOpacity("brain_outer.asc", 0.5);
  * ```
  */
  viewer.setSurfaceOpacity = function(model_name, opacity, options) {
    options = options || {};
    var cascade = options.cascade || false;

    var node = model_lookup[model_name];
    if (!node) return;

    node.opacity = Math.max(0, Math.min(1, opacity));
    updateNodeVisibility(node);

    if (cascade) {
      node.children.forEach(function(child) {
        viewer.setSurfaceOpacity(child.model_name, opacity, options);
      });
    }

    viewer.updated = true;
  };

  /**
  * @doc function
  * @name viewer.hierarchy:getHierarchy
  * @returns {object} Complete hierarchy tree
  *
  * @description
  * Get the complete hierarchy structure.
  *
  * ```js
  * var hierarchy = viewer.getHierarchy();
  * ```
  */
  viewer.getHierarchy = function() {
    return serializeNode(hierarchy_tree.root);
  };

  /**
  * @doc function
  * @name viewer.hierarchy:getSurfaceByLevel
  * @param {number} level Hierarchy level
  * @returns {array} Array of model names at that level
  *
  * @description
  * Get all surfaces at a specific hierarchy level.
  *
  * ```js
  * var level_1_surfaces = viewer.getSurfaceByLevel(1);
  * ```
  */
  viewer.getSurfaceByLevel = function(level) {
    var surfaces = [];

    function traverse(node) {
      if (node.level === level && node.model_name) {
        surfaces.push(node.model_name);
      }
      node.children.forEach(traverse);
    }

    traverse(hierarchy_tree.root);
    return surfaces;
  };

  /**
  * @doc function
  * @name viewer.hierarchy:optimizeVisibility
  *
  * @description
  * Automatically optimize visibility based on camera distance and performance.
  * Uses LOD (Level of Detail) to hide distant surfaces.
  *
  * ```js
  * viewer.optimizeVisibility();
  * ```
  */
  viewer.optimizeVisibility = function() {
    var camera_pos = viewer.getCameraPosition();
    visible_surface_count = 0;

    function checkNode(node) {
      if (!node.model_name) {
        node.children.forEach(checkNode);
        return;
      }

      if (node.lod_enabled && node.bounding_sphere) {
        var distance = camera_pos.distanceTo(node.bounding_sphere.center);

        // Hide if too far or too many visible surfaces
        if (distance > node.lod_distance_threshold || visible_surface_count >= max_visible_surfaces) {
          if (node.visible) {
            node.visible = false;
            updateNodeVisibility(node);
          }
        } else {
          if (!node.visible) {
            node.visible = true;
            updateNodeVisibility(node);
          }
          visible_surface_count++;
        }
      }

      node.children.forEach(checkNode);
    }

    checkNode(hierarchy_tree.root);
    viewer.updated = true;
  };

  /**
  * @doc function
  * @name viewer.hierarchy:setMaxVisibleSurfaces
  * @param {number} max Maximum number of visible surfaces
  *
  * @description
  * Set the maximum number of surfaces that can be visible simultaneously.
  *
  * ```js
  * viewer.setMaxVisibleSurfaces(50);
  * ```
  */
  viewer.setMaxVisibleSurfaces = function(max) {
    max_visible_surfaces = max;
  };

  ////////////////////////////////////
  // PRIVATE FUNCTIONS
  ////////////////////////////////////

  function updateNodeVisibility(node) {
    if (!node.model_name) return;

    var model_data = viewer.model_data.get(node.model_name);
    if (!model_data) return;

    // Find all THREE.js objects for this model
    viewer.model.children.forEach(function(child) {
      if (child.userData.model_name === node.model_name) {
        child.visible = node.visible;

        if (child.material && child.material.uniforms && child.material.uniforms.opacity) {
          child.material.uniforms.opacity.value = node.opacity;
          child.material.transparent = node.opacity < 1.0;
        } else if (child.material) {
          child.material.opacity = node.opacity;
          child.material.transparent = node.opacity < 1.0;
        }
      }
    });
  }

  function calculateBoundingSphere(node) {
    if (!node.model_name) return;

    var model_data = viewer.model_data.get(node.model_name);
    if (!model_data || !model_data.bounding_box) return;

    var bbox = model_data.bounding_box;
    var center = new THREE.Vector3(
      (bbox.min_x + bbox.max_x) / 2,
      (bbox.min_y + bbox.max_y) / 2,
      (bbox.min_z + bbox.max_z) / 2
    );

    var radius = Math.max(
      bbox.max_x - bbox.min_x,
      bbox.max_y - bbox.min_y,
      bbox.max_z - bbox.min_z
    ) / 2;

    node.bounding_sphere = {
      center: center,
      radius: radius
    };
  }

  function animateOpacity(node, target_opacity, duration) {
    var start_opacity = node.opacity;
    var start_time = Date.now();

    function animate() {
      var elapsed = Date.now() - start_time;
      var progress = Math.min(elapsed / duration, 1.0);

      node.opacity = start_opacity + (target_opacity - start_opacity) * progress;
      updateNodeVisibility(node);
      viewer.updated = true;

      if (progress < 1.0) {
        requestAnimationFrame(animate);
      } else {
        node.visible = target_opacity > 0;
        updateNodeVisibility(node);
      }
    }

    animate();
  }

  function serializeNode(node) {
    var serialized = {
      id: node.id,
      model_name: node.model_name,
      visible: node.visible,
      opacity: node.opacity,
      level: node.level,
      children: []
    };

    node.children.forEach(function(child) {
      serialized.children.push(serializeNode(child));
    });

    return serialized;
  }

};
