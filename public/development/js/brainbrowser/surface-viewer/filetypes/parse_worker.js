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

// Create a worker thread to parse the model data.
BrainBrowser.SurfaceViewer.filetypes.parseWorker = function(data, worker_file, options, callback) {
  "use strict";
  
  var worker_dir = BrainBrowser.config.surface_viewer.worker_dir;

  var worker = new Worker(worker_dir + "/" + worker_file);
  
  worker.addEventListener("message", function(e) {
    if (callback) callback(e.data);
    worker.terminate();
  });
  
  worker.postMessage({
    data: data,
    options: options
  });
};
