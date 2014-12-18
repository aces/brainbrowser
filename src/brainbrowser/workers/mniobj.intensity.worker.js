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
* @author: Tarek Sherif
* @author: Nicolas Kassis
*/

(function() {
  "use strict";
  
  self.addEventListener("message", function(e) {
    var result = parse(e.data.data);
    self.postMessage(result, [result.values.buffer]);
  });
  
  function parse(string) {
    var result = {};
    var i, count, min, max;
  
    result.values = new Float32Array(string.trim().split(/\s+/).map(parseFloat));
    min = result.values[0];
    max = result.values[0];

    for(i = 1, count = result.values.length; i < count; i++) {
      min = Math.min(min, result.values[i]);
      max = Math.max(max, result.values[i]);
    }

    result.min = min;
    result.max = max;

    return result;
  }
 
})();

