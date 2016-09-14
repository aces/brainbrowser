// the shapeController is the tabbed panel that shows
// all the shapes with opacity slider.
var THREE = null;
var shapeController = null;
var modelCollection = null;
var shapePicker = null;

// keep a track of what shape is named how and from what file it comes.
var shapeIndexer = new ShapeIndexer();

//
var gridManager = null;

// pointer on viewer for when it gets loaded
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
    gridManager = new GridManager(viewer);

    // init all the callbacks related to ui
    defineUiCallbacks();



    // when a model is loaded...
    viewer.addEventListener("displaymodel", function(event) {
      var filename = document.getElementById("modelOpener").value;
      filename = filename.replace(/^.*\\/, ""); // replace everything before the last \ to prevent fakepath

      // add all the opacity sliders for this fils/model
      // (possible a large number of shapes)
      shapeController.loadFile(event, filename);

      // adapt the grid to all the shapes (old and this newly loaded)
      gridManager.updateGrid();
    });


  });

});
