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

BrainBrowser.filetypes.parseWorker = function(self, data, worker_file, callback) {
  var worker = new Worker(worker_file);
  
  worker.addEventListener("message", function(e) {
    var result = e.data;
    var prop;
    
    for (prop in result) {
      if (result.hasOwnProperty(prop)){
        self[prop] = result[prop];
      }
    }
    if (callback) callback(self);
    worker.terminate();
  });
  
  worker.postMessage(data);
};
