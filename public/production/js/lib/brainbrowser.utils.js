/*
* BrainBrowser: Web-based Neurological Visualization Tools
* (https://brainbrowser.cbrain.mcgill.ca)
*
* Copyright (C) 2011 McGill University 
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
* BrainBrowser v1.5.2
*
* Author: Tarek Sherif  <tsherif@gmail.com> (http://tareksherif.ca/)
* Author: Nicolas Kassis
*/
!function(){"use strict";var a=window.BrainBrowser=window.BrainBrowser||{},b="1.5.2";a.version=b.indexOf("BRAINBROWSER_VERSION")>0?"D.E.V":b,a.utils={canvasEnabled:function(){return document.createElement("canvas")},webglEnabled:function(){try{return!!window.WebGLRenderingContext&&!!document.createElement("canvas").getContext("experimental-webgl")}catch(a){return!1}},webWorkersEnabled:function(){return!!window.Worker},webGLErrorMessage:function(){var a,b='BrainBrowser requires <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation">WebGL</a>.<br/>';return b+=window.WebGLRenderingContext?"Your browser seems to support it, but it is <br/> disabled or unavailable.<br/>":"Your browser does not seem to support it.<br/>",b+='Test your browser\'s WebGL support <a href="http://get.webgl.org/">here</a>.',a=document.createElement("div"),a.id="webgl-error",a.innerHTML=b,a},isFunction:function(a){return a instanceof Function||"function"==typeof a},isNumeric:function(a){return!isNaN(parseFloat(a))},eventModel:function(a){var b=[];a.addEventListener=function(a,c){b[a]||(b[a]=[]),b[a].push(c)},a.triggerEvent=function(c){var d=Array.prototype.slice.call(arguments,1);b[c]&&b[c].forEach(function(b){setTimeout(function(){b.apply(a,d)},0)})}},min:function(){var a=Array.prototype.slice.call(arguments);a=1===a.length&&Array.isArray(a[0])?a[0]:a;var b,c,d=a[0];for(b=1,c=a.length;c>b;b++)a[b]<d&&(d=a[b]);return d},max:function(){var a=Array.prototype.slice.call(arguments);a=1===a.length&&Array.isArray(a[0])?a[0]:a;var b,c,d=a[0];for(b=1,c=a.length;c>b;b++)a[b]>d&&(d=a[b]);return d},getOffset:function(a){for(var b=0,c=0;a.offsetParent;)b+=a.offsetTop,c+=a.offsetLeft,a=a.offsetParent;return{top:b,left:c}},checkConfig:function(b){if(!a.config)return!1;b=b||"";var c,d,e,f=a.config,g=b.split(".");for(d=0,e=g.length;e>d;d++){if(c=g[d],!f[c])return!1;f=f[c]}return!0},drawDot:function(a,b,c,d){var e=new THREE.SphereGeometry(2),f=new THREE.MeshBasicMaterial({color:16711680}),g=new THREE.Mesh(e,f);g.position.set(b,c,d),a.add(g)}},window.requestAnimationFrame=window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame||function(a){return window.setTimeout(a,1e3/60)},window.cancelAnimationFrame=window.cancelAnimationFrame||function(a){window.clearTimeout(a)}}();