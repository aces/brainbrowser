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

(function() {
  "use strict";
  
  BrainBrowser.config = {

    surface_viewer: {

      filetypes: {
        MNIObject: {
          worker: "js/brainbrowser/workers/mniobj.worker.js",
        },
        WavefrontObj: {
          worker: "js/brainbrowser/workers/wavefront_obj.worker.js"
        },
        FreeSurferAsc: {
          worker: "js/brainbrowser/workers/freesurfer_asc.worker.js",
          format_hint: 'You can use <a href="http://surfer.nmr.mgh.harvard.edu/fswiki/mris_convert" target="_blank">mris_convert</a> to convert your binary surface files into .asc format.'
        }
      },

      data : {
        worker: "js/brainbrowser/workers/data.worker.js"
      }

    },

    volume_viewer: {
      color_scales: [
        {
          name: "Spectral",
          url: "/color_scales/spectral.txt",
          cross_hair_color: "#FFFFFF"
        },
        {
          name: "Thermal",
          url: "/color_scales/thermal.txt",
          cross_hair_color: "#FFFFFF"
        },
        {
          name: "Gray",
          url: "/color_scales/gray_scale.txt",
          cross_hair_color: "#FF0000"
        },
        {
          name: "Blue",
          url: "/color_scales/blue.txt",
          cross_hair_color: "#FFFFFF"
        },
        {
          name: "Green",
          url: "/color_scales/green.txt",
          cross_hair_color: "#FF0000"
        }
      ]
    }
    
  }
})();


