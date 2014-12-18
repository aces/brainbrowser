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
  
  // Parsing based on http://www.grahamwideman.com/gw/brain/fs/surfacefileformats.htm
  function parse(data) {
    var bytes = new DataView(data);
    var index = 0;
    var values;
    var num_vertices, vals_per_vertex;
    var min, max;
    var i;

    var magic_number = getMagicNumber(bytes);
    index += 3;

    if (magic_number !== 0x00ffffff) {
      return {
        error: true,
        error_message: "Unrecognized file format."
      };
    }

    num_vertices = bytes.getUint32(index);
    index += 8;  // Skip face count

    vals_per_vertex = bytes.getUint32(index);
    index += 4;

    if (vals_per_vertex !== 1) {
      return {
        error: true,
        error_message: "Only one value per vertex supported. Number of values: " + vals_per_vertex
      };
    }

    values = new Float32Array(num_vertices);
    
    values[0] = min = max = bytes.getFloat32(index);
    index += 4;

    for (i = 1; i < num_vertices; i++) {
      values[i] = bytes.getFloat32(index);
      min = Math.min(min, values[i]);
      max = Math.max(max, values[i]);
      index += 4;
    }

    return {
      values: values,
      min: min,
      max: max
    };
  }

  // First 3 bytes.
  function getMagicNumber(bytes) {
    var result = 0;
    var i;

    for (i = 0; i < 3; i++) {
      result += bytes.getUint8(i) << (3 - i - 1) * 8;
    }

    return result;
  }
})();

