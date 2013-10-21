/*
 * layout.js
 *
 * Copyright (C) 2011 McGill University
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

$(function() {
  "use strict";
  
  $(".button").button();
  $(".tabs").tabs({ heigth: 800 });
  $(".tablink").click(function(e) {
    var tabs_object = $(e.target).attr('data-tabs');
    var tab = $(e.target).attr('data-tab');
    $("#"+tabs_object).tabs("select", tab);
    return false;
  });
  var warnings = $("#html5-warnings");
  if (warnings) {
    if (!utils.webglEnabled()) {
      warnings.css("display", "inline-block");
      warnings.find("#webgl-warning").show();
    }
    if (!utils.webWorkersEnabled()) {
      warnings.css("display", "inline-block");
      warnings.find("#webworker-warning").show();
    }
  }
});
