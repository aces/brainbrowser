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
* BrainBrowser v1.5.4
*
* Author: Tarek Sherif  <tsherif@gmail.com> (http://tareksherif.ca/)
* Author: Nicolas Kassis
*/
!function(){"use strict";function a(a){var b,c,d,e,f,g,h={values:[]};for(a=a.replace(/^\s+/,"").replace(/\s+$/,""),b=a.split("\n"),c=parseFloat(b[0].split(/\s+/)[4]),h.values[0]=c,f=c,g=c,d=1,e=b.length;e>d;d++)c=parseFloat(b[d].split(/\s+/)[4]),h.values[d]=c,f=Math.min(f,c),g=Math.max(g,c);return h.min=f,h.max=g,h}self.addEventListener("message",function(b){var c=b.data,d=c.data;self.postMessage(a(d))})}();