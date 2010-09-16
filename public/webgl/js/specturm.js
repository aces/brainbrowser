function spectrum() {
    var that = this;
    var canvas = jQuery("<canvas width=\"256\" height=\"50\"></canvas>");
    
    
    var context = canvas.getContext("2d");
    
    context.fillRect(0,0,256,50);

    return canvas.getDataUrl();
}


$(function() {
    var canvas_img = spectrum();
    jQuery("<div><img src=\""+canvas_img+"\"></img>").appendTo("body");
});