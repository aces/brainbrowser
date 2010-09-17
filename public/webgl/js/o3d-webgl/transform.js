/*
 * Copyright 2010, Google Inc.
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
 * The Transform defines parent child relationship and a localMatrix..
 * A Transform can have one or no parents and
 * an arbitrary number of children.
 *
 * @param {o3d.math.Matrix4} opt_localMatrix The local matrix for this
 *     transform.
 * @param {o3d.math.Matrix4} opt_worldMatrix ParamMatrix4 The world matrix of
 *     this transform.
 * @param {boolean} opt_visible Whether or not this transform and all its
 *     children are visible.
 * @param {o3d.BoundingBox} opt_boundingBox ParamBoundingBox The bounding box
 *     for this transform and all its children.
 * @param {boolean} opt_cull ParamBoolean Whether or not to attempt to
 *    cull this transform and all its children based on whether or not its
 *    bounding box is in the view frustum.
 * @constructor
 */
o3d.Transform =
    function(opt_localMatrix, opt_worldMatrix, opt_visible, opt_boundingBox,
             opt_cull) {
  o3d.ParamObject.call(this);

  /**
   * Local transformation matrix.
   * Default = Identity.
   */
  this.localMatrix = opt_localMatrix ||
      o3d.Transform.makeIdentityMatrix4_();

  /**
   * World (model) matrix as it was last computed.
   */
  this.worldMatrix = opt_worldMatrix ||
      o3d.Transform.makeIdentityMatrix4_();

  /**
   * Sets the parent of the transform by re-parenting the transform under
   * parent. Setting parent to null removes the transform and the
   * entire subtree below it from the transform graph.
   * If the operation would create a cycle it fails.
   */
  this.parent = null;

  /**
   * The Visibility for this transform.
   * Default = true.
   */
  this.visible = opt_visible || true;

  /**
   * The BoundingBox for this Transform. If culling is on this
   * bounding box will be tested against the view frustum of any draw
   * context used to with this Transform.
   * @type {!o3d.BoundingBox}
   */
  this.boundingBox = opt_boundingBox ||
      new o3d.BoundingBox([-1, -1, -1], [1, 1, 1]);

  /**
   * The cull setting for this transform. If true this Transform will
   * be culled by having its bounding box compared to the view frustum
   * of any draw context it is used with.
   * Default = false.
   */
  this.cull = opt_cull || false;

  /**
   * The immediate children of this Transform.
   *
   * Each access to this field gets the entire list, so it is best to get it
   * just once. For example:
   *
   * var children = transform.children;
   * for (var i = 0; i < children.length; i++) {
   *   var child = children[i];
   * }
   *
   * Note that modifications to this array [e.g. additions to it] will
   * not affect the underlying Transform, while modifications to the
   * members of the array will affect them.
   */
  this.children = [];

  /**
   * Gets the shapes owned by this transform.
   *
   * Each access to this field gets the entire list so it is best to get it
   * just once. For example:
   *
   * var shapes = transform.shapes;
   * for (var i = 0; i < shapes.length; i++) {
   *   var shape = shapes[i];
   * }
   *
   *
   * Note that modifications to this array [e.g. additions to it] will
   * not affect the underlying Transform, while modifications to the
   * members of the array will affect them.
   */
  this.shapes = [];
};
o3d.inherit('Transform', 'ParamObject');

o3d.ParamObject.setUpO3DParam_(o3d.Transform, 'visible', 'ParamBoolean');
// TODO(petersont): need to better understand and possibly implement
// the semantics of SlaveParamMatrix4.
o3d.ParamObject.setUpO3DParam_(o3d.Transform, 'worldMatrix', 'ParamMatrix4');
o3d.ParamObject.setUpO3DParam_(o3d.Transform, 'localMatrix', 'ParamMatrix4');
o3d.ParamObject.setUpO3DParam_(o3d.Transform, 'cull', 'ParamBoolean');
o3d.ParamObject.setUpO3DParam_(o3d.Transform,
                               'boundingBox', 'ParamBoundingBox');


