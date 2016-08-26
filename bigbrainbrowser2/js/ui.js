
$(function() {

  $("#hideRight").click(function(){
    //$("#rightSidebar").fadeOut();
    $("#rightSidebar").animate({width:'toggle'},250);
  });

  $("#hideLeft").click(function(){
    //$("#leftSidebar").slideToggle("fast");
    $("#leftSidebar").animate({width:'toggle'},250);
  });



  $("#toggleAllShapes").click(function(){
    $(".toggleShape").trigger("click");
  });

  /*

  */
  $(".toggleShape").click(function(){
    toggleShape(this);
  });




  function toggleShape(toggleShapeButton){
    //$("#leftSidebar").slideToggle("fast");
    var slider = $(toggleShapeButton).siblings().find(".slider");
    var eyeicon = $(toggleShapeButton).find(".eyeicon");
    var sliderCurrentValue = $(slider).val();

    // we want to switch off
    if($(toggleShapeButton).attr("visible") == 1){
      // saving the value
      $(slider).attr("previousValue", sliderCurrentValue);
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
      $(slider).val( $(slider).attr("previousValue") );
      $(toggleShapeButton).attr("visible", 1);
      $(eyeicon).removeClass("fa-eye-slash");
      $(eyeicon).addClass("fa-eye")
      $(eyeicon).removeClass("red");
    }
  }




  var availableTags = [
  "ActionScript",
  "AppleScript",
  "Asp",
  "BASIC",
  "C",
  "C++",
  "Clojure",
  "COBOL",
  "ColdFusion",
  "Erlang",
  "Fortran",
  "Groovy",
  "Haskell",
  "Java",
  "JavaScript",
  "Lisp",
  "Perl",
  "PHP",
  "Python",
  "Ruby",
  "Scala",
  "Scheme"
];
$( "#tags" ).autocomplete({
  source: availableTags
});

});
