// the shapePanel is the tabbed panel that shows
// all the shapes with opacity slider.
var shapePanel = null;


$(function() {
  // init hbs and preload templates
  initTemplates();

  // init the ShapePanel
  shapePanel = new ShapePanel();

  // callback for each slider
  shapePanel.setSliderCallback(function(fileID, shapeID, shapeIdOverall, value){
    console.log(arguments);
  });



  $("#hideRight").click(function(){
    //$("#rightSidebar").fadeOut();
    $("#rightSidebar").animate({width:'toggle'},250);
  });

  $("#hideLeft").click(function(){
    //$("#leftSidebar").slideToggle("fast");
    $("#leftSidebar").animate({width:'toggle'},250);
  });





  $( "#loadedFilesTabs" ).tabs();



  $("#testButton1").click(function(){
    shapePanel.loadFile("theFile", "theFile.json");
  });


  $("#testButton2").click(function(){
    shapePanel.loadFile("theFile2", "theFile2.json");
  });





  var availableTags = [
    "ActionScript",
    "AppleScript",
    "Asp",
    "BASIC",
    "C",
    "C++",
    "Clojure",
    "COBOL",
    "ColdFusion",
    "Erlang",
    "Fortran",
    "Groovy",
    "Haskell",
    "Java",
    "JavaScript",
    "Lisp",
    "Perl",
    "PHP",
    "Python",
    "Ruby",
    "Scala",
    "Scheme"
  ];


  $( "#tags" ).autocomplete({
    source: availableTags
  });

});



function initTemplates(){
  $.hbs({
    templatePath: 'templates', // folder where to find the templates
    templateExtension: 'hbs', // file extension for templates
    partialPath: 'templates', // folder where to find the partials
    partialExtension: 'partial' // file extension of the partials
  });
}
