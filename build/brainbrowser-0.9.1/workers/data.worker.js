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
!function(){"use strict";function a(a){var b,d,e,f;for(a=a.replace(/^\s+/,"").replace(/\s+$/,""),c.values=a.split(/\s+/),e=c.values[0],f=c.values[0],b=0,d=c.values.length;d>b;b++)c.values[b]=parseFloat(c.values[b]),e=Math.min(e,c.values[b]),f=Math.max(f,c.values[b]);c.min=e,c.max=f}function b(a,b,c,d,e,f,g,h){var i,j,k,l,m,n,o=[],p=(c-b+(c-b)/d.length)/d.length;for(i=0,k=a.length;k>i;i++)m=a[i],l=b>=m?b>m&&!f?-1:0:m>c?f?d.length-1:-1:parseInt((m-b)/p,10),e&&-1!==l?o.push.apply(o,d[d.length-1-l]):-1===l?4===g.length?o.push.apply(o,g):o.push(g[4*i],g[4*i+1],g[4*i+2],g[4*i+3]):o.push.apply(o,d[l]);if(2!==h.num_hemisphere){for(k=h.indexArray.length,n=new Array(4*k),j=0;k>j;j++)n[4*j]=o[4*h.indexArray[j]],n[4*j+1]=o[4*h.indexArray[j]+1],n[4*j+2]=o[4*h.indexArray[j]+2],n[4*j+3]=o[4*h.indexArray[j]+3];o.nonIndexedColorArray=n}return o}var c={};self.addEventListener("message",function(d){var e=d.data,f=e.cmd,g=e.data;"parse"===f?(a(g),self.postMessage(c)):"createColorArray"===f?self.postMessage(b(g.values,g.min,g.max,g.spectrum,g.flip,g.clamped,g.original_colors,g.model)):self.terminate()})}();