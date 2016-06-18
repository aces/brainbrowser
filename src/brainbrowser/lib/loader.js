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
* Author: Tarek Sherif <tsherif@gmail.com> (http://tareksherif.ca/)
*/

(function() {
  "use strict";

  var loader = BrainBrowser.loader = {
    
    /**
    * @doc function
    * @name BrainBrowser.loader:loadFromURL
    * @param {string}  url URL to send the request to.
    * @param {function} callback Function to call if the request is successful. The
    *   callback will receive the following information as arguments:
    *
    * * The response from the server.
    * * The name of the file requested.
    * * Any options that were passed to loadFromURL
    *
    * @param {object} options The only option used by this method is **result_type**, 
    *   which can be set to **text** or **arraybuffer** (default is **text**). Other
    *   options are passed on to the **callback** function.
    * 
    * @description
    * Fetch data from a URL and pass the results to a callback.
    * ```js
    * BrainBrowser.loader.loadFromURL(url, function(data) {
    *   // Parse the data.
    * });
    * ```
    */
    loadFromURL: function(url, callback, options) {
      options = options || {};
      var request = new XMLHttpRequest();
      var result_type = options.result_type;
      var status;
      var parts = url.split("/");
      var filename = parts[parts.length-1];

      request.open("GET", url);

      if (result_type === "arraybuffer") {
        request.responseType = "arraybuffer";
      }
      
      request.onreadystatechange = function() {
        if (request.readyState === 4){
          status = request.status;

          // Based on jQuery's "success" codes.
          if(status >= 200 && status < 300 || status === 304) {
            if (!loader.checkCancel(options)) {
              callback(request.response, filename, options);
            }
          } else {
            var error_message = "error loading URL: " + url + "\n" +
              "HTTP Response: " + request.status + "\n" +
              "HTTP Status: " + request.statusText + "\n" +
              "Response was: \n" + request.response;

            BrainBrowser.events.triggerEvent("error", { message: error_message });
            throw new Error(error_message);
          }
        }
      };
      
      request.send();

    },
    
    /**
    * @doc function
    * @name BrainBrowser.loader:loadFromFile
    * @param {DOMElement}  file_input File input DOM object.
    * @param {function} callback Function to call if the request is successful. The
    *   callback will receive the following information as arguments:
    *
    * * The data from the file.
    * * The name of the file.
    * * Any options that were passed to loadFromFile
    *
    * @param {object} options The only option used by this method is **result_type**, 
    *   which can be set to **text** or **arraybuffer** (default is **text**). Other
    *   options are passed on to the **callback** function.
    * 
    * @description
    * Fetch data from a local file and pass the results to a callback.
    * ```js
    * BrainBrowser.loader.loadFromFile(file_input, function(data) {
    *   // Parse the data.
    * });
    * ```
    */
    loadFromFile: function(file_input, callback, options) {
      var files = file_input.files;
      
      if (files.length === 0) {
        return;
      }

      options = options || {};
      var result_type = options.result_type;

      var reader = new FileReader();
      var parts = file_input.value.split("\\");
      var filename = parts[parts.length-1];

      reader.file = files[0];

      reader.onloadend = function(event) {
        var result = event.target.result;
        try {
          /* See if the data can be inflated.
           */
          var unzipped = pako.inflate(result);
          result = unzipped.buffer;
        } catch(e) {
          /* pako probably didn't recognize this as gzip.
           */
        } finally {
          /* At this point, we have a binary hunk of data that may
           * have been inflated.
           */
          if (result_type !== 'arraybuffer') {
            /* The caller requested the data as a string, so we have
             * to perform an additional step to convert the
             * arraybuffer we have into the string the caller wants.
             */
            if (typeof TextDecoder !== 'function') {
              /* Use the slightly slower blob-to-filereader conversion
               * to string.
               */
              var blob = new Blob([result]);
              var rdr2 = new FileReader();
              rdr2.onload = function(event) {
                callback(event.target.result, filename, options);
              };
              rdr2.readAsText(blob);
            }
            else {
              /* Simpler but newer conversion using TextDecoder, this
               * might not work on some browsers.
               */
              var dv = new DataView(result);
              var decoder = new TextDecoder();
              result = decoder.decode(dv);
              callback(result, filename, options);
            }
          }
          else {
            /* The caller requested an arraybuffer, so we just pass it
             * back now.
             */
            callback(result, filename, options);
          }
        }
      };

      reader.onerror = function() {
        var error_message = "error reading file: " + filename;

        BrainBrowser.events.triggerEvent("error", { message: error_message });
        throw new Error(error_message);
      };
      
      reader.readAsArrayBuffer(files[0]);
    },

    /**
    * @doc function
    * @name BrainBrowser.loader:loadColorMapFromURL
    * @param {string}  url URL to send the request to.
    * @param {function} callback Function to call if the request is successful. The
    *   callback will receive the following information as arguments:
    *
    * * The created color map object.
    * * The name of the file requested.
    * * Any options that were passed to loadColorMapFromURL
    *
    * @param {object} options Any options are passed on to the **callback** function.
    * 
    * @description
    * Wrapper for loadFromURL that parses the received data into a color map object.
    * ```js
    * BrainBrowser.loader.loadColorMapFromURL(url, function(color_map) {
    *   // Manipulate color map object.
    * });
    * ```
    */
    loadColorMapFromURL: function(url, callback, options) {
      loader.loadFromURL(url, function(data, filename, options) {
        callback(BrainBrowser.createColorMap(data, options), filename, options);
      }, options);
    },


    /**
    * @doc function
    * @name BrainBrowser.loader:loadColorMapFromFile
    * @param {string}  file_input File input DOM object.
    * @param {function} callback Function to call if the request is successful. The
    *   callback will receive the following information as arguments:
    *
    * * The created color map object.
    * * The name of the file.
    * * Any options that were passed to loadColorMapFromFile
    *
    * @param {object} options Any options are passed on to the **callback** function.
    * 
    * @description
    * Wrapper for loadFromFile that parses the data into a color map object.
    * ```js
    * BrainBrowser.loader.loadColorMapFromFile(file_input, function(color_map) {
    *   // Manipulate color map object.
    * });
    * ```
    */
    loadColorMapFromFile: function(file_input, callback, options) {
      loader.loadFromFile(file_input, function(data, filename, options) {
        callback(BrainBrowser.createColorMap(data, options), filename, options);
      }, options);
    },
 

    // Allows the loading of data to be cancelled after the request is sent
    // or processing has begun (it must happen before the model begins to be
    // loaded to the canvas though).
    // Argument 'options' should either be a function that returns 'true' if the
    // loading should be cancelled or a hash containting the test function in
    // the property 'test' and optionally, a function to do cleanup after the
    // cancellation in the property 'cleanup'.

    /**
    * @doc function
    * @name BrainBrowser.loader:checkCancel
    * @param {function|object} options If a function is given, it will be called as the 
    * **test** function. If an object is passed, it can have the following
    * parameters:
    *
    * * **test** Function to test whether cancellation should occur.
    * * **cleanup** Function that will be called if **test** function evaluates to **true**.
    *
    * @returns {boolean} The result of calling the **test** function.
    *
    * @description
    * Convenience method that calls a test function, returns its result and optionally runs
    * cleanup code if it's provided.
    * ```js
    * BrainBrowser.loader.checkCancel(function() { 
    *   return request_number !== current_request; 
    * });
    * ```
    */
    checkCancel: function(options) {
      options = options || {};
      if (BrainBrowser.utils.isFunction(options)) {
        options = { test: options };
      }
      
      var cancelTest = options.test;
      var cancelCleanup = options.cleanup;
      var cancelled = false;
      
      if (cancelTest && cancelTest()) {
        cancelled = true;
        if (cancelCleanup) cancelCleanup();
      }
      
      return cancelled;
    }

  };

})();
