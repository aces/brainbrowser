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
!function(){"use strict";function a(a,c,d,e){a=a||[],c=c||[],d=d||[],e=e;var f,g,h,i,j,k,l,m,n,o,p=a.length,q=3*p,r=4*p,s=d.length>0,t={},u={};4===e.length&&(j=!0,f=e[0],g=e[1],h=e[2],i=e[3]);var v=new Float32Array(q),w=s?new Float32Array(q):null,x=new Float32Array(r);for(k=0,l=a.length;l>k;k++)b(t,c[3*a[k]],c[3*a[k]+1],c[3*a[k]+2]);for(u.x=t.min_x+(t.max_x-t.min_x)/2,u.y=t.min_y+(t.max_y-t.min_y)/2,u.z=t.min_z+(t.max_z-t.min_z)/2,k=0;p>k;k+=3)m=3*k,n=4*k,v[m]=c[3*a[k]],v[m+1]=c[3*a[k]+1],v[m+2]=c[3*a[k]+2],v[m+3]=c[3*a[k+1]],v[m+4]=c[3*a[k+1]+1],v[m+5]=c[3*a[k+1]+2],v[m+6]=c[3*a[k+2]],v[m+7]=c[3*a[k+2]+1],v[m+8]=c[3*a[k+2]+2],s&&(w[m]=d[3*a[k]],w[m+1]=d[3*a[k]+1],w[m+2]=d[3*a[k]+2],w[m+3]=d[3*a[k+1]],w[m+4]=d[3*a[k+1]+1],w[m+5]=d[3*a[k+1]+2],w[m+6]=d[3*a[k+2]],w[m+7]=d[3*a[k+2]+1],w[m+8]=d[3*a[k+2]+2]),j?(x[n]=f,x[n+1]=g,x[n+2]=h,x[n+3]=i,x[n+4]=f,x[n+5]=g,x[n+6]=h,x[n+7]=i,x[n+8]=f,x[n+9]=g,x[n+10]=h,x[n+11]=i):(x[n]=e[4*a[k]],x[n+1]=e[4*a[k]+1],x[n+2]=e[4*a[k]+2],x[n+3]=e[4*a[k]+3],x[n+4]=e[4*a[k+1]],x[n+5]=e[4*a[k+1]+1],x[n+6]=e[4*a[k+1]+2],x[n+7]=e[4*a[k+1]+3],x[n+8]=e[4*a[k+2]],x[n+9]=e[4*a[k+2]+1],x[n+10]=e[4*a[k+2]+2],x[n+11]=e[4*a[k+2]+3]);return o={centroid:u,bounding_box:t,unindexed:{position:v,normal:w,color:x}}}function b(a,b,c,d){(!a.min_x||a.min_x>b)&&(a.min_x=b),(!a.max_x||a.max_x<b)&&(a.max_x=b),(!a.min_y||a.min_y>c)&&(a.min_y=c),(!a.max_y||a.max_y<c)&&(a.max_y=c),(!a.min_z||a.min_z>d)&&(a.min_z=d),(!a.max_z||a.max_z<d)&&(a.max_z=d)}self.addEventListener("message",function(b){var c,d,e,f,g=b.data,h=g.shapes,i=g.vertices,j=g.normals,k=g.colors,l=[i.buffer];for(c=0,d=h.length;d>c;c++)e=h[c],f=a(e.indices,i,j,e.color||k),e.centroid=f.centroid,e.unindexed=f.unindexed,l.push(e.indices.buffer),l.push(e.unindexed.position.buffer),e.unindexed.normal&&l.push(e.unindexed.normal.buffer),e.unindexed.color&&l.push(e.unindexed.color.buffer);j&&l.push(j.buffer),k&&l.push(k.buffer),g.deindexed=!0,self.postMessage(g,l)})}();