/*
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

/* brainbrowser v1.0.1 */
!function(){"use strict";function a(a){var c,d,e,f,g,h,i,j,k,l,m,n,o,p=[],q=[],r=[];for(a=a.split("\n"),b.shapes=[],c={name:"undefined"|a.name,faces:[],positionArray:[],colorArray:[],indexArray:[],texIndexArray:[],normalIndexArray:[]},b.shapes.push(c),j=0,m=a.length;m>j;j++)if(g=a[j].split(/\s+/),h=g[0],i=g.length,!h.match("#")||""===g)switch(h){case"o":case"g":c={name:g[1],faces:[],positionArray:[],colorArray:[],indexArray:[],texIndexArray:[],normalIndexArray:[]},b.shapes.push(c);break;case"v":p.push(parseFloat(g[1])),p.push(parseFloat(g[2])),p.push(parseFloat(g[3]));break;case"vt":for(k=1;i>k;k++)q.push(parseFloat(g[k]));break;case"vn":r.push(parseFloat(g[1])),r.push(parseFloat(g[2])),r.push(parseFloat(g[3]));break;case"f":n=[],d=c.indexArray,e=c.texIndexArray,f=c.normalIndexArray;var s=g[1].split("/");for(l=2;i-1>l;l++)n.push(parseInt(s[0],10)-1),d.push(parseInt(s[0],10)-1),e.push(parseInt(s[1],10)-1),s[2]&&f.push(parseInt(s[2],10)-1),o=g[l].split("/"),n.push(parseInt(o[0],10)-1),d.push(parseInt(o[0],10)-1),e.push(parseInt(o[1],10)-1),o[2]&&f.push(parseInt(o[2],10)-1),o=g[l+1].split("/"),n.push(parseInt(o[0],10)-1),d.push(parseInt(o[0],10)-1),e.push(parseInt(o[1],10)-1),o[2]&&f.push(parseInt(o[2],10)-1);c.faces.push(n)}b.objectClass="P",b.positionArray=p,b.normalArray=r,b.colorArray=[.8,.8,.8,1],b.texCoordArray=q}var b={};self.addEventListener("message",function(c){var d=c.data;a(d),self.postMessage(b)})}();