// the shapeController is the tabbed panel that shows
// all the shapes with opacity slider.
var THREE = null;
var shapeController = null;
var modelCollection = null;
var shapePicker = null;

// keep a track of what shape is named how and from what file it comes.
var shapeIndexer = new ShapeIndexer();

var gridBuilder = null;

var bbViewer = null;


$(function() {
  // init hbs and preload templates
  init();

  window.viewer = BrainBrowser.SurfaceViewer.start("brainbrowser", function(viewer) {
    bbViewer = viewer;

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



      //viewer.resetCenterRotation();
      viewer.shiftModelDataAccordingly(event.model_data);

      console.log(event.model_data);

      var filename = document.getElementById("modelOpener").value;
      filename = filename.replace(/^.*\\/, ""); // replace everything before the last \ to prevent fakepath

      // add all the opacity sliders for this fils/model
      // (possible a large number of shapes)
      shapeController.loadFile(event, filename);

      // adapt the grid to all the shapes (old and this newly loaded)
      gridBuilder.updateGrid();

    });

  });



});




function defineUiCallbacks(){

  /*
    Callback: when shift+click is performed on a shape
  */
  shapePicker.shiftPick(function(shapeInfo){
    var shapeNameOverall = shapeInfo.object.name;
    shapeController.focusOnSlider(shapeInfo.object.name);
  });


  /*
    Callback: when ctrl+click is performed on a shape
  */
  shapePicker.ctrlPick(function(shapeInfo){

    if(gridBuilder){

      console.log("SHAPE NAME:");
      console.log(shapeInfo.object.name);

      gridBuilder.centerShape(shapeInfo.object.name);
      gridBuilder.updateGrid();
    }
  });


  /*
    Callback: when a opacity slider crosses the opacity threshold
  */
  shapeController.setOpacityCallback(function(shapeNameOverall){
      console.log("The shape " + shapeNameOverall + " just changed its visibility status");
      gridBuilder.updateGrid();
  });



  // to slide the left pannel
  $("#resetview").click(function(){
    // make all the shapes visible with max opacity
    shapeController.allSlidersToMax();
    // put all the shapes back to their original position
    bbViewer.resetCenterRotation();
    // fit the grid to the original view
    gridBuilder.updateGrid();
    // reset stuff fromthe core, like rotation and lights
    bbViewer.resetView2();
  });



  // to slide the left pannel
  $("#testButton1").click(function(){
    console.log("THIS IS THE TEST BUTTON");
    shapeController.allSlidersToMax();
  });

}
