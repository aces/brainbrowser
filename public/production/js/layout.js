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

/* brainbrowser v1.1.0 */
$(function(){"use strict";$(".button").button(),$(".tabs").tabs({heigth:800}),$(".tablink").click(function(a){var b=$(a.target).attr("data-tabs"),c=$(a.target).attr("data-tab");return $("#"+b).tabs("select",c),!1});var a=$("#html5-warnings");a&&(utils.webglEnabled()||(a.css("display","inline-block"),a.find("#webgl-warning").show()),utils.webWorkersEnabled()||(a.css("display","inline-block"),a.find("#webworker-warning").show()))});