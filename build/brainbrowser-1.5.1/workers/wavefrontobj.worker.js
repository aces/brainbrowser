/*
* BrainBrowser: Web-based Neurological Visualization Tools
* (https://brainbrowser.cbrain.mcgill.ca)
*
* Copyright (C) 2011 McGill University 
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
* BrainBrowser v1.5.1
*
* Author: Tarek Sherif  <tsherif@gmail.com> (http://tareksherif.ca/)
* Author: Nicolas Kassis
*/
!function(){"use strict";function a(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o=[],p=[],q=[],r={};for(a=a.split("\n"),r.shapes=[],b={name:"undefined"|a.name,faces:[],indices:[],texture_indices:[],normal_indices:[]},r.shapes.push(b),i=0,l=a.length;l>i;i++)if(f=a[i].split(/\s+/),g=f[0],h=f.length,!g.match("#")||""===f)switch(g){case"o":case"g":b={name:f[1],faces:[],indices:[],texture_indices:[],normal_indices:[]},r.shapes.push(b);break;case"v":o.push(parseFloat(f[1])),o.push(parseFloat(f[2])),o.push(parseFloat(f[3]));break;case"vt":for(j=1;h>j;j++)p.push(parseFloat(f[j]));break;case"vn":q.push(parseFloat(f[1])),q.push(parseFloat(f[2])),q.push(parseFloat(f[3]));break;case"f":m=[],c=b.indices,d=b.texture_indices,e=b.normal_indices;var s=f[1].split("/");for(k=2;h-1>k;k++)m.push(parseInt(s[0],10)-1),c.push(parseInt(s[0],10)-1),d.push(parseInt(s[1],10)-1),s[2]&&e.push(parseInt(s[2],10)-1),n=f[k].split("/"),m.push(parseInt(n[0],10)-1),c.push(parseInt(n[0],10)-1),d.push(parseInt(n[1],10)-1),n[2]&&e.push(parseInt(n[2],10)-1),n=f[k+1].split("/"),m.push(parseInt(n[0],10)-1),c.push(parseInt(n[0],10)-1),d.push(parseInt(n[1],10)-1),n[2]&&e.push(parseInt(n[2],10)-1);b.faces.push(m)}return r.type="polygon",r.vertices=o,r.normals=q,r.colors=[.8,.8,.8,1],r.texture_coords=p,r}self.addEventListener("message",function(b){self.postMessage(a(b.data.data))})}();