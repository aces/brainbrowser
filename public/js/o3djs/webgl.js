/*
 * Copyright 2009, Google Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


/**
 * @fileoverview This file contains utility functions for o3d running on
 * top of webgl.  The function o3djs.webgl.makeClients replaces the
 * function o3djs.util.makeClients.
 */

o3djs.provide('o3djs.webgl');

o3djs.require('o3djs.effect');
o3djs.require('o3djs.util');


/**
 * A Module with various utilities.
 * @namespace
 */
o3djs.webgl = o3djs.webgl || {};


/**
 * Takes a javascript object containing name-value pairs of options to
 * makeClients or createClient and adds options to the default value if they
 * aren't already there setting them to the default value.
 * @param {Object} The obejct containing options.
 */
o3djs.webgl.setUndefinedOptionsToDefaults_ = function(options) {
  /**
   * Whether to install debugging functions, and selectable
   * @type {boolean}
   */
  options.debug = options.debug || false;

  /**
   * Whether to allow the canvas object created to remain selectable.
   * @type {boolean}
   */
  options.selectable = options.selectable || false;
};


/**
 * Finds all divs with an id that starts with "o3d" and inits a canvas
 * under them with o3d client object and the o3d namespace.
 * @param {!function(Array.<!Element>): void} callback Function to call when
 *     client objects have been created.
 * @param {Object} opt_options An object mapping various options to their values
 *    See comment for o3djs.webgl.setUndefinedOptionsToDefaults_ to see what
 *    options there are.
 * @param {string} opt_requiredVersion Ignored in o3d-webgl.
 * @param {!function(!o3d.Renderer.InitStatus, string, (string|undefined),
 *     (string|undefined)): void} opt_failureCallback Called with an error
 *     string if the client fails to create.
 * @param {string} opt_id The id to look for. This can be a regular
 *     expression. The default is "^o3d".
 * @param {string} opt_tag The type of tag to look for. The default is "div".
 * @see o3djs.util.informPluginFailure
 */
o3djs.webgl.makeClients = function(callback,
                                   opt_options,
                                   opt_requiredVersion,
                                   opt_failureCallback,
                                   opt_id,
                                   opt_tag) {
  opt_failureCallback = opt_failureCallback || o3djs.util.informPluginFailure;
  var options = opt_options;

  // If opt_options is a string, we assume it's coming from formerly plugin
  // code and ignore it.  If it's an object, we assume it's the name-value-pair
  // object describing the optional arguments to this function.
  if (options == undefined || typeof options == 'string') {
    options = {};
  }
  o3djs.webgl.setUndefinedOptionsToDefaults_(options);

  var clientElements = [];
  var elements = o3djs.util.getO3DContainerElements(opt_id, opt_tag);

  for (var ee = 0; ee < elements.length; ++ee) {
    var element = elements[ee];
    var objElem = o3djs.webgl.createClient(element, options, options.debug);
    if (!objElem) {
      opt_failureCallback('Failed to create o3d-webgl client object.');
      return;
    }
    clientElements.push(objElem);
  }

  // Wait for the client elements to be fully initialized. This
  // involves waiting for the page to fully layout and the initial
  // resize event to be processed.
  var clearId = window.setInterval(function() {
    for (var cc = 0; cc < clientElements.length; ++cc) {
      var element = clientElements[cc];
      if (!element.sizeInitialized_) {
        return;
      }
    }
    window.clearInterval(clearId);
    callback(clientElements);
  });
};


/**
 * Adds a wrapper object to single gl function context that checks for errors
 * before the call.
 * @param {WebGLContext} context
 * @param {string} fname The name of the function.
 * @return {}
 */
o3djs.webgl.createGLErrorWrapper = function(context, fname) {
    return function() {
        var rv = context[fname].apply(context, arguments);
        var err = context.getError();
        if (err != 0) {
            throw "GL error " + err + " in " + fname;
        }
        return rv;
    };
};


