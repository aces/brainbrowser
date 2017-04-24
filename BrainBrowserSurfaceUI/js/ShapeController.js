/*
  Author: Jonathan Lurie (https://github.com/jonathanlurie)
  Project: BrainBrowser https://github.com/aces/brainbrowser
  Date: September 2016
  Institution: MCIN - Neuro - McGill University
  Licence: MIT
*/

var ShapeController = function(BrainBrowserViewer){
  "use strict";
  // preload some widgets
  $.hbsPreload("opacityWidget");
  $.hbsPreload("shapeTab");
  $.hbsPreload("tabName");
  console.log("hbs templates preloaded.");

  this.fileCounter = 0;
  this.shapeCounter = 0;

  // keep a track of what shape is named how and from what file it comes.
  this.shapeIndexer = new ShapeIndexer();
  this.initShapeSearchField();
  this.viewer = BrainBrowserViewer;
  this.opacityThreshold = 0.15;
  this.opacityCallback = null; // happens when a cursor crosses the opacity threshold
  this.blockOpacityCallback = false; // when toggling all, we dont want to lanch the callbac n times!

  this.hiddenUI = false;

  $( "#loadedFilesTabs" ).tabs();
};

(function() {
  "use strict";
  /*
    Initialize the shape search field and its callback when an element is selected
  */
  ShapeController.prototype.initShapeSearchField = function(){
    var that = this;

    $('#shapeSearchField').autocomplete();

    $("#shapeSearchField").on("keyup", function(e){
      if(e.which === 13){
        var vertexValue = $(this).val();
        if (/^\d+$/.test(vertexValue) === false) { return; }
        var modelName  = $('#tabNames li.ui-state-active')[0].getAttribute('name');
        var pickInfo   = viewer.pickByVertex(vertexValue, {model_name: modelName});

        // Focus on shape
        var shapeNameOverall = pickInfo.object.name;
        if (that.shapeIndexer.hasShape(shapeNameOverall) === false){ return; }
        that.focusOnSlider(shapeNameOverall);
        // Vertex information
        $("#pick-name").html(shapeNameOverall);
        $("#pick-x").html(pickInfo.point.x.toPrecision(4));
        $("#pick-y").html(pickInfo.point.y.toPrecision(4));
        $("#pick-z").html(pickInfo.point.z.toPrecision(4));
        $("#pick-index").html(pickInfo.index);

        viewer.setPickMarker(pickInfo.point, 0.3);
      }
    });

    // Set focus on the opacity widget related to the field just clicked
    $('#shapeSearchField').autocomplete({
      select: function( event, ui ) {
        var shapeNameOverall = ui.item.value;

        if(that.shapeIndexer.hasShape(shapeNameOverall)){
          that.focusOnSlider(shapeNameOverall);
        }

      }
    });
  };


  /*
    The opacity callback is called anytime the slider cursor crosses
    the _this.opacityThreshold_ (or jumps over it).

    The callback must have one argument:
    cb args:
      shapeNameOverall: string - unique name of the shape
  */
  ShapeController.prototype.setOpacityCallback = function(cb){
    this.opacityCallback = cb;
  };


  /*
    Defines the opacity threshold. Must be in [0, 1]
  */
  ShapeController.prototype.setOpacityThreshold = function(t){
    this.opacityThreshold = t;
  };

  /*
    Loads the UI components related to a new file
  */
  ShapeController.prototype.loadFile = function(loadEvent, filename){

    var that = this;

    // adding the tab button
    $('#tabNames').hbsAppend('tabName', {
      fileID: this.fileCounter,
      fileName: filename,
      modelName: loadEvent.model_data.name || "",
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
    this.initToggleCallbacks();

    if(! $("#rightSidebar").is(":visible") && !this.hiddenUI){
      $("#rightSidebar").fadeIn();
    }

    this.fileCounter ++;
  };


  /*
    Add a new file and all its shapes
  */
  ShapeController.prototype.appendFileShapesToTab = function(loadEvent){
    var that = this;

    // for each shape of this model
    loadEvent.model_data.shapes.forEach(function(shape, index){

      // Retrive the shape name, or use a default one
      var shapeName = shape.name;
      if(typeof shapeName === 'undefined')
        shapeName = "shape " + index;

      // use the color of the shape as the slider background (when color is defined)
      var color = {};
      if(typeof shape.color === 'undefined'){
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
        var previousValue = $(this).find(".slider").attr("previousValue");
        var shapeNameOverall = $(this).attr("shapeNameOverall");

        // asking the viewer to actually change the opacity for this shape
        that.viewer.setTransparency(value, {
          shape_name: shapeNameOverall
        });

        var crossedThreshold = ((previousValue - that.opacityThreshold) * (value - that.opacityThreshold)) < 0;

        // the slider just crossed the threshold
        if((crossedThreshold || value === that.opacityThreshold ) && !that.blockOpacityCallback ){
          that.opacityCallback(shapeNameOverall);
        }

        // storing the previous value to
        $(this).find(".slider").attr("previousValue", value);
      });

      // sometimes it keeps blinking (I guess it's a bug), we just need to
      // mouse over the element to make it.
      $("#shape_" + that.shapeCounter).on("mouseover", function() {
        $(this).removeClass("blink_me");
      });

      // add the shape to the indexer
      that.shapeIndexer.addShape(that.fileCounter, that.shapeCounter, shapeName, shapeNameOverall);

      that.viewer.model.children[that.shapeCounter].name = shapeNameOverall;
      shape.name = shapeNameOverall;

      that.shapeCounter ++;
    });

    this.updateSearchFieldIndex();
  };


  /*
    Update the
  */
  ShapeController.prototype.updateSearchFieldIndex = function(){
    $('#shapeSearchField').autocomplete("option", { source: this.shapeIndexer.getKeys() });
  };


  /*
    Return the number of tabs displayed
  */
  ShapeController.prototype.getNumberOfTabs = function(){
    return $('#loadedFilesTabs >ul >li').length;
  };


  /*
    Adds a callback for the toggle buttons
  */
  ShapeController.prototype.initToggleCallbacks = function(){
    var that = this;

    // toggle allshapes callback
    $("#model_" + this.fileCounter + " .toggleAllShapes").click(function(){
      // prevent the opacity callback to be called for all shapes!
      that.blockOpacityCallback = true;

      $(this).closest(".modelPanel").children().each(function(){
        $(this).find(".toggleShape").trigger("click");
      });

      that.blockOpacityCallback = false;
      // call the opacity callback once for all
      that.opacityCallback("ALL");
    });


    // show all shapes callback
    $("#model_" + this.fileCounter + " .showAllShapes").click(function(){
      // prevent the opacity callback to be called for all shapes!
      that.blockOpacityCallback = true;

      $(this).closest(".modelPanel").children().each(function(){
        var visibilityButton = $(this).find(".toggleShape");
        if( parseInt($(visibilityButton).attr("visible"),10) === 0 ){
          $(this).find(".toggleShape").trigger("click");
        }
      });

      that.blockOpacityCallback = false;
      // call the opacity callback once for all
      that.opacityCallback("ALL");
    });


    // hide all shapes callback
    $("#model_" + this.fileCounter + " .hideAllShapes").click(function(){
      // prevent the opacity callback to be called for all shapes!
      that.blockOpacityCallback = true;

      $(this).closest(".modelPanel").children().each(function(){
        var visibilityButton = $(this).find(".toggleShape");
        if( parseInt($(visibilityButton).attr("visible"),10) === 1 ){
          $(this).find(".toggleShape").trigger("click");
        }
      });

      that.blockOpacityCallback = false;
      // call the opacity callback once for all
      that.opacityCallback("ALL");
    });


    // eye icon button callback
    $("#model_" + this.fileCounter + " .toggleShape").click(function(){
      that.toggleShape(this);
    });
  };


  /*
    The callback of the eyed icon.
  */
  ShapeController.prototype.toggleShape = function(toggleShapeButton){
    //$("#leftSidebar").slideToggle("fast");
    var slider  = $(toggleShapeButton).siblings().find(".slider");
    var eyeicon = $(toggleShapeButton).find(".eyeicon");
    var sliderCurrentValue = $(slider).val();

    // we want to switch off
    if(parseInt($(toggleShapeButton).attr("visible"),10) === 1){
      // saving the value
      $(slider).attr("backupValue", sliderCurrentValue);
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
      $(slider).val( $(slider).attr("backupValue") );
      $(toggleShapeButton).attr("visible", 1);
      $(eyeicon).removeClass("fa-eye-slash");
      $(eyeicon).addClass("fa-eye");
      $(eyeicon).removeClass("red");
    }

    // trigger the callback, like if the user moved the slider
    $(slider).trigger("change");
  };


  /*
    Given the shape unique name, put the focus on the opacityWidget,
    also scroll if necessary.
  */
  ShapeController.prototype.focusOnSlider = function(shapeNameOverall){

    if(this.shapeIndexer.hasShape(shapeNameOverall)){

      var shapeOverallIndex = this.shapeIndexer.getShapeOverallIndex(shapeNameOverall);
      var shapeFileIndex    = this.shapeIndexer.getShapeFileIndex(shapeNameOverall);

      var opacityWidgetID   = "shape_"     + shapeOverallIndex;
      var panelID           = "linkModel_" + shapeFileIndex;

      $("#" + panelID).trigger("click");

      // make it blink for 2sec
      $("#" + opacityWidgetID).addClass("blink_me");
      $("#" + opacityWidgetID).scrollintoview();

      setTimeout(function(){
        $("#" + opacityWidgetID).removeClass("blink_me");
      }, 2500);

    }
  };


  /*
    Clear the shapes, the related content (logic and graphic) and
    reset the datstructures and counters.
  */
  ShapeController.prototype.unloadAllShapes = function(){
    $("#rightSidebar").fadeOut();

    // Remove all the tab buttons
    $("#tabNames").empty();

    // remove the tab panels
    $("#loadedFilesTabs").children().not("#tabNames").remove();

    // reseting the counters
    this.fileCounter = 0;
    this.shapeCounter = 0;

    // clearing the shape indexer
    this.shapeIndexer.clearIndex();

  };


  /*
    make all the shapes visible
  */
  ShapeController.prototype.allSlidersToMax = function(){
    for(var shapeIndex = 0; shapeIndex < this.shapeCounter; shapeIndex++){
      //$("#shape_" + shapeIndex).find(".slider").val(0.5);
      var slider = $("#shape_" + shapeIndex).find(".slider");
      $(slider).val(1);
      $(slider).trigger("change");

      var toggleShapeBt = $("#shape_" + shapeIndex).find(".toggleShape");
      if( $(toggleShapeBt).attr("visible") === "0" ){
        $(toggleShapeBt).trigger("click");
      }

    }
  };


  /*
    If the URL contains a "hideUI" argument, this should be dispatched here.
    if true, prevent the right panel to show when the shapes are loaded (async context)
  */
  ShapeController.prototype.shouldHideUI = function(hide){
    this.hiddenUI = hide;
  };
})();