o3d.Transform.prototype.__defineSetter__('parent',
    function(p) {
      if (this.parent_ != null) {
        o3d.removeFromArray(this.parent_.children, this);
      }
      this.parent_ = p;
      if (p) {
        p.addChild(this);
      }
    }
);

o3d.Transform.prototype.__defineGetter__('parent',
    function(p) {
      return this.parent_;
    }
);

/**
 * Adds a child transform.
 * @param {o3d.Transform} The new child.
 */
o3d.Transform.prototype.addChild = function(child) {
  this.children.push(child);
};


/**
 * Returns all the transforms under this transform including this one.
 *
 * Note that modifications to this array [e.g. additions to it] will not affect
 * the underlying Transform, while modifications to the members of the array
 * will affect them.
 *
 *  An array containing the transforms of the subtree.
 */
o3d.Transform.prototype.getTransformsInTree =
    function() {
  var result = [];
  o3d.Transform.getTransformInTreeRecursive_(this, result);
  return result;
};


/**
 * Recursive helper function for getTransformInTree.
 * @private
 */
o3d.Transform.getTransformInTreeRecursive_ =
    function(treeRoot, children) {
  children.push(treeRoot);
  var childrenArray = treeRoot.children;
  for (var ii = 0; ii < childrenArray.length; ++ii) {
    o3d.Transform.getTransformInTreeRecursive_(childrenArray[ii], children);
  }
};


/**
 * Searches for transforms that match the given name in the hierarchy under and
 * including this transform. Since there can be more than one transform with a
 * given name, results are returned in an array.
 *
 * Note that modifications to this array [e.g. additions to it] will not affect
 * the underlying Transform, while modifications to the members of the array
 * will affect them.
 *
 * @param {string} name Transform name to look for.
 * @return {Array.<o3d.Transform>}  An array containing the transforms of the
 *     under and including this transform matching the given name.
 */
o3d.Transform.prototype.getTransformsByNameInTree =
    function(name) {
  o3d.notImplemented();
};

/**
 * Evaluates and returns the current world matrix.
 *
 *  The updated world matrix.
 */
o3d.Transform.prototype.getUpdatedWorldMatrix =
    function() {
  var parentWorldMatrix;
  if (!this.parent) {
    parentWorldMatrix =
        o3d.Transform.makeIdentityMatrix4_();
  } else {
    parentWorldMatrix = this.parent.getUpdatedWorldMatrix();
  }
  o3d.Transform.compose_(parentWorldMatrix, this.localMatrix, this.worldMatrix);
  return this.worldMatrix;
};


/**
 * Adds a shape do this transform.
 * @param {o3d.Shape} shape Shape to add.
 */
o3d.Transform.prototype.addShape =
    function(shape) {
  this.shapes.push(shape);
};


/**
 * Removes a shape from this transform.
 * @param {o3d.Shape} shape Shape to remove.
 * @return {boolean}  true if successful, false if shape was not in
 *     this transform.
 */
o3d.Transform.prototype.removeShape =
    function(shape) {
  o3d.removeFromArray(this.shapes, shape);
};


/**
 * Walks the tree of transforms starting with this transform and creates
 * draw elements. If an Element already has a DrawElement that uses material a
 * new DrawElement will not be created.
 * @param {o3d.Pack} pack Pack used to manage created elements.
 * @param {o3d.Material} material Material to use for each element. If you
 *     pass null, it will use the material on the element to which a draw
 *     element is being added. In other words, a DrawElement will use the
 *     material of the corresponding Element if material is null. This allows
 *     you to easily setup the default (just draw as is) by passing null or
 *     setup a shadow pass by passing in a shadow material.
 */
o3d.Transform.prototype.createDrawElements =
    function(pack, material) {
  var children = this.children;
  var shapes = this.shapes;

  for (var i = 0; i < shapes.length; ++i) {
    shapes[i].createDrawElements(pack, material);
  }

  for (var i = 0; i < children.length; ++i) {
    children[i].createDrawElements(pack, material);
  }
};


/**
 * Sets the local matrix of this transform to the identity matrix.
 */
