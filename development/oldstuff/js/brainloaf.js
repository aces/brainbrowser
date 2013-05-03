/* 
 * Copyright (C) 2011 McGill University
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

function BrainLoaf(filename) {
  var that = this;
  that.mindframe = new MindFrame();

  this.init = function(filename) {
    this.minc = new Minc(filename,null, that.setup);
  };

  that.materialArgsSetup = function(material) {
    // Light position
    var isovalue = material.getParam('isovalue');
    isovalue.value = parseFloat(jQuery("#isovalue").val());
    return material;
  };


  //Create the volume/transform/color map
  this.setup = function(minc,extraArgs) {
    //Creating the volume to display after init
    that.minc = minc;
    var brainloaf=that;
    that.mindframe.afterInit = function(that) {

      var url = "/shaders/dumb.txt";
      var material = that.createMaterial(url, brainloaf.materialArgsSetup);



      that.mainTransform = that.pack.createObject('Transform');
      that.mainTransform.parent = that.client.root;

      /*
       * Turn on the rotation events
       *
       */

      //sets what will be rotated with drag event
      that.rotationTransform = that.mainTransform;
      o3djs.event.addEventListener(that.o3dElement, 'mousedown', that.startDragging);
      o3djs.event.addEventListener(that.o3dElement, 'mousemove', that.drag);
      o3djs.event.addEventListener(that.o3dElement, 'mouseup', that.stopDragging);



      var positionArray = that.create3DVolume(brainloaf.minc); //positionArray

      var shape = that.createShape(that.o3d.Primitive.POINTLIST,
				   positionArray,
				   null, //index array
				   null, //color Array
				   null, //normal array
				   material, //material
				   that.mainTransform, //transform
				   'volume'); //name
      that.mainTransform.visible = false;

      brainloaf.applyColors(that,brainloaf.minc.data,shape);
    };


    that.mindframe.init();
  };

  that.applyColors =function(mindframe,data,shape) {
    var loader = new Loader();
    var spectrum = loader.loadSpectrumFromUrl("/spectrum/gray_scale.txt");
    var colorArray = createColorMap(spectrum,[],data,0,255);
    var streamBank = shape.elements[0].streamBank;
    var colorBuffer = mindframe.pack.createObject('VertexBuffer');
    var colorField = colorBuffer.createField('FloatField', 4);
    colorBuffer.set(colorArray);
    
    streamBank.setVertexStream(
      mindframe.o3d.Stream.COLOR,
      0,
      colorField,
      0);
    
    mindframe.mainTransform.visible = true;
    mindframe.client.render();
    that.shape = shape;
    that.colorArray = colorArray;
    
  };
  
  
  
  
  this.changeIsovalue = function() {
     var material = that.shape.elements[0].material;
     that.materialArgsSetup(material);
  };

  if(filename) {
    this.init(filename);
  }

}

$( function() {
  var brainloaf = new BrainLoaf('/data/test.mnc');
  jQuery("#isovalue").change(brainloaf.changeIsovalue);
     
});