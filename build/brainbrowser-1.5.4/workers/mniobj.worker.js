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
* BrainBrowser v1.5.4
*
* Author: Tarek Sherif  <tsherif@gmail.com> (http://tareksherif.ca/)
* Author: Nicolas Kassis
*/
!function(){"use strict";function a(a,i){var j,k,l,m,n,o,p,q=a.replace(/\s+$/,"").replace(/^\s+/,""),r=[],s=i.split,t={},u=q.split(/\s+/).reverse(),v=u.pop();if(t.split=!1,t.type="P"===v?"polygon":"L"===v?"line":v,"polygon"===t.type)b(t,u),t.num_vertices=parseInt(u.pop(),10),c(t,u),d(t,u),t.nitems=parseInt(u.pop(),10);else{if("line"!==t.type)return t.error=!0,void(t.error_message='Invalid MNI Object class: must be "polygon" or "line"');b(t,u),t.num_vertices=parseInt(u.pop(),10),c(t,u),t.nitems=parseInt(u.pop(),10)}if(e(t,u),f(t,u),g(t,u),"polygon"===t.type)s&&(t.split=!0,h(t,u));else if("line"===t.type){for(o=t.indices,p=t.end_indices,n=t.nitems,j=0;n>j;j++){for(l=0===j?0:p[j-1],r.push(o[l]),m=p[j],k=l+1;m-1>k;k++)r.push(o[k]),r.push(o[k]);r.push(o[m-1])}t.indices=r}return t}function b(a,b){"polygon"===a.type?a.surface_properties={ambient:parseFloat(b.pop()),diffuse:parseFloat(b.pop()),specular_reflectance:parseFloat(b.pop()),specular_scattering:parseFloat(b.pop()),transparency:parseFloat(b.pop())}:"line"===a.type&&(a.surfaceProperties={width:b.pop()})}function c(a,b){var c,d,e=[],f=a.num_vertices;for(c=0;f>c;c++)for(d=0;3>d;d++)e.push(parseFloat(b.pop()));a.vertices=e}function d(a,b){var c,d,e=[],f=a.num_vertices;for(c=0;f>c;c++)for(d=0;3>d;d++)e.push(parseFloat(b.pop()));a.normals=e}function e(a,b){var c,d,e,f=[],g=parseInt(b.pop(),10);if(0===g)for(c=0;4>c;c++)f.push(parseFloat(b.pop()));else if(1===g)for(d=0,e=a.num_polygons;e>d;d++)for(c=0;4>c;c++)f.push(parseFloat(b.pop()));else{if(2!==g)throw new Error("colorFlag not valid in that file");for(d=0,e=a.num_vertices;e>d;d++)for(c=0;4>c;c++)f.push(parseFloat(b.pop()))}a.colorFlag=g,a.colors=f}function f(a,b){var c,d,e=[];for(c=0,d=a.nitems;d>c;c++)e.push(parseInt(b.pop(),10));a.end_indices=e}function g(a,b){var c,d,e,f=b.length,g=[];for(d=0,e=b.length;f>d;d++)c=parseInt(b.pop(),10),g.push(c);a.indices=g}function h(a){var b=a.indices.length;a.left={indices:a.indices.slice(0,b/2)},a.right={indices:a.indices.slice(b/2)}}self.addEventListener("message",function(b){var c=b.data,d=a(c.data,c.options)||{error:!0,error_message:"Error parsing data."},e={type:d.type,vertices:d.vertices,normals:d.normals,colors:d.colors,surface_properties:d.surface_properties,split:d.split,error:d.error,error_message:d.error_message};e.shapes=e.split?[{indices:d.left.indices},{indices:d.right.indices}]:[{indices:d.indices}],self.postMessage(e)})}();