/*
  Author: Jonathan Lurie (https://github.com/jonathanlurie)
  Project: BrainBrowser https://github.com/aces/brainbrowser
  Date: September 2016
  Institution: MCIN - Neuro - McGill University
  Licence: MIT

  VertexIndexingController deals with adding colors to shapes using a color map and
  intensity data.
*/

var VertexIndexingController = function(BrainBrowserViewer){
  "use strict";

  this.extensions = [
    {
      ext: [/\.txt$/],
      type: "text"
    },
    {
      ext: [/\.white(\.gz)$/,/\.pial(\.gz)$/,/\.mid(\.gz)$/,/binary/ ],
      type: "freesurferbin"
    },
    {
      ext: [/\.asc(\.gz)?$/],
      type: "freesurferasc"
    },
    {
      ext: [/\.gii(\.gz)$/],
      type: "gifti"
    }
  ];

  // callback on the open button
  this.openButton = document.getElementById("intensityDataOpener");
  this.openButton.addEventListener('change', this.newIntensityToLoad.bind(this), false);

  var that = this;

  $("#reloadIntensity").click(function(){
    var type = document.getElementById("intensityFormatSelector").value;
    that.loadIntensityFile(document.getElementById("intensityDataOpener"), type);
  });

  $.hbsPreload("colorMapSelector");

  this.intensityData = null;

  this.labelData = {};

  // to access shapes and all
  this.viewer = BrainBrowserViewer;

  this.updateSelectorFromConfig();
  this.initSlider();
  this.registerViewerEvents();
  this.registerUIEvents();
};

