/*
* BrainBrowser: Web-based Neurological Visualization Tools
* (https://brainbrowser.cbrain.mcgill.ca)
*
* Copyright (C) 2011-2025
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
* Secure File Loader Module
* Comprehensive validation and security for user-uploaded files
*/

(function() {
  "use strict";

  var BrainBrowser = window.BrainBrowser || {};
  window.BrainBrowser = BrainBrowser;

  BrainBrowser.secureLoader = {

    /**
    * @doc object
    * @name secureLoader.config
    * @description
    * Security configuration for file uploads
    */
    config: {
      max_file_size: 2 * 1024 * 1024 * 1024, // 2GB max
      allowed_extensions: ['.asc', '.obj', '.json', '.gz', '.dat', '.txt'],
      allowed_mime_types: [
        'application/octet-stream',
        'text/plain',
        'application/json',
        'application/gzip',
        'application/x-gzip'
      ],
      enable_content_validation: true,
      enable_filename_sanitization: true,
      max_vertices: 500000, // Max 500k vertices per surface
      max_surfaces: 150 // Max 150 surfaces
    },

    /**
    * @doc function
    * @name secureLoader.validateFile
    * @param {File} file File object to validate
    * @param {object} options Validation options
    * @returns {object} {valid: boolean, errors: array}
    *
    * @description
    * Validate file before loading
    */
    validateFile: function(file, options) {
      options = options || {};
      var errors = [];
      var config = this.config;

      // Check if file exists
      if (!file) {
        errors.push("No file provided");
        return {valid: false, errors: errors};
      }

      // File size validation
      if (file.size > (options.max_file_size || config.max_file_size)) {
        errors.push("File size (" + formatBytes(file.size) + ") exceeds maximum allowed (" +
                   formatBytes(options.max_file_size || config.max_file_size) + ")");
      }

      if (file.size === 0) {
        errors.push("File is empty");
      }

      // Filename validation
      var filename = file.name;

      if (config.enable_filename_sanitization) {
        var sanitized_name = sanitizeFilename(filename);
        if (sanitized_name !== filename) {
          errors.push("Filename contains invalid characters. Sanitized: " + sanitized_name);
        }
      }

      // Extension validation
      var extension = getFileExtension(filename).toLowerCase();
      var allowed_exts = options.allowed_extensions || config.allowed_extensions;

      if (allowed_exts.indexOf(extension) === -1 && allowed_exts.indexOf('.' + extension) === -1) {
        errors.push("File extension '" + extension + "' not allowed. Allowed: " + allowed_exts.join(', '));
      }

      // MIME type validation
      if (file.type) {
        var allowed_mimes = options.allowed_mime_types || config.allowed_mime_types;
        if (allowed_mimes.indexOf(file.type) === -1) {
          // Warning only - MIME types can be unreliable
          console.warn("MIME type '" + file.type + "' not in allowed list. Proceeding with caution.");
        }
      }

      return {
        valid: errors.length === 0,
        errors: errors,
        warnings: [],
        sanitized_name: sanitizeFilename(filename)
      };
    },

    /**
    * @doc function
    * @name secureLoader.loadSecure
    * @param {File} file File object to load
    * @param {function} callback Callback(data, filename, validation_result)
    * @param {object} options Loading options
    *
    * @description
    * Securely load a file with validation
    */
    loadSecure: function(file, callback, options) {
      options = options || {};

      var validation = this.validateFile(file, options);

      if (!validation.valid) {
        if (options.error_callback) {
          options.error_callback({
            message: "File validation failed",
            errors: validation.errors
          });
        }
        console.error("File validation failed:", validation.errors);
        return;
      }

      var self = this;
      var reader = new FileReader();
      var extension = getFileExtension(file.name).toLowerCase();

      reader.onerror = function() {
        if (options.error_callback) {
          options.error_callback({
            message: "Failed to read file",
            error: reader.error
          });
        }
      };

      reader.onload = function(e) {
        var data = e.target.result;

        // Content validation
        if (self.config.enable_content_validation) {
          var content_validation = self.validateContent(data, extension, options);

          if (!content_validation.valid) {
            if (options.error_callback) {
              options.error_callback({
                message: "Content validation failed",
                errors: content_validation.errors
              });
            }
            return;
          }
        }

        // Success callback
        callback(data, validation.sanitized_name, validation);
      };

      // Determine read mode
      if (options.binary || extension === '.gz') {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    },

    /**
    * @doc function
    * @name secureLoader.validateContent
    * @param {string|ArrayBuffer} data File content
    * @param {string} extension File extension
    * @param {object} options Validation options
    * @returns {object} {valid: boolean, errors: array}
    *
    * @description
    * Validate file content structure
    */
    validateContent: function(data, extension, options) {
      options = options || {};
      var errors = [];

      try {
        if (extension === '.asc') {
          return this.validateASCContent(data, options);
        } else if (extension === '.obj') {
          return this.validateOBJContent(data, options);
        } else if (extension === '.json') {
          return this.validateJSONContent(data, options);
        }

        // Unknown format - allow but warn
        console.warn("No content validator for extension: " + extension);
        return {valid: true, errors: []};

      } catch (e) {
        errors.push("Content validation error: " + e.message);
        return {valid: false, errors: errors};
      }
    },

    /**
    * @doc function
    * @name secureLoader.validateASCContent
    * @param {string} data ASC file content
    * @param {object} options Validation options
    * @returns {object} {valid: boolean, errors: array}
    *
    * @description
    * Validate FreeSurfer ASC file structure
    */
    validateASCContent: function(data, options) {
      var errors = [];
      var lines = data.split('\n');

      if (lines.length < 3) {
        errors.push("ASC file too short - minimum 3 lines required");
        return {valid: false, errors: errors};
      }

      // Line 1: comment (optional validation)
      // Line 2: vertex_count face_count
      var header_parts = lines[1].trim().split(/\s+/);

      if (header_parts.length !== 2) {
        errors.push("Invalid ASC header - expected 'vertex_count face_count'");
        return {valid: false, errors: errors};
      }

      var vertex_count = parseInt(header_parts[0], 10);
      var face_count = parseInt(header_parts[1], 10);

      if (isNaN(vertex_count) || isNaN(face_count)) {
        errors.push("Invalid vertex or face count in header");
        return {valid: false, errors: errors};
      }

      // Validate counts
      if (vertex_count <= 0 || vertex_count > (options.max_vertices || this.config.max_vertices)) {
        errors.push("Vertex count " + vertex_count + " exceeds maximum " +
                   (options.max_vertices || this.config.max_vertices));
      }

      if (face_count < 0) {
        errors.push("Invalid face count: " + face_count);
      }

      var expected_lines = 2 + vertex_count + face_count;
      if (lines.length < expected_lines) {
        errors.push("File truncated - expected " + expected_lines + " lines, got " + lines.length);
      }

      // Validate vertex format (sample first few)
      for (var i = 0; i < Math.min(10, vertex_count); i++) {
        var line_idx = 2 + i;
        if (line_idx >= lines.length) break;

        var vertex_parts = lines[line_idx].trim().split(/\s+/);
        if (vertex_parts.length < 3) {
          errors.push("Invalid vertex data at line " + (line_idx + 1));
          break;
        }

        // Check if coordinates are numbers
        for (var j = 0; j < 3; j++) {
          if (isNaN(parseFloat(vertex_parts[j]))) {
            errors.push("Invalid vertex coordinate at line " + (line_idx + 1));
            break;
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors: errors,
        info: {
          vertex_count: vertex_count,
          face_count: face_count
        }
      };
    },

    /**
    * @doc function
    * @name secureLoader.validateOBJContent
    * @param {string} data OBJ file content
    * @param {object} options Validation options
    * @returns {object} {valid: boolean, errors: array}
    *
    * @description
    * Validate Wavefront OBJ file structure
    */
    validateOBJContent: function(data, options) {
      var errors = [];
      var lines = data.split('\n');
      var vertex_count = 0;

      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();

        if (line.startsWith('v ')) {
          vertex_count++;

          if (vertex_count > (options.max_vertices || this.config.max_vertices)) {
            errors.push("Vertex count exceeds maximum");
            break;
          }
        }
      }

      if (vertex_count === 0) {
        errors.push("No vertices found in OBJ file");
      }

      return {
        valid: errors.length === 0,
        errors: errors,
        info: {
          vertex_count: vertex_count
        }
      };
    },

    /**
    * @doc function
    * @name secureLoader.validateJSONContent
    * @param {string} data JSON file content
    * @param {object} options Validation options
    * @returns {object} {valid: boolean, errors: array}
    *
    * @description
    * Validate JSON file structure
    */
    validateJSONContent: function(data, options) {
      var errors = [];

      try {
        var parsed = JSON.parse(data);

        // Check for potential security issues
        var json_str = JSON.stringify(parsed);

        // Detect suspicious patterns
        if (json_str.indexOf('<script') >= 0) {
          errors.push("Potentially malicious content detected");
        }

      } catch (e) {
        errors.push("Invalid JSON: " + e.message);
      }

      return {
        valid: errors.length === 0,
        errors: errors
      };
    }

  };

  ////////////////////////////////////
  // PRIVATE HELPER FUNCTIONS
  ////////////////////////////////////

  function sanitizeFilename(filename) {
    // Remove path traversal attempts
    filename = filename.replace(/\.\.\//g, '');
    filename = filename.replace(/\.\.\\/g, '');

    // Remove special characters except alphanumeric, dash, underscore, dot
    filename = filename.replace(/[^a-zA-Z0-9\-_.]/g, '_');

    // Limit length
    if (filename.length > 255) {
      var ext = getFileExtension(filename);
      filename = filename.substring(0, 250) + ext;
    }

    return filename;
  }

  function getFileExtension(filename) {
    var parts = filename.split('.');
    return parts.length > 1 ? '.' + parts[parts.length - 1] : '';
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    var k = 1024;
    var sizes = ['Bytes', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

})();
