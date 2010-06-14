jQuery.noConflict();
//Some quick utilities (should be move to a special js file)
Array.prototype.min = function(array) {
  return Math.min.apply(Math, this);
};
Array.prototype.max = function(array) {
  return Math.max.apply(Math, this);
};
var g_spectrum;

//for Picking
var g_debugLineGroup;
var g_debugLine;
var g_selectedInfo = null;
var g_treeInfo;  // information about the transform graph.
var g_pickInfoElem;
var g_flashTimer = 0;
var g_highlightMaterial;
var g_highlightShape;
var g_vertex;
var g_positionVector;
var g_primitiveIndex;
var g_dataArray;
var g_data_max; //Max of data
var g_data_min; //Min of data
var g_range_max; //Max of range bar
var g_range_min; //Min of range bar

//For the prelaoding of the model

var dataSet = new Dataset();

var brainbrowser;

//from picking example
function updateInfo() {
  if (!g_treeInfo) {
    g_treeInfo = o3djs.picking.createTransformInfo(brainbrowser.client.root,				   null);
  }
  g_treeInfo.update();
}


function unSelectAll() {

  if (g_selectedInfo) {


    g_highlightShape = null;
    g_selectedInfo = null;
      }
  }

function select(pickInfo) {

  unSelectAll();
  if (pickInfo) {

    g_selectedInfo = pickInfo;

  }
}

function valueAtPoint(e) {
  if(!g_vertex) {
    return;
  }
var worldRay = o3djs.picking.clientPositionToWorldRay(
    e.x,
    e.y,
    brainbrowser.viewInfo.drawContext,
    brainbrowser.client.width,
    brainbrowser.client.height);


  // Update the entire tree in case anything moved.
  // NOTE: This function is very SLOW!
  // If you really want to use picking you should manually update only those
  // transforms and shapes that moved, were added, or deleted by writing your
  // own picking library. You should also make sure that you are only
  // considering things that are pickable. By that I mean if you have a scene of
  // a meadow with trees, grass, bushes, and animals and the only thing the user
  // can pick is the animals then put the animals on their own sub branch of the
  // transform graph and only pick against that subgraph.
  // Even better, make a separate transform graph with only cubes on it to
  // represent the animals and use that instead of the actual animals.
  g_treeInfo.update();

  var pickInfo = g_treeInfo.pick(worldRay);
  if (pickInfo) {

    select(pickInfo);

    var primitiveIndex = pickInfo.rayIntersectionInfo.primitiveIndex;
    g_primitiveIndex = primitiveIndex;
    var positionVector = pickInfo.rayIntersectionInfo.position;
    g_positionVector = positionVector;
    var element = pickInfo.element;


    var vertex = brainbrowser.model_data.get_vertex(primitiveIndex,positionVector);
    var value = g_dataArray[vertex];
    jQuery("#value").html("Value at vertex "+ vertex + ": " + value);


  } else {

	//g_debugLine.setVisible(false);
	jQuery("#value").html('--nothing--');
      }


}


//Picking a vertex
function pickClick(e) {
  var worldRay = o3djs.picking.clientPositionToWorldRay(
    e.x,
    e.y,
    brainbrowser.viewInfo.drawContext,
    brainbrowser.client.width,
    brainbrowser.client.height);
  unSelectAll();

    // Update the entire tree in case anything moved.
  // NOTE: This function is very SLOW!
  // If you really want to use picking you should manually update only those
  // transforms and shapes that moved, were added, or deleted by writing your
  // own picking library. You should also make sure that you are only
  // considering things that are pickable. By that I mean if you have a scene of
  // a meadow with trees, grass, bushes, and animals and the only thing the user
  // can pick is the animals then put the animals on their own sub branch of the
  // transform graph and only pick against that subgraph.
  // Even better, make a separate transform graph with only cubes on it to
  // represent the animals and use that instead of the actual animals.
  g_treeInfo.update();

  var pickInfo = g_treeInfo.pick(worldRay);
  if (pickInfo) {

    select(pickInfo);

    var primitiveIndex = pickInfo.rayIntersectionInfo.primitiveIndex;
    g_primitiveIndex = primitiveIndex;
    var positionVector = pickInfo.rayIntersectionInfo.position;
    g_positionVector = positionVector;
    var element = pickInfo.element;





    jQuery(g_pickInfoElem).html("LOADING MAP................");
    g_vertex = brainbrowser.model_data.get_vertex(primitiveIndex,positionVector);
    update_map();

  } else {

	//g_debugLine.setVisible(false);
	jQuery(g_pickInfoElem).html('--nothing--');
      }


}



/**
 *  This method generates the color map using the spectrum
 *
 */
