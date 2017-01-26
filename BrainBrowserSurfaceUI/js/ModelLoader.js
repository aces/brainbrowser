/*
  Author: Jonathan Lurie (https://github.com/jonathanlurie)
  Project: BrainBrowser https://github.com/aces/brainbrowser
  Date: September 2016
  Institution: MCIN - Neuro - McGill University
  Licence: MIT

  ModelLoader handles the loading of model files.
  It's a collection because we can load multiple models.
*/
var ModelLoader = function(BrainBrowserViewer){

  this.extensions = [
    {
      ext: ".json",
      type: "json"
    },
    {
      ext: ".obj",
      type: "mniobj"
    },
    {
      ext: ".asc",
      type: "freesurferasc"
    }
  ];
  // we also have wavefrontobj and unknown

  this.viewer = BrainBrowserViewer;

  // callback on the open button
  this.openButton = document.getElementById("modelOpener");
  this.openButton.addEventListener('change', this.newModelToLoad.bind(this), false);


  var that = this;

  // to slide the right pannel
  $("#reloadBt").click(function(){
    var type = document.getElementById("modelFormatSelector").value;
    that.loadModelFile(document.getElementById("modelOpener"), type);
  });


}


/*
  Load a new model file and display it in the viewer (if compatible)
*/
ModelLoader.prototype.newModelToLoad = function(evt){
  var that = this;
  var file = evt.target.files[0];
  var type = this.getFileType(file.name);

  // The type is known
  if(type){
    document.getElementById("modelFormatSelector").value = type;
    this.loadModelFile(evt.target, type);
  }else{
    document.getElementById("modelFormatSelector").value = "unknown";
  }
}


/*
  Convenient wraping of the file-loading core function for when the file type
  is unknown.

  Args:
    fileOpenerElem: DOM element of type input  file
    type: String - the type of data we want to load
*/
ModelLoader.prototype.loadModelFile = function(fileOpenerElem, type){
  var that = this;

  var filename = $(fileOpenerElem)[0].files[0].name;
  this.startOpeningFile(filename);

  this.viewer.loadModelFromFile(fileOpenerElem, {
    format: type,
    complete: function(){
      that.doneOpeningFile();
    }
  });
}


/*
  Load a new model file and display it in the viewer (if compatible)
  from a URL
*/
ModelLoader.prototype.newModelToLoadURL = function(url){
  var that = this;
  var type = this.getFileType(url);

  this.startOpeningFile(url);

  // The type is known
  if(type){
    document.getElementById("modelFormatSelector").value = type;

      this.viewer.loadModelFromURL(url, {
        format: type,
        complete: function(){
          that.doneOpeningFile();
        }
      });
  }else{
    document.getElementById("modelFormatSelector").value = "unknown";
  }

}


/*
  given the file basename, returns the type
*/
ModelLoader.prototype.getFileType = function(basename){
  var type = null;

  this.extensions.forEach(function(elem){
    if(basename.indexOf(elem.ext) != -1 ){
      type = elem.type;
    }
  });

  return type;
}


/*
  Start the spinner
*/
ModelLoader.prototype.startOpeningFile = function(filename){
  console.log("startOpeningFile " + filename + " ...");
  $("#spinner").show();
}


/*
  Stop the spinner
*/
ModelLoader.prototype.doneOpeningFile = function(){
  console.log("doneOpeningFile");
  $("#spinner").hide();
}
