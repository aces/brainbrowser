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
!function(){"use strict";function a(a){var b,c,d,e,f,g,h,i,j={};for(a=a.split("\n"),d=a[1].trim().split(/\s+/),e=parseInt(d[0],10),f=parseInt(d[1],10),b=new Float32Array(3*e),c=new Uint32Array(3*f),h=0;e>h;h++)g=a[h+2].trim().split(/\s+/),i=3*h,b[i]=parseFloat(g[0]),b[i+1]=parseFloat(g[1]),b[i+2]=parseFloat(g[2]);for(h=0;f>h;h++)g=a[h+e+2].trim().split(/\s+/),i=3*h,c[i]=parseInt(g[0],10),c[i+1]=parseInt(g[1],10),c[i+2]=parseInt(g[2],10);return j.type="polygon",j.vertices=b,j.shapes=[{indices:c}],j}self.addEventListener("message",function(b){var c=a(b.data.data),d=[c.vertices.buffer,c.shapes[0].indices.buffer];self.postMessage(c,d)})}();