var AnnotationController = function(BrainBrowserViewer){
  // Loading Handlebars template
  $.hbsPreload("annotation");

  this.defaultColor = 0xEEEE00;
  this.radius = 0.75;

  this.annotations = {};
  this.counter = 0;

  this.viewer = BrainBrowserViewer;

  // al the annotations are within a single THREE object
  this.annotationSystem = this.viewer.annotationSystem;

  this.initCallbacks();

}


/*
  add an annotation to the list, and create the equivalent sphere.
  Args:
    coord
*/
AnnotationController.prototype.addAnnotation = function(coord, name, description){
  var that = this;
  var id = "annot_" + this.counter;

  if(!name){
    name = "Annotation #" + this.counter;
  }

  if(description){
    description = "";
  }


  // add logic annotation
  var annotation = {
    name: name,
    coord: coord.slice(),
    description: description,
    color: that.defaultColor
  }
  this.annotations[id] = annotation;

  // add 3D sphere
  var geometry = new THREE.SphereGeometry( this.radius, 32, 32 );
  var material = new THREE.MeshBasicMaterial( {color: this.defaultColor} );
  material.transparent = true;
  var mesh = new THREE.Mesh( geometry, material );
  mesh.name = id;

  mesh.position.set(coord[0], coord[1], coord[2]);
  this.annotationSystem.add( mesh );
  this.viewer.updated = true;

  // add UI widget
  $('#annotations').hbsAppend('annotation', {
    id: id,
    name: name,
    description: description
  });

  // scroll to make it visible
  $("#" + id).scrollintoview();

  // updating the color box
  jscolor.installByClassName("jscolor");

  this.counter++;
}


/*
  Update the name of the annotation.
  Args:
    id: string - identifier of the annotation in this.annotations
    newName: String - the new name
*/
AnnotationController.prototype.updateName = function(id, newName){
  this.annotations[id].name = newName;
}


/*
  Update the description of the annotation.
  Args:
    id: string - identifier of the annotation in this.annotations
    newDesc: String - the description
*/
AnnotationController.prototype.updateDescription = function(id, newDesc){
  this.annotations[id].description = newDesc;
}


/*
  Delete the 3 components of an annotation:
    - 3D sphere
    - UI div
    - logic internal data
*/
AnnotationController.prototype.deleteAnnotation = function(id){
  // delete the 3D graphic element
  var mesh = this.annotationSystem.getObjectByName(id);
  console.log(mesh);
  this.annotationSystem.remove(mesh);
  this.viewer.updated = true;

  // delete the UI element (with hide annimation)
  $("#" + id).hide('fast', function(){ $("#" + id).remove(); });


  // delete the logic element
  delete this.annotations[id];
}


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
}


/*
  change color.
  Args:
    id: String - the identifier of annotation
    color: String - color in hexa with NO prefix (ie. "FF0000")
*/
AnnotationController.prototype.changeColorAnnotation = function(id, color){
  var material = this.annotationSystem.getObjectByName(id).material;
  material.color.set("#" + color);
  console.log(material);
  this.viewer.updated = true;
}


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

  intersects = raycaster.intersectObject(this.annotationSystem, true);

  if(intersects.length > 0){
    var id = intersects[0].object.name;
    this.focusOnAnnotationWidget(id);
    return id;
  }else{
    return null;
  }

}


/*
  Scroll the left sidebar to make the related widget visible and blink it for 2s.
*/
AnnotationController.prototype.focusOnAnnotationWidget = function(id){
  // make it blink for 2sec
  $("#" + id).addClass("blink_me");
  $("#" + id).scrollintoview({
    complete: function() {
      setTimeout(function(){
        $("#" + id).removeClass("blink_me");
      }, 2000);
    }
  });
}


/*
  Make the model invisible and all the other annotations partly transparent
*/
AnnotationController.prototype.enableTarget = function(id){
  this.viewer.model.visible = false;

  this.annotationSystem.children.forEach(function(annotSphere){
    annotSphere.material.opacity = 0.15;
  });

  var targetedSphere = this.annotationSystem.getObjectByName(id);
  targetedSphere.material.opacity = 1;

  this.viewer.updated = true;
}



/*
  Cancel the work done by enableTarget() -> show the model + normal
  annotation sphere opacity
*/
AnnotationController.prototype.disableTarget = function(id){
  this.viewer.model.visible = true;

  this.annotationSystem.children.forEach(function(annotSphere){
    annotSphere.material.opacity = 1;
  });

  this.viewer.updated = true;
}



/*
  Init all the buttons
*/
AnnotationController.prototype.initCallbacks = function(){
  var that = this;

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

    console.log("entering " + id);
    that.enableTarget(id);
  });


  // Make all the rest partly transparent, except this annotation
  // Note: not using the regular click cb because the elements are not created yet
  $('body').on("mouseleave", ".annotTarget", function(){
    var annotBlock = $(this).closest(".annotation");
    var id = annotBlock.attr("id");

    console.log("leaving " + id);
    that.disableTarget(id);
  });


  $('body').on("change", ".colorPicker", function(){
    var annotBlock = $(this).closest(".annotation");
    var id = annotBlock.attr("id");

    that.changeColorAnnotation(id, $(this).val());
  });

}
