/*
 * Copyright (C) 2011 McGill University
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/* brainbrowser v1.0.0 */
!function(){"use strict";function a(a){var k,l,m,n,o,p,q,r=a.replace(/\s+$/,"").replace(/^\s+/,""),s=[];if(j.num_hemispheres=1,i=r.split(/\s+/).reverse(),j.objectClass=i.pop(),"P"===j.objectClass)b(),j.numberVertices=parseInt(i.pop(),10),c(),d(),j.nitems=parseInt(i.pop(),10);else{if("L"!==j.objectClass)return j.objectClass="__FAIL__",void 0;b(),j.numberVertices=parseInt(i.pop(),10),c(),j.nitems=parseInt(i.pop(),10)}if(e(),f(),g(),"P"===j.objectClass)245772===j.positionArray.length&&(j.brainSurface=!0,h());else if("L"===j.objectClass){for(p=j.indexArray,q=j.endIndicesArray,o=j.nitems,k=0;o>k;k++){for(m=0===k?0:q[k-1],s.push(p[m]),n=q[k],l=m+1;n-1>l;l++)s.push(p[l]),s.push(p[l]);s.push(p[n-1])}j.indexArray=s}}function b(){"P"===j.objectClass?j.surfaceProperties={ambient:parseFloat(i.pop()),diffuse:parseFloat(i.pop()),specular_reflectance:parseFloat(i.pop()),specular_scattering:parseFloat(i.pop()),transparency:parseFloat(i.pop())}:"L"===j.objectClass&&(j.surfaceProperties={width:i.pop()})}function c(){var a,b,c=[],d=j.numberVertices;for(a=0;d>a;a++)for(b=0;3>b;b++)c.push(parseFloat(i.pop()));j.positionArray=c}function d(){var a,b,c=[],d=j.numberVertices;for(a=0;d>a;a++)for(b=0;3>b;b++)c.push(parseFloat(i.pop()));j.normalArray=c}function e(){var a,b,c,d=[],e=parseInt(i.pop(),10);if(0===e)for(a=0;4>a;a++)d.push(parseFloat(i.pop()));else if(1===e)for(b=0,c=j.numberPolygons;c>b;b++)for(a=0;4>a;a++)d.push(parseFloat(i.pop()));else{if(2!==e)throw new Error("colorFlag not valid in that file");for(b=0,c=j.numberVertices;c>b;b++)for(a=0;4>a;a++)d.push(parseFloat(i.pop()))}j.colorFlag=e,j.colorArray=d}function f(){var a,b,c=[];for(a=0,b=j.nitems;b>a;a++)c.push(parseInt(i.pop(),10));j.endIndicesArray=c}function g(){var a,b,c,d=i.length,e=[];for(b=0,c=i.length;d>b;b++)a=parseInt(i.pop(),10),e.push(a);j.indexArray=e}function h(){var a=j.indexArray.length;j.num_hemispheres=2,j.left={indexArray:j.indexArray.slice(0,a/2)},j.right={indexArray:j.indexArray.slice(a/2)}}var i,j={};self.addEventListener("message",function(b){a(b.data);var c={objectClass:j.objectClass,positionArray:j.positionArray,normalArray:j.normalArray,colorArray:j.colorArray,num_hemispheres:j.num_hemispheres};c.shapes=2===c.num_hemispheres?[{indexArray:j.left.indexArray},{indexArray:j.right.indexArray}]:[{indexArray:j.indexArray}],self.postMessage(c)})}();