function generate_colors(values,min,max) {

  var colorArray = new Array();

  //calculate a slice of the data per color
  var increment = ((max-min)+(max-min)/g_spectrum.length)/g_spectrum.length;
  //for each value, assign a color
  for(var i=0; i<values.length; i++) {
    if(values[i]<= min ) {
      var color_index = 0;
    }else if(values[i]> max){
      var color_index = g_spectrum.length-1;
    }else {
      var color_index = parseInt((values[i]-min)/increment);
    }
    //This inserts the RGBA values (R,G,B,A) independently
    colorArray.push.apply(colorArray,g_spectrum[color_index]);
  }
  update_range(min,max);
  return colorArray;
}


/**
 * This method applies the colors to the model
 */
function update_colors(colorArray) {
    var colorBuffer = brainbrowser.pack.createObject('VertexBuffer');
    var colorField = colorBuffer.createField('FloatField', 4);
    colorBuffer.set(colorArray);
    colorArray = [];
    var brainShape = brainbrowser.brainTransform.shapes[0];
    var streamBank = brainShape.elements[0].streamBank;
    streamBank.setVertexStream(
      brainbrowser.o3d.Stream.COLOR, //  This stream stores vertex positions
      0,                     // First (and only) position stream
      colorField,        // field: the field this stream uses.
      0);                    // start_index:
    brainbrowser.client.render();

}

function get_data_controls() {
  var data_type = jQuery("#data-type").val(); //CT,AREA or Volume
  var data_sk = jQuery("#data-sk").val(); //Smoothing Kernel
  var data_modality = jQuery("#data-modality").val();

  return {modality: data_type, sk: data_sk, statistic: data_modality };
}

function update_color_map(min,max) {
  var colors = generate_colors(g_dataArray,min,max);
  if(colors != -1) {
    update_colors(colors);
  }
}

function update_model(dataset) {
  g_dataArray = dataset.data;
  g_data_min = dataset.min;
  g_data_max = dataset.max;
  update_color_map(g_data_min,g_data_max);
}

function update_map() {
  dataSet.get_data(g_vertex,get_data_controls(),update_model);
  jQuery(g_pickInfoElem).html("Viewing data for vertex: " + g_vertex  );
}

function update_range(min,max) {
  jQuery("#data-range-min").val(min);
  jQuery("#data-range-max").val(max);
  update_scale(min,max);
}

function update_scale(min,max) {
}
function range_change() {
  var min=parseFloat(jQuery("#data-range-min").val());
  var max=parseFloat(jQuery("#data-range-max").val());
  update_color_map(min,max);
}


function data_control_change() {
  if(g_vertex) {
    update_map();
  }
}
function parse_spectrum(data) {
  data = data.replace(/\s+$/, '');
  data = data.replace(/^\s+/, '');
  var tmp = data.split(/\n/);
  var colors = new Array();
  for(var i=0;i<tmp.length;  i++) {
    var tmp_color = tmp[i].split(/\s+/);
    for(var k=0; k<3; k++) {
      tmp_color[k]=parseFloat(tmp_color[k]);
    }
    tmp_color.push(1.0000);
    colors.push(tmp_color);
  }



  return colors;
}

function set_spectrum(type) {
  		     //get the spectrum of colors
		     jQuery.ajax({
		       type: 'GET',
		       url: '/assets/gaolang_spectrum.txt',
		       dataType: 'text',
		       success: function (data) {
			 var colors = parse_spectrum(data);
			 update_spectrum(colors);
		       },
		       data: {spectrum: type}
		       });
}


function update_spectrum(colors) {
  var spectrum = jQuery("#spectrum");
  spectrum.html('');
  for(var i=0;i<colors.length;i++) {
    var color = jQuery("<div></div>");
    var rgb="rgb("+parseInt(parseFloat(colors[i][0])*255)+','+parseInt(parseFloat(colors[i][1])*255)+','+parseInt(parseFloat(colors[i][2])*255)+')';
    color.css("background",rgb);
    color.css("width" , parseInt(256/colors.length) + "px");
    color.appendTo(spectrum);
  }
  g_spectrum =  colors;

}

function afterInit(){
    updateInfo();
    g_treeInfo.dump('');
    jQuery('#fillmode').toggle(brainbrowser.set_fill_mode_wireframe,brainbrowser.set_fill_mode_solid);
}


jQuery(function () {
  g_pickInfoElem = jQuery("#vertex_info");


  jQuery('.button').button();
  jQuery('.range_slider').slider({
    range: true,
    min: -10,
    max: 10,
    values: [-5,5],
    step: .10
  });
  jQuery('#range_change').click(range_change);
  jQuery('.data_controls').change(data_control_change);
  jQuery("#spectrum").html("loading spectrum...");
  set_spectrum('gaolang');
  brainbrowser = new BrainBrowser('/models/surf_reg_model_both.obj');


  window.onunload =  brainbrowser.uninit;
  window.document.onkeypress = brainbrowser.keyPressedCallback;
});


