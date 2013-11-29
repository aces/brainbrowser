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

/* brainbrowser v1.3.0 */
!function(){"use strict";function a(a){var c,d,e,f;for(a=a.replace(/^\s+/,"").replace(/\s+$/,""),b.values=a.split(/\s+/),e=b.values[0],f=b.values[0],c=0,d=b.values.length;d>c;c++)b.values[c]=parseFloat(b.values[c]),e=Math.min(e,b.values[c]),f=Math.max(f,b.values[c]);b.min=e,b.max=f}var b={};self.addEventListener("message",function(c){var d=c.data,e=d.cmd,f=d.data;"parse"===e?(a(f),self.postMessage(b)):self.terminate()})}();