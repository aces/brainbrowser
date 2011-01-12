function parseMinc(data_string) {

}


self.addEventListener('message', function(e) {
  var data = e.data;
  if(data.string) {
   self.postMessage(parseMinc(string));
  } 
}, false);