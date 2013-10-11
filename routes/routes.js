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

exports.surfview = function(req, res){
  res.render('surfview', {layout: false});
};

exports.macaccview = function(req, res){
  res.render('macaccview', {layout: false});
};

exports.braincanvas = function(req, res){
  res.render('braincanvas', {layout: false});
};


