/*
 * Copyright 2009, Google Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


/**
 * @fileoverview This file contains matrix/vector math functions.
 * It adds them to the "math" module on the o3djs object.
 *
 * o3djs.math supports a row-major and a column-major mode.  In both
 * modes, vectors are stored as arrays of numbers, and matrices are also.
 *
 * In row-major mode:
 *
 * - Rows of a matrix are neighboring <dimension> elements in the array.
 * - Entries of a matrix M get accessed in M[row*dimension+column] fashion.
 * - Tuples of coordinates adjacent are interpreted as row-vectors.
 * - A vector v gets transformed by a matrix M by multiplying in the order v*M.
 *
 * In column-major mode:
 *
 * - Columns of a matrix are neighboring <dimension> elements in the array.
 * - Entries of a matrix M get accessed in M[column*dimension+row] fashion.
 * - Tuples of coordinates adjacent are interpreted as column-vectors.
 * - A matrix M transforms a vector v by multiplying in the order M*v.
 *
 * When a function in o3djs.math requires separate row-major and
 * column-major versions, a function with the same name gets added to each of
 * the namespaces o3djs.math.rowMajor and o3djs.math.columnMajor. The
 * function installRowMajorFunctions() or the function
 * installColumnMajorFunctions() should get called during initialization to
 * establish the mode.  installRowMajorFunctions() works by iterating through
 * the o3djs.math.rowMajor namespace and for each function foo, setting
 * o3djs.math.foo equal to o3djs.math.rowMajor.foo.
 * installRowMajorFunctions() works the same way, iterating over the columnMajor
 * namespace.  At the end of this file, we call installRowMajorFunctions().
 *
 * Switching modes changes two things.  It changes how a matrix is encoded as an
 * array, and it changes how the entries of a matrix get interpreted.  Because
 * those two things change together, the matrix representing a given
 * transformation of space is the same JavaScript object in either mode.
 * One consequence of this is that very few functions require separate row-major
 * and column-major versions.  Typically, a function requires separate versions
 * only if it makes matrix multiplication order explicit, like
 * mulMatrixMatrix(), mulMatrixVector(), or mulVectorMatrix().  Functions which
 * create a new matrix, like scaling(), rotationZYX(), and translation() return
 * the same JavaScript object in either mode, and functions which implicitly
 * multiply like scale(), rotateZYX() and translate() modify the matrix in the
 * same way in either mode.
 *
 * The convention choice made for math functions in this library is independent
 * of the convention choice for how matrices get loaded into shaders.  That
 * convention is determined on a per-shader basis.
 *
 * Other utilities in o3djs should avoid making calls to functions that make
 * multiplication order explicit.  Instead they should appeal to functions like:
 *
 * o3djs.math.matrix4.transformPoint
 * o3djs.math.matrix4.transformDirection
 * o3djs.math.matrix4.transformNormal
 * o3djs.math.matrix4.transformVector4
 * o3djs.math.matrix4.composition
 * o3djs.math.matrix4.compose
 *
 * These functions multiply matrices implicitly and internally choose the
 * multiplication order to get the right result.  That way, utilities which use
 * o3djs.math work in either major mode.  Note that this does not necessarily
 * mean all sample code will work even if a line is added which switches major
 * modes, but it does mean that calls to o3djs still do what they are supposed
 * to.
 */


var use_plugin_math = false;

if ((typeof o3d != 'undefined') && o3d && o3d.Transform &&
    o3d.Transform.makeIdentityMatrix4_) {
  o3djs.provide('o3djs.math');
} else {
  use_plugin_math = true;
  o3djs.require('o3djs.plugin_math');
}

o3djs.provide("o3djs.flat_math");

/**
 * A module for math functions where a matrix is represented as a flat
 * (1-dimensional) array.
 * @namespace
 */
o3djs.flat_math = o3djs.flat_math || {};

/**
 * A random seed for the pseudoRandom function.
 * @private
 * @type {number}
 */
o3djs.flat_math.randomSeed_ = 0;

/**
 * A constant for the pseudoRandom function
 * @private
 * @type {number}
 */
o3djs.flat_math.RANDOM_RANGE_ = Math.pow(2, 32);

/**
 * Functions which deal with 4-by-4 transformation matrices are kept in their
 * own namespsace.
 * @namespace
 */
o3djs.flat_math.matrix4 = o3djs.flat_math.matrix4 || {};

/**
 * Functions that are specifically row major are kept in their own namespace.
 * @namespace
 */
o3djs.flat_math.rowMajor = o3djs.flat_math.rowMajor || {};

/**
 * Functions that are specifically column major are kept in their own namespace.
 * @namespace
 */
o3djs.flat_math.columnMajor = o3djs.flat_math.columnMajor || {};

/**
 * Functions that do error checking are stored in their own namespace.
 * @namespace
 */
o3djs.flat_math.errorCheck = o3djs.flat_math.errorCheck || {};

/**
 * Functions that do no error checking and have a separate version that does in
 * o3djs.flat_math.errorCheck are stored in their own namespace.
 * @namespace
 */
o3djs.flat_math.errorCheckFree = o3djs.flat_math.errorCheckFree || {};

/**
 * An Float32Array of 2 floats
 * @type {(!Float32Array.<number>|!o3d.Float2)}
 */
o3djs.flat_math.Vector2 = goog.typedef;

/**
 * An Float32Array of 3 floats
 * @type {(!Float32Array.<number>|!o3d.Float3)}
 */
o3djs.flat_math.Vector3 = goog.typedef;

/**
 * An Float32Array of 4 floats
 * @type {(!Float32Array.<number>|!o3d.Float4)}
 */
o3djs.flat_math.Vector4 = goog.typedef;


/**
 * A 1x1 Matrix of floats
 * @type {!Array.<number>}
 */
o3djs.flat_math.Matrix1 = goog.typedef;

/**
 * A 2x2 Matrix of floats
 * @type {!Array.<number>}
 */
o3djs.flat_math.Matrix2 = goog.typedef;

/**
 * A 3x3 Matrix of floats
 * @type {!Array.<number>}
 */
o3djs.flat_math.Matrix3 = goog.typedef;

/**
 * A 4x4 Matrix of floats
 * @type {(!Array.<number>|!o3d.Matrix4)}
 */
o3djs.flat_math.Matrix4 = goog.typedef;

o3djs.flat_math.useFloat32Array_ = false;

/**
 * A arbitrary size Matrix of floats
 * @type {(!Array.<number>|!o3d.Matrix4)}
 */
o3djs.flat_math.Matrix = goog.typedef;

/**
 * A arbitrary size Matrix of floats
 * @type {(!Array.<number>)}
 */
o3djs.flat_math.Vector = goog.typedef;


/**
 * Namespace for Float32Array specific math functions
 */
o3djs.flat_math.Float32Array = {};

/**
 * A arbitrary size Matrix of floats
 * @type {(!Array.<number>|!o3d.Matrix4)}
 */
o3djs.flat_math.Float32Array.Matrix =
    (use_plugin_math ? goog.typedef : Float32Array);
/**
 * An Float32Array of floats.
 * @type {!Array.<number>}
 */
o3djs.flat_math.Float32Array.Vector =
    (use_plugin_math ? goog.typedef : Float32Array);

/**
 * If 16 arguments, this returns a 4x4 matrix
 * with values set to the passed in arguments
 * @param {number} a [0][0] element
 * @param {number} b [0][1] element
 * @param {number} c [0][2] element
 * @param {number} d [0][3] element
 * @param {number} e [1][0] element
 * @param {number} f [1][1] element
 * @param {number} g [1][2] element
 * @param {number} h [1][3] element
 * @param {number} i [2][0] element
 * @param {number} j [2][1] element
 * @param {number} k [2][2] element
 * @param {number} l [2][3] element
 * @param {number} m [3][0] element
 * @param {number} n [3][1] element
 * @param {number} o [3][2] element
 * @param {number} p [3][3] element
 *
 * If 9 arguments returns a 3x3 matrix
 * @param {number} a [0][0] element
 * @param {number} b [0][1] element
 * @param {number} c [0][2] element
 * @param {number} d [1][0] element
 * @param {number} e [1][1] element
 * @param {number} f [1][2] element
 * @param {number} g [2][0] element
 * @param {number} h [2][1] element
 * @param {number} i [2][2] element

 * If 4 arguments returns a 2x2 matrix
 * @param {number} a [0][0] element
 * @param {number} b [0][1] element
 * @param {number} c [1][0] element
 * @param {number} d [1][1] element
 * @returns {!o3djs.flat_math.Matrix}
 */
o3djs.flat_math.Float32Array.makeMatrix = function(
    a, b, c, d,
    e, f, g, h,
    i, j, k, l,
    m, n, o, p) {
  if (p === undefined) {
      if (i === undefined) {
          var retval = new Float32Array(4);
          retval[0] = a;
          retval[1] = b;
          retval[2] = c;
          retval[3] = d;
          return retval;
      }
      var retval = new Float32Array(9);
      retval[0] = a;
      retval[1] = b;
      retval[2] = c;
      retval[3] = d;
      retval[4] = e;
      retval[5] = f;
      retval[6] = g;
      retval[7] = h;
      retval[8] = i;
      return retval;
  }
  var retval = new Float32Array(16);
  retval[0] = a;
  retval[1] = b;
  retval[2] = c;
  retval[3] = d;
  retval[4] = e;
  retval[5] = f;
  retval[6] = g;
  retval[7] = h;
  retval[8] = i;
  retval[9] = j;
  retval[10] = k;
  retval[11] = l;
  retval[12] = m;
  retval[13] = n;
  retval[14] = o;
  retval[15] = p;
  return retval;
};

/**
 * returns a 2x2 matrix
 * @param {number} a [0][0] element
 * @param {number} b [0][1] element
 * @param {number} c [1][0] element
 * @param {number} d [1][1] element
 * @returns {!o3djs.flat_math.Matrix}
 */
o3djs.flat_math.Float32Array.makeMatrix2 = function(a,b,
                                               c,d) {
          var retval = new Float32Array(4);
          retval[0] = a;
          retval[1] = b;
          retval[2] = c;
          retval[3] = d;
          return retval;
};

/**
 * If returns a 3x3 matrix
 * @param {number} a [0][0] element
 * @param {number} b [0][1] element
 * @param {number} c [0][2] element
 * @param {number} d [1][0] element
 * @param {number} e [1][1] element
 * @param {number} f [1][2] element
 * @param {number} g [2][0] element
 * @param {number} h [2][1] element
 * @param {number} i [2][2] element
 * @return {!o3djs.flat_math.Matrix} the matrix of the above elements
 */
o3djs.flat_math.Float32Array.makeMatrix3 = function(
    a, b, c,
    d, e, f,
    g, h, i) {
  var retval = new Float32Array(9);
  retval[0] = a;
  retval[1] = b;
  retval[2] = c;
  retval[3] = d;
  retval[4] = e;
  retval[5] = f;
  retval[6] = g;
  retval[7] = h;
  retval[8] = i;
  return retval;
};

/**
 * returns a 4x4 matrix
 * with values set to the passed in arguments
 * @param {number} a [0][0] element
 * @param {number} b [0][1] element
 * @param {number} c [0][2] element
 * @param {number} d [0][3] element
 * @param {number} e [1][0] element
 * @param {number} f [1][1] element
 * @param {number} g [1][2] element
 * @param {number} h [1][3] element
 * @param {number} i [2][0] element
 * @param {number} j [2][1] element
 * @param {number} k [2][2] element
 * @param {number} l [2][3] element
 * @param {number} m [3][0] element
 * @param {number} n [3][1] element
 * @param {number} o [3][2] element
 * @param {number} p [3][3] element
 * @returns {o3djs.flat_math.Matrix} comprised of the above elements
 */
o3djs.flat_math.Float32Array.makeMatrix4 = function(
    a, b, c, d,
    e, f, g, h,
    i, j, k, l,
    m, n, o, p) {
  var retval = new Float32Array(16);
  retval[0] = a;
  retval[1] = b;
  retval[2] = c;
  retval[3] = d;
  retval[4] = e;
  retval[5] = f;
  retval[6] = g;
  retval[7] = h;
  retval[8] = i;
  retval[9] = j;
  retval[10] = k;
  retval[11] = l;
  retval[12] = m;
  retval[13] = n;
  retval[14] = o;
  retval[15] = p;
  return retval;
};

/**
 * Namespace for Array specific math functions
 */
o3djs.flat_math.Array={};

/**
 * A arbitrary size Matrix of floats
 * @type {(!Array.<!Array.<number>>|!o3d.Matrix4)}
 */
o3djs.flat_math.Array.Matrix = (use_plugin_math ? goog.typedef: Array);

/**
 * An Float32Array of floats.
 * @type {!Float32Array.<number>}
 */
o3djs.flat_math.Array.Vector = (use_plugin_math ? goog.typedef: Array);

/**
 * If 16 arguments, this returns a 4x4 matrix
 * with values set to the passed in arguments
 * @param {number} a [0][0] element
 * @param {number} b [0][1] element
 * @param {number} c [0][2] element
 * @param {number} d [0][3] element
 * @param {number} e [1][0] element
 * @param {number} f [1][1] element
 * @param {number} g [1][2] element
 * @param {number} h [1][3] element
 * @param {number} i [2][0] element
 * @param {number} j [2][1] element
 * @param {number} k [2][2] element
 * @param {number} l [2][3] element
 * @param {number} m [3][0] element
 * @param {number} n [3][1] element
 * @param {number} o [3][2] element
 * @param {number} p [3][3] element
 *
 * If 9 arguments returns a 3x3 matrix
 * @param {number} a [0][0] element
 * @param {number} b [0][1] element
 * @param {number} c [0][2] element
 * @param {number} d [1][0] element
 * @param {number} e [1][1] element
 * @param {number} f [1][2] element
 * @param {number} g [2][0] element
 * @param {number} h [2][1] element
 * @param {number} i [2][2] element

 * If 4 arguments returns a 2x2 matrix
 * @param {number} a [0][0] element
 * @param {number} b [0][1] element
 * @param {number} c [1][0] element
 * @param {number} d [1][1] element
 * @returns {!o3djs.flat_math.Matrix}
 */
