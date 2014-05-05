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
*/

/*
* Author: Tarek Sherif <tsherif@gmail.com> (http://tareksherif.ca/)
* Author: Nicolas Kassis
*/

(function() {
  "use strict";

  BrainBrowser.VolumeViewer.utils = {
    /**
    * @doc function
    * @name SurfaceViewer.utils:drawDot
    * @param {scene} The THREE.Scene to draw in.
    * @param {number} The x coordinate.
    * @param {number} The y coordinate.
    * @param {number} The z coordinate.
    *
    * @description Draw a red dot in a THREE.Scene. Handy for debugging.
    * 
    */
    drawDot: function(scene, x, y, z) {
      var geometry = new THREE.SphereGeometry(2);
      var material = new THREE.MeshBasicMaterial({color: 0xFF0000});
    
      var sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(x, y, z);
    
      scene.add(sphere);
    }
  };
    
})();



