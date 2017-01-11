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
* BrainBrowser v2.0.1
*
* Author: Tarek Sherif  <tsherif@gmail.com> (http://tareksherif.ca/)
* Author: Nicolas Kassis
*/
!function(){"use strict";function a(a,c,d,e,f){a=a||[],c=c||[],d=d||[],e=e||[.7,.7,.7,1];var g,h,i,j,k,l,m,n,o,p,q,r,s,t,u=a.length,v=3*u,w=4*u,x=d.length>0,y={},z={};4===e.length&&(m=!0,i=e[0],j=e[1],k=e[2],l=e[3]);var A=new Float32Array(v),B=x?new Float32Array(v):new Float32Array,C=new Float32Array(w);for(f&&(g=new Float32Array(2*v),h=new Float32Array(2*w)),n=0,o=a.length;o>n;n++)b(y,c[3*a[n]],c[3*a[n]+1],c[3*a[n]+2]);for(z.x=y.minX+(y.maxX-y.minX)/2,z.y=y.minY+(y.maxY-y.minY)/2,z.z=y.minZ+(y.maxZ-y.minZ)/2,z.bounding_box=y,n=0,o=u;o>n;n+=3)q=3*n,r=4*n,A[q]=c[3*a[n]]-z.x,A[q+1]=c[3*a[n]+1]-z.y,A[q+2]=c[3*a[n]+2]-z.z,A[q+3]=c[3*a[n+1]]-z.x,A[q+4]=c[3*a[n+1]+1]-z.y,A[q+5]=c[3*a[n+1]+2]-z.z,A[q+6]=c[3*a[n+2]]-z.x,A[q+7]=c[3*a[n+2]+1]-z.y,A[q+8]=c[3*a[n+2]+2]-z.z,x&&(B[q]=d[3*a[n]],B[q+1]=d[3*a[n]+1],B[q+2]=d[3*a[n]+2],B[q+3]=d[3*a[n+1]],B[q+4]=d[3*a[n+1]+1],B[q+5]=d[3*a[n+1]+2],B[q+6]=d[3*a[n+2]],B[q+7]=d[3*a[n+2]+1],B[q+8]=d[3*a[n+2]+2]),m?(C[r]=i,C[r+1]=j,C[r+2]=k,C[r+3]=l,C[r+4]=i,C[r+5]=j,C[r+6]=k,C[r+7]=l,C[r+8]=i,C[r+9]=j,C[r+10]=k,C[r+11]=l):(C[r]=e[4*a[n]],C[r+1]=e[4*a[n]+1],C[r+2]=e[4*a[n]+2],C[r+3]=e[4*a[n]+3],C[r+4]=e[4*a[n+1]],C[r+5]=e[4*a[n+1]+1],C[r+6]=e[4*a[n+1]+2],C[r+7]=e[4*a[n+1]+3],C[r+8]=e[4*a[n+2]],C[r+9]=e[4*a[n+2]+1],C[r+10]=e[4*a[n+2]+2],C[r+11]=e[4*a[n+2]+3]),f&&(p=2*q,s=2*r,g[p]=A[q],g[p+1]=A[q+1],g[p+2]=A[q+2],g[p+3]=A[q+3],g[p+4]=A[q+4],g[p+5]=A[q+5],g[p+6]=A[q+3],g[p+7]=A[q+4],g[p+8]=A[q+5],g[p+9]=A[q+6],g[p+10]=A[q+7],g[p+11]=A[q+8],g[p+12]=A[q+6],g[p+13]=A[q+7],g[p+14]=A[q+8],g[p+15]=A[q],g[p+16]=A[q+1],g[p+17]=A[q+2],h[s]=C[r],h[s+1]=C[r+1],h[s+2]=C[r+2],h[s+3]=C[r+3],h[s+4]=C[r+4],h[s+5]=C[r+5],h[s+6]=C[r+6],h[s+7]=C[r+7],h[s+8]=C[r+4],h[s+9]=C[r+5],h[s+10]=C[r+6],h[s+11]=C[r+7],h[s+12]=C[r+8],h[s+13]=C[r+9],h[s+14]=C[r+10],h[s+15]=C[r+11],h[s+16]=C[r+8],h[s+17]=C[r+9],h[s+18]=C[r+10],h[s+19]=C[r+11],h[s+20]=C[r],h[s+21]=C[r+1],h[s+22]=C[r+2],h[s+23]=C[r+3]);return t={centroid:z,unindexed:{position:A,normal:B,color:C}},f&&(t.wireframe={position:g,color:h}),t}function b(a,b,c,d){(!a.minX||a.minX>b)&&(a.minX=b),(!a.maxX||a.maxX<b)&&(a.maxX=b),(!a.minY||a.minY>c)&&(a.minY=c),(!a.maxY||a.maxY<c)&&(a.maxY=c),(!a.minZ||a.minZ>d)&&(a.minZ=d),(!a.maxZ||a.maxZ<d)&&(a.maxZ=d)}self.addEventListener("message",function(b){var c,d,e,f,g=b.data,h=g.shapes,i=g.vertices,j=g.normals,k=g.colors||[.7,.7,.7,1];for(c=0,d=h.length;d>c;c++)e=h[c],f=a(h[c].indices,i,j,k,"line"!==g.type),e.centroid=f.centroid,e.unindexed=f.unindexed,e.wireframe=f.wireframe;self.postMessage(g)})}();