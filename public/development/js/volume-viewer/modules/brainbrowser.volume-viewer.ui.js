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
 * WARRANTIES OF MERCHANTABILITY AND FITNEstSS FOR A PARTICULAR PURPOSE ARE
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

  var VolumeViewer = BrainBrowser.VolumeViewer;
  
  VolumeViewer.setupUI = function(viewer) {
    document.addEventListener("keydown", function(e) {
      if (!viewer.active_canvas) return;
      var canvas = viewer.active_canvas;
    
      var keyCode = e.which;
      if (keyCode < 37 || keyCode > 40) return;
      
      var cursor = viewer.active_cursor;
      var volID = canvas.getAttribute("data-volume-id");
      var slice_num = canvas.getAttribute("data-slice-num");
      
      ({
        37: function() { cursor.x--; }, // Left
        38: function() { cursor.y--; }, // Up
        39: function() { cursor.x++; }, // Right
        40: function() { cursor.y++; }  // Down
      })[keyCode]();
      
      viewer.setCursor(cursor, volID, slice_num);
      
      if (viewer.synced){
        viewer.displays.forEach(function(display, synced_vol_id) {
          if (synced_vol_id !== volID) {
            viewer.setCursor(cursor, synced_vol_id, slice_num);
          }
        });
      }
      
      return false;
    }, false);
  };
    
  VolumeViewer.addCanvasUI = function(div, viewer, volume, volID) {
    var displays = [];
    
    function captureMouse(canvas) {
      var mouse = {x: 0, y: 0};

      canvas.addEventListener("mousemove", function(e) {
        var offset = BrainBrowser.utils.getOffset(canvas);
        var x, y;

        if (e.pageX !== undefined) {
          x = e.pageX;
          y = e.pageY;
        } else {
          x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
          y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }

        mouse.x = x - offset.left;
        mouse.y = y - offset.top;
      }, false);
      return mouse;
    }
    
    [0, 1, 2].forEach(function(slice_num) {
      var canvas = document.createElement("canvas");
      var context = canvas.getContext('2d');
      canvas.width = 256;
      canvas.height = 256;
      canvas.setAttribute("data-volume-id", volID);
      canvas.setAttribute("data-slice-num", slice_num);
      canvas.classList.add("slice-display");
      div.appendChild(canvas);
      context.clearRect(0, 0, canvas.width, canvas.height);
      displays.push(
        VolumeViewer.display({
          canvas: canvas,
          context: context,
          cursor: {
            x: canvas.width / 2,
            y: canvas.height / 2
          },
          image_center: {
            x: canvas.width / 2,
            y: canvas.height / 2
          },
          mouse: captureMouse(canvas),
          zoom: viewer.default_zoom_level,
        })
      );
    });
    
    if (VolumeViewer.volumeUIControls) {
      var controls  = document.createElement("div");
      controls.className = "volume-viewer-controls volume-controls";
      if (VolumeViewer.volumeUIControls.defer_until_page_load) {
        viewer.addEventListener("ready", function() {
          div.appendChild(controls);
          VolumeViewer.volumeUIControls(controls, viewer, volume, volID);
        });
      } else {
        VolumeViewer.volumeUIControls(controls, viewer, volume, volID);
        div.appendChild(controls);
      }
    }
  
    /**********************************
    * Mouse Events
    **********************************/
    
    
    (function() {
      var current_target = null;
      
      displays.forEach(function(display, slice_num) {
        var canvas = display.canvas;
        var mouse = display.mouse;
        
        function drag(e) {
          var cursor = {
            x: mouse.x,
            y: mouse.y
          };
          
          function translate(d) {
            var dx, dy;
            dx = cursor.x - d.last_cursor.x;
            dy = cursor.y - d.last_cursor.y;
            d.image_center.x += dx;
            d.image_center.y += dy;
            d.cursor.x += dx;
            d.cursor.y += dy;
            d.last_cursor.x = cursor.x;
            d.last_cursor.y = cursor.y;
          }
                  
          if(e.target === current_target) {
            if(e.shiftKey) {
              translate(display);
              if (viewer.synced){
                viewer.displays.forEach(function(display, synced_vol_id) {
                  if (synced_vol_id !== volID) {
                    translate(display[slice_num]);
                  }
                });
              }
            } else {
              viewer.setCursor(cursor, volID, slice_num);
              if (viewer.synced){
                viewer.displays.forEach(function(display, synced_vol_id) {
                  if (synced_vol_id !== volID) {
                    viewer.setCursor(cursor, synced_vol_id, slice_num);
                  }
                });
              }
              display.cursor = viewer.active_cursor = cursor;
            }
            viewer.draw();
          }
        }
        
        function stopDrag() {
          document.removeEventListener("mousemove", drag, false);
          document.removeEventListener("mouseup", stopDrag, false);
          current_target = null;
        }
        
        canvas.addEventListener("mousedown", function startDrag(e) {
          current_target = e.target;
          var cursor = {
            x: mouse.x,
            y: mouse.y
          };

          e.preventDefault();
          e.stopPropagation();
          
          if (e.shiftKey) {
            display.last_cursor.x = cursor.x;
            display.last_cursor.y = cursor.y;
            if (viewer.synced){
              viewer.displays.forEach(function(display, synced_vol_id) {
                if (synced_vol_id !== volID) {
                  var d = display[slice_num];
                  d.last_cursor.x = cursor.x;
                  d.last_cursor.y = cursor.y;
                }
              });
            }
          } else {
            viewer.setCursor(cursor, volID, slice_num);
            if (viewer.synced){
              viewer.displays.forEach(function(display, synced_vol_id) {
                if (synced_vol_id !== volID) {
                  viewer.setCursor(cursor, synced_vol_id, slice_num);
                }
              });
            }
            display.cursor = viewer.active_cursor = cursor;
          }
          viewer.active_canvas = e.target;
          document.addEventListener("mousemove", drag, false);
          document.addEventListener("mouseup", stopDrag, false);
          
          viewer.draw();

        }, false);
        
        function wheelHandler(e) {
          var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));

          e.preventDefault();
          e.stopPropagation();

          display.zoom = Math.max(display.zoom + delta * 0.05, 0.05);
          
          viewer.renderSlice(volID, ["xspace", "yspace", "zspace"][slice_num]);
          if (viewer.synced){
            viewer.displays.forEach(function(display, synced_vol_id) {
              if (synced_vol_id !== volID) {
                var d = display[slice_num];
                d.zoom = Math.max(d.zoom + delta * 0.05, 0.05);
                viewer.renderSlice(synced_vol_id, ["xspace", "yspace", "zspace"][slice_num]);
              }
            });
          }
        }

        canvas.addEventListener("mousewheel", wheelHandler, false);
        canvas.addEventListener("DOMMouseScroll", wheelHandler, false); // Dammit Firefox   
      });
    })();
    
    
    return displays;
  };
})();

