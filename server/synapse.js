var http = require('http');
io = require('socket.io');
server = http.createServer(function(req,res) {
 res.writeHead(200, {'Content-Type': 'text/html'});
 res.write('<h1>Hello world</h1>');
 res.end();

});

server.listen(8124)
;
var socket = io.listen(server);
socket.on('connection', function(client){
  // new client is here!
  client.on('message', function(){
	      console.log(event.data);
	    });
  client.on('disconnect', function(){
	      console.log("Disconnect");
	    });
});