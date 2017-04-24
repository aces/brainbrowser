/*
  Author: Jonathan Lurie (https://github.com/jonathanlurie)
  Project: BrainBrowser https://github.com/aces/brainbrowser
  Date: September 2016
  Institution: MCIN - Neuro - McGill University
  Licence: MIT

  ShapeIndexer keeps a track of what shape has
  - what original name, as given in the file
  - what unique name, as used in its THREE.geometry.name
  - what file index

  Using files with the same names or shapes having the same names
  is not an issue. (ie. loading multiple times the same file is ok)
*/

var ShapeIndexer = function(){
  "use strict";
  this.shapeIndex = {};
};

(function() {
  "use strict";
  /*
    Add a shape in the indexer
  */
  ShapeIndexer.prototype.addShape = function(fileIndex, overAllIndex, shapeName, shapeNameOverall){

    var shapeInfo = {
      fileIndex: fileIndex,
      shapeName: shapeName,
      shapeNameOverall: shapeNameOverall,
      overallIndex: overAllIndex
    };

    this.shapeIndex[shapeNameOverall] = shapeInfo;
  };


  /*
    Given the unique (overall) name, it returns the (overall) index
  */
  ShapeIndexer.prototype.getShapeOverallIndex = function(shapeNameOverall){
    return this.shapeIndex[shapeNameOverall].overallIndex;
  };


  /*
    Given the unique (overall) name, it returns the file index
  */
  ShapeIndexer.prototype.getShapeFileIndex = function(shapeNameOverall){
    return this.shapeIndex[shapeNameOverall].fileIndex;
  };


  /*
    delete all the shapes
  */
  ShapeIndexer.prototype.clearIndex = function(){
    this.shapeIndex = {};
  };


  /*
    return true if a shape has _shapeNameOverall_ as unique identifier.
    Returns false if not indexed.
  */
  ShapeIndexer.prototype.hasShape = function(shapeNameOverall){
    return (shapeNameOverall in this.shapeIndex);
  };


  /*
    Returns an array containing all the unique names overall.
    This is needed to reconstruct the index of the autocomplete search field.
  */
  ShapeIndexer.prototype.getKeys = function(){
    return Object.keys(this.shapeIndex);
  };
})();