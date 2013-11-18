/*
 * Copyright (c) 2011-2012, McGill University
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *   * Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *   * Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *   * Neither the name of McGill University nor the
 *     names of its contributors may be used to endorse or promote products
 *     derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL McGill University  BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
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
        this.cursor.x = (volume.position[slice.widthSpace.name] * Math.abs(slice.widthSpace.step) * this.zoom) + origin.x;
        this.cursor.y = (slice.heightSpace.space_length - volume.position[slice.heightSpace.name]) * Math.abs(slice.heightSpace.step) * this.zoom  + origin.y;
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