o3d.Transform.prototype.identity = function() {
  var m = this.localMatrix;
  for (var i = 0; i < 4; ++i) {
    for (var j = 0; j < 4; ++j) {
      m[i * 4 + j] = i == j ? 1 : 0;
    }
  }
};


/**
 * Pre-composes the local matrix of this Transform with a translation.  For
 * example, if the local matrix is a rotation then new local matrix will
 * translate by the given vector and then rotated.
 */
o3d.Transform.prototype.translate =
    function() {
  var v;
  if (arguments.length == 3) {
    v = arguments;
  } else {
    v = arguments[0];
  }
  var m = this.localMatrix;

  var v0 = v[0];
  var v1 = v[1];
  var v2 = v[2];

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

  m[12] = m00 * v0 + m10 * v1 + m20 * v2 + m30,
  m[13] = m01 * v0 + m11 * v1 + m21 * v2 + m31,
  m[14] = m02 * v0 + m12 * v1 + m22 * v2 + m32,
  m[15] = m03 * v0 + m13 * v1 + m23 * v2 + m33;
};


/**
 * Pre-composes the local matrix of this Transform with a rotation about the
 * x-axis.  For example, if the local matrix is a tranlsation, the new local
 * matrix will rotate around the x-axis and then translate.
 *
 * @param {number} radians The number of radians to rotate around x-axis.
 */
o3d.Transform.prototype.rotateX =
    function(angle) {
  var m = this.localMatrix;

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
};


/**
 * Pre-composes the local matrix of this Transform with a rotation about the
 * y-axis.  For example, if the local matrix is a translation, the new local
 * matrix will rotate around the y-axis and then translate.
 *
 * @param {number} radians The number of radians to rotate around y-axis.
 */
o3d.Transform.prototype.rotateY =
    function(angle) {
  var m = this.localMatrix;

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
};


/**
 * Pre-composes the local matrix of this Transform with a rotation about the
 * z-axis.  For example, if the local matrix is a translation, the new local
 * matrix will rotate around the z-axis and then translate.
 *
 * @param {number} radians The number of radians to rotate around z-axis.
 */
o3d.Transform.prototype.rotateZ =
    function(angle) {
  var m = this.localMatrix;

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
};


/**
 * Pre-composes the local matrix of this Transform with a rotation.
 * Interprets the three entries of the given vector as angles by which to
 * rotate around the x, y and z axes.  Rotates around the x-axis first,
 * then the y-axis, then the z-axis.
 *
 * @param {!o3d.math.Vector3} v A vector of angles (in radians) by which
 *     to rotate around the x, y and z axes.
 */
o3d.Transform.prototype.rotateZYX =
    function(v) {
  var m = this.localMatrix;

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
  m[3] =  r00 * m03 + r01 * m13 + r02 * m23;

  m[4] = r10 * m00 + r11 * m10 + r12 * m20;
  m[5] =  r10 * m01 + r11 * m11 + r12 * m21;
  m[6] = r10 * m02 + r11 * m12 + r12 * m22;
  m[7] = r10 * m03 + r11 * m13 + r12 * m23;

  m[8] = r20 * m00 + r21 * m10 + r22 * m20;
  m[9] = r20 * m01 + r21 * m11 + r22 * m21;
  m[10] = r20 * m02 + r21 * m12 + r22 * m22;
  m[11] = r20 * m03 + r21 * m13 + r22 * m23;
};


/**
 * Pre-composes the local matrix of this Transform with a rotation around the
 * given axis.  For example, if the local matrix is a translation, the new
 * local matrix will rotate around the given axis and then translate.
 *
 * @param {number} angle The number of radians to rotate.
 * @param {!o3d.math.Vector3} axis a non-zero vector representing the axis
 *     around which to rotate.
 */
o3d.Transform.prototype.axisRotate =
    function(axis, angle) {
  o3d.Transform.axisRotateMatrix(this.localMatrix, axis, angle);
};

