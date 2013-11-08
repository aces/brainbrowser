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

BrainBrowser.SurfaceViewer.filetypes.parse = function(type, data, callback) {
  "use strict";
  
  var config = BrainBrowser.config.surface_viewer;
  var file_type_config = config.filetypes[type];
  var worker_dir = config.worker_dir;
  
  if (file_type_config.worker) {
    BrainBrowser.SurfaceViewer.filetypes.parseWorker(data, file_type_config.worker, function(result) {
      var deindex = new Worker(worker_dir + "/deindex.worker.js");

      deindex.addEventListener("message", function(e) {
        callback(e.data);
      });

      deindex.postMessage(result);
    });
  }
  
};

