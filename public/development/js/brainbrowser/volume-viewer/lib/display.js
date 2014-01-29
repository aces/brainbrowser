/*
* BrainBrowser: Web-based Neurological Visualization Tools
* (https://brainbrowser.cbrain.mcgill.ca)
*
* Copyright (C) 2011 McGill University 
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

/**
* @doc object
* @name display
* @property {object} volume The volume being displayed.
* @property {string} axis The name of the axis being displayed (xspace, yspace or zspace).
* @property {object} slice The slice currently being displayed.
* @property {object} canvas Reference to the canvas area used for drawing.
* @property {object} context The 2D context of the canvas. 
* @property {object} image_center The **x** and **y** coordinates of the
*   center of the slice currently being displayed.
* @property {number} zoom The current zoom level of the display. 
* @property {object} cursor The current **x** and **y** coordinates of the cursor. 
* @property {object} mouse The current **x** and **y** coordinates of the mouse. 
* @description
* Object representing an individual canvas display.
*/
(function() {
  "use strict";
    
  var display_proto = {

    /**
    * @doc function
    * @name display.display:updateCursor
    * @param {object} volume The volume whose cursor will be updated.
    * @description
    * Update the display cursor based on the current position with the given volume.
    */
    updateCursor: function() {
      var volume = this.volume;
      var slice = this.slice;
      var origin = this.getImageOrigin();
      if (volume && slice) {
        this.cursor.x = (volume.position[slice.width_space.name] * Math.abs(slice.width_space.step) * this.zoom) + origin.x;
        this.cursor.y = (slice.height_space.space_length - volume.position[slice.height_space.name]) * Math.abs(slice.height_space.step) * this.zoom  + origin.y;
      }
    },
    
    /**
    * @doc function
    * @name display.display:getImageOrigin
    * @returns {object} Returns an object containing the **x** and **y** coordinates of the
    * top-left corner of the currently displayed slice on the display.
    * @description
    * Get the coordinates of the top-left corner of the slice currently being displayed.
    */
    getImageOrigin: function() {
      return {
        x: this.image_center.x - this.slice.image.width / 2,
        y: this.image_center.y - this.slice.image.height / 2
      };
    },
    
    /**
    * @doc function
    * @name display.display:drawSlice
    * @description
    * Draw the displays current slice to the canvas.
    */
    drawSlice: function() {
      var img = this.slice.image;
      var origin = this.getImageOrigin();
      this.context.putImageData(img, origin.x, origin.y);
    },
    
    /**
    * @doc function
    * @name display.display:drawCursor
    * @param {string} color The cursor color.
    * @description
    * Draw the cursor at its current position on the canvas.
    */
    drawCursor: function(color) {
      var context = this.context;
      var zoom = this.zoom;
      var length = 8;
      color = color || "#FF0000";
      
      context.save();
      
      context.strokeStyle = color;
      context.translate(this.cursor.x, this.cursor.y);
      context.scale(zoom, zoom);
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(0, -length);
      context.lineTo(0, -2);
      context.moveTo(0, 2);
      context.lineTo(0, length);
      context.moveTo(-length, 0);
      context.lineTo(-2, 0);
      context.moveTo(2, 0);
      context.lineTo(length, 0);
      context.stroke();
      
      context.restore();
    }
  };

  BrainBrowser.VolumeViewer.display = function(options) {
    options = options || {};

    var defaults = {
      cursor: {
        x: 0,
        y: 0
      },
      last_cursor: {
        x: 0,
        y: 0
      },
      image_center: {
        x: 0,
        y: 0
      },
      zoom: 1
    };

    var display = Object.create(display_proto);
    
    Object.keys(defaults).forEach(function(k) {
      display[k] = defaults[k];
    });

    Object.keys(options).forEach(function(k) {
      display[k] = options[k];
    });

    return display;
  };

})();

