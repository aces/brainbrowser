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
(()=>{var E,L;function M(e){"polygon"===e.type?e.surface_properties={ambient:parseFloat(j()),diffuse:parseFloat(j()),specular_reflectance:parseFloat(j()),specular_scattering:parseFloat(j()),transparency:parseFloat(j())}:"line"===e.type&&(e.surfaceProperties={width:j()})}function P(e){for(var r=3*e.num_vertices,s=new Float32Array(r),i=0;i<r;i++)s[i]=parseFloat(j());e.vertices=s}function j(){return E[L--]}self.addEventListener("message",function(e){var e=e.data,e=((e,r)=>{E=e.trim().split(/\s+/).reverse(),L=E.length-1;var s,i,t,a,n,o,l,p,c,f,e=r.split,r={},d=j();if(r.split=!1,r.type="P"===d?"polygon":"L"===d?"line":d,"polygon"===r.type){M(r),r.num_vertices=parseInt(j(),10),P(r);{d=r;var u,y=3*d.num_vertices,m=new Float32Array(y);for(u=0;u<y;u++)m[u]=parseFloat(j());d.normals=m}}else{if("line"!==r.type)return r.error=!0,void(r.error_message='Invalid MNI Object class: must be "polygon" or "line"');M(r),r.num_vertices=parseInt(j(),10),P(r)}r.nitems=parseInt(j(),10);var g,v,_,d=r,F=parseInt(j(),10);if(0===F)for(g=new Float32Array(4),v=0;v<4;v++)g[v]=parseFloat(j());else if(1===F)for(_=4*d.num_polygons,g=new Float32Array(_),v=0;v<_;v++)g[v]=parseFloat(j());else if(2===F)for(_=4*d.num_vertices,g=new Float32Array(_),v=0;v<_;v++)g[v]=parseFloat(j());else d.error=!0,d.error_message="Invalid color flag: "+F;d.color_flag=F,d.colors=g;var A,d=r,h=d.nitems,w=new Uint32Array(h);for(A=0;A<h;A++)w[A]=parseInt(j(),10);d.end_indices=w;var b,d=r,I=L+1,U=new Uint32Array(I);for(b=0;b<I;b++)U[b]=parseInt(j(),10);if(d.indices=U,"polygon"===r.type){if(e){r.split=!0;{d=r;e=d.indices.length;d.left={indices:new Uint32Array(Array.prototype.slice.call(d.indices,0,e/2))},d.right={indices:new Uint32Array(Array.prototype.slice.call(d.indices,e/2))}}}}else if("line"===r.type){for(p=[],o=r.indices,l=r.end_indices,n=r.nitems,c=f=0,s=0;s<n;s++)t=0===s?0:l[s-1],a=l[s],c+=2*(a-t-1);for(p=new Uint32Array(c),s=0;s<n;s++){for(t=0===s?0:l[s-1],p[f++]=o[t],a=l[s],i=t+1;i<a-1;i++)p[f++]=o[i],p[f++]=o[i];p[f++]=o[a-1]}r.indices=p}return r})(e.data,e.options)||{error:!0,error_message:"Error parsing data."},r={type:e.type,vertices:e.vertices,normals:e.normals,colors:e.colors,surface_properties:e.surface_properties,split:e.split,error:e.error,error_message:e.error_message},s=[r.vertices.buffer,r.colors.buffer];r.normals&&s.push(r.normals.buffer),r.split?(r.shapes=[{indices:e.left.indices},{indices:e.right.indices}],s.push(e.left.indices.buffer,e.right.indices.buffer)):(r.shapes=[{indices:e.indices}],s.push(e.indices.buffer)),self.postMessage(r,s)})})();