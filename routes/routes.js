"use strict";

var pkg = require("../package.json");
var threejs_versions = require("../threejs-versions.json");

exports.index = function(req, res) {
  res.render('index', {version: pkg.version});
};

exports.surface = function(req, res) {
  res.render('surface-viewer', {layout: false, version: pkg.version});
};

exports.macacc = function(req, res) {
  res.render('macacc-viewer', {layout: false, version: pkg.version});
};

exports.volume = function(req, res) {
  res.render('volume-viewer', {layout: false, version: pkg.version});
};

exports.fmri = function(req, res) {
  res.render('volume-viewer', {layout: false, fmri: true, version: pkg.version});
};

exports.surface_widget = function(req, res) {
  var query = req.query;
  var protocol = query.http ? "http" : "https";
  var brainbrowser = query.version ? "brainbrowser-" + query.version : "brainbrowser";

  console.log(threejs_versions);
  console.log(getThreeJsVersion(query.version || pkg.version));

  res.render('surface-viewer-widget', {
    host: protocol + "://" + req.get("host"),
    layout: false,
    brainbrowser: brainbrowser,
    threejs_version: getThreeJsVersion(query.version || pkg.version),
    nothreejs: query.nothreejs,
    viewer_callback: query.viewer_callback,
    element_id: query.element_id || "brainbrowser",
    width: query.width || 400,
    height: query.height || 400,
    model: query.model,
    format: query.format,
    intensity_data: query.intensity_data,
    color_map: query.color_map,
    zoom: query.zoom
  });
};

function getThreeJsVersion(bb_current) {
  var bb_versions = Object.keys(threejs_versions);
  var max_version;

  bb_versions.forEach(function(v) {
    if (versionCompare(max_version, v) > 0 && versionCompare(v, bb_current) >= 0) {
      max_version = v;
    }
  });

  return threejs_versions[max_version];
}

function versionCompare(v1,  v2) {
  if (!v1) return 1;
  if (!v2) return -1;

  var version1 = parseVersionString(v1);
  var version2 = parseVersionString(v2);

  if (version1[0] < version2[0]) {
    return 1;
  } else if (version1[0] > version2[0]) {
    return -1;
  } else if (version1[1] < version2[1]) {
    return 1;
  } else if (version1[1] > version2[1]) {
    return -1;
  } else if (version1[2] < version2[2]) {
    return 1;
  } else if (version1[2] > version2[2]) {
    return -1;
  } else {
    return 0;
  }
}

function parseVersionString (v) {
  var parts = v.split('.');
  parts[0] = parseInt(parts[0], 10) || 0;
  parts[1] = parseInt(parts[1], 10) || 0;
  parts[2] = parseInt(parts[2], 10) || 0;
  return parts;
}


