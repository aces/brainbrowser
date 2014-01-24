/* 
* Copyright (C) 2011 McGill University
* 
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
*   the Free Software Foundation, either version 3 of the License, or
*  (at your option) any later version.
* 
*  This program is distributed in the hope that it will be useful,
*  but WITHOUT ANY WARRANTY; without even the implied warranty of
*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*  GNU General Public License for more details.
*
*  You should have received a copy of the GNU General Public License
*  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
* @author Tarek Sherif
*/

$(function() {
  "use strict";
  
  BrainBrowser.VolumeViewer.start("brainbrowser", function(viewer) {
    var loading_div = $("#loading");
  
    // Hide the loading icon and display the viewer when once
    // the volume are all ready.
    viewer.addEventListener("ready", function() {
      loading_div.hide();
      $("#brainbrowser").slideDown({duration: 600});
      $(".button").button();
    });
    
    loading_div.show();

    // Load the volumes.
    viewer.loadVolumes({
      volumes: [
        {
          type: "minc",
          header_url: "data/ibis_411025_living_phantom_UNC_SD_HOS_20100112_t1w_003.mnc?minc_headers=true",
          raw_data_url: "data/ibis_411025_living_phantom_UNC_SD_HOS_20100112_t1w_003.mnc?raw_data=true"
        },
        {
          type: "minc",
          header_url: "data/ibis_411025_living_phantom_UNC_SD_HOS_20100112_t1w_004.mnc?minc_headers=true",
          raw_data_url: "data/ibis_411025_living_phantom_UNC_SD_HOS_20100112_t1w_004.mnc?raw_data=true"
        }
      ],
      overlay: true
    });
  });

});

