"use strict";

var pkg = require("../package.json");

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

  res.render('surface-viewer-widget', {
    host: req.protocol + "://" + req.get("host"),
    layout: false,
    nothreejs: query.nothreejs,
    viewer_callback: query.viewer_callback,
    autostart: query.autostart,
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


