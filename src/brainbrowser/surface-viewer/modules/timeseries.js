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
* Time Series Animation Module
* Optimized for large-scale electrophysiology data (256 channels × 2kHz × 600s+)
* Features: chunked loading, Web Worker processing, IndexedDB caching, 30fps streaming
*/

BrainBrowser.SurfaceViewer.modules.timeseries = function(viewer) {
  "use strict";

  var THREE = BrainBrowser.SurfaceViewer.THREE;

  // Time series state
  var timeseries_data = null;
  var current_time = 0;
  var playing = false;
  var playback_speed = 1.0;
  var target_fps = 30;
  var frame_duration = 1000 / target_fps;

  // Chunked loading
  var chunk_size = 5 * 1024 * 1024; // 5MB chunks
  var loaded_chunks = {};
  var chunk_buffer_size = 10; // Keep 10 chunks in memory

  // Frame buffering
  var frame_buffer = [];
  var buffer_size = 90; // 3 seconds at 30fps
  var current_frame_index = 0;

  // Web Worker for data processing
  var worker = null;

  // IndexedDB for caching
  var db = null;
  var db_name = "BrainBrowser_TimeSeries";
  var db_version = 1;

  // Electrode mapping
  var electrode_mapping = []; // Maps channels to electrodes

  // Animation
  var animation_frame_id = null;
  var last_frame_time = 0;

  /**
  * @doc function
  * @name viewer.timeseries:loadTimeSeriesFromFile
  * @param {File} file File object containing time series data
  * @param {object} options Loading options:
  *   - format: 'binary'|'json'|'csv' (default: 'binary')
  *   - channels: number of channels (default: 256)
  *   - sample_rate: samples per second (default: 2000)
  *   - downsample: downsample factor (default: auto-calculated for 30fps)
  *   - use_cache: use IndexedDB caching (default: true)
  *   - chunk_size: chunk size in bytes (default: 5MB)
  *
  * @description
  * Load large time series data with chunked streaming.
  *
  * ```js
  * viewer.loadTimeSeriesFromFile(file, {
  *   channels: 256,
  *   sample_rate: 2000,
  *   downsample: 64
  * });
  * ```
  */
  viewer.loadTimeSeriesFromFile = function(file, options) {
    options = options || {};

    var format = options.format || 'binary';
    var channels = options.channels || 256;
    var sample_rate = options.sample_rate || 2000;
    var use_cache = options.use_cache !== undefined ? options.use_cache : true;

    // Auto-calculate downsample factor for 30fps
    var downsample = options.downsample || Math.floor(sample_rate / target_fps);

    timeseries_data = {
      file: file,
      file_size: file.size,
      format: format,
      channels: channels,
      sample_rate: sample_rate,
      downsample: downsample,
      effective_fps: sample_rate / downsample,
      duration: 0, // Will be calculated
      total_samples: 0,
      total_frames: 0,
      loaded_time: 0,
      use_cache: use_cache
    };

    console.log("Loading time series: " + channels + " channels @ " + sample_rate + "Hz");
    console.log("Downsampling by " + downsample + "x for " + timeseries_data.effective_fps.toFixed(1) + " fps playback");

    // Initialize IndexedDB if caching enabled
    if (use_cache) {
      initializeDatabase(function() {
        loadMetadata(file, format, channels, sample_rate, downsample);
      });
    } else {
      loadMetadata(file, format, channels, sample_rate, downsample);
    }
  };

  /**
  * @doc function
  * @name viewer.timeseries:setElectrodeMapping
  * @param {array} mapping Array of {channel, electrode_id} objects
  *
  * @description
  * Map time series channels to electrodes for visualization.
  *
  * ```js
  * viewer.setElectrodeMapping([
  *   {channel: 0, electrode_id: "electrode_0"},
  *   {channel: 1, electrode_id: "electrode_1"},
  *   // ...
  * ]);
  * ```
  */
  viewer.setElectrodeMapping = function(mapping) {
    electrode_mapping = mapping;
  };

  /**
  * @doc function
  * @name viewer.timeseries:play
  *
  * @description
  * Start time series playback.
  *
  * ```js
  * viewer.playTimeSeries();
  * ```
  */
  viewer.playTimeSeries = function() {
    if (!timeseries_data) {
      console.error("No time series data loaded");
      return;
    }

    playing = true;
    last_frame_time = performance.now();

    // Start background loading if needed
    preloadFrames(current_time);

    // Start animation loop
    animateTimeSeries();

    viewer.triggerEvent("timeseries:play");
  };

  /**
  * @doc function
  * @name viewer.timeseries:pause
  *
  * @description
  * Pause time series playback.
  *
  * ```js
  * viewer.pauseTimeSeries();
  * ```
  */
  viewer.pauseTimeSeries = function() {
    playing = false;

    if (animation_frame_id) {
      cancelAnimationFrame(animation_frame_id);
      animation_frame_id = null;
    }

    viewer.triggerEvent("timeseries:pause");
  };

  /**
  * @doc function
  * @name viewer.timeseries:stop
  *
  * @description
  * Stop time series playback and reset to beginning.
  *
  * ```js
  * viewer.stopTimeSeries();
  * ```
  */
  viewer.stopTimeSeries = function() {
    viewer.pauseTimeSeries();
    current_time = 0;
    current_frame_index = 0;

    viewer.triggerEvent("timeseries:stop");
  };

  /**
  * @doc function
  * @name viewer.timeseries:seek
  * @param {number} time Time in seconds
  *
  * @description
  * Seek to specific time position.
  *
  * ```js
  * viewer.seekTimeSeries(30.5); // Seek to 30.5 seconds
  * ```
  */
  viewer.seekTimeSeries = function(time) {
    if (!timeseries_data) return;

    current_time = Math.max(0, Math.min(time, timeseries_data.duration));
    current_frame_index = Math.floor(current_time * timeseries_data.effective_fps);

    // Clear frame buffer and reload around new position
    frame_buffer = [];
    preloadFrames(current_time);

    viewer.triggerEvent("timeseries:seek", {time: current_time});
  };

  /**
  * @doc function
  * @name viewer.timeseries:setPlaybackSpeed
  * @param {number} speed Playback speed multiplier (default: 1.0)
  *
  * @description
  * Set playback speed (1.0 = normal, 2.0 = 2x, 0.5 = half speed).
  *
  * ```js
  * viewer.setPlaybackSpeed(2.0); // 2x speed
  * ```
  */
  viewer.setPlaybackSpeed = function(speed) {
    playback_speed = Math.max(0.1, Math.min(10, speed));
  };

  /**
  * @doc function
  * @name viewer.timeseries:getCurrentTime
  * @returns {number} Current playback time in seconds
  *
  * @description
  * Get current playback position.
  *
  * ```js
  * var time = viewer.getCurrentTime();
  * ```
  */
  viewer.getCurrentTime = function() {
    return current_time;
  };

  /**
  * @doc function
  * @name viewer.timeseries:getDuration
  * @returns {number} Total duration in seconds
  *
  * @description
  * Get total duration of time series.
  *
  * ```js
  * var duration = viewer.getTimeSeriesDuration();
  * ```
  */
  viewer.getTimeSeriesDuration = function() {
    return timeseries_data ? timeseries_data.duration : 0;
  };

  /**
  * @doc function
  * @name viewer.timeseries:clearCache
  *
  * @description
  * Clear IndexedDB cache.
  *
  * ```js
  * viewer.clearTimeSeriesCache();
  * ```
  */
  viewer.clearTimeSeriesCache = function() {
    if (!db) return;

    var transaction = db.transaction(["chunks"], "readwrite");
    var store = transaction.objectStore("chunks");
    store.clear();
  };

  ////////////////////////////////////
  // PRIVATE FUNCTIONS
  ////////////////////////////////////

  function initializeDatabase(callback) {
    var request = indexedDB.open(db_name, db_version);

    request.onerror = function() {
      console.error("Failed to open IndexedDB");
      callback();
    };

    request.onsuccess = function(event) {
      db = event.target.result;
      callback();
    };

    request.onupgradeneeded = function(event) {
      var database = event.target.result;

      if (!database.objectStoreNames.contains("chunks")) {
        database.createObjectStore("chunks", {keyPath: "id"});
      }
    };
  }

  function loadMetadata(file, format, channels, sample_rate, downsample) {
    // Calculate metadata based on file size
    var bytes_per_sample = 4; // Assuming float32
    var total_samples_raw = Math.floor(file.size / (bytes_per_sample * channels));

    timeseries_data.total_samples = total_samples_raw;
    timeseries_data.duration = total_samples_raw / sample_rate;
    timeseries_data.total_frames = Math.floor(total_samples_raw / downsample);

    console.log("Duration: " + timeseries_data.duration.toFixed(2) + "s");
    console.log("Total frames: " + timeseries_data.total_frames);
    console.log("File size: " + (file.size / 1024 / 1024).toFixed(2) + " MB");

    // Initialize Web Worker
    initializeWorker();

    viewer.triggerEvent("timeseries:loaded", {
      duration: timeseries_data.duration,
      channels: channels,
      sample_rate: sample_rate,
      fps: timeseries_data.effective_fps
    });
  }

  function initializeWorker() {
    // Worker code will be in separate file
    // For now, use inline worker
    var worker_code = [
      "self.addEventListener('message', function(e) {",
      "  var data = e.data;",
      "  ",
      "  if (data.command === 'process_chunk') {",
      "    var result = processChunk(data);",
      "    self.postMessage(result);",
      "  }",
      "});",
      "",
      "function processChunk(data) {",
      "  var buffer = data.buffer;",
      "  var channels = data.channels;",
      "  var downsample = data.downsample;",
      "  var start_sample = data.start_sample;",
      "  ",
      "  var view = new Float32Array(buffer);",
      "  var samples_in_chunk = view.length / channels;",
      "  var downsampled_length = Math.floor(samples_in_chunk / downsample);",
      "  ",
      "  var result = new Float32Array(downsampled_length * channels);",
      "  ",
      "  // Downsample by averaging",
      "  for (var frame = 0; frame < downsampled_length; frame++) {",
      "    for (var ch = 0; ch < channels; ch++) {",
      "      var sum = 0;",
      "      var start_idx = frame * downsample * channels + ch;",
      "      ",
      "      for (var s = 0; s < downsample; s++) {",
      "        var idx = start_idx + s * channels;",
      "        if (idx < view.length) {",
      "          sum += view[idx];",
      "        }",
      "      }",
      "      ",
      "      result[frame * channels + ch] = sum / downsample;",
      "    }",
      "  }",
      "  ",
      "  return {",
      "    data: result.buffer,",
      "    frames: downsampled_length,",
      "    start_frame: Math.floor(start_sample / downsample)",
      "  };",
      "}"
    ].join("\n");

    var blob = new Blob([worker_code], {type: "application/javascript"});
    var worker_url = URL.createObjectURL(blob);
    worker = new Worker(worker_url);

    worker.addEventListener("message", function(e) {
      handleWorkerResult(e.data);
    });
  }

  function preloadFrames(around_time) {
    if (!timeseries_data) return;

    var start_frame = Math.floor(around_time * timeseries_data.effective_fps);
    var frames_needed = buffer_size;

    // Calculate which file chunks are needed
    var start_sample = start_frame * timeseries_data.downsample;
    var samples_needed = frames_needed * timeseries_data.downsample;

    var bytes_per_sample = 4;
    var bytes_per_frame_raw = timeseries_data.channels * bytes_per_sample;

    var byte_start = start_sample * bytes_per_frame_raw;
    var byte_end = byte_start + samples_needed * bytes_per_frame_raw;

    // Load chunk from file
    loadChunk(byte_start, byte_end, start_sample);
  }

  function loadChunk(byte_start, byte_end, start_sample) {
    var chunk_id = byte_start + "_" + byte_end;

    // Check if already loaded
    if (loaded_chunks[chunk_id]) {
      return;
    }

    // Check cache first
    if (timeseries_data.use_cache && db) {
      checkCache(chunk_id, function(cached_data) {
        if (cached_data) {
          processChunk(cached_data, start_sample);
        } else {
          loadChunkFromFile(byte_start, byte_end, chunk_id, start_sample);
        }
      });
    } else {
      loadChunkFromFile(byte_start, byte_end, chunk_id, start_sample);
    }
  }

  function loadChunkFromFile(byte_start, byte_end, chunk_id, start_sample) {
    var blob = timeseries_data.file.slice(byte_start, byte_end);
    var reader = new FileReader();

    reader.onload = function(e) {
      var array_buffer = e.target.result;

      // Cache if enabled
      if (timeseries_data.use_cache && db) {
        cacheChunk(chunk_id, array_buffer);
      }

      processChunk(array_buffer, start_sample);
    };

    reader.readAsArrayBuffer(blob);
  }

  function processChunk(array_buffer, start_sample) {
    // Send to worker for downsampling
    worker.postMessage({
      command: 'process_chunk',
      buffer: array_buffer,
      channels: timeseries_data.channels,
      downsample: timeseries_data.downsample,
      start_sample: start_sample
    }, [array_buffer]);
  }

  function handleWorkerResult(result) {
    var frame_data = new Float32Array(result.data);
    var start_frame = result.start_frame;

    // Add frames to buffer
    for (var i = 0; i < result.frames; i++) {
      var frame = {
        index: start_frame + i,
        time: (start_frame + i) / timeseries_data.effective_fps,
        data: new Float32Array(timeseries_data.channels)
      };

      for (var ch = 0; ch < timeseries_data.channels; ch++) {
        frame.data[ch] = frame_data[i * timeseries_data.channels + ch];
      }

      frame_buffer.push(frame);
    }

    // Keep buffer size limited (FIFO)
    while (frame_buffer.length > buffer_size) {
      frame_buffer.shift();
    }

    frame_buffer.sort(function(a, b) { return a.index - b.index; });
  }

  function animateTimeSeries() {
    if (!playing) return;

    var now = performance.now();
    var delta = now - last_frame_time;

    if (delta >= frame_duration / playback_speed) {
      updateFrame();
      last_frame_time = now;
    }

    animation_frame_id = requestAnimationFrame(animateTimeSeries);
  }

  function updateFrame() {
    if (frame_buffer.length === 0) {
      // Buffer underrun - load more data
      preloadFrames(current_time);
      return;
    }

    // Find closest frame
    var target_index = current_frame_index;
    var closest_frame = null;
    var min_diff = Infinity;

    for (var i = 0; i < frame_buffer.length; i++) {
      var diff = Math.abs(frame_buffer[i].index - target_index);
      if (diff < min_diff) {
        min_diff = diff;
        closest_frame = frame_buffer[i];
      }
    }

    if (closest_frame) {
      // Project electrode data
      electrode_mapping.forEach(function(mapping) {
        var intensity = closest_frame.data[mapping.channel];
        if (viewer.projectElectrodeData) {
          viewer.projectElectrodeData(mapping.electrode_id, intensity, {
            update_immediately: false
          });
        }
      });

      // Batch update at end
      if (viewer.projectMultipleElectrodes && electrode_mapping.length > 0) {
        var electrode_data = electrode_mapping.map(function(mapping) {
          return {
            id: mapping.electrode_id,
            intensity: closest_frame.data[mapping.channel]
          };
        });

        viewer.projectMultipleElectrodes(electrode_data, {blend_mode: 'add'});
      }

      current_time = closest_frame.time;
    }

    // Advance frame
    current_frame_index++;

    if (current_time >= timeseries_data.duration) {
      viewer.stopTimeSeries();
    }

    // Preload ahead if needed
    if (current_frame_index % 30 === 0) {
      preloadFrames(current_time + 2); // Preload 2 seconds ahead
    }

    viewer.triggerEvent("timeseries:frame", {
      time: current_time,
      frame: current_frame_index
    });
  }

  function cacheChunk(chunk_id, array_buffer) {
    if (!db) return;

    try {
      var transaction = db.transaction(["chunks"], "readwrite");
      var store = transaction.objectStore("chunks");

      store.put({
        id: chunk_id,
        data: array_buffer,
        timestamp: Date.now()
      });
    } catch (e) {
      console.warn("Failed to cache chunk: " + e);
    }
  }

  function checkCache(chunk_id, callback) {
    if (!db) {
      callback(null);
      return;
    }

    try {
      var transaction = db.transaction(["chunks"], "readonly");
      var store = transaction.objectStore("chunks");
      var request = store.get(chunk_id);

      request.onsuccess = function() {
        if (request.result) {
          callback(request.result.data);
        } else {
          callback(null);
        }
      };

      request.onerror = function() {
        callback(null);
      };
    } catch (e) {
      callback(null);
    }
  }

};
