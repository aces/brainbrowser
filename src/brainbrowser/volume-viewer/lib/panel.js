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
  */
  BrainBrowser.VolumeViewer.createPanel = function(options) {

    options = options || {};

    var old_zoom_level = 0;
    var last_position = {
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
        this.canvas.width = width;
        this.canvas.height = height;
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
        this.slice = slice;
        this.slice_image = this.slice.getImage(this.zoom);
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
        this.slice_image = this.slice.getImage(this.zoom);
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
        var volume = this.volume;
        var slice = this.slice;
        var origin = this.getImageOrigin();

        this.cursor.x = volume.position[slice.width_space.name] * Math.abs(slice.width_space.step) * this.zoom + origin.x;
        this.cursor.y = (slice.height_space.space_length - volume.position[slice.height_space.name] - 1) * Math.abs(slice.height_space.step) * this.zoom  + origin.y;
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
        var dx = pointer.x - last_position.x;
        var dy = pointer.y - last_position.y;
        this.image_center.x += dx;
        this.image_center.y += dy;
        this.cursor.x += dx;
        this.cursor.y += dy;
        last_position.x = pointer.x;
        last_position.y = pointer.y;
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
        this.zoom = 1;
        this.image_center.x = this.canvas.width / 2;
        this.image_center.y = this.canvas.height / 2;
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
          x: this.image_center.x - this.slice_image.width / 2,
          y: this.image_center.y - this.slice_image.height / 2
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
        var image = this.slice_image;
        var origin;

        if (image) {
          origin = this.getImageOrigin();
          this.context.putImageData(image, origin.x, origin.y);
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
        var context = this.context;
        var zoom = this.zoom;
        var length = 8 * zoom;
        var x, y, space;
        var distance;
        var dx, dy;
        color = color || "#FF0000";
        
        context.save();
        
        context.strokeStyle = color;
        context.fillStyle = color;

        space = zoom;
        x = this.cursor.x;
        y = this.cursor.y;

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

        if (this.anchor) {
          dx = (this.anchor.x - this.cursor.x) / this.zoom;
          dy = (this.anchor.y - this.cursor.y) / this.zoom;
          distance = Math.sqrt(dx * dx + dy * dy);

          context.font = "bold 12px arial";

          if (this.canvas.width - this.cursor.x < 50) {
            context.textAlign = "right";
            x = this.cursor.x - length;
          } else {
            context.textAlign = "left";
            x = this.cursor.x + length;
          }

          if (this.cursor.y < 30) {
            context.textBaseline = "top";
            y = this.cursor.y + length;
          } else {
            context.textBaseline = "bottom";
            y = this.cursor.y - length;
          }

          context.fillText(distance.toFixed(2), x, y);

          context.lineWidth = 1;
          context.beginPath();
          context.arc(this.anchor.x, this.anchor.y, 2 * space, 0, 2 * Math.PI);
          context.fill();
          context.moveTo(this.anchor.x, this.anchor.y);
          context.lineTo(this.cursor.x, this.cursor.y);
          context.stroke();

        }

        context.restore();


      },

      draw: function(cursor_color, active) {
        if (old_zoom_level !== this.zoom) {
          old_zoom_level = this.zoom;
          this.updated = true;
          BrainBrowser.events.triggerEvent("zoom", this.volume, this);
        }

        if (!this.updated) {
          return;
        }

        var volume = this.volume;
        var canvas = this.canvas;
        var context = this.context;
        var frame_width = 4;
        var half_frame_width = frame_width / 2;
        
        context.globalAlpha = 255;
        context.clearRect(0, 0, canvas.width, canvas.height);

        this.drawSlice();
        BrainBrowser.events.triggerEvent("draw", volume, this);
        this.drawCursor(cursor_color);

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

        last_position.x = this.cursor.x;
        last_position.y = this.cursor.y;
        this.updated = false;
      }
    };

    Object.keys(options).forEach(function(k) {
      if (!BrainBrowser.utils.isFunction(panel[k])) {
        panel[k] = options[k];
      }
    });

    if (panel.canvas && BrainBrowser.utils.isFunction(panel.canvas.getContext)) {
      panel.context = panel.canvas.getContext("2d");
      panel.mouse = BrainBrowser.utils.captureMouse(panel.canvas);
      panel.touches = BrainBrowser.utils.captureTouch(panel.canvas);
    }

    return panel;
  };

})();