o3djs.flat_math.Array.makeMatrix = function(
    a, b, c, d,
    e, f, g, h,
    i, j, k, l,
    m, n, o, p) {
  if (p === undefined) {
    if (i === undefined) {
      return [a,b,c,d];
    }
    return [a, b, c, d, e, f, g, h, i];
  }
  return [a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p];
};

/**
 * returns a 2x2 matrix
 * @param {number} a [0][0] element
 * @param {number} b [0][1] element
 * @param {number} c [1][0] element
 * @param {number} d [1][1] element
 * @returns {!o3djs.flat_math.Matrix}
 */
o3djs.flat_math.Array.makeMatrix2 = function(a, b, c, d) {
  return [a, b, c, d];
};

/**
 * If returns a 3x3 matrix
 * @param {number} a [0][0] element
 * @param {number} b [0][1] element
 * @param {number} c [0][2] element
 * @param {number} d [1][0] element
 * @param {number} e [1][1] element
 * @param {number} f [1][2] element
 * @param {number} g [2][0] element
 * @param {number} h [2][1] element
 * @param {number} i [2][2] element
 * @return {!o3djs.flat_math.Matrix} the matrix of the above elements
 */
o3djs.flat_math.Array.makeMatrix3 = function(
    a, b, c,
    d, e, f,
    g, h, i) {
  return [a, b, c, d, e, f, g, h, i];
};

/**
 * returns a 4x4 matrix
 * with values set to the passed in arguments
 * @param {number} a [0][0] element
 * @param {number} b [0][1] element
 * @param {number} c [0][2] element
 * @param {number} d [0][3] element
 * @param {number} e [1][0] element
 * @param {number} f [1][1] element
 * @param {number} g [1][2] element
 * @param {number} h [1][3] element
 * @param {number} i [2][0] element
 * @param {number} j [2][1] element
 * @param {number} k [2][2] element
 * @param {number} l [2][3] element
 * @param {number} m [3][0] element
 * @param {number} n [3][1] element
 * @param {number} o [3][2] element
 * @param {number} p [3][3] element
 * @returns {o3djs.flat_math.Matrix} comprised of the above elements
 */
o3djs.flat_math.Array.makeMatrix4 = function(
    a, b, c, d,
    e, f, g, h,
    i, j, k, l,
    m, n, o, p) {
  return [a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p];
};

if (o3djs.flat_math.useFloat32Array_) {
    o3djs.flat_math.Matrix = o3djs.flat_math.Float32Array.Matrix;
    o3djs.flat_math.Vector = o3djs.flat_math.Float32Array.Vector;
    for (var i in o3djs.flat_math.Float32Array) {
        if (o3djs.flat_math.Float32Array[i].call)
            o3djs.flat_math[i]=o3djs.flat_math.Float32Array[i];
    }
} else {
    o3djs.flat_math.Matrix = o3djs.flat_math.Array.Matrix;
    o3djs.flat_math.Vector = o3djs.flat_math.Array.Vector;
    for (var i in o3djs.flat_math.Array) {
        if (o3djs.flat_math.Array[i].call)
            o3djs.flat_math[i]=o3djs.flat_math.Array[i];
    }
}




/**
 * Returns a deterministic pseudorandom number between 0 and 1
 * @return {number} a random number between 0 and 1
 */
o3djs.flat_math.pseudoRandom = function() {
  var math = o3djs.flat_math;
  return (math.randomSeed_ =
          (134775813 * math.randomSeed_ + 1) %
          math.RANDOM_RANGE_) / math.RANDOM_RANGE_;
};

/**
 * Resets the pseudoRandom function sequence.
 */
o3djs.flat_math.resetPseudoRandom = function() {
  o3djs.flat_math.randomSeed_ = 0;
};

/**
 * Converts degrees to radians.
 * @param {number} degrees A value in degrees.
 * @return {number} the value in radians.
 */
o3djs.flat_math.degToRad = function(degrees) {
  return degrees * Math.PI / 180;
};

/**
 * Converts radians to degrees.
 * @param {number} radians A value in radians.
 * @return {number} the value in degrees.
 */
o3djs.flat_math.radToDeg = function(radians) {
  return radians * 180 / Math.PI;
};

/**
 * Performs linear interpolation on two scalars.
 * Given scalars a and b and interpolation coefficient t, returns
 * (1 - t) * a + t * b.
 * @param {number} a Operand scalar.
 * @param {number} b Operand scalar.
 * @param {number} t Interpolation coefficient.
 * @return {number} The weighted sum of a and b.
 */
o3djs.flat_math.lerpScalar = function(a, b, t) {
  return (1 - t) * a + t * b;
};

/**
 * Adds two vectors; assumes a and b have the same dimension.
 * @param {!o3djs.flat_math.Vector} a Operand vector.
 * @param {!o3djs.flat_math.Vector} b Operand vector.
 * @return {!o3djs.flat_math.Vector} The sum of a and b.
 */
o3djs.flat_math.addVector = function(a, b) {
  var aLength = a.length;
  var r = new o3djs.flat_math.Vector(aLength);
  for (var i = 0; i < aLength; ++i)
    r[i] = a[i] + b[i];
  return r;
};

/**
 * Subtracts two vectors.
 * @param {!o3djs.flat_math.Vector} a Operand vector.
 * @param {!o3djs.flat_math.Vector} b Operand vector.
 * @return {!o3djs.flat_math.Vector} The difference of a and b.
 */
o3djs.flat_math.subVector = function(a, b) {
  var aLength = a.length;
  var r = new o3djs.flat_math.Vector(aLength);
  for (var i = 0; i < aLength; ++i)
    r[i] = a[i] - b[i];
  return r;
};

/**
 * Subtracts two 3d vectors.
 * @param {!o3djs.flat_math.Vector3} a Operand vector.
 * @param {!o3djs.flat_math.Vector3} b Operand vector.
 * @return {!o3djs.flat_math.Vector3} The difference of a and b.
 */
o3djs.flat_math.subVector3 = function(a, b) {
  var r = new o3djs.flat_math.Vector(3);
  for (var i = 0; i < 3; ++i)
    r[i] = a[i] - b[i];
  return r;
};

/**
 * Performs linear interpolation on two vectors.
 * Given vectors a and b and interpolation coefficient t, returns
 * (1 - t) * a + t * b.
 * @param {!o3djs.flat_math.Vector} a Operand vector.
 * @param {!o3djs.flat_math.Vector} b Operand vector.
 * @param {number} t Interpolation coefficient.
 * @return {!o3djs.flat_math.Vector} The weighted sum of a and b.
 */
o3djs.flat_math.lerpVector = function(a, b, t) {
  var aLength = a.length;
  var r = new o3djs.flat_math.Vector(aLength);
  for (var i = 0; i < aLength; ++i)
    r[i] = (1 - t) * a[i] + t * b[i];
  return r;
};

/**
 * Clamps a value between 0 and range using a modulo.
 * @param {number} v Value to clamp mod.
 * @param {number} range Range to clamp to.
 * @param {number} opt_rangeStart start of range. Default = 0.
 * @return {number} Clamp modded value.
 */
o3djs.flat_math.modClamp = function(v, range, opt_rangeStart) {
  var start = opt_rangeStart || 0;
  if (range < 0.00001) {
    return start;
  }
  v -= start;
  if (v < 0) {
    v -= Math.floor(v / range) * range;
  } else {
    v = v % range;
  }
  return v + start;
};

/**
 * Lerps in a circle.
 * Does a lerp between a and b but inside range so for example if
 * range is 100, a is 95 and b is 5 lerping will go in the positive direction.
 * @param {number} a Start value.
 * @param {number} b Target value.
 * @param {number} t Amount to lerp (0 to 1).
 * @param {number} range Range of circle.
 * @return {number} lerped result.
 */
o3djs.flat_math.lerpCircular = function(a, b, t, range) {
  a = o3djs.flat_math.modClamp(a, range);
  b = o3djs.flat_math.modClamp(b, range);
  var delta = b - a;
  if (Math.abs(delta) > range * 0.5) {
    if (delta > 0) {
      b -= range;
    } else {
      b += range;
    }
  }
  return o3djs.flat_math.modClamp(o3djs.flat_math.lerpScalar(a, b, t), range);
};

/**
 * Lerps radians.
 * @param {number} a Start value.
 * @param {number} b Target value.
 * @param {number} t Amount to lerp (0 to 1).
 * @return {number} lerped result.
 */
o3djs.flat_math.lerpRadian = function(a, b, t) {
  return o3djs.flat_math.lerpCircular(a, b, t, Math.PI * 2);
};

/**
 * Divides a vector by a scalar.
 * @param {!o3djs.flat_math.Vector} v The vector.
 * @param {number} k The scalar.
 * @return {!o3djs.flat_math.Vector} v The vector v divided by k.
 */
o3djs.flat_math.divVectorScalar = function(v, k) {
  var r = [];
  var vLength = v.length;
  for (var i = 0; i < vLength; ++i)
    r[i] = v[i] / k;
  return r;
};

/**
 * Computes the dot product of two vectors; assumes that a and b have
 * the same dimension.
 * @param {!o3djs.flat_math.Vector} a Operand vector.
 * @param {!o3djs.flat_math.Vector} b Operand vector.
 * @return {number} The dot product of a and b.
 */
o3djs.flat_math.dot = function(a, b) {
  var r = 0.0;
  var aLength = a.length;
  for (var i = 0; i < aLength; ++i)
    r += a[i] * b[i];
  return r;
};

/**
 * Computes the cross product of two vectors; assumes both vectors have
 * three entries.
 * @param {!o3djs.flat_math.Vector} a Operand vector.
 * @param {!o3djs.flat_math.Vector} b Operand vector.
 * @return {!o3djs.flat_math.Vector} The vector a cross b.
 */
o3djs.flat_math.cross = function(a, b) {
  var r = new o3djs.flat_math.Vector(3);
  r[0] = a[1] * b[2] - a[2] * b[1];
  r[1] = a[2] * b[0] - a[0] * b[2];
  r[2] = a[0] * b[1] - a[1] * b[0];
  return r;
};

/**
 * Computes the Euclidean length of a vector, i.e. the square root of the
 * sum of the squares of the entries.
 * @param {!o3djs.flat_math.Vector} a The vector.
 * @return {number} The length of a.
 */
o3djs.flat_math.length = function(a) {
  var r = 0.0;
  var aLength = a.length;
  for (var i = 0; i < aLength; ++i)
    r += a[i] * a[i];
  return Math.sqrt(r);
};

/**
 * Computes the square of the Euclidean length of a vector, i.e. the sum
 * of the squares of the entries.
 * @param {!o3djs.flat_math.Vector} a The vector.
 * @return {number} The square of the length of a.
 */
o3djs.flat_math.lengthSquared = function(a) {
  var r = 0.0;
  var aLength = a.length;
  for (var i = 0; i < aLength; ++i)
    r += a[i] * a[i];
  return r;
};

/**
 * Computes the Euclidean distance between two vectors.
 * @param {!o3djs.flat_math.Vector} a A vector.
 * @param {!o3djs.flat_math.Vector} b A vector.
 * @return {number} The distance between a and b.
 */
o3djs.flat_math.distance = function(a, b) {
  var r = 0.0;
  var aLength = a.length;
  for (var i = 0; i < aLength; ++i) {
    var t = a[i] - b[i];
    r += t * t;
  }
  return Math.sqrt(r);
};

/**
 * Computes the square of the Euclidean distance between two vectors.
 * @param {!o3djs.flat_math.Vector} a A vector.
 * @param {!o3djs.flat_math.Vector} b A vector.
 * @return {number} The distance between a and b.
 */
o3djs.flat_math.distanceSquared = function(a, b) {
  var r = 0.0;
  var aLength = a.length;
  for (var i = 0; i < aLength; ++i) {
    var t = a[i] - b[i];
    r += t * t;
  }
  return r;
};

/**
 * Divides a vector by its Euclidean length and returns the quotient.
 * @param {!o3djs.flat_math.Vector} a The vector.
 * @return {!o3djs.flat_math.Vector} The normalized vector.
 */
o3djs.flat_math.normalize = function(a) {
  var aLength = a.length;
  var r = new o3djs.flat_math.Vector(aLength);
  var n = 0.0;
  var i;
  for (i = 0; i < aLength; ++i)
    n += a[i] * a[i];
  n = Math.sqrt(n);
  for (i = 0; i < aLength; ++i)
    r[i] = a[i] / n;
  return r;
};

/**
 * Adds two matrices; assumes a and b are the same size.
 * @param {!o3djs.flat_math.Matrix} a Operand matrix.
 * @param {!o3djs.flat_math.Matrix} b Operand matrix.
 * @return {!o3djs.flat_math.Matrix} The sum of a and b.
 */
o3djs.flat_math.addMatrix = function(a, b) {
  var aLength = a.length;
  var r = new o3djs.flat_math.Matrix(aLength);
  for (var i = 0; i < aLength; ++i) {
      r[i] = a[i] + b[i];
  }
  return r;
};

/**
 * Subtracts two matrices; assumes a and b are the same size.
 * @param {!o3djs.flat_math.Matrix} a Operand matrix.
 * @param {!o3djs.flat_math.Matrix} b Operand matrix.
 * @return {!o3djs.flat_math.Matrix} The sum of a and b.
 */