o3d.Transform.axisRotateMatrix =
    function(m, axis, angle, opt_target) {
  opt_target = opt_target || m;
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
  m[3] =  r00 * m03 + r01 * m13 + r02 * m23;
  m[4] = r10 * m00 + r11 * m10 + r12 * m20;
  m[5] =  r10 * m01 + r11 * m11 + r12 * m21;
  m[6] = r10 * m02 + r11 * m12 + r12 * m22;
  m[7] = r10 * m03 + r11 * m13 + r12 * m23;

  m[8] = r20 * m00 + r21 * m10 + r22 * m20;
  m[9] = r20 * m01 + r21 * m11 + r22 * m21;
  m[10] = r20 * m02 + r21 * m12 + r22 * m22;
  m[11] = r20 * m03 + r21 * m13 + r22 * m23;
};


/**
 * Pre-composes the local matrix of this Transform with a rotation defined by
 * the given quaternion.
 *
 * @param {o3d.math.Quat} q A non-zero quaternion to be interpreted as a
 *     rotation.
 */
o3d.Transform.prototype.quaternionRotate =
    function(q) {
   var m = this.localMatrix;

  var qX = q[0];
  var qY = q[1];
  var qZ = q[2];
  var qW = q[3];

  var qWqW = qW * qW;
  var qWqX = qW * qX;
  var qWqY = qW * qY;
  var qWqZ = qW * qZ;
  var qXqW = qX * qW;
  var qXqX = qX * qX;
  var qXqY = qX * qY;
  var qXqZ = qX * qZ;
  var qYqW = qY * qW;
  var qYqX = qY * qX;
  var qYqY = qY * qY;
  var qYqZ = qY * qZ;
  var qZqW = qZ * qW;
  var qZqX = qZ * qX;
  var qZqY = qZ * qY;
  var qZqZ = qZ * qZ;

  var d = qWqW + qXqX + qYqY + qZqZ;

  o3d.Transform.compose_(this.localMatrix, o3d.Transform.makeMatrix4_(
    (qWqW + qXqX - qYqY - qZqZ) / d,
     2 * (qWqZ + qXqY) / d,
     2 * (qXqZ - qWqY) / d, 0,
    2 * (qXqY - qWqZ) / d,
     (qWqW - qXqX + qYqY - qZqZ) / d,
     2 * (qWqX + qYqZ) / d, 0,
    2 * (qWqY + qXqZ) / d,
     2 * (qYqZ - qWqX) / d,
     (qWqW - qXqX - qYqY + qZqZ) / d, 0,
    0, 0, 0, 1));
};


/**
 * Pre-composes the local matrix of this transform by a scaling transformation.
 * For example, if the local matrix is a rotation, the new local matrix will
 * scale and then rotate.
 */
o3d.Transform.prototype.scale =
    function() {
     var v;
  if (arguments.length == 3) {
    v = arguments;
  } else {
    v = arguments[0];
  }

  var m = this.localMatrix;

  var v0 = v[0];
  var v1 = v[1];
  var v2 = v[2];

  m[0] = v0 * m[0];
  m[1] = v0 * m[1];
  m[2] = v0 * m[2];
  m[3] = v0 * m[3];
  m[4] = v1 * m[4];
  m[5] = v1 * m[5];
  m[6] = v1 * m[6];
  m[7] = v1 * m[7];
  m[8] = v2 * m[8];
  m[9] = v2 * m[9];
  m[10] = v2 * m[10];
  m[11] = v2 * m[11];
};


/**
 * Traverses the transform tree starting at this node and adds DrawElements
 * for each shape to DrawList.
 * @param {Array.<Object>} drawListInfos A list of objects containing a draw
 *     list and matrix information.
 * @param {o3d.math.Matrix4} opt_parentWorldMatrix
 */
