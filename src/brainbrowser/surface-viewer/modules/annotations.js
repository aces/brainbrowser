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
    add: function(vertex, data, options) {
      options = options || {};

      var shape_name = getShapeName(options);
      var annotation, position;

      if (shape_name) {
        position = viewer.getVertex(vertex);
        annotation = viewer.drawDot(position.x, position.y, position.z, marker_radius, marker_off_color);

        annotation.annotation_info = {
          data: data,
          shape_name: shape_name,
          vertex: vertex,
          position: position
        };

        annotations.set(shape_name, vertex, annotation);

        if (options.activate !== false) {
          this.activate(annotation);
        }
      } 
    },

    get: function(vertex, options) {
      options = options || {};

      var shape_name = getShapeName(options);
      var annotation;

      if (shape_name) {
        annotation = annotations.get(shape_name, vertex);
        
        if (options.activate !== false) {
          this.activate(annotation);
        }
        
        return annotation;
      } else {
        return null;
      }
    },

    remove: function(vertex, options) {
      options = options || {};

      var shape_name = getShapeName(options);
      var annotation;

      if (shape_name) {
        annotation = annotations.remove(shape_name, vertex);
        viewer.model.remove(annotation);
        return annotation;
      } else {
        return null;
      }
    },

    reset: function() {
      this.forEach(function(annotation) {
        viewer.model.remove(annotation);
      });
      annotations.reset();
    },

    activate: function(active_annotation) {
      if (!active_annotation) {
        return;
      }

      this.forEach(function(annotation) {
        if (annotation === active_annotation) {
          annotation.material.color.setHex(marker_on_color);
        } else {
          annotation.material.color.setHex(marker_off_color);
        }
      });
    },

    forEach: function(callback) {
      annotations.forEach(2, callback);
    },

    setMarkerOnColor: function(color) {
      marker_on_color = color;
    },

    setMarkerOffColor: function(color) {
      marker_off_color = color;
    },

    setMarkerRadius: function(radius) {
      marker_radius = radius;
    }
  };

  // Private functions

  function getShapeName(options) {
    options = options || {};

    var shape_name = options.shape_name || null;

    if (!shape_name && viewer.model.children[0]) {
      shape_name = viewer.model.children[0].name;
    }

    return shape_name;
  }

};