o3djs.flat_math.subMatrix = function(a, b) {
  var aLength = a.length;
  var r = new o3djs.flat_math.Matrix(aLength);
  for (var i = 0; i < aLength; ++i) {
      r[i] = a[i] - b[i];
  }
  return r;
};

/**
 * Performs linear interpolation on two matrices.
 * Given matrices a and b and interpolation coefficient t, returns
 * (1 - t) * a + t * b.
 * @param {!o3djs.flat_math.Matrix} a Operand matrix.
 * @param {!o3djs.flat_math.Matrix} b Operand matrix.
 * @param {number} t Interpolation coefficient.
 * @return {!o3djs.flat_math.Matrix} Interpolated a and b.
 */
o3djs.flat_math.lerpMatrix = function(a, b, t) {
  var aLength = a.length;
  var r = new o3djs.flat_math.Matrix(aLength);
  for (var i = 0; i < aLength; ++i) {
      r[i] = (1 - t) * a[i] + t * b[i];
  }
  return r;
};

/**
 * Divides a matrix by a scalar; assumes a and b are the same size.
 * @param {!o3djs.flat_math.Matrix} a Operand matrix.
 * @param {number} b scalar
 * @return {!o3djs.flat_math.Matrix} The division of a by b.
 */
o3djs.flat_math.divMatrixScalar = function(a, b) {
  var aLength = a.length;
  var r = new o3djs.flat_math.Matrix(aLength);
  for (var i = 0; i < aLength; ++i) {
      r[i] = a[i] / b;
  }
  return r;
};

/**
 * Negates a scalar.
 * @param {number} a The scalar.
 * @return {number} -a.
 */
o3djs.flat_math.negativeScalar = function(a) {
 return -a;
};

/**
 * Negates a vector.
 * @param {!o3djs.flat_math.Vector} v The vector.
 * @return {!o3djs.flat_math.Vector} -v.
 */
o3djs.flat_math.negativeVector = function(v) {
 var vLength = v.length;
 var r = new o3djs.flat_math.Vector(vLength);
 for (var i = 0; i < vLength; ++i) {
   r[i] = -v[i];
 }
 return r;
};

/**
 * Negates a matrix.
 * @param {!o3djs.flat_math.Matrix} m The matrix.
 * @return {!o3djs.flat_math.Matrix} -m.
 */
o3djs.flat_math.negativeMatrix = function(m) {
 var mLength = m.length;
 var r = new o3djs.flat_math.Matrix(mLength);
 for (var i = 0; i < mLength; ++i) {
     r[i] = -m[i];
 }
 return r;
};

/**
 * Copies a scalar.
 * @param {number} a The scalar.
 * @return {number} a.
 */
o3djs.flat_math.copyScalar = function(a) {
  return a;
};

/**
 * Copies a vector.
 * @param {!o3djs.flat_math.Vector} v The vector.
 * @return {!o3djs.flat_math.Vector} A copy of v.
 */
o3djs.flat_math.copyVector = function(v) {
  var vLength = v.length;
  var r = new o3djs.flat_math.Vector(vLength);
  for (var i = 0; i < vLength; i++)
    r[i] = v[i];
  return r;
};

/**
 * Copies a vector.
 * @param {!o3djs.flat_math.Vector} v The vector.
 * @param {!o3djs.flat_math.Vector} r Set to a copy of v.
 */
o3djs.flat_math.copyVectorTo = function(v, r) {
  var vLength = v.length;
  for (var i = 0; i < vLength; i++)
    r[i] = v[i];
};

/**
 * Copies a matrix.
 * @param {!o3djs.flat_math.Matrix} m The matrix.
 * @return {!o3djs.flat_math.Matrix} A copy of m.
 */
o3djs.flat_math.copyMatrix = o3djs.flat_math.copyVector;

/**
 * Copies a matrix.
 * @param {!o3djs.flat_math.Matrix} m The matrix.
 * @return {!o3djs.flat_math.Matrix} A copy of m.
 */
o3djs.flat_math.copyMatrixTo = o3djs.flat_math.copyVectorTo;

/**
 * Returns the elements of a matrix as a copied one-dimensional array. The
 * rows or columns (depending on whether the matrix is row-major or
 * column-major) are concatenated.
 * @param {!o3djs.flat_math.Matrix} m The matrix.
 * @return {!Array.<number>} The matrix's elements as a one-dimensional array.
 */
o3djs.flat_math.getMatrixElements = o3djs.flat_math.copyMatrix;

/**
 * Multiplies two scalars.
 * @param {number} a Operand scalar.
 * @param {number} b Operand scalar.
 * @return {number} The product of a and b.
 */
o3djs.flat_math.mulScalarScalar = function(a, b) {
  return a * b;
};

/**
 * Multiplies a scalar by a vector.
 * @param {number} k The scalar.
 * @param {!o3djs.flat_math.Vector} v The vector.
 * @return {!o3djs.flat_math.Vector} The product of k and v.
 */
o3djs.flat_math.mulScalarVector = function(k, v) {
  var vLength = v.length;
  var r = new o3djs.flat_math.Vector(vLength);
  for (var i = 0; i < vLength; ++i) {
    r[i] = k * v[i];
  }
  return r;
};

/**
 * Multiplies a vector by a scalar.
 * @param {!o3djs.flat_math.Vector} v The vector.
 * @param {number} k The scalar.
 * @return {!o3djs.flat_math.Vector} The product of k and v.
 */
o3djs.flat_math.mulVectorScalar = function(v, k) {
  return o3djs.flat_math.mulScalarVector(k, v);
};

/**
 * Multiplies a scalar by a matrix.
 * @param {number} k The scalar.
 * @param {!o3djs.flat_math.Matrix} m The matrix.
 * @return {!o3djs.flat_math.Matrix} The product of m and k.
 */
o3djs.flat_math.mulScalarMatrix = o3djs.flat_math.mulScalarVector;

/**
 * Multiplies a matrix by a scalar.
 * @param {!o3djs.flat_math.Matrix} m The matrix.
 * @param {number} k The scalar.
 * @return {!o3djs.flat_math.Matrix} The product of m and k.
 */
o3djs.flat_math.mulMatrixScalar = o3djs.flat_math.mulVectorScalar;

/**
 * Multiplies a vector by another vector (component-wise); assumes a and
 * b have the same length.
 * @param {!o3djs.flat_math.Vector} a Operand vector.
 * @param {!o3djs.flat_math.Vector} b Operand vector.
 * @return {!o3djs.flat_math.Vector} The vector of products of entries of a and
 *     b.
 */
o3djs.flat_math.mulVectorVector = function(a, b) {
  var aLength = a.length;
  var r = new o3djs.flat_math.Vector(aLength);
  for (var i = 0; i < aLength; ++i)
    r[i] = a[i] * b[i];
  return r;
};

/**
 * Divides a vector by another vector (component-wise); assumes a and
 * b have the same length.
 * @param {!o3djs.flat_math.Vector} a Operand vector.
 * @param {!o3djs.flat_math.Vector} b Operand vector.
 * @return {!o3djs.flat_math.Vector} The vector of quotients of entries of a and
 *     b.
 */
o3djs.flat_math.divVectorVector = function(a, b) {
  var aLength = a.length;
  var r = new o3djs.flat_math.Vector(aLength);
  for (var i = 0; i < aLength; ++i)
    r[i] = a[i] / b[i];
  return r;
};

/**
 * Multiplies a vector by a matrix; treats the vector as a row vector; assumes
 * matrix entries are accessed in [row*4+column] fashion.
 * @param {!o3djs.flat_math.Vector} v The vector.
 * @param {!o3djs.flat_math.Matrix} m The matrix.
 * @return {!o3djs.flat_math.Vector} The product of v and m as a row vector.
 */
o3djs.flat_math.rowMajor.mulVectorMatrix4 = function(v, m) {
  var r = new o3djs.flat_math.Vector(16);
  for (var i = 0; i < 4; ++i) {
    r[i] = 0.0;
    for (var j = 0; j < 4; ++j)
      r[i] += v[j] * m[j * 4 + i];
  }
  return r;
};

/**
 * Multiplies a vector by a matrix; treats the vector as a row vector; assumes
 * matrix entries are accessed in [row*2+column] fashion.
 * @param {!o3djs.flat_math.Vector} v The vector.
 * @param {!o3djs.flat_math.Matrix} m The matrix.
 * @returns {!o3djs.flat_math.Vector} The product of v and m as a row vector.
 */
o3djs.flat_math.rowMajor.mulVectorMatrix2 = function(v, m) {
  var r = new o3djs.flat_math.Vector(4);
  for (var i = 0; i < 2; ++i) {
    r[i] = 0.0;
    for (var j = 0; j < 2; ++j)
      r[i] += v[j] * m[j * 2 + i];
  }
  return r;
};


/**
 * Multiplies a vector by a matrix; treats the vector as a row vector; assumes
 * matrix entries are accessed in [row*3+column] fashion.
 * @param {!o3djs.flat_math.Vector} v The vector.
 * @param {!o3djs.flat_math.Matrix} m The matrix.
 * @returns {!o3djs.flat_math.Vector} The product of v and m as a row vector.
 */
o3djs.flat_math.rowMajor.mulVectorMatrix3 = function(v, m) {
  var r = new o3djs.flat_math.Vector(9);
  for (var i = 0; i < 3; ++i) {
    r[i] = 0.0;
    for (var j = 0; j < 3; ++j)
      r[i] += v[j] * m[j * 3 + i];
  }
  return r;
};


/**
 * Multiplies a vector by a matrix; treats the vector as a row vector; assumes
 * matrix entries are accessed in [row*dimension+column] fashion.
 * @param {!o3djs.flat_math.Vector} v The vector.
 * @param {!o3djs.flat_math.Matrix} m The matrix.
 * @return {!o3djs.flat_math.Vector} The product of v and m as a row vector.
 */
o3djs.flat_math.rowMajor.mulVectorMatrix = function(v, m) {
  switch(m.length) {
    case 4:
      return o3djs.flat_math.rowMajor.mulVectorMatrix2(v, m);
    case 9:
      return o3djs.flat_math.rowMajor.mulVectorMatrix3(v, m);
    case 16:
      return o3djs.flat_math.rowMajor.mulVectorMatrix4(v, m);
    default:
      throw "Cannot handle matrices of size other than 3x3 or 4x4";
  }
};



/**
 * Multiplies a vector by a matrix; treats the vector as a row vector; assumes
 * matrix entries are accessed in [column*4+row] fashion.
 * @param {!o3djs.flat_math.Vector} v The vector.
 * @param {!o3djs.flat_math.Matrix} m The matrix.
 * @param {!o3djs.flat_math.Vector} r The product of v and m as a row vector.
 */
o3djs.flat_math.rowMajor.mulMatrixVector4 = function(m, v) {
  var r = new o3djs.flat_math.Vector(4);
  var vLength = v.length;
  for (var i = 0; i < 4; ++i) {
    r[i] = 0.0;
    for (var j = 0; j < 4; ++j)
      r[i] += v[j] * m[i * 4 + j];
  }
  return r;
};


/**
 * Multiplies a vector by a matrix; treats the vector as a row vector; assumes
 * matrix entries are accessed in [column*3+row] fashion.
 * @param {!o3djs.flat_math.Vector} v The vector.
 * @param {!o3djs.flat_math.Matrix} m The matrix.
 * @param {!o3djs.flat_math.Vector} r The product of v and m as a row vector.
 */
o3djs.flat_math.rowMajor.mulMatrixVector3 = function(m, v) {
  var r = new o3djs.flat_math.Vector(3);
  var vLength = v.length;
  for (var i = 0; i < 3; ++i) {
    r[i] = 0.0;
    for (var j = 0; j < 3; ++j)
      r[i] += v[j] * m[i * 3 + j];
  }
  return r;
};

/**
 * Multiplies a vector by a matrix; treats the vector as a row vector; assumes
 * matrix entries are accessed in [column*2+row] fashion.
 * @param {!o3djs.flat_math.Vector} v The vector.
 * @param {!o3djs.flat_math.Matrix} m The matrix.
 * @param {!o3djs.flat_math.Vector} r The product of v and m as a row vector.
 */
o3djs.flat_math.rowMajor.mulMatrixVector2 = function(m, v) {
  var r = new o3djs.flat_math.Vector(2);

  var vLength = v.length;
  for (var i = 0; i < 2; ++i) {
    r[i] = 0.0;
    for (var j = 0; j < 2; ++j)
      r[i] += v[j] * m[i * 2 + j];
  }
  return r;
};


/**
 * Multiplies a vector by a matrix; treats the vector as a row vector; assumes
 * matrix entries are accessed in [column*dimension+row] fashion.
 * @param {!o3djs.flat_math.Vector} v The vector.
 * @param {!o3djs.flat_math.Matrix} m The matrix.
 * @return {!o3djs.flat_math.Vector} The product of v and m as a row vector.
 */
o3djs.flat_math.rowMajor.mulMatrixVector = function(m, v) {
  switch(m.length) {
    case 4:
      return o3djs.flat_math.rowMajor.mulMatrixVector2(m, v);
    case 9:
      return o3djs.flat_math.rowMajor.mulMatrixVector3(m, v);
    case 16:
      return o3djs.flat_math.rowMajor.mulMatrixVector4(m, v);
    default:
      throw "Cannot handle matrices of size other than 3x3 or 4x4";
  }
};

/**
 * Multiplies a vector by a matrix; treats the vector as a row vector.
 * @param {!o3djs.flat_math.Matrix} m The matrix.
 * @param {!o3djs.flat_math.Vector} v The vector.
 * @return {!o3djs.flat_math.Vector} The product of m and v as a row vector.
 */
o3djs.flat_math.mulVectorMatrix = null;

