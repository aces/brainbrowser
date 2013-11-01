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

/* brainbrowser v0.9.1 */
!function(){"use strict";function a(a){var c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t=[],u=[],v=[];for(a=a.split("\n"),b.shapes=[],c={name:"undefined"|a.name,faces:[],positionArray:[],colorArray:[],indexArray:[],texIndexArray:[],normalIndexArray:[]},b.shapes.push(c),k=0,p=a.length;p>k;k++)if(g=a[k].split(/\s+/),h=g[0],i=g.length,!h.match("#")||""===g)switch(h){case"o":case"g":c={name:g[1],faces:[],positionArray:[],colorArray:[],indexArray:[],texIndexArray:[],normalIndexArray:[]},b.shapes.push(c);break;case"v":t.push(parseFloat(g[1])),t.push(parseFloat(g[2])),t.push(parseFloat(g[3]));break;case"vt":for(l=1;i>l;l++)u.push(parseFloat(g[l]));break;case"vn":v.push(parseFloat(g[1])),v.push(parseFloat(g[2])),v.push(parseFloat(g[3]));break;case"f":for(q=[],d=c.indexArray,e=c.texIndexArray,f=c.normalIndexArray,m=1;4>m;m++)s=g[m].split("/"),q.push(parseInt(s[0],10)-1),d.push(parseInt(s[0],10)-1),e.push(parseInt(s[1],10)-1),s[2]&&f.push(parseInt(s[2],10)-1);if(i>=4)for(;i>m;)s=g[m].split("/"),q.push(parseInt(s[0],10)-1),o=c.indexArray.length,d.push(c.indexArray[o-1]),d.push(c.indexArray[o-3]),d.push(s[0]-1),m++;c.faces.push(q)}for(j=b.shapes.length,n=0;j>n;n++)r=b.shapes[n],r.positionArray=t,0===r.colorArray.length&&(r.colorArray=[.8,.8,.8,1]);b.objectClass="P",b.vertexArray=t,b.texCoordArray=u}var b={};self.addEventListener("message",function(c){var d=c.data;a(d),self.postMessage(b)})}();