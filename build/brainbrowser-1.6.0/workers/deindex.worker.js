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
* BrainBrowser v1.6.0
*
* Author: Tarek Sherif  <tsherif@gmail.com> (http://tareksherif.ca/)
* Author: Nicolas Kassis
*/
!function(){"use strict";function a(a,c,d,e,f){a=a||[],c=c||[],d=d||[],e=e||[.7,.7,.7,1];var g,h,i,j,k,l,m,n,o,p,q,r,s,t=a.length,u=3*t,v=4*t,w=d.length>0,x={},y={};4===e.length&&(l=!0,i=e[0],j=e[1],k=e[2]);var z=new Float32Array(u),A=w?new Float32Array(u):new Float32Array,B=new Float32Array(v);for(f&&(g=new Float32Array(2*u),h=new Float32Array(2*v)),m=0,n=a.length;n>m;m++)b(x,c[3*a[m]],c[3*a[m]+1],c[3*a[m]+2]);for(y.x=x.minX+(x.maxX-x.minX)/2,y.y=x.minY+(x.maxY-x.minY)/2,y.z=x.minZ+(x.maxZ-x.minZ)/2,y.bounding_box=x,m=0,n=t;n>m;m+=3)p=3*m,q=4*m,z[p]=c[3*a[m]]-y.x,z[p+1]=c[3*a[m]+1]-y.y,z[p+2]=c[3*a[m]+2]-y.z,z[p+3]=c[3*a[m+1]]-y.x,z[p+4]=c[3*a[m+1]+1]-y.y,z[p+5]=c[3*a[m+1]+2]-y.z,z[p+6]=c[3*a[m+2]]-y.x,z[p+7]=c[3*a[m+2]+1]-y.y,z[p+8]=c[3*a[m+2]+2]-y.z,w&&(A[p]=d[3*a[m]],A[p+1]=d[3*a[m]+1],A[p+2]=d[3*a[m]+2],A[p+3]=d[3*a[m+1]],A[p+4]=d[3*a[m+1]+1],A[p+5]=d[3*a[m+1]+2],A[p+6]=d[3*a[m+2]],A[p+7]=d[3*a[m+2]+1],A[p+8]=d[3*a[m+2]+2]),l?(B[q]=i,B[q+1]=j,B[q+2]=k,B[q+3]=1,B[q+4]=i,B[q+5]=j,B[q+6]=k,B[q+7]=1,B[q+8]=i,B[q+9]=j,B[q+10]=k,B[q+11]=1):(B[q]=e[4*a[m]],B[q+1]=e[4*a[m]+1],B[q+2]=e[4*a[m]+2],B[q+3]=1,B[q+4]=e[4*a[m+1]],B[q+5]=e[4*a[m+1]+1],B[q+6]=e[4*a[m+1]+2],B[q+7]=1,B[q+8]=e[4*a[m+2]],B[q+9]=e[4*a[m+2]+1],B[q+10]=e[4*a[m+2]+2],B[q+11]=1),f&&(o=2*p,r=2*q,g[o]=z[p],g[o+1]=z[p+1],g[o+2]=z[p+2],g[o+3]=z[p+3],g[o+4]=z[p+4],g[o+5]=z[p+5],g[o+6]=z[p+3],g[o+7]=z[p+4],g[o+8]=z[p+5],g[o+9]=z[p+6],g[o+10]=z[p+7],g[o+11]=z[p+8],g[o+12]=z[p+6],g[o+13]=z[p+7],g[o+14]=z[p+8],g[o+15]=z[p],g[o+16]=z[p+1],g[o+17]=z[p+2],h[r]=B[q],h[r+1]=B[q+1],h[r+2]=B[q+2],h[r+3]=B[q+3],h[r+4]=B[q+4],h[r+5]=B[q+5],h[r+6]=B[q+6],h[r+7]=B[q+7],h[r+8]=B[q+4],h[r+9]=B[q+5],h[r+10]=B[q+6],h[r+11]=B[q+7],h[r+12]=B[q+8],h[r+13]=B[q+9],h[r+14]=B[q+10],h[r+15]=B[q+11],h[r+16]=B[q+8],h[r+17]=B[q+9],h[r+18]=B[q+10],h[r+19]=B[q+11],h[r+20]=B[q],h[r+21]=B[q+1],h[r+22]=B[q+2],h[r+23]=B[q+3]);return s={centroid:y,unindexed:{position:z,normal:A,color:B}},f&&(s.wireframe={position:g,color:h}),s}function b(a,b,c,d){(!a.minX||a.minX>b)&&(a.minX=b),(!a.maxX||a.maxX<b)&&(a.maxX=b),(!a.minY||a.minY>c)&&(a.minY=c),(!a.maxY||a.maxY<c)&&(a.maxY=c),(!a.minZ||a.minZ>d)&&(a.minZ=d),(!a.maxZ||a.maxZ<d)&&(a.maxZ=d)}self.addEventListener("message",function(b){var c,d,e,f,g=b.data,h=g.shapes,i=g.vertices,j=g.normals,k=g.colors||[.7,.7,.7,1];for(c=0,d=h.length;d>c;c++)e=h[c],f=a(h[c].indices,i,j,k,"line"!==g.type),e.centroid=f.centroid,e.unindexed=f.unindexed,e.wireframe=f.wireframe;self.postMessage(g)})}();