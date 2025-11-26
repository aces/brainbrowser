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
* Advanced 3D Clipping Plane Module with GPU Acceleration
* Supports multiple arbitrary-angle clipping planes with real-time manipulation
*/

BrainBrowser.SurfaceViewer.modules.clipping = function(viewer) {
  "use strict";

  var THREE = BrainBrowser.SurfaceViewer.THREE;

  // Clipping plane storage
  var clip_planes = [];
  var max_clip_planes = 8;
  var clip_enabled = false;

  // Shader uniforms for all materials
  var uniform_clip_planes = {
    clipPlanes: { type: "v4v", value: [] },
    numClipPlanes: { type: "i", value: 0 },
    clipEnabled: { type: "i", value: 0 }
  };

  /**
  * @doc function
  * @name viewer.clipping:createClippableMaterial
  * @param {object} options Material options (color, vertexColors, etc.)
  * @returns {object} THREE.ShaderMaterial with clipping support
  *
  * @description
  * Create a custom shader material that supports GPU-based clipping planes
  * while maintaining Phong shading appearance.
  */
  viewer.createClippableMaterial = function(options) {
    options = options || {};

    var vertex_shader = [
      "uniform vec4 clipPlanes[" + max_clip_planes + "];",
      "uniform int numClipPlanes;",
      "uniform int clipEnabled;",
      "",
      "attribute vec3 position;",
      "attribute vec3 normal;",
      "attribute vec4 color;",
      "",
      "varying vec3 vNormal;",
      "varying vec3 vViewPosition;",
      "varying vec4 vColor;",
      "varying vec3 vWorldPosition;",
      "",
      "void main() {",
      "  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);",
      "  vec4 worldPosition = modelMatrix * vec4(position, 1.0);",
      "  ",
      "  vWorldPosition = worldPosition.xyz;",
      "  vNormal = normalMatrix * normal;",
      "  vViewPosition = -mvPosition.xyz;",
      "  vColor = color;",
      "  ",
      "  gl_Position = projectionMatrix * mvPosition;",
      "}"
    ].join("\n");

    var fragment_shader = [
      "uniform vec4 clipPlanes[" + max_clip_planes + "];",
      "uniform int numClipPlanes;",
      "uniform int clipEnabled;",
      "",
      "uniform vec3 ambientLightColor;",
      "uniform vec3 directionalLightColor[1];",
      "uniform vec3 directionalLightDirection[1];",
      "uniform vec3 pointLightColor[1];",
      "uniform vec3 pointLightPosition[1];",
      "",
      "uniform vec3 diffuse;",
      "uniform vec3 ambient;",
      "uniform vec3 specular;",
      "uniform float shininess;",
      "uniform float opacity;",
      "",
      "varying vec3 vNormal;",
      "varying vec3 vViewPosition;",
      "varying vec4 vColor;",
      "varying vec3 vWorldPosition;",
      "",
      "void main() {",
      "  ",
      "  // Clipping plane logic (GPU-accelerated)",
      "  if (clipEnabled == 1) {",
      "    for(int i = 0; i < " + max_clip_planes + "; i++) {",
      "      if (i >= numClipPlanes) break;",
      "      ",
      "      float dist = dot(vWorldPosition, clipPlanes[i].xyz) + clipPlanes[i].w;",
      "      if (dist < 0.0) discard;",
      "    }",
      "  }",
      "  ",
      "  // Phong shading",
      "  vec3 normal = normalize(vNormal);",
      "  vec3 viewPosition = normalize(vViewPosition);",
      "  ",
      "  vec3 totalDiffuse = vec3(0.0);",
      "  vec3 totalSpecular = vec3(0.0);",
      "  ",
      "  // Point light",
      "  vec3 lightDir = normalize(pointLightPosition[0] - vWorldPosition);",
      "  float dotProduct = max(dot(normal, lightDir), 0.0);",
      "  ",
      "  totalDiffuse += pointLightColor[0] * dotProduct;",
      "  ",
      "  vec3 halfVector = normalize(lightDir + viewPosition);",
      "  float dotNormalHalf = max(dot(normal, halfVector), 0.0);",
      "  float specularWeight = pow(dotNormalHalf, shininess);",
      "  totalSpecular += pointLightColor[0] * specular * specularWeight;",
      "  ",
      "  vec3 finalColor = vColor.rgb * (ambientLightColor * ambient + totalDiffuse) + totalSpecular;",
      "  ",
      "  gl_FragColor = vec4(finalColor, opacity * vColor.a);",
      "}"
    ].join("\n");

    var material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.lights,
        {
          diffuse: { type: "c", value: new THREE.Color(options.color || 0xFFFFFF) },
          ambient: { type: "c", value: new THREE.Color(options.ambient || 0xFFFFFF) },
          specular: { type: "c", value: new THREE.Color(options.specular || 0x101010) },
          shininess: { type: "f", value: options.shininess || 150 },
          opacity: { type: "f", value: options.opacity !== undefined ? options.opacity : 1.0 },
          clipPlanes: uniform_clip_planes.clipPlanes,
          numClipPlanes: uniform_clip_planes.numClipPlanes,
          clipEnabled: uniform_clip_planes.clipEnabled
        }
      ]),
      vertexShader: vertex_shader,
      fragmentShader: fragment_shader,
      lights: true,
      vertexColors: options.vertexColors !== undefined ? options.vertexColors : THREE.VertexColors,
      transparent: options.transparent || false,
      side: options.side || THREE.FrontSide
    });

    return material;
  };

  /**
  * @doc function
  * @name viewer.clipping:addClipPlane
  * @param {object} options Clipping plane options:
  *   - normal: [x, y, z] normal vector (default: [0, 1, 0])
  *   - distance: distance from origin (default: 0)
  *   - visible: show visualization of plane (default: false)
  * @returns {string} Unique ID for this clipping plane
  *
  * @description
  * Add a new clipping plane to the scene.
  *
  * ```js
  * var plane_id = viewer.addClipPlane({
  *   normal: [0, 1, 0],
  *   distance: 10,
  *   visible: true
  * });
  * ```
  */
  viewer.addClipPlane = function(options) {
    options = options || {};

    if (clip_planes.length >= max_clip_planes) {
      console.warn("Maximum number of clipping planes (" + max_clip_planes + ") reached");
      return null;
    }

    var normal = options.normal || [0, 1, 0];
    var distance = options.distance !== undefined ? options.distance : 0;
    var visible = options.visible || false;

    // Normalize the normal vector
    var len = Math.sqrt(normal[0]*normal[0] + normal[1]*normal[1] + normal[2]*normal[2]);
    normal = [normal[0]/len, normal[1]/len, normal[2]/len];

    var plane_id = "clip_plane_" + clip_planes.length + "_" + Date.now();

    var plane = {
      id: plane_id,
      normal: new THREE.Vector3(normal[0], normal[1], normal[2]),
      distance: distance,
      visible: visible,
      helper: null
    };

    clip_planes.push(plane);
    updateClipPlaneUniforms();

    if (visible) {
      createPlaneHelper(plane);
    }

    viewer.updated = true;

    return plane_id;
  };

  /**
  * @doc function
  * @name viewer.clipping:removeClipPlane
  * @param {string} plane_id ID of the plane to remove
  *
  * @description
  * Remove a clipping plane.
  *
  * ```js
  * viewer.removeClipPlane(plane_id);
  * ```
  */
  viewer.removeClipPlane = function(plane_id) {
    var index = -1;

    for (var i = 0; i < clip_planes.length; i++) {
      if (clip_planes[i].id === plane_id) {
        index = i;
        break;
      }
    }

    if (index >= 0) {
      var plane = clip_planes[index];

      if (plane.helper) {
        viewer.model.remove(plane.helper);
      }

      clip_planes.splice(index, 1);
      updateClipPlaneUniforms();
      viewer.updated = true;
    }
  };

  /**
  * @doc function
  * @name viewer.clipping:setClipPlane
  * @param {string} plane_id ID of the plane
  * @param {object} options Options to update (normal, distance)
  *
  * @description
  * Update clipping plane parameters.
  *
  * ```js
  * viewer.setClipPlane(plane_id, {
  *   normal: [1, 0, 0],
  *   distance: 20
  * });
  * ```
  */
  viewer.setClipPlane = function(plane_id, options) {
    options = options || {};

    var plane = findPlane(plane_id);
    if (!plane) return;

    if (options.normal) {
      var normal = options.normal;
      var len = Math.sqrt(normal[0]*normal[0] + normal[1]*normal[1] + normal[2]*normal[2]);
      plane.normal.set(normal[0]/len, normal[1]/len, normal[2]/len);
    }

    if (options.distance !== undefined) {
      plane.distance = options.distance;
    }

    if (plane.helper) {
      updatePlaneHelper(plane);
    }

    updateClipPlaneUniforms();
    viewer.updated = true;
  };

  /**
  * @doc function
  * @name viewer.clipping:enableClipping
  * @param {boolean} enabled Enable/disable clipping
  *
  * @description
  * Enable or disable clipping globally.
  *
  * ```js
  * viewer.enableClipping(true);
  * ```
  */
  viewer.enableClipping = function(enabled) {
    clip_enabled = enabled;
    uniform_clip_planes.clipEnabled.value = enabled ? 1 : 0;
    viewer.updated = true;
  };

  /**
  * @doc function
  * @name viewer.clipping:getClipPlanes
  * @returns {array} Array of clip plane objects
  *
  * @description
  * Get all active clipping planes.
  *
  * ```js
  * var planes = viewer.getClipPlanes();
  * ```
  */
  viewer.getClipPlanes = function() {
    return clip_planes.map(function(plane) {
      return {
        id: plane.id,
        normal: [plane.normal.x, plane.normal.y, plane.normal.z],
        distance: plane.distance,
        visible: plane.visible
      };
    });
  };

  /**
  * @doc function
  * @name viewer.clipping:clearClipPlanes
  *
  * @description
  * Remove all clipping planes.
  *
  * ```js
  * viewer.clearClipPlanes();
  * ```
  */
  viewer.clearClipPlanes = function() {
    clip_planes.forEach(function(plane) {
      if (plane.helper) {
        viewer.model.remove(plane.helper);
      }
    });

    clip_planes = [];
    updateClipPlaneUniforms();
    viewer.updated = true;
  };

  ////////////////////////////////////
  // PRIVATE FUNCTIONS
  ////////////////////////////////////

  function findPlane(plane_id) {
    for (var i = 0; i < clip_planes.length; i++) {
      if (clip_planes[i].id === plane_id) {
        return clip_planes[i];
      }
    }
    return null;
  }

  function updateClipPlaneUniforms() {
    var plane_data = [];

    for (var i = 0; i < clip_planes.length; i++) {
      var plane = clip_planes[i];
      // Plane equation: ax + by + cz + d = 0
      // where (a,b,c) is the normal and d = -distance
      plane_data.push(new THREE.Vector4(
        plane.normal.x,
        plane.normal.y,
        plane.normal.z,
        -plane.distance
      ));
    }

    uniform_clip_planes.clipPlanes.value = plane_data;
    uniform_clip_planes.numClipPlanes.value = clip_planes.length;
  }

  function createPlaneHelper(plane) {
    var size = 100;
    var geometry = new THREE.PlaneGeometry(size, size);
    var material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3,
      wireframe: false
    });

    plane.helper = new THREE.Mesh(geometry, material);
    updatePlaneHelper(plane);
    viewer.model.add(plane.helper);
  }

  function updatePlaneHelper(plane) {
    if (!plane.helper) return;

    // Position plane at distance along normal
    plane.helper.position.copy(plane.normal).multiplyScalar(plane.distance);

    // Orient plane perpendicular to normal
    plane.helper.lookAt(
      plane.normal.clone().multiplyScalar(plane.distance + 1)
    );
  }

};
