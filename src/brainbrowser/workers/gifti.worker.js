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

/**
  * @author: Robert D Vincent
  * 
  * This module is a small wrapper to permit the loading of GIFTI
  * files in a BrainBrowser web worker. GIFTI is an XML-based format
  * for surfaces and surface statistics, most of the supporting
  * documentation is available at the NITRC web site here:
  *
  * https://www.nitrc.org/projects/gifti/ 
  *
  * Almost all of the actual parsing is handled by this library:
  *
  * https://github.com/rii-mango/GIFTI-Reader-JS
  * 
  * To operate inside a web worker, the library has to be loaded within
  * the worker itself. To the best of my knowledge this must be done with
  * the "importScripts()" call. To complicate matters, the environment in
  * which workers operate is isolated in a peculiar way, such that we can't
  * load the script without knowing the base URL of the _original_ BB, so
  * that has to be passed into the worker as the "url" property of the 
  * message data.
  */

(function() {
  "use strict";

  self.addEventListener("message", function(e) {
    var input = e.data;

    /* Need to prepend the base url, which is transfered with the
     * message. This gets around issues with loading a script from
     * within a worker blob.
     */
    importScripts(input.url + 'gifti-reader.js');

    var result = parse(input.data) || {
      error: true,
      error_message: "Error parsing data."
    };

    var transfer = [];
    if (result.vertices && result.shapes[0].indices) {
      transfer.push(result.vertices.buffer,
                    result.shapes[0].indices.buffer);
      self.postMessage(result, transfer);
    }
    else {
      transfer.push(result.values.buffer);
      self.postMessage(result, transfer);
    }
  });

  function parse(data) {
    var result = {};
    var gii = gifti.parse(data);
    var n_vtx = gii.getNumPoints();
    var n_tri = gii.getNumTriangles();

    if (n_tri > 0 && n_vtx > 0) {
      /* It's a GIFTI surface.
       */
      result.type = 'polygon';
      result.vertices = gii.getPointsDataArray().getData();
      result.shapes = [{ indices: gii.getTrianglesDataArray().getData() }];
    }
    else if (gii.dataArrays.length > 0) {
      /* It's some other GIFTI file, treat it as vertex data.
       */
      var values = gii.dataArrays[0].getData();
      var min, max;
      var i;
      var n = values.length;
      min = +Number.MAX_VALUE;
      max = -Number.MAX_VALUE;
      for (i = 0; i < n; i++) {
        min = Math.min(min, values[i]);
        max = Math.max(max, values[i]);
      }
      result.values = values;
      result.min = min;
      result.max = max;
      /* Build a 5-item color table (index R G B A) as a string.  We
       * use this method because I can't find any other reasonable way
       * to return a sparse color table from the worker.
       */
      var text = '';
      Object.keys(gii.labelTable).forEach( function(name) {
        var lb = gii.labelTable[name];
        text += lb.key + ' ';
        text += lb.r + ' ';
        text += lb.g + ' ';
        text += lb.b + ' ';
        text += lb.a + '\n';
      });
      if (text.length > 0) {
        result.colors = text;
      }
    }
    return result;
  }
})();


