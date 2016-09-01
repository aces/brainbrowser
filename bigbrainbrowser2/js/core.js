// the shapePanel is the tabbed panel that shows
// all the shapes with opacity slider.
var shapePanel = null;
var modelCollection = null;
var shapePicker = null;

// keep a track of what shape is named how and from what file it comes.
var shapeIndexer = new ShapeIndexer();


$(function() {
  // init hbs and preload templates
  init();



  window.viewer = BrainBrowser.SurfaceViewer.start("brainbrowser", function(viewer) {
    // render, no matter we load files or not
    viewer.render();

    // deals with file loading
    modelCollection = new ModelCollection(viewer);

    // Deals with opacity sliders
    shapePanel = new ShapePanel(viewer);
    shapePanel.setShapeIndexer( shapeIndexer );

    // deals with picking shapes
    shapePicker = new ShapePicker(viewer);


    // TODO: create a function just for declaring button callbacks (maybe)
    // defines the callback when a shift+click is performed on a shape
    shapePicker.shiftPick(function(shapeInfo){
      var shapeNameOverall = shapeInfo.object.name;

      //console.log(viewer.model);
      //console.log(viewer.model.children[0].geometry.boundingBox);

      shapePanel.focusOnSlider(shapeInfo.object.name);
    });


    // when a model is loaded...
    viewer.addEventListener("displaymodel", function(event) {

      var filename = document.getElementById("modelOpener").value;

      // add all the opacity sliders for this fils/model
      // (possible a large number of shapes)
      shapePanel.loadFile(event, filename);
    });

  });





  $("#testButton1").click(function(){
    shapePanel.focusOnSlider(108);
  });

});