o3d.Transform.prototype.traverse =
    function(drawListInfos, opt_parentWorldMatrix) {
  this.gl.client.render_stats_['transformsProcessed']++;
  if (drawListInfos.length == 0 || !this.visible) {
    return;
  }
  opt_parentWorldMatrix =
      opt_parentWorldMatrix || o3d.Transform.makeIdentityMatrix4_();

  o3d.Transform.compose_(
      opt_parentWorldMatrix, this.localMatrix, this.worldMatrix);

  var remainingDrawListInfos = [];

  if (this.cull) {
    if (this.boundingBox) {
      for (var i = 0; i < drawListInfos.length; ++i) {
        var drawListInfo = drawListInfos[i];

        var worldViewProjection = o3d.Transform.makeNullMatrix4_();
        o3d.Transform.compose_(drawListInfo.context.view,
            this.worldMatrix, worldViewProjection);
        o3d.Transform.compose_(drawListInfo.context.projection,
            worldViewProjection, worldViewProjection);

        if (this.boundingBox.inFrustum(worldViewProjection)) {
          remainingDrawListInfos.push(drawListInfo);
        }
      }
    }
  } else {
    remainingDrawListInfos = drawListInfos;
  }

  if (remainingDrawListInfos.length == 0) {
    this.gl.client.render_stats_['transformsCulled']++;
    return;
  }

  var children = this.children;
  var shapes = this.shapes;

  for (var i = 0; i < shapes.length; ++i) {
    shapes[i].writeToDrawLists(remainingDrawListInfos, this.worldMatrix, this);
  }

  for (var i = 0; i < children.length; ++i) {
    children[i].traverse(remainingDrawListInfos, this.worldMatrix);
  }
};


/**
 * Tells the o3d-webgl subsection if it should use native javascript
 * arrays or if it should switch to the newer Float32Array, which help the
 * interpreter, once created, but can require a lot of gc work to allocate
 * and deallocate.
 * @type {boolean}
 */
o3d.Transform.useFloat32Array_  = false;


/**
 * This defines the type of any given Matrix4
 * @type {!Array.<number>|!Float32Array}
 */
o3d.Transform.Matrix4 = goog.typedef;


/**
 * This returns an identity 4x4 matrix with
 * the diagonal as 1's and everything else 0
 * @return {!o3d.Transform.Matrix4}
 * @private
 */
o3d.Transform.makeIdentityMatrix4_ = null;


/**
 * This returns a 4x4 matrix with all values set to zero
 * @return {!o3d.Transform.Matrix4} the vector made up of the elements
 * @private
 */
o3d.Transform.makeNullMatrix4_ = null;


/**
 * This returns a length 2 vector with values set to the passed in arguments
 * @param {number} a the x element in the vector
 * @param {number} b the y element in the vector
 * @return {!Float32Array} the vector made up of the elements
 * @private
 */
o3d.Transform.makeVector2_ = null;


/**
 * This returns a length 3 vector with values set to the passed in arguments
 * @param {number} a the x element in the vector
 * @param {number} b the y element in the vector
 * @param {number} c the z element in the vector
 * @return {!Float32Array} the vector made up of the elements
 * @private
 */
o3d.Transform.makeVector3_ = null;


/**
 * This returns a length 4 vector with values set to the passed in arguments
 * @param {number} a the x element in the vector
 * @param {number} b the y element in the vector
 * @param {number} c the z element in the vector
 * @param {number} d the w element in the vector
 * @return {!Float32Array} the vector made up of the elements
 * @private
 */
o3d.Transform.makeVector4_ = null;


/**
 * This returns a 4x4 matrix in row major order
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
 * @return {!o3d.Transform.Matrix4}
 */
o3d.Transform.makeMatrix4_ = null;


