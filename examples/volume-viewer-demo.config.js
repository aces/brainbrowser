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
  
  // Custom configuration for the Volume Viewer demo app.
  BrainBrowser.config.set("color_maps", [
    {
      name: "Spectral",
      url: "color-maps/spectral-brainview.txt",
      cursor_color: "#FFFFFF"
    },
    {
      name: "Thermal",
      url: "color-maps/thermal.txt",
      cursor_color: "#FFFFFF"
    },
    {
      name: "Gray",
      url: "color-maps/gray-scale.txt",
      cursor_color: "#FF0000"
    },
    {
      name: "Blue",
      url: "color-maps/blue.txt",
      cursor_color: "#FFFFFF"
    },
    {
      name: "Green",
      url: "color-maps/green.txt",
      cursor_color: "#FF0000"
    }
  ]);
    
})();