/**
 * Multiplies a matrix by a vector; treats the vector as a column vector.
 * assumes matrix entries are accessed in [row][column] fashion.
 * @param {!o3djs.flat_math.Matrix} m The matrix.
 * @param {!o3djs.flat_math.Vector} v The vector.
 * @return {!o3djs.flat_math.Vector} The product of m and v as a column vector.
 */
o3djs.flat_math.columnMajor.mulVectorMatrix = function (v, m) {
    return o3djs.flat_math.rowMajor.mulMatrixVector(m, v);
};

/**
 * Multiplies a matrix by a vector; treats the vector as a column vector;
 * assumes matrix entries are accessed in [column][row] fashion.
 * @param {!o3djs.flat_math.Matrix} m The matrix.
 * @param {!o3djs.flat_math.Vector} v The vector.
 * @return {!o3djs.flat_math.Vector} The product of m and v as a column vector.
 */
o3djs.flat_math.columnMajor.mulMatrixVector = function(m, v) {
    return o3djs.flat_math.rowMajor.mulVectorMatrix(v, m);
};

/**
 * Multiplies a matrix by a vector; treats the vector as a column vector.
 * @param {!o3djs.flat_math.Matrix} m The matrix.
 * @param {!o3djs.flat_math.Vector} v The vector.
 * @return {!o3djs.flat_math.Vector} The product of m and v as a column vector.
 */
o3djs.flat_math.mulMatrixVector = null;

/**
 * Multiplies two 2-by-2 matrices; assumes that the given matrices are 2-by-2;
 * assumes matrix entries are accessed in [row][column] fashion.
 * @param {!o3djs.flat_math.Matrix2} a The matrix on the left.
 * @param {!o3djs.flat_math.Matrix2} b The matrix on the right.
 * @return {!o3djs.flat_math.Matrix2} The matrix product of a and b.
 */
o3djs.flat_math.rowMajor.mulMatrixMatrix2 = function(a, b) {
  var a0 = a[0];
  var a1 = a[1];
  var b0 = b[0];
  var b1 = b[1];
  var a00 = a[0];
  var a01 = a[1];
  var a10 = a[2];
  var a11 = a[3];
  var b00 = b[0];
  var b01 = b[1];
  var b10 = b[2];
  var b11 = b[3];
  return o3djs.flat_math.makeMatrix2(a00 * b00 + a01 * b10, a00 * b01 + a01 * b11,
          a10 * b00 + a11 * b10, a10 * b01 + a11 * b11);
};

/**
 * Multiplies two 2-by-2 matrices; assumes that the given matrices are 2-by-2;
 * assumes matrix entries are accessed in [column][row] fashion.
 * @param {!o3djs.flat_math.Matrix2} a The matrix on the left.
 * @param {!o3djs.flat_math.Matrix2} b The matrix on the right.
 * @return {!o3djs.flat_math.Matrix2} The matrix product of a and b.
 */
o3djs.flat_math.columnMajor.mulMatrixMatrix2 = function(a, b) {
  var a0 = a[0];
  var a1 = a[1];
  var b0 = b[0];
  var b1 = b[1];
  var a00 = a[0];
  var a01 = a[1];
  var a10 = a[2];
  var a11 = a[3];
  var b00 = b[0];
  var b01 = b[1];
  var b10 = b[2];
  var b11 = b[3];
  return o3djs.flat_math.makeMatrix2(a00 * b00 + a10 * b01, a01 * b00 + a11 * b01,
          a00 * b10 + a10 * b11, a01 * b10 + a11 * b11);
};

/**
 * Multiplies two 2-by-2 matrices.
 * @param {!o3djs.flat_math.Matrix2} a The matrix on the left.
 * @param {!o3djs.flat_math.Matrix2} b The matrix on the right.
 * @return {!o3djs.flat_math.Matrix2} The matrix product of a and b.
 */
o3djs.flat_math.mulMatrixMatrix2 = null;


/**
 * Multiplies two 3-by-3 matrices; assumes that the given matrices are 3-by-3;
 * assumes matrix entries are accessed in [row][column] fashion.
 * @param {!o3djs.flat_math.Matrix3} a The matrix on the left.
 * @param {!o3djs.flat_math.Matrix3} b The matrix on the right.
 * @return {!o3djs.flat_math.Matrix3} The matrix product of a and b.
 */
o3djs.flat_math.rowMajor.mulMatrixMatrix3 = function(a, b) {
  var a0 = a[0];
  var a1 = a[1];
  var a2 = a[2];
  var b0 = b[0];
  var b1 = b[1];
  var b2 = b[2];
  var a00 = a[0];
  var a01 = a[1];
  var a02 = a[2];
  var a10 = a[3];
  var a11 = a[4];
  var a12 = a[5];
  var a20 = a[6];
  var a21 = a[7];
  var a22 = a[8];
  var b00 = b[0];
  var b01 = b[1];
  var b02 = b[2];
  var b10 = b[3];
  var b11 = b[4];
  var b12 = b[5];
  var b20 = b[6];
  var b21 = b[7];
  var b22 = b[8];
  return o3djs.flat_math.makeMatrix3(a00 * b00 + a01 * b10 + a02 * b20,
           a00 * b01 + a01 * b11 + a02 * b21,
           a00 * b02 + a01 * b12 + a02 * b22,
          a10 * b00 + a11 * b10 + a12 * b20,
           a10 * b01 + a11 * b11 + a12 * b21,
           a10 * b02 + a11 * b12 + a12 * b22,
          a20 * b00 + a21 * b10 + a22 * b20,
           a20 * b01 + a21 * b11 + a22 * b21,
           a20 * b02 + a21 * b12 + a22 * b22);
};

/**
 * Multiplies two 3-by-3 matrices; assumes that the given matrices are 3-by-3;
 * assumes matrix entries are accessed in [column][row] fashion.
 * @param {!o3djs.flat_math.Matrix3} a The matrix on the left.
 * @param {!o3djs.flat_math.Matrix3} b The matrix on the right.
 * @return {!o3djs.flat_math.Matrix3} The matrix product of a and b.
 */
o3djs.flat_math.columnMajor.mulMatrixMatrix3 = function(a, b) {

  var a00 = a[0];
  var a01 = a[1];
  var a02 = a[2];
  var a10 = a[3];
  var a11 = a[4];
  var a12 = a[5];
  var a20 = a[6];
  var a21 = a[7];
  var a22 = a[8];
  var b00 = b[0];
  var b01 = b[1];
  var b02 = b[2];
  var b10 = b[3];
  var b11 = b[4];
  var b12 = b[5];
  var b20 = b[6];
  var b21 = b[7];
  var b22 = b[8];

  return o3djs.flat_math.makeMatrix4(a00 * b00 + a10 * b01 + a20 * b02,
           a01 * b00 + a11 * b01 + a21 * b02,
           a02 * b00 + a12 * b01 + a22 * b02,
          a00 * b10 + a10 * b11 + a20 * b12,
           a01 * b10 + a11 * b11 + a21 * b12,
           a02 * b10 + a12 * b11 + a22 * b12,
          a00 * b20 + a10 * b21 + a20 * b22,
           a01 * b20 + a11 * b21 + a21 * b22,
           a02 * b20 + a12 * b21 + a22 * b22);
};

/**
 * Multiplies two 3-by-3 matrices; assumes that the given matrices are 3-by-3.
 * @param {!o3djs.flat_math.Matrix3} a The matrix on the left.
 * @param {!o3djs.flat_math.Matrix3} b The matrix on the right.
 * @return {!o3djs.flat_math.Matrix3} The matrix product of a and b.
 */
o3djs.flat_math.mulMatrixMatrix3 = null;

/**
 * Multiplies two 4-by-4 matrices; assumes that the given matrices are 4-by-4;
 * assumes matrix entries are accessed in [row][column] fashion.
 * @param {!o3djs.flat_math.Matrix4} a The matrix on the left.
 * @param {!o3djs.flat_math.Matrix4} b The matrix on the right.
 * @return {!o3djs.flat_math.Matrix4} The matrix product of a and b.
 */
o3djs.flat_math.rowMajor.mulMatrixMatrix4 = function(a, b) {

  var a00 = a[0];
  var a01 = a[1];
  var a02 = a[2];
  var a03 = a[3];
  var a10 = a[4];
  var a11 = a[5];
  var a12 = a[6];
  var a13 = a[7];
  var a20 = a[8];
  var a21 = a[9];
  var a22 = a[10];
  var a23 = a[11];
  var a30 = a[12];
  var a31 = a[13];
  var a32 = a[14];
  var a33 = a[15];
  var b00 = b[0];
  var b01 = b[1];
  var b02 = b[2];
  var b03 = b[3];
  var b10 = b[4];
  var b11 = b[5];
  var b12 = b[6];
  var b13 = b[7];
  var b20 = b[8];
  var b21 = b[9];
  var b22 = b[10];
  var b23 = b[11];
  var b30 = b[12];
  var b31 = b[13];
  var b32 = b[14];
  var b33 = b[15];
  return o3djs.flat_math.makeMatrix4(a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30,
           a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31,
           a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32,
           a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33,
          a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30,
           a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31,
           a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32,
           a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33,
          a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30,
           a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31,
           a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32,
           a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33,
          a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30,
           a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31,
           a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32,
           a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33);
};

/**
 * Multiplies two 4-by-4 matrices; assumes that the given matrices are 4-by-4;
 * assumes matrix entries are accessed in [column][row] fashion.
 * @param {!o3djs.flat_math.Matrix4} a The matrix on the left.
 * @param {!o3djs.flat_math.Matrix4} b The matrix on the right.
 * @return {!o3djs.flat_math.Matrix4} The matrix product of a and b.
 */
o3djs.flat_math.columnMajor.mulMatrixMatrix4 = function(a, b) {

  var a00 = a[0];
  var a01 = a[1];
  var a02 = a[2];
  var a03 = a[3];
  var a10 = a[4];
  var a11 = a[5];
  var a12 = a[6];
  var a13 = a[7];
  var a20 = a[8];
  var a21 = a[9];
  var a22 = a[10];
  var a23 = a[11];
  var a30 = a[12];
  var a31 = a[13];
  var a32 = a[14];
  var a33 = a[15];
  var b00 = b[0];
  var b01 = b[1];
  var b02 = b[2];
  var b03 = b[3];
  var b10 = b[4];
  var b11 = b[5];
  var b12 = b[6];
  var b13 = b[7];
  var b20 = b[8];
  var b21 = b[9];
  var b22 = b[10];
  var b23 = b[11];
  var b30 = b[12];
  var b31 = b[13];
  var b32 = b[14];
  var b33 = b[15];
  return o3djs.flat_math.makeMatrix4(
      a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03,
      a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03,
      a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03,
      a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03,
      a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13,
      a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13,
      a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13,
      a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13,
      a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23,
      a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23,
      a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23,
      a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23,
      a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33,
      a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33,
      a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33,
      a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33);
};

/**
 * Multiplies two 4-by-4 matrices; assumes that the given matrices are 4-by-4.
 * @param {!o3djs.flat_math.Matrix4} a The matrix on the left.
 * @param {!o3djs.flat_math.Matrix4} b The matrix on the right.
 * @return {!o3djs.flat_math.Matrix4} The matrix product of a and b.
 */
o3djs.flat_math.mulMatrixMatrix4 = null;

/**
 * Multiplies two matrices; assumes that the sizes of the matrices are
 * appropriately compatible; assumes matrix entries are accessed in
 * [row][column] fashion.
 * @param {!o3djs.flat_math.Matrix} a The matrix on the left.
 * @param {!o3djs.flat_math.Matrix} b The matrix on the right.
 * @return {!o3djs.flat_math.Matrix} The matrix product of a and b.
 */
o3djs.flat_math.rowMajor.mulMatrixMatrix = function(a, b) {
  switch(a.length) {
    case 4:
      return o3djs.flat_math.rowMajor.mulMatrixMatrix2(a,b);
    case 9:
      return o3djs.flat_math.rowMajor.mulMatrixMatrix3(a,b);
    case 16:
      return o3djs.flat_math.rowMajor.mulMatrixMatrix4(a,b);
    default:
      throw "Unable to handle irregular matrices or matrices of dim > 4 or < 2";
  }
  };

o3djs.flat_math.rowMajor.generalizedMulMatrixMatrix= function(a, b) {
  var r = [];
  var aRows = a.length;
  var bColumns = b[0].length;
  var bRows = b.length;
  for (var i = 0; i < aRows; ++i) {
    var v = [];    // v becomes a row of the answer.
    var ai = a[i]; // ith row of a.
    for (var j = 0; j < bColumns; ++j) {
      v[j] = 0.0;
      for (var k = 0; k < bRows; ++k)
        v[j] += ai[k] * b[k][j]; // kth row, jth column.
    }
    r[i] = v;
  }
  return r;
};

/**
 * Multiplies two matrices; assumes that the sizes of the matrices are
 * appropriately compatible; assumes matrix entries are accessed in
 * [row][column] fashion.
 * @param {!o3djs.flat_math.Matrix} a The matrix on the left.
 * @param {!o3djs.flat_math.Matrix} b The matrix on the right.
 * @return {!o3djs.flat_math.Matrix} The matrix product of a and b.
 */
o3djs.flat_math.columnMajor.mulMatrixMatrix = function(a, b) {
  switch(a.length) {
    case 4:
      return o3djs.flat_math.columnMajor.mulMatrixMatrix2(a,b);
    case 9:
      return o3djs.flat_math.columnMajor.mulMatrixMatrix3(a,b);
    case 16:
      return o3djs.flat_math.columnMajor.mulMatrixMatrix4(a,b);
    default:
      throw "Unable to handle irregular matrices or matrices of dim > 4 or < 2";
  }
};

