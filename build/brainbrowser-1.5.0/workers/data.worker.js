/*
* BrainBrowser: Web-based Neurological Visualization Tools
* (https://brainbrowser.cbrain.mcgill.ca)
*
* Copyright (C) 2011 McGill University 
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
* BrainBrowser v1.5.0
*
* Author: Tarek Sherif  <tsherif@gmail.com> (http://tareksherif.ca/)
* Author: Nicolas Kassis
*/
!function(){"use strict";function a(a){var b,c,d,e,f={};for(a=a.replace(/^\s+/,"").replace(/\s+$/,""),f.values=a.split(/\s+/),d=f.values[0],e=f.values[0],b=0,c=f.values.length;c>b;b++)f.values[b]=parseFloat(f.values[b]),d=Math.min(d,f.values[b]),e=Math.max(e,f.values[b]);return f.min=d,f.max=e,f}self.addEventListener("message",function(b){var c=b.data,d=c.data;self.postMessage(a(d))})}();