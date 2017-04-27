/*
  Author: Jonathan Lurie (https://github.com/jonathanlurie)
  Project: BrainBrowser https://github.com/aces/brainbrowser
  Date: September 2016
  Institution: MCIN - Neuro - McGill University
  Licence: MIT
*/

function init(){
  THREE = BrainBrowser.SurfaceViewer.THREE;
  initTemplates();

  // Box that shows the axes orientation on the left column
  axisBox = new AxisBox("axisBox");

  // enable the tooltips
  $( document ).tooltip({
    show: { effect: "fade", duration: 200 },
    tooltipClass: "jqueryTooltip",
    //position: { my: "right bottom+55", at: "right center" }
  });


  $.hbsPreload("about");
  $('#about').hbsAppend('about', {});




}


/*
  Defines Handlebars variables
*/
function initTemplates(){
  $.hbs({
    templatePath: 'templates', // folder where to find the templates
    templateExtension: 'hbs', // file extension for templates
    partialPath: 'templates', // folder where to find the partials
    partialExtension: 'partial' // file extension of the partials
  });
}


/*
  Defines the callbacks related to some events.
  Needs viewer to be ready.
*/
function definesEventCallbacks(){

  // Callback: when shift+click is performed on a shape
  shapePicker.shiftPick(function(shapeInfo){
    var shapeNameOverall = shapeInfo.object.name;
    shapeController.focusOnSlider(shapeInfo.object.name);

    // Vertex information
    pickInfo = viewer.pick();
    var x = pickInfo.point.x.toPrecision(4);
    var y = pickInfo.point.y.toPrecision(4);
    var z = pickInfo.point.z.toPrecision(4);
    $("#pick-index").html(pickInfo.index);

    var center = new THREE.Vector3(parseFloat(x),parseFloat(y),parseFloat(z));
    gridManager.centerShape(pickInfo.object.name,center);


    viewer.setPickMarker(pickInfo.point, 0.3);

    // display the label of the shape if:
    // - vertex indexing data were loaded
    // - vertex labeling data were loaded
    // - there is a match between each other
    vertexIndexingController.showVertexLabel(shapeInfo.index);
  });


  // Callback: when ctrl+click is performed on a shape
  shapePicker.ctrlPick(function(shapeInfo){
    if(gridManager){
      gridManager.centerShape(shapeInfo.object.name);
      gridManager.updateGrid();
      bbViewer.updateAxes();
    }
  });


  // ADD or SHOW an annotation when the model or an annotation is clicked.
  // This does not use the raycaster/picker from the core viewer but rather
  // a custom raycaster that allow picking the model + the annotation system.
  shapePicker.ctrlAndShiftPickModelAndAnnot(function(intersectModel, intersectAnnot){

    // SHOW an annotation
    if( (intersectAnnot && !intersectModel) ||
        (intersectAnnot  && intersectModel && intersectAnnot.distance < intersectModel.distance)
      ){

      var id = intersectAnnot.object.name;
      annotationController.focusOnAnnotationWidget(id);

    } else

    // ADD an annotation
    if((!intersectAnnot && intersectModel) ||
        (intersectAnnot  && intersectModel && intersectAnnot.distance > intersectModel.distance)){

      // when picked this way, the coords are world referenced
      var localCoord = new THREE.Vector3().copy(intersectModel.point);
      intersectModel.object.parent.worldToLocal(localCoord);

      annotationController.addAnnotation(
        [[localCoord.x, localCoord.y, localCoord.z]], // array of points (only one here)
        false, // isClosed
        null, // name
        null, // description
        null  // color
      );
    }
  });


  // Callback: when a opacity slider crosses the opacity threshold
  shapeController.setOpacityCallback(function(shapeNameOverall){
      console.log("The shape " + shapeNameOverall + " just changed its visibility status");
      gridManager.updateGrid();

      // doesnt necessary draw (in case of hidden) but addapt the size anyway
      bbViewer.updateAxes();
  });


  // updated the quaternion of the axis box,
  // using the quaternion of the graphicObjects
  bbViewer.onDragged( function(evt){
    axisBox.applyQuaternion( evt.goQuaternion );
  });


} /* END OF definesEventCallbacks() */


