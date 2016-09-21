var UriParamController = function(){

}


/*
  Get the param for the url.
  Args:
    key: String - the argument key

  return the value as an array of argument. If not found, returns null.
  Note: number-string are converted to actual numbers and strings are trimed.
  Note2: args are split by a coma (,), this is why we return an array
*/
UriParamController.prototype.getHashValue = function(key){
  var matches = location.hash.match(new RegExp(key+'=([^&]*)'));
  var result = null;

  if(matches){
    result = [];

    matches[1].split(",").forEach(function(elem){
      // we might get an emptu string but we dont want it
      if(elem.length > 0){

        // trying to cast it into float
        if(!Number.isNaN( parseFloat(elem) )){
          result.push(parseFloat(elem));
        }else{
          result.push(elem.trim());
        }
      }
    })
  }

  return result;
}



/*
  Hide the UI elements to leave only the main window with 3D shapes and all.
*/
UriParamController.prototype.hideUi = function(){

  var hide = this.getHashValue("hideUi");

  if(hide){

    if(hide[0]){
      $("#rightSidebar").hide();
      $("#leftSidebar").hide();
      $("#hideRight").hide();
      $("#hideLeft").hide();
      $(".logo").hide();


    }
  }
}
