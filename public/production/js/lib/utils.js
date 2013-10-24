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

/* brainbrowser v1.1.0 */
!function(){"use strict";window.utils={webglEnabled:function(){try{return!!window.WebGLRenderingContext&&!!document.createElement("canvas").getContext("experimental-webgl")}catch(a){return!1}},webWorkersEnabled:function(){return!!window.Worker},webGLErrorMessage:function(){var a,b='BrainBrowser requires <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation">WebGL</a>.<br/>';return b+=window.WebGLRenderingContext?"Your browser seems to support it, but it is <br/> disabled or unavailable.<br/>":"Your browser does not seem to support it.<br/>",b+='Test your browser\'s WebGL support <a href="http://get.webgl.org/">here</a>.',a=document.createElement("div"),a.id="webgl-error",a.innerHTML=b,a},isFunction:function(a){return a instanceof Function||"function"==typeof a},drawDot:function(a,b,c,d){var e=new THREE.SphereGeometry(2),f=new THREE.MeshBasicMaterial({color:16711680}),g=new THREE.Mesh(e,f);g.position.set(b,c,d),a.add(g)}}}();