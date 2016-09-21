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

  Shape indexer is able to retrieve this info in constant time thanks to the use
  of and index (sorted by int) and a reverse dictionnary (sorted by unique name)

  Using files with the same names or shapes having the same names
  is not an issue. (ie. loading multiple times the same file is ok)
*/

var ShapeIndexer = function(){
  this.shapeIndex = [];
  this.reverseDictionnary = {};
}


/*
  Add a shape in the indexer
*/
ShapeIndexer.prototype.addShape = function(fileIndex, shapeName, shapeNameOverall){

  var shapeInfo = {
    fileIndex: fileIndex,
    shapeName: shapeName,
    shapeNameOverall: shapeNameOverall
  };

  // update the dictionnary
  this.shapeIndex.push(shapeInfo);
  this.reverseDictionnary[shapeNameOverall] = this.shapeIndex.length - 1;
}


/*
  Given the unique (overall) name, it returns the (overall) index
*/
ShapeIndexer.prototype.getShapeOverallIndex = function(shapeNameOverall){
  return this.reverseDictionnary[shapeNameOverall]
}


/*
  Given the unique (overall) name, it returns the file index
*/
ShapeIndexer.prototype.getShapeFileIndex = function(shapeNameOverall){
  return this.shapeIndex[ this.reverseDictionnary[shapeNameOverall] ].fileIndex;
}


/*
  delete all
*/
ShapeIndexer.prototype.clearIndex = function(){
  this.shapeIndex = [];
  this.reverseDictionnary = {};
}


/*
  return true if a shape has _shapeNameOverall_ as unique identifier.
  Returns false if not indexed.
*/
ShapeIndexer.prototype.hasShape = function(shapeNameOverall){
  return (shapeNameOverall in this.reverseDictionnary);
}


/*
  Returns an array containing all the unique names overall.
  This is needed to reconstruct the index of the autocomplete search field.
*/
ShapeIndexer.prototype.getKeys = function(){
  return Object.keys(this.reverseDictionnary);
}
