var ShapePanel = function(BrainBrowserViewer){


  // preload some widgets
  $.hbsPreload("opacityWidget");
  $.hbsPreload("shapeTab");
  $.hbsPreload("tabName");
  console.log("hbs templates preloaded.");

  this.fileCounter = 0;
  this.shapeCounter = 0;

  this.shapeIndexer = null;  // aggregated later


  this.initShapeSearchField();

  this.viewer = BrainBrowserViewer;

  this.initUnloadAllButton();

  $( "#loadedFilesTabs" ).tabs();
}


/*
  Initialize the shape search field and its callback when an element is selected
*/
ShapePanel.prototype.initShapeSearchField = function(){
  var that = this;

  $('#shapeSearchField').autocomplete();

  // Set focus on the opacity widget related to the field just clicked
  $('#shapeSearchField').autocomplete({
    select: function( event, ui ) {
      var shapeNameOverall = ui.item.value;

      if(that.shapeIndexer.hasShape(shapeNameOverall)){
        that.focusOnSlider(shapeNameOverall);
      }

    }
  });
}


/*

*/
ShapePanel.prototype.initUnloadAllButton = function(){
  var that = this;

  $("#unloadAllBt").click(function(){
    that.unloadAllShapes();
  });
}


/*
  So that we can use and complete the indexer
*/
ShapePanel.prototype.setShapeIndexer = function(si){
  this.shapeIndexer = si;
}


/*
  Loads the IU related to a new file
*/
ShapePanel.prototype.loadFile = function(loadEvent, filename){

  var that = this;

  // adding the tab button
  $('#tabNames').hbsAppend('tabName', {
    fileID: this.fileCounter,
    fileName: filename
  });

  // adding the tab basic content
  $('#loadedFilesTabs').hbsAppend('shapeTab', {
    fileID: this.fileCounter
  });


  // append all the opacity widgets
  this.appendFileShapesToTab(loadEvent);

  // refresh the tab panel
  $( "#loadedFilesTabs" ).tabs("refresh");

  // set the focus on the last thumb
  $( "#loadedFilesTabs" ).tabs({
    active: that.getNumberOfTabs() - 1
  });

  // create callbacks for the newly loaded opacity buttons
  this.updateTabCallbacks();

  // show the tab pannel
  //if(! $("#loadedFilesTabs").is(":visible") )
  //  $("#loadedFilesTabs").show();

  if(! $("#rightSidebar").is(":visible") ){
    $("#rightSidebar").fadeIn();
  }


  this.fileCounter ++;
}


/*
  Add a new file and all its shapes
*/
ShapePanel.prototype.appendFileShapesToTab = function(loadEvent){
  var that = this;

  // for each shape of this model
  loadEvent.model_data.shapes.forEach(function(shape, index){

    // Retrive the shape name, or use a default one
    var shapeName = shape.name;
    if(typeof shapeName == 'undefined')
      shapeName = "shape " + index;

    // use the color of the shape as the slider background (when color is defined)
    var color = {};
    if(typeof shape.color == 'undefined'){
      color.r = 1;
      color.g = 1;
      color.b = 1;
      color.a = 0;
    }else{
      color.r = shape.color[0];
      color.g = shape.color[1];
      color.b = shape.color[2];
      color.a = 1;
    }

    // the shapeNameOverall is unique, even if we load multiple times the same file
    //var shapeNameOverall = shapeName + " (file " + that.fileCounter + ")";
    var shapeNameOverall = shapeName + " (id " + that.shapeCounter + ")";

    // append the opacity widget for this shape
    $('#model_' + that.fileCounter).hbsAppend('opacityWidget', {
      fileID: that.fileCounter,
      shapeIndex: that.shapeCounter, // not used except for callback attribution
      shapeName: shapeName,
      shapeNameOverall: shapeNameOverall,
      red: Math.round(color.r * 255),
      green: Math.round(color.g * 255),
      blue: Math.round(color.b * 255),
      alpha: color.a
    });

    // calling the callback with necessary arguments
    $("#shape_" + that.shapeCounter).on("input change", function() {
      var value = $(this).find(".slider").val();
      var fileID = $(this).attr("fileID");
      var shapeNameOverall = $(this).attr("shapeNameOverall");

      // asking the viewer to actually change the opacity for this shape
      that.viewer.setTransparency(value / 100, {
        shape_name: shapeNameOverall
      });
    });

    // add the shape to the indexer
    that.shapeIndexer.addShape(that.fileCounter, shapeName, shapeNameOverall);

    // update the model shape name to be unique
    that.viewer.model.children[that.shapeCounter].name = shapeNameOverall;
    //that.viewer.model.children[that.shapeCounter].overallIndex = that.shapeCounter;
    //that.viewer.model.children[that.shapeCounter].fileIndex = that.fileCounter;

    that.shapeCounter ++;
  });

  this.updateSearchFieldIndex();
}





