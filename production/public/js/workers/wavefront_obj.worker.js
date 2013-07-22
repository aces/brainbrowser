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
var self=this;var result={};self.addEventListener("message",function(b){var a=b.data;parse(a);self.postMessage(result)});function parse(y){var t;var h=[];var j=[];var w=[];var c,x,o;var g;var d;var b,q;var s,m,r,p,u,e;var f,a,v;y=y.split("\n");result.shapes=[];t={name:y.name|"undefined",faces:[],positionArray:[],colorArray:[],indexArray:[],texIndexArray:[],normalIndexArray:[]};result.shapes.push(t);for(s=0,e=y.length;s<e;s++){g=y[s].split(/\s+/);d=g[0];b=g.length;if(!(d.match("#"))||g===""){switch(d){case"o":case"g":t={name:g[1],faces:[],positionArray:[],colorArray:[],indexArray:[],texIndexArray:[],normalIndexArray:[]};result.shapes.push(t);break;case"v":h.push(parseFloat(g[1]));h.push(parseFloat(g[2]));h.push(parseFloat(g[3]));break;case"vt":for(m=1;m<b;m++){j.push(parseFloat(g[m]))}break;case"vn":w.push(parseFloat(g[1]));w.push(parseFloat(g[2]));w.push(parseFloat(g[3]));break;case"f":f=[];c=t.indexArray;x=t.texIndexArray;o=t.normalIndexArray;for(r=1;r<4;r++){v=g[r].split("/");f.push(parseInt(v[0])-1);c.push(parseInt(v[0],10)-1);x.push(parseInt(v[1],10)-1);if(v[2]){o.push(parseInt(v[2],10)-1)}}if(b>=4){while(r<b){v=g[r].split("/");f.push(parseInt(v[0],10)-1);u=t.indexArray.length;c.push(t.indexArray[u-1]);c.push(t.indexArray[u-3]);c.push(v[0]-1);r++}}t.faces.push(f);break}}}q=result.shapes.length;for(p=0;p<q;p++){a=result.shapes[p];a.positionArray=h;if(a.colorArray.length===0){a.colorArray=[0.8,0.8,0.8,1]}}result.objectClass="P";result.vertexArray=h;result.texCoordArray=j};