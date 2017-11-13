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
!function(){"use strict";function a(a,l){j=a.trim().split(/\s+/).reverse(),k=j.length-1;var m,n,o,p,q,r,s,t,u,v,w=l.split,x={},y=i();if(x.split=!1,x.type="P"===y?"polygon":"L"===y?"line":y,"polygon"===x.type)b(x),x.num_vertices=parseInt(i(),10),c(x),d(x),x.nitems=parseInt(i(),10);else{if("line"!==x.type)return x.error=!0,void(x.error_message='Invalid MNI Object class: must be "polygon" or "line"');b(x),x.num_vertices=parseInt(i(),10),c(x),x.nitems=parseInt(i(),10)}if(e(x),f(x),g(x),"polygon"===x.type)w&&(x.split=!0,h(x));else if("line"===x.type){for(t=[],r=x.indices,s=x.end_indices,q=x.nitems,u=v=0,m=0;q>m;m++)o=0===m?0:s[m-1],p=s[m],u+=2*(p-o-1);for(t=new Uint32Array(u),m=0;q>m;m++){for(o=0===m?0:s[m-1],t[v++]=r[o],p=s[m],n=o+1;p-1>n;n++)t[v++]=r[n],t[v++]=r[n];t[v++]=r[p-1]}x.indices=t}return x}function b(a){"polygon"===a.type?a.surface_properties={ambient:parseFloat(i()),diffuse:parseFloat(i()),specular_reflectance:parseFloat(i()),specular_scattering:parseFloat(i()),transparency:parseFloat(i())}:"line"===a.type&&(a.surfaceProperties={width:i()})}function c(a){var b,c=3*a.num_vertices,d=new Float32Array(c);for(b=0;c>b;b++)d[b]=parseFloat(i());a.vertices=d}function d(a){var b,c=3*a.num_vertices,d=new Float32Array(c);for(b=0;c>b;b++)d[b]=parseFloat(i());a.normals=d}function e(a){var b,c,d,e=parseInt(i(),10);if(0===e)for(b=new Float32Array(4),c=0;4>c;c++)b[c]=parseFloat(i());else if(1===e)for(d=4*a.num_polygons,b=new Float32Array(d),c=0;d>c;c++)b[c]=parseFloat(i());else if(2===e)for(d=4*a.num_vertices,b=new Float32Array(d),c=0;d>c;c++)b[c]=parseFloat(i());else a.error=!0,a.error_message="Invalid color flag: "+e;a.color_flag=e,a.colors=b}function f(a){var b,c=a.nitems,d=new Uint32Array(c);for(b=0;c>b;b++)d[b]=parseInt(i(),10);a.end_indices=d}function g(a){var b,c=k+1,d=new Uint32Array(c);for(b=0;c>b;b++)d[b]=parseInt(i(),10);a.indices=d}function h(a){var b=a.indices.length;a.left={indices:new Uint32Array(Array.prototype.slice.call(a.indices,0,b/2))},a.right={indices:new Uint32Array(Array.prototype.slice.call(a.indices,b/2))}}function i(){return j[k--]}var j,k;self.addEventListener("message",function(b){var c=b.data,d=a(c.data,c.options)||{error:!0,error_message:"Error parsing data."},e={type:d.type,vertices:d.vertices,normals:d.normals,colors:d.colors,surface_properties:d.surface_properties,split:d.split,error:d.error,error_message:d.error_message},f=[e.vertices.buffer,e.colors.buffer];e.normals&&f.push(e.normals.buffer),e.split?(e.shapes=[{indices:d.left.indices},{indices:d.right.indices}],f.push(d.left.indices.buffer,d.right.indices.buffer)):(e.shapes=[{indices:d.indices}],f.push(d.indices.buffer)),self.postMessage(e,f)})}();