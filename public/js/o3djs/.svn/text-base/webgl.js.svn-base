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

o3djs.require('o3djs.util');

/**
 * A Module with various utilities.
 * @namespace
 */
o3djs.webgl = o3djs.webgl || {};


/**
 * Finds all divs with an id that starts with "o3d" and inits a canvas
 * under them with o3d client object and the o3d namespace.
 */
o3djs.webgl.makeClients = function(callback,
                                       opt_features,
                                       opt_requiredVersion,
                                       opt_failureCallback,
                                       opt_id,
                                       opt_tag) {
  opt_failureCallback = opt_failureCallback || o3djs.webgl.informPluginFailure;

  var clientElements = [];
  var elements = o3djs.util.getO3DContainerElements(opt_id, opt_tag);

  for (var ee = 0; ee < elements.length; ++ee) {
    var element = elements[ee];
    var features = opt_features;
    if (!features) {
      var o3d_features = element.getAttribute('o3d_features');
      if (o3d_features) {
        features = o3d_features;
      } else {
        features = '';
      }
    }
    var objElem = o3djs.webgl.createClient(element, features);
    clientElements.push(objElem);
  }

  callback(clientElements);
};


/**
 * Creates a canvas under the given parent element and an o3d.Client
 * under that.
 */
o3djs.webgl.createClient = function(element, opt_features) {
  opt_features = opt_features || '';

  // TODO(petersont): Not sure what to do with the features object.
  var canvas;
  canvas = document.createElement('canvas');
  canvas.setAttribute('width', element.getAttribute('width'));
  canvas.setAttribute('height', element.getAttribute('height'));
  canvas.client = new o3d.Client;
  canvas.o3d = o3d;

  var gl;
  try {gl = canvas.getContext("experimental-webgl") } catch(e) { }
  if (!gl)
      try {gl = canvas.getContext("moz-webgl") } catch(e) { }
  if (!gl) {
      alert("No WebGL context found");
      return null;
  }

  canvas.client.gl = gl;

  element.appendChild(canvas);
  return canvas;
};