/*
  Update the
*/
ShapePanel.prototype.updateSearchFieldIndex = function(){
  console.log(this.shapeIndexer.getKeys());
  $('#shapeSearchField').autocomplete("option", { source: this.shapeIndexer.getKeys() });
}


/*
  Return the number of tabs displayed
*/
ShapePanel.prototype.getNumberOfTabs = function(){
  return $('#loadedFilesTabs >ul >li').length;
}


/*
  add callbacks to the buttons of the newly created tab pannel
*/
ShapePanel.prototype.updateTabCallbacks = function(){
  var that = this;

  // toggle allshapes callback
  $("#model_" + this.fileCounter + " .toggleAllShapes").click(function(){
    $(this).siblings().each(function(){
      $(this).find(".toggleShape").trigger("click");
    });
  });

  // eye icon button callback
  $("#model_" + this.fileCounter + " .toggleShape").click(function(){
    that.toggleShape(this);
  });
}


/*
  The callback of the eyed icon.
*/
ShapePanel.prototype.toggleShape = function(toggleShapeButton){
  //$("#leftSidebar").slideToggle("fast");
  var slider = $(toggleShapeButton).siblings().find(".slider");
  var eyeicon = $(toggleShapeButton).find(".eyeicon");
  var sliderCurrentValue = $(slider).val();

  // we want to switch off
  if($(toggleShapeButton).attr("visible") == 1){
    // saving the value
    $(slider).attr("previousValue", sliderCurrentValue);
    $(slider).val(0);
    // disabling the slider
    $(slider).prop('disabled', true);
    $(slider).addClass("disabled");
    $(toggleShapeButton).attr("visible", 0);
    $(eyeicon).removeClass("fa-eye");
    $(eyeicon).addClass("fa-eye-slash");
    $(eyeicon).addClass("red");
  }
  // we want to switch on
  else{
    $(slider).prop('disabled', false);
    $(slider).removeClass("disabled");
    $(slider).val( $(slider).attr("previousValue") );
    $(toggleShapeButton).attr("visible", 1);
    $(eyeicon).removeClass("fa-eye-slash");
    $(eyeicon).addClass("fa-eye")
    $(eyeicon).removeClass("red");
  }

  // trigger the callback, like if the user moved the slider
  $(slider).trigger("change");
}


/*
  Given the shape unique name, put the focus on the opacityWidget,
  also scroll if necessary.
*/
ShapePanel.prototype.focusOnSlider = function(shapeNameOverall){

  if(this.shapeIndexer.hasShape(shapeNameOverall)){

    var shapeOverallIndex = this.shapeIndexer.getShapeOverallIndex(shapeNameOverall);
    var shapeFileIndex = this.shapeIndexer.getShapeFileIndex(shapeNameOverall);

    var opacityWidgetID = "shape_" + shapeOverallIndex;
    var panelID = "linkModel_" + shapeFileIndex;

    $("#" + panelID).trigger("click");

    // make it blink for 2sec
    $("#" + opacityWidgetID).addClass("blink_me");
    $("#" + opacityWidgetID).scrollintoview({
      complete: function() {
        setTimeout(function(){
          $("#" + opacityWidgetID).removeClass("blink_me");
        }, 2000);
      }
    });
  }

}


/*
  Clear the shapes, the related content (logic and graphic) and
  reset the datstructures and counters.
*/
ShapePanel.prototype.unloadAllShapes = function(){
  $("#rightSidebar").fadeOut();

  // Remove all the tab buttons
  $("#tabNames").empty();

  // remove the tab panels
  $("#loadedFilesTabs").children().not("#tabNames").remove();

  // clearing the shape indexer
  this.shapeIndexer.clear();

  // reseting the counters
  this.fileCounter = 0;
  this.shapeCounter = 0;

  // removing the shapes
  this.viewer.clearScreen();

}
