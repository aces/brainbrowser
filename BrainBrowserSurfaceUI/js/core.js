/*
  Author: Jonathan Lurie (https://github.com/jonathanlurie)
  Project: BrainBrowser https://github.com/aces/brainbrowser
  Date: September 2016
  Institution: MCIN - Neuro - McGill University
  Licence: MIT
*/

// the shapeController is the tabbed panel that shows
// all the shapes with opacity slider.
var shapeController = null;
var modelLoader = null;
var shapePicker = null;
var annotationController = null;

// Deals with grid display and size
var gridManager = null;

// reads the URI to
var uriParamController = null;

// color maps and intensity data
var vertexIndexingController = null;

// pointer on viewer for when it gets loaded
var bbViewer = null;


$(function() {
  "use strict";

  // init hbs, preload templates, build some objects that dont need viewer
  init();

  window.viewer = BrainBrowser.SurfaceViewer.start("brainbrowser", function(viewer) {
    $( "#tabsAbout" ).tabs();

    bbViewer = viewer;

    // add (the possibility to use) the 3D glass effect
    viewer.addEffect("AnaglyphEffect");

    // render, no matter we load files or not
    viewer.render();

    // deals with file loading
    modelLoader              = new ModelLoader(viewer);

    // Deals with opacity sliders
    shapeController          = new ShapeController(viewer);

    // deals with picking shapes
    shapePicker              = new ShapePicker(viewer);

    // tool to build the grids
    gridManager              = new GridManager(viewer);

    // manage all the annotation system
    annotationController     = new AnnotationController(viewer);

    vertexIndexingController = new VertexIndexingController(viewer);

    // init all the callbacks related to ui
    definesEventCallbacks();

    // init all the callbacks related to events
    defineUiCallbacks();

    // read parameters from the URL and apply them
    uriParamController = new UriParamController();
    shapeController.shouldHideUI( uriParamController.hasHiddenUI() );


    // when a model is loaded...
    viewer.addEventListener("displaymodel", function(event) {
      // make the intensity data loading available
      vertexIndexingController.enableIntensityDataLoading();

      // add all the opacity sliders for this fils/model
      // (possible a large number of shapes)
      shapeController.loadFile(event, event.filename);

      // adapt the grid to all the shapes (old and this newly loaded)
      gridManager.updateGrid();
      viewer.updateAxes();

      // load color maps and intensity data and label files that are possibly in the URL
      uriParamController.intensityAndColormapAndLabel();
    });


  });



});
