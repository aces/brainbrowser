/*
* BrainBrowser: Web-based Neurological Visualization Tools
* (https://brainbrowser.cbrain.mcgill.ca)
*
* Copyright (C) 2011
* The Royal Institution for the Advancement of Learning
* McGill University
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
* BrainBrowser v2.5.7
*
* Author: Tarek Sherif  <tsherif@gmail.com> (http://tareksherif.ca/)
* Author: Nicolas Kassis
* Author: Paul Mougel
*
* three.js (c) 2010-2014 three.js authors, used under the MIT license
*/
self.addEventListener("message",function(e){var e=(e=>{var s,a,r,t,n,i,p,l,u,c,o,h,d,f,_=[],g=[],m=[],F=[],b={},v=[];for(b.shapes=[],e=e.split("\n"),F.push(s={indices:[],texture_indices:[],normal_indices:[]}),u=0,h=e.length;u<h;u++)if(i=e[u].replace(/^\s+/,"").replace(/\s+$/,"").split(/\s+/),p=i[0],l=i.length,!p.match("#")||""===i)switch(p){case"o":case"g":s={name:i[1],indices:[],texture_indices:[],normal_indices:[]},F.push(s);break;case"v":_.push(parseFloat(i[1]),parseFloat(i[2]),parseFloat(i[3]));break;case"vt":for(c=1;c<l;c++)g.push(parseFloat(i[c]));break;case"vn":m.push(parseFloat(i[1]),parseFloat(i[2]),parseFloat(i[3]));break;case"f":for(r=s.indices,n=s.normal_indices,t=s.texture_indices,f=i[1].split("/"),o=2;o<l-1;o++)r.push(parseInt(f[0],10)-1),t.push(parseInt(f[1],10)-1),f[2]&&n.push(parseInt(f[2],10)-1),d=i[o].split("/"),r.push(parseInt(d[0],10)-1),t.push(parseInt(d[1],10)-1),d[2]&&n.push(parseInt(d[2],10)-1),d=i[o+1].split("/"),r.push(parseInt(d[0],10)-1),t.push(parseInt(d[1],10)-1),d[2]&&n.push(parseInt(d[2],10)-1)}return b.type="polygon",b.vertices=new Float32Array(_),v.push(b.vertices.buffer),0<m.length&&(a=new Float32Array(_.length)),F.forEach(function(e){var s,r,t={};if(t.indices=new Uint32Array(e.indices),v.push(t.indices.buffer),0<e.normal_indices.length)for(u=0,h=e.normal_indices.length;u<h;u++)s=3*e.indices[u],r=3*e.normal_indices[u],a[s]=m[r],a[1+s]=m[1+r],a[2+s]=m[2+r];0<e.texture_indices.length&&(t.texture_indices=new Uint32Array(e.texture_indices),v.push(t.texture_indices.buffer)),b.shapes.push(t)}),a&&(b.normals=new Float32Array(a),v.push(b.normals.buffer)),0<g.length&&(b.texture_coords=new Float32Array(g),v.push(b.texture_coords.buffer)),{result:b,transfer:v}})(e.data.data),s=e.result;self.postMessage(s,e.transfer)});