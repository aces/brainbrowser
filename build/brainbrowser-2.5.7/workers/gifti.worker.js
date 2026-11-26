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
self.addEventListener("message",function(e){var e=e.data,e=(importScripts(e.url+"gifti-reader.js"),(e=>{var a,r,s,t={},i=gifti.parse(e),e=i.getNumPoints();if(0<i.getNumTriangles()&&0<e)t.type="polygon",t.vertices=i.getPointsDataArray().getData(),t.shapes=[{indices:i.getTrianglesDataArray().getData()}];else if(0<i.dataArrays.length){var n=i.dataArrays[0].getData(),g=n.length;for(a=+Number.MAX_VALUE,r=-Number.MAX_VALUE,s=0;s<g;s++)a=Math.min(a,n[s]),r=Math.max(r,n[s]);t.values=n,t.min=a,t.max=r;var l="";Object.keys(i.labelTable).forEach(function(e){e=i.labelTable[e];l=(l=(l=(l=(l+=e.key+" ")+e.r+" ")+e.g+" ")+e.b+" ")+e.a+"\n"}),0<l.length&&(t.colors=l)}return t})(e.data)||{error:!0,error_message:"Error parsing data."}),a=[];e.vertices&&e.shapes[0].indices?a.push(e.vertices.buffer,e.shapes[0].indices.buffer):a.push(e.values.buffer),self.postMessage(e,a)});