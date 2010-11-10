function WSSession(url){
    var ws = new WebSocket("ws://"+url);
    var that = this;
    
    that.sendEvent = function(event) {
	
    };
}