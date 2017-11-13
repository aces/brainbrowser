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
!function(){"use strict";function a(a){var b,c,d,e=new Uint32Array(2*a.length);for(b=0,d=a.length;d>b;b+=3)c=2*b,e[c]=a[b],e[c+1]=a[b+1],e[c+2]=a[b+1],e[c+3]=a[b+2],e[c+4]=a[b+2],e[c+5]=a[b];return{indices:e}}function b(a,b){var c,d,e,f,g,h=new Float32Array(2*a.length),i=new Float32Array(2*b.length),j=a.length/3;for(c=0;j>c;c+=3)e=3*c,f=4*c,d=2*e,g=2*f,h[d]=a[e],h[d+1]=a[e+1],h[d+2]=a[e+2],h[d+3]=a[e+3],h[d+4]=a[e+4],h[d+5]=a[e+5],h[d+6]=a[e+3],h[d+7]=a[e+4],h[d+8]=a[e+5],h[d+9]=a[e+6],h[d+10]=a[e+7],h[d+11]=a[e+8],h[d+12]=a[e+6],h[d+13]=a[e+7],h[d+14]=a[e+8],h[d+15]=a[e],h[d+16]=a[e+1],h[d+17]=a[e+2],i[g]=b[f],i[g+1]=b[f+1],i[g+2]=b[f+2],i[g+3]=b[f+3],i[g+4]=b[f+4],i[g+5]=b[f+5],i[g+6]=b[f+6],i[g+7]=b[f+7],i[g+8]=b[f+4],i[g+9]=b[f+5],i[g+10]=b[f+6],i[g+11]=b[f+7],i[g+12]=b[f+8],i[g+13]=b[f+9],i[g+14]=b[f+10],i[g+15]=b[f+11],i[g+16]=b[f+8],i[g+17]=b[f+9],i[g+18]=b[f+10],i[g+19]=b[f+11],i[g+20]=b[f],i[g+21]=b[f+1],i[g+22]=b[f+2],i[g+23]=b[f+3];return{positions:h,colors:i}}self.addEventListener("message",function(c){var d,e,f=c.data;f.indices?(d=a(f.indices),e=[d.indices.buffer]):(d=b(f.positions,f.colors),e=[d.positions.buffer,d.colors.buffer]),self.postMessage(d,e)})}();