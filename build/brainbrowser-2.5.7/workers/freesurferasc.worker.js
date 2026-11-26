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
self.addEventListener("message",function(e){var e=(e=>{var s,t,r,a,n,p,i,l,o={};for(e=e.split("\n"),r=e[1].trim().split(/\s+/),a=parseInt(r[0],10),n=parseInt(r[1],10),s=new Float32Array(3*a),t=new Uint32Array(3*n),i=0;i<a;i++)p=e[i+2].trim().split(/\s+/),s[l=3*i]=parseFloat(p[0]),s[l+1]=parseFloat(p[1]),s[l+2]=parseFloat(p[2]);for(i=0;i<n;i++)p=e[i+a+2].trim().split(/\s+/),t[l=3*i]=parseInt(p[0],10),t[l+1]=parseInt(p[1],10),t[l+2]=parseInt(p[2],10);return o.type="polygon",o.vertices=s,o.shapes=[{indices:t}],o})(e.data.data),s=[e.vertices.buffer,e.shapes[0].indices.buffer];self.postMessage(e,s)});