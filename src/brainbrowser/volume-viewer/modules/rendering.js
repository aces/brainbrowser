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

BrainBrowser.VolumeViewer.modules.rendering = function(viewer) {
  "use strict";

  var VolumeViewer = BrainBrowser.VolumeViewer;

  /**
  * @doc function
  * @name viewer.viewer:draw
  *
  * @description
  * Draw current slices to the canvases.
  *
  */
  viewer.draw = function() {
    var context;
    var canvas;
    var frame_width = 4;
    var half_frame_width = frame_width / 2;
    var color_map;

    viewer.volumes.forEach(function(volume) {
      volume.display.forEach(function(panel) {
        canvas = panel.canvas;
        context = panel.context;
        context.globalAlpha = 255;
        context.clearRect(0, 0, canvas.width, canvas.height);

        color_map = volume.color_map || viewer.default_color_map;
        panel.drawSlice();
        panel.drawCursor(color_map.cursor_color);

        if (canvas === viewer.active_canvas) {
          context.save();
          context.strokeStyle = "#EC2121";
          context.lineWidth = frame_width;
          context.strokeRect(
            half_frame_width,
            half_frame_width,
            canvas.width - frame_width,
            canvas.height - frame_width
          );
          context.restore();
        }
      });
    });
  };


  /**
  * @doc function
  * @name viewer.viewer:rendering
  *
  * @description
  * Start render loop around **viewer.draw()**.
  */
  viewer.render = function() {
    BrainBrowser.events.triggerEvent("rendering");

    (function render() {
      window.requestAnimationFrame(render);
  
      viewer.draw();
    })();
  };

  /**
  * @doc function
  * @name viewer.volumes:setCursor
  * @param {number} vol_id Index of the volume.
  * @param {number} axis_num Volume axis to update.
  * @param {object} cursor Object containing the x and y coordinates of the 
  * cursor.
  *
  * @description
  * Set the cursor to a new position in the given volume and axis.
  */
  viewer.setCursor = function(vol_id, axis_name, cursor) {
    var volume = viewer.volumes[vol_id];
    var axis_num = VolumeViewer.utils.axis_to_number[axis_name];

    var panel = volume.display[axis_num];
    var slice = panel.slice;
    var image_origin = panel.getImageOrigin();
    var zoom = panel.zoom;
    var x, y;
    
    panel.cursor.x = cursor.x;
    panel.cursor.y = cursor.y;

    if (cursor) {
      x = Math.floor((cursor.x - image_origin.x) / zoom / Math.abs(slice.width_space.step));
      y = Math.floor(slice.height_space.space_length - (cursor.y - image_origin.y) / zoom  / Math.abs(slice.height_space.step));
    } else {
      x = null;
      y = null;
    }

    viewer.fetchSlice(vol_id, slice.width_space.name, x);
    viewer.fetchSlice(vol_id, slice.height_space.name, y);
  };

  /**
  * @doc function
  * @name viewer.volumes:redrawVolumes
  *
  * @description
  * Redraw all volumes at their current position.
  */
  viewer.redrawVolumes = function() {
    viewer.volumes.forEach(function(volume, vol_id) {
      viewer.fetchSlice(vol_id, "xspace", volume.position.xspace);
      viewer.fetchSlice(vol_id, "yspace", volume.position.yspace);
      viewer.fetchSlice(vol_id, "zspace", volume.position.zspace);
    });
  };

  /**
  * @doc function
  * @name viewer.volumes:resetDisplays
  *
  * @description
  * Reset all displays.
  */
  viewer.resetDisplays = function() {

    viewer.volumes.forEach(function(volume) {
      volume.display.forEach(function(panel) {
        panel.reset();
      });
    });
    
  };
};