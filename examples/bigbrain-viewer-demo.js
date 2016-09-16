/*
* BrainBrowser: Web-based Neurological Visualization Tools
* (https://brainbrowser.cbrain.mcgill.ca)
*
* Copyright (C) 2011
* The Royal Institution for the Advancement of Learning
* McGill University
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
* Author: Lindsay B. Lewis <lindsayblewis@gmail.com>
* Author: Tarek Sherif  <tsherif@gmail.com> (http://tareksherif.ca/)
* Author: Nicolas Kassis
*/

/*jshint loopfunc: true */
/*jshint evil:true */

// This script is meant to be a demonstration of how to
// use most of the functionality available in the
// BrainBrowser Surface Viewer.
$(function() {
  "use strict";

  var THREE = BrainBrowser.SurfaceViewer.THREE;

  // Request variables used to cancel the current request
  // if another request is started.
  var current_request = 0;
  var current_request_name = "";

  // Hide or display loading icon.
  var loading_div = $("#loading");
  function showLoading() { loading_div.show(); }
  function hideLoading() { loading_div.hide(); }

  // Make sure WebGL is available.
  if (!BrainBrowser.WEBGL_ENABLED) {
    $("#brainbrowser").html(BrainBrowser.utils.webGLErrorMessage());
    return;
  }

  /////////////////////////////////////
  // Start running the Surface Viewer
  /////////////////////////////////////
  window.viewer = BrainBrowser.SurfaceViewer.start("brainbrowser", function(viewer) {

    var picked_object = null;
    var picked_coords;
    var atlas_labels = {};
    var searchshapes_value = "";
    var searchshapes_value_long = "";
    var autoshapes = [];
    var autoshapes_long = [];
    var autoshapes_norepeats = [];
    var focus_toggle = "off";
    var opacity_toggle_oncustom = "on";
    var opacity_toggle_customoff_1 = "custom";
    var opacity_toggle_customoff_2 = "custom";
    var axes_toggle = "off";
    var slider_backup = {};
    var on_off_backup = {};
    var marker = "";
    var axes_length = 100;
    var current_count;
    var legend_div = "";
    var bgcolor = "black";
    var m = 0;
    var m_index_begin = [0];
    var m_index_end = [0];
    var total_children = 0;
    var two_models_toggle = 0;
    var offset_old = new THREE.Vector3( 0, 0, 0 );
    var offset_diff_total = new THREE.Vector3( 0, 0, 0 );
    var m_selected = 0;
    var m1_model_data_get;
    var m2_model_data_get;
    var m1_offset = 0;
    var grid_backup;
    var grid_length = 100;
    var grid_partitions = Math.round(grid_length/10);
    var user_defined_grid_length = "no";
    var user_defined_grid_partitions = "no";
    var toggle_grid_XY = "on";
    var toggle_grid_XZ = "on";
    var toggle_grid_YZ = "on";
    var opacity_grid_toggle = "on";
    var grid_auto_toggle = "on";
    var bounding_box_min_x = [];
    var bounding_box_max_x = [];
    var bounding_box_min_y = [];
    var bounding_box_max_y = [];
    var bounding_box_min_z = [];
    var bounding_box_max_z = [];

    // Add the three.js 3D anaglyph effect to the viewer.
    viewer.addEffect("AnaglyphEffect");

    ///////////////////////////////////
    // Event Listeners
    ///////////////////////////////////

    // If something goes wrong while loading, we don't
    // want the loading icon to stay on the screen.
    BrainBrowser.events.addEventListener("error", hideLoading);

    // When a new model is added to the viewer, create a transparency slider
    // for each shape that makes up the model.
    viewer.addEventListener("displaymodel", function(event) {

      // Temporarily disable grid if it was turned on before model is loaded
      viewer.model.children.forEach(function(child,i) {
        if (child.name === "grid") {
          grid_backup = viewer.model.children.splice(i, 1);
          viewer.updated = true;
          user_defined_grid_partitions = "no";
          user_defined_grid_length = "no";
        }
      });

      if (m < 1){
        var select_div = $("<div class=\"select-cell\"><div id=\"select\" class=\"box-bottom full-box \">" +
          "<h3>Select a point on the surface<BR>(shift-click or touch)</h3>" +
          "<div>Shape name: <span id=\"pick-name\" class=\"pick-data\"></span></div>" +
          "<div>Shape number: <span id=\"pick-shape-number\" class=\"pick-data\"></span></div>" +
          "<div>X: <span id=\"pick-x\" class=\"pick-data\"></span></div>" +
          "<div>Y: <span id=\"pick-y\" class=\"pick-data\"></span></div>" +
          "<div>Z: <span id=\"pick-z\" class=\"pick-data\"></span></div>" +
          "<div>Vertex number: <span id=\"pick-index\" class=\"pick-data\"></span></div><br>" +
          "<span id=\"focus-shape\" class=\"button\">Focus / Unfocus This Shape</span>" +
          "<div style=\"margin-top:20px;\">" +
          "<div class=\"ui-widget\">" +
          "<input id=\"searchshapes\" type=\"text\" placeholder=\"Search Shapes\">" +
          "</div>" +
          "<div class=\"button-row\">" +
          "<span id=\"gosearch\" class=\"button\">Go!</span>  " +
          "<span id=\"clearsearch\" class=\"button\">Clear</span>" +
          "</div>" +
          "</div>" +
          "</div></div>");
        select_div.appendTo("#views");
        m_selected = 1;
        m1_model_data_get = viewer.model_data.get();
      }

      var shapes_header_div = $("<ul class=\"tabs\"><br><div id=\"shape-tab-titles\"></div></ul><div id=\"shape-wrap\"></div>");
      shapes_header_div.appendTo("#select");

      m = m + 1;

      if (m > 1){
        $("ul.tabs li").removeClass("current");
        $(".tab-content").removeClass("current");
        two_models_toggle = 1;
        clearShape("marker");
        m_selected = m;
        m2_model_data_get = viewer.model_data.get();
      }

      var tab_div = $("<li class=\"tab-link current\" id=\"tabid-" + m + "\" data-tab=\"shapes-" + m + "\">" + document.getElementById("objfile").value + "</li>");
      tab_div.appendTo("#shape-tab-titles");

      var shapes_div = $("<div id=\"shapes-" + m + "\" class=\"tab-content current\"></div>");
      shapes_div.appendTo("#shape-wrap");

      $(document).ready(function(){

        $("ul.tabs li").click(function(){
          var tab_id = $(this).attr("data-tab");
          $("ul.tabs li").removeClass("current");
          $(".tab-content").removeClass("current");

          $(this).addClass("current");
          $("#"+tab_id).addClass("current");

          m_selected = parseInt((tab_id.slice(-1)),10);
        });
      });

      shapes_header_div.appendTo("#select");

      var slider, slider_div, slider_div_end;
      var children = event.model_data.shapes;
      current_count = $("#shapes-" + m).children().length;
      m_index_begin[m] = total_children;
      m_index_end[m] = total_children + children.length;
      total_children = m_index_end[m];

      if(children.length - current_count > 0 ) {
        children.slice(current_count).forEach(function(shape, i) {
          var j = i;
          if (m > 1){
            j = m_index_end[m-1] + i;
          }

          autoshapes[j] = viewer.model.children[j].name;
          autoshapes_long[j] = viewer.model.children[j].name + "-" + j;

          slider_div = $("<div id=\"shape-" + j + "\" class=\"shape\">" +
            "<h4> <p class=\"alignleft\"></p></h4>" +
            "<div id=\"top-" + j + "\" style=\"visibility: hidden\"><p class=\"alignright\">" +
            "<input type=\"button\" onClick=\"window.location.hash='#shapes-" + m + "';window.location.hash='#views'\" value=\"back to top\"/></p></div><br />" +
            "<div style=\"clear: both;\">" +
            "Name: " + shape.name + "<br />" +
            "<p class=\"alignleft\"> Opacity: </p></div>");
          slider = $("<div id=\"opacity-slider-" + j + "\" class=\"opacity-slider aligncenter slider\" data-shape-name=\"" + shape.name + "-" + j + "\">");
          slider_div_end = $("<p class=\"alignright\"><a class=\"on-off-button\" id=\"individualtoggleopacity-" + j + "\">On</a></p>");
          slider.slider({
            value: 100,
            min: 0,
            max: 100,
            slide: function(event, ui) {
              var target = event.target;
              var shape_name = $(target).attr('data-shape-name');
              var alpha = ui.value;
              alpha = Math.min(100, Math.max(0, alpha)) / 100.0;
              viewer.setTransparency(alpha, {
                shape_name: shape_name
              });

              if ((window.axesbox !== undefined) && (window.axesbox.model.name === "axes_on")) {
                slider_backup[viewer.model.children[j].name] = alpha * 100;
                toggle_grid_XY = ((document.getElementById("toggle_grid_XY")) && (document.getElementById("toggle_grid_XY").checked === true)) ? "off" : "on";
                toggle_grid_YZ = ((document.getElementById("toggle_grid_YZ")) && (document.getElementById("toggle_grid_YZ").checked === true)) ? "off" : "on";
                toggle_grid_XZ = ((document.getElementById("toggle_grid_XZ")) && (document.getElementById("toggle_grid_XZ").checked === true)) ? "off" : "on";

                if ((document.getElementById("grid_auto_toggle")) && ($("#grid_auto_toggle").html() === "Off")){
                  grid_auto_toggle = "off";
                }
              }

              // Only call buildGrid if usefull
              if (toggle_grid_XY === "off" || toggle_grid_YZ === "off" || toggle_grid_XZ === "off" || axes_toggle === "on") {
                if (picked_coords !== undefined){
                  clearShape("grid");
                  buildGrid( picked_coords.x, picked_coords.y, picked_coords.z, toggle_grid_XY, toggle_grid_XZ, toggle_grid_YZ);
                } else {
                  clearShape("grid");
                  buildGrid( 0, 0, 0, toggle_grid_XY, toggle_grid_XZ, toggle_grid_YZ);
                }
              }

              if ((marker !== "") && (shape_name === picked_object.name)){
                viewer.setTransparency(picked_object.material.opacity, {shape_name: "marker"});
                //TEMP FIX FOR MARKER OPACITY
                if (viewer.model.children[viewer.model.children.length-1].name === "marker"){
                  viewer.model.children[viewer.model.children.length-1].renderDepth = 1;
                } else if (viewer.model.children[viewer.model.children.length-2].name === "marker"){
                  viewer.model.children[viewer.model.children.length-2].renderDepth = 1;
                }
                //END TEMP FIX
              }
              slider_backup[shape.name + "-" + j] = $(".opacity-slider[data-shape-name='" + shape.name + "-" + j + "']").slider("value");
            }
          });

          slider_div_end.appendTo(slider_div);
          slider.appendTo(slider_div);
          slider_div.appendTo("#shapes-" + m);
          slider_backup[shape.name + "-" + j] = $(".opacity-slider[data-shape-name='" + shape.name + "-" + j + "']").slider("value");
          $("#individualtoggleopacity-" + j).click(function() {

            if ($(this).html() === "On"){
              slider_backup[shape.name + "-" + j] = $(".opacity-slider[data-shape-name='" + shape.name + "-" + j + "']").slider("value");
              viewer.setTransparency(0, {shape_name: shape.name});
              $(this).html("Off");
              document.getElementById("individualtoggleopacity-" + j).style.backgroundColor = "red";
              document.getElementById("opacity-slider-" + j).style.visibility = "hidden";
              if ((window.axesbox !== undefined) && (window.axesbox.model.name === "axes_on")){
                toggle_grid_XY = ((document.getElementById("toggle_grid_XY")) && (document.getElementById("toggle_grid_XY").checked === true)) ? "off" : "on";
                toggle_grid_YZ = ((document.getElementById("toggle_grid_YZ")) && (document.getElementById("toggle_grid_YZ").checked === true)) ? "off" : "on";
                toggle_grid_XZ = ((document.getElementById("toggle_grid_XZ")) && (document.getElementById("toggle_grid_XZ").checked === true)) ? "off" : "on";

                if ((document.getElementById("grid_auto_toggle")) && ($("#grid_auto_toggle").html() === "Off")){
                  grid_auto_toggle = "off";
                }

                $( ".axes_class" ).remove();
                $( ".axes_legend_class" ).remove();
                $( ".grid_class" ).remove();
                clearShape("axes");
                clearShape("grid");
                window.axesbox = undefined;
                if (picked_coords !== undefined){
                  buildAxes( axes_length, picked_coords.x, picked_coords.y, picked_coords.z, toggle_grid_XY, toggle_grid_XZ, toggle_grid_YZ );
                } else {
                  buildAxes( axes_length, 0, 0, 0, toggle_grid_XY, toggle_grid_XZ, toggle_grid_YZ );
                }
                opacity_grid_toggle = "off";
              }
            } else {
              var alpha = slider_backup[shape.name] / 100;
              viewer.setTransparency(alpha, {shape_name: shape.name});
              $(".opacity-slider[data-shape-name='" + shape.name + "-" + j + "']").slider("value", slider_backup[shape.name + "-" + j]);
              $(this).html("On");
              document.getElementById("individualtoggleopacity-" + j).style.backgroundColor = "green";
              document.getElementById("opacity-slider-" + j).style.visibility = "visible";
              if (marker !== ""){
                marker = viewer.drawDot(picked_coords.x, picked_coords.y, picked_coords.z, 0.3);
                marker.name = "marker";
                viewer.setTransparency(picked_object.material.opacity, {shape_name: "marker"});
              }
              if ((window.axesbox !== undefined) && (window.axesbox.model.name === "axes_on")){
                toggle_grid_XY = ((document.getElementById("toggle_grid_XY")) && (document.getElementById("toggle_grid_XY").checked === true)) ? "off" : "on";
                toggle_grid_YZ = ((document.getElementById("toggle_grid_YZ")) && (document.getElementById("toggle_grid_YZ").checked === true)) ? "off" : "on";
                toggle_grid_XZ = ((document.getElementById("toggle_grid_XZ")) && (document.getElementById("toggle_grid_XZ").checked === true)) ? "off" : "on";

                if ((document.getElementById("grid_auto_toggle")) && ($("#grid_auto_toggle").html() === "Off")){
                  grid_auto_toggle = "off";
                }

                $( ".axes_class" ).remove();
                $( ".axes_legend_class" ).remove();
                $( ".grid_class" ).remove();
                clearShape("axes");
                clearShape("grid");
                window.axesbox = undefined;
                if (picked_coords !== undefined){
                  buildAxes( axes_length, picked_coords.x, picked_coords.y, picked_coords.z, toggle_grid_XY, toggle_grid_XZ, toggle_grid_YZ );
                } else {
                  buildAxes( axes_length, 0, 0, 0, toggle_grid_XY, toggle_grid_XZ, toggle_grid_YZ );
                }
                opacity_grid_toggle = "on";
              }
            }
          });
          viewer.model.children[j].model = m;
          shape.name                     = shape.name === shape.name + "-" + j ? shape.name : shape.name + "-" + j;
          viewer.model.children[j].name  = shape.name;

          // Change opacity slider background to same color as the shape it represents
          var r,g,b;
          var color = [0,0,0];
          if (m === 1){
            if (m1_model_data_get.shapes[i].color !== undefined) { color = m1_model_data_get.shapes[i].color;}
            r = Math.round(255*color[0]);
            g = Math.round(255*color[1]);
            b = Math.round(255*color[2]);
            document.getElementById("opacity-slider-" + j).style.background = "rgb("+ r + ", " + g + ", " + b + ")";
          } else if (m === 2){
            if (m2_model_data_get.shapes[i].color !== undefined) { color = m2_model_data_get.shapes[i].color;}
            r = Math.round(255*color[0]);
            g = Math.round(255*color[1]);
            b = Math.round(255*color[2]);
            document.getElementById("opacity-slider-" + j).style.background = "rgb("+ r + ", " + g + ", " + b + ")";
          }
        });

        //If grid was on before model was loaded but was temporarily disabled to load model, bring it back
        if (grid_backup !== undefined) {
          $( ".axes_legend_class" ).remove();
          $( ".grid_class" ).remove();
          clearShape("axes");
          clearShape("grid");
          buildAxes( axes_length, 0, 0, 0, toggle_grid_XY, toggle_grid_XZ, toggle_grid_YZ );
          grid_backup = undefined;
        }

        //If 2 models, get rid of duplicates in list that user sees in search box
        var o = {}, i, l = autoshapes.length;
        for(i=0; i<l;i+=1) o[autoshapes[i]] = autoshapes[i];
        for(i in o) autoshapes_norepeats.push(o[i]);

        var toggle_opacity_icon_onoff=("<p class=\"alignright\"><span title=\"Show/Hide Opacity for all of this tab\"><input id=\"hidetab-" + m + "\" class=\"icon\" type=\"checkbox\">" +
        "<label for=\"hidetab-" + m + "\"><img src=\"img/toggle_opacity_icon_onoff.png\"></label></span></p>");

        $("#shapes-" + m).prepend(toggle_opacity_icon_onoff);

//        // USEFUL FOR DEBUGGING - PLACES RED SPHERE AT CENTER OF ROTATION
//        var cyl_material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
//        var cyl_width = 1;
//        var cyl_height = 5;
//        var cylGeometry = new THREE.CylinderGeometry(cyl_width, cyl_width, cyl_height, 20, 1, false);
//        cylGeometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, cyl_height/2, 0 ) );
//        var cylinder = new THREE.Mesh(cylGeometry, cyl_material);

//        viewer.model.parent.add( cylinder );
//        cylinder.rotation.x = 0.5*Math.PI;

        //  If model 2 is loaded and if model 1 has already been recentered, move model 2's origin to be the same as model 1's original origin
        if ((m === 2) && (m1_offset === 1)){
          viewer.model.children[m_index_begin[2]].geometry.applyMatrix(new THREE.Matrix4().makeTranslation( -offset_old.x, -offset_old.y, -offset_old.z ) );
        }

        // This is a little hack to make sure that none of the shapes slip outside of the original radius
        // after the geometry is translated to the center of a previous shape.
        // Can also set boundingSphere to null but this seems to slow down the performance too much.
        viewer.model.children.forEach(function(child) {
          if ((child.name !== "axes") && (children.name !== "marker") && (child.name !== "grid")){
            child.geometry.computeBoundingSphere();
            var orig_boundingSphere = child.geometry.boundingSphere.radius;
            child.geometry.boundingSphere.radius = orig_boundingSphere*5;
          }
        });

        // Toggle / hide opacity for a tab (custom vs. off).
        $("#hidetab-" + m).click(function() {
          if (eval("opacity_toggle_customoff_" + m) === "custom") {
            var m_unselected;
            if (m_selected === 1) { m_unselected = 2;}
            else if (m_selected === 2) {m_unselected = 1;}
            viewer.model.children.forEach(function(child,i) {
              if ((child.name !== "axes") && (child.name !== "marker") && (child.name !== "grid") && (i >= m_index_begin[m_selected]) && (i < m_index_end[m_selected])){
                slider_backup[child.name] = $(".opacity-slider[data-shape-name='" + child.name + "']").slider("value");
                on_off_backup[i] = $("#individualtoggleopacity-" + i).html();
                viewer.setTransparency(0, {shape_name: child.name});
                document.getElementById("individualtoggleopacity-" + i).style.backgroundColor = "red";
                document.getElementById("opacity-slider-" + i).style.visibility = "hidden";
                $("#individualtoggleopacity-" + i).html("Off");

                if ((picked_object !== null) && (picked_object.name === child.name) && (marker !== "")){
                  viewer.setTransparency(0, {shape_name: "marker"});
                }
              //Have to reorder rendering of other model so that its transparent shapes are not cutoff / intersected by model that is being hidden
              } else if ((child.name !== "axes") && (child.name !== "marker") && (child.name !== "grid") && (i >= m_index_begin[m_unselected]) && (i < m_index_end[m_unselected])){
                child.renderDepth = 1;
                viewer.updated = true;
              }
            });
            eval("opacity_toggle_customoff_" + m + " = \"off\"");
          } else if (eval("opacity_toggle_customoff_" + m) === "off") {
            viewer.model.children.forEach(function(child,i) {
              if ((child.name !== "axes") && (child.name !== "marker") && (child.name !== "grid") && (i >= m_index_begin[m_selected]) && (i < m_index_end[m_selected])){
                var alpha = slider_backup[child.name] / 100;
                viewer.setTransparency(alpha, {shape_name: child.name});
                $(".opacity-slider[data-shape-name='" + child.name + "']").slider("value", slider_backup[child.name]);
                $("#individualtoggleopacity-" + i).html(on_off_backup[i]);
                if (on_off_backup[i] === "On"){
                  document.getElementById("individualtoggleopacity-" + i).style.backgroundColor = "green";
                  document.getElementById("opacity-slider-" + i).style.visibility = "visible";
                } else {
                  document.getElementById("individualtoggleopacity-" + i).style.backgroundColor = "red";
                  document.getElementById("opacity-slider-" + i).style.visibility = "hidden";
                  viewer.setTransparency(0, {shape_name: child.name});
                }
              }
            });
            if (marker !== ""){
              viewer.setTransparency(picked_object.material.opacity, {shape_name: "marker"});
            }
            eval("opacity_toggle_customoff_" + m + " = \"custom\"");
          }
        });

        if ((m>1) && (marker !== "")){
          marker = viewer.drawDot(picked_coords.x, picked_coords.y, picked_coords.z, 0.3);
          marker.name = "marker";
          viewer.setTransparency(picked_object.material.opacity, {shape_name: "marker"});
        }
      }

      $("#searchshapes").autocomplete({
        source: autoshapes_norepeats
      }).autocomplete("widget").addClass("fixed-height");
      current_count = $("#shapes").children().length;

      $("#gosearch").click(function() {

        if (two_models_toggle < 2){

          clearShape("marker");
          marker = "";

          var input_searchshapes = $("#searchshapes").val();
          // Only do the following if string is not blank & contains some text (i.e. not strictly numeric)
          if ((input_searchshapes !== "") && (!/^\d+$/.test(input_searchshapes))){

            $("#pick-name").html("");
            $("#pick-shape-number").html("");
            $("#pick-x").html("");
            $("#pick-y").html("");
            $("#pick-z").html("");
            $("#pick-index").html("");

            for (var i = m_index_begin[m_selected]; i < m_index_end[m_selected]; i++) {
              if (input_searchshapes === autoshapes[i]){
                searchshapes_value_long = autoshapes_long[i];
              }
            }

            viewer.model.children.forEach(function(child,i) {
              if ((child.name !== "axes") && (child.name !== "marker") && (child.name !== "grid")){
                on_off_backup[i] = $("#individualtoggleopacity-" + i).html();
                slider_backup[child.name] = $(".opacity-slider[data-shape-name='" + child.name + "']").slider("value");
                if (child.name === searchshapes_value_long) {

                  var offset       = viewer.model.userData.model_center_offset || new THREE.Vector3(0,0,0);
                  var shape_center = {};
                  viewer.model_data.forEach(function(model_data, model_name){
                    viewer.model_data.get(model_name).shapes.forEach(function(shape){
                        if (shape.name !== child.name) {
                          return;
                        }
                        shape_center = shape.centroid;
                      });
                  });

                  var center = new THREE.Vector3(shape_center.x + -offset.x , shape_center.y + -offset.y, shape_center.z + -offset.z);
                  picked_coords = shape_center;
                  changeCenterRotation(center);

                  $("#pick-shape-number").html(i+1);
                  $("#pick-name").html(input_searchshapes);
                  window.location.hash = "#shape-" + i;
                  window.location.hash = "#views";
                  document.getElementById("shape-" + i).style.backgroundColor = "#1E8FFF";
                  document.getElementById("top-" + i).style.visibility = "visible";
                  viewer.setTransparency(1, {shape_name: child.name});
                  $(".opacity-slider[data-shape-name='" + child.name + "']").slider("value", 100);
                  document.getElementById("opacity-slider-" + i).style.visibility = "visible";
                  document.getElementById("individualtoggleopacity-" + i).style.backgroundColor = "green";
                  $("#individualtoggleopacity-" + i).html("On");
                } else {   //focus selected object, no need for shift-click
                  document.getElementById("shape-" + i).style.backgroundColor = "#333333";
                  document.getElementById("top-" + i).style.visibility = "hidden";
                  viewer.setTransparency(0, {shape_name: child.name});
                  document.getElementById("opacity-slider-" + i).style.visibility = "hidden";
                  document.getElementById("individualtoggleopacity-" + i).style.backgroundColor = "red";
                  $("#individualtoggleopacity-" + i).html("Off");
                }
              }
            });

            if (window.axesbox !== undefined && window.axesbox.model.name === "axes_on"){
              toggle_grid_XY = ((document.getElementById("toggle_grid_XY")) && (document.getElementById("toggle_grid_XY").checked === true)) ? "off" : "on";
              toggle_grid_YZ = ((document.getElementById("toggle_grid_YZ")) && (document.getElementById("toggle_grid_YZ").checked === true)) ? "off" : "on";
              toggle_grid_XZ = ((document.getElementById("toggle_grid_XZ")) && (document.getElementById("toggle_grid_XZ").checked === true)) ? "off" : "on";

              if ((document.getElementById("grid_auto_toggle")) && ($("#grid_auto_toggle").html() === "Off")){
                grid_auto_toggle = "off";
              }

              $( ".axes_class" ).remove();
              $( ".axes_legend_class" ).remove();
              $( ".grid_class" ).remove();
              clearShape("axes");
              clearShape("grid");
              window.axesbox = undefined;
              if (picked_coords !== undefined){
                buildAxes( axes_length, picked_coords.x, picked_coords.y, picked_coords.z, toggle_grid_XY, toggle_grid_XZ, toggle_grid_YZ );
              } else {
                buildAxes( axes_length, 0, 0, 0, toggle_grid_XY, toggle_grid_XZ, toggle_grid_YZ );
              }
            }
            // If strictly numeric, search by vertex number
          } else if ((input_searchshapes !== "") && (/^\d+$/.test(input_searchshapes)))  {
            pick(viewer.x, viewer.y, input_searchshapes);
            searchshapes_value_long = picked_object.name;

            viewer.model.children.forEach(function(child,i) {
              if ((i >= m_index_begin[m_selected]) && (i < m_index_end[m_selected])) {
                if (searchshapes_value_long === autoshapes_long[i]){
                  searchshapes_value = autoshapes[i];
                }
              }

              if ((child.name !== "axes") && (child.name !== "marker") && (child.name !== "grid")){
                on_off_backup[i] = $("#individualtoggleopacity-" + i).html();
                slider_backup[viewer.model.children[i].name] = $(".opacity-slider[data-shape-name='" + child.name + "']").slider("value");
                if (child.name === picked_object.name) {
                  window.location.hash = "#shape-" + i;
                  window.location.hash = "#views";
                  document.getElementById("shape-"+ i).style.backgroundColor = "#1E8FFF";
                  document.getElementById("top-" + i).style.visibility = "visible";
                  viewer.setTransparency(1, {shape_name: child.name});
                  $(".opacity-slider[data-shape-name='" + child.name + "-" + i + "']").slider("value", 100);
                  document.getElementById("opacity-slider-" + i).style.visibility = "visible";
                  document.getElementById("individualtoggleopacity-" + i).style.backgroundColor = "green";
                  $("#individualtoggleopacity-" + i).html("On");
                  // Change center of roration
                  var offset = viewer.model.userData.model_center_offset || new THREE.Vector3(0,0,0);
                  var center = new THREE.Vector3(parseFloat($("#pick-x").html()) + -offset.x, parseFloat($("#pick-y").html()) + -offset.y, parseFloat($("#pick-z").html()) + -offset.z);
                  changeCenterRotation(center);
                } else {   //focus selected object, no need for shift-click
                  document.getElementById("shape-" + i).style.backgroundColor = "#333333";
                  document.getElementById("top-" + i).style.visibility = "hidden";
                  viewer.setTransparency(0, {shape_name: child.name});
                  document.getElementById("opacity-slider-" + i).style.visibility = "hidden";
                  document.getElementById("individualtoggleopacity-" + i).style.backgroundColor = "red";
                  $("#individualtoggleopacity-" + i).html("Off");
                }
              }
            });

            if (m_selected === 1 ){
              picked_coords.subVectors(picked_coords, offset_diff_total);
            } else if (m_selected === 2){
              if (two_models_toggle === 1){
                two_models_toggle = 2;
                picked_coords.subVectors(picked_coords, offset_old);
              }
            }
            clearShape("marker");
            marker = viewer.drawDot(picked_coords.x, picked_coords.y, picked_coords.z, 0.3);
            marker.name = "marker";
            viewer.setTransparency(picked_object.material.opacity, {shape_name: "marker"});
            if (window.axesbox !== undefined && window.axesbox.model.name === "axes_on"){
              toggle_grid_XY = ((document.getElementById("toggle_grid_XY")) && (document.getElementById("toggle_grid_XY").checked === true)) ? "off" : "on";
              toggle_grid_YZ = ((document.getElementById("toggle_grid_YZ")) && (document.getElementById("toggle_grid_YZ").checked === true)) ? "off" : "on";
              toggle_grid_XZ = ((document.getElementById("toggle_grid_XZ")) && (document.getElementById("toggle_grid_XZ").checked === true)) ? "off" : "on";

              if ((document.getElementById("grid_auto_toggle")) && ($("#grid_auto_toggle").html() === "Off")){
                grid_auto_toggle = "off";
              }

              $( ".axes_class" ).remove();
              $( ".axes_legend_class" ).remove();
              $( ".grid_class" ).remove();
              clearShape("axes");
              clearShape("grid");
              window.axesbox = undefined;
              buildAxes( axes_length, picked_coords.x, picked_coords.y, picked_coords.z, toggle_grid_XY, toggle_grid_XZ, toggle_grid_YZ );
            }
          }
          focus_toggle = "on";
          if (two_models_toggle === 1) {
            two_models_toggle = 2;
          }
        } else if (two_models_toggle === 2) {
          two_models_toggle = 1;
        }
      });

      // If Search box "Clear" button pressed
      $("#clearsearch").click(function() {

        clearShape("marker");
        document.getElementById("searchshapes").value = "";
        viewer.model.children.forEach(function(child,i) {
          if ((child.name !== "axes") && (child.name !== "marker") && (child.name !== "grid")){
            window.location.hash = "#surface-choice";
            document.getElementById("shape-" + i).style.backgroundColor = "#333333";
            document.getElementById("top-" + i).style.visibility = "hidden";
            var alpha = slider_backup[child.name] / 100;
            viewer.setTransparency(alpha, {shape_name: child.name});
            $(".opacity-slider[data-shape-name='" + child.name + "']").slider("value", slider_backup[child.name]);
            $("#individualtoggleopacity-" + i).html(on_off_backup[i]);
            if (on_off_backup[i] === "Off"){
              document.getElementById("individualtoggleopacity-" + i).style.backgroundColor = "red";
              document.getElementById("opacity-slider-" + i).style.visibility = "hidden";
              viewer.setTransparency(0, {shape_name: child.name});
            } else {
              document.getElementById("individualtoggleopacity-" + i).style.backgroundColor = "green";
              document.getElementById("opacity-slider-" + i).style.visibility = "visible";
            }
          }

          // Add logic to update grid
          if (toggle_grid_XY === "off" || toggle_grid_YZ === "off" || toggle_grid_XZ === "off" || axes_toggle === "on") {
            clearShape("grid");
            if (picked_coords !== undefined){
              buildGrid( picked_coords.x, picked_coords.y, picked_coords.z, toggle_grid_XY, toggle_grid_XZ, toggle_grid_YZ );
            } else {
              buildGrid( 0, 0, 0, toggle_grid_XY, toggle_grid_XZ, toggle_grid_YZ );
            }
          }

        });



        focus_toggle = "off";
        // searchshapes.value = "";
        // searchshapes.value_long = "";
        $("#pick-name").html("");
        $("#pick-shape-number").html("");
        $("#pick-x").html("");
        $("#pick-y").html("");
        $("#pick-z").html("");
        $("#pick-index").html("");
      });

      $("#focus-shape").click(function() {
        var name = searchshapes_value_long;
        var ct=1;

        if ((focus_toggle === "off") && (ct < viewer.model.children.length) && (two_models_toggle < 2)){
          viewer.model.children.forEach(function(child,i) {
            if ((child.name !== "axes") && (child.name !== "marker") && (child.name !== "grid")){
              if (child.name !== name) {
                ct = ct+1;
                slider_backup[child.name] = $(".opacity-slider[data-shape-name='" + child.name + "']").slider("value");
                viewer.setTransparency(0, {shape_name: child.name});
                $(".opacity-slider[data-shape-name='" + child.name + "']").slider("value", 0);
                document.getElementById("opacity-slider-" + i).style.visibility = "hidden";
                document.getElementById("individualtoggleopacity-" + i).style.backgroundColor = "red";
                $("#individualtoggleopacity-" + i).html("Off");
              }
            }
          });

          if (window.axesbox !== undefined && window.axesbox.model.name === "axes_on"){
            toggle_grid_XY = ((document.getElementById("toggle_grid_XY")) && (document.getElementById("toggle_grid_XY").checked === true)) ? "off" : "on";
            toggle_grid_YZ = ((document.getElementById("toggle_grid_YZ")) && (document.getElementById("toggle_grid_YZ").checked === true)) ? "off" : "on";
            toggle_grid_XZ = ((document.getElementById("toggle_grid_XZ")) && (document.getElementById("toggle_grid_XZ").checked === true)) ? "off" : "on";

            if ((document.getElementById("grid_auto_toggle")) && ($("#grid_auto_toggle").html() === "Off")){
              grid_auto_toggle = "off";
            }

            clearShape("grid");
            if (picked_coords !== undefined){
              buildGrid( picked_coords.x, picked_coords.y, picked_coords.z, toggle_grid_XY, toggle_grid_XZ, toggle_grid_YZ );
            } else {
              buildGrid( 0, 0, 0, toggle_grid_XY, toggle_grid_XZ, toggle_grid_YZ );
            }
          }

          focus_toggle = "on";
          if (two_models_toggle === 1){
            two_models_toggle = 2;
          }
        } else if ((focus_toggle === "on") && (ct < viewer.model.children.length) && (two_models_toggle < 2)){
          viewer.model.children.forEach(function(child,i) {
            if ((child.name !== "axes") && (child.name !== "marker") && (child.name !== "grid")){
              if (child.name !== name) {
                ct=ct+1;
                var alpha = slider_backup[child.name] / 100;
                viewer.setTransparency(alpha, {shape_name: child.name});
                $(".opacity-slider[data-shape-name='" + child.name + "']").slider("value", slider_backup[child.name]);
                document.getElementById("opacity-slider-" + i).style.visibility = "visible";
                document.getElementById("individualtoggleopacity-" + i).style.backgroundColor = "green";
                $("#individualtoggleopacity-" + i).html("On");
              }
            }
          });

          if (window.axesbox !== undefined && window.axesbox.model.name === "axes_on"){
            toggle_grid_XY = ((document.getElementById("toggle_grid_XY")) && (document.getElementById("toggle_grid_XY").checked === true)) ? "off" : "on";
            toggle_grid_YZ = ((document.getElementById("toggle_grid_YZ")) && (document.getElementById("toggle_grid_YZ").checked === true)) ? "off" : "on";
            toggle_grid_XZ = ((document.getElementById("toggle_grid_XZ")) && (document.getElementById("toggle_grid_XZ").checked === true)) ? "off" : "on";

            if ((document.getElementById("grid_auto_toggle")) && ($("#grid_auto_toggle").html() === "Off")){
              grid_auto_toggle = "off";
            }
            clearShape("grid");
            user_defined_grid_partitions = "no";
            user_defined_grid_length     = "no";
            if (picked_coords !== undefined){
              buildGrid( picked_coords.x, picked_coords.y, picked_coords.z, toggle_grid_XY, toggle_grid_XZ, toggle_grid_YZ );
            } else {
              buildGrid( 0, 0, 0, toggle_grid_XY, toggle_grid_XZ, toggle_grid_YZ );
            }
          }

          focus_toggle = "off";
          if (two_models_toggle === 1){
            two_models_toggle = 2;
          }
        } else if (two_models_toggle === 2){
          two_models_toggle = 1;
        }
      });
    });

    // When the screen is cleared, remove all UI related
    // to the displayed models.
    viewer.addEventListener("clearscreen", function() {
      $("#data-range-box").hide();
      $("#color-map-box").hide();
      $("#vertex-data-wrapper").hide();
      $("#pick-value-wrapper").hide();
      $("#pick-label-wrapper").hide();
      $("#pick-x").html("");
      $("#pick-y").html("");
      $("#pick-z").html("");
      $("#pick-index").html("");
      $("#pick-value").val("");
      $("#pick-color").css("background-color", "transparent");
      $("#pick-label").html("");
      $("#intensity-data-export").hide();
      $("#annotation-media").html("");
      $("#annotation-display").hide();
      $("#annotation-wrapper").hide();
      viewer.annotations.reset();
      picked_object = null;
      marker = "";
      focus_toggle = "off";
      opacity_toggle_oncustom    = "off";
      opacity_toggle_customoff_1 = "custom";
      opacity_toggle_customoff_2 = "custom";
      axes_toggle= "off";
      clearShape("marker");
      clearShape("axes");
      clearShape("grid");
      $( ".legend" ).empty();
      $( ".grid_class" ).remove();
    });

    // When the intensity range changes, adjust the displayed spectrum.
    viewer.addEventListener("changeintensityrange", function(event) {
      var intensity_data = event.intensity_data;
      var canvas = viewer.color_map.createElement(intensity_data.range_min, intensity_data.range_max);
      canvas.id = "spectrum-canvas";
      $("#color-bar").html(canvas);
    });

    // When new intensity data is loaded, create all UI related to
    // controlling the relationship between the intensity data and
    // the color mapping (range, flip colors, clamp colors, fix range).

    viewer.addEventListener("loadintensitydata", function(event) {
      var model_data = event.model_data;
      var intensity_data = event.intensity_data;
      var container = $("#data-range");
      var headers = '<div id="data-range-multiple"><ul>';
      var controls = "";
      var i, count;
      var data_set = model_data.intensity_data;

      container.html("");
      for(i = 0, count = data_set.length; i < count; i++) {
        headers += '<li><a href="#data-file' + i + '">' + data_set[i].name + '</a></li>';
        controls += '<div id="data-file' + i + '" class="box range-controls"><div style=\"clear: both;\"><p class=\"alignleft\">';
        controls += 'Min: <input class="range-box" id="data-range-min" type="text" name="range_min" size="3" ></p></div><p class=\"alignright\">';
        controls += 'Max: <input class="range-box" id="data-range-max" type="text" name="range_max" size="3"></p>';
        controls += '<div id="range-slider' + i + '" data-blend-index="' + i + '" class="aligncenter slider"></div>';
        controls += '<input type="checkbox" class="button" id="fix_range"' +
                    (viewer.getAttribute("fix_color_range") ? ' checked="true"' : '') +
                    '><label for="fix_range">Fix Range</label>';
        controls += '<input type="checkbox" class="button" id="clamp_range"' +
                    (viewer.color_map && viewer.color_map.clamp ? ' checked="true"' : '') +
                    '><label for="clamp_range">Clamp range</label>';
        controls += '<input type="checkbox" class="button" id="flip_range"' +
                    (viewer.color_map && viewer.color_map.flip ? ' checked="true"' : '') +
                    '><label for="flip_range">Flip Colors</label>';
        controls += '</div>';
      }
      headers += "</ul>";

      container.html(headers + controls + "</div>");
      $("#data-range-box").show();
      $("#color-map-box").show();
      container.find("#data-range-multiple").tabs();

      container.find(".range-controls").each(function(index) {
        var controls = $(this);
        var intensity_data = data_set[index];

        var data_min = intensity_data.min;
        var data_max = intensity_data.max;
        var range_min = intensity_data.range_min;
        var range_max = intensity_data.range_max;
        var min_input = controls.find("#data-range-min");
        var max_input = controls.find("#data-range-max");
        var slider = controls.find(".slider");

        slider.slider({
          range: true,
          min: data_min,
          max: data_max,
          values: [range_min, range_max],
          step: (range_max - range_min) / 100.0,
          slide: function(event, ui) {
            var min = ui.values[0];
            var max = ui.values[1];
            min_input.val(min);
            max_input.val(max);
            intensity_data.range_min = min;
            intensity_data.range_max = max;

            viewer.setIntensityRange(intensity_data, min, max);
          }
        });

        slider.slider("values", 0, parseFloat(range_min));
        slider.slider("values", 1, parseFloat(range_max));
        min_input.val(range_min);
        max_input.val(range_max);

        function inputRangeChange() {
          var min = parseFloat(min_input.val());
          var max = parseFloat(max_input.val());

          slider.slider("values", 0, min);
          slider.slider("values", 1, max);
          viewer.setIntensityRange(intensity_data, min, max);
        }

        $("#data-range-min").change(inputRangeChange);
        $("#data-range-max").change(inputRangeChange);

        $("#fix_range").click(function() {
          viewer.setAttribute("fix_color_range", $(this).is(":checked"));
        });

        $("#clamp_range").change(function() {
          var min = parseFloat(min_input.val());
          var max = parseFloat(max_input.val());

          if (viewer.color_map) {
            viewer.color_map.clamp = $(this).is(":checked");
          }

          viewer.setIntensityRange(intensity_data, min, max);
        });


        $("#flip_range").change(function() {
          var min = parseFloat(min_input.val());
          var max = parseFloat(max_input.val());

          if (viewer.color_map) {
            viewer.color_map.flip = $(this).is(":checked");
          }

          viewer.setIntensityRange(intensity_data, min, max);
        });
      });


      $("#paint-value").val(intensity_data.values[0]);
      $("#paint-color").css("background-color", "#" + viewer.color_map.colorFromValue(intensity_data.values[0], {
        hex: true,
        min: intensity_data.range_min,
        max: intensity_data.range_max
      }));

      blendUI(data_set.length > 1);

    }); // end loadintensitydata listener

    viewer.addEventListener("updatecolors", function(event) {
      var model_data = event.model_data;
      var intensity_data = model_data.intensity_data[0];
      var value = parseFloat($("#pick-value").val());
      var spectrum_div = document.getElementById("color-bar");
      var min, max;
      var canvas;

      if (BrainBrowser.utils.isNumeric(value)) {
        $("#pick-color").css("background-color", "#" + viewer.color_map.colorFromValue(value, {
          hex: true,
          min: intensity_data.range_min,
          max: intensity_data.range_max
        }));
      }

      value = parseFloat($("#paint-value").val());

      if (BrainBrowser.utils.isNumeric(value)) {
        $("#paint-color").css("background-color", "#" + viewer.color_map.colorFromValue(value, {
          hex: true,
          min: intensity_data.range_min,
          max: intensity_data.range_max
        }));
      }

      if (model_data && intensity_data) {
        min = intensity_data.range_min;
        max = intensity_data.range_max;
      } else {
        min = 0;
        max = 100;
      }

      canvas = viewer.color_map.createElement(min, max);
      canvas.id = "spectrum-canvas";
      if (!spectrum_div) {
        $("<div id=\"color-bar\"></div>").html(canvas).appendTo("#data-range-box");
      } else {
        $(spectrum_div).html(canvas);
      }

    });

    viewer.addEventListener("updateintensitydata", function(event) {
      var intensity_data = event.intensity_data;
      var link = $("#intensity-data-export-link");
      var values = Array.prototype.slice.call(intensity_data.values);

      link.attr("href", BrainBrowser.utils.createDataURL(values.join("\n")));
      $("#intensity-data-export-link").attr("download", "intensity-values.txt");
      $("#intensity-data-export").show();
    });

    ////////////////////////////////////
    //  START RENDERING
    ////////////////////////////////////
    viewer.render();

    // Load a color map (required for displaying intensity data).
    // viewer.loadColorMapFromURL(BrainBrowser.config.get("color_maps")[0].url);

    ///////////////////////////////////
    // UI
    ///////////////////////////////////

    // Set the background color.
    $("#clear_color").change(function(e){

      bgcolor = parseInt($(e.target).val(), 16);
      viewer.setClearColor(bgcolor);

      if (window.axesbox !== undefined && window.axesbox.model.name === "axes_on"){
        toggle_grid_XY = ((document.getElementById("toggle_grid_XY")) && (document.getElementById("toggle_grid_XY").checked === true)) ? "off" : "on";
        toggle_grid_YZ = ((document.getElementById("toggle_grid_YZ")) && (document.getElementById("toggle_grid_YZ").checked === true)) ? "off" : "on";
        toggle_grid_XZ = ((document.getElementById("toggle_grid_XZ")) && (document.getElementById("toggle_grid_XZ").checked === true)) ? "off" : "on";

        if ((document.getElementById("grid_auto_toggle")) && ($("#grid_auto_toggle").html() === "Off")){
          grid_auto_toggle = "off";
        }
        $( ".axes_class" ).remove();
        $( ".axes_legend_class" ).remove();
        $( ".grid_class" ).remove();
        clearShape("axes");
        clearShape("grid");
        window.axesbox = undefined;
        if (picked_coords !== undefined){
          buildAxes( axes_length, picked_coords.x, picked_coords.y, picked_coords.z, toggle_grid_XY, toggle_grid_XZ, toggle_grid_YZ );
        } else {
          buildAxes( axes_length, 0, 0, 0, toggle_grid_XY, toggle_grid_XZ, toggle_grid_YZ );
        }
      }

    });

    // Reset to the default view.
    $("#resetview").click(function() {

      clearShape("marker");

      // Setting the view to its current view type will
      // automatically reset its position and opacity is reset to 100% for all shapes.
      viewer.model.userData.model_center_offset = undefined;
      viewer.setView($("[name=hem_view]:checked").val());

      viewer.model.children.forEach(function(child,i) {
        if ((child.name !== "axes") && (child.name !== "marker") && (child.name !== "grid")){
          viewer.setTransparency(1, {shape_name: child.name});
          $(".opacity-slider[data-shape-name='" + child.name + "']").slider("value", 100);
          document.getElementById("individualtoggleopacity-" + i).style.backgroundColor = "green";
          $("#individualtoggleopacity-" + i).html("On");
          document.getElementById("opacity-slider-" + i).style.visibility = "visible";
          document.getElementById("shape-" + i).style.backgroundColor = "#333333";
          document.getElementById("top-" + i).style.visibility = "hidden";
        }
      });
      window.location.hash = "#shape-0";
      window.location.hash = "#surface_choice";

      if (window.axesbox !== undefined && window.axesbox.model.name === "axes_on"){
        toggle_grid_XY = ((document.getElementById("toggle_grid_XY")) && (document.getElementById("toggle_grid_XY").checked === true)) ? "off" : "on";
        toggle_grid_YZ = ((document.getElementById("toggle_grid_YZ")) && (document.getElementById("toggle_grid_YZ").checked === true)) ? "off" : "on";
        toggle_grid_XZ = ((document.getElementById("toggle_grid_XZ")) && (document.getElementById("toggle_grid_XZ").checked === true)) ? "off" : "on";

        if ((document.getElementById("grid_auto_toggle")) && ($("#grid_auto_toggle").html() === "Off")){
          grid_auto_toggle = "off";
        }
        $( ".axes_class" ).remove();
        $( ".axes_legend_class" ).remove();
        $( ".grid_class" ).remove();
        clearShape("axes");
        clearShape("grid");
        window.axesbox = undefined;
        if (picked_coords !== undefined){
          buildAxes( axes_length, picked_coords.x, picked_coords.y, picked_coords.z, toggle_grid_XY, toggle_grid_XZ, toggle_grid_YZ );
        } else {
          buildAxes( axes_length, 0, 0, 0, toggle_grid_XY, toggle_grid_XZ, toggle_grid_YZ );
        }
      }

    });

    // Toggle opacity (custom vs. on).
    $("#toggleopacitycustom").click(function() {

      if (  opacity_toggle_oncustom === "custom") {
        viewer.model.children.forEach(function(child,i) {
          if ((child.name !== "axes") && (child.name !== "marker") && (child.name !== "grid")){
            var alpha = slider_backup[child.name] / 100;
            viewer.setTransparency(alpha, {shape_name: child.name});
            $(".opacity-slider[data-shape-name='" + viewer.model.children[i].name + "']").slider("value", slider_backup[child.name]);
            $("#individualtoggleopacity-" + i).html(on_off_backup[i]);
            if (on_off_backup[i] === "On"){
              document.getElementById("individualtoggleopacity-" + i).style.backgroundColor = "green";
              document.getElementById("opacity-slider-" + i).style.visibility = "visible";
            } else {
              document.getElementById("individualtoggleopacity-" + i).style.backgroundColor = "red";
              document.getElementById("opacity-slider-" + i).style.visibility = "hidden";
              viewer.setTransparency(0, {shape_name: child.name});
            }
          }
        });
        if (marker !== ""){
          viewer.setTransparency(picked_object.material.opacity, {shape_name: "marker"});
        }
        opacity_toggle_oncustom = "on";
      } else if (  opacity_toggle_oncustom === "on"){
        if (marker !== ""){
          viewer.setTransparency(1, {shape_name: "marker"});
        }
        viewer.model.children.forEach(function(child,i) {
          if ((child.name !== "axes") && (child.name !== "marker") && (child.name !== "grid")){
            slider_backup[child.name] = $(".opacity-slider[data-shape-name='" + child.name + "']").slider("value");
            on_off_backup[i] = $("#individualtoggleopacity-" + i).html();
            viewer.setTransparency(1, {shape_name: child.name});
            $(".opacity-slider[data-shape-name='" + child.name + "']").slider("value", 100);
            document.getElementById("individualtoggleopacity-" + i).style.backgroundColor = "green";
            $("#individualtoggleopacity-" + i).html("On");
            document.getElementById("opacity-slider-" + i).style.visibility = "visible";
          }
        });
        opacity_toggle_oncustom = "custom";
      }
    });

    // Set the visibility of the currently loaded model.
    $(".visibility").change(function() {
      var input  = $(this);
      var hemisphere = input.data("hemisphere");
      var shape = viewer.model.getObjectByName(hemisphere);

      if (!shape) return;

      shape.visible = input.is(":checked");

      viewer.updated = true;
    });

    // Set the view type (medial, lateral,
    // inferior, anterior, posterior).
    $("[name=hem_view]").change(function() {
      viewer.setView($("[name=hem_view]:checked").val());
    });

    document.getElementById('meshmode').onclick = (function(){
      var i = 0;
      var states = ["wireframe_off", "wireframe_on", "wireframe_mixed"];

      return function(){
        // Increment the counter, but don't let it exceed the maximum index
        i = ++i % states.length;
        var state  = states[i];
        var elem   = $("#meshmode");
        elem.value = state;
        elem.removeClass();
        elem.toggleClass(state);
        if (state === "wireframe_off") {
          viewer.setWireframe(false);
        } else if (state === "wireframe_on") {
          viewer.setWireframe(true);
        } else {
          viewer.setWireframe(true, { keep_surface: true});
        }
      };
    })();

    // Toggle 3D anaglyph effect.
    $("#threedee").change(function() {
      viewer.setEffect($(this).is(":checked") ? "AnaglyphEffect" : "None");
    });

    // Grab a screenshot of the canvas.
    $("#screenshot").click(function() {
      var dom_element = viewer.dom_element;
      var canvas = document.createElement("canvas");
      var spectrum_canvas = document.getElementById("spectrum-canvas");
      var context = canvas.getContext("2d");
      var viewer_image = new Image();

      canvas.width = dom_element.offsetWidth;
      canvas.height = dom_element.offsetHeight;

      // Display the final image in a dialog box.
      function displayImage() {
        var result_image = new Image();

        result_image.onload = function() {
          $("<div></div>").append(result_image).dialog({
            title: "Screenshot",
            height: result_image.height,
            width: result_image.width
          });
        };
        result_image.src = canvas.toDataURL();
      }

      // Grab the spectrum canvas to display with the
      // image.
      function getSpectrumImage() {
        var spectrum_image = new Image();
        spectrum_image.onload = function(){
          context.drawImage(spectrum_image, 0, 0);
          displayImage();
        };
        spectrum_image.src = spectrum_canvas.toDataURL();
      }

      // Draw an image of the viewer area, add the spectrum
      // image if it's available, and display everything
      // in a dialog box.
      viewer_image.onload = function(){
        context.drawImage(viewer_image, 0, 0);
        if ($(spectrum_canvas).is(":visible")) {
          getSpectrumImage();
        } else {
          displayImage();
        }
      };

      viewer_image.src = viewer.canvasDataURL();

      var url = viewer_image.src.replace(/^data:image\/[^;]/, "data:application/octet-stream");

      saveAs(url, "Screenshot.png");

      function saveAs(uri, filename) {
        var link = document.createElement("a");
        if (typeof link.download === "string") {
          document.body.appendChild(link); //Firefox requires the link to be in the body
          link.download = filename;
          link.href = uri;
          link.click();
          document.body.removeChild(link); //remove the link when done
        } else {
          location.replace(uri);
        }
      }

    });

    // Control autorotation.
    $("#autorotate-controls").children().change(function() {
      viewer.autorotate.x = $("#autorotateX").is(":checked");
      viewer.autorotate.y = $("#autorotateY").is(":checked");
      viewer.autorotate.z = $("#autorotateZ").is(":checked");
      window.axesbox.autorotate.x = $("#autorotateX").is(":checked");
      window.axesbox.autorotate.y = $("#autorotateY").is(":checked");
      window.axesbox.autorotate.z = $("#autorotateZ").is(":checked");
    });

    // Toggle axes.
    $("#toggle-axes").click(function() {
      if (axes_toggle === "off"){
        if (picked_coords !== undefined){
          buildAxes( axes_length, picked_coords.x, picked_coords.y, picked_coords.z, toggle_grid_XY, toggle_grid_XZ, toggle_grid_YZ );
        } else {
          buildAxes( axes_length, 0, 0, 0, toggle_grid_XY, toggle_grid_XZ, toggle_grid_YZ );
        }
        axes_toggle = "on";
      } else {
        toggle_grid_XY = ((document.getElementById("toggle_grid_XY")) && (document.getElementById("toggle_grid_XY").checked === true)) ? "off" : "on";
        toggle_grid_YZ = ((document.getElementById("toggle_grid_YZ")) && (document.getElementById("toggle_grid_YZ").checked === true)) ? "off" : "on";
        toggle_grid_XZ = ((document.getElementById("toggle_grid_XZ")) && (document.getElementById("toggle_grid_XZ").checked === true)) ? "off" : "on";

        if ((document.getElementById("grid_auto_toggle")) && ($("#grid_auto_toggle").html() === "Off")){
          grid_auto_toggle = "off";
        }
        $( ".axes_class" ).remove();
        $( ".axes_legend_class" ).remove();
        $( ".grid_class" ).remove();
        clearShape("axes");
        clearShape("grid");
        window.axesbox = undefined;
        axes_toggle = "off";
        if (marker !== ""){
          marker = viewer.drawDot(picked_coords.x, picked_coords.y, picked_coords.z, 0.3);
          marker.name = "marker";
          viewer.setTransparency(picked_object.material.opacity, {shape_name: "marker"});
        }
      }
    });

    // Remove currently loaded models.
    $("#clearshapes").click(function() {
      viewer.clearScreen();
      current_request = 0;
      current_request_name = "";
      loading_div.hide();
      $( ".select-cell" ).empty();
      m=0;
      $( ".per_vertex_class" ).remove();
    });

    $("#brainbrowser").click(function(event) {
      if (!event.shiftKey && !event.ctrlKey) return;
      if (viewer.model.children.length === 0) return;

      if (two_models_toggle < 2) {
        // searchshapes.value = "";

        clearShape("marker");

        viewer.model.children.forEach(function(child) {
          if ((child.name !== "axes") && (child.name !== "marker") && (child.name !== "grid")){
            slider_backup[child.name] = $(".opacity-slider[data-shape-name='" + child.name + "']").slider("value");
          }
        });

        pick(viewer.mouse.x, viewer.mouse.y, event.ctrlKey);

        if (picked_object === null) {
          marker = "";
          clearShape("marker");
          return;
        } else {
          searchshapes_value_long = picked_object.name;

          viewer.model.children.forEach(function(child,i) {
            if ((child.name !== "axes") && (child.name !== "marker") && (child.name !== "grid")){
              if (child.name === picked_object.name) {
                for (var n = 1; n < m+1; n++) {
                  $("#shapes-" + n + " .shape").each(function() {
                    if (this.id === "shape-" + i){
                      $("ul.tabs li").removeClass("current");
                      $(".tab-content").removeClass("current");
                      $("#tabid-"+n).addClass("current");
                      $("#shapes-"+n).addClass("current");
                    }
                  });
                }
                window.location.hash = "#shape-" + i;
                window.location.hash = "#views";
                document.getElementById("shape-" + i).style.backgroundColor = "#1E8FFF";
                document.getElementById("top-" + i).style.visibility        = "visible";

                // Change Center of roration
                var offset = viewer.model.userData.model_center_offset || new THREE.Vector3(0,0,0);
                var center = new THREE.Vector3(parseFloat($("#pick-x").html()) + -offset.x, parseFloat($("#pick-y").html()) + -offset.y, parseFloat($("#pick-z").html()) + -offset.z);
                changeCenterRotation(center);
//viewer.model.children[i].renderDepth = 1;
              } else {   //focus selected object, no need for shift-click
                document.getElementById("shape-" + i).style.backgroundColor = "#333333";
                document.getElementById("top-" + i).style.visibility = "hidden";
//viewer.model.children[i].renderDepth = null;
              }
            }
          });
        }

        if (m_selected === 1 ){
          picked_coords.subVectors(picked_coords, offset_old);
        } else if (m_selected === 2){
          if (two_models_toggle === 1){
            picked_coords.subVectors(picked_coords, offset_old);
          }
        }
        focus_toggle = "on";
        clearShape("marker");
        if ((viewer.model.children[viewer.model.children.length-1].name !== "marker") && (viewer.model.children[viewer.model.children.length-2].name !== "marker")){
          marker = viewer.drawDot(picked_coords.x, picked_coords.y, picked_coords.z, 0.3);
          marker.name = "marker";
          viewer.setTransparency(picked_object.material.opacity, {shape_name: "marker"});
          focus_toggle = "off";
          if (window.axesbox !== undefined && window.axesbox.model.name === "axes_on"){
            toggle_grid_XY = ((document.getElementById("toggle_grid_XY")) && (document.getElementById("toggle_grid_XY").checked === true)) ? "off" : "on";
            toggle_grid_YZ = ((document.getElementById("toggle_grid_YZ")) && (document.getElementById("toggle_grid_YZ").checked === true)) ? "off" : "on";
            toggle_grid_XZ = ((document.getElementById("toggle_grid_XZ")) && (document.getElementById("toggle_grid_XZ").checked === true)) ? "off" : "on";

            if ((document.getElementById("grid_auto_toggle")) && ($("#grid_auto_toggle").html() === "Off")){
              grid_auto_toggle = "off";
            }

            $( ".axes_class" ).remove();
            $( ".axes_legend_class" ).remove();
            $( ".grid_class" ).remove();
            clearShape("axes");
            clearShape("grid");
            window.axesbox = undefined;
            buildAxes( axes_length, picked_coords.x, picked_coords.y, picked_coords.z, toggle_grid_XY, toggle_grid_XZ, toggle_grid_YZ );
          }
        }
      } else if (two_models_toggle === 2) {
        two_models_toggle = 1;
      }
    });

    // Load a new model from a file that the user has previously selected (only applies for a page reload).
    $("#obj_file_submit").click(function() {

      $( ".per_vertex_class" ).remove();

      if (document.getElementById("objfile").value === ""){
        window.alert("Please select a file!");
        return;
      }

      var format = $(this).closest(".file-select").find("option:selected").val();

      if (format !== 'unknown') {
        viewer.model.userData.model_center_offset = undefined;
        showLoading();
        viewer.loadModelFromFile(document.getElementById("objfile"), {
          format: format,
          complete: function() {
            hideLoading();
            viewer.modelCentric();
            picked_coords   = viewer.model.userData.model_center;
          }
        });
      }

      if ((format === "mniobj") || (format === "freesurferasc") ){
        var per_vertex_div = $("<div class=\"per_vertex_class\"><div id=\"per_vertex_file_select\" class=\"file-select\">Per vertex data: <div id=\"browse_per_vertex_data\">" +
          "<input id=\"datafile\" type =\"file\" name=\"datafile\"></input></div></div>" +
          "<div id=\"tmp\" class=\"file-select\">Format:  <select id=\"data-file-format\" class=\"file-format\" name=\"format\">" +
          "<option value=\"text\">Text</option>" +
          "<option value=\"freesurferasc\">Freesurfer ASC</option>" +
          "</select></div>" +
          "<div id=\"data-submit\" class=\"file-submit-div\"><span id=\"data_submit_load\" class=\"button file-submit\">Load</span> " +
          "<span id=\"data_submit_clear\" class=\"button\">Unload All</span>" +
          "</div>");
        per_vertex_div.appendTo("#surface_choice");
        if (format === "freesurferasc"){
          document.getElementById("data-file-format").value = 'freesurferasc';
        }
      } else {
        $( ".per_vertex_class" ).remove();
      }

      $("#browse_per_vertex_data").change(function() {

        // Attempt to automatically detect filetype based on filename extension.
        var datafilename = document.getElementById("datafile").value;

        if (datafilename.indexOf(".txt") > -1){
          document.getElementById("data-file-format").value = 'text';
        } else if (datafilename.indexOf(".asc") > -1){
          document.getElementById("data-file-format").value = 'freesurferasc';
        }

        var file = document.getElementById("datafile");

        //Color map
        var data_range_div = $("<div class=\"data-range-class\"><div id=\"data-range-box\"><br><div id=\"data-range\"></div><div id=\"blend-box\"></div></div></div>");

        data_range_div.appendTo("#data-submit");

        var color_div = $("<div id=\"color_map_file_select\" class=\"file-select\">Color map: <select id=\"color-map-select\">" +
          "<option value=\"color-maps/spectral.txt\">Spectral</option>" +
          "<option value=\"color-maps/thermal.txt\">Thermal</option>" +
          "<option value=\"color-maps/gray-scale.txt\">Gray</option>" +
          "<option value=\"color-maps/blue.txt\">Blue</option>" +
          "<option value=\"color-maps/green.txt\">Green</option>" +
          "</select></div>");

        color_div.appendTo("#data-range-box");

        //Default: spectral.
        viewer.loadColorMapFromURL("color-maps/spectral.txt");

        $("#color-map-select").change(function() {
          viewer.loadColorMapFromURL($(this).val());
        });

        viewer.loadIntensityDataFromFile(file, {
          format: document.getElementById("data-file-format").value,
          blend: true
        });

      });

      $("#data_submit_load").click(function() {

        var file = document.getElementById("datafile");

        //Color map
        var data_range_div = $("<div class=\"data-range-class\"><div id=\"data-range-box\"><br><div id=\"data-range\"></div><div id=\"blend-box\"></div></div></div>");

        data_range_div.appendTo("#data-submit");

        var color_div = $("<div id=\"color_map_file_select\" class=\"file-select\">Color map: <select id=\"color-map-select\">" +
          "<option value=\"color-maps/spectral.txt\">Spectral</option>" +
          "<option value=\"color-maps/thermal.txt\">Thermal</option>" +
          "<option value=\"color-maps/gray-scale.txt\">Gray</option>" +
          "<option value=\"color-maps/blue.txt\">Blue</option>" +
          "<option value=\"color-maps/green.txt\">Green</option>" +
          "</select></div>");

        color_div.appendTo("#data-range-box");

  //Default: spectral.
        viewer.loadColorMapFromURL("color-maps/spectral.txt");

        $("#color-map-select").change(function() {
          viewer.loadColorMapFromURL($(this).val());
        });

        viewer.loadIntensityDataFromFile(file, {
          format: document.getElementById("data-file-format").value,
          blend: true
        });
      });

      $("#data_submit_clear").click(function() {
        viewer.clearScreen2();
        showLoading();
        viewer.model.userData.model_center_offset = undefined;
        viewer.loadModelFromFile(document.getElementById("objfile"), {
          format: format,
          complete: function() {
            hideLoading();
            viewer.modelCentric();
            picked_coords   = viewer.model.userData.model_center;
          }
        });
        $(".data-range-class").remove();
      });

      return false;
    });

    // Load a new model from a file that the user has just selected.

    $("#browse_obj_file").change(function() {

      $( ".per_vertex_class" ).remove();

      // Attempt to automatically detect filetype based on filename extension.  May be incorrect for Wavefront OBJ, but we use MNI OBJ more often.
      var filename = document.getElementById("objfile").value;

      if (filename.indexOf(".json") > -1){
        document.getElementById("obj_file_format").value = 'json';
      } else if (filename.indexOf(".asc") > -1){
        document.getElementById("obj_file_format").value = 'freesurferasc';
      } else {
        document.getElementById("obj_file_format").value = 'unknown';
      }

      var format = $(this).closest(".file-select").find("option:selected").val();

      // No autoload for unknow format and mniobj format
      if (format !== 'unknown') {
        showLoading();
        viewer.model.userData.model_center_offset = undefined;
        viewer.loadModelFromFile(document.getElementById("objfile"), {
          format: format,
          complete: function() {
            hideLoading();
            viewer.modelCentric();
            picked_coords   = viewer.model.userData.model_center;
          }
        });
      }

      if ((format === "mniobj") || (format === "freesurferasc")){
        var per_vertex_div = $("<div class=\"per_vertex_class\"><div id=\"per_vertex_file_select\" class=\"file-select\">Per vertex data: <div id=\"browse_per_vertex_data\">" +
          "<input id=\"datafile\" type =\"file\" name=\"datafile\"></input></div></div>" +
          "<div id=\"tmp\" class=\"file-select\">Format:  <select id=\"data-file-format\" class=\"file-format\" name=\"format\">" +
          "<option value=\"text\">Text</option>" +
          "<option value=\"freesurferasc\">Freesurfer ASC</option>" +
          "</select></div>" +
          "<div id=\"data-submit\" class=\"file-submit-div\"><span id=\"data_submit_load\" class=\"button file-submit\">Load</span> " +
          "<span id=\"data_submit_clear\" class=\"button\">Unload All</span>" +
          "</div>");

        per_vertex_div.appendTo("#surface_choice");
        if (format === "freesurferasc"){
          document.getElementById("data-file-format").value = 'freesurferasc';
        }
      } else {
        $( ".per_vertex_class" ).remove();
      }

      $("#browse_per_vertex_data").change(function() {

        // Attempt to automatically detect filetype based on filename extension.  May be incorrect for Wavefront OBJ, but we use MNI OBJ more often.
        var datafilename = document.getElementById("datafile").value;

        if (datafilename.indexOf(".txt") > -1){
          document.getElementById("data-file-format").value = 'text';
        } else if (datafilename.indexOf(".asc") > -1){
          document.getElementById("data-file-format").value = 'freesurferasc';
        }

      });

      $("#data_submit_load").click(function() {

        var file = document.getElementById("datafile");

        //Color map
        var data_range_div = $("<div class=\"data-range-class\"><div id=\"data-range-box\"><br><div id=\"data-range\"></div><div id=\"blend-box\"></div></div></div>");

        data_range_div.appendTo("#data-submit");

        var color_div = $("<div id=\"color_map_file_select\" class=\"file-select\">Color map: <select id=\"color-map-select\">" +
          "<option value=\"color-maps/spectral.txt\">Spectral</option>" +
          "<option value=\"color-maps/thermal.txt\">Thermal</option>" +
          "<option value=\"color-maps/gray-scale.txt\">Gray</option>" +
          "<option value=\"color-maps/blue.txt\">Blue</option>" +
          "<option value=\"color-maps/green.txt\">Green</option>" +
          "</select></div>");

        color_div.appendTo("#data-range-box");

        //Default: spectral.
        viewer.loadColorMapFromURL("color-maps/spectral.txt");

        $("#color-map-select").change(function() {
          viewer.loadColorMapFromURL($(this).val());
        });

        viewer.loadIntensityDataFromFile(file, {
          format: document.getElementById("data-file-format").value,
          blend: true
        });
      });

      $("#data_submit_clear").click(function() {
        viewer.clearScreen2();
        showLoading();
        viewer.model.userData.model_center_offset = undefined;
        viewer.loadModelFromFile(document.getElementById("objfile"), {
          format: format,
          complete: function() {
            hideLoading();
            viewer.modelCentric();
            picked_coords   = viewer.model.userData.model_center;
          }
        });
        $(".data-range-class").remove();
      });

      return false;
    });



    $("#pick-value").change(function() {
      var index = parseInt($("#pick-index").html(), 10);
      var value = parseFloat(this.value);
      var intensity_data = viewer.model_data.getDefaultIntensityData();

      if (BrainBrowser.utils.isNumeric(index) && BrainBrowser.utils.isNumeric(value)) {
        viewer.setIntensity(intensity_data, index, value);
      }
    });

    $("#paint-value").change(function() {
      var value = parseFloat(this.value);
      var intensity_data = viewer.model_data.getDefaultIntensityData();

      if (BrainBrowser.utils.isNumeric(value)) {
        $("#paint-color").css("background-color", "#" + viewer.color_map.colorFromValue(value, {
          hex: true,
          min: intensity_data.range_min,
          max: intensity_data.range_max
        }));
      }
    });

    $("#annotation-save").click(function() {
      var vertex_num = parseInt($("#pick-index").html(), 10);
      var annotation_display = $("#annotation-display");
      var media = $("#annotation-media");

      var annotation, annotation_data;
      var vertex;

      if (BrainBrowser.utils.isNumeric(vertex_num)) {
        annotation = viewer.annotations.get(vertex_num, {
          model_name: picked_object.model_name
        });

        if (annotation) {
          annotation_data = annotation.annotation_info.data;
        } else {
          annotation_data = {};
          viewer.annotations.add(vertex_num, annotation_data, {
            model_name: picked_object.model_name
          });
        }

        vertex = viewer.getVertex(vertex_num);

        annotation_data.image = $("#annotation-image").val();
        annotation_data.url   = $("#annotation-url").val();
        annotation_data.text  = $("#annotation-text").val();

        media.html("");

        if (annotation_data.image) {
          var image = new Image();
          image.width = 200;
          image.src = annotation_data.image;
          annotation_display.show();
          media.append(image);
        }
        if (annotation_data.url) {
          annotation_display.show();
          media.append($('<div><a href="' + annotation_data.url + '" target="_blank">' + annotation_data.url + '</a></div>'));
        }

        if (annotation_data.text) {
          annotation_display.show();
          media.append($('<div>' + annotation_data.text + '</div>'));
        }
      }
    });

    function pick(x, y, vertex) {
      if (viewer.model.children.length === 0) return;

      var annotation_display = $("#annotation-display");
      var media = $("#annotation-media");
      var model_data_get_selected;

      if (m_selected === 1 ){
        model_data_get_selected = m1_model_data_get;
      } else if (m_selected === 2 ){
        model_data_get_selected = m2_model_data_get;
      }

      // Get information about picked vertex
      var pick_info;
      if (vertex !== undefined && !((/^\d+$/.test(vertex) ))) {
        pick_info = viewer.pick(x, y);
      } else if (vertex !== undefined && ((/^\d+$/.test(vertex) ))) {
        pick_info = viewer.pickByVertex(vertex, {model_name: model_data_get_selected.name});
      }

      var model_data, intensity_data;
      var annotation_info;
      var value, label, text;

      if (pick_info) {

        //Remove trailing shape number after the last dash if it hasn't been done already (just for display purposes to the user)
        searchshapes_value =  pick_info.object.name;
        var obj_name_short;
        var matches = pick_info.object.name.match(/-/g);
        if (matches.length === 2){
          var n = pick_info.object.name.lastIndexOf("-");
          obj_name_short = pick_info.object.name.substr(0,n);
        }

        $("#pick-name").html(obj_name_short);
        $("#pick-shape-number").html(shapeNumber(pick_info.object.name));
        $("#pick-x").html(pick_info.point.x.toPrecision(4));
        $("#pick-y").html(pick_info.point.y.toPrecision(4));
        $("#pick-z").html(pick_info.point.z.toPrecision(4));
        $("#pick-index").html(pick_info.index);
        $("#annotation-wrapper").show();
        picked_object  = pick_info.object;
        picked_coords  = pick_info.point;
        model_data     = viewer.model_data.get(picked_object.userData.model_name);
        intensity_data = model_data.intensity_data[0];

        if (intensity_data) {
          if (event.ctrlKey) {
            value = parseFloat($("#paint-value").val());

            if (BrainBrowser.utils.isNumeric(value)) {
              viewer.setIntensity(intensity_data, pick_info.index, value);
            }
          }

          value = intensity_data.values[pick_info.index];
          $("#pick-value").val(value.toString().slice(0, 7));
          $("#pick-color").css("background-color", "#" + viewer.color_map.colorFromValue(value, {
            hex: true,
            min: intensity_data.range_min,
            max: intensity_data.range_max
          }));
          label = atlas_labels[value];
          if (label) {
            text = label + '<BR><a target="_blank" href="http://www.ncbi.nlm.nih.gov/pubmed/?term=' +
              label.split(/\s+/).join("+") +
              '">Search on PubMed</a>';
            text += '<BR><a target="_blank" href="http://scholar.google.com/scholar?q=' +
              label.split(/\s+/).join("+") +
              '">Search on Google Scholar</a>';
          } else {
            text = "None";
          }
          $("#pick-label").html(text);
        }

        annotation_info = pick_info.object.userData.annotation_info;

        if (annotation_info) {
          viewer.annotations.activate(annotation_info.vertex, {
            model_name: annotation_info.model_name
          });
        } else {
          annotation_info = { data : {} };
        }

        $("#annotation-image").val(annotation_info.data.image);
        $("#annotation-url").val(annotation_info.data.url);
        $("#annotation-text").val(annotation_info.data.text);

        annotation_display.hide();
        media.html("");

        if (annotation_info.data.image) {
          var image = new Image();
          image.height = 200;
          image.src = annotation_info.data.image;
          annotation_display.show();
          media.append(image);
        }
        if (annotation_info.data.url) {
          annotation_display.show();
          media.append($('<div><a href="' + annotation_info.data.url + '" target="_blank">' + annotation_info.data.url + '</a></div>'));
        }

        if (annotation_info.data.text) {
          annotation_display.show();
          media.append($('<div>' + annotation_info.data.text + '</div>'));
        }

      } else {
        picked_object = null;

        $("#pick-name").html("");
        $("#pick-shape-number").html("");
        $("#pick-x").html("");
        $("#pick-y").html("");
        $("#pick-z").html("");
        $("#pick-index").html("");
        $("#annotation-wrapper").hide();
      }
    }

    function shapeNumber(name) {
      var children = viewer.model.children;
      var i, count;

      for (i = 0, count = children.length; i < count; i++) {
        if (children[i].name === name) {
          return i + 1;
        }
      }
    }

    function clearShape(name) {
      var axesbox = window.axesbox;
      if ((name === "axes") && (axesbox !== undefined)){
        axesbox.model.children.forEach(function(child,i) {

          if (child.name === name) {
            axesbox.model.children.splice(i, 1);
            axesbox.updated = true;
          }
        });
      } else {  //marker or grid
        viewer.model.children.forEach(function(child,i) {

          if (child.name === name) {
            viewer.model.children.splice(i, 1);
            viewer.updated = true;
          }
        });
      }
    }

    function buildAxes( length, x, y, z, toggle_grid_XY, toggle_grid_XZ, toggle_grid_YZ ) {

      var font_color;

      if ((bgcolor === 16777215) || (bgcolor === 16776960) || (bgcolor === 65535)){  // if white / yellow / cyan bg
        font_color = "black";
      } else {
        font_color = "white";
      }

      var axes_all = new THREE.Object3D();
      axes_all.name = "axes";
      var origin_y = 0;

      var colors = getColorAxes();

      axes_all.add( buildAxis( new THREE.Vector3( 0, origin_y, 0 ), new THREE.Vector3( -length, origin_y, 0 ),     colors.three_x, false ) ); // +X right
      axes_all.add( buildAxis( new THREE.Vector3( 0, origin_y, 0 ), new THREE.Vector3( length, origin_y, 0 ),      colors.three_x, true) );   // -X left
      axes_all.add( buildAxis( new THREE.Vector3( 0, origin_y, 0 ), new THREE.Vector3( 0, length + origin_y, 0 ),  colors.three_y, false ) ); // +Y anterior
      axes_all.add( buildAxis( new THREE.Vector3( 0, origin_y, 0 ), new THREE.Vector3( 0, -length + origin_y, 0 ), colors.three_y, true ) );  // -Y posterior
      axes_all.add( buildAxis( new THREE.Vector3( 0, origin_y, 0 ), new THREE.Vector3( 0, origin_y, length ),      colors.three_z, false ) ); // +Z dorsal
      axes_all.add( buildAxis( new THREE.Vector3( 0, origin_y, 0 ), new THREE.Vector3( 0, origin_y, -length ),     colors.three_z, true ) );  // -Z ventral

      var axes_div = $("<div class=\"axes_class\"><div id=\"axes\"></div></div><div class=\"axes_legend_class\"><div id=\"axes_legend\"></div></div>");
      axes_div.appendTo("#vertex-data-wrapper");

      if (window.axesbox === undefined){
        window.axesbox = BrainBrowser.SurfaceViewer.start("axes", function(axesbox) {
          axesbox.render();
          axesbox.setClearColor(0, 0);
          axesbox.updated = true;
        });
        window.axesbox.model_data.related_models = [viewer.model];
        viewer.model_data.related_models         = [window.axesbox.model];
      }

      window.axesbox.model.add(axes_all);
      window.axesbox.model.rotation.x = viewer.model.rotation.x;
      window.axesbox.model.rotation.y = viewer.model.rotation.y;
      window.axesbox.model.rotation.z = viewer.model.rotation.z;
      window.axesbox.model.name = "axes_on";
      window.axesbox.setClearColor(0, 0);

      legend_div = $("<div class=\"legend\"><div id=\"dorsal_legend\"><p class=\"alignleft\">Dorsal</p><p class=\"alignright\"><canvas id=\"dorsal\"></canvas></p></div><div style=\"clear: both;\"></div>" +
        "<div id=\"ventral_legend\"><p class=\"alignleft\">Ventral</p><p class=\"alignright\"><canvas id=\"ventral\"></canvas></p></div><div style=\"clear: both;\"></div>" +
        "<div id=\"anterior_legend\"><p class=\"alignleft\">Anterior</p><p class=\"alignright\"><canvas id=\"anterior\"></canvas></p></div><div style=\"clear: both;\"></div>" +
        "<div id=\"posterior_legend\"><p class=\"alignleft\">Posterior</p><p class=\"alignright\"><canvas id=\"posterior\"></canvas></p></div><div style=\"clear: both;\"></div>" +
        "<div id=\"left_legend\"><p class=\"alignleft\">Left</p><p class=\"alignright\"><canvas id=\"left\"></canvas></p></div><div style=\"clear: both;\"></div>" +
        "<div id=\"right_legend\"><p class=\"alignleft\">Right</p><p class=\"alignright\"><canvas id=\"right\"></canvas></p></div><div style=\"clear: both;\"></div></div>");
      legend_div.appendTo("#axes_legend");

      drawDashed("right",    colors.x,8);
      drawDashed("left",     colors.x,150);
      drawDashed("anterior", colors.y,150);
      drawDashed("posterior",colors.y,8);
      drawDashed("dorsal",   colors.z,150);
      drawDashed("ventral",  colors.z,8);

      document.getElementById("dorsal_legend").style.color    = font_color;
      document.getElementById("ventral_legend").style.color   = font_color;
      document.getElementById("anterior_legend").style.color  = font_color;
      document.getElementById("posterior_legend").style.color = font_color;
      document.getElementById("left_legend").style.color      = font_color;
      document.getElementById("right_legend").style.color     = font_color;

      // Grid / perspective axes
      var grid_div = $("<div class=\"grid_class\"><div id=\"grid\"><p class=\"alignleft\">Grid scale: <span title=\"Type in value to change default of 10\">" +
                       "<input id=\"grid_partitions\" type=\"text\" value=\"" + grid_partitions + "\" style=\"width: 70px;\"></span>" +
                       " units</p><div style=\"clear: both;\"></div></div></div>");

      var grid_length_div = $("<br><div id=\"grid_length\"><p class=\"alignleft\">Grid length: <span title=\"Type in value to change default of 100\">" +
                       "<input id=\"grid_length_user_input\" type=\"text\" value=\"" + grid_length + "\" style=\"width: 70px;\"></span>" +
                       " units</p><div style=\"clear: both;\"></div>" +
                       "<br>Grid plane toggle: <span id=\"autorotate-controls\" class=\"buttonset\"><input type=\"checkbox\" id=\"toggle_grid_YZ\" class=\"icon\"><label for=\"toggle_grid_YZ\">X</label>" +
                       "<span id=\"autorotate-controls\" class=\"buttonset\"> <input type=\"checkbox\" id=\"toggle_grid_XZ\" class=\"icon\"><label for=\"toggle_grid_XZ\">Y</label>" +
                       "<span id=\"autorotate-controls\" class=\"buttonset\"> <input type=\"checkbox\" id=\"toggle_grid_XY\" class=\"icon\"><label for=\"toggle_grid_XY\">Z</label></span>" +
                       "<br><br>Grid auto-resize toggle: <a id=\"grid_auto_toggle\" class=\"on-off-button\">On</a></div>");

      grid_div.appendTo("#vertex-data-wrapper");
      grid_length_div.appendTo("#grid");

      if (toggle_grid_XY === "off"){
        document.getElementById("toggle_grid_XY").checked = true;
      }
      if (toggle_grid_YZ === "off"){
        document.getElementById("toggle_grid_YZ").checked = true;
      }
      if (toggle_grid_XZ === "off"){
        document.getElementById("toggle_grid_XZ").checked = true;
      }

      if (grid_auto_toggle === "off"){
        document.getElementById("grid_auto_toggle").style.backgroundColor = "red";
        $("#grid_auto_toggle").html("Off");
      }

      $("#grid_auto_toggle").click(function() {
        if ($(this).html() === "On"){
          document.getElementById("grid_auto_toggle").style.backgroundColor = "red";
          $(this).html("Off");
          grid_auto_toggle = "off";
        } else if ($(this).html() === "Off"){
          document.getElementById("grid_auto_toggle").style.backgroundColor = "green";
          $(this).html("On");
          grid_auto_toggle = "on";
        }
      });

      document.getElementById("grid").style.color        = font_color;
      document.getElementById("grid_length").style.color = font_color;

      $("#grid_partitions").keyup(function(event){
        if(event.keyCode === 13){  //if enter key is pressed
          user_defined_grid_partitions = "yes";
          if (document.getElementById("grid_partitions").value !== ""){
            grid_partitions = parseInt(document.getElementById("grid_partitions").value,10);
            clearShape("grid");
            buildGrid(x, y, z, toggle_grid_XZ, toggle_grid_XY, toggle_grid_YZ);
          }
        }
      });

      $("#grid_length_user_input").keyup(function(event){
        if(event.keyCode === 13){  // if enter key is pressed
          if (document.getElementById("grid_length_user_input").value !== ""){
            user_defined_grid_length = "yes";
            grid_length = parseInt(document.getElementById("grid_length_user_input").value,10);
            clearShape("grid");
            buildGrid(x, y, z, toggle_grid_XZ, toggle_grid_XY, toggle_grid_YZ);
          }
          else {
            user_defined_grid_length = "no";
            clearShape("grid");
            buildGrid(x, y, z, toggle_grid_XZ, toggle_grid_XY, toggle_grid_YZ);
          }
        }
      });

      $("#toggle_grid_XY").click(function() {
        if (toggle_grid_XY === "on"){
          toggle_grid_XY = "off";
        } else {
          toggle_grid_XY = "on";
        }
        clearShape("grid");
        buildGrid(x, y, z, toggle_grid_XZ, toggle_grid_XY, toggle_grid_YZ);
      });

      $("#toggle_grid_XZ").click(function() {
        if (toggle_grid_XZ === "on"){
          toggle_grid_XZ = "off";
        } else {
          toggle_grid_XZ = "on";
        }
        clearShape("grid");
        buildGrid(x, y, z, toggle_grid_XZ, toggle_grid_XY, toggle_grid_YZ);
      });

      $("#toggle_grid_YZ").click(function() {
        if (toggle_grid_YZ === "on"){
          toggle_grid_YZ = "off";
        } else {
          toggle_grid_YZ = "on";
        }
        clearShape("grid");
        buildGrid(x, y, z, toggle_grid_XZ, toggle_grid_XY, toggle_grid_YZ);
      });

      buildGrid(x, y, z, toggle_grid_XZ, toggle_grid_XY, toggle_grid_YZ);
    }

    function getColorAxes () {
      var colors = {};

      // Default color
      colors.x = "#f0f"; // magenta
      colors.y = "#ff0"; // yellow
      colors.z = "#0ff"; //cyan

      // Change some color if bg === color
      if        (bgcolor === 16711935) { // magenta
        colors.x = "#000"; // black
      } else if (bgcolor === 16776960) { // yellow
        colors.y = "#000"; // black
      } else if (bgcolor === 65535)    { // cyan
        colors.z = "#000"; // black
      }


      colors.three_x =  new THREE.Color(colors.x);
      colors.three_y =  new THREE.Color(colors.y);
      colors.three_z =  new THREE.Color(colors.z);

      return colors;
    }

    function buildGrid(x, y, z, toggle_grid_XZ, toggle_grid_XY, toggle_grid_YZ){
      var colors = getColorAxes();

      if (grid_auto_toggle === "on") {
        bounding_box_min_x = [];
        bounding_box_max_x = [];
        bounding_box_min_y = [];
        bounding_box_max_y = [];
        bounding_box_min_z = [];
        bounding_box_max_z = [];

        var j=0;

        if ((viewer.model.children.length !== 0) && (user_defined_grid_length === "no")){
          for (i = 0; i < m1_model_data_get.shapes.length; i++) {
            if ((viewer.model.children[i].name !== "axes") && (viewer.model.children[i].name !== "marker") && (viewer.model.children[i].name !== "grid")){
              // Include this shape for computing bounding box of visible shapes if opacity >25% and if not turned off
              if ((viewer.model.children[i].material.opacity > 0.25) && (document.getElementById("opacity-slider-" + i).style.visibility !== "hidden")){
                bounding_box_min_x[i] = m1_model_data_get.shapes[i].bounding_box.min_x;
                bounding_box_max_x[i] = m1_model_data_get.shapes[i].bounding_box.max_x;
                bounding_box_min_y[i] = m1_model_data_get.shapes[i].bounding_box.min_y;
                bounding_box_max_y[i] = m1_model_data_get.shapes[i].bounding_box.max_y;
                bounding_box_min_z[i] = m1_model_data_get.shapes[i].bounding_box.min_z;
                bounding_box_max_z[i] = m1_model_data_get.shapes[i].bounding_box.max_z;
              } else {  // Or else set to fake values so extreme in the wrong direction that they won't influence max / mins (this is a hack because using null returned 0)
                bounding_box_min_x[i] = 1000000;
                bounding_box_max_x[i] = -1000000;
                bounding_box_min_y[i] = 1000000;
                bounding_box_max_y[i] = -1000000;
                bounding_box_min_z[i] = 1000000;
                bounding_box_max_z[i] = -1000000;
              }
            }
          }

          if ( m > 1 ) {
            for (var i = m1_model_data_get.shapes.length; i < (m1_model_data_get.shapes.length + m2_model_data_get.shapes.length); i++) {
              if ((viewer.model.children[i].name !== "axes") && (viewer.model.children[i].name !== "marker") && (viewer.model.children[i].name !== "grid")){
                if ((viewer.model.children[i].material.opacity > 0.25) && (document.getElementById("opacity-slider-" + i).style.visibility !== "hidden")){ //Include this shape for computing bounding box of visible shapes if opacity >25% and if not turned off
                  bounding_box_min_x[i] = m2_model_data_get.shapes[j].bounding_box.min_x;
                  bounding_box_max_x[i] = m2_model_data_get.shapes[j].bounding_box.max_x;
                  bounding_box_min_y[i] = m2_model_data_get.shapes[j].bounding_box.min_y;
                  bounding_box_max_y[i] = m2_model_data_get.shapes[j].bounding_box.max_y;
                  bounding_box_min_z[i] = m2_model_data_get.shapes[j].bounding_box.min_z;
                  bounding_box_max_z[i] = m2_model_data_get.shapes[j].bounding_box.max_z;
                } else {  // Or else set to fake values so extreme in the wrong direction that they won't influence max / mins (this is a hack because using null returned 0)
                  bounding_box_min_x[i] = 1000000;
                  bounding_box_max_x[i] = -1000000;
                  bounding_box_min_y[i] = 1000000;
                  bounding_box_max_y[i] = -1000000;
                  bounding_box_min_z[i] = 1000000;
                  bounding_box_max_z[i] = -1000000;
                }
              }
              j=j+1;
            }
          }

          bounding_box_min_x = Math.min.apply(null, bounding_box_min_x) - offset_diff_total.x;
          bounding_box_max_x = Math.max.apply(null, bounding_box_max_x) - offset_diff_total.x;
          bounding_box_min_y = Math.min.apply(null, bounding_box_min_y) - offset_diff_total.y;
          bounding_box_max_y = Math.max.apply(null, bounding_box_max_y) - offset_diff_total.y;
          bounding_box_min_z = Math.min.apply(null, bounding_box_min_z) - offset_diff_total.z;
          bounding_box_max_z = Math.max.apply(null, bounding_box_max_z) - offset_diff_total.z;

//USEFUL FOR DEBUGGING BOUNDING BOX
//var material = new THREE.LineBasicMaterial({ color: 0x0000ff});

//var geometry = new THREE.Geometry();
//geometry.vertices.push(new THREE.Vector3(bounding_box_min_x, bounding_box_max_y, bounding_box_max_z));
//geometry.vertices.push(new THREE.Vector3(bounding_box_max_x, bounding_box_max_y, bounding_box_max_z));
//geometry.vertices.push(new THREE.Vector3(bounding_box_max_x, bounding_box_min_y, bounding_box_max_z));
//geometry.vertices.push(new THREE.Vector3(bounding_box_min_x, bounding_box_min_y, bounding_box_max_z));
//geometry.vertices.push(new THREE.Vector3(bounding_box_min_x, bounding_box_max_y, bounding_box_max_z));
//geometry.vertices.push(new THREE.Vector3(bounding_box_min_x, bounding_box_max_y, bounding_box_min_z));
//geometry.vertices.push(new THREE.Vector3(bounding_box_max_x, bounding_box_max_y, bounding_box_min_z));
//geometry.vertices.push(new THREE.Vector3(bounding_box_max_x, bounding_box_min_y, bounding_box_min_z));
//geometry.vertices.push(new THREE.Vector3(bounding_box_min_x, bounding_box_min_y, bounding_box_min_z));
//geometry.vertices.push(new THREE.Vector3(bounding_box_min_x, bounding_box_max_y, bounding_box_min_z));
//geometry.vertices.push(new THREE.Vector3(bounding_box_min_x, bounding_box_min_y, bounding_box_min_z));
//geometry.vertices.push(new THREE.Vector3(bounding_box_min_x, bounding_box_min_y, bounding_box_max_z));
//geometry.vertices.push(new THREE.Vector3(bounding_box_min_x, bounding_box_max_y, bounding_box_max_z));
//geometry.vertices.push(new THREE.Vector3(bounding_box_max_x, bounding_box_max_y, bounding_box_max_z));
//geometry.vertices.push(new THREE.Vector3(bounding_box_max_x, bounding_box_max_y, bounding_box_min_z));
//geometry.vertices.push(new THREE.Vector3(bounding_box_max_x, bounding_box_min_y, bounding_box_min_z));
//geometry.vertices.push(new THREE.Vector3(bounding_box_max_x, bounding_box_min_y, bounding_box_max_z));

//var line = new THREE.Line(geometry, material);
//viewer.model.add( line);

          if (user_defined_grid_partitions === "no"){
            //Set grid partitions to (somewhat arbitrary) 1/10th of the average distance between bounding box limits for x,y,z
            var bounding_box_length_avg = Math.round(Math.abs(bounding_box_max_x - bounding_box_min_x) + Math.abs(bounding_box_max_y - bounding_box_min_y) + Math.abs(bounding_box_max_z - bounding_box_min_z))/3;
            grid_partitions = Math.round(bounding_box_length_avg/10);
            document.getElementById("grid_partitions").value = grid_partitions;
            document.getElementById("grid_length_user_input").value = "";
          }
        } else {
          bounding_box_min_x = -grid_length;
          bounding_box_max_x =  grid_length;
          bounding_box_min_y = -grid_length;
          bounding_box_max_y =  grid_length;
          bounding_box_min_z = -grid_length;
          bounding_box_max_z =  grid_length;
        }

        // Round down or up (for mins and maxes) to make sure that all bounding boxes contain an even number of partitions (not a fraction of one)
        bounding_box_min_x = grid_partitions*Math.floor(bounding_box_min_x/grid_partitions);
        bounding_box_max_x = grid_partitions*Math.ceil(bounding_box_max_x/grid_partitions);
        bounding_box_min_y = grid_partitions*Math.floor(bounding_box_min_y/grid_partitions);
        bounding_box_max_y = grid_partitions*Math.ceil(bounding_box_max_y/grid_partitions);
        bounding_box_min_z = grid_partitions*Math.floor(bounding_box_min_z/grid_partitions);
        bounding_box_max_z = grid_partitions*Math.ceil(bounding_box_max_z/grid_partitions);
      }

      var gridXZ;
      var gridXY;
      var gridYZ;
      var picked_coords_grid;

      if (picked_coords !== undefined){
        picked_coords_grid = picked_coords;
      } else {
        picked_coords_grid = new THREE.Vector3( 0, 0, 0 );
      }

      var step = grid_partitions;

      // Z axes
      gridXY = viewer.gridHelper(
        -bounding_box_max_y + picked_coords_grid.y, // horizontal_from
        -bounding_box_min_y + picked_coords_grid.y, // horizontal_to
         bounding_box_min_x - picked_coords_grid.x, // x1
         bounding_box_max_x - picked_coords_grid.x, // x2
         colors.three_x,                                       // horizontal_color
         bounding_box_min_x - picked_coords_grid.x, // vertical_from
         bounding_box_max_x - picked_coords_grid.x, // vertical_to
        -bounding_box_min_y + picked_coords_grid.y, // z1
        -bounding_box_max_y + picked_coords_grid.y, // z2
         colors.three_y,                            // vertical_color
         step
      );

      // Y axes
      gridXZ = viewer.gridHelper(
         bounding_box_min_z - picked_coords_grid.z, // horizontal_from
         bounding_box_max_z - picked_coords_grid.z, // horizontal_to
         bounding_box_min_x - picked_coords_grid.x, // x1
         bounding_box_max_x - picked_coords_grid.x, // x2
         colors.three_x,                            // horizontal_color
         bounding_box_min_x - picked_coords_grid.x, // vertical_from
         bounding_box_max_x - picked_coords_grid.x, // vertical_to
         bounding_box_min_z - picked_coords_grid.z, // z1
         bounding_box_max_z - picked_coords_grid.z, // z2
         colors.three_z,                            // vertical_color
         step
      );

      // X axes
      gridYZ = viewer.gridHelper(
         bounding_box_min_z - picked_coords_grid.z, // horizontal_from
         bounding_box_max_z - picked_coords_grid.z, // horizontal_to
         bounding_box_min_y - picked_coords_grid.y, // x1
         bounding_box_max_y - picked_coords_grid.y, // x2
         colors.three_y,                            // horizontal_color
         bounding_box_min_y - picked_coords_grid.y, // vertical_from
         bounding_box_max_y - picked_coords_grid.y, // vertical_to
         bounding_box_min_z - picked_coords_grid.z, // z1
         bounding_box_max_z - picked_coords_grid.z, // z2
         colors.three_z,                            // vertical_color
         step
      );

      var offset = viewer.model.userData.model_center_offset || new THREE.Vector3(0,0,0);
      gridXZ.position.set(x - offset.x, y - offset.y, z - offset.z);

      gridXY.rotation.x = Math.PI/2;
      gridXY.position.set(x - offset.x, y - offset.y, z - offset.z);

      gridYZ.rotation.z = Math.PI/2;
      gridYZ.position.set(x - offset.x, y - offset.y, z - offset.z);

      var grid = new THREE.Object3D();
      grid.name = "grid";

      if (toggle_grid_XZ === "on"){
        grid.add(gridXZ);
      }

      if (toggle_grid_XY === "on"){
        grid.add(gridXY);
      }

      if (toggle_grid_YZ === "on"){
        grid.add(gridYZ);
      }
      viewer.model.add(grid);
      return [bounding_box_min_x, bounding_box_max_x, bounding_box_min_y, bounding_box_max_y, bounding_box_min_z, bounding_box_max_z, grid_partitions];
    }

    function buildAxis( src, dst, colorHex, dashed ) {
      var geom = new THREE.Geometry(),mat;

      if(dashed) {
        mat = new THREE.LineDashedMaterial({ linewidth: 3, color: colorHex, dashSize: 3, gapSize: 3 });
      } else {
        mat = new THREE.LineBasicMaterial({ linewidth: 3, color: colorHex });
      }

      geom.vertices.push( src.clone() );
      geom.vertices.push( dst.clone() );
      geom.computeLineDistances();

      var axis = new THREE.Line( geom, mat, THREE.LinePieces );

      return axis;
    }

    function changeCenterRotation(center) {
      user_defined_grid_partitions = "no";
      user_defined_grid_length     = "no";
      if ( two_models_toggle >= 2) {
        return;
      }
      viewer.changeCenterRotation(center);
      // picked_coords = center;
    }

    function drawDashed(name,color,width) {

      var canvas = document.getElementById(name);
      var context = canvas.getContext("2d");

      context.beginPath();
      context.moveTo(40, 70);
      context.lineTo(190, 70);
      context.lineWidth = 30;
      context.setLineDash([width]);

      // set line color
      context.strokeStyle = color;
      context.stroke();
    }

    // If two color maps are loaded to be blended, create
    // slider to control the blending ratios.
    function blendUI(show){
      var div = $("#blend-box");

      div.html("");

      if (!show) {
        return;
      }

      var blend_text = $("<span id=\"blend_value\">0.5</span>");

      div.html("Blend Ratio: ");
      blend_text.appendTo(div);
      $("<div class=\"blend_slider\" id=\"blend_slider\" width=\"100px\" + height=\"10\"></div>").slider({
        min: 0.1,
        max: 0.99,
        value: 0.5,
        step: 0.01,
        slide: function() {
          var value = $(this).slider("value");
          viewer.blend(value);
          blend_text.html(value);
        }
      }).appendTo(div);
    }

  });
});
