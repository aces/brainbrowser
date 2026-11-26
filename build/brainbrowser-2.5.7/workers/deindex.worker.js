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
self.addEventListener("message",function(n){for(var e,i,n=n.data,r=n.shapes,o=n.vertices,a=n.normals,d=n.colors,m=[o.buffer],x=0,_=r.length;x<_;x++)i=((n,e,i,r)=>{e=e||[];var o,a,d,m,x,_,u,s,l,f=(n=n||[]).length,t=3*f,y=4*f,c=0<(i=i||[]).length,h={},v={},p=(4===r.length&&(x=!0,o=r[0],a=r[1],d=r[2],m=r[3]),new Float32Array(t)),z=c?new Float32Array(t):null,b=new Float32Array(y);for(_=0,u=n.length;_<u;_++){g=void 0;w=void 0;A=void 0;F=void 0;var g=h;var w=e[3*n[_]];var A=e[3*n[_]+1];var F=e[3*n[_]+2];(!g.min_x||g.min_x>w)&&(g.min_x=w),(!g.max_x||g.max_x<w)&&(g.max_x=w),(!g.min_y||g.min_y>A)&&(g.min_y=A),(!g.max_y||g.max_y<A)&&(g.max_y=A),(!g.min_z||g.min_z>F)&&(g.min_z=F),(!g.max_z||g.max_z<F)&&(g.max_z=F)}for(v.x=h.min_x+(h.max_x-h.min_x)/2,v.y=h.min_y+(h.max_y-h.min_y)/2,v.z=h.min_z+(h.max_z-h.min_z)/2,_=0;_<f;_+=3)l=4*_,p[s=3*_]=e[3*n[_]],p[1+s]=e[3*n[_]+1],p[2+s]=e[3*n[_]+2],p[3+s]=e[3*n[_+1]],p[4+s]=e[3*n[_+1]+1],p[5+s]=e[3*n[_+1]+2],p[6+s]=e[3*n[_+2]],p[7+s]=e[3*n[_+2]+1],p[8+s]=e[3*n[_+2]+2],c&&(z[s]=i[3*n[_]],z[1+s]=i[3*n[_]+1],z[2+s]=i[3*n[_]+2],z[3+s]=i[3*n[_+1]],z[4+s]=i[3*n[_+1]+1],z[5+s]=i[3*n[_+1]+2],z[6+s]=i[3*n[_+2]],z[7+s]=i[3*n[_+2]+1],z[8+s]=i[3*n[_+2]+2]),x?(b[l]=o,b[1+l]=a,b[2+l]=d,b[3+l]=m,b[4+l]=o,b[5+l]=a,b[6+l]=d,b[7+l]=m,b[8+l]=o,b[9+l]=a,b[10+l]=d,b[11+l]=m):(b[l]=r[4*n[_]],b[1+l]=r[4*n[_]+1],b[2+l]=r[4*n[_]+2],b[3+l]=r[4*n[_]+3],b[4+l]=r[4*n[_+1]],b[5+l]=r[4*n[_+1]+1],b[6+l]=r[4*n[_+1]+2],b[7+l]=r[4*n[_+1]+3],b[8+l]=r[4*n[_+2]],b[9+l]=r[4*n[_+2]+1],b[10+l]=r[4*n[_+2]+2],b[11+l]=r[4*n[_+2]+3]);return{centroid:v,bounding_box:h,unindexed:{position:p,normal:z,color:b}}})((e=r[x]).indices,o,a,e.color||d),e.centroid=i.centroid,e.unindexed=i.unindexed,m.push(e.indices.buffer),m.push(e.unindexed.position.buffer),e.unindexed.normal&&m.push(e.unindexed.normal.buffer),e.unindexed.color&&m.push(e.unindexed.color.buffer);a&&m.push(a.buffer),d&&m.push(d.buffer),n.deindexed=!0,self.postMessage(n,m)});