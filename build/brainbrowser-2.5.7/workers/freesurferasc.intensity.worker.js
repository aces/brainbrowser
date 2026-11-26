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
self.addEventListener("message",function(a){a=(a=>{var t,e,s,r,l,n,i;for(a=a.trim(),e=a.split("\n"),l=e.length,t=new Float32Array(l),s=parseFloat(e[0].trim().split(/\s+/)[4]),t[0]=s,i=n=s,r=1;r<l;r++)s=parseFloat(e[r].trim().split(/\s+/)[4]),t[r]=s,n=Math.min(n,s),i=Math.max(i,s);return{values:new Float32Array(t),min:n,max:i}})(a.data.data);self.postMessage(a,[a.values.buffer])});