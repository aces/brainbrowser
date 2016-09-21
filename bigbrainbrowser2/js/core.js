// the shapeController is the tabbed panel that shows
// all the shapes with opacity slider.
var THREE = null;
var shapeController = null;
var modelCollection = null;
var shapePicker = null;
var annotationController = null;

// keep a track of what shape is named how and from what file it comes.
var shapeIndexer = new ShapeIndexer();

// Deals with grid display and size
var gridManager = null;

// Box that shows the axes orientation on the left column
var axisBox = null;

// reads the URI to
var uriParamController = null;

// pointer on viewer for when it gets loaded
var bbViewer = null;


$(function() {

  // init hbs, preload templates, build some objects that dont need viewer
  init();

  window.viewer = BrainBrowser.SurfaceViewer.start("brainbrowser", function(viewer) {
    bbViewer = viewer;

    // add (the possibility to use) the 3D glass effect
    viewer.addEffect("AnaglyphEffect");

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

    // manage all the annotation system
    annotationController = new AnnotationController(viewer);

    uriParamController = new UriParamController();
    uriParamController.hideUi();

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
