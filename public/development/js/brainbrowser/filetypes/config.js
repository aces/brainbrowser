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

(function() {
  "use strict";
  
  BrainBrowser.filetypes.config = {
    MNIObject: {
      worker: "js/workers/mniobj.worker.js",
      afterParse : function(obj) {
        obj.getVertexInfo = function(vertex) {
          var position_vector = [
            obj.positionArray[vertex*3],
            obj.positionArray[vertex*3+1],
            obj.positionArray[vertex*3+2]
          ];
          return { vertex: vertex, position_vector: position_vector};
        };
      }
    },
    WavefrontObj: {
      worker: "js/workers/wavefront_obj.worker.js"
    },
    FreeSurferAsc: {
      worker: "js/workers/freesurfer_asc.worker.js",
      format_hint: 'You can use <a href="http://surfer.nmr.mgh.harvard.edu/fswiki/mris_convert" target="_blank">mris_convert</a> to convert your binary surface files into .asc format.'
    }
  };
})();


