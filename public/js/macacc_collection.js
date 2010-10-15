
var g_spectrum;

//for Picking



function MacaccObject(brainbrowser,path) {
  var that = this;
  this.brainbrowser = brainbrowser;
  this.dataSet = new Dataset(path);


  that.debugLineGroup;
  that.debugLine;
  that.selectedInfo = null;
  that.treeInfo;  // information about the transform graph.
  that.pickInfoElem;
  that.flashTimer = 0;
  that.highlightMaterial;
  that.highlightShape;
  that.vertex;
  that.positionVector;
  that.primitiveIndex;
  that.dataArray;
  that.data_max; //Max of data
  that.data_min; //Min of data
  that.range_max; //Max of range bar
  that.range_min; //Min of range bar
  that.spectrum;
  that.coordinates = jQuery("#coordinates");
  that.selectPoint = null;

  //Gets the data related to a vertex in the image.
  this.pickClick = function(e,info) {
    that.vertex = info.vertex;
    if(that.vertex) {
      update_map();
      jQuery("#x-coord").val(info.position_vector[0]);
      jQuery("#y-coord").val(info.position_vector[1]);
      jQuery("#z-coord").val(info.position_vector[2]);
      jQuery("#v-coord").val(info.vertex);
      jQuery("#value-coord").val(0);

    }else {
      jQuery(that.pickInfoElem).html('--nothing--');
    }


  };
  this.change_model = function(event) {
    var type=jQuery(event.target).val();



    brainbrowser.loadObjFromUrl('/data/surfaces/surf_reg_model_both_'+type+'.obj');
  };

  this.flipXCoordinate = function() {
    if(that.vertex > that.dataArray.length/2) {
      that.vertex -= that.dataArray.length/2;
    }else {
      that.vertex += that.dataArray.length/2;
    }
    update_map();

  };

  //Finds out what the value is at a certain point and displays it
  this.valueAtPoint = function(e,info) {
    var value = that.dataArray[info.vertex];
    if(info.vertex && value){
      jQuery("#x-coord").val(info.position_vector[0]);
      jQuery("#y-coord").val(info.position_vector[1]);
      jQuery("#z-coord").val(info.position_vector[2]);
      jQuery("#v-coord").val(info.vertex);
      jQuery("#value-coord").val(value);
    }
  };



  /**
   *  This method generates the color map using the spectrum
   *
   */
  function generate_colors(values,min,max) {

    var colorArray = new Array();

    //calculate a slice of the data per color
    var increment = ((max-min)+(max-min)/that.spectrum.length)/that.spectrum.length;
    //for each value, assign a color
    for(var i=0; i<values.length; i++) {
      if(values[i]<= min ) {
	var color_index = 0;
      }else if(values[i]> max){
	var color_index = that.spectrum.length-1;
      }else {
	var color_index = parseInt((values[i]-min)/increment);
      }
      //This inserts the RGBA values (R,G,B,A) independently
      colorArray.push.apply(colorArray,that.spectrum[color_index]);
    }
    update_range(min,max);
    return colorArray;
  }


  /**
   * This method applies the colors to the model
   */
  function update_colors(color_array) {
    if(brainbrowser.model_data.num_hemispheres == 1) {
      var color_buffer = brainbrowser.pack.createObject('VertexBuffer');
      var color_field = color_buffer.createField('FloatField', 4);
      color_buffer.set(color_array);
      var brain_shape = brainbrowser.brainTransform.shapes[0];
      var stream_bank = brain_shape.elements[0].streamBank;
      stream_bank.setVertexStream(
	brainbrowser.o3d.Stream.COLOR, //  This stream stores vertex positions
	0,                     // First (and only) position stream
	color_field,        // field: the field this stream uses.
	0);                    // start_index:


    } else {
      var left_color_array = color_array.slice(0, color_array.length/2);
      var right_color_array = color_array.slice(color_array.length/2, color_array.length);

      var left_color_buffer = brainbrowser.pack.createObject('VertexBuffer');
      var left_color_field = left_color_buffer.createField('FloatField', 4);
      left_color_buffer.set(left_color_array);
      var left_brain_shape = brainbrowser.brainTransform.children[0].shapes[0];
      var left_stream_bank = left_brain_shape.elements[0].streamBank;
      left_stream_bank.setVertexStream(
	brainbrowser.o3d.Stream.COLOR, //  This stream stores vertex positions
	0,                     // First (and only) position stream
	left_color_field,        // field: the field this stream uses.
	0);                    // start_index:



      var right_color_buffer = brainbrowser.pack.createObject('VertexBuffer');
      var right_color_field = right_color_buffer.createField('FloatField', 4);
      right_color_buffer.set(right_color_array);
      var right_brain_shape = brainbrowser.brainTransform.children[1].shapes[0];
      var right_stream_bank = right_brain_shape.elements[0].streamBank;
      right_stream_bank.setVertexStream(
	brainbrowser.o3d.Stream.COLOR, //  This stream stores vertex positions
	0,                     // First (and only) position stream
	right_color_field,        // field: the field this stream uses.
	0);                    // start_index:
	brainbrowser.client.render();
    }

  }

  function get_data_controls() {
    var data_modality = jQuery("[name=modality]:checked").val(); //CT,AREA or Volume
    var data_sk = jQuery("#data-sk").val(); //Smoothing Kernel
    var data_statistic = jQuery("[name=statistic]:checked").val();


    return {modality: data_modality, sk: data_sk, statistic: data_statistic };
  }

  function update_color_map(min,max) {
    var colors = generate_colors(that.dataArray,min,max);
    if(colors != -1) {
      update_colors(colors);
    }
  }


  function update_model(dataset) {
    that.dataArray = dataset.data;
    brainbrowser.current_dataset = dataset;
    if(jQuery("#fix_range").attr("checked") == true) {
      if(!(that.data_min = parseFloat(jQuery("#data-range-min").val()))) {
	if(!that.data_min === 0 ) {
	  that.data_min = dataset.min;
	}
      }
      if(!(that.data_max = parseFloat(jQuery("#data-range-max").val()))) {
	if(!that.data_max === 0 ) {
	  that.data_max = dataset.max;
	}
      }
    }else {
      that.data_min = dataset.min;
      that.data_max = dataset.max;
    }
    jQuery("#range-slider").slider("option", "min", dataset.min);
    jQuery("#range-slider").slider("option", "max", dataset.max);
    update_color_map(that.data_min,that.data_max);
  }

  that.update_model = update_model;

  function update_map() {
    that.dataSet.get_data(that.vertex,get_data_controls(),update_model);
    jQuery(that.pickInfoElem).html("Viewing data for vertex: " + that.vertex  );
  }

  this.show_atlas = function() {
    that.dataSet.get_data("aal_atlas",get_data_controls(),update_model);
    jQuery(that.pickInfoElem).html("Viewing data for vertex: " + that.vertex  );
  };

  function update_range(min,max) {
    if(!jQuery("#fix_range").attr("checked")){
      jQuery("#data-range-min").val(min);
      jQuery("#data-range-max").val(max);
      jQuery("#range-slider").slider("values", 0, min);
      jQuery("#range-slider").slider("values", 1, max);


    if(that.afterRangeChange != undefined) {
      that.afterRangeChange(min,max);
    }

    }
  }

  function update_scale(min,max) {
  }

  this.range_change = function() {
    var min=parseFloat(jQuery("#data-range-min").val());
    var max=parseFloat(jQuery("#data-range-max").val());
    update_color_map(min,max);

    if(that.afterRangeChange != undefined) {
      that.afterRangeChange(min,max);
    }
  };


  this.data_control_change = function() {
    if(that.vertex) {
      update_map();
    }
  };

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
		  url: '/assets/spectral_spectrum.txt',
		  dataType: 'text',
		  success: function (data) {
		    var colors = parse_spectrum(data);
		    that.spectrum = colors;
		  },
		  data: {spectrum: type}
		});
  }


  set_spectrum("spectral");
  brainbrowser.updateInfo();
  brainbrowser.valueAtPointCallback = this.valueAtPoint;
  brainbrowser.clickCallback = this.pickClick; //associating pickClick for brainbrowser which handles events.






}