(function() {
  "use strict";
  /*
    Initialize the slider with default/fake values just to show it. It will be
    reinit later using this.updateSlider()
  */
  VertexIndexingController.prototype.initSlider = function(){
    var that = this;

    this.colorRangeSlider = $( "#colorRangeSlider" ).slider({
      range: true,
      min: 0,
      max: 100,
      values: [ 0, 100 ],
      slide: function( event, ui ) {
        that.minMaxSliderUpdated(ui.values[0], ui.values[1]);
      }
    });

    $(this.colorRangeSlider).slider("disable");
  };


  /*
    Dynamically updates the color map selector from the global BrainBrowser config
    (from js/config.js)
  */
  VertexIndexingController.prototype.updateSelectorFromConfig = function(){
    var configColorMaps = BrainBrowser.config.get("color_maps");

    configColorMaps.forEach(function(colorMap) {
      // adding a selector option
      $('#colorMapMenu').hbsAppend('colorMapSelector', {
        url: colorMap.url,
        name: colorMap.name
      });
    });

    // Load a color map (required for displaying intensity data).
    this.viewer.loadColorMapFromURL(configColorMaps[0].url);

    $('#colorMapMenu').hbsAppend('colorMapSelector', {
      url: "0",
      name: "- custom -"
    });
  };


  /*
    Initialize the callbacks responding to viewer event related to color maps
    and intensity data.
  */
  VertexIndexingController.prototype.registerViewerEvents = function(){
    var that = this;


    this.viewer.addEventListener("changeintensityrange", function(event) {
      //console.log("event: changeintensityrange");
      that.intensityData = event.intensity_data;
      that.updateSpectrumCanvas();
    });


    this.viewer.addEventListener("loadintensitydata", function(event) {
      //console.log("event: loadintensitydata");
      that.intensityData = event.intensity_data;
      that.updateSpectrumCanvas();
      that.updateSlider();

      // make the interaction with the color map UI possible
      that.enableColorMapUI();
    });

    this.viewer.addEventListener("updatecolors", function() {
      //console.log("event: updatecolors");
      that.updateSpectrumCanvas();
    });

    this.viewer.addEventListener("updateintensitydata", function() {
      //console.log("event: updateintensitydata");
    });
  };


  /*
    So that it's accessible from the outside,
    for exemple by the UriParamController.
  */
  VertexIndexingController.prototype.loadIntensityDataFromURL = function(url){
    this.viewer.loadIntensityDataFromURL(url);
  };


  /*
    So that it's accessible from the outside,
    for exemple by the UriParamController.
  */
  VertexIndexingController.prototype.loadColorMapFromURL = function(url){
    this.viewer.loadColorMapFromURL(url);
  };

  /*
    So that it's accessible from the outside,
    for exemple by the UriParamController.
  */
  VertexIndexingController.prototype.loadLabelDataFromURL = function(url){
    BrainBrowser.loader.loadFromURL(url, function(data) {
      vertexIndexingController.parseLabelData(data);
    });
  };

  /*
    Load a new intensity file and display it in the viewer (if compatible)
  */
  VertexIndexingController.prototype.newIntensityToLoad = function(evt){
    var that = this;
    var file = evt.target.files[0];
    var type = that.getFileType(file.name);

    // The type is known
    if(type){
      document.getElementById("intensityFormatSelector").value = type;
      document.getElementById("noteVertexFilename").innerHTML  = "";
      this.loadIntensityFile(evt.target, type);
    }else{
      document.getElementById("intensityFormatSelector").value = "unknown";
      document.getElementById("noteVertexFilename").innerHTML  = "<b>Note:</b> Select a format and load";
      this.enableUiElement("intensityDataFormat");
    }
    document.getElementById('vertexFilename').innerHTML   = "Filename: " + file.name;

  };


  /*
    Convenient wraping of the intensity-loading core function for when the file type
    is unknown.

    Args:
      fileOpenerElem: DOM element of type input  file
      type: String - the type of data we want to load
  */
  VertexIndexingController.prototype.loadIntensityFile = function(fileOpenerElem, type){
    var that = this;

    that.viewer.loadIntensityDataFromFile(
      that.openButton,
      {
      format: type,
      complete: function(){
        //console.log("intensity file loaded");
      }
    });
  };


  /*
    Register all the UI event necessary for the color maps.
  */
  VertexIndexingController.prototype.registerUIEvents = function(){
    var that = this;

    // loading a color map file
    $("#colorMapOpener").change(function(){
      $('#colorMapMenu').val("0");

      that.viewer.loadColorMapFromFile(
        this,
        {
          complete: function(){
            //console.log("color map file loaded");
          }
        });
    });


    // Change the color map from the drop down menu
    $("#colorMapMenu").change(function(e){
      var url = $(e.target).val();

      if(url !== "0"){
        that.viewer.loadColorMapFromURL(url);
      }
    });


    // clamp interval. When clamped, values over the max are taking the color of
    // the max and values under the min are taking the color of the min. When not
    // clamped, values that are out of bound are not colorized (the native model
    // color is used instead, most likely white).
    $("#clampColorBt").click(function(){
      // additionnal control
      if (that.viewer.color_map) {
        var isActive = parseInt( $(this).attr("active"), 10);
        var checkbox = $(this).find(".fa");

        if(isActive){
          $(checkbox).addClass("fa-square");
          $(checkbox).removeClass("fa-check-square");
        }else{
          $(checkbox).removeClass("fa-square");
          $(checkbox).addClass("fa-check-square");
        }

        //that.viewer.setAttribute("fix_color_range", !isActive);
        that.viewer.color_map.clamp = !isActive;

        $(this).attr("active", +!isActive );
        showActivation( this );
        that.viewer.updateColors();
      }
    });


    // flip the colors of the color map
    $("#flipColorBt").click(function(){
      // additionnal control
      if (that.viewer.color_map) {
        var isActive = parseInt( $(this).attr("active"), 10);

        that.viewer.color_map.flip = !isActive;
        that.viewer.updateColors();

        $(this).attr("active", +!isActive );
        showActivation( this );
      }
    });


    // to manually edit the min of the colormap using the text field
    $("#minSliderLbl").on("keyup", function(e){
      if(e.which === 13){
        var min = $("#minSliderLbl").val();
        var max = $("#maxSliderLbl").val();

        $(that.colorRangeSlider).slider({
          values: [min , max ]
        });

        that.minMaxSliderUpdated( parseFloat(min) , parseFloat(max) );
      }
    });


    // to manually edit the max of the colormap using the text field
    $("#maxSliderLbl").on("keyup", function(e){
      if(e.which === 13){
        var min = $("#minSliderLbl").val();
        var max = $("#maxSliderLbl").val();

        $(that.colorRangeSlider).slider({
          values: [min , max ]
        });

        that.minMaxSliderUpdated( parseFloat(min) , parseFloat(max) );
      }
    });


    // When a json file is opened, we then load its data
    $("#labelingDataOpener").change(function(evt){
      if(evt.originalEvent.target.files.length > 0){
        var file   = evt.originalEvent.target.files[0];
        var reader = new FileReader();

        reader.onload = function(e) {
          var contents = e.target.result;
          that.parseLabelData(contents);
        };
        reader.readAsText(file);
      }
    });
  }; /* END OF registerUIEvents() */


  /*
    Fills this.labelData with
  */
  VertexIndexingController.prototype.parseLabelData = function(strData){
    var that = this;

    var lines = strData.split("\n");
    var regex = /'(.+)'\s+(\d+)/;

    lines.forEach(function(line) {
      var match = line.match(regex);
      if (match) {
        that.labelData[match[2]] = match[1];
      }
    });
  };


  /*
    Slider callback, for when the min or the max has changed.
  */
  VertexIndexingController.prototype.minMaxSliderUpdated = function(min, max){
    this.updateMinMaxLabel(min, max);
    this.intensityData.range_min = min;
    this.intensityData.range_max = max;
    this.viewer.updateColors();
  };


  /*
    Refresh the values displayed in the label under the slider that displays
    the min and max values.
  */
  VertexIndexingController.prototype.updateMinMaxLabel = function(min, max){
    var roundingFactor = 10000;
    var roundedMin = Math.round(min * roundingFactor) / roundingFactor;
    var roundedMax = Math.round(max * roundingFactor) / roundingFactor;

    //$("#minMaxSliderLbl").html("[ " + roundedMin + " , " + roundedMax + " ]");
    $("#minSliderLbl").val(roundedMin);
    $("#maxSliderLbl").val(roundedMax);
  };



  /*
    Update the canva that shows the color map spectrum.
  */
  VertexIndexingController.prototype.updateSpectrumCanvas = function(){
    var canvas = this.viewer.color_map.createElement(
      this.intensityData.range_min,
      this.intensityData.range_max
    );

    canvas.id = "spectrum-canvas";
    $("#colorSpectrum").html(canvas);
  };


  /*
    Updates the slider with new min/max boundaries and compute
    a decently small step.
    NOT TO BE CONFUSED with the callback when the slider is moving!
  */
  VertexIndexingController.prototype.updateSlider = function(){
    var that = this;

    // the slider always has at leat 256 steps
    var stepSize = Math.min(
      (that.intensityData.max - that.intensityData.min ) / 256,
      0.01
    );

    $(this.colorRangeSlider).slider({
      min: that.intensityData.min,
      max: that.intensityData.max,
      values: [ that.intensityData.min, that.intensityData.max ],
      step: stepSize
    });

    $(this.colorRangeSlider).slider("enable");
    this.updateMinMaxLabel(that.intensityData.min, that.intensityData.max);
  };


  /*
    Generic method to make an element accessible (enabled).

    Args:
      domId: id of the dom element
  */
  VertexIndexingController.prototype.enableUiElement = function(domId){
    $("#" + domId).removeClass("disabled");
  };


  /*
     Make the button to load intensity data (aka. vertex indexing) accessible
  */
  VertexIndexingController.prototype.enableIntensityDataLoading = function(){
    this.enableUiElement("openIntensityDataBt");
  };


  /*
    Given the file basename, returns the type
  */
  VertexIndexingController.prototype.getFileType = function(basename){
    var type = null;
    this.extensions.forEach(function(elems){
      elems.ext.forEach(function(elem){
        if(elem.test(basename)){
          type = elems.type;
        }
      });
    });

    return type;
  };


  /*
    Enable the UI related to color maps and vertex labelling
  */
  VertexIndexingController.prototype.enableColorMapUI = function(){
    this.enableUiElement("openColorMapBt");
    this.enableUiElement("colorMapDropDown");
    this.enableUiElement("minMaxSliderLbl");
    this.enableUiElement("clampColorBt");
    this.enableUiElement("flipColorBt");
    this.enableUiElement("openLabelingDataBt");

    // the default behavior is to not clamp it
    this.viewer.color_map.clamp = false;
  };


  /*
    If the label is available (was loaded by the user) display it when
    shift+click on a shape.
  */
  VertexIndexingController.prototype.showVertexLabel = function(threeVertexIndex){
    if(! this.intensityData)
      return;

    if(threeVertexIndex >= 0 && threeVertexIndex < this.intensityData.values.length){
      // vertexIndex is not the index of the vertex within THREEjs system
      // but the index from the intensity file
      var vertexIndex = this.intensityData.values[threeVertexIndex];

      if(vertexIndex in this.labelData){
        var label = this.labelData[vertexIndex];
        $("#shapeLabel").html('<i class="fa fa-tag" aria-hidden="true"></i> ' + label);
      }
    }
  };
})();