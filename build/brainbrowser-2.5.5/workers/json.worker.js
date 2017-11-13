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
!function(){"use strict";function a(a){var e={name:a.name,type:a.type,shapes:[]},f=[];return e.vertices=new Float32Array(b(a.vertices)),f.push(e.vertices.buffer),a.colors=a.colors||a.color,a.colors&&(e.colors=b(a.colors),e.vertices.length===e.colors.length||3===e.colors.length?e.colors=c(e.colors):e.colors=new Float32Array(e.colors),f.push(e.colors.buffer)),a.normals&&(e.normals=new Float32Array(b(a.normals)),f.push(e.normals.buffer)),void 0===a.shapes&&(a.shapes=[]),a.indices&&a.shapes.push({indices:a.indices}),a.shapes.forEach(function(a){var c=new Uint32Array(b(a.indices));a.one_indexed&&d(c),f.push(c.buffer),a.color=a.color||a.colors,Array.isArray(a.color)&&3===a.color.length&&a.color.push(1),a.color&&(a.color=new Float32Array(a.color),f.push(a.color.buffer)),e.shapes.push({name:a.name,indices:c,color:a.color})}),{result:e,transfer:f}}function b(a,c){if(!Array.isArray(a))return[a];if(c=c||0,c===a.length)return[];var d,e,f=[];for(d=0,e=a.length;e>d;d++)f.push.apply(f,b(a[d]));return f}function c(a){var b,c,d,e;for(b=new Float32Array(4*a.length/3),c=d=0,e=a.length;e>c;)b[d++]=a[c++],b[d++]=a[c++],b[d++]=a[c++],b[d++]=1;return b}function d(a){var b,c;for(b=0,c=a.length;c>b;b++)a[b]=a[b]-1}self.addEventListener("message",function(b){var c=a(JSON.parse(b.data.data)),d=c.result,e=c.transfer;self.postMessage(d,e)})}();