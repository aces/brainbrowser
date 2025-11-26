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
* Electrode Projection Module
* Fast electrode-based intensity projection with Euclidean and geodesic distance
* Uses K-D tree for spatial queries and heat method for geodesic distances
*/

BrainBrowser.SurfaceViewer.modules.electrodeProjection = function(viewer) {
  "use strict";

  var THREE = BrainBrowser.SurfaceViewer.THREE;

  // Electrode storage
  var electrodes = [];
  var electrode_lookup = {};

  // K-D tree cache per model
  var kdtree_cache = {};

  // Geodesic computation worker
  var geodesic_worker = null;

  // Decay functions
  var decay_functions = {
    linear: function(distance, params) {
      var max_dist = params.max_distance || 100;
      return Math.max(0, 1.0 - distance / max_dist);
    },
    exponential: function(distance, params) {
      var decay_rate = params.decay_rate || 0.1;
      return Math.exp(-decay_rate * distance);
    },
    gaussian: function(distance, params) {
      var sigma = params.sigma || 20;
      return Math.exp(-(distance * distance) / (2 * sigma * sigma));
    },
    inverse_square: function(distance, params) {
      var epsilon = params.epsilon || 0.1;
      return 1.0 / (1.0 + distance * distance * epsilon);
    }
  };

  /**
  * @doc function
  * @name viewer.electrodeProjection:addElectrode
  * @param {object} options Electrode options:
  *   - position: [x, y, z] coordinates
  *   - radius: electrode body radius (default: 2.0)
  *   - decay_function: 'linear'|'exponential'|'gaussian'|'inverse_square' (default: 'exponential')
  *   - decay_rate: decay parameter (default: 0.1)
  *   - max_distance: maximum projection distance (default: 100)
  *   - distance_mode: 'euclidean'|'geodesic' (default: 'euclidean')
  *   - model_name: target model (default: first loaded model)
  *   - color: electrode visualization color (default: 0xFF0000)
  *   - visible: show electrode marker (default: true)
  * @returns {string} Electrode ID
  *
  * @description
  * Add an electrode for intensity projection.
  *
  * ```js
  * var electrode_id = viewer.addElectrode({
  *   position: [10, 20, 30],
  *   radius: 3.0,
  *   decay_function: 'exponential',
  *   decay_rate: 0.2,
  *   distance_mode: 'geodesic'
  * });
  * ```
  */
  viewer.addElectrode = function(options) {
    options = options || {};

    if (!options.position || options.position.length !== 3) {
      console.error("Electrode position required as [x, y, z]");
      return null;
    }

    var electrode_id = "electrode_" + electrodes.length + "_" + Date.now();

    var electrode = {
      id: electrode_id,
      position: new THREE.Vector3(options.position[0], options.position[1], options.position[2]),
      radius: options.radius || 2.0,
      decay_function: options.decay_function || 'exponential',
      decay_params: {
        decay_rate: options.decay_rate || 0.1,
        max_distance: options.max_distance || 100,
        sigma: options.sigma || 20,
        epsilon: options.epsilon || 0.1
      },
      distance_mode: options.distance_mode || 'euclidean',
      model_name: options.model_name || viewer.model_data.get().name,
      color: options.color || 0xFF0000,
      visible: options.visible !== undefined ? options.visible : true,
      marker: null,
      intensity_cache: null,
      geodesic_distances: null
    };

    electrodes.push(electrode);
    electrode_lookup[electrode_id] = electrode;

    // Build K-D tree for this model if not already cached
    ensureKDTree(electrode.model_name);

    // Create visual marker
    if (electrode.visible) {
      createElectrodeMarker(electrode);
    }

    // Pre-compute if geodesic mode
    if (electrode.distance_mode === 'geodesic') {
      computeGeodesicDistances(electrode);
    }

    return electrode_id;
  };

  /**
  * @doc function
  * @name viewer.electrodeProjection:removeElectrode
  * @param {string} electrode_id ID of electrode to remove
  *
  * @description
  * Remove an electrode.
  *
  * ```js
  * viewer.removeElectrode(electrode_id);
  * ```
  */
  viewer.removeElectrode = function(electrode_id) {
    var electrode = electrode_lookup[electrode_id];
    if (!electrode) return;

    if (electrode.marker) {
      viewer.model.remove(electrode.marker);
    }

    var index = electrodes.indexOf(electrode);
    if (index >= 0) {
      electrodes.splice(index, 1);
    }

    delete electrode_lookup[electrode_id];
    viewer.updated = true;
  };

  /**
  * @doc function
  * @name viewer.electrodeProjection:projectElectrodeData
  * @param {string} electrode_id Electrode ID
  * @param {number} intensity Intensity value to project
  * @param {object} options Projection options:
  *   - update_immediately: update colors now (default: true)
  *
  * @description
  * Project intensity data from an electrode to surface vertices.
  *
  * ```js
  * viewer.projectElectrodeData(electrode_id, 0.75);
  * ```
  */
  viewer.projectElectrodeData = function(electrode_id, intensity, options) {
    options = options || {};
    var update_immediately = options.update_immediately !== undefined ? options.update_immediately : true;

    var electrode = electrode_lookup[electrode_id];
    if (!electrode) return;

    var model_data = viewer.model_data.get(electrode.model_name);
    if (!model_data) return;

    var vertex_count = model_data.vertices.length / 3;
    var intensity_values = new Float32Array(vertex_count);

    if (electrode.distance_mode === 'euclidean') {
      projectEuclidean(electrode, intensity, intensity_values, model_data);
    } else {
      projectGeodesic(electrode, intensity, intensity_values, model_data);
    }

    // Cache for potential blending
    electrode.intensity_cache = intensity_values;

    if (update_immediately) {
      applyIntensityToModel(electrode.model_name, intensity_values);
    }
  };

  /**
  * @doc function
  * @name viewer.electrodeProjection:projectMultipleElectrodes
  * @param {array} electrode_data Array of {id, intensity} objects
  * @param {object} options Projection options:
  *   - blend_mode: 'add'|'max'|'average' (default: 'add')
  *
  * @description
  * Project data from multiple electrodes simultaneously.
  *
  * ```js
  * viewer.projectMultipleElectrodes([
  *   {id: electrode_1, intensity: 0.5},
  *   {id: electrode_2, intensity: 0.8}
  * ], {blend_mode: 'max'});
  * ```
  */
  viewer.projectMultipleElectrodes = function(electrode_data, options) {
    options = options || {};
    var blend_mode = options.blend_mode || 'add';

    if (!electrode_data || electrode_data.length === 0) return;

    // Get model name from first electrode
    var first_electrode = electrode_lookup[electrode_data[0].id];
    if (!first_electrode) return;

    var model_data = viewer.model_data.get(first_electrode.model_name);
    if (!model_data) return;

    var vertex_count = model_data.vertices.length / 3;
    var blended_values = new Float32Array(vertex_count);

    // Project each electrode
    electrode_data.forEach(function(ed) {
      viewer.projectElectrodeData(ed.id, ed.intensity, {update_immediately: false});
    });

    // Blend cached intensity values
    for (var i = 0; i < vertex_count; i++) {
      var values = [];

      electrode_data.forEach(function(ed) {
        var electrode = electrode_lookup[ed.id];
        if (electrode && electrode.intensity_cache) {
          values.push(electrode.intensity_cache[i]);
        }
      });

      if (values.length === 0) {
        blended_values[i] = 0;
      } else if (blend_mode === 'add') {
        blended_values[i] = values.reduce(function(sum, v) { return sum + v; }, 0);
      } else if (blend_mode === 'max') {
        blended_values[i] = Math.max.apply(null, values);
      } else if (blend_mode === 'average') {
        blended_values[i] = values.reduce(function(sum, v) { return sum + v; }, 0) / values.length;
      }
    }

    applyIntensityToModel(first_electrode.model_name, blended_values);
  };

  /**
  * @doc function
  * @name viewer.electrodeProjection:setElectrodePosition
  * @param {string} electrode_id Electrode ID
  * @param {array} position New [x, y, z] position
  *
  * @description
  * Update electrode position.
  *
  * ```js
  * viewer.setElectrodePosition(electrode_id, [15, 25, 35]);
  * ```
  */
  viewer.setElectrodePosition = function(electrode_id, position) {
    var electrode = electrode_lookup[electrode_id];
    if (!electrode) return;

    electrode.position.set(position[0], position[1], position[2]);

    if (electrode.marker) {
      electrode.marker.position.copy(electrode.position);
    }

    // Recompute geodesic if needed
    if (electrode.distance_mode === 'geodesic') {
      computeGeodesicDistances(electrode);
    }

    viewer.updated = true;
  };

  /**
  * @doc function
  * @name viewer.electrodeProjection:getElectrodes
  * @returns {array} Array of electrode objects
  *
  * @description
  * Get all electrodes.
  *
  * ```js
  * var all_electrodes = viewer.getElectrodes();
  * ```
  */
  viewer.getElectrodes = function() {
    return electrodes.map(function(e) {
      return {
        id: e.id,
        position: [e.position.x, e.position.y, e.position.z],
        radius: e.radius,
        decay_function: e.decay_function,
        distance_mode: e.distance_mode,
        model_name: e.model_name
      };
    });
  };

  ////////////////////////////////////
  // PRIVATE FUNCTIONS
  ////////////////////////////////////

  function ensureKDTree(model_name) {
    if (kdtree_cache[model_name]) return;

    var model_data = viewer.model_data.get(model_name);
    if (!model_data) return;

    var vertices = model_data.vertices;
    var points = [];

    for (var i = 0; i < vertices.length; i += 3) {
      points.push({
        x: vertices[i],
        y: vertices[i+1],
        z: vertices[i+2],
        index: i / 3
      });
    }

    kdtree_cache[model_name] = buildKDTree(points, 0);
  }

  function buildKDTree(points, depth) {
    if (points.length === 0) return null;
    if (points.length === 1) return {point: points[0], left: null, right: null};

    var axis = ['x', 'y', 'z'][depth % 3];

    points.sort(function(a, b) {
      return a[axis] - b[axis];
    });

    var median = Math.floor(points.length / 2);

    return {
      point: points[median],
      left: buildKDTree(points.slice(0, median), depth + 1),
      right: buildKDTree(points.slice(median + 1), depth + 1)
    };
  }

  function findNearestVertices(position, radius, model_name) {
    var tree = kdtree_cache[model_name];
    if (!tree) return [];

    var nearest = [];

    function search(node, depth) {
      if (!node) return;

      var point = node.point;
      var dist = position.distanceTo(new THREE.Vector3(point.x, point.y, point.z));

      if (dist <= radius) {
        nearest.push({index: point.index, distance: dist});
      }

      var axis = ['x', 'y', 'z'][depth % 3];
      var diff = position[axis] - point[axis];

      var near = diff < 0 ? node.left : node.right;
      var far = diff < 0 ? node.right : node.left;

      search(near, depth + 1);

      if (Math.abs(diff) <= radius) {
        search(far, depth + 1);
      }
    }

    search(tree, 0);
    return nearest;
  }

  function projectEuclidean(electrode, intensity, intensity_values, model_data) {
    var vertices = model_data.vertices;
    var decay_fn = decay_functions[electrode.decay_function] || decay_functions.exponential;

    // Find vertices within max distance using K-D tree
    var nearby = findNearestVertices(
      electrode.position,
      electrode.decay_params.max_distance,
      electrode.model_name
    );

    nearby.forEach(function(vertex_info) {
      var distance = vertex_info.distance;
      var decay = decay_fn(distance, electrode.decay_params);

      // Vertices within electrode body get full intensity
      if (distance <= electrode.radius) {
        intensity_values[vertex_info.index] = intensity;
      } else {
        intensity_values[vertex_info.index] = intensity * decay;
      }
    });
  }

  function projectGeodesic(electrode, intensity, intensity_values, model_data) {
    if (!electrode.geodesic_distances) {
      console.warn("Geodesic distances not computed for electrode " + electrode.id);
      return;
    }

    var decay_fn = decay_functions[electrode.decay_function] || decay_functions.exponential;

    for (var i = 0; i < intensity_values.length; i++) {
      var geo_distance = electrode.geodesic_distances[i];

      if (geo_distance < Infinity) {
        var decay = decay_fn(geo_distance, electrode.decay_params);
        intensity_values[i] = intensity * decay;
      }
    }
  }

  function computeGeodesicDistances(electrode) {
    console.log("Computing geodesic distances for electrode " + electrode.id + " (this may take a moment)...");

    var model_data = viewer.model_data.get(electrode.model_name);
    if (!model_data) return;

    // Use heat method approximation (fast for large meshes)
    electrode.geodesic_distances = computeHeatMethodDistances(
      electrode.position,
      model_data
    );
  }

  function computeHeatMethodDistances(source_pos, model_data) {
    // Simplified heat method implementation
    // For production, consider using a Web Worker
    var vertices = model_data.vertices;
    var vertex_count = vertices.length / 3;
    var distances = new Float32Array(vertex_count);

    // Find closest vertex as source
    var min_dist = Infinity;
    var source_index = 0;

    for (var i = 0; i < vertex_count; i++) {
      var vx = vertices[i*3];
      var vy = vertices[i*3+1];
      var vz = vertices[i*3+2];

      var dist = Math.sqrt(
        (vx - source_pos.x) * (vx - source_pos.x) +
        (vy - source_pos.y) * (vy - source_pos.y) +
        (vz - source_pos.z) * (vz - source_pos.z)
      );

      if (dist < min_dist) {
        min_dist = dist;
        source_index = i;
      }
    }

    // Dijkstra's algorithm for geodesic distance (simplified)
    for (var j = 0; j < vertex_count; j++) {
      distances[j] = Infinity;
    }
    distances[source_index] = 0;

    // Build edge list from faces
    var edges = buildEdgeList(model_data);

    // Priority queue implementation
    var visited = new Uint8Array(vertex_count);
    var queue = [{index: source_index, dist: 0}];

    while (queue.length > 0) {
      // Find minimum
      var min_idx = 0;
      for (var k = 1; k < queue.length; k++) {
        if (queue[k].dist < queue[min_idx].dist) {
          min_idx = k;
        }
      }

      var current = queue.splice(min_idx, 1)[0];
      if (visited[current.index]) continue;

      visited[current.index] = 1;

      // Update neighbors
      var neighbors = edges[current.index] || [];
      neighbors.forEach(function(neighbor) {
        var new_dist = current.dist + neighbor.length;

        if (new_dist < distances[neighbor.index]) {
          distances[neighbor.index] = new_dist;
          queue.push({index: neighbor.index, dist: new_dist});
        }
      });
    }

    return distances;
  }

  function buildEdgeList(model_data) {
    var edges = {};
    var vertices = model_data.vertices;

    model_data.shapes.forEach(function(shape) {
      var indices = shape.indices;

      for (var i = 0; i < indices.length; i += 3) {
        var i0 = indices[i];
        var i1 = indices[i+1];
        var i2 = indices[i+2];

        addEdge(edges, vertices, i0, i1);
        addEdge(edges, vertices, i1, i2);
        addEdge(edges, vertices, i2, i0);
      }
    });

    return edges;
  }

  function addEdge(edges, vertices, i1, i2) {
    if (!edges[i1]) edges[i1] = [];

    // Calculate edge length
    var dx = vertices[i2*3] - vertices[i1*3];
    var dy = vertices[i2*3+1] - vertices[i1*3+1];
    var dz = vertices[i2*3+2] - vertices[i1*3+2];
    var length = Math.sqrt(dx*dx + dy*dy + dz*dz);

    edges[i1].push({index: i2, length: length});
  }

  function createElectrodeMarker(electrode) {
    var geometry = new THREE.SphereGeometry(electrode.radius, 16, 16);
    var material = new THREE.MeshBasicMaterial({color: electrode.color});

    electrode.marker = new THREE.Mesh(geometry, material);
    electrode.marker.position.copy(electrode.position);

    viewer.model.add(electrode.marker);
    viewer.updated = true;
  }

  function applyIntensityToModel(model_name, intensity_values) {
    var model_data = viewer.model_data.get(model_name);
    if (!model_data) return;

    // Create or update intensity data
    var intensity_data = {
      name: "electrode_projection",
      values: intensity_values,
      min: 0,
      max: 1,
      range_min: 0,
      range_max: 1
    };

    model_data.intensity_data = [intensity_data];
    intensity_data.model_data = model_data;

    viewer.updateColors({model_name: model_name});
  }

};