/*
  Defines all the callbacks of the UI, needs viewer to be ready
  (this is why it's not part of initCallbacks() )
*/
function defineUiCallbacks(){

  // to slide the right pannel
  $("#hideRight").click(function(){
    $("#rightSidebar").animate({width:'toggle'},250);
  });


  // to slide the left pannel
  $("#hideLeft").click(function(){
    $("#leftSidebar").animate({width:'toggle'},250);
  });


  // to slide the left pannel
  $("#resetview").click(function(){
    // make all the shapes visible with max opacity
    shapeController.allSlidersToMax();
    // put all the shapes back to their original position
    bbViewer.resetCenterRotation();
    // fit the grid to the original view
    gridManager.updateGrid();
    // fit the axis to the original position
    // (show if if it was show, keep it hidden if it ws hidden)
    bbViewer.updateAxes();

    // remove wireframe if it was enabled
    bbViewer.setWireframe( false );

    // reset stuff from the core, like rotation and lights
    bbViewer.resetView2();

    // restore original rotation for the axisBox
    axisBox.reset();
  });

  // to show legend table
  $("#showLegendBox").click(function(){
    $("#legendBox").toggle(!$("#legendBox").is(":visible"))
  });

  // handle the grid UI
  $("#gridToggleBt").click(function(){
    if (!$("#gridToggleBt").hasClass( "activated")) {
      $("#gridPlane").css("display","flex");
      $("#gridStep").css("display","flex");
    } else {
      $("#gridPlane").css("display","none")
      $("#gridStep").css("display","none")
    }

    gridManager.toggleGrid();
    showActivation( this );
    // Update the x,y,z button
    var grids_div = $(".grid");
    grids_div.each(function(id){
      var grid_div = grids_div[id];
      var plane    = grid_div.attributes["plane"].value;
      var grid     = gridManager.gridSystem.getObjectByName(plane);
      var isActive = grid_div.classList.contains("activated");

      if (grid.visible === true && isActive === false) {
        grid_div.classList.add("activated");
      } else if (grid.visible === false && isActive === true){
        grid_div.classList.remove("activated");
      }
    });
  });

  // grid control, works for the 3 of them
  $(".grid").click(function(){
    var plane = $(this).attr("plane");
    showActivation( this );

    if (plane === undefined) {return};

    var grid = undefined;
    grid     = gridManager.gridSystem.getObjectByName(plane);

    if (grid === undefined) {return};


    grid.visible  = this.classList.contains("activated");
    viewer.updated = true;
  });



  // the button to unload and reset everything
  $("#unloadAllBt").click(function(){
    // clearing panels
    shapeController.unloadAllShapes();

    // removing the shapes
    bbViewer.clearScreen();

    // make grid invisible
    gridManager.hideGrid();

    // restore original rotation for the axisBox
    axisBox.reset();
  });


  // to slide the left pannel
  $("#toggleWireFrameBt").click(function(){
    var isActive = parseInt( $(this).attr("active") );
    bbViewer.setWireframe( !isActive );
    $(this).attr("active", +!isActive );
    showActivation( this );
  });


  // toggle axes on the graphicObjects
  $("#axesToggleBt").click(function(){
    bbViewer.toggleAxes();
    showActivation( this );
  });


  // autorotate control, works for the 3 of them
  $(".autorotate").click(function(){
    var axis = $(this).attr("axis");
    // this axis is currently on auto rotation mode
    if(bbViewer.autorotate[axis]){
      bbViewer.autorotate[axis] = false;
    }else{
      bbViewer.autorotate[axis] = true;
    }

    showActivation( this );
  });

  // select and change the background color
  $("#bgColorMenu").change(function(e){
    var bgcolor = parseInt($(e.target).val(), 16);
    bbViewer.setClearColor(bgcolor);
  });


  // Enable the 3D stereoscopic thing
  $("#threedeeBt").click(function(){
    var isActive = parseInt( $(this).attr("active") );

    if(isActive){
      bbViewer.setEffect("None");
      console.log("AnaglyphEffect: OFF");
    }else{
      bbViewer.setEffect("AnaglyphEffect");
      console.log("AnaglyphEffect: ON");
    }

    $(this).attr("active", +!isActive );
    showActivation( this );
  });


  // save the content of the canvas.
  // We are using  github.com/eligrey/FileSaver.js for that
  $("#saveCaptureBt").click(function(){
    $("#brainbrowser canvas")[0].toBlob(function(blob) {
      saveAs(blob, "brainbrowser_capture.png");
    });
  });

  $("#intensityFormatSelector").change(function(e){
    if ($(e.target).val() === "unknown") {
      $("#reloadIntensity").addClass("disabled");
    } else {
      $("#reloadIntensity").removeClass("disabled");
    }
  });


  // the help / about button
  $("#aboutBt").click(function(){
    $("#about").fadeIn();
  });

  $("#closeAboutBt").click(function(){
    $("#about").fadeOut();
  });

  // Back to top button
  $("#backToTop").click(function(){
    $("#shape_0").scrollintoview();
    $("#backToTop").fadeIn();
  });

  // * * * TEST BUTTON 1 * * *
  $("#testButton1").click(function(){
    annotationController.addAnnotation(
      [
        [0, 0, 0],
        [0, 10, 0],
        [10, 10, 0],
        [10, -10, 0],
        [-10, -10, 0],
        [-10, 20, 0],
        [20, 20, 0],
        [20, -10, 0],

      ], // array of points (only one here)
      true, // isClosed
      "the spirale", // name
      "this spiral is just a test", // description
      "55FF66"  // color
    );

  });


  // * * * TEST BUTTON 2 * * *
  $("#testButton2").click(function(){
    console.log("TEST BUTTON 2");

    bbViewer.loadIntensityDataFromURL("models/atlas-values.txt", {
      complete: function(){
        console.log("DONE loadIntensityDataFromURL()");
      }
    });
  });


} /* END OF defineUiCallbacks() */


// just add some arker blue background to a button when clicked,
// and removes it when clicked again
function showActivation(jqElem){
  if( $(jqElem).hasClass("activated") ){
    $(jqElem).removeClass("activated");
  }else {
    $(jqElem).addClass("activated");
  }
}
