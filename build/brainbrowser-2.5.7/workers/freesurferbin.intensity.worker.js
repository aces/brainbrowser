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
self.addEventListener("message",function(e){e=(e=>{var r,t,a,n,o,s=new DataView(e),f=0,e=(e=>{var r,t=0;for(r=0;r<3;r++)t+=e.getUint8(r)<<8*(3-r-1);return t})(s);if(f+=3,16777215!==e)return{error:!0,error_message:"Unrecognized file format."};if(t=s.getUint32(f),f+=8,e=s.getUint32(f),f+=4,1!==e)return{error:!0,error_message:"Only one value per vertex supported. Number of values: "+e};for((r=new Float32Array(t))[0]=a=n=s.getFloat32(f),f+=4,o=1;o<t;o++)r[o]=s.getFloat32(f),a=Math.min(a,r[o]),n=Math.max(n,r[o]),f+=4;return{values:r,min:a,max:n}})(e.data.data);self.postMessage(e,[e.values.buffer])});