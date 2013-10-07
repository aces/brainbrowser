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
  
  BrainCanvas.setupUI = function(viewer) {
    $(document).keydown(function(e) {
      if (!viewer.active_canvas) return;
      var canvas = viewer.active_canvas;
    
      var keyCode = e.which;
      if (keyCode < 37 || keyCode > 40) return;
      
      var cursor = viewer.active_cursor;
      var volID = canvas.getAttribute("data-volume-id");
      var slice_num = canvas.getAttribute("data-slice-num");
      var zoom = canvas.getAttribute("data-zoom");
      
      ({
        37: function() { cursor.x--; }, // Left
        38: function() { cursor.y--; }, // Up
        39: function() { cursor.x++; }, // Right
        40: function() { cursor.y++; }  // Down
      })[keyCode]();
      
      viewer.getSlices(cursor, volID, slice_num);
      
      if (viewer.synced){
        viewer.displays.forEach(function(display, synced_vol_id) {
          if (synced_vol_id !== volID) {
            viewer.getSlices(cursor, synced_vol_id, slice_num);
          }
        });
      }
      
      return false;
    });
  };
    
  BrainCanvas.addCanvasUI = function(div, viewer, volume, volID) {
    var displays = [];
    var div = $(div);
    
    function captureMouse(canvas) {
      var c = $(canvas);
      var mouse = {x: 0, y: 0};
      var position = c.offset();
      
      c.mousemove(function(e) {
        mouse.x = e.offsetX;
        mouse.y = e.offsetY;
      });
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
      div.append(canvas);
      context.clearRect(0, 0, canvas.width, canvas.height);
      displays.push(
        BrainCanvas.display({
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
    
    if (BrainCanvas.volumeUIControls) {
      var controls  = $("<div class=\"braincanvas-controls volume-controls\"></div>");
      if (BrainCanvas.volumeUIControls.defer_until_page_load) {
        BrainCanvas.addEventListener("ready", function() {
          div.append(controls);
          BrainCanvas.volumeUIControls(controls, viewer, volume, volID);
        });
      } else {
        BrainCanvas.volumeUIControls(controls, viewer, volume, volID);
        div.append(controls);
      }
    }
  
    /**********************************
    * Mouse Events
    **********************************/
    
    
    (function() {
      var current_target = null;
      
      displays.forEach(function(display, slice_num) {
        var canvas = $(display.canvas);
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
              viewer.getSlices(cursor, volID, slice_num);
              if (viewer.synced){
                viewer.displays.forEach(function(display, synced_vol_id) {
                  if (synced_vol_id !== volID) {
                    viewer.getSlices(cursor, synced_vol_id, slice_num);
                  }
                });
              }
              display.cursor = viewer.active_cursor = cursor;
            }
            viewer.draw();
          }
        }
        
        function stopDrag(e) {
          $(document).unbind("mousemove", drag).unbind("mouseup", stopDrag);
          current_target = null;
        }
        
        canvas.mousedown(function startDrag(e) {
          current_target = e.target;
          var cursor = {
            x: mouse.x,
            y: mouse.y
          };          
          
          if(e.shiftKey) {
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
            viewer.getSlices(cursor, volID, slice_num);
            if (viewer.synced){
              viewer.displays.forEach(function(display, synced_vol_id) {
                if (synced_vol_id !== volID) {
                  viewer.getSlices(cursor, synced_vol_id, slice_num);
                }
              });
            }
            display.cursor = viewer.active_cursor = cursor;          
          }
          viewer.active_canvas = e.target;
          $(document).mousemove(drag).mouseup(stopDrag);
          
          viewer.draw();
          return false;
        });
        
        canvas.mousewheel(function(e, delta) {
          display.zoom = Math.max(display.zoom + delta * 0.05, 0.05);
          
          viewer.updateSlices(volID, ["xspace", "yspace", "zspace"][slice_num]);
          if (viewer.synced){
            viewer.displays.forEach(function(display, synced_vol_id) {
              if (synced_vol_id !== volID) {
                var d = display[slice_num];
                d.zoom = Math.max(d.zoom + delta * 0.05, 0.05);
                viewer.updateSlices(synced_vol_id, ["xspace", "yspace", "zspace"][slice_num]);
              }
            });
          }
          return false;
        });
        
      });
    })();
    
    
    return displays;
  };
  
  BrainCanvas.volumeUIControls = function(controls, viewer, volume, volID) {    
    var coords, world_coords_div, voxel_coords_div;
    
    if (volume.getWorldCoords) {
      coords = $('<div class="coords"></div>');
      world_coords_div = $(
        '<div class="world-coords">' + 
        '<div class="control-heading">World Coordinates</div>' +
        'X:<input id="world-x" class="control-inputs"></input>' + 
        'Y:<input id="world-y" class="control-inputs"></input>' +  
        'Z:<input id="world-z" class="control-inputs"></input>' +  
        '</div>'
      );
      
      voxel_coords_div = $(
        '<div class="voxel-coords">' + 
        '<div class="control-heading">Voxel Coordinates</div>' +
        'X:<input id="voxel-x" class="control-inputs"></input>' + 
        'Y:<input id="voxel-y" class="control-inputs"></input>' +  
        'Z:<input id="voxel-z" class="control-inputs"></input>' +  
        '</div>'
      );
      
      BrainCanvas.addEventListener("sliceupdate", function() {
        var world_coords = volume.getWorldCoords();
        var voxel_coords = volume.getVoxelCoords();
        world_coords_div.find("#world-x").val(world_coords.x);
        world_coords_div.find("#world-y").val(world_coords.y);
        world_coords_div.find("#world-z").val(world_coords.z);  
        
        voxel_coords_div.find("#voxel-x").val(voxel_coords.x);
        voxel_coords_div.find("#voxel-y").val(voxel_coords.y);
        voxel_coords_div.find("#voxel-z").val(voxel_coords.z);  
      });
    }
    
    coords.append(world_coords_div);
    coords.append(voxel_coords_div);
    controls.append(coords);
    
    if(volume.type === "multivolume") {
      var blendSlider = $("<div id=\"blend-slider\" class=\"slider braincanvas-blend\"></div>");
      var blend = $("<div class=\"control-heading\">Blend (-50 to 50): </div>");
      var blend_val = $("<input class=\"control-inputs\" value=\"0\" id =\"blend-val\"/>");
      blend.append(blend_val);
    
      blend.append(blendSlider);
      controls.append(blend);
    

      blendSlider.slider({
        min: -50, max: 50,
        step: 1,
        slide: function(event, ui) { 
          var newVal = parseInt(ui.value, 10);
          volume.updateBlendRatio(newVal); 
          viewer.redrawVolume(volID);
          blend_val.val( newVal );
        },
        stop: function() {
          $(this).find("a").blur();
        } 
      });
    
      //change blend value based on user input in text field
      blend_val.change(function () {
        var value = this.value;
        blendSlider.slider("value", value); 
        volume.updateBlendRatio(value);
        viewer.redrawVolume(volID);
      });
    
    } else {
      var list = "";
      for(var i = 0; i < BrainCanvas.colorScales.length; i++) {
        var name = BrainCanvas.colorScales[i].name;
        if (viewer.defaultScale === BrainCanvas.colorScale) {
          list += "<option value="+i+"\" SELECTED>"+name+"</option>";
        } else {
          list += "<option value="+i+"\">"+name+"</option>";
        }
      }
      var colorScaleOption = $("<select></select>");
      list = $(list);
      colorScaleOption.append(list);
    
      //On change update color scale of volume and redraw.
      colorScaleOption.change(function(event) {
        var index = parseInt($(event.target).val());
        volume.colorScale = BrainCanvas.colorScales[index];
        viewer.redrawVolumes();
      });
    
      controls.append($("<div class=\"control-heading\">Color Scale: </div>").append(colorScaleOption));
      
      /***********************************
      * Thresholds
      ***********************************/
      if(volume.type !== "multivolume") {
        var thresSlider = $('<div class="slider braincanvas-threshold"></div>');
        var thres = $("<div class=\"control-heading\">Threshold: </div>");
        var min_input = $('<input class="control-inputs thresh-input-left" value="0"/>');
        var max_input = $('<input class="control-inputs thresh-input-right" value="255"/>');
        var inputs = $('<div class="thresh-inputs"></div>');
        inputs.append(min_input).append(max_input);
        thres.append(inputs);
    
        controls.append(thres);
        thres.append(thresSlider);
        
        thresSlider.slider({
          range: true,
          min: 0, max: 255, 
          values: [0, 255],
          step: 1, 
          slide: function(event, ui){
            var values = ui.values;
            volume.min = values[0]; 
            volume.max = values[1]; 
            viewer.redrawVolumes();
            min_input.val(values[0]);
            max_input.val(values[1]);
          },
          stop: function() {
            $(this).find("a").blur();
          }
        });
            
        //change min value based on user input and update slider
        min_input.change(function () {          
          var value = this.value;
          thresSlider.slider("values", 0, value);
          volume.min = value;
          viewer.redrawVolumes();
        });
    
        //change max value based on user input and update slider
        max_input.change(function () {
          var value = this.value;
          thresSlider.slider("values", 1, value);
          volume.max = value;
          viewer.redrawVolumes();
        });
      }
    }
  };
})();

