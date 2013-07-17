/*! 
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
$(function(){$(".button").button();$(".tabs").tabs({heigth:800});$(".tablink").click(function(c){var d=$(c.target).attr("data-tabs");var b=$(c.target).attr("data-tab");$("#"+d).tabs("select",b);return false});var a=$("#html5-warnings");if(a){if(!BrainBrowser.webglEnabled()){a.css("display","inline-block");a.find("#webgl-warning").show()}if(!BrainBrowser.webWorkersEnabled()){a.css("display","inline-block");a.find("#webworker-warning").show()}}});