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
!function(){"use strict";function a(a){var c,d,e,f,g,h,i=new DataView(a),j=0,k=b(i);if(j+=3,16777215!==k)return{error:!0,error_message:"Unrecognized file format."};if(d=i.getUint32(j),j+=8,e=i.getUint32(j),j+=4,1!==e)return{error:!0,error_message:"Only one value per vertex supported. Number of values: "+e};for(c=new Float32Array(d),c[0]=f=g=i.getFloat32(j),j+=4,h=1;d>h;h++)c[h]=i.getFloat32(j),f=Math.min(f,c[h]),g=Math.max(g,c[h]),j+=4;return{values:c,min:f,max:g}}function b(a){var b,c=0;for(b=0;3>b;b++)c+=a.getUint8(b)<<8*(3-b-1);return c}self.addEventListener("message",function(b){var c=a(b.data.data);self.postMessage(c,[c.values.buffer])})}();