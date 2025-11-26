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
* 2D Slice Projection Module
* Extract and visualize 2D cross-sections from 3D surfaces
* Supports orthogonal (sagittal, coronal, axial) and arbitrary oblique slices
*/

BrainBrowser.SurfaceViewer.modules.sliceProjection = function(viewer) {
  "use strict";

  var THREE = BrainBrowser.SurfaceViewer.THREE;

  // Slice views
  var slice_views = {};
  var slice_counter = 0;

  /**
  * @doc function
  * @name viewer.sliceProjection:createSliceView
  * @param {object} options Slice view options:
  *   - orientation: 'sagittal'|'coronal'|'axial'|'custom' (default: 'sagittal')
  *   - position: slice position (default: 0)
  *   - normal: custom normal vector [x,y,z] for 'custom' orientation
  *   - width: canvas width in pixels (default: 512)
  *   - height: canvas height in pixels (default: 512)
  *   - model_name: target model (default: first loaded)
  *   - linked: sync with 3D view rotation (default: true)
  *   - show_in_3d: show slice plane in 3D view (default: true)
  * @returns {string} Slice view ID
  *
  * @description
  * Create a 2D slice view from a 3D surface.
  *
  * ```js
  * var slice_id = viewer.createSliceView({
  *   orientation: 'sagittal',
  *   position: 0,
  *   width: 512,
  *   height: 512,
  *   linked: true
  * });
  * ```
  */
  viewer.createSliceView = function(options) {
    options = options || {};

    var slice_id = "slice_" + (slice_counter++) + "_" + Date.now();

    var orientation = options.orientation || 'sagittal';
    var normal, up_vector;

    switch (orientation) {
      case 'sagittal':
        normal = new THREE.Vector3(1, 0, 0);
        up_vector = new THREE.Vector3(0, 0, 1);
        break;
      case 'coronal':
        normal = new THREE.Vector3(0, 1, 0);
        up_vector = new THREE.Vector3(0, 0, 1);
        break;
      case 'axial':
        normal = new THREE.Vector3(0, 0, 1);
        up_vector = new THREE.Vector3(0, 1, 0);
        break;
      case 'custom':
        if (!options.normal) {
          console.error("Custom orientation requires 'normal' parameter");
          return null;
        }
        normal = new THREE.Vector3(options.normal[0], options.normal[1], options.normal[2]);
        normal.normalize();
        up_vector = new THREE.Vector3(0, 0, 1); // Default up
        break;
      default:
        normal = new THREE.Vector3(1, 0, 0);
        up_vector = new THREE.Vector3(0, 0, 1);
    }

    var slice_view = {
      id: slice_id,
      orientation: orientation,
      position: options.position || 0,
      normal: normal,
      up_vector: up_vector,
      width: options.width || 512,
      height: options.height || 512,
      model_name: options.model_name || viewer.model_data.get().name,
      linked: options.linked !== undefined ? options.linked : true,
      show_in_3d: options.show_in_3d !== undefined ? options.show_in_3d : true,
      canvas: null,
      context: null,
      image_data: null,
      contours: [],
      plane_helper: null
    };

    // Create canvas for 2D rendering
    slice_view.canvas = document.createElement('canvas');
    slice_view.canvas.width = slice_view.width;
    slice_view.canvas.height = slice_view.height;
    slice_view.context = slice_view.canvas.getContext('2d');

    slice_views[slice_id] = slice_view;

    // Create 3D plane helper
    if (slice_view.show_in_3d) {
      createSlicePlaneHelper(slice_view);
    }

    // Initial extraction
    extractSlice(slice_view);

    return slice_id;
  };

  /**
  * @doc function
  * @name viewer.sliceProjection:updateSlicePosition
  * @param {string} slice_id Slice view ID
  * @param {number} position New position along normal
  *
  * @description
  * Update slice position.
  *
  * ```js
  * viewer.updateSlicePosition(slice_id, 25.5);
  * ```
  */
  viewer.updateSlicePosition = function(slice_id, position) {
    var slice_view = slice_views[slice_id];
    if (!slice_view) return;

    slice_view.position = position;

    if (slice_view.plane_helper) {
      slice_view.plane_helper.position.copy(slice_view.normal).multiplyScalar(position);
    }

    extractSlice(slice_view);
    viewer.updated = true;
  };

  /**
  * @doc function
  * @name viewer.sliceProjection:setSliceOrientation
  * @param {string} slice_id Slice view ID
  * @param {object} options Orientation options:
  *   - normal: [x, y, z] normal vector
  *   - up: [x, y, z] up vector (optional)
  *
  * @description
  * Set custom slice orientation.
  *
  * ```js
  * viewer.setSliceOrientation(slice_id, {
  *   normal: [0.707, 0.707, 0],
  *   up: [0, 0, 1]
  * });
  * ```
  */
  viewer.setSliceOrientation = function(slice_id, options) {
    options = options || {};
    var slice_view = slice_views[slice_id];
    if (!slice_view) return;

    if (options.normal) {
      slice_view.normal.set(options.normal[0], options.normal[1], options.normal[2]);
      slice_view.normal.normalize();
      slice_view.orientation = 'custom';
    }

    if (options.up) {
      slice_view.up_vector.set(options.up[0], options.up[1], options.up[2]);
      slice_view.up_vector.normalize();
    }

    if (slice_view.plane_helper) {
      updateSlicePlaneHelper(slice_view);
    }

    extractSlice(slice_view);
    viewer.updated = true;
  };

  /**
  * @doc function
  * @name viewer.sliceProjection:getSliceCanvas
  * @param {string} slice_id Slice view ID
  * @returns {HTMLCanvasElement} Canvas element with slice rendering
  *
  * @description
  * Get the canvas element containing the slice image.
  *
  * ```js
  * var canvas = viewer.getSliceCanvas(slice_id);
  * document.body.appendChild(canvas);
  * ```
  */
  viewer.getSliceCanvas = function(slice_id) {
    var slice_view = slice_views[slice_id];
    return slice_view ? slice_view.canvas : null;
  };

  /**
  * @doc function
  * @name viewer.sliceProjection:removeSliceView
  * @param {string} slice_id Slice view ID
  *
  * @description
  * Remove a slice view.
  *
  * ```js
  * viewer.removeSliceView(slice_id);
  * ```
  */
  viewer.removeSliceView = function(slice_id) {
    var slice_view = slice_views[slice_id];
    if (!slice_view) return;

    if (slice_view.plane_helper) {
      viewer.model.remove(slice_view.plane_helper);
    }

    delete slice_views[slice_id];
    viewer.updated = true;
  };

  /**
  * @doc function
  * @name viewer.sliceProjection:refreshAllSlices
  *
  * @description
  * Refresh all slice views (useful after data updates).
  *
  * ```js
  * viewer.refreshAllSlices();
  * ```
  */
  viewer.refreshAllSlices = function() {
    Object.keys(slice_views).forEach(function(slice_id) {
      extractSlice(slice_views[slice_id]);
    });
  };

  ////////////////////////////////////
  // PRIVATE FUNCTIONS
  ////////////////////////////////////

  function extractSlice(slice_view) {
    var model_data = viewer.model_data.get(slice_view.model_name);
    if (!model_data) return;

    // Clear canvas
    slice_view.context.fillStyle = '#000000';
    slice_view.context.fillRect(0, 0, slice_view.width, slice_view.height);

    // Extract contours where surface intersects plane
    var contours = extractContours(slice_view, model_data);
    slice_view.contours = contours;

    // Draw contours
    drawContours(slice_view, contours);

    // Sample intensity data at slice
    if (model_data.intensity_data && model_data.intensity_data.length > 0) {
      sampleIntensityAtSlice(slice_view, model_data);
    }

    viewer.triggerEvent("slice:updated", {
      slice_id: slice_view.id,
      position: slice_view.position
    });
  }

  function extractContours(slice_view, model_data) {
    var vertices = model_data.vertices;
    var contours = [];

    // Plane equation: normal · (point - position*normal) = 0
    var plane_point = slice_view.normal.clone().multiplyScalar(slice_view.position);
    var threshold = 0.01; // Tolerance for plane intersection

    // Check each triangle for intersection
    model_data.shapes.forEach(function(shape) {
      var indices = shape.indices;

      for (var i = 0; i < indices.length; i += 3) {
        var i0 = indices[i] * 3;
        var i1 = indices[i+1] * 3;
        var i2 = indices[i+2] * 3;

        var v0 = new THREE.Vector3(vertices[i0], vertices[i0+1], vertices[i0+2]);
        var v1 = new THREE.Vector3(vertices[i1], vertices[i1+1], vertices[i1+2]);
        var v2 = new THREE.Vector3(vertices[i2], vertices[i2+1], vertices[i2+2]);

        // Calculate signed distances to plane
        var d0 = slice_view.normal.dot(v0.clone().sub(plane_point));
        var d1 = slice_view.normal.dot(v1.clone().sub(plane_point));
        var d2 = slice_view.normal.dot(v2.clone().sub(plane_point));

        // Check if triangle intersects plane
        var intersections = [];

        if (Math.abs(d0) < threshold) intersections.push(v0);
        if (Math.abs(d1) < threshold) intersections.push(v1);
        if (Math.abs(d2) < threshold) intersections.push(v2);

        // Check edge intersections
        if (d0 * d1 < 0) {
          var t = d0 / (d0 - d1);
          intersections.push(v0.clone().lerp(v1, t));
        }
        if (d1 * d2 < 0) {
          var t2 = d1 / (d1 - d2);
          intersections.push(v1.clone().lerp(v2, t2));
        }
        if (d2 * d0 < 0) {
          var t3 = d2 / (d2 - d0);
          intersections.push(v2.clone().lerp(v0, t3));
        }

        // Add line segment if we have exactly 2 intersections
        if (intersections.length >= 2) {
          contours.push({
            start: intersections[0],
            end: intersections[1]
          });
        }
      }
    });

    return contours;
  }

  function drawContours(slice_view, contours) {
    if (contours.length === 0) return;

    var ctx = slice_view.context;

    // Calculate bounding box to fit slice
    var bbox = calculateBoundingBox(contours);

    // Transform 3D coordinates to 2D canvas coordinates
    var right_vector = new THREE.Vector3();
    right_vector.crossVectors(slice_view.up_vector, slice_view.normal);
    right_vector.normalize();

    var scale = Math.min(
      slice_view.width / (bbox.max_x - bbox.min_x),
      slice_view.height / (bbox.max_y - bbox.min_y)
    ) * 0.9;

    var offset_x = slice_view.width / 2;
    var offset_y = slice_view.height / 2;

    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 1;

    contours.forEach(function(contour) {
      var start_2d = project3DTo2D(contour.start, slice_view, right_vector, offset_x, offset_y, scale);
      var end_2d = project3DTo2D(contour.end, slice_view, right_vector, offset_x, offset_y, scale);

      ctx.beginPath();
      ctx.moveTo(start_2d.x, start_2d.y);
      ctx.lineTo(end_2d.x, end_2d.y);
      ctx.stroke();
    });
  }

  function project3DTo2D(point, slice_view, right_vector, offset_x, offset_y, scale) {
    // Project 3D point onto 2D slice plane
    var x = right_vector.dot(point) * scale + offset_x;
    var y = slice_view.up_vector.dot(point) * scale + offset_y;

    return {x: x, y: y};
  }

  function calculateBoundingBox(contours) {
    var min_x = Infinity, max_x = -Infinity;
    var min_y = Infinity, max_y = -Infinity;
    var min_z = Infinity, max_z = -Infinity;

    contours.forEach(function(contour) {
      [contour.start, contour.end].forEach(function(point) {
        min_x = Math.min(min_x, point.x);
        max_x = Math.max(max_x, point.x);
        min_y = Math.min(min_y, point.y);
        max_y = Math.max(max_y, point.y);
        min_z = Math.min(min_z, point.z);
        max_z = Math.max(max_z, point.z);
      });
    });

    return {min_x: min_x, max_x: max_x, min_y: min_y, max_y: max_y, min_z: min_z, max_z: max_z};
  }

  function sampleIntensityAtSlice(slice_view, model_data) {
    // Sample intensity data from vertices near the slice plane
    var intensity_data = model_data.intensity_data[0];
    if (!intensity_data) return;

    var ctx = slice_view.context;
    var image_data = ctx.getImageData(0, 0, slice_view.width, slice_view.height);

    // This would require more sophisticated interpolation
    // For now, just overlay intensity on contours

    ctx.putImageData(image_data, 0, 0);
  }

  function createSlicePlaneHelper(slice_view) {
    var size = 200;
    var geometry = new THREE.PlaneGeometry(size, size);
    var material = new THREE.MeshBasicMaterial({
      color: 0x00FFFF,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.2,
      wireframe: false
    });

    slice_view.plane_helper = new THREE.Mesh(geometry, material);
    updateSlicePlaneHelper(slice_view);

    viewer.model.add(slice_view.plane_helper);
  }

  function updateSlicePlaneHelper(slice_view) {
    if (!slice_view.plane_helper) return;

    slice_view.plane_helper.position.copy(slice_view.normal).multiplyScalar(slice_view.position);

    // Orient plane
    var target = slice_view.normal.clone().multiplyScalar(slice_view.position + 1);
    slice_view.plane_helper.lookAt(target);
  }

};