/**
 * Adds a wrapper object to a webgl context that checks for errors
 * before each function call.
 */
o3djs.webgl.addDebuggingWrapper = function(context) {
    // Thanks to Ilmari Heikkinen for the idea on how to implement this
    // so elegantly.
    var wrap = {};
    for (var i in context) {
      if (typeof context[i] == 'function') {
          wrap[i] = o3djs.webgl.createGLErrorWrapper(context, i);
      } else {
          wrap[i] = context[i];
      }
    }
    wrap.getError = function() {
        return context.getError();
    };
    return wrap;
};


/**
 * Inserts text indicating that a WebGL context could not be created under
 * the given node and links to the site about WebGL capable browsers.
 */
o3djs.webgl.webGlCanvasError = function(parentNode, unavailableElement) {
  var background = document.createElement('div');
  background.style.backgroundColor = '#ccffff';
  background.style.textAlign = 'center';
  background.style.margin = '10px';
  background.style.width = '100%';
  background.style.height = '100%';

  var messageHTML = '<br/><br/><a href="http://get.webgl.org">' +
      'Your browser does not appear to support WebGL.<br/><br/>' +
      'Check that WebGL is enabled or click here to upgrade your browser:' +
      '</a><br/>';

  background.innerHTML = messageHTML;

  parentNode.appendChild(background);
};


/**
 * Creates a canvas under the given parent element and an o3d.Client
 * under that.
 *
 * @param {!Element} element The element under which to insert the client.
 * @param {Object} opt_options A javascript object containing
 * @param {boolean} opt_debug Whether gl debugging features should be
 *     enabled.
 * @return {HTMLCanvas} The canvas element, or null if initializaton failed.
 */
o3djs.webgl.createClient = function(element, opt_options, opt_debug) {
  var options = opt_options;

  // If opt_options is a string, we assume it's coming from formerly plugin
  // code and ignore it.  If it's an object, we assume it's the name-value-pair
  // object describing the optional arguments to this function.
  if (opt_options == undefined || typeof opt_options == 'string') {
    options = {};
    options.debug = opt_debug;
  }
  o3djs.webgl.setUndefinedOptionsToDefaults_(options);

  opt_debug = opt_debug || false;

  // If we're creating a webgl client, the assumption is we're using webgl,
  // in which case the only acceptable shader language is glsl.  So, here
  // we set the shader language to glsl.
  o3djs.effect.setLanguage('glsl');

  // Make the canvas automatically resize to fill the containing
  // element (div), and initialize its size correctly.
  var canvas;
  canvas = document.createElement('canvas');

  if (!canvas || !canvas.getContext) {
    o3djs.webgl.webGlCanvasError(element, 'HTMLCanvas');
    return null;
  }

  canvas.style.width = "100%";
  canvas.style.height = "100%";

  var client = new o3d.Client;

  var resizeHandler = function() {
    var width = Math.max(1, canvas.clientWidth);
    var height = Math.max(1, canvas.clientHeight);
    canvas.width = width;
    canvas.height = height;
    canvas.sizeInitialized_ = true;
    if (client.gl) {
      client.gl.displayInfo = {width: canvas.width, height: canvas.height};
    }
  };
  window.addEventListener('resize', resizeHandler, false);
  setTimeout(resizeHandler, 0);

  if (!client.initWithCanvas(canvas)) {
    o3djs.webgl.webGlCanvasError(element, 'WebGL context');
    return null;
  }

  if (!options.selectable) {
    // This keeps the cursor from changing to an I-beam when the user clicks
    // and drags.  It's easier on the eyes.
    function returnFalse() {
      return false;
    }
    canvas.onselectstart = returnFalse;
    canvas.onmousedown = returnFalse;
  }

  canvas.client = client;
  canvas.o3d = o3d;

  if (options.debug) {
    client.gl = o3djs.webgl.addDebuggingWrapper(client.gl);
  }

  element.appendChild(canvas);
  return canvas;
};


