// the shapeController is the tabbed panel that shows
// all the shapes with opacity slider.
var THREE = null;
var shapeController = null;
var modelCollection = null;
var shapePicker = null;

// keep a track of what shape is named how and from what file it comes.
var shapeIndexer = new ShapeIndexer();

var gridBuilder = null;


$(function() {
  // init hbs and preload templates
  init();

  window.viewer = BrainBrowser.SurfaceViewer.start("brainbrowser", function(viewer) {
    // render, no matter we load files or not
    viewer.render();

    // deals with file loading
    modelCollection = new ModelCollection(viewer);

    // Deals with opacity sliders
    shapeController = new ShapeController(viewer);
    shapeController.setShapeIndexer( shapeIndexer );

    // deals with picking shapes
    shapePicker = new ShapePicker(viewer);

    // tool to build the grids
    gridBuilder = new GridBuilder(viewer);

    // init all the callbacks related to ui
    defineUiCallbacks();

    // when a model is loaded...
    viewer.addEventListener("displaymodel", function(event) {
      console.log(viewer.model);

      var filename = document.getElementById("modelOpener").value;

      // add all the opacity sliders for this fils/model
      // (possible a large number of shapes)
      shapeController.loadFile(event, filename);

      gridBuilder.updateBoundingBox();
      gridBuilder.setGridCenterAuto();
      gridBuilder.defineGridSizeAuto();
    });

  });



});




function defineUiCallbacks(){

  /*
    Callback: when shift+click is performed on a shape
  */
  shapePicker.shiftPick(function(shapeInfo){
    var shapeNameOverall = shapeInfo.object.name;

    //console.log(viewer.model);
    //console.log(viewer.model.children[0].geometry.boundingBox);

    shapeController.focusOnSlider(shapeInfo.object.name);
  });


  /*
    Callback: when a opacity slider crosses the opacity threshold
  */
  shapeController.setOpacityCallback(function(shapeNameOverall){
      console.log("The shape " + shapeNameOverall + " just changed its visibility status");
      //gridBuilder.updateBoundingBox();

      gridBuilder.updateBoundingBox();
      gridBuilder.setGridCenterAuto();
      gridBuilder.defineGridSizeAuto();
  });






  // to slide the left pannel
  $("#testButton1").click(function(){

  });

}