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

BrainBrowser.VolumeViewer.modules.rendering = function(viewer) {
  "use strict";

  var VolumeViewer = BrainBrowser.VolumeViewer;

  /**
  * @doc function
  * @name viewer.rendering:draw
  *
  * @description
  * Draw current slices to the canvases.
  * ```js
  * viewer.draw();
  * ```
  */
  viewer.draw = function() {

    viewer.volumes.forEach(function(volume) {
      volume.display.forEach(function(panel) {
        panel.draw(
          (volume.color_map || viewer.default_color_map).cursor_color,
          viewer.active_canvas === panel.canvas
        );
      });
    });
  };


  /**
  * @doc function
  * @name viewer.rendering:render
  *
  * @description
  * Start render loop around **viewer.draw()**.
  * ```js
  * viewer.render();
  * ```
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
  * @name viewer.rendering:setCursor
  * @param {number} vol_id Index of the volume.
  * @param {string} axis_name Volume axis to update.
  * @param {object} cursor Object containing the x and y coordinates of the 
  * cursor.
  *
  * @description
  * Set the cursor to a new position in the given volume and axis.
  * ```js
  * viewer.setCursor(vol_id, "xspace", {
  *   x: 25,
  *   y: 55
  * });
  * ```
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
      y = Math.floor(slice.height_space.space_length - (cursor.y - image_origin.y) / zoom  / Math.abs(slice.height_space.step) - 1);
    } else {
      x = null;
      y = null;
    }

    viewer.fetchSlice(vol_id, slice.width_space.name, x);
    viewer.fetchSlice(vol_id, slice.height_space.name, y);

    panel.updated = true;
  };

  /**
  * @doc function
  * @name viewer.rendering:redrawVolume
  * @param {number} vol_id The id of the volume to be redrawn.
  *
  * @description
  * Redraw a single volume at its current position.
  * ```js
  * viewer.redrawVolume(vol_id);
  * ```
  */
  viewer.redrawVolume = function(vol_id) {
    var volume = viewer.volumes[vol_id];

    viewer.fetchSlice(vol_id, "xspace", volume.position.xspace);
    viewer.fetchSlice(vol_id, "yspace", volume.position.yspace);
    viewer.fetchSlice(vol_id, "zspace", volume.position.zspace);
  };

  /**
  * @doc function
  * @name viewer.rendering:redrawVolumes
  *
  * @description
  * Redraw all volumes at their current position.
  * ```js
  * viewer.redrawVolumes();
  * ```
  */
  viewer.redrawVolumes = function() {
    viewer.volumes.forEach(function(volume, vol_id) {
      viewer.redrawVolume(vol_id);
    });
  };

  /**
  * @doc function
  * @name viewer.rendering:resetDisplays
  *
  * @description
  * Reset all displays.
  * ```js
  * viewer.resetDisplays();
  * ```
  */
  viewer.resetDisplays = function() {

    viewer.volumes.forEach(function(volume) {
      volume.display.forEach(function(panel) {
        panel.reset();
      });
    });
    
  };
};