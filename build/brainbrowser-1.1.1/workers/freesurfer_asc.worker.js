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

/* brainbrowser v1.1.1 */
!function(){"use strict";function a(a){var c,d,e,f,g,h,i,j=[];for(a=a.split("\n"),b.shapes=[],c={name:"undefined"|a.name,faces:[],positionArray:[],colorArray:[],indexArray:[],texIndexArray:[],normalIndexArray:[]},b.shapes.push(c),d=a[1].split(/\s+/),e=parseInt(d[0],10),f=parseInt(d[1],10),i=2;e+2>i;i++)g=a[i].split(/\s+/),j.push(parseFloat(g[0])),j.push(parseFloat(g[1])),j.push(parseFloat(g[2]));for(i=e+2;e+f+2>i;i++)g=a[i].split(/\s+/),h=[],h.push(parseInt(g[0],10)),h.push(parseInt(g[1],10)),h.push(parseInt(g[2],10)),Array.prototype.push.apply(c.indexArray,h),c.faces.push(h);b.objectClass="P",b.positionArray=j,b.colorArray=[.8,.8,.8,1]}var b={};self.addEventListener("message",function(c){var d=c.data;a(d.data),self.postMessage(b)})}();