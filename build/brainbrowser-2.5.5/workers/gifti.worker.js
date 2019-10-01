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
!function(){"use strict";function a(a){var b={},c=gifti.parse(a),d=c.getNumPoints(),e=c.getNumTriangles();if(e>0&&d>0)b.type="polygon",b.vertices=c.getPointsDataArray().getData(),b.shapes=[{indices:c.getTrianglesDataArray().getData()}];else if(c.dataArrays.length>0){var f,g,h,i=c.dataArrays[0].getData(),j=i.length;for(f=+Number.MAX_VALUE,g=-Number.MAX_VALUE,h=0;j>h;h++)f=Math.min(f,i[h]),g=Math.max(g,i[h]);b.values=i,b.min=f,b.max=g;var k="";Object.keys(c.labelTable).forEach(function(a){var b=c.labelTable[a];k+=b.key+" ",k+=b.r+" ",k+=b.g+" ",k+=b.b+" ",k+=b.a+"\n"}),k.length>0&&(b.colors=k)}return b}self.addEventListener("message",function(b){var c=b.data;importScripts(c.url+"gifti-reader.js");var d=a(c.data)||{error:!0,error_message:"Error parsing data."},e=[];d.vertices&&d.shapes[0].indices?(e.push(d.vertices.buffer,d.shapes[0].indices.buffer),self.postMessage(d,e)):(e.push(d.values.buffer),self.postMessage(d,e))})}();