/*
  Author: Jonathan Lurie (https://github.com/jonathanlurie)
  Project: BrainBrowser https://github.com/aces/brainbrowser
  Date: September 2016
  Institution: MCIN - Neuro - McGill University
  Licence: MIT
*/
var AnnotationController = function(BrainBrowserViewer){
  "use strict";
  // Loading Handlebars template
  $.hbsPreload("annotation");

  this.defaultColor = "EEEE00";
  this.radius = 0.75;

  this.annotations = {};
  this.counter = 0;

  this.viewer = BrainBrowserViewer;

  // al the annotations are within a single THREE object
  this.annotationSystem = this.viewer.annotationSystem;

  this.initCallbacks();

};

(function() {
  "use strict";
  /*
    Init all the buttons
  */
  AnnotationController.prototype.initCallbacks = function(){
    var that = this;


    // Save the annotations
    $("#annotSaveBt").click(function(){
      var jsonAnnotations = that.annotationsToJson();
      var blob = new Blob([jsonAnnotations], {type: "text/plain;charset=utf-8"});
      saveAs(blob, "annotations.json");
    });


    // When a json file is opened, we then load its data
    $("#annotationOpener").change(function(evt){
      if(evt.originalEvent.target.files.length > 0){
        var file = evt.originalEvent.target.files[0];
        var reader = new FileReader();

        reader.onload = function(e) {
          var contents = e.target.result;
          that.addAnnotationFromJSON(contents);
        };
        reader.readAsText(file);
      }
    });

    // when typing in the name text field
    // Note: not using the regular click cb because the elements are not created yet
    $('body').on("keyup", ".annotName", function(){
      var annotBlock = $(this).closest(".annotation");
      var id = annotBlock.attr("id");

      var newName = $(this).val();
      that.updateName(id, newName);
    });


    // when typing in the description text field
    // Note: not using the regular click cb because the elements are not created yet
    $('body').on("keyup", ".annotDescription", function(){
      var annotBlock = $(this).closest(".annotation");
      var id = annotBlock.attr("id");

      var newDesc = $(this).val();
      that.updateDescription(id, newDesc);
    });


    // the trashbin icon, to delete an annotation
    // Note: not using the regular click cb because the elements are not created yet
    $('body').on("click", ".annotDelete", function(){
      var annotBlock = $(this).closest(".annotation");
      var id = annotBlock.attr("id");

      that.deleteAnnotation(id);
    });


    // Make the annotation visible/invisible depending on its currnet state
    // Note: not using the regular click cb because the elements are not created yet
    $('body').on("click", ".annotToggle", function(){
      var annotBlock = $(this).closest(".annotation");
      var id = annotBlock.attr("id");

      that.toggleAnnotation(id);
    });


    // Make all the rest partly transparent, except this annotation
    // Note: not using the regular click cb because the elements are not created yet
    $('body').on("mouseenter", ".annotTarget", function(){
      var annotBlock = $(this).closest(".annotation");
      var id = annotBlock.attr("id");

      that.enableTarget(id);
    });


    // Make all the rest partly transparent, except this annotation
    // Note: not using the regular click cb because the elements are not created yet
    $('body').on("mouseleave", ".annotTarget", function(){
      var annotBlock = $(this).closest(".annotation");
      var id = annotBlock.attr("id");

      that.disableTarget(id);
    });


    $('body').on("change", ".colorPicker", function(){
      var annotBlock = $(this).closest(".annotation");
      var id = annotBlock.attr("id");

      that.changeColorAnnotation(id, $(this).val());
    });


  }; /* END OF initCallbacks() */


  /*
    add an annotation to the list, and create the equivalent sphere.
    Args:
      points: Array of Array [x, y, z] - list of [x, y, z] coordinantes
        that represent the point/polyline/polygon
      isClosed: Boolean - used only when points has multiple points.
        If false: a polyline, if true: a polygon
      name: String - the name of the annotation, if null a temporary name is Given
      description: String - the description, can be null
      color: String - hexadecimal without prefix (ie. "FF0000")

  */
  AnnotationController.prototype.addAnnotation = function(points, isClosed, name, description, color){

    // no empty shapes here!
    if(points.length <= 0)
      return;

    var id = "annot_" + this.counter;

    if(!name){
      name = "Annotation #" + this.counter;
    }

    if(!description){
      description = "";
    }

    if(!color){
      color = this.defaultColor;
    }

    // add logic annotation
    var annotation = {
      name: name,
      points: points,
      isClosed: isClosed,
      description: description,
      color: color
    };
    this.annotations[id] = annotation;

    // add some mesh, 3 cases are possible:
    // - a single point: a sphere
    // - multiple point + !isClosed: a polyline
    // - multiple point + isClosed: a polygon
    var mesh = null;
    var material = null;
    var geometry = null;

    // case 1: add 3D sphere
    if(points.length === 1){
      geometry = new THREE.SphereGeometry( this.radius, 32, 32 );
      material = new THREE.MeshBasicMaterial();

      mesh = new THREE.Mesh( geometry, material );
      mesh.position.set(points[0][0], points[0][1], points[0][2]);

    }else{

      geometry = new THREE.Geometry();
      material = new THREE.LineBasicMaterial( {linewidth: 3 } );

      // adding every point
      points.forEach(function(point){
        geometry.vertices.push( new THREE.Vector3(point[0], point[1], point[2]));
      });

      // add a the first point again, in the end, to close the loop
      if(isClosed){
        geometry.vertices.push( new THREE.Vector3(
            points[0][0],
            points[0][1],
            points[0][2]
          )
        );
      }

      geometry.computeLineDistances();
      mesh = new THREE.Line( geometry, material );
    }

    // common part, no matter the kind of geometry
    material.color.set("#" + color);
    material.transparent = true;
    mesh.name = id;
    this.annotationSystem.add( mesh );
    this.viewer.updated = true;

    // add UI widget
    $('#annotations').hbsAppend('annotation', {
      id: id,
      name: name,
      description: description,
      color: color
    });

    // scroll to make it visible
    $("#" + id).scrollintoview();

    // updating the color box
    jscolor.installByClassName("jscolor");

    this.counter++;
  };


  /*
    Update the name of the annotation.
    Args:
      id: string - identifier of the annotation in this.annotations
      newName: String - the new name
  */
  AnnotationController.prototype.updateName = function(id, newName){
    this.annotations[id].name = newName;
  };


  /*
    Update the description of the annotation.
    Args:
      id: string - identifier of the annotation in this.annotations
      newDesc: String - the description
  */
  AnnotationController.prototype.updateDescription = function(id, newDesc){
    this.annotations[id].description = newDesc;
  };


  /*
    Delete the 3 components of an annotation:
      - 3D sphere
      - UI div
      - logic internal data
  */
  AnnotationController.prototype.deleteAnnotation = function(id){
    // delete the 3D graphic element
    var mesh = this.annotationSystem.getObjectByName(id);
    this.annotationSystem.remove(mesh);
    this.viewer.updated = true;

    // delete the UI element (with hide annimation)
    $("#" + id).hide('fast', function(){ $("#" + id).remove(); });

    // delete the logic element
    delete this.annotations[id];
  };


  /*
    Show or hide the annotation depending on currnet visibility
  */
  AnnotationController.prototype.toggleAnnotation = function(id){

    var eyeLogo = $("#" + id).find(".annotToggle").find(".fa");

    var mesh = this.annotationSystem.getObjectByName(id);

    if(mesh.visible){
      $(eyeLogo).removeClass("fa-eye");
      $(eyeLogo).addClass("red");
      $(eyeLogo).addClass("fa-eye-slash");
    }else{
      $(eyeLogo).addClass("fa-eye");
      $(eyeLogo).removeClass("red");
      $(eyeLogo).removeClass("fa-eye-slash");
    }

    mesh.visible = !mesh.visible;

    this.viewer.updated = true;
  };


  /*
    change color.
    Args:
      id: String - the identifier of annotation
      color: String - color in hexa with NO prefix (ie. "FF0000")
  */
  AnnotationController.prototype.changeColorAnnotation = function(id, color){
    // update logic object
    this.annotations[id].color = color;

    // update 3D object
    var material = this.annotationSystem.getObjectByName(id).material;
    material.color.set("#" + color);
    this.viewer.updated = true;
  };


  /*
    Throw a raycaster that looks for some annotationSystem children.
    If found, return its id, if not found, return null.
    The typical use case is to display annotation info if found, or to create a
    new annotation if not was found at this location.
  */
  AnnotationController.prototype.pickAnnotation = function(){

    var mouse = new THREE.Vector2();
    mouse.x = (this.viewer.mouse.x / this.viewer.dom_element.offsetWidth) * 2 - 1;
    mouse.y = (- this.viewer.mouse.y / this.viewer.dom_element.offsetHeight) * 2 + 1;

    // raycaster, the old fashioned way (I don't think it's like like in recent release)
    var raycaster = new THREE.Raycaster();
    var vector       = new THREE.Vector3(mouse.x, mouse.y, this.viewer.camera.near);
    vector.unproject(this.viewer.camera);

    raycaster.set(
      this.viewer.camera.position,
      vector.sub(this.viewer.camera.position).normalize()
    );

    var intersects = raycaster.intersectObject(this.annotationSystem, true);

    if(intersects.length > 0){
      var id = intersects[0].object.name;
      this.focusOnAnnotationWidget(id);
      return id;
    }else{
      return null;
    }

  };


  /*
    Scroll the left sidebar to make the related widget visible and blink it for 2s.
  */
  AnnotationController.prototype.focusOnAnnotationWidget = function(id){
    // make it blink for 2sec
    $("#" + id).addClass("blink_me");

    $("#" + id).scrollintoview();

    setTimeout(function(){
      $("#" + id).removeClass("blink_me");
    }, 2500);

  };


  /*
    Make the model invisible and all the other annotations partly transparent
  */
  AnnotationController.prototype.enableTarget = function(id){
    this.viewer.model.visible = false;

    this.annotationSystem.children.forEach(function(annotMesh){
      annotMesh.material.opacity = 0.15;
    });

    var targetedSphere = this.annotationSystem.getObjectByName(id);
    targetedSphere.material.opacity = 1;

    this.viewer.updated = true;
  };


  /*
    Cancel the work done by enableTarget() -> show the model + normal
    annotation sphere opacity
  */
  AnnotationController.prototype.disableTarget = function(){
    this.viewer.model.visible = true;

    this.annotationSystem.children.forEach(function(annotMesh){
      annotMesh.material.opacity = 1;
    });

    this.viewer.updated = true;
  };


  /*
    Returns a JSON string containing all the annotations + the date.
    In the process, the annotations are converted into a proper array
    (instead of keeping a map). This is to guarranty higher compatibility by not
    messing with ID we dont care about externaly.
  */
  AnnotationController.prototype.annotationsToJson = function(){

    var arrayOfAnnot = [];

    for (var annotName in this.annotations) {
      arrayOfAnnot.push(this.annotations[annotName]);
    }

    var toExport = {
      date: new Date(),
      annotations: arrayOfAnnot
    };

    return JSON.stringify(toExport);
  };


  /*
    adds the annotations from a JSON string, that potentially comes form a file.
    Args:
      json: JSON compliant String

    Once converted into a JS object, json contains first a date, and then a list of objects
  */
  AnnotationController.prototype.addAnnotationFromJSON = function(json){
    var jsonContent = JSON.parse(json.trim());
    this.addAnnotationFromList(jsonContent);
  };


  /*
    This object is supposed to be the same as when the json file is loaded, except annotation are stored in a an array rather than a map.
    a date + a bunch of annotations.
  */
  AnnotationController.prototype.addAnnotationFromList = function(ob){
    var that = this;

    if(ob){
      // test the existence of the 'annotations' key
      if("annotations" in ob){
        ob.annotations.forEach(function(annot){
            that.addAnnotation(
              annot.points, // array of points (only one here)
              annot.isClosed, // isClosed
              annot.name, // name
              annot.description, // description
              annot.color  // color
            );
          });
      }
    }
  };


  /*
    Load local file with http GET request using jquery.

    Args:
      filepath: String - a local json file that contains annotations data
  */
  AnnotationController.prototype.loadAnnotationFromURL = function(filepath){
    var that = this;

    $.get(filepath, function(data) {
      that.addAnnotationFromList(data);
    });

  };
})();