var AnnotationController = function(BrainBrowserViewer){
  // Loading Handlebars template
  $.hbsPreload("annotation");

  this.defaultColor = 0xEEEE00;

  this.annotations = {};
  this.counter = 0;

  this.viewer = BrainBrowserViewer;

  // al the annotations are within a single THREE object
  this.annotationSystem = this.viewer.annotationSystem;

  this.initCallbacks();

}


/*
  add an annotation to the list, and create the equivalent sphere
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
  var geometry = new THREE.SphereGeometry( 5, 32, 32 );
  //var geometry = new THREE.BoxGeometry( 10, 10, 10 );
  var material = new THREE.MeshBasicMaterial( {color: this.defaultColor} );
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



AnnotationController.prototype.pickAnnotation = function(){
  var mouse = new THREE.Vector2();
  mouse.x = (this.viewer.mouse.x / this.viewer.dom_element.offsetWidth) * 2 - 1;
  mouse.y = (- this.viewer.mouse.y / this.viewer.dom_element.offsetHeight) * 2 + 1;

  var raycaster = new THREE.Raycaster();
  //raycaster.setFromCamera( mouse, this.viewer.camera );
  //var intersects = raycaster.intersectObjects( this.annotationSystem );

  var vector       = new THREE.Vector3(mouse.x, mouse.y, this.viewer.camera.near);
  vector.unproject(this.viewer.camera);
  raycaster.set(this.viewer.camera.position, vector.sub(this.viewer.camera.position).normalize());
  intersects = raycaster.intersectObject(this.annotationSystem, true);

  console.log("intersect with " + intersects.length);

  if(intersects.length > 0){
    var id = intersects[0].object.name;
    $("#" + id).scrollintoview();
    return id;
  }else{
    return null;
  }

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


  $('body').on("change", ".colorPicker", function(){
    var annotBlock = $(this).closest(".annotation");
    var id = annotBlock.attr("id");

    that.changeColorAnnotation(id, $(this).val());
  });

}
