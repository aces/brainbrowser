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

/**
* @doc object
* @name panel
* @property {object} volume The volume being displayed.
* @property {string} axis The name of the axis being displayed (xspace, yspace or zspace).
* @property {object} slice The slice currently being displayed.
* @property {object} canvas Reference to the canvas area used for drawing.
* @property {object} context The 2D context of the canvas. 
* @property {object} image_center The **x** and **y** coordinates of the
*   center of the slice currently being displayed.
* @property {number} zoom The current zoom level of the panel. 
* @property {object} cursor The current **x** and **y** coordinates of the cursor. 
* @property {object} mouse The current **x** and **y** coordinates of the mouse. 
* @description
* Object representing an individual canvas panel.
*/
(function() {
  "use strict";

  /**
  * @doc function
  * @name VolumeViewer.static methods:createPanel
  * @param {object} options Options used to create the panel.
  *  Options can include:
  *
  * * **volume** The volume being displayed on the panel.
  * * **axis** The axis being displayed on the panel (xspace, yspace or zspace).
  * * **canvas** The canvas on which to draw slices.
  * * **cursor** An object containing the starting **x** and **y** positions of 
  *     the cursor.
  * * **image_center** An object containing the starting **x** and **y** positions of 
  *     the slice image center.
  *
  * @returns {object} Panel object used to control display of a slice.
  * @description
  * Factory function to produce the panel object used to control the 
  * display of a slice.
  * ```js
  * BrainBrowser.VolumeViewer.createPanel({
  *   volume: volume,
  *   axis: "xspace",
  *   canvas: canvas,
  *   cursor: {
  *     x: canvas.width / 2,
  *     y: canvas.height / 2
  *   },
  *   image_center: {
  *     x: canvas.width / 2,
  *     y: canvas.height / 2
  *   }
  * });
  * ```
  * Handlers can be attached to the  **panel** object to listen
  * for certain events occuring over the panel's lifetime. Currently, the
  * following panel events can be listened for:
  *
  * * **zoom** The zoome level has changed on the panel.
  * * **draw** The panel is being re-drawn.
  *
  * To listen for an event, simply use the viewer's **addEventListener()** method with
  * with the event name and a callback funtion:
  *
  * ```js
  *    viewer.addEventListener("sliceupdate", function() {
  *      console.log("Slice updated!");
  *    });
  *
  * ```
  */
  /**
  * @doc object
  * @name VolumeViewer.Panel Events:draw
  *
  * @description
  * Triggered when the panel is redrawn
  * The event handler receives the panel volume as argument.
  *
  * ```js
  *    panel.addEventListener("draw", function(volume) {
  *      console.log("New zoom level:", panel.zoom);
  *    });
  * ```
  */
  /**
  * @doc object
  * @name VolumeViewer.Panel Events:zoom
  *
  * @description
  * Triggered when the user changes the zoom level of the panel (scroll or touch events).
  * The event handler receives the panel volume as argument.
  *
  * ```js
  *    panel.addEventListener("zoom", function(volume) {
  *      console.log("New zoom level:", panel.zoom);
  *    });
  * ```
  */
  /**
  * @doc object
  * @name VolumeViewer.Panel Events:cursorupdate
  *
  * @description
  * Triggered when the user changes the cursor's position in the panel.
  * The event handler receives the new cursor position as argument.
  *
  * ```js
  *    panel.addEventListener("cursorupdate", function(cursor) {
  *      console.log("New cursor position:", cursor.x, cursor.y);
  *    });
  * ```
  */
  BrainBrowser.VolumeViewer.createPanel = function(options) {

    options = options || {};

    var old_zoom_level = 0;
    
    // Where the cursor used to be.
    var old_cursor_position = {
      x: 0,
      y: 0
    };

    // Where the mouse or touch used to be.
    var old_pointer_position = {
      x: 0,
      y: 0
    };

    var panel = {
      cursor: {
        x: 0,
        y: 0
      },
      
      image_center: {
        x: 0,
        y: 0
      },
      zoom: 1,
      updated: true,
      /**
      * @doc function
      * @name panel.panel:setSize
      * @param {number} width Width of the panel canvas.
      * @param {number} height Height of the panel canvas.
      * @description
      * Set the size of the panel canvas.
      * ```js
      * panel.setSize(512, 512);
      * ```
      */
      setSize: function(width, height) {
        panel.canvas.width = width;
        panel.canvas.height = height;
      },

      /**
      * @doc function
      * @name panel.panel:setSlice
      * @param {object} slice Slice object to render on the panel.
      * @description
      * Set the volume slice to be rendered on the panel.
      * ```js
      * panel.setSlice(slice);
      * ```
      */
      setSlice: function(slice) {
        panel.slice = slice;
        panel.slice_image = panel.slice.getImage(panel.zoom);
      },

      /**
      * @doc function
      * @name panel.panel:refreshSliceImage
      * @description
      * Set the volume slice to be rendered on the panel.
      * ```js
      * Refresh the slice image currently being displayed.
      * ```
      */
      refreshSliceImage: function() {
        panel.slice_image = panel.slice.getImage(panel.zoom);
      },

      /**
      * @doc function
      * @name panel.panel:updateCursor
      * @description
      * Update the panel cursor based on the current position with the given volume.
      * ```js
      * panel.updateCursor();
      * ```
      */
      updateCursor: function() {
        var volume = panel.volume;
        var slice = panel.slice;
        var origin = panel.getImageOrigin();

        panel.cursor.x = volume.position[slice.width_space.name] * Math.abs(slice.width_space.step) * panel.zoom + origin.x;
        panel.cursor.y = (slice.height_space.space_length - volume.position[slice.height_space.name] - 1) * Math.abs(slice.height_space.step) * panel.zoom  + origin.y;
      },

      /**
      * @doc function
      * @name panel.panel:followPointer
      * @param {object} pointer The pointer to follow.
      * @description
      * Will translate the image by the same amount that the pointer has moved since
      * this method was last called.
      * ```js
      * panel.followPointer({
      *   x: 100,
      *   y: 125
      * });
      * ```
      */
      followPointer: function(pointer) {
        var dx = pointer.x - old_pointer_position.x;
        var dy = pointer.y - old_pointer_position.y;
        panel.image_center.x += dx;
        panel.image_center.y += dy;
        panel.cursor.x += dx;
        panel.cursor.y += dy;
        old_pointer_position.x = pointer.x;
        old_pointer_position.y = pointer.y;
      },

      /**
      * @doc function
      * @name panel.panel:reset
      * @description
      * Reset image to it's original position and zoom level.
      * ```js
      * panel.reset();
      * ```
      */
      reset: function() {
        panel.zoom = 1;
        panel.image_center.x = panel.canvas.width / 2;
        panel.image_center.y = panel.canvas.height / 2;
      },
      
      /**
      * @doc function
      * @name panel.panel:getImageOrigin
      * @returns {object} Returns an object containing the **x** and **y** coordinates of the
      * top-left corner of the currently displayed slice on the panel.
      * @description
      * Get the coordinates of the top-left corner of the slice currently being displayed.
      * ```js
      * panel.getImageOrigin();
      * ```
      */
      getImageOrigin: function() {
        return {
          x: panel.image_center.x - panel.slice_image.width / 2,
          y: panel.image_center.y - panel.slice_image.height / 2
        };
      },
      
      /**
      * @doc function
      * @name panel.panel:drawSlice
      * @description
      * Draw the displays current slice to the canvas.
      * ```js
      * panel.drawSlice();
      * ```
      */
      drawSlice: function() {
        var image = panel.slice_image;
        var origin;

        if (image) {
          origin = panel.getImageOrigin();
          panel.context.putImageData(image, origin.x, origin.y);
        }

      },
      
      /**
      * @doc function
      * @name panel.panel:drawCursor
      * @param {string} color The cursor color.
      * @description
      * Draw the cursor at its current position on the canvas.
      * ```js
      * panel.drawCursor("#FF0000");
      * ```
      */
      drawCursor: function(color) {
        var context = panel.context;
        var zoom = panel.zoom;
        var length = 8 * zoom;
        var x, y, space;
        var distance;
        var dx, dy;
        color = color || "#FF0000";
        
        context.save();
        
        context.strokeStyle = color;
        context.fillStyle = color;

        space = zoom;
        x = panel.cursor.x;
        y = panel.cursor.y;

        context.lineWidth = space * 2;
        context.beginPath();
        context.moveTo(x, y - length);
        context.lineTo(x, y - space);
        context.moveTo(x, y + space);
        context.lineTo(x, y + length);
        context.moveTo(x - length, y);
        context.lineTo(x - space, y);
        context.moveTo(x + space, y);
        context.lineTo(x + length, y);
        context.stroke();

        if (panel.anchor) {
          dx = (panel.anchor.x - panel.cursor.x) / panel.zoom;
          dy = (panel.anchor.y - panel.cursor.y) / panel.zoom;
          distance = Math.sqrt(dx * dx + dy * dy);

          context.font = "bold 12px arial";

          if (panel.canvas.width - panel.cursor.x < 50) {
            context.textAlign = "right";
            x = panel.cursor.x - length;
          } else {
            context.textAlign = "left";
            x = panel.cursor.x + length;
          }

          if (panel.cursor.y < 30) {
            context.textBaseline = "top";
            y = panel.cursor.y + length;
          } else {
            context.textBaseline = "bottom";
            y = panel.cursor.y - length;
          }

          context.fillText(distance.toFixed(2), x, y);

          context.lineWidth = 1;
          context.beginPath();
          context.arc(panel.anchor.x, panel.anchor.y, 2 * space, 0, 2 * Math.PI);
          context.fill();
          context.moveTo(panel.anchor.x, panel.anchor.y);
          context.lineTo(panel.cursor.x, panel.cursor.y);
          context.stroke();

        }

        context.restore();


      },

      draw: function(cursor_color, active) {
        if (old_zoom_level !== panel.zoom) {
          panel.updated = true;
          panel.triggerEvent("zoom", panel.volume);
        }

        if (old_cursor_position.x !== panel.cursor.x || old_cursor_position.y !== panel.cursor.y) {
          panel.updated = true;
          panel.triggerEvent("cursorupdate", panel.cursor);
        }

        if (!panel.updated) {
          return;
        }

        var volume = panel.volume;
        var canvas = panel.canvas;
        var context = panel.context;
        var frame_width = 4;
        var half_frame_width = frame_width / 2;
        
        context.globalAlpha = 255;
        context.clearRect(0, 0, canvas.width, canvas.height);

        panel.drawSlice();
        panel.triggerEvent("draw", volume);
        panel.drawCursor(cursor_color);

        if (active) {
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

        if (panel.touches[0]) {
          old_pointer_position.x = panel.touches[0].x;
          old_pointer_position.y = panel.touches[0].y;
        } else {
          old_pointer_position.x = panel.mouse.x;
          old_pointer_position.y = panel.mouse.y;
        }
        old_zoom_level = panel.zoom;
        old_cursor_position.x = panel.cursor.x;
        old_cursor_position.y = panel.cursor.y;
        
        panel.updated = false;
      }
    };

    Object.keys(options).forEach(function(k) {
      if (!BrainBrowser.utils.isFunction(panel[k])) {
        panel[k] = options[k];
      }
    });

    BrainBrowser.events.addEventModel(panel);

    if (panel.canvas && BrainBrowser.utils.isFunction(panel.canvas.getContext)) {
      panel.context = panel.canvas.getContext("2d");
      panel.mouse = BrainBrowser.utils.captureMouse(panel.canvas);
      panel.touches = BrainBrowser.utils.captureTouch(panel.canvas);
    }

    if (panel.volume) {
      panel.propagateEventTo("*", panel.volume);
    }

    return panel;
  };

})();

