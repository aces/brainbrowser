/*
  Author: Jonathan Lurie (https://github.com/jonathanlurie)
  Project: BrainBrowser https://github.com/aces/brainbrowser
  Date: September 2016
  Institution: MCIN - Neuro - McGill University
  Licence: MIT

  ColorMapController deals with adding colors to shapes using a color map and
  intensity data.
*/

var ColorMapController = function(BrainBrowserViewer){
  $.hbsPreload("colorMapSelector");

  this.intensityData = null;

  this.labelData = {};

  // to access shapes and all
  this.viewer = BrainBrowserViewer;

  this.updateSelectorFromConfig();
  this.initSlider();
  this.registerViewerEvents();
  this.registerUIEvents();


}


ColorMapController.prototype.initSlider = function(){
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

}



/*
  Dynamically updates the color map selector from the global BrainBrowser config
  (from js/config.js)
*/
ColorMapController.prototype.updateSelectorFromConfig = function(){
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


}


/*
  Initialize the callbacks responding to viewer event related to color maps
  and intensity data.
*/
ColorMapController.prototype.registerViewerEvents = function(){
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

  this.viewer.addEventListener("updatecolors", function(event) {
    //console.log("event: updatecolors");
    that.updateSpectrumCanvas();
  });

  this.viewer.addEventListener("updateintensitydata", function(event) {
    //console.log("event: updateintensitydata");
  });

}


/*
  So that it's accessible from the outside,
  for exemple by the UriParamController.
*/
ColorMapController.prototype.loadIntensityDataFromURL = function(url){
  this.viewer.loadIntensityDataFromURL(url);
}


/*
  So that it's accessible from the outside,
  for exemple by the UriParamController.
*/
ColorMapController.prototype.loadColorMapFromURL = function(url){
  this.viewer.loadColorMapFromURL(url);
}

/*

*/
ColorMapController.prototype.registerUIEvents = function(){
  var that = this;

  // loading a intensity value map file
  $("#intensityDataOpener").change(function(){
    that.viewer.loadIntensityDataFromFile(
      this,
      {
        complete: function(){
          //console.log("intensity file loaded");
        }
      });
  });


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


  // Chnage the color map from the selector
  $("#colorMapMenu").change(function(e){
    var url = $(e.target).val();

    if(url != "0"){
      that.viewer.loadColorMapFromURL(url);
    }

  });


  // clamp interval
  $("#clampColorBt").click(function(){
    // additionnal control
    if (that.viewer.color_map) {
      var isActive = parseInt( $(this).attr("active") );
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


  // flip the colors
  $("#flipColorBt").click(function(){

    // additionnal control
    if (that.viewer.color_map) {
      var isActive = parseInt( $(this).attr("active") );
      var checkbox = $(this).find(".fa");

      that.viewer.color_map.flip = !isActive;
      that.viewer.updateColors();

      $(this).attr("active", +!isActive );
      showActivation( this );
    }
  });



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
      var file = evt.originalEvent.target.files[0];
      var reader = new FileReader();

      reader.onload = function(e) {
	      var contents = e.target.result;
        that.parseLabelData(contents);
      }
      reader.readAsText(file);
    }
  });



}


/*
  Fiils this.labelData with
*/
ColorMapController.prototype.parseLabelData = function(strData){
  var that = this;

  var lines = strData.split("\n");
  var regex = /'(.+)'\s+(\d+)/;

  lines.forEach(function(line) {
    var match = line.match(regex);
    if (match) {
      that.labelData[match[2]] = match[1];
    }
  });

}


/*
  Slider callback, for when the min or the max has changed.
*/
ColorMapController.prototype.minMaxSliderUpdated = function(min, max){
  this.updateMinMaxLabel(min, max);
  this.intensityData.range_min = min;
  this.intensityData.range_max = max;
  this.viewer.updateColors();
}


/*
  Refresh the values displayed in the label under the slider that displays
  the min and max values.
*/
ColorMapController.prototype.updateMinMaxLabel = function(min, max){
  var roundingFactor = 10000;
  var roundedMin = Math.round(min * roundingFactor) / roundingFactor;
  var roundedMax = Math.round(max * roundingFactor) / roundingFactor;

  //$("#minMaxSliderLbl").html("[ " + roundedMin + " , " + roundedMax + " ]");
  $("#minSliderLbl").val(roundedMin);
  $("#maxSliderLbl").val(roundedMax);

}



/*

*/
ColorMapController.prototype.updateSpectrumCanvas = function(){
  var canvas = this.viewer.color_map.createElement(
    this.intensityData.range_min,
    this.intensityData.range_max
  );

  canvas.id = "spectrum-canvas";
  $("#colorSpectrum").html(canvas);
}


/*

*/
ColorMapController.prototype.updateSlider = function(){
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
}


/*

*/
ColorMapController.prototype.enableUiElement = function(domId){
  $("#" + domId).removeClass("disabled");
}


/*

*/
ColorMapController.prototype.enableIntensityDataLoading = function(){
  this.enableUiElement("openIntensityDataBt");
}


/*
  Enable the UI related to
*/
ColorMapController.prototype.enableColorMapUI = function(){
  this.enableUiElement("openColorMapBt");
  this.enableUiElement("colorMapDropDown");
  this.enableUiElement("minMaxSliderLbl");
  this.enableUiElement("clampColorBt");
  this.enableUiElement("flipColorBt");
  this.enableUiElement("openLabelingDataBt");

  // the default behavior is to not clamp it
  this.viewer.color_map.clamp = false;
}


/*

*/
ColorMapController.prototype.showVertexLabel = function(vertexIndex){

  if(! this.intensityData)
    return;

  if(vertexIndex >= 0 && vertexIndex < this.intensityData.values.length){
    // vertexIndex is not the index of the vertex within THREEjs system
    // but the index from the intensity file
    var vertexIndex = this.intensityData.values[vertexIndex];

    if(vertexIndex in this.labelData){
      var label = this.labelData[vertexIndex];
      $("#shapeLabel").html('<i class="fa fa-tag" aria-hidden="true"></i> ' + label);
    }
  }

}
