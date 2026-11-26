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
self.addEventListener("message",function(e){var e=(e=>{var t,r,a,n,s,i,g=new DataView(e),o=0,e=(e=>{var t,r=0;for(t=0;t<3;t++)r+=e.getUint8(t)<<8*(3-t-1);return r})(g);if(o+=3,16777214!==e)return{error:!0,error_message:"Only triangle meshes supported."};for(;10!==g.getUint8(o)||10!==g.getUint8(o+1);)o++;for(o+=2,r=g.getUint32(o),o+=4,n=3*g.getUint32(o),o+=4,t=new Float32Array(3*r),a=new Uint32Array(n),s=0;s<r;s++)t[i=3*s]=g.getFloat32(o),o+=4,t[1+i]=g.getFloat32(o),o+=4,t[2+i]=g.getFloat32(o),o+=4;for(s=0;s<n;s++)a[s]=g.getUint32(o),o+=4;return{vertices:t,shapes:[{indices:a}]}})(e.data.data),t=[e.vertices.buffer,e.shapes[0].indices.buffer];self.postMessage(e,t)});