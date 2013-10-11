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
  
  BrainCanvas.volumeUIControls = function(controls, viewer, volume, volID) {
  
    var syncButton = $("<input name=\"sync\" type=\"checkbox\" />");
    
    syncButton.change(function(event) {
      viewer.synced[volID] = event.target.checked;
    });
    var sync = $("<span class=\"control-heading\">Sync</span>");
    
    sync.append(syncButton);
    controls.append(sync);
    
    if(volume.type === "multivolume") {
    
      var blendSlider = $("<input id=\"blend-slider\" class=\"slider braincanvas-blend\" type=\"slider\" name=\"blend\" value=\"0\" />");
      var blend = $("<div class=\"control-heading\">Blend (-50 to 50): </div>");
      var blend_val = $("<input class=\"control-inputs\" value=\"0\" id =\"blend-val\"/>");
      blend.append(blend_val);
    
      blend.append(blendSlider);
      controls.append(blend);
    
      blendSlider.slider({
        from: -50,
        to: 50,
        scale: [-50, '|', -25, '|', 0, '|', 25, '|', 50],
        round: 1,
        dimension: '',
        callback: function() {
          var newVal = parseFloat(this.inputNode.attr("value"));
          volume.updateBlendRatio(newVal);
          viewer.redrawVolume(volID);
          blend_val.val( newVal );
        }
      });
    
      //change blend value based on user input in text field
      blend_val.change(function () {
        var value = this.value;
        values = blendSlider.slider("value", value);
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
        var index = parseInt($(event.target).val(), 10);
        volume.colorScale = BrainCanvas.colorScales[index];
        viewer.redrawVolumes();
      });
    
      controls.append($("<div class=\"control-heading\">Color Scale: </div>").append(colorScaleOption));
      
      /***********************************
      * Thresholds
      ***********************************/
      if(volume.type !== "multivolume") {
        var uniqueID = String(Math.floor(Math.random()*1000000));
        var thresSlider = $('<input id ="thres-slider" class= "thres-slide_'+uniqueID+' slider braincanvas-threshold" type="slider" name="area" value="0;255" />');
        var thres = $("<div class=\"control-heading\">Threshold: </div>");
        var min_input = $('<input class="control-inputs min" "input-min" value="0"/>');
        var max_input = $('<input class="control-inputs max" "input-max" value="255"/>');
        thres.append($('<div class="threshold-input">Min </div>').append(min_input));
        thres.append($('<div class="threshold-input">Max </div>').append(max_input));
        var onOffTag = $('<p><div><label">Tag mode:&nbsp;</label><select name="tag-on-off" id="on-off" class="ui-toggle-switch" data-role="slider"> <option value="off">Off</option> <option value="on">On</option> </select></div>');

    
        controls.append(thres);
        thres.append(thresSlider);
        thres.append(onOffTag);

        thresSlider.slider({
          from: 0,
          to: 255,
          scale: [0, '|', 85, '|', '170', '|', 255],
          step: 1,
          dimension: '',
          skin: "blue",
          callback: function(){
            var values = this.inputNode.attr("value").split(";");
            volume.min = values[0];
            volume.max = values[1];
            viewer.redrawVolumes();
            min_input.val( values[0] );
            max_input.val( values[1] );
          }
        });
            
        //change min value based on user input and update slider
        min_input.change(function () {
          var value = this.value;
          values = thresSlider.slider("value").split(";");
          values[0] = value;
          values = thresSlider.slider("value", value);
          volume.min = value;
          viewer.redrawVolumes();
        });
    
        //change max value based on user input and update slider
        max_input.change(function () {
          var newMaxValue = this.value;
          var minValue = min_input.val();
          values = thresSlider.slider("value").split(";");
          values[1] = newMaxValue;
          values[0] = minValue;
          values = thresSlider.slider("value", '', newMaxValue);
          values = thresSlider.slider("value", minValue);
          volume.max = newMaxValue;
          volume.min = minValue;
          viewer.redrawVolumes();
        });
        
        //toggle for switch to enter tagging mode
        onOffTag.toggleSwitch({
          highlight: true, // default
          width: 30,
          change: function(e) {
          },
        
          stop: function(e,val) {
          // default null
          }
        });
      }
    }
  };
  
  BrainCanvas.volumeUIControls.defer_until_page_load = true;
})();


