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
self.addEventListener("message",function(e){var n,e=e.data,e=e.indices?[(n=(e=>{var n,r,s,o=new Uint32Array(2*e.length);for(n=0,s=e.length;n<s;n+=3)o[r=2*n]=e[n],o[1+r]=e[n+1],o[2+r]=e[n+1],o[3+r]=e[n+2],o[4+r]=e[n+2],o[5+r]=e[n];return{indices:o}})(e.indices)).indices.buffer]:[(n=((e,n)=>{var r,s,o,t,i,a=new Float32Array(2*e.length),l=new Float32Array(2*n.length),f=e.length/3;for(r=0;r<f;r+=3)i=2*(t=4*r),a[s=2*(o=3*r)]=e[o],a[1+s]=e[1+o],a[2+s]=e[2+o],a[3+s]=e[3+o],a[4+s]=e[4+o],a[5+s]=e[5+o],a[6+s]=e[3+o],a[7+s]=e[4+o],a[8+s]=e[5+o],a[9+s]=e[6+o],a[10+s]=e[7+o],a[11+s]=e[8+o],a[12+s]=e[6+o],a[13+s]=e[7+o],a[14+s]=e[8+o],a[15+s]=e[o],a[16+s]=e[1+o],a[17+s]=e[2+o],l[i]=n[t],l[1+i]=n[1+t],l[2+i]=n[2+t],l[3+i]=n[3+t],l[4+i]=n[4+t],l[5+i]=n[5+t],l[6+i]=n[6+t],l[7+i]=n[7+t],l[8+i]=n[4+t],l[9+i]=n[5+t],l[10+i]=n[6+t],l[11+i]=n[7+t],l[12+i]=n[8+t],l[13+i]=n[9+t],l[14+i]=n[10+t],l[15+i]=n[11+t],l[16+i]=n[8+t],l[17+i]=n[9+t],l[18+i]=n[10+t],l[19+i]=n[11+t],l[20+i]=n[t],l[21+i]=n[1+t],l[22+i]=n[2+t],l[23+i]=n[3+t];return{positions:a,colors:l}})(e.positions,e.colors)).positions.buffer,n.colors.buffer];self.postMessage(n,e)});