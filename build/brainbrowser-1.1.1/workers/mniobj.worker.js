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

/* brainbrowser v1.1.1 */
!function(){"use strict";function a(a,k){var l,m,n,o,p,q,r,s=a.replace(/\s+$/,"").replace(/^\s+/,""),t=[],u=k.split;if(j.split=!1,i=s.split(/\s+/).reverse(),j.objectClass=i.pop(),"P"===j.objectClass)b(),j.numberVertices=parseInt(i.pop(),10),c(),d(),j.nitems=parseInt(i.pop(),10);else{if("L"!==j.objectClass)return j.objectClass="__FAIL__",void 0;b(),j.numberVertices=parseInt(i.pop(),10),c(),j.nitems=parseInt(i.pop(),10)}if(e(),f(),g(),"P"===j.objectClass)u&&(j.split=!0,h());else if("L"===j.objectClass){for(q=j.indexArray,r=j.endIndicesArray,p=j.nitems,l=0;p>l;l++){for(n=0===l?0:r[l-1],t.push(q[n]),o=r[l],m=n+1;o-1>m;m++)t.push(q[m]),t.push(q[m]);t.push(q[o-1])}j.indexArray=t}}function b(){"P"===j.objectClass?j.surfaceProperties={ambient:parseFloat(i.pop()),diffuse:parseFloat(i.pop()),specular_reflectance:parseFloat(i.pop()),specular_scattering:parseFloat(i.pop()),transparency:parseFloat(i.pop())}:"L"===j.objectClass&&(j.surfaceProperties={width:i.pop()})}function c(){var a,b,c=[],d=j.numberVertices;for(a=0;d>a;a++)for(b=0;3>b;b++)c.push(parseFloat(i.pop()));j.positionArray=c}function d(){var a,b,c=[],d=j.numberVertices;for(a=0;d>a;a++)for(b=0;3>b;b++)c.push(parseFloat(i.pop()));j.normalArray=c}function e(){var a,b,c,d=[],e=parseInt(i.pop(),10);if(0===e)for(a=0;4>a;a++)d.push(parseFloat(i.pop()));else if(1===e)for(b=0,c=j.numberPolygons;c>b;b++)for(a=0;4>a;a++)d.push(parseFloat(i.pop()));else{if(2!==e)throw new Error("colorFlag not valid in that file");for(b=0,c=j.numberVertices;c>b;b++)for(a=0;4>a;a++)d.push(parseFloat(i.pop()))}j.colorFlag=e,j.colorArray=d}function f(){var a,b,c=[];for(a=0,b=j.nitems;b>a;a++)c.push(parseInt(i.pop(),10));j.endIndicesArray=c}function g(){var a,b,c,d=i.length,e=[];for(b=0,c=i.length;d>b;b++)a=parseInt(i.pop(),10),e.push(a);j.indexArray=e}function h(){var a=j.indexArray.length;j.left={indexArray:j.indexArray.slice(0,a/2)},j.right={indexArray:j.indexArray.slice(a/2)}}var i,j={};self.addEventListener("message",function(b){var c=b.data;a(c.data,c.options);var d={objectClass:j.objectClass,positionArray:j.positionArray,normalArray:j.normalArray,colorArray:j.colorArray,split:j.split};d.shapes=d.split?[{indexArray:j.left.indexArray},{indexArray:j.right.indexArray}]:[{indexArray:j.indexArray}],self.postMessage(d)})}();