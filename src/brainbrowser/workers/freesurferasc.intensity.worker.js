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
*/

(function() {
  "use strict";
  
  self.addEventListener("message", function(e) {
    var result = parse(e.data.data);
    self.postMessage(result, [result.values.buffer]);
  });
  
  function parse(string) {
    var values;
    var lines, value;
    var i, num_vals, min, max;
  
    string = string.trim();

    lines = string.split("\n");
    num_vals = lines.length;
    values = new Float32Array(num_vals);
    value = parseFloat(lines[0].trim().split(/\s+/)[4]);
    values[0] = value;
    min = value;
    max = value;

    for(i = 1; i < num_vals; i++) {
      value = parseFloat(lines[i].trim().split(/\s+/)[4]);
      values[i] = value;
      min = Math.min(min, value);
      max = Math.max(max, value);
    }

    return {
      values: new Float32Array(values),
      min: min,
      max: max
    };
  }
 
})();

