
$(function() {

  $("#hideRight").click(function(){
    //$("#rightSidebar").fadeOut();
    $("#rightSidebar").animate({width:'toggle'},250);
  });

  $("#hideLeft").click(function(){
    //$("#leftSidebar").slideToggle("fast");
    $("#leftSidebar").animate({width:'toggle'},250);
  });





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
