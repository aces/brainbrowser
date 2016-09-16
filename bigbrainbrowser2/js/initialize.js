function init(){
  THREE = BrainBrowser.SurfaceViewer.THREE;

  initTemplates();

  initCallbacks();

}

/*
  Initialize some callbacks
*/
function initCallbacks(){

  // to slide the right pannel
  $("#hideRight").click(function(){
    $("#rightSidebar").animate({width:'toggle'},250);
  });


  // to slide the left pannel
  $("#hideLeft").click(function(){
    $("#leftSidebar").animate({width:'toggle'},250);
  });


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
  Defines all the callbacks of the UI, needs viewer to be ready
  (this is why it's not part of initCallbacks() )
*/
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

    if(gridManager){
      gridManager.centerShape(shapeInfo.object.name);
      gridManager.updateGrid();
      bbViewer.updateAxes();
    }
  });


  /*
    Callback: when a opacity slider crosses the opacity threshold
  */
  shapeController.setOpacityCallback(function(shapeNameOverall){
      console.log("The shape " + shapeNameOverall + " just changed its visibility status");
      gridManager.updateGrid();

      // doesnt necessary draw (in case of hidden) but addapt the size anyway
      bbViewer.updateAxes();
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

    // reset stuff fromthe core, like rotation and lights
    bbViewer.resetView2();

    // restore original rotation for the axisBox
    axisBox.reset();
  });


  // to slide the left pannel
  $("#gridToggleBt").click(function(){
    gridManager.toggleGrid();
  });


  // the button to unload and reset everything
  $("#unloadAllBt").click(function(){
    // clearing panels
    shapeController.unloadAllShapes();

    // clearing the shape indexer
    shapeIndexer.clearIndex();

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
  });


  // toggle axes on the graphicObjects
  $("#axesToggleBt").click(function(){
    bbViewer.toggleAxes();
  });


  // updated the quaternion of the axis box, using the quaternion of the graphicObjects
  bbViewer.onDragged( function(evt){
    axisBox.applyQuaternion( evt.goQuaternion );
  });



  // * * * TEST BUTTON * * *
  $("#testButton1").click(function(){
    console.log("THIS IS THE TEST BUTTON");

  });
}
