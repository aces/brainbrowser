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
*/

BrainBrowser.SurfaceViewer.modules.annotations = function(viewer) {
  "use strict";

  var annotations = BrainBrowser.createTreeStore();
  var marker_radius = 0.5;
  var marker_on_color = 0x00FF00;
  var marker_off_color = 0xFF0000;

  viewer.annotations = {
    /**
    * @doc function
    * @name viewer.annotations:add
    * @param {number} vertex The vertex number to be annotated.
    * @param {any} data Arbitrary data to be associated with the vertex.
    * @param {object} options Other options.
    *
    * @description
    * Add an annotation to be associated with the provided vertex.
    * ```js
    * viewer.annotations.add(1234, { hello: true });
    * ```
    *
    * If more than one model has been loaded, a **model_name**
    * option can be provided to specify the model the vertex is 
    * associated with.
    * ```js
    * viewer.annotations.add(1234, { hello: true }, {
    *   model_name: "brain.obj"
    * });
    * ```
    */
    add: function(vertex, data, options) {
      options = options || {};

      var model_name = getModelName(options);
      var annotation, position;

      if (model_name) {
        position = viewer.getVertex(vertex, {
          model_name: options.model_name
        });
        
        annotation = {
          data: data,
          model_name: model_name,
          vertex: vertex,
          position: position,
          marker: viewer.drawDot(position.x, position.y, position.z, marker_radius, marker_off_color)
        };

        annotation.marker.userData.annotation_info = annotation;

        annotations.set(model_name, vertex, annotation);

        if (options.activate !== false) {
          viewer.annotations.activate(vertex, options);
        }
      }
    },

    /**
    * @doc function
    * @name viewer.annotations:get
    * @param {number} vertex The vertex number of the annotation to be
    * retrieved.
    * @param {object} options Other options.
    *
    * @description
    * Retrieve a previously added annotation.
    * ```js
    * viewer.annotations.get(1234);
    * ```
    *
    * If more than one model has been loaded, a **model_name**
    * option can be provided to specify the model the vertex is 
    * associated with.
    * ```js
    * viewer.annotations.get(1234, {
    *   model_name: "brain.obj"
    * });
    * ```
    */
    get: function(vertex, options) {
      options = options || {};

      var model_name = getModelName(options);
      var annotation;

      if (model_name) {
        annotation = annotations.get(model_name, vertex);
        
        if (options.activate !== false) {
          viewer.annotations.activate(vertex, options);
        }
        
        return annotation;
      } else {
        return null;
      }
    },

    /**
    * @doc function
    * @name viewer.annotations:remove
    * @param {number} vertex The vertex number of the annotation to be
    * removed.
    * @param {object} options Other options.
    *
    * @description
    * Remove a previously added annotation.
    * ```js
    * viewer.annotations.remove(1234);
    * ```
    *
    * If more than one model has been loaded, a **model_name**
    * option can be provided to specify the model the vertex is 
    * associated with.
    * ```js
    * viewer.annotations.remove(1234, {
    *   model_name: "brain.obj"
    * });
    * ```
    */
    remove: function(vertex, options) {
      options = options || {};

      var model_name = getModelName(options);
      var annotation;

      if (model_name) {
        annotation = annotations.remove(model_name, vertex);
        viewer.model.remove(annotation.marker);
        annotation.marker = null;
        viewer.updated = true;

        return annotation;
      } else {
        return null;
      }
    },

    /**
    * @doc function
    * @name viewer.annotations:reset
    *
    * @description
    * Remove all previously added annotations.
    * ```js
    * viewer.annotations.reset();
    * ```
    */
    reset: function() {
      viewer.annotations.forEach(function(annotation) {
        viewer.annotations.remove(annotation.vertex);
      });
    },

    /**
    * @doc function
    * @name viewer.annotations:activate
    * @param {number} vertex The vertex number of the 
    * annotation to activate.
    *
    * @description
    * Activate an annotation (color it with the "on"
    * color).
    * ```js
    * viewer.annotations.activate(1234);
    * ```
    * If more than one model has been loaded, a **model_name**
    * option can be provided to specify the model the vertex is 
    * associated with.
    * ```js
    * viewer.annotations.activate(1234, {
    *   model_name: "brain.obj"
    * });
    * ```
    */
    activate: function(vertex, options) {
      options = options || {};

      var active_annotation = viewer.annotations.get(vertex, {
        model_name: options.model_name,
        activate: false
      });

      if (!active_annotation) {
        return;
      }

      viewer.annotations.forEach(function(annotation) {
        if (annotation === active_annotation) {
          annotation.marker.material.color.setHex(marker_on_color);
        } else {
          annotation.marker.material.color.setHex(marker_off_color);
        }
      });

      viewer.updated = true;
    },

    /**
    * @doc function
    * @name viewer.annotations:forEach
    * @param {function} callback Callback function to which
    * the annotations will be passed.
    *
    * @description
    * Iterate over annotations and pass them to a callback function.
    * ```js
    * viewer.annotations.forEach(function(annotation) {
    *   console.log(annotation.data);
    * });
    * ```
    */
    forEach: function(callback) {
      annotations.forEach(2, callback);
    },

    /**
    * @doc function
    * @name viewer.annotations:setMarkerOnColor
    * @param {number} color Hex number representing color for 
    * active annotation markers.
    *
    * @description
    * Set the color to be used for active annotation markers.
    * ```js
    * viewer.annotations.setMarkerOnColor(0xFF0000);
    * ```
    */
    setMarkerOnColor: function(color) {
      marker_on_color = color;
    },

    /**
    * @doc function
    * @name viewer.annotations:setMarkerOffColor
    * @param {number} color Hex number representing color for 
    * non-active annotation markers.
    *
    * @description
    * Set the color to be used for non-active annotation markers.
    * ```js
    * viewer.annotations.setMarkerOnColor(0x00FF00);
    * ```
    */
    setMarkerOffColor: function(color) {
      marker_off_color = color;
    },

    /**
    * @doc function
    * @name viewer.annotations:setMarkerRadius
    * @param {number} radius The radius to use for annotation
    * markers.
    *
    * @description
    * Set the radius to use for annotation markers.
    * ```js
    * viewer.annotations.setMarkerRadius(0.2);
    * ```
    */
    setMarkerRadius: function(radius) {
      marker_radius = radius;
    }
  };

  // Private functions

  function getModelName(options) {
    options = options || {};

    var model_name = options.model_name || null;

    if (!model_name && viewer.model.children[0]) {
      model_name = viewer.model.children[0].userData.model_name;
    }

    return model_name;
  }

};

