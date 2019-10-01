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
* BrainBrowser v2.5.5
*
* Author: Tarek Sherif  <tsherif@gmail.com> (http://tareksherif.ca/)
* Author: Nicolas Kassis
* Author: Paul Mougel
*
* three.js (c) 2010-2014 three.js authors, used under the MIT license
*/
!function(){"use strict";function a(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p=[],q=[],r=[],s=[],t={},u=[];for(t.shapes=[],a=a.split("\n"),b={indices:[],texture_indices:[],normal_indices:[]},s.push(b),j=0,m=a.length;m>j;j++)if(g=a[j].replace(/^\s+/,"").replace(/\s+$/,"").split(/\s+/),h=g[0],i=g.length,!h.match("#")||""===g)switch(h){case"o":case"g":b={name:g[1],indices:[],texture_indices:[],normal_indices:[]},s.push(b);break;case"v":p.push(parseFloat(g[1]),parseFloat(g[2]),parseFloat(g[3]));break;case"vt":for(k=1;i>k;k++)q.push(parseFloat(g[k]));break;case"vn":r.push(parseFloat(g[1]),parseFloat(g[2]),parseFloat(g[3]));break;case"f":for(d=b.indices,f=b.normal_indices,e=b.texture_indices,o=g[1].split("/"),l=2;i-1>l;l++)d.push(parseInt(o[0],10)-1),e.push(parseInt(o[1],10)-1),o[2]&&f.push(parseInt(o[2],10)-1),n=g[l].split("/"),d.push(parseInt(n[0],10)-1),e.push(parseInt(n[1],10)-1),n[2]&&f.push(parseInt(n[2],10)-1),n=g[l+1].split("/"),d.push(parseInt(n[0],10)-1),e.push(parseInt(n[1],10)-1),n[2]&&f.push(parseInt(n[2],10)-1)}return t.type="polygon",t.vertices=new Float32Array(p),u.push(t.vertices.buffer),r.length>0&&(c=new Float32Array(p.length)),s.forEach(function(a){var b,d,e={};if(e.indices=new Uint32Array(a.indices),u.push(e.indices.buffer),a.normal_indices.length>0)for(j=0,m=a.normal_indices.length;m>j;j++)b=3*a.indices[j],d=3*a.normal_indices[j],c[b]=r[d],c[b+1]=r[d+1],c[b+2]=r[d+2];a.texture_indices.length>0&&(e.texture_indices=new Uint32Array(a.texture_indices),u.push(e.texture_indices.buffer)),t.shapes.push(e)}),c&&(t.normals=new Float32Array(c),u.push(t.normals.buffer)),q.length>0&&(t.texture_coords=new Float32Array(q),u.push(t.texture_coords.buffer)),{result:t,transfer:u}}self.addEventListener("message",function(b){var c=a(b.data.data),d=c.result,e=c.transfer;self.postMessage(d,e)})}();