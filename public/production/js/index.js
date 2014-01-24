/*
 * Copyright (C) 2011 McGill University
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/*
* BrainBrowser v1.4.2
* https://brainbrowser.cbrain.mcgill.ca/
*
* Author: Tarek Sherif  <tsherif@gmail.com> (http://tareksherif.ca/)
* Author: Nicolas Kassis
*/
$(function(){"use strict";$(".button").button(),$(".tabs").tabs();var a=$("#html5-warnings");a&&(BrainBrowser.utils.canvasEnabled()||(a.css("display","inline-block"),a.find("#canvas-warning").show()),BrainBrowser.utils.webglEnabled()||(a.css("display","inline-block"),a.find("#webgl-warning").show()),BrainBrowser.utils.webWorkersEnabled()||(a.css("display","inline-block"),a.find("#webworker-warning").show()))});