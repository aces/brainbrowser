/*
 * Copyright (c) 2011-2012, McGill University
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *   * Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *   * Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *   * Neither the name of McGill University nor the
 *     names of its contributors may be used to endorse or promote products
 *     derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL McGill University  BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
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
        var colorScale = BrainBrowser.createColorMap(string);
        colorScale.name = name;
        callback(colorScale);
      });
    },

    loadColorScaleFromURL: function(url, name, callback) {
      VolumeViewer.loader.loadFromURL(url, function(string) {
        var colorScale = BrainBrowser.createColorMap(string);
        colorScale.name = name;
        callback(colorScale);
      });
    }
  };
})();



