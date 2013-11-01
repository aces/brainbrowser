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

/* brainbrowser v0.9.2 */
!function(){"use strict";function a(a){var k=a.replace(/\s+$/,""),l=k.replace(/^\s+/,"");if(j.num_hemispheres=1,i=l.split(/\s+/).reverse(),j.objectClass=i.pop(),"P"===j.objectClass)b(),j.numberVertices=parseInt(i.pop(),10),c(),d(),j.nitems=parseInt(i.pop(),10);else{if("L"!==j.objectClass)return j.objectClass="__FAIL__",void 0;b(),j.numberVertices=parseInt(i.pop(),10),c(),j.nitems=parseInt(i.pop(),10)}e(),f(),g(),"P"===j.objectClass&&245772===j.positionArray.length&&(j.brainSurface=!0,h())}function b(){"P"===j.objectClass?j.surfaceProperties={ambient:parseFloat(i.pop()),diffuse:parseFloat(i.pop()),specular_reflectance:parseFloat(i.pop()),specular_scattering:parseFloat(i.pop()),transparency:parseFloat(i.pop())}:"L"===j.objectClass&&(j.surfaceProperties={width:i.pop()})}function c(){var a,b,c=[],d=j.numberVertices;for(a=0;d>a;a++)for(b=0;3>b;b++)c.push(parseFloat(i.pop()));j.positionArray=c}function d(){var a,b,c=[],d=j.numberVertices;for(a=0;d>a;a++)for(b=0;3>b;b++)c.push(parseFloat(i.pop()));j.normalArray=c}function e(){var a,b,c,d=[],e=parseInt(i.pop(),10);if(0===e)for(a=0;4>a;a++)d.push(parseFloat(i.pop()));else if(1===e)for(b=0,c=j.numberPolygons;c>b;b++)for(a=0;4>a;a++)d.push(parseFloat(i.pop()));else{if(2!==e)throw new Error("colorFlag not valid in that file");for(b=0,c=j.numberVertices;c>b;b++)for(a=0;4>a;a++)d.push(parseFloat(i.pop()))}j.colorFlag=e,j.colorArray=d}function f(){var a,b,c=[];for(a=0,b=j.nitems;b>a;a++)c.push(parseInt(i.pop(),10));j.endIndicesArray=c}function g(){var a,b,c,d=i.length,e=[];for(b=0,c=i.length;d>b;b++)a=parseInt(i.pop(),10),e.push(a);j.indexArray=e}function h(){var a,b,c,d,e,f,g,h,i={},k={};for(c=j.positionArray.length,i.positionArray=j.positionArray.slice(0,c/2),k.positionArray=j.positionArray.slice(c/2,c),d=j.indexArray.length,i.indexArray=j.indexArray.slice(0,d/2),k.indexArray=j.indexArray.slice(d/2,d),a=k.indexArray,b=d/3/2/2,g=0,h=a.length;h>g;g++)a[g]=a[g]-2-b;e=j.normalArray.length,i.normalArray=j.normalArray.slice(0,e/2),k.normalArray=j.normalArray.slice(e/2,e),i.colorFlag=j.colorFlag,k.colorFlag=j.colorFlag,0===j.colorFlag||1===j.colorFlag?(i.colorArray=j.colorArray,k.colorArray=j.colorArray):(f=j.colorArray.length,i.colorArray=j.colorArray.slice(0,f/2),k.colorArray=j.colorArray.slice(f/2+1,-1)),i.numberVertices=j.numberVertices/2,k.numberVertices=j.numberVertices/2,i.numberPolygons=j.numberPolygons/2,k.numberPolygons=j.numberPolygons/2,j.num_hemispheres=2,j.left=i,j.right=k}var i,j={};self.addEventListener("message",function(b){var c=b.data;a(c),self.postMessage(j)})}();