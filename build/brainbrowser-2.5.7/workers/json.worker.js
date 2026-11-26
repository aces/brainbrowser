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
(()=>{function c(r,o){if(!Array.isArray(r))return[r];if((o=o||0)===r.length)return[];for(var e=[],s=0,l=r.length;s<l;s++)e.push.apply(e,c(r[s]));return e}self.addEventListener("message",function(r){var r=(r=>{var a={name:r.name,type:r.type,shapes:[]},n=[];return a.vertices=new Float32Array(c(r.vertices)),n.push(a.vertices.buffer),r.colors=r.colors||r.color,r.colors&&(a.colors=c(r.colors),a.vertices.length===a.colors.length||3===a.colors.length?a.colors=(r=>{var o,e,s,l;for(o=new Float32Array(4*r.length/3),e=s=0,l=r.length;e<l;)o[s++]=r[e++],o[s++]=r[e++],o[s++]=r[e++],o[s++]=1;return o})(a.colors):a.colors=new Float32Array(a.colors),n.push(a.colors.buffer)),r.normals&&(a.normals=new Float32Array(c(r.normals)),n.push(a.normals.buffer)),void 0===r.shapes&&(r.shapes=[]),r.indices&&r.shapes.push({indices:r.indices}),r.shapes.forEach(function(r){var o=new Uint32Array(c(r.indices));if(r.one_indexed){var e,s,l=o;for(e=0,s=l.length;e<s;e++)l[e]=l[e]-1}n.push(o.buffer),r.color=r.color||r.colors,Array.isArray(r.color)&&3===r.color.length&&r.color.push(1),r.color&&(r.color=new Float32Array(r.color),n.push(r.color.buffer)),a.shapes.push({name:r.name,indices:o,color:r.color})}),{result:a,transfer:n}})(JSON.parse(r.data.data)),o=r.result;self.postMessage(o,r.transfer)})})();