/**
 * Multiplies two matrices; assumes that the sizes of the matrices are
 * appropriately compatible.
 * @param {!o3djs.flat_math.Matrix} a The matrix on the left.
 * @param {!o3djs.flat_math.Matrix} b The matrix on the right.
 * @return {!o3djs.flat_math.Matrix} The matrix product of a and b.
 */
o3djs.flat_math.mulMatrixMatrix = null;

/**
 * Gets the jth column of the given matrix m; assumes matrix entries are
 * accessed in [row*dimension+column] fashion.
 * @param {!o3djs.flat_math.Matrix} m The matrix.
 * @param {number} j The index of the desired column.
 * @return {!o3djs.flat_math.Vector} The jth column of m as a vector.
 */
o3djs.flat_math.rowMajor.column = function(m, j) {
  var mLength = m.length;
  var dimension;
  switch (mLength){
    case 4:
      dimension = 2;
      break;
    case 9:
      dimension = 3;
      break;
    case 16:
      dimension = 4;
      break;
  }
  var r = new o3djs.flat_math.Vector(dimension);
  for (var i = 0; i < dimension; ++i) {
    r[i] = m[i * dimension + j];
  }
  return r;
};

/**
 * Gets the jth column of the given matrix m; assumes matrix entries are
 * accessed in [column][row] fashion.
 * @param {!o3djs.flat_math.Matrix} m The matrix.
 * @param {number} j The index of the desired column.
 * @return {!o3djs.flat_math.Vector} The jth column of m as a vector.
 */
o3djs.flat_math.columnMajor.column = function(m, j) {
  var dimension;
  var mLength = m.length;
  switch (mLength){
  case 4:
    dimension = 2;
    break;
  case 9:
    dimension = 3;
    break;
  case 16:
    dimension = 4;
    break;
  default:
      dimension = Math.sqrt(dimension);
      if (Math.round(dimension) * Math.round(dimension) != mLength) {
        throw "Calling column on nonsquare matrix";
      }
  }
  return m.slice(j * dimension, j * dimension + dimension);
};

/**
 * Gets the jth column of the given matrix m.
 * @param {!o3djs.flat_math.Matrix} m The matrix.
 * @param {number} j The index of the desired column.
 * @return {!o3djs.flat_math.Vector} The jth column of m as a vector.
 */
o3djs.flat_math.column = null;

/**
 * Gets the ith row of the given matrix m; assumes matrix entries are
 * accessed in [row][column] fashion.
 * @param {!o3djs.flat_math.Matrix} m The matrix.
 * @param {number} i The index of the desired row.
 * @return {!o3djs.flat_math.Vector} The ith row of m.
 */
o3djs.flat_math.rowMajor.row = o3djs.flat_math.columnMajor.column;

/**
 * Gets the ith row of the given matrix m; assumes matrix entries are
 * accessed in [column][row] fashion.
 * @param {!o3djs.flat_math.Matrix} m The matrix.
 * @param {number} i The index of the desired row.
 * @return {!o3djs.flat_math.Vector} The ith row of m.
 */
o3djs.flat_math.columnMajor.row = o3djs.flat_math.rowMajor.column;

/**
 * Gets the ith row of the given matrix m.
 * @param {!o3djs.flat_math.Matrix} m The matrix.
 * @param {number} i The index of the desired row.
 * @return {!o3djs.flat_math.Vector} The ith row of m.
 */
o3djs.flat_math.row = null;

/**
 * Creates an n-by-n identity matrix.
 * @param {number} n The dimension of the identity matrix required.
 * @return {!o3djs.flat_math.Matrix} An n-by-n identity matrix.
 */
o3djs.flat_math.identity = function(n) {
  var r = new o3djs.flat_math.Matrix(n*n);

  for (var j = 0; j < n; ++j) {
    for (var i = 0; i < n; ++i)
      r[j * n + i] = (i == j) ? 1 : 0;
  }
  return r;
};

/**
 * Takes the transpose of a matrix.
 * @param {!o3djs.flat_math.Matrix} m The matrix.
 * @return {!o3djs.flat_math.Matrix} The transpose of m.
 */
o3djs.flat_math.transpose = function(m) {
  var mLength = m.length;
  var r = new o3djs.flat_math.Matrix(mLength);
  var dimension;
  switch (mLength){
  case 4:
      dimension = 2;
      break;
  case 9:
      dimension = 3;
      break;
  case 16:
      dimension = 4;
      break;
  default:
      dimension = Math.sqrt(dimension);
      if (Math.round(dimension) * Math.round(dimension) != mLength) {
        throw "Calling transpose on nonsquare matrix";
      }
  }

  for (var j = 0; j < dimension; ++j) {
    for (var i = 0; i < dimension; ++i)
      r[j * dimension + i] = m[i * dimension + j];
  }
  return r;
};

/**
 * Computes the trace (sum of the diagonal entries) of a square matrix;
 * assumes m is square.
 * @param {!o3djs.flat_math.Matrix} m The matrix.
 * @return {number} The trace of m.
 */
o3djs.flat_math.trace = function(m) {
  var r = 0.0;
  var dimension;
  switch (mLength){
  case 4:
      dimension = 2;
      break;
  case 9:
      dimension = 3;
      break;
  case 16:
      dimension = 4;
      break;
  }
  var mLength = dimension;
  for (var i = 0; i < mLength; ++i)
    r += m[i * dimension + i];
  return r;
};

/**
 * Computes the determinant of a 1-by-1 matrix.
 * @param {!o3djs.flat_math.Matrix1} m The matrix.
 * @return {number} The determinant of m.
 */
o3djs.flat_math.det1 = function(m) {
  return m[0];
};

/**
 * Computes the determinant of a 2-by-2 matrix.
 * @param {!o3djs.flat_math.Matrix2} m The matrix.
 * @return {number} The determinant of m.
 */
o3djs.flat_math.det2 = function(m) {
  return m[0] * m[3] - m[1] * m[2];
};

/**
 * Computes the determinant of a 3-by-3 matrix.
 * @param {!o3djs.flat_math.Matrix3} m The matrix.
 * @return {number} The determinant of m.
 */
o3djs.flat_math.det3 = function(m) {
  return m[8] * (m[0 * 3] * m[4] - m[1] * m[1 * 3]) -
         m[7] * (m[0 * 3] * m[5] - m[2] * m[1 * 3]) +
         m[2 * 3] * (m[1] * m[5] - m[2] * m[4]);
};

/**
 * Computes the determinant of a 4-by-4 matrix.
 * @param {!o3djs.flat_math.Matrix4} m The matrix.
 * @return {number} The determinant of m.
 */
o3djs.flat_math.det4 = function(m) {
  var t01 = m[0] * m[5] - m[1] * m[4];
  var t02 = m[0] * m[6] - m[2] * m[4];
  var t03 = m[0] * m[7] - m[3] * m[4];
  var t12 = m[1] * m[6] - m[2] * m[5];
  var t13 = m[1] * m[7] - m[3] * m[5];
  var t23 = m[2] * m[7] - m[3] * m[6];
  return m[15] * (m[10] * t01 - m[9] * t02 + m[8] * t12) -
         m[14] * (m[11] * t01 - m[9] * t03 + m[8] * t13) +
         m[13] * (m[11] * t02 - m[10] * t03 + m[8] * t23) -
         m[12] * (m[11] * t12 - m[10] * t13 + m[9] * t23);
};

/**
 * Computes the inverse of a 1-by-1 matrix.
 * @param {!o3djs.flat_math.Matrix1} m The matrix.
 * @return {!o3djs.flat_math.Matrix1} The inverse of m.
 */
o3djs.flat_math.inverse1 = function(m) {
  var retval = new o3djs.flat_math.Matrix(1);
  retval[0] = 1.0 / m[0];
  return retval;
};

/**
 * Computes the inverse of a 2-by-2 matrix.
 * @param {!o3djs.flat_math.Matrix2} m The matrix.
 * @return {!o3djs.flat_math.Matrix2} The inverse of m.
 */
o3djs.flat_math.inverse2 = function(m) {
  var d = 1.0 / (m[0] * m[3] - m[1] * m[2]);
  return o3djs.flat_math.makeMatrix2(d * m[3], -d * m[1],
                                -d * m[2], d * m[0]);
};

/**
 * Computes the inverse of a 3-by-3 matrix.
 * @param {!o3djs.flat_math.Matrix3} m The matrix.
 * @return {!o3djs.flat_math.Matrix3} The inverse of m.
 */
o3djs.flat_math.inverse3 = function(m) {
  var t00 = m[4] * m[8] - m[5] * m[7];
  var t10 = m[1] * m[8] - m[2] * m[7];
  var t20 = m[1] * m[5] - m[2] * m[4];
  var d = 1.0 / (m[0] * t00 - m[3] * t10 + m[6] * t20);
  return o3djs.flat_math.makeMatrix3(d * t00, -d * t10, d * t20,
          -d * (m[3] * m[8] - m[5] * m[6]),
            d * (m[0] * m[8] - m[2] * m[6]),
           -d * (m[0] * m[5] - m[2] * m[3]),
          d * (m[3] * m[7] - m[4] * m[6]),
          -d * (m[0] * m[7] - m[1] * m[6]),
           d * (m[0] * m[4] - m[1] * m[3]));
};

/**
 * Computes the inverse of a 4-by-4 matrix.
 * @param {!o3djs.flat_math.Matrix4} m The matrix.
 * @return {!o3djs.flat_math.Matrix4} The inverse of m.
 */
o3djs.flat_math.inverse4 = function(m) {
  var tmp_0 = m[10] * m[15];
  var tmp_1 = m[14] * m[11];
  var tmp_2 = m[6] * m[15];
  var tmp_3 = m[14] * m[7];
  var tmp_4 = m[6] * m[11];
  var tmp_5 = m[10] * m[7];
  var tmp_6 = m[2] * m[15];
  var tmp_7 = m[14] * m[3];
  var tmp_8 = m[2] * m[11];
  var tmp_9 = m[10] * m[3];
  var tmp_10 = m[2] * m[7];
  var tmp_11 = m[6] * m[3];
  var tmp_12 = m[8] * m[13];
  var tmp_13 = m[12] * m[9];
  var tmp_14 = m[4] * m[13];
  var tmp_15 = m[12] * m[5];
  var tmp_16 = m[4] * m[9];
  var tmp_17 = m[8] * m[5];
  var tmp_18 = m[0] * m[13];
  var tmp_19 = m[12] * m[1];
  var tmp_20 = m[0] * m[9];
  var tmp_21 = m[8] * m[1];
  var tmp_22 = m[0] * m[5];
  var tmp_23 = m[4] * m[1];

  var t0 = tmp_0 * m[5] + tmp_3 * m[9] + tmp_4 * m[13] -
      (tmp_1 * m[5] + tmp_2 * m[9] + tmp_5 * m[13]);
  var t1 = tmp_1 * m[1] + tmp_6 * m[9] + tmp_9 * m[13] -
      (tmp_0 * m[1] + tmp_7 * m[9] + tmp_8 * m[13]);
  var t2 = tmp_2 * m[1] + tmp_7 * m[5] + tmp_10 * m[13] -
      (tmp_3 * m[1] + tmp_6 * m[5] + tmp_11 * m[13]);
  var t3 = (tmp_5 * m[1] + tmp_8 * m[5] + tmp_11 * m[9]) -
      (tmp_4 * m[1] + tmp_9 * m[5] + tmp_10 * m[9]);

  var d = 1.0 / (m[0] * t0 + m[1 * 4] * t1 + m[8] * t2 + m[12] * t3);

  return o3djs.flat_math.makeMatrix4(d * t0, d * t1, d * t2, d * t3,
      d * ((tmp_1 * m[1 * 4] + tmp_2 * m[8] + tmp_5 * m[12]) -
          (tmp_0 * m[1 * 4] + tmp_3 * m[8] + tmp_4 * m[12])),
      d * ((tmp_0 * m[0 * 4] + tmp_7 * m[8] + tmp_8 * m[12]) -
         (tmp_1 * m[0 * 4] + tmp_6 * m[8] + tmp_9 * m[12])),
      d * ((tmp_3 * m[0 * 4] + tmp_6 * m[1 * 4] + tmp_11 * m[12]) -
          (tmp_2 * m[0 * 4] + tmp_7 * m[1 * 4] + tmp_10 * m[12])),
      d * ((tmp_4 * m[0 * 4] + tmp_9 * m[1 * 4] + tmp_10 * m[8]) -
          (tmp_5 * m[0 * 4] + tmp_8 * m[1 * 4] + tmp_11 * m[8])),
     d * ((tmp_12 * m[4 + 3] + tmp_15 * m[11] + tmp_16 * m[15]) -
          (tmp_13 * m[4 + 3] + tmp_14 * m[11] + tmp_17 * m[15])),
      d * ((tmp_13 * m[3] + tmp_18 * m[11] + tmp_21 * m[15]) -
          (tmp_12 * m[3] + tmp_19 * m[11] + tmp_20 * m[15])),
       d * ((tmp_14 * m[3] + tmp_19 * m[7] + tmp_22 * m[15]) -
          (tmp_15 * m[3] + tmp_18 * m[7] + tmp_23 * m[15])),
       d * ((tmp_17 * m[3] + tmp_20 * m[7] + tmp_23 * m[11]) -
          (tmp_16 * m[3] + tmp_21 * m[7] + tmp_22 * m[11])),
     d * ((tmp_14 * m[10] + tmp_17 * m[14] + tmp_13 * m[4 + 2]) -
          (tmp_16 * m[14] + tmp_12 * m[4 + 2] + tmp_15 * m[10])),
       d * ((tmp_20 * m[14] + tmp_12 * m[2] + tmp_19 * m[10]) -
          (tmp_18 * m[10] + tmp_21 * m[14] + tmp_13 * m[2])),
       d * ((tmp_18 * m[6] + tmp_23 * m[14] + tmp_15 * m[2]) -
          (tmp_22 * m[14] + tmp_14 * m[2] + tmp_19 * m[6])),
       d * ((tmp_22 * m[10] + tmp_16 * m[2] + tmp_21 * m[6]) -
          (tmp_20 * m[6] + tmp_23 * m[10] + tmp_17 * m[2])));
};

