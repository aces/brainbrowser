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
!function(){"use strict";function a(a){var b,c,d,e,f,g,h;for(a=a.trim(),c=a.split("\n"),f=c.length,b=new Float32Array(f),d=parseFloat(c[0].trim().split(/\s+/)[4]),b[0]=d,g=d,h=d,e=1;f>e;e++)d=parseFloat(c[e].trim().split(/\s+/)[4]),b[e]=d,g=Math.min(g,d),h=Math.max(h,d);return{values:new Float32Array(b),min:g,max:h}}self.addEventListener("message",function(b){var c=a(b.data.data);self.postMessage(c,[c.values.buffer])})}();