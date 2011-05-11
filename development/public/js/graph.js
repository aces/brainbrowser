/*
 * Graph library for brainbrowser
 * Author: Nicolas Kassis <nic.kassis@gmail.com> 
 * Copyright: Montreal Neurological Institue, McGill Univeristy 2011
 */

/*
 * Function for creating SVG bar graphs
 * arguments: 
 *   element:HTMLElement element where the graph goes
 *   data:TypedArray/Array data for the graph, each two elements are 
 *                         the data point and it's value 
 *   xaxis:string name of the xaxis
 *   yaxis:string name of the yaxis
 *   width:integer width of graph
 *   height:integer height of the graph
*/

function graphSetup(element,xaxis,yaxis,width,height) {
  var graph = Raphael(element,width,height);
    
  var graph_width = width - 10; //removing the axis
  var graph_height = height - 20;
  
  //draw axis
  graph.path("M10 0L10 "+graph_height);
  graph.path("M10 "+graph_height+"L"+width+ " "+graph_height);
  graph.text(width-30,height-10,xaxis);
  graph.text(5,30,yaxis).rotate(-90);
  return graph;
}

function BarGraph(element,data_points,values,xaxis,yaxis,width,height){
  
  var graph = graphSetup(element,xaxis,yaxis,width,height);
  var graph_width = width - 10; //removing the axis
  var graph_height = height - 20;

  var numpoints = data_points.length;

  
  var bar_width = Math.floor(graph_width / numpoints);
  var step_height = graph_height/values.max();



  for(var i = 0; i < numpoints; i++) {
    graph.rect(bar_width*i+11,graph_height - values[i]*step_height , bar_width-2, values[i]*step_height ).attr('fill',"#FF444D");
    graph.text(bar_width*i+11+bar_width/2,graph_height+5,data_points[i]);
  }

  
}

function LineGraph(element,data_points,values,xaxis,yaxis,width,height){
  var graph = graphSetup(element,xaxis,yaxis,width,height);
  var graph_width = width - 10; //removing the axis
  var graph_height = height - 20;


  var step_height = graph_height/values.max();
  var step_width = graph_width/data_points.max();
  var numpoints = data_points.length;
  
  for(var i = 0; i < numpoints-1; i++) {
    graph.path("M"+(10+step_width*data_points[i]) + " " + (graph_height-values[i]*step_height)+"L"+(10+step_width*data_points[i+1]) + " " + (graph_height-values[i+1]*step_height));
  }

  
}