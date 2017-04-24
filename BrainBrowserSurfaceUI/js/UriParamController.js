/*
  Author: Jonathan Lurie (https://github.com/jonathanlurie)
  Project: BrainBrowser https://github.com/aces/brainbrowser
  Date: September 2016
  Institution: MCIN - Neuro - McGill University
  Licence: MIT

  This provides the ability to load data and interact with them with only
  using parameters from the URL. Here is the list of argument and their
  compatible values:

  hideUI=1    Will hide all the UI components except the main view.
              Activated only if 1

  annotations=/local/folder/annot.json
              Loads one or multiple annotations files that have to be local to
              the web project (accessible on server). Use a coma (,) to separate
              multiples filepath.

  models=/local/models/mod1.obj
              Loads one or multiple local 3D model files. Use a coma (,) to separate
              multiples filepath.

  autorotate=x,y,z
              Can be only one or up to 3 axis to autorotate around.

  grid=1      Display the grid

  axis=1      Display the axis

  intensity=/local/folder/intensityData.txt
              Intensity data are usually simple text file with one number per
              line, over may lines (one line per vertex of the corresponding shape).
              Note: loaded only when a model is loaded.

  colorMap=/local/folder/colormap.txt
              Color maps are text file with 4 numbers per lines (r g b a) with
              space in between. There are as many line as necessary to reach The
              required level of precision. First line being the color for the
              lowest intensity and last line being the color for the highest
              level of intensity.
              Note: an Intensity file is mandatory to show colors.

  label=/local/folder/label.txt
              Label data are text file, each region mapped a number to a name area.


  IMPORTANT NOTES:
  1)  All these arguments must appear after a hash character (#). If multiple
  arguments are used, they must be separated by a ampersand cheracter (&).

  2)  When the argument is a file URL, this file should not be compressed (gz)

  Examples:
  http://localhost:5000/#models=testData/dbs.json
  http://localhost:5000/#models=testData/dbs.json,testData/surfaces.json&grid=0&axis=0&hideUI=1&autorotate=y,z&annotations=testData/annotations2.json

*/
var UriParamController = function(){
  "use strict";
  this.hiddenUI = false;

  this.hideUI();
  this.models();
  this.grid();
  this.axis();
  this.annotations();
  this.autorotate();


};

(function() {
  "use strict";
  /*
    Get the param for the url.
    Args:
      key: String - the argument key

    return the value as an array of argument. If not found, returns null.
    Note: number-string are converted to actual numbers and strings are trimed.
    Note2: args are split by a coma (,), this is why we return an array
  */
  UriParamController.prototype.getHashValue = function(key){
    var matches = location.hash.match(new RegExp(key+'=([^&]*)'));
    var result = null;

    if(matches){
      result = [];

      matches[1].split(",").forEach(function(elem){
        // we might get an emptu string but we dont want it
        if(elem.length > 0){

          // trying to cast it into float
          if(!Number.isNaN( parseFloat(elem) )){
            result.push(parseFloat(elem));
          }else{
            result.push(elem.trim());
          }
        }
      });
    }

    return result;
  };



  /*
    Hide the UI elements to leave only the main window with 3D shapes and all.
  */
  UriParamController.prototype.hideUI = function(){
    var hide = this.getHashValue("hideUI");

    if(hide){

      if(hide[0]){
        this.hiddenUI = true;
        $("#rightSidebar").hide();
        $("#leftSidebar").hide();
        $("#hideRight").hide();
        $("#hideLeft").hide();
        $(".logo").hide();
      }
    }
  };


  /*
    Check the URL to load annotations files
  */
  UriParamController.prototype.annotations = function(){
    var annotations = this.getHashValue("annotations");

    if(annotations){
      annotations.forEach(function(annot){
        annotationController.loadAnnotationFromURL(annot);
      });
    }
  };


  /*
    Loads some model files from the URL
  */
  UriParamController.prototype.models = function(){
    var models = this.getHashValue("models");

    if(models){
      models.forEach(function(model){
        //document.getElementById("modelOpener").value = model;
        $( "#modelOpener" ).attr("alternativeValue", model);
        modelLoader.newModelToLoadURL(model);
      });
    }
  };


  /*
    Activate auto rotation
  */
  UriParamController.prototype.autorotate = function(){
    var autorotate = this.getHashValue("autorotate");

    if(autorotate){
      autorotate.forEach(function(axis){
        $( ".autorotate[axis=\"" + axis + "\"]" ).trigger("click");
      });
    }
  };


  /*
    Activate grid
  */
  UriParamController.prototype.grid = function(){
    var grid = this.getHashValue("grid");

    if(grid){
      if(grid[0]){
        $( "#gridToggleBt" ).trigger("click");
      }
    }
  };


  /*
    Show the axis depending
  */
  UriParamController.prototype.axis = function(){
    var axis = this.getHashValue("axis");

    if(axis){
      if(axis[0]){
        $( "#axesToggleBt" ).trigger("click");
      }
    }
  };


  UriParamController.prototype.hasHiddenUI = function(){
    return this.hiddenUI;
  };



  /*
    Loads intensity data file and a color map file.
    We dont necessary need to specify both in argument.
  */
  UriParamController.prototype.intensityAndColormapAndLabel = function(){
    var intensity = this.getHashValue("intensity");

    if(intensity){
      vertexIndexingController.loadIntensityDataFromURL(intensity[0]);
    }


    var colorMap = this.getHashValue("colorMap");

    if(colorMap){
      vertexIndexingController.loadColorMapFromURL(colorMap[0]);
    }

    var label = this.getHashValue("label");

    if (label){
      vertexIndexingController.loadLabelDataFromURL(label[0]);
    }

  };

})();