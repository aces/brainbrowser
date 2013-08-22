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
var result={};self.addEventListener("message",function(f){var b=f.data;var d=b.cmd;var c=b.data;var a;if(d==="parse"){parse(c);self.postMessage(result)}else{if(d=="createColorArray"){self.postMessage(createColorArray(c.values,c.min,c.max,c.spectrum,c.flip,c.clamped,c.original_colors,c.model))}else{self.terminate()}}});function parse(b){var d,e,c,a;b=b.replace(/^\s+/,"").replace(/\s+$/,"");result.values=b.split(/\s+/);c=result.values[0];a=result.values[0];for(d=0,e=result.values.length;d<e;d++){result.values[d]=parseFloat(result.values[d]);c=Math.min(c,result.values[d]);a=Math.max(a,result.values[d])}result.min=c;result.max=a}function createColorArray(q,c,l,k,e,p,a,f){var o=new Array();var n=((l-c)+(l-c)/k.length)/k.length;var d,b,h;var r;var m;var g;for(d=0,h=q.length;d<h;d++){m=q[d];if(m<=c){if(m<c&&!p){r=-1}else{r=0}}else{if(m>l){if(!p){r=-1}else{r=k.length-1}}else{r=parseInt((m-c)/n)}}if(e&&r!=-1){o.push.apply(o,k[k.length-1-r])}else{if(r===-1){if(a.length===4){o.push.apply(o,a)}else{o.push(a[d*4],a[d*4+1],a[d*4+2],a[d*4+3])}}else{o.push.apply(o,k[r])}}}if(f.num_hemisphere!=2){h=f.indexArray.length;g=new Array(h*4);for(b=0;b<h;b++){g[b*4]=o[f.indexArray[b]*4];g[b*4+1]=o[f.indexArray[b]*4+1];g[b*4+2]=o[f.indexArray[b]*4+2];g[b*4+3]=o[f.indexArray[b]*4+3]}o.nonIndexedColorArray=g}return o};