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

(function() {
  "use strict";
  
  if (!Array.prototype.min) {
    Array.prototype.min = function() {
      var min = this[0];
      var i, count;
      for (i = 1, count = this.length; i < count; i++) {
        if (this[i] < min) min = this[i];
      }
      return min;
    };
  }
  
  if (!Array.prototype.max) {
    Array.prototype.max = function() {
      var max = this[0];
      var i, count;
      for (i = 1, count = this.length; i < count; i++) {
        if (this[i] > max) max = this[i];
      }
      return max;
    };
  }
})();