/**
 * Computes the determinant of the cofactor matrix obtained by removal
 * of a specified row and column.  This is a helper function for the general
 * determinant and matrix inversion functions.
 * @param {!o3djs.flat_math.Matrix} a The original matrix.
 * @param {number} x The row to be removed.
 * @param {number} y The column to be removed.
 * @return {number} The determinant of the matrix obtained by removing
 *     row x and column y from a.
 */
o3djs.flat_math.codet = function(a, x, y) {
  var aLength = a.length;
  var size;
  switch (aLength) {
  case 4:
      size = 2;
      break;
  case 9:
      size = 3;
      break;
  case 16:
      size = 4;
      break;
  default:
      size=Math.sqrt(aLength);
      if (Math.round(size) * Math.round(size) != aLength) {
          throw "Calling codet on nonsquare matrix";
      }
  }
  var b = new o3djs.flat_math.Matrix(aLength);
  var ai = 0;
  for (var bi = 0; bi < size - 1; ++bi) {
    if (ai == x)
      ai++;
    var aj = 0;
    for (var bj = 0; bj < size - 1; ++bj) {
      if (aj == y)
        aj++;
      b[bi*size+bj] = a[ai*size+aj];
      aj++;
    }
    ai++;
  }
  return o3djs.flat_math.det(b);
};

/**
 * Computes the determinant of an arbitrary square matrix.
 * @param {!o3djs.flat_math.Matrix} m The matrix.
 * @return {number} the determinant of m.
 */
o3djs.flat_math.det = function(m) {
  var d = m.length;
  switch (d) {
    case 4:
        return o3djs.flat_math.det2(m);
    case 9:
        return o3djs.flat_math.det3(m);
    case 16:
        return o3djs.flat_math.det4(m);
    default:
        d = Math.sqrt(d);
        if (Math.round(d) * Math.round(d) != m.length) {
          throw "Calling det on nonsquare matrix";
        }
        break;
  }
  var r = 0.0;
  var sign = 1;
  var row = m;
  var mLength = m.length;
  for (var y = 0; y < mLength; y++) {
    r += sign * m[0] * o3djs.flat_math.codet(m, 0, y);
    sign *= -1;
  }
  return r;
};

/**
 * Computes the inverse of an arbitrary square matrix.
 * @param {!o3djs.flat_math.Matrix} m The matrix.
 * @return {!o3djs.flat_math.Matrix} The inverse of m.
 */
o3djs.flat_math.inverse = function(m) {
  var d = m.length;
  switch (d) {
    case 4:
        return o3djs.flat_math.inverse2(m);
    case 9:
        return o3djs.flat_math.inverse3(m);
    case 16:
        return o3djs.flat_math.inverse4(m);
    default:
        d = Math.sqrt(d);
        if (Math.round(d) * Math.round(d) != m.length) {
          throw "Calling inverse on nonsquare matrix";
        }
        break;
  }
  var r = new o3djs.flat_math.Matrix(m.length);
  var size = m.length;
  var det = o3djs.flat_math.det(m);
  for (var j = 0; j < size; ++j) {
    for (var i = 0; i < size; ++i)
      r[j * d + i] =
          ((i + j) % 2 ? -1 : 1) * o3djs.flat_math.codet(m, i, j) / det;
  }
  return r;
};

/**
 * Performs Graham-Schmidt orthogonalization on the vectors which make up the
 * given matrix and returns the result in the rows of a new matrix.  When
 * multiplying many orthogonal matrices together, errors can accumulate causing
 * the product to fail to be orthogonal.  This function can be used to correct
 * that.
 * @param {!o3djs.flat_math.Matrix} m The matrix.
 * @return {!o3djs.flat_math.Matrix} A matrix whose rows are obtained from the
 *     rows of m by the Graham-Schmidt process.
 */
o3djs.flat_math.orthonormalize = function(m) {
  var d = m.length;
  var r = new o3djs.flat_math.Matrix(d);
  switch (d) {
    case 4:
        d = 2; break;
    case 9:
        d = 3; break;
    case 16:
        d = 4; break;
    default:
        d = Math.sqrt(d);
        if (Math.round(d) * Math.round(d) != m.length) {
          throw "Calling orthonormalize on nonsquare matrix";
        }
        break;
  }
  for (var i = 0; i < d; ++i) {
    var v = m.slice(i*d,i*d+d);
    for (var j = 0; j < i; ++j) {
      v = o3djs.flat_math.subVector(v, o3djs.flat_math.mulScalarVector(
          o3djs.flat_math.dot(r[j], v), r[j]));
    }
    var ri = o3djs.flat_math.normalize(v);
    for (var k = 0; k < d; ++ k) {
        r[i * d +k ] = ri[k];
    }
  }
  return r;
};

/**
 * Computes the inverse of a 4-by-4 matrix.
 * Note: It is faster to call this than o3djs.flat_math.inverse.
 * @param {!o3djs.flat_math.Matrix4} m The matrix.
 * @return {!o3djs.flat_math.Matrix4} The inverse of m.
 */
o3djs.flat_math.matrix4.inverse = function(m) {
  return o3djs.flat_math.inverse4(m);
};

/**
 * Multiplies two 4-by-4 matrices; assumes that the given matrices are 4-by-4.
 * Note: It is faster to call this than o3djs.flat_math.mul.
 * @param {!o3djs.flat_math.Matrix4} a The matrix on the left.
 * @param {!o3djs.flat_math.Matrix4} b The matrix on the right.
 * @return {!o3djs.flat_math.Matrix4} The matrix product of a and b.
 */
o3djs.flat_math.matrix4.mul = function(a, b) {
  return o3djs.flat_math.mulMatrixMatrix4(a, b);
};

/**
 * Computes the determinant of a 4-by-4 matrix.
 * Note: It is faster to call this than o3djs.flat_math.det.
 * @param {!o3djs.flat_math.Matrix4} m The matrix.
 * @return {number} The determinant of m.
 */
o3djs.flat_math.matrix4.det = function(m) {
  return o3djs.flat_math.det4(m);
};

/**
 * Copies a Matrix4.
 * Note: It is faster to call this than o3djs.flat_math.copy.
 * @param {!o3djs.flat_math.Matrix4} m The matrix.
 * @return {!o3djs.flat_math.Matrix4} A copy of m.
 */
o3djs.flat_math.matrix4.copy = function(m) {
  return o3djs.flat_math.copyMatrix(m);
};

/**
 * Sets the upper 3-by-3 block of matrix a to the upper 3-by-3 block of matrix
 * b; assumes that a and b are big enough to contain an upper 3-by-3 block.
 * @param {!o3djs.flat_math.Matrix4} a A matrix.
 * @param {!o3djs.flat_math.Matrix3} b A 3-by-3 matrix.
 * @return {!o3djs.flat_math.Matrix4} a once modified.
 */
o3djs.flat_math.matrix4.setUpper3x3 = function(a, b) {
  a[0] = b[0];
  a[1] = b[1];
  a[2] = b[2];
  a[4] = b[4];
  a[5] = b[5];
  a[6] = b[6];
  a[8] = b[8];
  a[9] = b[9];
  a[10] = b[10];

  return a;
};

/**
 * Returns a 3-by-3 matrix mimicking the upper 3-by-3 block of m; assumes m
 * is big enough to contain an upper 3-by-3 block.
 * @param {!o3djs.flat_math.Matrix4} m The matrix.
 * @return {!o3djs.flat_math.Matrix3} The upper 3-by-3 block of m.
 */
o3djs.flat_math.matrix4.getUpper3x3 = function(m) {
  return o3djs.flat_math.makeMatrix3(
      m[0], m[1], m[2],
      m[4], m[5], m[6],
      m[8], m[9], m[10]);
};

/**
 * Sets the translation component of a 4-by-4 matrix to the given
 * vector.
 * @param {!o3djs.flat_math.Matrix4} a The matrix.
 * @param {(!o3djs.flat_math.Vector3|!o3djs.flat_math.Vector4)} v The vector.
 * @return {!o3djs.flat_math.Matrix4} a once modified.
 */
o3djs.flat_math.matrix4.setTranslation = function(a, v) {
  a[12] = v[0];
  a[13] = v[1];
  a[14] = v[2];
  return a;
};

/**
 * Returns the translation component of a 4-by-4 matrix as a vector with 3
 * entries.
 * @param {!o3djs.flat_math.Matrix4} m The matrix.
 * @return {!o3djs.flat_math.Vector3} The translation component of m.
 */
o3djs.flat_math.matrix4.getTranslation = function(m) {
  var retval =new o3djs.flat_math.Vector(3);
  retval[0] = m[12];
  retval[1] = m[13];
  retval[2] = m[14];
  return retval;
};

/**
 * Takes a 4-by-4 matrix and a vector with 3 entries,
 * interprets the vector as a point, transforms that point by the matrix, and
 * returns the result as a vector with 3 entries.
 * @param {!o3djs.flat_math.Matrix4} m The matrix.
 * @param {!o3djs.flat_math.Vector3} v The point.
 * @return {!o3djs.flat_math.Vector3} The transformed point.
 */
o3djs.flat_math.matrix4.transformPoint = function(m, v) {
  var v0 = v[0];
  var v1 = v[1];
  var v2 = v[2];

  var d = v0 * m[3] +
          v1 * m[7] +
          v2 * m[11] +
               m[15];
  var retval = new o3djs.flat_math.Vector(3);
  retval[0] = (v0 * m[0] +
               v1 * m[4] +
               v2 * m[8] +
                    m[12]) / d;
  retval[1] = (v0 * m[1] +
               v1 * m[5] +
               v2 * m[9] +
                    m[13]) / d;
  retval[2] = (v0 * m[2] +
               v1 * m[6] +
               v2 * m[10] +
                    m[14]) / d;
  return retval;
};

/**
 * Takes a 4-by-4 matrix and a vector with 4 entries, transforms that vector by
 * the matrix, and returns the result as a vector with 4 entries.
 * @param {!o3djs.flat_math.Matrix4} m The matrix.
 * @param {!o3djs.flat_math.Vector4} v The point in homogenous coordinates.
 * @return {!o3djs.flat_math.Vector4} The transformed point in homogenous
 *     coordinates.
 */
o3djs.flat_math.matrix4.transformVector4 = function(m, v) {
  var v0 = v[0];
  var v1 = v[1];
  var v2 = v[2];
  var v3 = v[3];

  return [v0 * m[0] +
          v1 * m[4] +
          v2 * m[8] +
          v3 * m[12],
          v0 * m[1] +
          v1 * m[5] +
          v2 * m[9] +
          v3 * m[13],
          v0 * m[2] +
          v1 * m[6] +
          v2 * m[10] +
          v3 * m[14],
          v0 * m[3] +
          v1 * m[7] +
          v2 * m[11] +
          v3 * m[15]];
};

/**
 * Takes a 4-by-4 matrix and a vector with 3 entries, interprets the vector as a
 * direction, transforms that direction by the matrix, and returns the result;
 * assumes the transformation of 3-dimensional space represented by the matrix
 * is parallel-preserving, i.e. any combination of rotation, scaling and
 * translation, but not a perspective distortion. Returns a vector with 3
 * entries.
 * @param {!o3djs.flat_math.Matrix4} m The matrix.
 * @param {!o3djs.flat_math.Vector3} v The direction.
 * @return {!o3djs.flat_math.Vector3} The transformed direction.
 */
o3djs.flat_math.matrix4.transformDirection = function(m, v) {
  var v0 = v[0];
  var v1 = v[1];
  var v2 = v[2];

  return [v0 * m[0] +
          v1 * m[4] +
          v2 * m[8],
          v0 * m[1] +
          v1 * m[5] +
          v2 * m[9],
          v0 * m[2] +
          v1 * m[6] +
          v2 * m[10]];
};

/**
 * Takes a 4-by-4 matrix m and a vector v with 3 entries, interprets the vector
 * as a normal to a surface, and computes a vector which is normal upon
 * transforming that surface by the matrix. The effect of this function is the
 * same as transforming v (as a direction) by the inverse-transpose of m.  This
 * function assumes the transformation of 3-dimensional space represented by the
 * matrix is parallel-preserving, i.e. any combination of rotation, scaling and
 * translation, but not a perspective distortion.  Returns a vector with 3
 * entries.
 * @param {!o3djs.flat_math.Matrix4} m The matrix.
 * @param {!o3djs.flat_math.Vector3} v The normal.
 * @return {!o3djs.flat_math.Vector3} The transformed normal.
 */
o3djs.flat_math.matrix4.transformNormal = function(m, v) {
  var mInverse = o3djs.flat_math.inverse4(m);
  var v0 = v[0];
  var v1 = v[1];
  var v2 = v[2];

  return [v0 * mInverse[0] + v1 * mInverse[1] + v2 * mInverse[2],
          v0 * mInverse[4] +
          v1 * mInverse[5] +
          v2 * mInverse[6],
          v0 * mInverse[8] +
          v1 * mInverse[9] +
          v2 * mInverse[10]];
};

/**
 * Creates a 4-by-4 identity matrix.
 * @return {!o3djs.flat_math.Matrix4} The 4-by-4 identity.
 */
o3djs.flat_math.matrix4.identity = function() {
  return o3djs.flat_math.makeMatrix4(
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1);
};

/**
 * Sets the given 4-by-4 matrix to the identity matrix.
 * @param {!o3djs.flat_math.Matrix4} m The matrix to set to identity.
 * @return {!o3djs.flat_math.Matrix4} m once modified.
 */
