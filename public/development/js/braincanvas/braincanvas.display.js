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

(function() {
  "use strict";
  
  BrainCanvas.display = oFactory({
    updateCursor: function(volume) {
      var slice = this.slice;
      var origin = this.getImageOrigin();
      
      if (volume && slice) {
        this.cursor.x = (volume.position[slice.widthSpace.name] * this.zoom) + origin.x;
        this.cursor.y = (slice.heightSpace.space_length - volume.position[slice.heightSpace.name]) * this.zoom  + origin.y;
      }
    },
    
    getVolumePosition: function() {
      return {
        x: this.cursor.x / this.zoom,
        y: this.cursor.y / this.zoom
      };
    },
    
    getImageOrigin: function() {
      return {
        x: this.image_center.x - this.slice.image.width / 2,
        y: this.image_center.y - this.slice.image.height / 2
      };
    },
    
    drawSlice: function(context) {
      var img = this.slice.image;
      var origin = this.getImageOrigin();
      context.putImageData(img, origin.x, origin.y);
    },
    
    drawCrosshair: function(context, color, zoom) {
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
  }).mixin({
    canvas: null,
    context: null,
    slice: null,
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
    mouse: null,
    zoom: 1,
  });

})();