// If Float32Array isn't defined we might as well not bother including the
// Float32Array functions.
if (window.Float32Array != undefined) {
  /**
   * A namespace to hold Float32Array-specialized functions.
   * @namespace
   * @private
   */
  o3d.Transform.Float32Array_ = {};


  /**
   * This defines the type of any given Matrix4 in the Float32Array namespace
   * @type {function}
   * @private
   */
  o3d.Transform.Float32Array_.Matrix4 = Float32Array;


  /**
   * This returns an identity 4x4 matrix with
   * the diagonal as 1's and everything else 0
   * @return {!o3d.Transform.Matrix4}
   * @private
   */
  o3d.Transform.Float32Array_.makeIdentityMatrix4_ = function() {
      var r = new Float32Array(16);
      r[0] = 1;
      r[5] = 1;
      r[10] = 1;
      r[15] = 1;
      return r;
  };


  /**
   * This returns a 4x4 matrix with all values set to zero
   * @return {!o3d.Transform.Matrix4} the vector made up of the elements
   * @private
   */
  o3d.Transform.Float32Array_.makeNullMatrix4_ = function() {
    return new Float32Array(16);
  };


  /**
   * This returns a length 2 vector with values set to the passed in arguments
   * @param {number} a the x element in the vector
   * @param {number} b the y element in the vector
   * @return {!Float32Array} the vector made up of the elements
   * @private
   */
  o3d.Transform.Float32Array_.makeVector2_ = function(a, b) {
    var f=new Float32Array(2);
    f[0] = a;
    f[1] = b;
    return f;
  };


  /**
   * This returns a length 3 vector with values set to the passed in arguments
   * @param {number} a the x element in the vector
   * @param {number} b the y element in the vector
   * @param {number} c the z element in the vector
   * @return {!Float32Array} the vector made up of the elements
   * @private
   */
  o3d.Transform.Float32Array_.makeVector3_ = function(a, b, c) {
    var f=new Float32Array(3);
      f[0] = a;
      f[1] = b;
      f[2] = c;
      return f;
  };


  /**
   * This returns a length 4 vector with values set to the passed in arguments
   * @param {number} a the x element in the vector
   * @param {number} b the y element in the vector
   * @param {number} c the z element in the vector
   * @param {number} d the w element in the vector
   * @return {!Float32Array} the vector made up of the elements
   * @private
   */
  o3d.Transform.Float32Array_.makeVector4_ = function(a, b, c, d) {
      var f = new Float32Array(4);
      f[0] = a;
      f[1] = b;
      f[2] = c;
      f[3] = d;
      return f;
  };


  /**
   * This returns a 4x4 matrix in row major order
   * with values set to the passed in arguments
   * @param {number} a [0][0] element
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
   * @return {!o3d.Transform.Matrix4}
   */
  o3d.Transform.Float32Array_.makeMatrix4_ =
      function(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    var m = new Float32Array(16);
    m[0] = a;
    m[1] = b;
    m[2] = c;
    m[3] = d;
    m[4] = e;
    m[5] = f;
    m[6] = g;
    m[7] = h;
    m[8] = i;
    m[9] = j;
    m[10] = k;
    m[11] = l;
    m[12] = m;
    m[13] = n;
    m[14] = o;
    m[15] = p;
    return m;
  };
} else {
  // If Float32Array doesn't exist, we cannot use that library.
  o3d.Transform.useFloat32Array_ = false;
}


/**
 * A namespace for Array specialized Transform functions that depend
 * on what the matrix type of choice is
 * @namespace
 * @private
 */
o3d.Transform.Array_ = {};

/**
 * This returns a length 3 vector with values set to the passed in arguments
 * @param {number} a the x element in the vector
 * @param {number} b the y element in the vector
 * @return {!Array} the vector made up of the elements
 * @private
 */
o3d.Transform.Array_.makeVector2_ = function(a, b) {
  return [a,b];
};

/**
 * This returns a length 3 vector with values set to the passed in arguments
 * @param {number} a the x element in the vector
 * @param {number} b the y element in the vector
 * @param {number} c the z element in the vector
 * @return {!Array} the vector made up of the elements
 * @private
 */
o3d.Transform.Array_.makeVector3_ = function(a, b, c) {
  return [a, b, c];
};

/**
 * This returns a length 4 vector with values set to the passed in arguments
 * @param {number} a the x element in the vector
 * @param {number} b the y element in the vector
 * @param {number} c the z element in the vector
 * @param {number} d the w element in the vector
 * @return {!Array} the vector made up of the elements
 * @private
 */
o3d.Transform.Array_.makeVector4_ = function(a, b, c, d) {
  return [a, b, c, d];
};

/**
 * This returns a 4x4 matrix in row major order
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
 * @return {!o3d.Transform.Matrix4}
 * @private
 */
