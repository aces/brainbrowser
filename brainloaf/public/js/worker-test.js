var worker = new Worker('/js/mindframe-worker.js');
$(function() {
    
    
    worker.addEventListner('message', 
      function(e){
	alert(e.data.type);
      });


    
    
    
});