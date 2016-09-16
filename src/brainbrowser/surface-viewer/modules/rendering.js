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
* Author: Tarek Sherif <tsherif@gmail.com> (http://tareksherif.ca/)
* Author: Paul Mougel
* Author: Lindsay Lewis <lindsayblewis@gmail.com>
* Author: Natacha Beck <natabeck@gmail.com>
*/

BrainBrowser.SurfaceViewer.modules.rendering = function(viewer) {
  "use strict";

  var THREE = BrainBrowser.SurfaceViewer.THREE;

  var renderer = new THREE.WebGLRenderer({
    preserveDrawingBuffer: true,
    alpha: true,
    autoClear: false,
  });
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(30, viewer.dom_element.offsetWidth / viewer.dom_element.offsetHeight, 1, 3000);
  var default_camera_distance = 500;
  var light = new THREE.PointLight(0xFFFFFF);
  var current_frame;
  var last_frame;
  var effect = renderer;
  var effects = {};
  var canvas = renderer.domElement;
  var old_zoom_level;

  viewer.model = new THREE.Object3D();

  scene.add(viewer.model);

  /**
  * @doc function
  * @name viewer.rendering:render
  * @description
  * Start the render loop.
  * ```js
  * viewer.render();
  * ```
  */
  viewer.render = function() {
    var dom_element = viewer.dom_element;
    renderer.setClearColor(0x000000);
    dom_element.appendChild(renderer.domElement);

    camera.position.z = default_camera_distance;

    light.position.set(0, 0, default_camera_distance);
    scene.add(light);

    viewer.updateViewport();

    renderFrame();
  };

  /**
  * @doc function
  * @name viewer.rendering:updateViewport
  * @description
  * Update the viewport size and aspect ratio to fit
  * the current size of the viewer DOM element.
  * ```js
  * viewer.updateViewport();
  * ```
  */
  viewer.updateViewport = function() {
    var dom_element = viewer.dom_element;

    effect.setSize(dom_element.offsetWidth, dom_element.offsetHeight);
    camera.aspect = dom_element.offsetWidth / dom_element.offsetHeight;
    camera.updateProjectionMatrix();

    viewer.updated = true;
  };

  /**
  * @doc function
  * @name viewer.rendering:canvasDataURL
  * @returns {string} The data URL.
  * @description
  * Returns the Data URL of the canvas the viewer is using
  * so it can be used to create an image.
  * ```js
  * viewer.canvasDataURL();
  * ```
  */
  viewer.canvasDataURL = function() {
    return renderer.domElement.toDataURL();
  };

  /**
  * @doc function
  * @name viewer.rendering:addEffect
  * @param {string} effect_name The name of the effect as defined in three.js.
  * @description
  * Add a three.js postprocessing effect to the viewer.
  * ```js
  * viewer.addEffect("AnaglyphEffect");
  * ```
  */
  viewer.addEffect = function(effect_name) {
    var effect;
    if (BrainBrowser.utils.isFunction(THREE[effect_name])) {
      effect = new THREE[effect_name](renderer);
      effect.setSize(viewer.dom_element.offsetWidth, viewer.dom_element.offsetHeight);

      effects[effect_name] = effect;
    }
  };

  /**
  * @doc function
  * @name viewer.rendering:setEffect
  * @param {string} effect_name The name of the effect as defined in three.js.
  * @description
  * Activate a previously added postprocessing effect.
  * ```js
  * viewer.setEffect("AnaglyphEffect");
  * ```
  */
  viewer.setEffect = function(effect_name) {
    effect = effects[effect_name] ? effects[effect_name] : renderer;
    effect.setSize(viewer.dom_element.offsetWidth, viewer.dom_element.offsetHeight);
    effect.render(scene, camera);  // Not sure why: effects seem to need to render twice before they work properly.

    viewer.updated = true;
  };

  /**
  * @doc function
  * @name viewer.rendering:setCameraPosition
  * @param {number} x The x coordinate of the camera.
  * @param {number} y The y coordinate of the camera.
  * @param {number} z The z coordinate of the camera.
  * @description
  * Set the camera position.
  * ```js
  * viewer.setCameraPosition(10, 25, 12);
  * ```
  */
  viewer.setCameraPosition = function(x, y, z) {
    camera.position.set(x, y, z);
    light.position.set(x, y, z);

    viewer.updated = true;
  };

  /**
  * @doc function
  * @name viewer.rendering:getCameraPosition
  * @description
  * Get the camera position.
  * ```js
  * viewer.getCameraPosition();
  * ```
  */
  viewer.getCameraPosition = function() {
    return camera.position;
  };

  /**
  * @doc function
  * @name viewer.rendering:resetView
  * @description
  * Resets the view of the scene.
  * ```js
  * viewer.resetView();
  * ```
  */
  viewer.resetView = function() {
    var model = viewer.model;
    var inv   = new THREE.Matrix4();
    inv.getInverse(model.matrix);

    model.applyMatrix(inv);
    camera.position.set(0, 0, default_camera_distance);
    light.position.set(0, 0, default_camera_distance);

    var offset = model.userData.model_center_offset || new THREE.Vector3(0,0,0);
    model.children.forEach(function(shape) {
      var centroid   = shape.userData.centroid;
      var recentered = shape.userData.recentered;

      // The check for original_data tells us
      // this is a loaded model, rather than
      // an annotation, etc.
      if (shape.userData.original_data) {
        if (centroid && recentered) {
          shape.position.set(
            centroid.x + offset.x,
            centroid.y + offset.y,
            centroid.z + offset.z
          );
        } else {
          shape.position.set(offset.x, offset.y, offset.z);
        }
        shape.rotation.set(0, 0, 0);
        shape.material.opacity = 1;
      }
    });

    model.rotation.set(0, 0, 0);
    viewer.zoom = 1;

    viewer.updated = true;
  };

  /**
  * @doc function
  * @name viewer.rendering:setClearColor
  * @param {number} color A hexadecimal number representing the RGB color to use.
  * @param {number} define the opacity.
  * @description
  * Updates the clear color of the viewer.
  * ```js
  * viewer.setClearColor(0xFF0000);
  * ```
  */
  viewer.setClearColor = function(color,alpha)  {
    if (alpha === undefined) alpha = 1;
    renderer.setClearColor(color, alpha);

    viewer.updated = true;
  };

  /**
  * @doc function
  * @name viewer.rendering:drawDot
  * @param {number} x The x coordinate.
  * @param {number} y The y coordinate.
  * @param {number} z The z coordinate.
  * @param {number} radius Radius of the sphere (default: 2).
  * @param {number} color Color of the sphere as a hexadecimal integer (default: 0xFF0000).
  *
  * @returns {object} The sphere itself.
  *
  * @description Draw a sphere in the current scene. Handy for debugging.
  * ```js
  * viewer.drawDot(10, 5, 15, 3, 0x00FF00);
  * ```
  */
  viewer.drawDot = function(x, y, z, radius, color) {
    radius = radius || 2;
    radius = radius >= 0 ? radius : 0;
    color  = color  >= 0 ? color  : 0xFF0000;

    var geometry = new THREE.SphereGeometry(radius);
    var material = new THREE.MeshBasicMaterial({color: color});

    var sphere   = new THREE.Mesh(geometry, material);
    sphere.position.set(x, y, z);

    if (viewer.model) {
      var offset     = viewer.model.userData.model_center_offset;
      if (offset !== undefined) {
        sphere.translateX(-offset.x);
        sphere.translateY(-offset.y);
        sphere.translateZ(-offset.z);
      }
      viewer.model.add(sphere);
    } else {
      scene.add(sphere);
    }

    viewer.updated = true;

    return sphere;

  };

  /**
  * @doc function
  * @name viewer.rendering:drawGrid
  * @param {number} size The size of the grid.
  * @param {number} step The size of the step between 2 lines.
  * @param {object} options Options, which include the following:
  *
  * * **name** The name of the object.
  * * **color_center_line** The color of the centerline as a hexadecimal integer (default 0x444444).
  * * **color_grid** The color of the lines of the grid as a hexadecimal integer (default 0x888888).
  * * **x** The x coordinate (default: 0).
  * * **y** The y coordinate (default: 0).
  * * **z** The z coordinate (default: 0).
  * * **euler_rotation** The Euler angles to apply.
  *
  * @returns {object} The grid itself.
  *
  * @description Draw a Grid in the current scene.
  * ```js
  * var euler_rotation = new THREE.Euler( 0, 0, Math.PI/2, 'XYZ' );
  * viewer.drawGrid(100, 10, {euler_rotation: euler_rotation});
  * ```
  */
  viewer.drawGrid = function(size, step, options) {
    options               = options || {};
    var name              = options.name;
    var color_center_line = options.color_center_line;
    var color_grid        = options.color_grid;
    var x                 = options.x || 0;
    var y                 = options.y || 0;
    var z                 = options.z || 0;
    var euler_rotation    = options.euler_rotation;

    // Define default size and step
    if (size === undefined || size <= 0) { size = 100; }
    if (step === undefined || step <= 0) { step = 10; }

    // Define default colors
    color_center_line = color_center_line >= 0 ? color_center_line : 0x444444;
    color_grid        = color_grid        >= 0 ? color_grid        : 0x888888;

    // Create the grid
    var grid  = new THREE.GridHelper(size, step);
    grid.name = name;
    grid.setColors(color_center_line, color_grid);
    grid.position.set(x,y,z);
    // Used euler_rotation only if present
    if ( euler_rotation !== undefined ) { grid.setRotationFromEuler(euler_rotation); }

    if (viewer.model) {
      viewer.model.add(grid);
    } else {
      scene.add(grid);
    }

    viewer.updated = true;

    return grid;
  };

  /**
  * @doc function
  * @name viewer.rendering:gridHelper
  * @param {number} horizontal_from where start the grid horizontally
  * @param {number} horizontal_to where end the grid horizontally
  * @param {number} x1 where horizontal vertices start
  * @param {number} x2 where horizontal vertices end
  * @param {object} horizontal_color a THREE color
  * @param {number} where start the grid vertically
  * @param {number} where end the grid vertically
  * @param {number} z1 where vertical vertices start
  * @param {number} z2 where horizontal vertices end
  * @param {object} vertical_color a THREE color
  * @param {number} step of the grid
  *
  * @returns {object} The grid itself.
  *
  * @description return an object that represent the grid.
  * ```js
  * var horizontal_color = new THREE.Color(0x000000);
  * var vertical_color   = new THREE.Color(0xFF0000);
  * var gridXY           = viewer.gridHelper( -100, 100, -100, 100, horizontal_color, -100, 100, 100, -100, vertical_color, 10)
  * ```
  *
  */
  viewer.gridHelper = function ( horizontal_from, horizontal_to, x1, x2, horizontal_color, vertical_from, vertical_to, z1, z2, vertical_color, step) {
    var geometry = new THREE.Geometry();
    var material = new THREE.LineBasicMaterial( { vertexColors: THREE.VertexColors } );

    var grid     = Object.create( THREE.GridHelper.prototype );

    // Horizontal axes
    for ( var z = horizontal_from; z <= horizontal_to; z += step ) {
      geometry.vertices.push(
        new THREE.Vector3( x1, 0, z ),
        new THREE.Vector3( x2, 0, z )
      );
      geometry.colors.push( horizontal_color, horizontal_color );
    }

    // Vertical axes
    for ( var x = vertical_from; x <= vertical_to; x += step ) {
      geometry.vertices.push(
        new THREE.Vector3( x, 0, z1),
        new THREE.Vector3( x, 0, z2)
      );
      geometry.colors.push( vertical_color, vertical_color );
    }

    THREE.Line.call( grid, geometry, material, THREE.LinePieces );
    return grid;
  };

  /**
  * @doc function
  * @name viewer.rendering:drawLine
  * @param {object} start A Vector3, start of the line segment
  * @param {object} end A Vector3, end of the line segment
  * @param {object} options Options, which include the following:
  *
  * * **color** The color of the line as a hexadecimal integer (default 0x444444).
  * * **dashed** If true create a dashed line
  * * **draw**   If false don't draw the line
  *
  * @returns {object} The line itself.
  *
  * @description Draw a line in the current scene.
  * ```js
  * var start = new THREE.Vector3(0,0,0);
  * var end   = new THREE.Vector3(200,200,200);
  * viewer.drawLine(start, end, {dashed: true});
  * ```
  */
  viewer.drawLine = function( start, end, options ) {
    options      = options || {};
    var color    = options.color >= 0 ? options.color : 0x444444;

    // Create the geometry
    var geometry = new THREE.Geometry();
    geometry.vertices.push( start.clone() );
    geometry.vertices.push( end.clone() );
    geometry.computeLineDistances();

    // Set the material according with the dashed option
    var material = options.dashed === true ?
                     new THREE.LineDashedMaterial({ linewidth: 3, color: color, gapSize: 3 })
                   : new THREE.LineBasicMaterial( { linewidth: 3, color: color });

    var line = new THREE.Line( geometry, material, THREE.LinePieces );

    if (options.draw === false) {return line;}

    if (viewer.model) {
      viewer.model.add(line);
    } else {
      scene.add(line);
    }

    viewer.updated = true;

    return line;
  };

  /**
  * @doc function
  * @name viewer.rendering:drawAxes
  * @param {number} size Define the size of the line representing the axes.
  * @param {object} options Options, which include the following:
  *
  * * **name** The name of the axes
  * * **center** A Vector3, that represent the orgin of the axes
  * * **x_color** The color of the line as a hexadecimal integer (default 0xff0000).
  * * **y_color** The color of the line as a hexadecimal integer (default 0x00ff00).
  * * **z_color** The color of the line as a hexadecimal integer (default 0x0000ff).
  * * **complete** If true draw postive (plain) and negative axes (dashed)
  *
  *
  * @returns {object} The axes itself.
  *
  * @description
  * Draw Axes in the current scene
  * ```js
  *   viewer.drawAxes(300)
  * ```
  */
  viewer.drawAxes = function(size, options) {
    options      = options || {};
    var name     = options.name   || "axes";
    var center   = options.center || new THREE.Vector3(0,0,0);
    var x_color  = options.x_color >= 0 ? options.x_color : 0xff0000 ;
    var y_color  = options.y_color >= 0 ? options.y_color : 0x00ff00 ;
    var z_color  = options.z_color >= 0 ? options.z_color : 0x0000ff ;
    var complete = options.complete === true;

    // If size is not defined set a reasonable default value
    if (size === undefined) {
      var sizes = viewer.model_data.get().size;
      var max_size = Math.max(sizes.x, sizes.y, sizes.z);
      size = (max_size / 2) *  1.2;
    }

    var axes  = new THREE.Object3D();
    axes.name = name;

    // X axes
    axes.add(viewer.drawLine(center, new THREE.Vector3( center.x + size, center.y, center.z), {color: x_color, dashed: false, draw: false}));
    if (complete) { axes.add(viewer.drawLine(center, new THREE.Vector3(-size + center.x, center.y, center.z), {color: x_color, dashed: true , draw: false})); }

    // Y axes
    axes.add(viewer.drawLine(center, new THREE.Vector3(center.x, center.y + size, center.z), {color: y_color, dashed: false, draw: false}));
    if (complete) { axes.add(viewer.drawLine(center, new THREE.Vector3(center.x, -size + center.y, center.z), {color: y_color, dashed: true, draw: false})); }

    // Z axes
    axes.add(viewer.drawLine(center, new THREE.Vector3(center.x, center.y, center.z + size), {color: z_color, dashed: false, draw: false}));
    if (complete) { axes.add(viewer.drawLine(center, new THREE.Vector3(center.x, center.y, -size + center.z), {color: z_color, dashed: true,  draw: false})); }

    if (viewer.model) {
      viewer.model.add(axes);
    } else {
      scene.add(axes);
    }

    viewer.updated = true;

    return axes;
  };

  /**
  * @doc function
  * @name viewer.rendering:pick
  * @param {number} x The x coordinate on the canvas (defaults to current mouse position).
  * @param {number} y The y coordinate on the canvas (defaults to current mouse position).
  * @param {number} opacity_threshold ignore shape that have opacity lower than the opacity_threshold integer between 0 and 100,
  * @returns {object} If an intersection is detected, returns an object with the following information:
  *
  * * **object** The THREE.Object3D object with which the the click intersected.
  * * **point** A THREE.Vector3 object representing the point in 3D space at which the intersection occured.
  * * **index** The index of the intersection point in the list of vertices.
  *
  * Otherwise returns **null**.
  *
  * @description
  * Returns information about the displayed object
  * and a certain x and y on the canvas. Defaults to
  * the current mouse position.
  * ```js
  * viewer.pick();              // Pick at current mouse position.
  * viewer.pick(125, 250);      // Pick at given position.
  * viewer.pick(125, 250, 25);  // Pick at given position only if opacity of shape is >= to 25%.
  * ```
  */
  viewer.pick = function(x, y, opacity_threshold) {
    x = x === undefined ? viewer.mouse.x : x;
    y = y === undefined ? viewer.mouse.y : y;
    opacity_threshold = opacity_threshold === undefined ? 0.25 : (opacity_threshold / 100.0);

    // Convert to normalized device coordinates.
    x = (x / viewer.dom_element.offsetWidth) * 2 - 1;
    y = (-y / viewer.dom_element.offsetHeight) * 2 + 1;

    var model = viewer.model;
    var raycaster    = new THREE.Raycaster();
    var vector       = new THREE.Vector3(x, y, camera.near);
    var intersection = null;
    var intersects, vertex_data;
    var intersect_object, intersect_point, intersect_indices, intersect_face;
    var intersect_vertex_index, intersect_vertex_coords;
    var min_distance;
    var original_vertices, original_indices;
    var index, coords, distance;
    var i, count;
    var centroid, cx, cy, cz;

    // Because we're comparing against
    // the vertices in their original positions,
    // we have move everything to place the model at its
    // original position.
    var inv_matrix = new THREE.Matrix4();

    vector.unproject(camera);
    raycaster.set(camera.position, vector.sub(camera.position).normalize());
    intersects = raycaster.intersectObject(model, true);

    for (i = 0; i < intersects.length; i++) {
      intersects[i].object.userData.pick_ignore = (intersects[i].object.material.opacity < opacity_threshold);
      if (!intersects[i].object.userData.pick_ignore) {
        intersection = intersects[i];
        break;
      }
    }

    if (intersection !== null) {

      intersect_object = intersection.object;
      intersect_face = intersection.face;
      intersect_indices = [
        intersect_face.a,
        intersect_face.b,
        intersect_face.c
      ];

      if (intersect_object.userData.annotation_info) {
        vertex_data = {
          index: intersect_object.userData.annotation_info.vertex,
          point: intersect_object.userData.annotation_info.position,
          object: intersect_object
        };
      } else {
        // We're dealing with an imported model.

        if (intersect_object.userData.recentered) {
          // Objects have their origins centered
          // to help with transparency, so to check
          // check against original vertices we have
          // move them back.
          centroid = intersect_object.userData.centroid;
          cx = centroid.x;
          cy = centroid.y;
          cz = centroid.z;
        } else {
          cx = cy = cz = 0;
        }


        inv_matrix.getInverse(intersect_object.matrixWorld);
        intersect_point = intersection.point.applyMatrix4(inv_matrix);

        original_vertices = intersect_object.userData.original_data.vertices;
        original_indices = intersect_object.userData.original_data.indices;


        index = intersect_indices[0];
        if (!BrainBrowser.WEBGL_UINT_INDEX_ENABLED) {
          // Have to get the vertex pointed to by the original index because of
          // the de-indexing (see workers/deindex.worker.js)
          index = original_indices[index];
        }
        intersect_vertex_index = index;

        intersect_vertex_coords = new THREE.Vector3(
          original_vertices[index*3],
          original_vertices[index*3+1],
          original_vertices[index*3+2]
        );

        //Compensate for a translated center.
        min_distance = intersect_point.distanceTo(
          new THREE.Vector3(
            intersect_vertex_coords.x - cx,
            intersect_vertex_coords.y - cy,
            intersect_vertex_coords.z - cz
          )
        );

        for (i = 1, count = intersect_indices.length; i < count; i++) {
          index = intersect_indices[i];
          if (!BrainBrowser.WEBGL_UINT_INDEX_ENABLED) {
            // Have to get the vertex pointed to by the original index because of
            // the de-indexing (see workers/deindex.worker.js)
            index = original_indices[index];
          }
          coords = new THREE.Vector3(
            original_vertices[index*3],
            original_vertices[index*3+1],
            original_vertices[index*3+2]
          );
          distance = intersect_point.distanceTo(
            new THREE.Vector3(
              coords.x - cx,
              coords.y - cy,
              coords.z - cz
            )
          );

          if (distance < min_distance) {
            intersect_vertex_index = index;
            intersect_vertex_coords = coords;
            min_distance = distance;
          }

        }

        vertex_data = {
          index: intersect_vertex_index,
          point: intersect_vertex_coords,
          object: intersect_object
        };
      }


    } else {
      vertex_data = null;
    }

    return vertex_data;
  };

  /**
  * @doc function
  * @name viewer.rendering:pickByVertex
  * @param {number} index Index of the vertex.
  * @param {object} options Options, which include the following:
  *
  * * **model_name**: if more than one model file has been loaded, refer to the appropriate
  * model using the **model_name** option.
  *
  * @returns {object} If an intersection is detected, returns an object with the following information:
  *
  * * **object** The THREE.Object3D object with which the the click intersected.
  * * **point** A THREE.Vector3 object representing the point in 3D space at which the intersection occured.
  * * **index** The index of the intersection point in the list of vertices.
  *
  * Otherwise returns **null**.
  *
  * @description
  *
  * ```js
  * viewer.pickByVertex(2356);
  * viewer.pickByVertex(2356, { model_name: "brain.obj" });
  * ```
  */
  viewer.pickByVertex = function(index, options) {
    var model = viewer.model;
    options   = options || {};

    if (index === undefined) {return null;}

    var vector = viewer.getVertex(index, {model_name: options.model_name});

    var intersect_object;
    var vertex_data;
    model.children.forEach(function(child) {
      if (Object.keys(child.userData).length === 0 && child.userData.constructor === Object) { return ; }
      if (Object.keys(child.userData).length !== 0 && child.userData.model_name !== options.model_name) { return ; }

      var vertices = child.geometry.attributes.index.array;
      var j;

      index = parseInt(index,0);
      for (j = 0; j < vertices.length; j++) {
        if (vertices[j] === index){
          intersect_object = child;
          vertex_data = {
            index: index,
            point: vector,
            object: intersect_object,
          };
          break;
        }
      }
    });
    return vertex_data;
  };

  /**
  * @doc function
  * @name viewer.rendering:changeCenterRotation
  * @param {center} a Vector3 that indigate the new center
  *
  * @description
  * Use to change center of rotation.
  *
  *
  * ```js
  * viewer.changeCenterRotation(center);
  * ```
  */
  viewer.changeCenterRotation = function(center) {
    var offset     = new THREE.Vector3(0 , 0, 0);
    // Copy the center into offset, in order to keep center intact
    // we do not want to manipulate center
    offset.copy(center);
    var model      = viewer.model;

    // Adjust the offset value if needed (e.g: if the model was already moved)
    var offset_old = model.userData.model_center_offset || new THREE.Vector3(0,0,0);
    offset.x       = -offset_old.x - offset.x;
    offset.y       = -offset_old.y - offset.y;
    offset.z       = -offset_old.z - offset.z;
    offset.negate();

    /*
      Adjsut all the children.
    */

    // Translate to original place first then translate to new place
    model.children.forEach(function(children) {
      // Return if children was not part of the original model (e.g: axes and grid)
      if (Object.keys(children.userData).length === 0 && children.userData.constructor === Object) { return ; }
      children.translateX(offset_old.x - offset.x);
      children.translateY(offset_old.y - offset.y);
      children.translateZ(offset_old.z - offset.z);
    });

    /*
      Adjsut the parent (a.k.a: the scene)
    */

    // Unapply previous adjustment to scene position due to user manual rotation (this does nothing / has no effect before 1st rotation)
    var inverse_matrix = new THREE.Matrix4().getInverse(model.matrix);
    model.parent.position.applyMatrix4(inverse_matrix);

    // Translate the scene to original position
    model.parent.translateX(-offset_old.x);
    model.parent.translateY(-offset_old.y);
    model.parent.translateZ(-offset_old.z);

    // Compensate scene position for all offsets done to model above
    model.parent.translateX(offset.x);
    model.parent.translateY(offset.y);
    model.parent.translateZ(offset.z);

    // Reapply previous adjustment to scene position due to user manual rotation (this does nothing / has no effect before 1st rotation)
    inverse_matrix = new THREE.Matrix4().getInverse(model.matrix);
    model.parent.position.applyMatrix4(model.matrix);

    // Save offset information in userData
    viewer.model.userData.model_center_offset = offset;

    viewer.updated = true;
  };


  /**
  * @doc function
  * @name viewer.rendering:modelCentric
  *
  * @description
  * Use to recenter data when userData input is shifted in space.
  *
  *
  * ```js
  * viewer.modelCentric(true);
  * ```
  */
  viewer.modelCentric = function() {
    var model = viewer.model;
    viewer.findUserDataCentroid(model);
    var center = model.userData.model_center || new THREE.Vector3(0,0,0);

    // Set Camera position
    viewer.setCameraPosition(center.x,center.y,center.z);

    // Set center position
    viewer.changeCenterRotation(center);

    viewer.updated = true;
  };

  /**
  * @doc function
  * @name viewer.rendering:findUserDataCentroid
  * @param {object} a model.
  *
  * @description
  * Find centroid of the model (only take in account userData).
  *
  * @returns {object} The initial information with additionnal model_center argument.
  *
  * ```js
  * viewer.findUserDataCentroid(model);
  * ```
  */
  viewer.findUserDataCentroid = function(model) {
    // Calculate only if needed
    if (model.userData.model_center_offset !== undefined) {
      return;
    }

    // Calculate bounding box for all children given by the user
    // ignore other children
    var min_x, max_x, min_y, max_y, min_z, max_z;
    min_x = min_y = min_z = Number.POSITIVE_INFINITY;
    max_x = max_y = max_z = Number.NEGATIVE_INFINITY;

    model.children.forEach(function(children){
      var model_name    = children.userData.model_name;
      var model_data    = viewer.model_data.get(model_name);

      var children_name = children.name;
      model_data.shapes.forEach(function(shape){
        if (shape.name !== children_name) {
          return;
        }
        var bounding_box  = shape.bounding_box;

        // min
        min_x = Math.min(min_x, bounding_box.min_x);
        min_y = Math.min(min_y, bounding_box.min_y);
        min_z = Math.min(min_z, bounding_box.min_z);
        // max
        max_x = Math.max(max_x, bounding_box.max_x);
        max_y = Math.max(max_y, bounding_box.max_y);
        max_z = Math.max(max_z, bounding_box.max_z);
      });

      // centroid of all the model
      var centroid = new THREE.Vector3();
      centroid.x   =  min_x + (max_x - min_x) / 2;
      centroid.y   =  min_y + (max_y - min_y) / 2;
      centroid.z   =  min_z + (max_z - min_z) / 2;

      model.userData.model_center  = new THREE.Vector3(centroid.x, centroid.y, centroid.z);
    });
  };

  ////////////////////////////////////
  // PRIVATE FUNCTIONS
  ////////////////////////////////////

  // Render a single frame on the viewer.
  function renderFrame(timestamp) {
    var model = viewer.model;
    var delta;
    var rotation;
    var position = camera.position;
    var new_z    = default_camera_distance / viewer.zoom;

    window.requestAnimationFrame(renderFrame);

    last_frame = current_frame || timestamp;
    current_frame = timestamp;

    delta = current_frame - last_frame;
    rotation = delta * 0.00015;

    if (viewer.autorotate.x) {
      model.rotation.x += rotation;
      viewer.updated = true;
    }
    if (viewer.autorotate.y) {
      model.rotation.y += rotation;
      viewer.updated = true;
    }
    if (viewer.autorotate.z) {
      model.rotation.z += rotation;
      viewer.updated = true;
    }
    if (old_zoom_level !== viewer.zoom) {
      old_zoom_level = viewer.zoom;
      viewer.updated = true;
      viewer.triggerEvent("zoom", { zoom: viewer.zoom });
    }

    if (viewer.updated) {
      if (new_z > camera.near && new_z < 0.9 * camera.far) {
        position.z = new_z;
        light.position.z = new_z;
      }
      effect.render(scene, camera);
      viewer.triggerEvent("draw", {
        renderer: effect,
        scene: scene,
        camera: camera
      });
      viewer.updated = false;
    }
  }

  ////////////////////////////////
  // CONTROLS
  ////////////////////////////////

  (function() {
    var model = viewer.model;
    var movement = "rotate";
    var last_x = null;
    var last_y = null;
    var last_touch_distance = null;

    function drag(pointer, multiplier) {
      var inverse = new THREE.Matrix4();
      var x       = pointer.x;
      var y       = pointer.y;
      var dx, dy;


      if (last_x !== null) {
        dx = x - last_x;
        dy = y - last_y;

        if (movement === "rotate") {

          // Want to always be rotating around world axes.
          inverse.getInverse(model.matrix);
          var axis = new THREE.Vector3(1, 0, 0).applyMatrix4(inverse).normalize();
          model.rotateOnAxis(axis, dy / 150);

          inverse.getInverse(model.matrix);
          axis = new THREE.Vector3(0, 1, 0).applyMatrix4(inverse).normalize();
          model.rotateOnAxis(axis, dx / 150);

          if (viewer.model_data.related_models !== undefined ) {
            viewer.model_data.related_models.forEach(function(child){
              child.rotation.x = model.rotation.x;
              child.rotation.y = model.rotation.y;
              child.rotation.z = model.rotation.z;
            });
          }
        } else {
          multiplier  = multiplier || 1.0;
          multiplier *= camera.position.z / default_camera_distance;

          camera.position.x -= dx * multiplier * 0.25;
          light.position.x  -= dx * multiplier * 0.25;
          camera.position.y += dy * multiplier * 0.25;
          light.position.y  += dy * multiplier * 0.25;
        }
      }

      last_x = x;
      last_y = y;

      viewer.updated = true;
    }

    function touchZoom() {
      var dx = viewer.touches[0].x - viewer.touches[1].x;
      var dy = viewer.touches[0].y - viewer.touches[1].y;

      var distance = Math.sqrt(dx * dx + dy * dy);
      var delta;

      if (last_touch_distance !== null) {
        delta = distance - last_touch_distance;

        viewer.zoom *= 1.0 + 0.01 * delta;
      }

      last_touch_distance = distance;
    }

    function mouseDrag(event) {
      event.preventDefault();
      drag(viewer.mouse, 1.1);
    }

    function touchDrag(event) {
      event.preventDefault();
      if (movement === "zoom") {
        touchZoom();
      } else {
        drag(viewer.touches[0], 2);
      }
    }

    function mouseDragEnd() {
      document.removeEventListener("mousemove", mouseDrag, false);
      document.removeEventListener("mouseup", mouseDragEnd, false);
      last_x = null;
      last_y = null;
    }

    function touchDragEnd() {
      document.removeEventListener("touchmove", touchDrag, false);
      document.removeEventListener("touchend", touchDragEnd, false);
      last_x = null;
      last_y = null;
      last_touch_distance = null;
    }

    function wheelHandler(event) {
      var delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));

      event.preventDefault();

      viewer.zoom *= 1.0 + 0.05 * delta;
    }

    canvas.addEventListener("mousedown", function(event) {
      document.addEventListener("mousemove", mouseDrag, false);
      document.addEventListener("mouseup", mouseDragEnd, false);

      movement = event.which === 1 ? "rotate" : "translate" ;
    }, false);

    canvas.addEventListener("touchstart", function(event) {
      document.addEventListener("touchmove", touchDrag, false);
      document.addEventListener("touchend", touchDragEnd, false);

      movement = event.touches.length === 1 ? "rotate" :
                 event.touches.length === 2 ? "zoom" :
                 "translate";
    }, false);

    canvas.addEventListener("mousewheel", wheelHandler, false);
    canvas.addEventListener("DOMMouseScroll", wheelHandler, false); // Dammit Firefox

    canvas.addEventListener( 'contextmenu', function(event) {
      event.preventDefault();
    }, false );

  })();

};



