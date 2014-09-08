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
          volume.color_map.cursor_color,
          viewer.active_panel === panel
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
    viewer.triggerEvent("rendering");

    (function render() {
      window.requestAnimationFrame(render);

      viewer.draw();
    })();
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

    volume.display.forEach(function(panel) {
      panel.updateSlice();
    });
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

  /**
  * @doc function
  * @name viewer.rendering:setPanelSize
  * @param {number} width Panel width.
  * @param {number} height Panel height.
  * @param {object} options The only currently supported
  *   option is **scale_image** which, if set to **true**
  *   will scale the displayed slice by the same proportion
  *   as the panel.
  *
  * @description
  * Update the size of panel canvases.
  * ```js
  * viewer.setPanelSize(512, 512, {
  *   scale_image: true
  * });
  * ```
  */
  viewer.setPanelSize = function(width, height, options) {
    viewer.volumes.forEach(function(volume) {
      volume.display.forEach(function(panel) {
        panel.setSize(width, height, options);
      });
    });
  };
};