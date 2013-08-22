/*! 
 * Copyright (C) 2011 McGill University
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
var result={};self.addEventListener("message",function(b){var a=b.data;parse(a);self.postMessage(result)});function parse(g){var b;var c=[];var n=[];var j=[];var m;var a;var o;var p;var k,h;var d;var f,e;g=g.split("\n");result.shapes=[];b={name:g.name|"undefined",faces:[],positionArray:[],colorArray:[],indexArray:[],texIndexArray:[],normalIndexArray:[]};result.shapes.push(b);m=g[1].split(/\s+/);a=parseInt(m[0],10);o=parseInt(m[1],10);for(f=2;f<a+2;f++){p=g[f].split(/\s+/);c.push(parseFloat(p[0]));c.push(parseFloat(p[1]));c.push(parseFloat(p[2]))}for(f=a+2;f<a+o+2;f++){p=g[f].split(/\s+/);k=[];k.push(parseInt(p[0],10));k.push(parseInt(p[1],10));k.push(parseInt(p[2],10));b.faces.push(k)}d=result.shapes.length;for(e=0;e<d;e++){h=result.shapes[e];h.positionArray=c;if(h.colorArray.length==0){h.colorArray=[0.8,0.8,0.8,1]}}result.objectClass="P";result.vertexArray=c};