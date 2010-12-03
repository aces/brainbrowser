self.addEventListener('message', function(event) {
  var data =  event.data;
			
			
  switch (data.cmd) {
    case 'parseMinc':
      var minc = new Minc();
      self.postMessage(minc.parseData(data.string));
      break;
    case 'createColorMap':
      var colorArray = createColorMap(data.spectrum,data.values,data.min,data.max);
      self.postMessage(colorArray);
      break;
    case 'default':
      self.postMessage("ERROR");
  }


},false);