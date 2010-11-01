function webSocketTest() {
    var ws = new WebSocket("ws://galois.cbrain.mcgill.ca:8080");
    ws.onmessage=function(event) {
      alert(event.data);
    };
    
    ws.send("test");
}