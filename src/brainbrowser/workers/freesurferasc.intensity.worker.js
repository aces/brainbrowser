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
    var message = e.data;
    var data = message.data;
    self.postMessage(parse(data));
  });
  
  function parse(string) {
    var result = {
      values: []
    };
    var lines, value;
    var i, count, min, max;
  
    string = string.replace(/^\s+/, "").replace(/\s+$/, "");

    lines = string.split("\n");
    value = parseFloat(lines[0].replace(/^\s+/, "").replace(/\s+$/, "").split(/\s+/)[4]);
    result.values[0] = value;
    min = value;
    max = value;

    for(i = 1, count = lines.length; i < count; i++) {
      value = parseFloat(lines[i].replace(/^\s+/, "").replace(/\s+$/, "").split(/\s+/)[4]);
      result.values[i] = value;
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
    
    result.min = min;
    result.max = max;

    return result;
  }
 
})();

