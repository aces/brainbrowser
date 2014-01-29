/*
* BrainBrowser: Web-based Neurological Visualization Tools
* (https://brainbrowser.cbrain.mcgill.ca)
*
* Copyright (C) 2011 McGill University 
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
* @author: Nicolas Kassis
* @author: Tarek Sherif
*/

(function() {
  "use strict";
    
  var VolumeViewer = BrainBrowser.VolumeViewer;

  /**
  * Async load ArrayBuffer using XHR2
  * @param {String} url
  * @param {Function} callback
  */
  VolumeViewer.loader = {
    loadArrayBuffer: function(url, callback) {
      var request = new XMLHttpRequest();
      var status;

      request.open('GET', url);
      request.responseType = 'arraybuffer';
      request.onreadystatechange = function() {
        if(request.readyState === 4) {
          status = request.status;
          if(status >= 200 && status < 300 || status === 304) {
            callback(request.response);
          } else {
            throw new Error(
              "error loading URL: " + url + "\n" +
              "HTTP Response: " + request.status + "\n" +
              "HTTP Status: " + request.statusText + "\n" +
              "Response was: \n" + request.response
            );
          }
        }
      };
      request.send();
    },
    
    loadFromTextFile: function(file_input,callback) {
      var reader = new FileReader();
      var files = file_input.files;
      reader.file = files[0];
      
      reader.onloadend = function(e) {
        callback(e.target.result);
      };
      
      reader.readAsText(files[0]);
    },
  
    loadFromURL: function(url,callback,error) {
      $.ajax({
        url: url,
        type: "GET",
        success: callback,
        error : error
      });
    },
    
    loadColorScaleFromFile: function(fileInput, name, callback) {
      VolumeViewer.loader.loadFromTextFile(fileInput, function(string) {
        var color_map = BrainBrowser.createColorMap(string);
        color_map.name = name;
        callback(color_map);
      });
    },

    loadColorScaleFromURL: function(url, name, callback) {
      VolumeViewer.loader.loadFromURL(url, function(string) {
        var color_map = BrainBrowser.createColorMap(string);
        color_map.name = name;
        callback(color_map);
      });
    }
  };
})();



