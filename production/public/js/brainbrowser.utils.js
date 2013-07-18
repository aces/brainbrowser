/*! 
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
var BrainBrowser=BrainBrowser||{};BrainBrowser.utils=(function(){
/*! 
   * WebGL test taken from Detector.js by
   * alteredq / http://alteredqualia.com/
   * mr.doob / http://mrdoob.com/
  */
function b(){try{return !!window.WebGLRenderingContext&&!!document.createElement("canvas").getContext("experimental-webgl")}catch(f){return false}}function a(){return !!window.Worker}function c(){var e;var f='BrainBrowser requires <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation">WebGL</a>.<br/>';f+=window.WebGLRenderingContext?"Your browser seems to support it, but it is <br/> disabled or unavailable.<br/>":"Your browser does not seem to support it.<br/>";f+='Test your browser\'s WebGL support <a href="http://get.webgl.org/">here</a>.';e=document.createElement("div");e.id="webgl-error";e.innerHTML=f;return e}function d(e){return e instanceof Function||typeof e==="function"}return{webglEnabled:b,webWorkersEnabled:a,webGLErrorMessage:c,isFunction:d}})();