o3d.Transform.Array_.makeMatrix4_ =
    function(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
 return [a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p];
};

o3d.Transform.Array_.Matrix4_ = Array;

/**
 * This returns an identity 4x4 matrix with
 * the diagonal as 1's and everything else 0
 * @return {!o3d.Transform.Matrix4}
 */
o3d.Transform.Array_.makeIdentityMatrix4_ = function() {
  return [1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 1];
};


/**
 * This returns an identity 4x4 matrix with all values as 0
 * @return {!o3d.Transform.Matrix4}
 */
o3d.Transform.Array_.makeNullMatrix4_ = function() {
  return [0, 0, 0, 0,
          0, 0, 0, 0,
          0, 0, 0, 0,
          0, 0, 0, 0];
};


if (o3d.Transform.useFloat32Array_) {
  for (var i in o3d.Transform.Float32Array_) {
    o3d.Transform[i] = o3d.Transform.Float32Array_[i];
  }
} else {
  for (var i in o3d.Transform.Array_) {
    o3d.Transform[i] = o3d.Transform.Array_[i];
  }
}


/*
 * Utility function to copose a matrix with another matrix.
 * Precomposes b with a, changing a, or if the target matrix if
 * one is provided.
 *
 * @param {!Array.<!Array.<number>>} a
 * @param {!Array.<!Array.<number>>} b
 * @param {!Array.<!Array.<number>>} opt_target
 * @private
 */
o3d.Transform.compose_ = function(a, b, opt_target) {
  var t = opt_target || a;

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
  t[0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
  t[1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
  t[2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
  t[3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;
  t[4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
  t[5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
  t[6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
  t[7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;
  t[8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
  t[9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
  t[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
  t[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;
  t[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
  t[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
  t[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
  t[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;
};


/**
 * Tests whether two matrices are either equal in the sense that they
 * refer to the same memory, or equal in the sense that they have equal
 * entries.
 *
 * @param {!Array.<!Array.<number>>} a A matrix.
 * @param {!Array.<!Array.<number>>} b Another matrix.
 * @return {boolean} Whether they are equal.
 * @private
 */
o3d.Transform.matricesEqual_ = function(a, b) {
  if (a==b) {
    return true;
  }
  for (var i = 0; i < 16; ++i) {
      if (a[i] != b[i]) {
        return false;
      }
  }

  return true;
};


/**
 * Computes the transpose of the matrix a in place if no target is provided.
 * Or if a target is provided, turns the target into the transpose of a.
 *
 * @param {!Array.<!Array.<number>>} m A matrix.
 * @param {Array.<!Array.<number>>} opt_target
 *     The matrix to become the transpose of m.
 * @private
 */
o3d.Transform.transpose_ = function(m, opt_target) {
  var t = opt_target || m;

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
  t[0] = m00;
  t[1] = m10;
  t[2] = m20;
  t[3] = m30;

  t[4] = m01;
  t[5] = m11;
  t[6] = m21;
  t[7] = m31;

  t[8] = m02;
  t[9] = m12;
  t[10] = m22;
  t[11] = m32;

  t[12] = m03;
  t[13] = m13;
  t[14] = m23;
  t[15] = m33;
};


/**
 * Computes the inverse of the matrix a in place if no target is provided.
 * Or if a target is provided, turns the target into the transpose of a.
 *
 * @param {!Array.<!Array.<number>>} m A matrix.
 * @param {Array.<!Array.<number>>} opt_target The matrix to become the
 *     inverse of a.
 */
o3d.Transform.inverse_ = function(m, opt_target) {
  var t = opt_target || m;

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

  var tmp_0 = m22 * m33;
  var tmp_1 = m32 * m23;
  var tmp_2 = m12 * m33;
  var tmp_3 = m32 * m13;
  var tmp_4 = m12 * m23;
  var tmp_5 = m22 * m13;
  var tmp_6 = m02 * m33;
  var tmp_7 = m32 * m03;
  var tmp_8 = m02 * m23;
  var tmp_9 = m22 * m03;
  var tmp_10 = m02 * m13;
  var tmp_11 = m12 * m03;
  var tmp_12 = m20 * m31;
  var tmp_13 = m30 * m21;
  var tmp_14 = m10 * m31;
  var tmp_15 = m30 * m11;
  var tmp_16 = m10 * m21;
  var tmp_17 = m20 * m11;
  var tmp_18 = m00 * m31;
  var tmp_19 = m30 * m01;
  var tmp_20 = m00 * m21;
  var tmp_21 = m20 * m01;
  var tmp_22 = m00 * m11;
  var tmp_23 = m10 * m01;

  var t0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) -
      (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
  var t1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) -
      (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
  var t2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) -
      (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
  var t3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) -
      (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

  var d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

  t[0] = d * t0;
  t[1] = d * t1;
  t[2] = d * t2;
  t[3] = d * t3;
  t[4] = d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) -
          (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30));
  t[5] = d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) -
          (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30));
  t[6] = d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) -
          (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30));
  t[7] = d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) -
          (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20));
  t[8] = d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) -
          (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33));
  t[9] = d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) -
          (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33));
  t[10] = d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) -
          (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33));
  t[11] = d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) -
          (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23));
  t[12] = d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) -
          (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22));
  t[13] = d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) -
          (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02));
  t[14] = d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) -
          (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12));
  t[15] = d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) -
          (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02));
};


