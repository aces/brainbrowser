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
* BrainBrowser v1.6.0
*
* Author: Tarek Sherif  <tsherif@gmail.com> (http://tareksherif.ca/)
* Author: Nicolas Kassis
*/
!function(){"use strict";function a(a){var b,c,d,e,f,g,h,i=[],j={};for(a=a.split("\n"),j.shapes=[],b={name:"undefined"|a.name,faces:[],indices:[]},j.shapes.push(b),c=a[1].split(/\s+/),d=parseInt(c[0],10),e=parseInt(c[1],10),h=2;d+2>h;h++)f=a[h].split(/\s+/),i.push(parseFloat(f[0])),i.push(parseFloat(f[1])),i.push(parseFloat(f[2]));for(h=d+2;d+e+2>h;h++)f=a[h].split(/\s+/),g=[],g.push(parseInt(f[0],10)),g.push(parseInt(f[1],10)),g.push(parseInt(f[2],10)),Array.prototype.push.apply(b.indices,g),b.faces.push(g);return j.type="polygon",j.vertices=i,j.colors=[.8,.8,.8,1],j}self.addEventListener("message",function(b){self.postMessage(a(b.data.data))})}();