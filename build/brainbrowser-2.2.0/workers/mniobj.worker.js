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
* BrainBrowser v2.2.0
*
* Author: Tarek Sherif  <tsherif@gmail.com> (http://tareksherif.ca/)
* Author: Nicolas Kassis
* Author: Paul Mougel
*
* three.js (c) 2010-2014 three.js authors, used under the MIT license
*/
!function(){"use strict";function a(a,l){j=a.trim().split(/\s+/).reverse(),k=j.length-1;var m,n,o,p,q,r,s,t=[],u=l.split,v={},w=i();if(v.split=!1,v.type="P"===w?"polygon":"L"===w?"line":w,"polygon"===v.type)b(v),v.num_vertices=parseInt(i(),10),c(v),d(v),v.nitems=parseInt(i(),10);else{if("line"!==v.type)return v.error=!0,void(v.error_message='Invalid MNI Object class: must be "polygon" or "line"');b(v),v.num_vertices=parseInt(i(),10),c(v),v.nitems=parseInt(i(),10)}if(e(v),f(v),g(v),"polygon"===v.type)u&&(v.split=!0,h(v));else if("line"===v.type){for(r=v.indices,s=v.end_indices,q=v.nitems,m=0;q>m;m++){for(o=0===m?0:s[m-1],t.push(r[o]),p=s[m],n=o+1;p-1>n;n++)t.push(r[n]),t.push(r[n]);t.push(r[p-1])}v.indices=t}return v}function b(a){"polygon"===a.type?a.surface_properties={ambient:parseFloat(i()),diffuse:parseFloat(i()),specular_reflectance:parseFloat(i()),specular_scattering:parseFloat(i()),transparency:parseFloat(i())}:"line"===a.type&&(a.surfaceProperties={width:i()})}function c(a){var b,c=3*a.num_vertices,d=new Float32Array(c);for(b=0;c>b;b++)d[b]=parseFloat(i());a.vertices=d}function d(a){var b,c=3*a.num_vertices,d=new Float32Array(c);for(b=0;c>b;b++)d[b]=parseFloat(i());a.normals=d}function e(a){var b,c,d,e=parseInt(i(),10);if(0===e)for(b=new Float32Array(4),c=0;4>c;c++)b[c]=parseFloat(i());else if(1===e)for(d=4*a.num_polygons,b=new Float32Array(d),c=0;d>c;c++)b[c]=parseFloat(i());else if(2===e)for(d=4*a.num_vertices,b=new Float32Array(d),c=0;d>c;c++)b[c]=parseFloat(i());else a.error=!0,a.error_message="Invalid color flag: "+e;a.color_flag=e,a.colors=b}function f(a){var b,c=a.nitems,d=new Uint32Array(c);for(b=0;c>b;b++)d[b]=parseInt(i(),10);a.end_indices=d}function g(a){var b,c=k+1,d=new Float32Array(c);for(b=0;c>b;b++)d[b]=parseInt(i(),10);a.indices=d}function h(a){var b=a.indices.length;a.left={indices:Array.prototype.slice.call(a.indices,0,b/2)},a.right={indices:Array.prototype.slice.call(a.indices,b/2)}}function i(){return j[k--]}var j,k;self.addEventListener("message",function(b){var c=b.data,d=a(c.data,c.options)||{error:!0,error_message:"Error parsing data."},e={type:d.type,vertices:d.vertices,normals:d.normals,colors:d.colors,surface_properties:d.surface_properties,split:d.split,error:d.error,error_message:d.error_message};e.shapes=e.split?[{indices:d.left.indices},{indices:d.right.indices}]:[{indices:d.indices}],self.postMessage(e)})}();