/**
 * Takes a 4-by-4 matrix and a vector with 3 entries,
 * interprets the vector as a point, transforms that point by the matrix, and
 * returns the result as a vector with 3 entries.
 * @param {!o3djs.math.Matrix4} m The matrix.
 * @param {!o3djs.math.Vector3} v The point.
 * @return {!o3djs.math.Vector3} The transformed point.
 * @private
 */
o3d.Transform.transformPoint_ = function(m, v) {
  var v0 = v[0];
  var v1 = v[1];
  var v2 = v[2];

  var d = v0 * m[3] + v1 * m[7] + v2 * m[11] + m[15];
  return o3d.Transform.makeVector3_(
      (v0 * m[0] + v1 * m[4] + v2 * m[8] + m[12]) / d,
      (v0 * m[1] + v1 * m[5] + v2 * m[9] + m[13]) / d,
      (v0 * m[2] + v1 * m[6] + v2 * m[10] + m[14]) / d);
};


/**
 * Takes a 4-by-4 matrix and a vector with 4 entries,
 * interprets the vector as a point, transforms that point by the matrix, and
 * returns the result as a vector with 4 entries.
 * @param {!o3djs.math.Matrix4} m The matrix.
 * @param {!o3djs.math.Vector4} v The vector.
 * @return {!o3djs.math.Vector4} The transformed vector.
 * @private
 */
o3d.Transform.multiplyVector_ = function(m, v) {
  var v0 = v[0];
  var v1 = v[1];
  var v2 = v[2];
  var v3 = v[3];

  return o3d.Transform.makeVector4_(
      (v0 * m[0] + v1 * m[4] + v2 * m[8] + v3 * m[12]),
      (v0 * m[1] + v1 * m[5] + v2 * m[9] + v3 * m[13]),
      (v0 * m[2] + v1 * m[6] + v2 * m[10] + v3 * m[14]),
      (v0 * m[3] + v1 * m[7] + v2 * m[11] + v3 * m[15]));
};


/**
 * Takes a 4-by-4 matrix and a vector with 3 entries,
 * interprets the vector as a point, transforms that point by the matrix,
 * returning the z-component of the result only.
 * @param {!o3djs.math.Matrix4} m The matrix.
 * @param {!o3djs.math.Vector3} v The point.
 * @return {number} The z coordinate of the transformed point.
 * @private
 */
o3d.Transform.transformPointZOnly_ = function(m, v) {
  var v0 = v[0];
  var v1 = v[1];
  var v2 = v[2];

  return (v0 * m[2] + v1 * m[6] + v2 * m[10] + m[14]) /
      (v0 * m[3] + v1 * m[7] + v2 * m[11] + m[15]);
};
