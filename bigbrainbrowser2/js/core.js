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

      var filename = document.getElementById("modelOpener").value;
      filename = filename.replace(/^.*\\/, ""); // replace everything before the last \ to prevent fakepath

      // add all the opacity sliders for this fils/model
      // (possible a large number of shapes)
      shapeController.loadFile(event, filename);

      gridBuilder.updateBoundingBoxVisible();
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
    shapeController.focusOnSlider(shapeInfo.object.name);
  });


  /*
    Callback: when ctrl+click is performed on a shape
  */
  shapePicker.ctrlPick(function(shapeInfo){

    if(gridBuilder){

      //gridBuilder.updateBoundingBoxVisible();
      gridBuilder.setGridCenterShapeCenter(shapeInfo.object.name);
      //gridBuilder.setGridCenterThreeObj( shapeInfo.point );
      gridBuilder.defineGridSizeAuto();
    }
  });


  /*
    Callback: when a opacity slider crosses the opacity threshold
  */
  shapeController.setOpacityCallback(function(shapeNameOverall){
      console.log("The shape " + shapeNameOverall + " just changed its visibility status");
      //gridBuilder.updateBoundingBoxVisible();

      gridBuilder.updateBoundingBoxVisible();
      gridBuilder.setGridCenterAuto();
      gridBuilder.defineGridSizeAuto();
  });



  // to slide the left pannel
  $("#resetview").click(function(){
    bbViewer.resetView2();
  });



  // to slide the left pannel
  $("#testButton1").click(function(){

  });

}
