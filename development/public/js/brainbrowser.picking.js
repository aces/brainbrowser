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
 
BrainBrowser.modules.picking = function(bb) {
  /*
    * This method can be used to detect where the user clicked
    * it takes a callback method which will receive the event and
    * and info object.
    *
   */
   bb.click = function(e, click_callback) {
     var view_window = bb.view_window;
     var camera = bb.camera;
     
     var offset = view_window.offset();
     var projector = new THREE.Projector();
     var raycaster = new THREE.Raycaster();
     var mouseX = ((e.clientX - offset.left + $(window).scrollLeft())/view_window.width()) * 2 - 1;
     var mouseY = -((e.clientY - offset.top + $(window).scrollTop())/view_window.height()) * 2 + 1;
     var vector = new THREE.Vector3(mouseX, mouseY, 1);
     var intersects, intersection, vertex_data;

     projector.unprojectVector(vector, camera);
     raycaster.set(camera.position, vector.sub(camera.position).normalize() );
     intersects = raycaster.intersectObject(bb.model, true);
     if (intersects.length > 0) {      
       intersection = intersects[0];
       vertex_data = {
         vertex: intersection.face.a,
         point: new THREE.Vector3(intersection.point.x, intersection.point.y, intersection.point.z),
         object: intersection.object
       };
       return click_callback(e, vertex_data);
     } else {
       $(bb.pickInfoElem).html('--nothing--');
       return false;
     }
   };
}
