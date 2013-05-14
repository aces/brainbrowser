/* 
 * Copyright (C) 2011 McGill University
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var brainbrowser;
var macacc;
function initMacacc(path_prefix,dont_build_path) {

  brainbrowser = new BrainBrowser();

  brainbrowser.getViewParams = function() {
    return {
      view: jQuery('[name=hem_view]:checked').val(),
      left: jQuery('#left_hem_visible').is(":checked"),
      right: jQuery('#right_hem_visible').is(":checked")
    };

  };

  brainbrowser.afterLoadSpectrum = function (spectrum) {
    var canvas = spectrum.createSpectrumCanvasWithScale(0,5,null,false);
    jQuery("#spectrum").html(jQuery(canvas));
    brainbrowser.spectrumObj = spectrum;
  };




  brainbrowser.afterInit = function(bb) {
    $("#loading").show();
    bb.loadObjFromUrl('/models/surf_reg_model_both.obj', { 
      afterDisplay: function() {
        $("#loading").hide();
        macacc = new MacaccObject(bb, path_prefix, dont_build_path);
        brainbrowser.afterCreateBrain = function() {
          if(bb.current_dataset != undefined) {
            macacc.update_model(bb.current_dataset);
          }
        };


        macacc.afterRangeChange= function(min,max) {
          if(macacc.flipRange == true) {
            var canvas = bb.spectrumObj.createSpectrumCanvasWithScale(min,max,null,true);
          }
          else {
            var canvas = bb.spectrumObj.createSpectrumCanvasWithScale(min,max,null,false);
          }
          jQuery("#spectrum").html(jQuery(canvas));
        };
        
        jQuery('.data_controls').change(macacc.data_control_change);
        macacc.pickInfoElem=jQuery("#vertex_info");
        
        jQuery("#x-coord-flip").click(macacc.flipXCoordinate); //flip x from one hemisphere to the other.
        
        jQuery("#model").change(function(event) {
          $("#loading").show();
          macacc.change_model(event, {
            afterDisplay: function() {
              $("#loading").hide();
            }
          });
        });
      }
    });


    jQuery('#meshmode').change(function(e) {
      if(jQuery(e.target).is(":checked")) {
        bb.set_fill_mode_wireframe();
      }else {
        bb.set_fill_mode_solid();
      }
    });

    jQuery("#range-slider").slider({
      range: true,
      min: -10,
      max: 15,
      values: [0, 5],
      slide: function(event, ui) {
        jQuery("#data-range-min").val(ui.values[0]);
        jQuery("#data-range-max").val(ui.values[1]);
        if(bb.current_dataset) {
          macacc.range_change();
        }
      },
      step: 0.1    
    });



    jQuery(".range-box").keypress(function(e) {
       if(e.keyCode == '13'){
         macacc.range_change(e);
       }
     }
    );

    jQuery("#data-range-min").change(function(e) {
      jQuery("#range-slider").slider('values', 0, jQuery(this).val());
      macacc.afterRangeChange(parseFloat(jQuery("#data-range-min").val()),parseFloat(jQuery("#data-range-max").val()));
    });

    jQuery("#data-range-max").change(function(e) {
      jQuery("#range-slider").slider('values', 1, jQuery(this).val());
      macacc.afterRangeChange(parseFloat(jQuery("#data-range-min").val()),parseFloat(jQuery("#data-range-max").val()));
    });

    jQuery("[name=pointer]").change(function(e) {
      if(jQuery("[name=pointer]:checked").val() == "AAL_atlas") {
        macacc.show_atlas();
      }
    });

    

    jQuery('#screenshot').click(function(event) {jQuery(this).attr("href", bb.client.toDataUR());});
    
    $("#view-window").mousedown(function(e) {
      var pointer_setting=jQuery('[name=pointer]:checked').val();
      
      if(e.ctrlKey || pointer_setting == "check") {
        if(bb.valueAtPointCallback) {
          bb.click(e, bb.valueAtPointCallback);
        }
      } else if(e.shiftKey || pointer_setting == "select") {
        if(bb.clickCallback) {
          bb.click(e, bb.clickCallback);
        }
      }
    });

    jQuery("#flip_range").change(function(e) {
      macacc.update_model(brainbrowser.current_dataset);
    });
    
    jQuery("#clamp_range").change(function(e) {
      macacc.update_model(brainbrowser.current_dataset);
    });
    


    jQuery("#flip_correlation").click(function(e) {
      var min = -1*parseFloat(jQuery("#data-range-max").val());
      var max = -1*parseFloat(jQuery("#data-range-min").val());
      jQuery("#data-range-min").val(min).change();
      jQuery("#data-range-max").val(max).change();
      
      jQuery("#flip_range").attr("checked", !jQuery("#flip_range").attr("checked")).change();
    });

  };
  
  jQuery('#resetview').click(brainbrowser.setupView);

  jQuery('.view_button').change(brainbrowser.setupView);
  jQuery('[name=hem_view]').change(brainbrowser.setupView);
  jQuery(".button").button();
  jQuery(".button_set").buttonset();

  jQuery("#secondWindow").click(function(e){
    brainbrowser.secondWindow=window.open('/macacc.html','secondWindow');
  });
 
  window.addEventListener('message', function(e){
   
    var vertex = parseInt(e.data);
    var position_vector = [
     brainbrowser.model_data.positionArray[vertex*3],
     brainbrowser.model_data.positionArray[vertex*3+1],
     brainbrowser.model_data.positionArray[vertex*3+2]
    ];
    
    macacc.pickClick(e,{
           position_vector: position_vector,
           vertex: vertex,
           stop: true //tell pickClick to stop propagating the 
                                  //click such that we don't get an infinite loop.
           ,
         });
    
    },false);
  if(window.opener !=null)  {
    brainbrowser.secondWindow = window.opener;
  }
};
