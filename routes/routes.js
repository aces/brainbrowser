"use strict";

/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index');
};

exports.about = function(req, res){
  res.render('about');
};

exports.credits = function(req, res){
  res.render('credits');
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


