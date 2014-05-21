/*
* BrainBrowser: Web-based Neurological Visualization Tools
* (https://brainbrowser.cbrain.mcgill.ca)
*
* Copyright (C) 2011 
* The Royal Institution for the Advancement of Learning
* McGill University
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
* Author: Tarek Sherif <tsherif@gmail.com> (http://tareksherif.ca/)
*/

(function() {
  "use strict";
  
  // REQUIRED
  BrainBrowser.config.set("worker_dir", "js/brainbrowser/workers/");

  // Custom configuration for the Surface Viewer demo app.
  BrainBrowser.config.set("model_types.freesurferasc.format_hint", 'You can use <a href="http://surfer.nmr.mgh.harvard.edu/fswiki/mris_convert" target="_blank">mris_convert</a> to convert your binary surface files into .asc format.');
  BrainBrowser.config.set("intensity_data_types.freesurferasc.format_hint", 'You can use <a href="http://surfer.nmr.mgh.harvard.edu/fswiki/mris_convert" target="_blank">mris_convert</a> to convert your binary surface files into .asc format.');

  BrainBrowser.config.set("color_maps", [
    {
      name: "Spectral",
      url: "color-maps/spectral.txt",
    },
    {
      name: "Thermal",
      url: "color-maps/thermal.txt",
    },
    {
      name: "Gray",
      url: "color-maps/gray-scale.txt",
    },
    {
      name: "Blue",
      url: "color-maps/blue.txt",
    },
    {
      name: "Green",
      url: "color-maps/green.txt",
    }
  ]);

})();


