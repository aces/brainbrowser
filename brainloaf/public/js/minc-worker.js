function parseMinc(data_string) {
    data_string = data_string.replace(/\s+$/, '');
    data_string = data_string.replace(/^\s+/, '');
    var data = data_string.split(/\s+/);
    data_string = "";
    for(var i = 0; i < data.length; i++) {
      data[i]=parseInt(data[i]);
    }

    data = new Uint16Array(data);
    //Why waste time, 16bit values ;p
    this.data = {values: data, min: 0, max: 65535};
    return this.data;

}


self.addEventListener('message', function(e) {
  var data = e.data;
  if(data.string) {
   self.postMessage(parseMinc(string));
  } 
}, false);