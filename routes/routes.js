"use strict";

exports.index = function(req, res){
  res.render('index');
};

exports.surface = function(req, res){
  res.render('surface-viewer', {layout: false});
};

exports.macacc = function(req, res){
  res.render('macacc-viewer', {layout: false});
};

exports.volume = function(req, res){
  res.render('volume-viewer', {layout: false});
};

exports.fmri = function(req, res){
  res.render('volume-viewer', {layout: false, fmri: true});
};