o3djs.flat_math.matrix4.setIdentity = function(m) {
  for (var i = 0; i < 4; i++) {
    for (var j = 0; j < 4; j++) {
      if (i == j) {
        m[i * 4 + j] = 1;
      } else {
        m[i * 4 + j] = 0;
      }
    }
  }
  return m;
};

/**
 * Computes a 4-by-4 perspective transformation matrix given the angular height
 * of the frustum, the aspect ratio, and the near and far clipping planes.  The
 * arguments define a frustum extending in the negative z direction.  The given
 * angle is the vertical angle of the frustum, and the horizontal angle is
 * determined to produce the given aspect ratio.  The arguments near and far are
 * the distances to the near and far clipping planes.  Note that near and far
 * are not z coordinates, but rather they are distances along the negative
 * z-axis.  The matrix generated sends the viewing frustum to the unit box.
 * We assume a unit box extending from -1 to 1 in the x and y dimensions and
 * from 0 to 1 in the z dimension.
 * @param {number} angle The camera angle from top to bottom (in radians).
 * @param {number} aspect The aspect ratio width / height.
 * @param {number} near The depth (negative z coordinate)
 *     of the near clipping plane.
 * @param {number} far The depth (negative z coordinate)
 *     of the far clipping plane.
 * @return {!o3djs.flat_math.Matrix4} The perspective matrix.
 */
o3djs.flat_math.matrix4.perspective = function(angle, aspect, near, far) {
  var f = Math.tan(0.5 * (Math.PI - angle));
  var range = near - far;

  return o3djs.flat_math.makeMatrix4 (
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, 2 * far / range + 1, -1,
    0, 0, 2 * near * far / range, 0
  );
};

/**
 * Computes a 4-by-4 orthographic projection matrix given the coordinates of the
 * planes defining the axis-aligned, box-shaped viewing volume.  The matrix
 * generated sends that box to the unit box.  Note that although left and right
 * are x coordinates and bottom and top are y coordinates, near and far
 * are not z coordinates, but rather they are distances along the negative
 * z-axis.  We assume a unit box extending from -1 to 1 in the x and y
 * dimensions and from 0 to 1 in the z dimension.
 * @param {number} left The x coordinate of the left plane of the box.
 * @param {number} right The x coordinate of the right plane of the box.
 * @param {number} bottom The y coordinate of the bottom plane of the box.
 * @param {number} top The y coordinate of the right plane of the box.
 * @param {number} near The negative z coordinate of the near plane of the box.
 * @param {number} far The negative z coordinate of the far plane of the box.
 * @return {!o3djs.flat_math.Matrix4} The orthographic projection matrix.
 */
o3djs.flat_math.matrix4.orthographic =
    function(left, right, bottom, top, near, far) {
  return o3djs.flat_math.makeMatrix4 (
    2 / (right - left), 0, 0, 0,
    0, 2 / (top - bottom), 0, 0,
    0, 0, 2 / (near - far), 0,
    (left + right) / (left - right),
    (bottom + top) / (bottom - top),
    (near + far) / (near - far), 1);
};

/**
 * Computes a 4-by-4 perspective transformation matrix given the left, right,
 * top, bottom, near and far clipping planes. The arguments define a frustum
 * extending in the negative z direction. The arguments near and far are the
 * distances to the near and far clipping planes. Note that near and far are not
 * z coordinates, but rather they are distances along the negative z-axis. The
 * matrix generated sends the viewing frustum to the unit box. We assume a unit
 * box extending from -1 to 1 in the x and y dimensions and from 0 to 1 in the z
 * dimension.
 * @param {number} left The x coordinate of the left plane of the box.
 * @param {number} right The x coordinate of the right plane of the box.
 * @param {number} bottom The y coordinate of the bottom plane of the box.
 * @param {number} top The y coordinate of the right plane of the box.
 * @param {number} near The negative z coordinate of the near plane of the box.
 * @param {number} far The negative z coordinate of the far plane of the box.
 * @return {!o3djs.flat_math.Matrix4} The perspective projection matrix.
 */
o3djs.flat_math.matrix4.frustum = function(left, right, bottom, top, near, far) {
  var dx = (right - left);
  var dy = (top - bottom);
  var dz = (near - far);
  return o3djs.flat_math.makeMatrix4(
    2 * near / dx, 0, 0, 0,
    0, 2 * near / dy, 0, 0,
    (left + right) / dx, (top + bottom) / dy, far / dz, -1,
    0, 0, near * far / dz, 0);
};

/**
 * Computes a 4-by-4 look-at transformation.  The transformation generated is
 * an orthogonal rotation matrix with translation component.  The translation
 * component sends the eye to the origin.  The rotation component sends the
 * vector pointing from the eye to the target to a vector pointing in the
 * negative z direction, and also sends the up vector into the upper half of
 * the yz plane.
 * @param {(!o3djs.flat_math.Vector3|!o3djs.flat_math.Vector4)} eye The position
 *     of the eye.
 * @param {(!o3djs.flat_math.Vector3|!o3djs.flat_math.Vector4)} target The
 *     position meant to be viewed.
 * @param {(!o3djs.flat_math.Vector3|!o3djs.flat_math.Vector4)} up A vector
 *     pointing up.
 * @return {!o3djs.flat_math.Matrix4} The look-at matrix.
 */
o3djs.flat_math.matrix4.lookAt = function(eye, target, up) {
  var vz = o3djs.flat_math.normalize(
      o3djs.flat_math.subVector(eye, target).slice(0, 3));
  var vx = o3djs.flat_math.normalize(
      o3djs.flat_math.cross(up, vz));
  var vy = o3djs.flat_math.cross(vz, vx);
  return o3djs.flat_math.inverse4(o3djs.flat_math.makeMatrix4(
      vx[0], vx[1], vx[2], 0,
      vy[0], vy[1], vy[2], 0,
      vz[0], vz[1], vz[2], 0,
      eye[0], eye[1], eye[2], 1));
};

/**
 * Takes two 4-by-4 matrices, a and b, and computes the product in the order
 * that pre-composes b with a.  In other words, the matrix returned will
 * transform by b first and then a.  Note this is subtly different from just
 * multiplying the matrices together.  For given a and b, this function returns
 * the same object in both row-major and column-major mode.
 * @param {!o3djs.flat_math.Matrix4} a A 4-by-4 matrix.
 * @param {!o3djs.flat_math.Matrix4} b A 4-by-4 matrix.
 * @return {!o3djs.flat_math.Matrix4} the composition of a and b, b first then a.
 */
o3djs.flat_math.matrix4.composition = function(a, b) {
  var a00 = a[0];
  var a01 = a[1];
  var a02 = a[2];
  var a03 = a[3];
  var a10 = a[4];
  var a11 = a[5];
  var a12 = a[6];
  var a13 = a[7];
  var a20 = a[8];
  var a21 = a[9];
  var a22 = a[10];
  var a23 = a[11];
  var a30 = a[12];
  var a31 = a[13];
  var a32 = a[14];
  var a33 = a[15];
  var b00 = b[0];
  var b01 = b[1];
  var b02 = b[2];
  var b03 = b[3];
  var b10 = b[4];
  var b11 = b[5];
  var b12 = b[6];
  var b13 = b[7];
  var b20 = b[8];
  var b21 = b[9];
  var b22 = b[10];
  var b23 = b[11];
  var b30 = b[12];
  var b31 = b[13];
  var b32 = b[14];
  var b33 = b[15];
  return o3djs.flat_math.makeMatrix(
      a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03,
      a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03,
      a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03,
      a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03,
      a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13,
      a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13,
      a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13,
      a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13,
      a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23,
      a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23,
      a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23,
      a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23,
      a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33,
      a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33,
      a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33,
      a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33);
};

/**
 * Takes two 4-by-4 matrices, a and b, and modifies a to be the product in the
 * order that pre-composes b with a.  The matrix a, upon modification will
 * transform by b first and then a.  Note this is subtly different from just
 * multiplying the matrices together.  For given a and b, a, upon modification,
 * will be the same object in both row-major and column-major mode.
 * @param {!o3djs.flat_math.Matrix4} a A 4-by-4 matrix.
 * @param {!o3djs.flat_math.Matrix4} b A 4-by-4 matrix.
 * @return {!o3djs.flat_math.Matrix4} a once modified.
 */
