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

/*
 * This file defines MNIObj object.
 * Given a url, the constructor will fetch the file specified which should be an
 * MNI .obj file. It will then pars this file and return an object with the properties
 * needed to display the file.
 *
 */
 
BrainBrowser.filetypes.MNIObject = function(data, callback) {
  
  if(!(this instanceof BrainBrowser.filetypes.MNIObject)) {
    return new BrainBrowser.filetypes.MNIObject(data, callback);
  }

  var self = this;

  BrainBrowser.filetypes.parsing(self, data, "js/mniobj.worker.js", callback);

  self.getVertexInfo = function(vertex) {
    var position_vector = [
      self.positionArray[vertex*3],
      self.positionArray[vertex*3+1],
      self.positionArray[vertex*3+2]
    ];
    return { vertex: vertex, position_vector: position_vector};
  };
};