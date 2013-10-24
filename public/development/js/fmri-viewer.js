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

$(function() {
  "use strict";
  
  var loading_div = $("#loading");
  
  BrainCanvas.addEventListener("ready", function() {
    loading_div.hide();
    $("#braincanvas-container").slideDown({duration: 600});
    $(".button").button();
  });
  
  loading_div.show();
  
  BrainCanvas.viewer("braincanvas-container",
    {
      volumes: [
        {
          type: 'minc',
          filename: 'data/ibis_410023_LIVING_PHANTOM_STL_SD_HOS_20121212_SCAN1_ep2d_bold_001.mnc'
        },
        {
          type: 'minc',
          filename: 'data/ibis_410023_LIVING_PHANTOM_STL_SD_HOS_20121212_SCAN1_dti_001.mnc'
        }
      ]
    }
  );

});