o3djs.flat_math.matrix4.compose = function(a, b) {
  var a00 = a[0];
  var a01 = a[1];
  var a02 = a[2];
  var a03 = a[3];
  var a10 = a[4];
  var a11 = a[5];
  var a12 = a[6];
  var a13 = a[7];
  var a20 = a[8];
  var a21 = a[9];
  var a22 = a[10];
  var a23 = a[11];
  var a30 = a[12];
  var a31 = a[13];
  var a32 = a[14];
  var a33 = a[15];
  var b00 = b[0];
  var b01 = b[1];
  var b02 = b[2];
  var b03 = b[3];
  var b10 = b[4];
  var b11 = b[5];
  var b12 = b[6];
  var b13 = b[7];
  var b20 = b[8];
  var b21 = b[9];
  var b22 = b[10];
  var b23 = b[11];
  var b30 = b[12];
  var b31 = b[13];
  var b32 = b[14];
  var b33 = b[15];
  a[0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
  a[1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
  a[2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
  a[3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;
  a[4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
  a[5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
  a[6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
  a[7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;
  a[8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
  a[9] =  a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
  a[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
  a[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;
  a[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
  a[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
  a[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
  a[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;
  return a;
};

/**
 * Creates a 4-by-4 matrix which translates by the given vector v.
 * @param {(!o3djs.flat_math.Vector3|!o3djs.flat_math.Vector4)} v The vector by
 *     which to translate.
 * @return {!o3djs.flat_math.Matrix4} The translation matrix.
 */
o3djs.flat_math.matrix4.translation = function(v) {
  return o3djs.flat_math.makeMatrix4(
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    v[0], v[1], v[2], 1);
};

/**
 * Modifies the given 4-by-4 matrix by translation by the given vector v.
 * @param {!o3djs.flat_math.Matrix4} m The matrix.
 * @param {(!o3djs.flat_math.Vector3|!o3djs.flat_math.Vector4)} v The vector by
 *     which to translate.
 * @return {!o3djs.flat_math.Matrix4} m once modified.
 */
o3djs.flat_math.matrix4.translate = function(m, v) {
  var m00 = m[0];
  var m01 = m[1];
  var m02 = m[2];
  var m03 = m[3];
  var m10 = m[4];
  var m11 = m[5];
  var m12 = m[6];
  var m13 = m[7];
  var m20 = m[8];
  var m21 = m[9];
  var m22 = m[10];
  var m23 = m[11];
  var m30 = m[12];
  var m31 = m[13];
  var m32 = m[14];
  var m33 = m[15];

  m[12] = m00 * v0 + m10 * v1 + m20 * v2 + m30;
  m[13] = m01 * v0 + m11 * v1 + m21 * v2 + m31;
  m[14] = m02 * v0 + m12 * v1 + m22 * v2 + m32;
  m[15] = m03 * v0 + m13 * v1 + m23 * v2 + m33;

  return m;
};

/**
 * Creates a 4-by-4 matrix which scales in each dimension by an amount given by
 * the corresponding entry in the given vector; assumes the vector has three
 * entries.
 * @param {!o3djs.flat_math.Vector3} v A vector of
 *     three entries specifying the factor by which to scale in each dimension.
 * @return {!o3djs.flat_math.Matrix4} The scaling matrix.
 */
o3djs.flat_math.matrix4.scaling = function(v) {
  return o3djs.flat_math.makeMatrix(
    v[0], 0, 0, 0,
    0, v[1], 0, 0,
    0, 0, v[2], 0,
    0, 0, 0, 1
  );
};

/**
 * Modifies the given 4-by-4 matrix, scaling in each dimension by an amount
 * given by the corresponding entry in the given vector; assumes the vector has
 * three entries.
 * @param {!o3djs.flat_math.Matrix4} m The matrix to be modified.
 * @param {!o3djs.flat_math.Vector3} v A vector of three entries specifying the
 *     factor by which to scale in each dimension.
 * @return {!o3djs.flat_math.Matrix4} m once modified.
 */
o3djs.flat_math.matrix4.scale = function(m, v) {
  var v0 = v[0];
  var v1 = v[1];
  var v2 = v[2];

  for (var i = 0; i < 4; ++i) {
    m[i] *= v0;
    m[4 + i] *= v1;
    m[8 + i] *= v2;
  }

  return m;
};

/**
 * Creates a 4-by-4 matrix which rotates around the x-axis by the given angle.
 * @param {number} angle The angle by which to rotate (in radians).
 * @return {!o3djs.flat_math.Matrix4} The rotation matrix.
 */
o3djs.flat_math.matrix4.rotationX = function(angle) {
  var c = Math.cos(angle);
  var s = Math.sin(angle);

  return o3djs.flat_math.makeMatrix(
    1, 0, 0, 0,
    0, c, s, 0,
    0, -s, c, 0,
    0, 0, 0, 1);
};

/**
 * Modifies the given 4-by-4 matrix by a rotation around the x-axis by the given
 * angle.
 * @param {!o3djs.flat_math.Matrix4} m The matrix.
 * @param {number} angle The angle by which to rotate (in radians).
 * @return {!o3djs.flat_math.Matrix4} m once modified.
 */
o3djs.flat_math.matrix4.rotateX = function(m, angle) {
  var m10 = m[4];
  var m11 = m[5];
  var m12 = m[6];
  var m13 = m[7];
  var m20 = m[8];
  var m21 = m[9];
  var m22 = m[10];
  var m23 = m[11];
  var c = Math.cos(angle);
  var s = Math.sin(angle);

  m[4] = c * m10 + s * m20;
  m[5] = c * m11 + s * m21;
  m[6] = c * m12 + s * m22;
  m[7] = c * m13 + s * m23;
  m[8] = c * m20 - s * m10;
  m[9] = c * m21 - s * m11;
  m[10] = c * m22 - s * m12;
  m[11] = c * m23 - s * m13;

  return m;
};

/**
 * Creates a 4-by-4 matrix which rotates around the y-axis by the given angle.
 * @param {number} angle The angle by which to rotate (in radians).
 * @return {!o3djs.flat_math.Matrix4} The rotation matrix.
 */
o3djs.flat_math.matrix4.rotationY = function(angle) {
  var c = Math.cos(angle);
  var s = Math.sin(angle);

  return o3djs.flat_math.makeMatrix(
    c, 0, -s, 0,
    0, 1, 0, 0,
    s, 0, c, 0,
    0, 0, 0, 1);
};

/**
 * Modifies the given 4-by-4 matrix by a rotation around the y-axis by the given
 * angle.
 * @param {!o3djs.flat_math.Matrix4} m The matrix.
 * @param {number} angle The angle by which to rotate (in radians).
 * @return {!o3djs.flat_math.Matrix4} m once modified.
 */
o3djs.flat_math.matrix4.rotateY = function(m, angle) {
  var m00 = m[0];
  var m01 = m[1];
  var m02 = m[2];
  var m03 = m[3];
  var m20 = m[8];
  var m21 = m[9];
  var m22 = m[10];
  var m23 = m[11];
  var c = Math.cos(angle);
  var s = Math.sin(angle);

  m[0] = c * m00 - s * m20;
  m[1] = c * m01 - s * m21;
  m[2] = c * m02 - s * m22;
  m[3] = c * m03 - s * m23;
  m[8] = c * m20 + s * m00;
  m[9] = c * m21 + s * m01;
  m[10] = c * m22 + s * m02;
  m[11] = c * m23 + s * m03;

  return m;
};

/**
 * Creates a 4-by-4 matrix which rotates around the z-axis by the given angle.
 * @param {number} angle The angle by which to rotate (in radians).
 * @return {!o3djs.flat_math.Matrix4} The rotation matrix.
 */
o3djs.flat_math.matrix4.rotationZ = function(angle) {
  var c = Math.cos(angle);
  var s = Math.sin(angle);

  return o3djs.flat_math.makeMatrix(
    c, s, 0, 0,
    -s, c, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1);
};

/**
 * Modifies the given 4-by-4 matrix by a rotation around the z-axis by the given
 * angle.
 * @param {!o3djs.flat_math.Matrix4} m The matrix.
 * @param {number} angle The angle by which to rotate (in radians).
 * @return {!o3djs.flat_math.Matrix4} m once modified.
 */
o3djs.flat_math.matrix4.rotateZ = function(m, angle) {
  var m00 = m[0];
  var m01 = m[1];
  var m02 = m[2];
  var m03 = m[3];
  var m10 = m[4];
  var m11 = m[5];
  var m12 = m[6];
  var m13 = m[7];
  var c = Math.cos(angle);
  var s = Math.sin(angle);

  m[0] = c * m00 + s * m10;
  m[1] = c * m01 + s * m11;
  m[2] = c * m02 + s * m12;
  m[3] = c * m03 + s * m13;
  m[4] = c * m10 - s * m00;
  m[5] = c * m11 - s * m01;
  m[6] = c * m12 - s * m02;
  m[7] = c * m13 - s * m03;

  return m;
};

/**
 * Creates a 4-by-4 rotation matrix.  Interprets the entries of the given
 * vector as angles by which to rotate around the x, y and z axes, returns a
 * a matrix which rotates around the x-axis first, then the y-axis, then the
 * z-axis.
 * @param {!o3djs.flat_math.Vector3} v A vector of angles (in radians).
 * @return {!o3djs.flat_math.Matrix4} The rotation matrix.
 */
o3djs.flat_math.matrix4.rotationZYX = function(v) {
  var sinx = Math.sin(v[0]);
  var cosx = Math.cos(v[0]);
  var siny = Math.sin(v[1]);
  var cosy = Math.cos(v[1]);
  var sinz = Math.sin(v[2]);
  var cosz = Math.cos(v[2]);

  var coszsiny = cosz * siny;
  var sinzsiny = sinz * siny;

  return o3djs.flat_math.makeMatrix(
    cosz * cosy, sinz * cosy, -siny, 0, coszsiny * sinx - sinz * cosx,
    sinzsiny * sinx + cosz * cosx, cosy * sinx, 0,
    coszsiny * cosx + sinz * sinx, sinzsiny * cosx - cosz * sinx, cosy * cosx,
    0, 0, 0, 0, 1);
};

/**
 * Modifies a 4-by-4 matrix by a rotation.  Interprets the coordinates of the
 * given vector as angles by which to rotate around the x, y and z axes, rotates
 * around the x-axis first, then the y-axis, then the z-axis.
 * @param {!o3djs.flat_math.Matrix4} m The matrix.
 * @param {!o3djs.flat_math.Vector3} v A vector of angles (in radians).
 * @return {!o3djs.flat_math.Matrix4} m once modified.
 */
o3djs.flat_math.matrix4.rotateZYX = function(m, v) {
  var sinX = Math.sin(v[0]);
  var cosX = Math.cos(v[0]);
  var sinY = Math.sin(v[1]);
  var cosY = Math.cos(v[1]);
  var sinZ = Math.sin(v[2]);
  var cosZ = Math.cos(v[2]);

  var cosZSinY = cosZ * sinY;
  var sinZSinY = sinZ * sinY;

  var r00 = cosZ * cosY;
  var r01 = sinZ * cosY;
  var r02 = -sinY;
  var r10 = cosZSinY * sinX - sinZ * cosX;
  var r11 = sinZSinY * sinX + cosZ * cosX;
  var r12 = cosY * sinX;
  var r20 = cosZSinY * cosX + sinZ * sinX;
  var r21 = sinZSinY * cosX - cosZ * sinX;
  var r22 = cosY * cosX;

  var m00 = m[0];
  var m01 = m[1];
  var m02 = m[2];
  var m03 = m[3];
  var m10 = m[4];
  var m11 = m[5];
  var m12 = m[6];
  var m13 = m[7];
  var m20 = m[8];
  var m21 = m[9];
  var m22 = m[10];
  var m23 = m[11];
  var m30 = m[12];
  var m31 = m[13];
  var m32 = m[14];
  var m33 = m[15];

  m[0] = r00 * m00 + r01 * m10 + r02 * m20;
  m[1] = r00 * m01 + r01 * m11 + r02 * m21;
  m[2] = r00 * m02 + r01 * m12 + r02 * m22;
  m[3] = r00 * m03 + r01 * m13 + r02 * m23;

  m[4] = r10 * m00 + r11 * m10 + r12 * m20;
  m[5] = r10 * m01 + r11 * m11 + r12 * m21;
  m[6] = r10 * m02 + r11 * m12 + r12 * m22;
  m[7] = r10 * m03 + r11 * m13 + r12 * m23;

  m[8] = r20 * m00 + r21 * m10 + r22 * m20;
  m[9] = r20 * m01 + r21 * m11 + r22 * m21;
  m[10] = r20 * m02 + r21 * m12 + r22 * m22;
  m[11] = r20 * m03 + r21 * m13 + r22 * m23;

  return m;
};

/**
 * Creates a 4-by-4 matrix which rotates around the given axis by the given
 * angle.
 * @param {(!o3djs.flat_math.Vector3|!o3djs.flat_math.Vector4)} axis The axis
 *     about which to rotate.
 * @param {number} angle The angle by which to rotate (in radians).
 * @return {!o3djs.flat_math.Matrix4} A matrix which rotates angle radians
 *     around the axis.
 */
o3djs.flat_math.matrix4.axisRotation = function(axis, angle) {
  var x = axis[0];
  var y = axis[1];
  var z = axis[2];
  var n = Math.sqrt(x * x + y * y + z * z);
  x /= n;
  y /= n;
  z /= n;
  var xx = x * x;
  var yy = y * y;
  var zz = z * z;
  var c = Math.cos(angle);
  var s = Math.sin(angle);
  var oneMinusCosine = 1 - c;

  return o3djs.flat_math.makeMatrix(
    xx + (1 - xx) * c,
     x * y * oneMinusCosine + z * s,
     x * z * oneMinusCosine - y * s,
     0,
    x * y * oneMinusCosine - z * s,
     yy + (1 - yy) * c,
     y * z * oneMinusCosine + x * s,
     0,
    x * z * oneMinusCosine + y * s,
     y * z * oneMinusCosine - x * s,
     zz + (1 - zz) * c,
     0,
    0, 0, 0, 1
  );
};

/**
 * Modifies the given 4-by-4 matrix by rotation around the given axis by the
 * given angle.
 * @param {!o3djs.flat_math.Matrix4} m The matrix.
 * @param {(!o3djs.flat_math.Vector3|!o3djs.flat_math.Vector4)} axis The axis
 *     about which to rotate.
 * @param {number} angle The angle by which to rotate (in radians).
 * @return {!o3djs.flat_math.Matrix4} m once modified.
 */
o3djs.flat_math.matrix4.axisRotate = function(m, axis, angle) {
  var x = axis[0];
  var y = axis[1];
  var z = axis[2];
  var n = Math.sqrt(x * x + y * y + z * z);
  x /= n;
  y /= n;
  z /= n;
  var xx = x * x;
  var yy = y * y;
  var zz = z * z;
  var c = Math.cos(angle);
  var s = Math.sin(angle);
  var oneMinusCosine = 1 - c;

  var r00 = xx + (1 - xx) * c;
  var r01 = x * y * oneMinusCosine + z * s;
  var r02 = x * z * oneMinusCosine - y * s;
  var r10 = x * y * oneMinusCosine - z * s;
  var r11 = yy + (1 - yy) * c;
  var r12 = y * z * oneMinusCosine + x * s;
  var r20 = x * z * oneMinusCosine + y * s;
  var r21 = y * z * oneMinusCosine - x * s;
  var r22 = zz + (1 - zz) * c;

  var m00 = m[0];
  var m01 = m[1];
  var m02 = m[2];
  var m03 = m[3];
  var m10 = m[4];
  var m11 = m[5];
  var m12 = m[6];
  var m13 = m[7];
  var m20 = m[8];
  var m21 = m[9];
  var m22 = m[10];
  var m23 = m[11];
  var m30 = m[12];
  var m31 = m[13];
  var m32 = m[14];
  var m33 = m[15];

  m[0] = r00 * m00 + r01 * m10 + r02 * m20;
  m[1] = r00 * m01 + r01 * m11 + r02 * m21;
  m[2] = r00 * m02 + r01 * m12 + r02 * m22;
  m[3] = r00 * m03 + r01 * m13 + r02 * m23;

  m[4] = r10 * m00 + r11 * m10 + r12 * m20;
  m[5] = r10 * m01 + r11 * m11 + r12 * m21;
  m[6] = r10 * m02 + r11 * m12 + r12 * m22;
  m[7] = r10 * m03 + r11 * m13 + r12 * m23;

  m[8] = r20 * m00 + r21 * m10 + r22 * m20;
  m[9] = r20 * m01 + r21 * m11 + r22 * m21;
  m[10] = r20 * m02 + r21 * m12 + r22 * m22;
  m[11] = r20 * m03 + r21 * m13 + r22 * m23;

  return m;
};

/**
 * Sets each function in the namespace o3djs.flat_math to the row major
 * version in o3djs.flat_math.rowMajor (provided such a function exists in
 * o3djs.flat_math.rowMajor).  Call this function to establish the row major
 * convention.
 */
o3djs.flat_math.installRowMajorFunctions = function() {
  for (var f in o3djs.flat_math.rowMajor) {
    o3djs.flat_math[f] = o3djs.flat_math.rowMajor[f];
  }
};

/**
 * Sets each function in the namespace o3djs.flat_math to the column major
 * version in o3djs.flat_math.columnMajor (provided such a function exists in
 * o3djs.flat_math.columnMajor).  Call this function to establish the column
 * major convention.
 */
o3djs.flat_math.installColumnMajorFunctions = function() {
  for (var f in o3djs.flat_math.columnMajor) {
    o3djs.flat_math[f] = o3djs.flat_math.columnMajor[f];
  }
};

/**
 * Sets each function in the namespace o3djs.flat_math to the error checking
 * version in o3djs.flat_math.errorCheck (provided such a function exists in
 * o3djs.flat_math.errorCheck).
 */
o3djs.flat_math.installErrorCheckFunctions = function() {
  for (var f in o3djs.flat_math.errorCheck) {
    o3djs.flat_math[f] = o3djs.flat_math.errorCheck[f];
  }
};

/**
 * Sets each function in the namespace o3djs.flat_math to the error checking free
 * version in o3djs.flat_math.errorCheckFree (provided such a function exists in
 * o3djs.flat_math.errorCheckFree).
 */
o3djs.flat_math.installErrorCheckFreeFunctions = function() {
  for (var f in o3djs.flat_math.errorCheckFree) {
    o3djs.flat_math[f] = o3djs.flat_math.errorCheckFree[f];
  }
};

// By default, install the row-major functions.
o3djs.flat_math.installRowMajorFunctions();

// By default, install prechecking.
o3djs.flat_math.installErrorCheckFunctions();

if (!use_plugin_math) {
  for (var i in o3djs.flat_math) {
    o3djs.math[i] = o3djs.flat_math[i];
  }

  /**
   * True if we are using the plugin math library in which matrices are
   * represented by 2-dimensional arrays.
   * @type {boolean}
   * @private
   */
  o3djs.math.usePluginMath_ = false;
}


