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

/*
 * Image manipulation Library
 * 
 */
function Image() {
  var that = this;

  this.nearestNeighboor = function(data,width,height,new_width,new_height) {
    var new_array = new Uint16Array(new_width * new_height);
    var x_ratio = width/new_width;
    var y_ratio = height/new_height;
    
    for(var i = 0; i< new_height; i++) {
     for(var j = 0; j < new_width; j++)  {
       var px = Math.floor(j*x_ratio);  
       var py = Math.floor(i*y_ratio);
       new_array[Math.floor(i*new_width+j)] = data[Math.floor(py*width+px)];
     }
   
    }
    return new_array;
  };


  this.rotate90left = function(data,width,height){
    
  };

  this.rotate90right = function(data,width,height){

  };
}