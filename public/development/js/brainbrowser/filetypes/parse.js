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

BrainBrowser.filetypes.parse = function(type, data, callback) {
  "use strict";
  
  
  var obj = {};
  
  var config = BrainBrowser.filetypes.config[type];
  
  if (config.parse) {
    config.parse(obj, data, callback);
  }
  
  if (config.worker) {
    BrainBrowser.filetypes.parseWorker(obj, data, config.worker, callback);
  }
  
  if (config.afterParse) {
    config.afterParse(obj, data);
  }
};

