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

function spectrum() {
    var that = this;
    var canvas = jQuery("<canvas width=\"256\" height=\"50\"></canvas>");
    
    
    var context = canvas.getContext("2d");
    
    context.fillRect(0,0,256,50);

    return canvas.getDataUrl();
}


$(function() {
    var canvas_img = spectrum();
    jQuery("<div><img src=\""+canvas_img+"\"></img>").appendTo("body");
});