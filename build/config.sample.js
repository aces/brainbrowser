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

///////////////////////////////////////////////////////////////////////////
//
// This is a sample configuration file for brainbrowser
// Modify it to match the congiguration of your installation.
//
// Options include:
// suface_viewer: options for Surface Viewer
//   - filetypes: options for supported model file types
//     Each file type can define the following:
//     - worker: url of the web worker used to parse the file.
//     - format_hint: html to be displayed to aid the user when 
//       uploading that type of file
//   - data: options for parsing color data files
//     - worker: url of the web worker used to parse the file.
// 
// volume_viewer:
//   - color_scales: an array of color scale definitions
//     - name: name to be display for the color scale in the UI
//     - url: url of the color scale file
//     - crosshair_color: color of the crosshair to be used when 
//       the color scale is active.
//
///////////////////////////////////////////////////////////////////////////


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
          crosshair_color: "#FFFFFF"
        },
        {
          name: "Thermal",
          url: "/color_scales/thermal.txt",
          crosshair_color: "#FFFFFF"
        },
        {
          name: "Gray",
          url: "/color_scales/gray_scale.txt",
          crosshair_color: "#FF0000"
        },
        {
          name: "Blue",
          url: "/color_scales/blue.txt",
          crosshair_color: "#FFFFFF"
        },
        {
          name: "Green",
          url: "/color_scales/green.txt",
          crosshair_color: "#FF0000"
        }
      ]
    }
    
  }
})();


