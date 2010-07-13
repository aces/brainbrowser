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
 * @fileoverview This file contains various functions and classes for rendering
 * gpu based particles.
 *
 * TODO: Add 3d oriented particles.
 */

o3djs.provide('o3djs.particles');

o3djs.require('o3djs.math');

/**
 * A Module with various GPU particle functions and classes.
 * Note: GPU particles have the issue that they are not sorted per particle
 * but rather per emitter.
 * @namespace
 */
o3djs.particles = o3djs.particles || {};

/**
 * Enum for pre-made particle states.
 * @enum
 */
o3djs.particles.ParticleStateIds = {
   BLEND: 0,
   ADD: 1,
   BLEND_PREMULTIPLY: 2,
   BLEND_NO_ALPHA: 3,
   SUBTRACT: 4,
   INVERSE: 5};

/**
 * Particle Effect strings
 * @type {!Array.<{name: string, fxString: string}>}
 */
o3djs.particles.FX_STRINGS_CG = [
  { name: 'particle3d', fxString: '' +
    'float4x4 worldViewProjection : WORLDVIEWPROJECTION;\n' +
    'float4x4 world : WORLD;\n' +
    'float3 worldVelocity;\n' +
    'float3 worldAcceleration;\n' +
    'float timeRange;\n' +
    'float time;\n' +
    'float timeOffset;\n' +
    'float frameDuration;\n' +
    'float numFrames;\n' +
    '\n' +
    '// We need to implement 1D!\n' +
    'sampler rampSampler;\n' +
    'sampler colorSampler;\n' +
    '\n' +
    'struct VertexShaderInput {\n' +
    '  float4 uvLifeTimeFrameStart : POSITION; // uv, lifeTime, frameStart\n' +
    '  float4 positionStartTime : TEXCOORD0;    // position.xyz, startTime\n' +
    '  float4 velocityStartSize : TEXCOORD1;   // velocity.xyz, startSize\n' +
    '  float4 accelerationEndSize : TEXCOORD2; // acceleration.xyz, endSize\n' +
    '  float4 spinStartSpinSpeed : TEXCOORD3;  // spinStart.x, spinSpeed.y\n' +
    '  float4 orientation : TEXCOORD4;  // orientation\n' +
    '  float4 colorMult : COLOR; //\n' +
    '};\n' +
    '\n' +
    'struct PixelShaderInput {\n' +
    '  float4 position : POSITION;\n' +
    '  float2 texcoord : TEXCOORD0;\n' +
    '  float1 percentLife : TEXCOORD1;\n' +
    '  float4 colorMult: TEXCOORD2;\n' +
    '};\n' +
    '\n' +
    'PixelShaderInput vertexShaderFunction(VertexShaderInput input) {\n' +
    '  PixelShaderInput output;\n' +
    '\n' +
    '  float2 uv = input.uvLifeTimeFrameStart.xy;\n' +
    '  float lifeTime = input.uvLifeTimeFrameStart.z;\n' +
    '  float frameStart = input.uvLifeTimeFrameStart.w;\n' +
    '  float3 position = input.positionStartTime.xyz;\n' +
    '  float startTime = input.positionStartTime.w;\n' +
    '  float3 velocity = mul(float4(input.velocityStartSize.xyz, 0),\n' +
    '                        world).xyz + worldVelocity;\n' +
    '  float startSize = input.velocityStartSize.w;\n' +
    '  float3 acceleration = mul(float4(input.accelerationEndSize.xyz, 0),\n' +
    '                            world).xyz + worldAcceleration;\n' +
    '  float endSize = input.accelerationEndSize.w;\n' +
    '  float spinStart = input.spinStartSpinSpeed.x;\n' +
    '  float spinSpeed = input.spinStartSpinSpeed.y;\n' +
    '\n' +
    '  float localTime = fmod((time - timeOffset - startTime), timeRange);\n' +
    '  float percentLife = localTime / lifeTime;\n' +
    '\n' +
    '  float frame = fmod(floor(localTime / frameDuration + frameStart),\n' +
    '                     numFrames);\n' +
    '  float uOffset = frame / numFrames;\n' +
    '  float u = uOffset + (uv.x + 0.5) * (1 / numFrames);\n' +
    '\n' +
    '  output.texcoord = float2(u, uv.y + 0.5);\n' +
    '  output.colorMult = input.colorMult;\n' +
    '\n' +
    '  float size = lerp(startSize, endSize, percentLife);\n' +
    '  size = (percentLife < 0 || percentLife > 1) ? 0 : size;\n' +
    '  float s = sin(spinStart + spinSpeed * localTime);\n' +
    '  float c = cos(spinStart + spinSpeed * localTime);\n' +
    '\n' +
    '  float4 rotatedPoint = float4((uv.x * c + uv.y * s) * size, 0,\n' +
    '                               (uv.x * s - uv.y * c) * size, 1);\n' +
    '  float3 center = velocity * localTime +\n' +
    '                  acceleration * localTime * localTime + \n' +
    '                  position;\n' +
    '  \n' +
    '      float4 q2 = input.orientation + input.orientation;\n' +
    '      float4 qx = input.orientation.xxxw * q2.xyzx;\n' +
    '      float4 qy = input.orientation.xyyw * q2.xyzy;\n' +
    '      float4 qz = input.orientation.xxzw * q2.xxzz;\n' +
    '  \n' +
    '      float4x4 localMatrix = float4x4(\n' +
    '        (1.0f - qy.y) - qz.z, \n' +
    '        qx.y + qz.w, \n' +
    '        qx.z - qy.w,\n' +
    '        0,\n' +
    '  \n' +
    '        qx.y - qz.w, \n' +
    '        (1.0f - qx.x) - qz.z, \n' +
    '        qy.z + qx.w,\n' +
    '        0,\n' +
    '  \n' +
    '        qx.z + qy.w, \n' +
    '        qy.z - qx.w, \n' +
    '        (1.0f - qx.x) - qy.y,\n' +
    '        0,\n' +
    '  \n' +
    '        center.x, center.y, center.z, 1);\n' +
    '  rotatedPoint = mul(rotatedPoint, localMatrix);\n' +
    '  output.position = mul(rotatedPoint, worldViewProjection);\n' +
    '  output.percentLife = percentLife;\n' +
    '  return output;\n' +
    '}\n' +
    '\n' +
    'float4 pixelShaderFunction(PixelShaderInput input): COLOR {\n' +
    '  float4 colorMult = tex2D(rampSampler, \n' +
    '                           float2(input.percentLife, 0.5)) *\n' +
    '                     input.colorMult;\n' +
    '  float4 color = tex2D(colorSampler, input.texcoord) * colorMult;\n' +
    '  return color;\n' +
    '}\n' +
    '\n' +
    '// #o3d VertexShaderEntryPoint vertexShaderFunction\n' +
    '// #o3d PixelShaderEntryPoint pixelShaderFunction\n' +
    '// #o3d MatrixLoadOrder RowMajor\n'},
  { name: 'particle2d', fxString: '' +
    'float4x4 viewProjection : VIEWPROJECTION;\n' +
    'float4x4 world : WORLD;\n' +
    'float4x4 viewInverse : VIEWINVERSE;\n' +
    'float3 worldVelocity;\n' +
    'float3 worldAcceleration;\n' +
    'float timeRange;\n' +
    'float time;\n' +
    'float timeOffset;\n' +
    'float frameDuration;\n' +
    'float numFrames;\n' +
    '\n' +
    '// We need to implement 1D!\n' +
    'sampler rampSampler;\n' +
    'sampler colorSampler;\n' +
    '\n' +
    'struct VertexShaderInput {\n' +
    '  float4 uvLifeTimeFrameStart : POSITION; // uv, lifeTime, frameStart\n' +
    '  float4 positionStartTime : TEXCOORD0;    // position.xyz, startTime\n' +
    '  float4 velocityStartSize : TEXCOORD1;   // velocity.xyz, startSize\n' +
    '  float4 accelerationEndSize : TEXCOORD2; // acceleration.xyz, endSize\n' +
    '  float4 spinStartSpinSpeed : TEXCOORD3;  // spinStart.x, spinSpeed.y\n' +
    '  float4 colorMult : COLOR; //\n' +
    '};\n' +
    '\n' +
    'struct PixelShaderInput {\n' +
    '  float4 position : POSITION;\n' +
    '  float2 texcoord : TEXCOORD0;\n' +
    '  float1 percentLife : TEXCOORD1;\n' +
    '  float4 colorMult: TEXCOORD2;\n' +
    '};\n' +
    '\n' +
    'PixelShaderInput vertexShaderFunction(VertexShaderInput input) {\n' +
    '  PixelShaderInput output;\n' +
    '\n' +
    '  float2 uv = input.uvLifeTimeFrameStart.xy;\n' +
    '  float lifeTime = input.uvLifeTimeFrameStart.z;\n' +
    '  float frameStart = input.uvLifeTimeFrameStart.w;\n' +
    '  float3 position = mul(float4(input.positionStartTime.xyz, 1),\n' +
    '                        world).xyz;\n' +
    '  float startTime = input.positionStartTime.w;\n' +
    '  float3 velocity = mul(float4(input.velocityStartSize.xyz, 0),\n' +
    '                        world).xyz + worldVelocity;\n' +
    '  float startSize = input.velocityStartSize.w;\n' +
    '  float3 acceleration = mul(float4(input.accelerationEndSize.xyz, 0),\n' +
    '                            world).xyz + worldAcceleration;\n' +
    '  float endSize = input.accelerationEndSize.w;\n' +
    '  float spinStart = input.spinStartSpinSpeed.x;\n' +
    '  float spinSpeed = input.spinStartSpinSpeed.y;\n' +
    '\n' +
    '  float localTime = fmod((time - timeOffset - startTime), timeRange);\n' +
    '  float percentLife = localTime / lifeTime;\n' +
    '\n' +
    '  float frame = fmod(floor(localTime / frameDuration + frameStart),\n' +
    '                     numFrames);\n' +
    '  float uOffset = frame / numFrames;\n' +
    '  float u = uOffset + (uv.x + 0.5) * (1 / numFrames);\n' +
    '\n' +
    '  output.texcoord = float2(u, uv.y + 0.5);\n' +
    '  output.colorMult = input.colorMult;\n' +
    '\n' +
    '  float3 basisX = viewInverse[0].xyz;\n' +
    '  float3 basisZ = viewInverse[1].xyz;\n' +
    '\n' +
    '  float size = lerp(startSize, endSize, percentLife);\n' +
    '  size = (percentLife < 0 || percentLife > 1) ? 0 : size;\n' +
    '  float s = sin(spinStart + spinSpeed * localTime);\n' +
    '  float c = cos(spinStart + spinSpeed * localTime);\n' +
    '\n' +
    '  float2 rotatedPoint = float2(uv.x * c + uv.y * s, \n' +
    '                               -uv.x * s + uv.y * c);\n' +
    '  float3 localPosition = float3(basisX * rotatedPoint.x +\n' +
    '                                basisZ * rotatedPoint.y) * size +\n' +
    '                         velocity * localTime +\n' +
    '                         acceleration * localTime * localTime + \n' +
    '                         position;\n' +
    '\n' +
    '  output.position = mul(float4(localPosition, 1), \n' +
    '                        viewProjection);\n' +
    '  output.percentLife = percentLife;\n' +
    '  return output;\n' +
    '}\n' +
    '\n' +
    'float4 pixelShaderFunction(PixelShaderInput input): COLOR {\n' +
    '  float4 colorMult = tex2D(rampSampler, \n' +
    '                           float2(input.percentLife, 0.5)) *\n' +
    '                     input.colorMult;\n' +
    '  float4 color = tex2D(colorSampler, input.texcoord) * colorMult;\n' +
    '  return color;\n' +
    '}\n' +
    '\n' +
    '// #o3d VertexShaderEntryPoint vertexShaderFunction\n' +
    '// #o3d PixelShaderEntryPoint pixelShaderFunction\n' +
    '// #o3d MatrixLoadOrder RowMajor\n'}];

// Auto-generated by convert.py.
o3djs.particles.FX_STRINGS_GLSL = [
  { name: 'particle3d', fxString: '' +
    '// glslv profile log:\n' +
    '// (0) : warning C7011: implicit cast from "float1" to "float"\n' +
    '// 109 lines, 1 warnings, 0 errors.\n' +
    '\n' +
    '// glslf profile log:\n' +
    '// 109 lines, 0 errors.\n' +
    '\n' +
    '// glslv output by Cg compiler\n' +
    '// cgc version 2.0.0010, build date Dec 12 2007\n' +
    '// command line args: -profile glslv\n' +
    '//vendor NVIDIA Corporation\n' +
    '//version 2.0.0.10\n' +
    '//profile glslv\n' +
    '//program vertexShaderFunction\n' +
    '//semantic worldViewProjection : WORLDVIEWPROJECTION\n' +
    '//semantic world : WORLD\n' +
    '//semantic worldVelocity\n' +
    '//semantic worldAcceleration\n' +
    '//semantic timeRange\n' +
    '//semantic time\n' +
    '//semantic timeOffset\n' +
    '//semantic frameDuration\n' +
    '//semantic numFrames\n' +
    '//semantic rampSampler\n' +
    '//semantic colorSampler\n' +
    '//var float4x4 worldViewProjection : WORLDVIEWPROJECTION : _ZZ2SworldViewProjection[0], 4 : -1 : 1\n' +
    '//var float4x4 world : WORLD : _ZZ2Sworld[0], 4 : -1 : 1\n' +
    '//var float3 worldVelocity :  : _ZZ2SworldVelocity : -1 : 1\n' +
    '//var float3 worldAcceleration :  : _ZZ2SworldAcceleration : -1 : 1\n' +
    '//var float timeRange :  : _ZZ2StimeRange : -1 : 1\n' +
    '//var float time :  : _ZZ2Stime : -1 : 1\n' +
    '//var float timeOffset :  : _ZZ2StimeOffset : -1 : 1\n' +
    '//var float frameDuration :  : _ZZ2SframeDuration : -1 : 1\n' +
    '//var float numFrames :  : _ZZ2SnumFrames : -1 : 1\n' +
    '//var sampler rampSampler :  :  : -1 : 0\n' +
    '//var sampler colorSampler :  :  : -1 : 0\n' +
    '//var float4 input.uvLifeTimeFrameStart : $vin.POSITION : POSITION : 0 : 1\n' +
    '//var float4 input.positionStartTime : $vin.TEXCOORD0 : TEXCOORD0 : 0 : 1\n' +
    '//var float4 input.velocityStartSize : $vin.TEXCOORD1 : TEXCOORD1 : 0 : 1\n' +
    '//var float4 input.accelerationEndSize : $vin.TEXCOORD2 : TEXCOORD2 : 0 : 1\n' +
    '//var float4 input.spinStartSpinSpeed : $vin.TEXCOORD3 : TEXCOORD3 : 0 : 1\n' +
    '//var float4 input.orientation : $vin.TEXCOORD4 : TEXCOORD4 : 0 : 1\n' +
    '//var float4 input.colorMult : $vin.COLOR : COLOR : 0 : 1\n' +
    '//var float4 vertexShaderFunction.position : $vout.POSITION : POSITION : -1 : 1\n' +
    '//var float2 vertexShaderFunction.texcoord : $vout.TEXCOORD0 : TEXCOORD0 : -1 : 1\n' +
    '//var float1 vertexShaderFunction.percentLife : $vout.TEXCOORD1 : TEXCOORD1 : -1 : 1\n' +
    '//var float4 vertexShaderFunction.colorMult : $vout.TEXCOORD2 : TEXCOORD2 : -1 : 1\n' +
    '\n' +
    'attribute vec4 position;\n' +
    'attribute vec4 texcoord0;\n' +
    'attribute vec4 texcoord1;\n' +
    'attribute vec4 texcoord2;\n' +
    'attribute vec4 texcoord3;\n' +
    'attribute vec4 texcoord4;\n' +
    'vec4 _glPositionTemp;\n' +
    'uniform vec4 dx_clipping;\n' +
    '\n' +
    'struct VertexShaderInput {\n' +
    '    vec4 uvLifeTimeFrameStart;\n' +
    '    vec4 positionStartTime;\n' +
    '    vec4 velocityStartSize;\n' +
    '    vec4 accelerationEndSize;\n' +
    '    vec4 spinStartSpinSpeed;\n' +
    '    vec4 orientation;\n' +
    '    vec4 colorMult;\n' +
    '};\n' +
    '\n' +
    'struct PixelShaderInput {\n' +
    '    vec4 position;\n' +
    '    vec2 texcoord;\n' +
    '    float percentLife;\n' +
    '    vec4 colorMult;\n' +
    '};\n' +
    '\n' +
    'PixelShaderInput _ZZ3Sret_0;\n' +
    'vec4 _ZZ3SrZh0027;\n' +
    'vec4 _ZZ3SvZh0027;\n' +
    'vec4 _ZZ3SrZh0029;\n' +
    'vec4 _ZZ3SvZh0029;\n' +
    'float _ZZ3ScZh0031;\n' +
    'float _ZZ3SaZh0031;\n' +
    'float _ZZ3SaZh0033;\n' +
    'float _ZZ3SxZh0035;\n' +
    'float _ZZ3SxZh0039;\n' +
    'float _ZZ3ScZh0041;\n' +
    'float _ZZ3SaZh0041;\n' +
    'float _ZZ3SaZh0043;\n' +
    'float _ZZ3SxZh0045;\n' +
    'float _ZZ3SaZh0051;\n' +
    'float _ZZ3SaZh0053;\n' +
    'vec4 _ZZ3SrZh0055;\n' +
    'vec4 _ZZ3SrZh0057;\n' +
    'uniform mat4 worldviewprojection;\n' +
    'uniform mat4 world;\n' +
    'uniform vec3 worldVelocity;\n' +
    'uniform vec3 worldAcceleration;\n' +
    'uniform float timeRange;\n' +
    'uniform float time;\n' +
    'uniform float timeOffset;\n' +
    'uniform float frameDuration;\n' +
    'uniform float numFrames;\n' +
    '\n' +
    ' // main procedure, the original name was vertexShaderFunction\n' +
    'void main()\n' +
    '{\n' +
    '\n' +
    '    PixelShaderInput _ZZ4Soutput;\n' +
    '    vec3 _ZZ4Svelocity;\n' +
    '    vec3 _ZZ4Sacceleration;\n' +
    '    float _ZZ4SlocalTime;\n' +
    '    float _ZZ4SpercentLife;\n' +
    '    float _ZZ4Sframe;\n' +
    '    float _ZZ4SuOffset;\n' +
    '    float _ZZ4Su;\n' +
    '    float _ZZ4Ssize;\n' +
    '    float _ZZ4Ss;\n' +
    '    float _ZZ4Sc;\n' +
    '    vec4 _ZZ4SrotatedPoint;\n' +
    '    vec3 _ZZ4Scenter;\n' +
    '    vec4 _ZZ4Sq2;\n' +
    '    vec4 _ZZ4Sqx;\n' +
    '    vec4 _ZZ4Sqy;\n' +
    '    vec4 _ZZ4Sqz;\n' +
    '    vec4 _ZZ4SZaTMP9[4];\n' +
    '\n' +
    '    _ZZ3SvZh0027 = vec4(texcoord1.x, texcoord1.y, texcoord1.z, 0.00000000E+00);\n' +
    '    _ZZ3SrZh0027 = _ZZ3SvZh0027.x*world[0];\n' +
    '    _ZZ3SrZh0027 = _ZZ3SrZh0027 + _ZZ3SvZh0027.y*world[1];\n' +
    '    _ZZ3SrZh0027 = _ZZ3SrZh0027 + _ZZ3SvZh0027.z*world[2];\n' +
    '    _ZZ3SrZh0027 = _ZZ3SrZh0027 + _ZZ3SvZh0027.w*world[3];\n' +
    '    _ZZ4Svelocity = _ZZ3SrZh0027.xyz + worldVelocity;\n' +
    '    _ZZ3SvZh0029 = vec4(texcoord2.x, texcoord2.y, texcoord2.z, 0.00000000E+00);\n' +
    '    _ZZ3SrZh0029 = _ZZ3SvZh0029.x*world[0];\n' +
    '    _ZZ3SrZh0029 = _ZZ3SrZh0029 + _ZZ3SvZh0029.y*world[1];\n' +
    '    _ZZ3SrZh0029 = _ZZ3SrZh0029 + _ZZ3SvZh0029.z*world[2];\n' +
    '    _ZZ3SrZh0029 = _ZZ3SrZh0029 + _ZZ3SvZh0029.w*world[3];\n' +
    '    _ZZ4Sacceleration = _ZZ3SrZh0029.xyz + worldAcceleration;\n' +
    '    _ZZ3SaZh0031 = (time - timeOffset) - texcoord0.w;\n' +
    '    _ZZ3SaZh0033 = _ZZ3SaZh0031/timeRange;\n' +
    '    _ZZ3SxZh0035 = abs(_ZZ3SaZh0033);\n' +
    '    _ZZ3ScZh0031 = fract(_ZZ3SxZh0035)*abs(timeRange);\n' +
    '    _ZZ4SlocalTime = _ZZ3SaZh0031 < 0.00000000E+00 ? -_ZZ3ScZh0031 : _ZZ3ScZh0031;\n' +
    '    _ZZ4SpercentLife = _ZZ4SlocalTime/position.z;\n' +
    '    _ZZ3SxZh0039 = _ZZ4SlocalTime/frameDuration + position.w;\n' +
    '    _ZZ3SaZh0041 = floor(_ZZ3SxZh0039);\n' +
    '    _ZZ3SaZh0043 = _ZZ3SaZh0041/numFrames;\n' +
    '    _ZZ3SxZh0045 = abs(_ZZ3SaZh0043);\n' +
    '    _ZZ3ScZh0041 = fract(_ZZ3SxZh0045)*abs(numFrames);\n' +
    '    _ZZ4Sframe = _ZZ3SaZh0041 < 0.00000000E+00 ? -_ZZ3ScZh0041 : _ZZ3ScZh0041;\n' +
    '    _ZZ4SuOffset = _ZZ4Sframe/numFrames;\n' +
    '    _ZZ4Su = _ZZ4SuOffset + (position.x + 5.00000000E-01)*(1.00000000E+00/numFrames);\n' +
    '    _ZZ4Soutput.texcoord = vec2(_ZZ4Su, position.y + 5.00000000E-01);\n' +
    '    _ZZ4Ssize = texcoord1.w + _ZZ4SpercentLife*(texcoord2.w - texcoord1.w);\n' +
    '    _ZZ4Ssize = _ZZ4SpercentLife < 0.00000000E+00 || _ZZ4SpercentLife > 1.00000000E+00 ? 0.00000000E+00 : _ZZ4Ssize;\n' +
    '    _ZZ3SaZh0051 = texcoord3.x + texcoord3.y*_ZZ4SlocalTime;\n' +
    '    _ZZ4Ss = sin(_ZZ3SaZh0051);\n' +
    '    _ZZ3SaZh0053 = texcoord3.x + texcoord3.y*_ZZ4SlocalTime;\n' +
    '    _ZZ4Sc = cos(_ZZ3SaZh0053);\n' +
    '    _ZZ4SrotatedPoint = vec4((position.x*_ZZ4Sc + position.y*_ZZ4Ss)*_ZZ4Ssize, 0.00000000E+00, (position.x*_ZZ4Ss - position.y*_ZZ4Sc)*_ZZ4Ssize, 1.00000000E+00);\n' +
    '    _ZZ4Scenter = _ZZ4Svelocity*_ZZ4SlocalTime + _ZZ4Sacceleration*_ZZ4SlocalTime*_ZZ4SlocalTime + texcoord0.xyz;\n' +
    '    _ZZ4Sq2 = texcoord4 + texcoord4;\n' +
    '    _ZZ4Sqx = texcoord4.xxxw*_ZZ4Sq2.xyzx;\n' +
    '    _ZZ4Sqy = texcoord4.xyyw*_ZZ4Sq2.xyzy;\n' +
    '    _ZZ4Sqz = texcoord4.xxzw*_ZZ4Sq2.xxzz;\n' +
    '    _ZZ4SZaTMP9[0] = vec4((1.00000000E+00 - _ZZ4Sqy.y) - _ZZ4Sqz.z, _ZZ4Sqx.y + _ZZ4Sqz.w, _ZZ4Sqx.z - _ZZ4Sqy.w, 0.00000000E+00);\n' +
    '    _ZZ4SZaTMP9[1] = vec4(_ZZ4Sqx.y - _ZZ4Sqz.w, (1.00000000E+00 - _ZZ4Sqx.x) - _ZZ4Sqz.z, _ZZ4Sqy.z + _ZZ4Sqx.w, 0.00000000E+00);\n' +
    '    _ZZ4SZaTMP9[2] = vec4(_ZZ4Sqx.z + _ZZ4Sqy.w, _ZZ4Sqy.z - _ZZ4Sqx.w, (1.00000000E+00 - _ZZ4Sqx.x) - _ZZ4Sqy.y, 0.00000000E+00);\n' +
    '    _ZZ4SZaTMP9[3] = vec4(_ZZ4Scenter.x, _ZZ4Scenter.y, _ZZ4Scenter.z, 1.00000000E+00);\n' +
    '    _ZZ3SrZh0055 = _ZZ4SrotatedPoint.x*_ZZ4SZaTMP9[0];\n' +
    '    _ZZ3SrZh0055 = _ZZ3SrZh0055 + _ZZ4SrotatedPoint.y*_ZZ4SZaTMP9[1];\n' +
    '    _ZZ3SrZh0055 = _ZZ3SrZh0055 + _ZZ4SrotatedPoint.z*_ZZ4SZaTMP9[2];\n' +
    '    _ZZ3SrZh0055 = _ZZ3SrZh0055 + _ZZ4SrotatedPoint.w*_ZZ4SZaTMP9[3];\n' +
    '    _ZZ3SrZh0057 = _ZZ3SrZh0055.x*worldviewprojection[0];\n' +
    '    _ZZ3SrZh0057 = _ZZ3SrZh0057 + _ZZ3SrZh0055.y*worldviewprojection[1];\n' +
    '    _ZZ3SrZh0057 = _ZZ3SrZh0057 + _ZZ3SrZh0055.z*worldviewprojection[2];\n' +
    '    _ZZ3SrZh0057 = _ZZ3SrZh0057 + _ZZ3SrZh0055.w*worldviewprojection[3];\n' +
    '    _ZZ4Soutput.percentLife = _ZZ4SpercentLife;\n' +
    '    _ZZ3Sret_0.position = _ZZ3SrZh0057;\n' +
    '    _ZZ3Sret_0.texcoord = _ZZ4Soutput.texcoord;\n' +
    '    _ZZ3Sret_0.percentLife = _ZZ4Soutput.percentLife;\n' +
    '    _ZZ3Sret_0.colorMult = gl_Color;\n' +
    '    gl_TexCoord[0].xy = _ZZ4Soutput.texcoord;\n' +
    '    gl_TexCoord[2] = gl_Color;\n' +
    '    _glPositionTemp = _ZZ3SrZh0057; gl_Position = vec4(_glPositionTemp.x + _glPositionTemp.w * dx_clipping.x, dx_clipping.w * (_glPositionTemp.y + _glPositionTemp.w * dx_clipping.y), _glPositionTemp.z * 2 - _glPositionTemp.w, _glPositionTemp.w);\n' +
    '    gl_TexCoord[1].x = _ZZ4Soutput.percentLife;\n' +
    '    return;\n' +
    '} // main end\n' +
    '\n' +
    '\n' +
    '// #o3d SplitMarker\n' +
    '// #o3d MatrixLoadOrder RowMajor\n' +
    '\n' +
    '// glslf output by Cg compiler\n' +
    '// cgc version 2.0.0010, build date Dec 12 2007\n' +
    '// command line args: -profile glslf\n' +
    '//vendor NVIDIA Corporation\n' +
    '//version 2.0.0.10\n' +
    '//profile glslf\n' +
    '//program pixelShaderFunction\n' +
    '//semantic worldViewProjection : WORLDVIEWPROJECTION\n' +
    '//semantic world : WORLD\n' +
    '//semantic worldVelocity\n' +
    '//semantic worldAcceleration\n' +
    '//semantic timeRange\n' +
    '//semantic time\n' +
    '//semantic timeOffset\n' +
    '//semantic frameDuration\n' +
    '//semantic numFrames\n' +
    '//semantic rampSampler\n' +
    '//semantic colorSampler\n' +
    '//var float4x4 worldViewProjection : WORLDVIEWPROJECTION : , 4 : -1 : 0\n' +
    '//var float4x4 world : WORLD : , 4 : -1 : 0\n' +
    '//var float3 worldVelocity :  :  : -1 : 0\n' +
    '//var float3 worldAcceleration :  :  : -1 : 0\n' +
    '//var float timeRange :  :  : -1 : 0\n' +
    '//var float time :  :  : -1 : 0\n' +
    '//var float timeOffset :  :  : -1 : 0\n' +
    '//var float frameDuration :  :  : -1 : 0\n' +
    '//var float numFrames :  :  : -1 : 0\n' +
    '//var sampler rampSampler :  : _ZZ2SrampSampler : -1 : 1\n' +
    '//var sampler colorSampler :  : _ZZ2ScolorSampler : -1 : 1\n' +
    '//var float2 input.texcoord : $vin.TEXCOORD0 : TEXCOORD0 : 0 : 1\n' +
    '//var float1 input.percentLife : $vin.TEXCOORD1 : TEXCOORD1 : 0 : 1\n' +
    '//var float4 input.colorMult : $vin.TEXCOORD2 : TEXCOORD2 : 0 : 1\n' +
    '//var float4 pixelShaderFunction : $vout.COLOR : COLOR : -1 : 1\n' +
    '\n' +
    '\n' +
    '\n' +
    'struct VertexShaderInput {\n' +
    '    vec4 positionStartTime;\n' +
    '    vec4 velocityStartSize;\n' +
    '    vec4 accelerationEndSize;\n' +
    '    vec4 spinStartSpinSpeed;\n' +
    '    vec4 orientation;\n' +
    '    vec4 colorMult;\n' +
    '};\n' +
    '\n' +
    'struct PixelShaderInput {\n' +
    '    vec2 texcoord;\n' +
    '    float percentLife;\n' +
    '    vec4 colorMult;\n' +
    '};\n' +
    '\n' +
    'vec4 _ZZ3Sret_0;\n' +
    'sampler2D _ZZ3SsZh0016;\n' +
    'vec2 _ZZ3ScZh0016;\n' +
    'sampler2D _ZZ3SsZh0018;\n' +
    'uniform sampler rampSampler;\n' +
    'uniform sampler colorSampler;\n' +
    '\n' +
    ' // main procedure, the original name was pixelShaderFunction\n' +
    'void main()\n' +
    '{\n' +
    '\n' +
    '    PixelShaderInput _ZZ4Sinput;\n' +
    '    vec4 _ZZ4ScolorMult;\n' +
    '    vec4 _ZZ4Scolor;\n' +
    '\n' +
    '    _ZZ4Sinput.percentLife = gl_TexCoord[1].x;\n' +
    '    _ZZ3SsZh0016 = sampler2D(rampSampler);\n' +
    '    _ZZ3ScZh0016 = vec2(_ZZ4Sinput.percentLife, 5.00000000E-01);\n' +
    '    _ZZ4ScolorMult = texture2D(_ZZ3SsZh0016, _ZZ3ScZh0016)*gl_TexCoord[2];\n' +
    '    _ZZ3SsZh0018 = sampler2D(colorSampler);\n' +
    '    _ZZ4Scolor = texture2D(_ZZ3SsZh0018, gl_TexCoord[0].xy)*_ZZ4ScolorMult;\n' +
    '    _ZZ3Sret_0 = _ZZ4Scolor;\n' +
    '    gl_FragColor = _ZZ4Scolor;\n' +
    '    return;\n' +
    '} // main end\n'},
  { name: 'particle2d', fxString: '' +
    '// glslv profile log:\n' +
    '// (0) : warning C7011: implicit cast from "float1" to "float"\n' +
    '// 93 lines, 1 warnings, 0 errors.\n' +
    '\n' +
    '// glslf profile log:\n' +
    '// 93 lines, 0 errors.\n' +
    '\n' +
    '// glslv output by Cg compiler\n' +
    '// cgc version 2.0.0010, build date Dec 12 2007\n' +
    '// command line args: -profile glslv\n' +
    '//vendor NVIDIA Corporation\n' +
    '//version 2.0.0.10\n' +
    '//profile glslv\n' +
    '//program vertexShaderFunction\n' +
    '//semantic viewProjection : VIEWPROJECTION\n' +
    '//semantic world : WORLD\n' +
    '//semantic viewInverse : VIEWINVERSE\n' +
    '//semantic worldVelocity\n' +
    '//semantic worldAcceleration\n' +
    '//semantic timeRange\n' +
    '//semantic time\n' +
    '//semantic timeOffset\n' +
    '//semantic frameDuration\n' +
    '//semantic numFrames\n' +
    '//semantic rampSampler\n' +
    '//semantic colorSampler\n' +
    '//var float4x4 viewProjection : VIEWPROJECTION : _ZZ2SviewProjection[0], 4 : -1 : 1\n' +
    '//var float4x4 world : WORLD : _ZZ2Sworld[0], 4 : -1 : 1\n' +
    '//var float4x4 viewInverse : VIEWINVERSE : _ZZ2SviewInverse[0], 4 : -1 : 1\n' +
    '//var float3 worldVelocity :  : _ZZ2SworldVelocity : -1 : 1\n' +
    '//var float3 worldAcceleration :  : _ZZ2SworldAcceleration : -1 : 1\n' +
    '//var float timeRange :  : _ZZ2StimeRange : -1 : 1\n' +
    '//var float time :  : _ZZ2Stime : -1 : 1\n' +
    '//var float timeOffset :  : _ZZ2StimeOffset : -1 : 1\n' +
    '//var float frameDuration :  : _ZZ2SframeDuration : -1 : 1\n' +
    '//var float numFrames :  : _ZZ2SnumFrames : -1 : 1\n' +
    '//var sampler rampSampler :  :  : -1 : 0\n' +
    '//var sampler colorSampler :  :  : -1 : 0\n' +
    '//var float4 input.uvLifeTimeFrameStart : $vin.POSITION : POSITION : 0 : 1\n' +
    '//var float4 input.positionStartTime : $vin.TEXCOORD0 : TEXCOORD0 : 0 : 1\n' +
    '//var float4 input.velocityStartSize : $vin.TEXCOORD1 : TEXCOORD1 : 0 : 1\n' +
    '//var float4 input.accelerationEndSize : $vin.TEXCOORD2 : TEXCOORD2 : 0 : 1\n' +
    '//var float4 input.spinStartSpinSpeed : $vin.TEXCOORD3 : TEXCOORD3 : 0 : 1\n' +
    '//var float4 input.colorMult : $vin.COLOR : COLOR : 0 : 1\n' +
    '//var float4 vertexShaderFunction.position : $vout.POSITION : POSITION : -1 : 1\n' +
    '//var float2 vertexShaderFunction.texcoord : $vout.TEXCOORD0 : TEXCOORD0 : -1 : 1\n' +
    '//var float1 vertexShaderFunction.percentLife : $vout.TEXCOORD1 : TEXCOORD1 : -1 : 1\n' +
    '//var float4 vertexShaderFunction.colorMult : $vout.TEXCOORD2 : TEXCOORD2 : -1 : 1\n' +
    '\n' +
    'attribute vec4 position;\n' +
    'attribute vec4 texcoord0;\n' +
    'attribute vec4 texcoord1;\n' +
    'attribute vec4 texcoord2;\n' +
    'attribute vec4 texcoord3;\n' +
    'vec4 _glPositionTemp;\n' +
    'uniform vec4 dx_clipping;\n' +
    '\n' +
    'struct VertexShaderInput {\n' +
    '    vec4 uvLifeTimeFrameStart;\n' +
    '    vec4 positionStartTime;\n' +
    '    vec4 velocityStartSize;\n' +
    '    vec4 accelerationEndSize;\n' +
    '    vec4 spinStartSpinSpeed;\n' +
    '    vec4 colorMult;\n' +
    '};\n' +
    '\n' +
    'struct PixelShaderInput {\n' +
    '    vec4 position;\n' +
    '    vec2 texcoord;\n' +
    '    float percentLife;\n' +
    '    vec4 colorMult;\n' +
    '};\n' +
    '\n' +
    'PixelShaderInput _ZZ3Sret_0;\n' +
    'vec4 _ZZ3SrZh0027;\n' +
    'vec4 _ZZ3SvZh0027;\n' +
    'vec4 _ZZ3SrZh0029;\n' +
    'vec4 _ZZ3SvZh0029;\n' +
    'vec4 _ZZ3SrZh0031;\n' +
    'vec4 _ZZ3SvZh0031;\n' +
    'float _ZZ3ScZh0033;\n' +
    'float _ZZ3SaZh0033;\n' +
    'float _ZZ3SaZh0035;\n' +
    'float _ZZ3SxZh0037;\n' +
    'float _ZZ3SxZh0041;\n' +
    'float _ZZ3ScZh0043;\n' +
    'float _ZZ3SaZh0043;\n' +
    'float _ZZ3SaZh0045;\n' +
    'float _ZZ3SxZh0047;\n' +
    'float _ZZ3SaZh0053;\n' +
    'float _ZZ3SaZh0055;\n' +
    'vec4 _ZZ3SrZh0057;\n' +
    'vec4 _ZZ3SvZh0057;\n' +
    'vec3 _ZZ3SZaTMP58;\n' +
    'vec3 _ZZ3SZaTMP59;\n' +
    'uniform mat4 viewprojection;\n' +
    'uniform mat4 world;\n' +
    'uniform mat4 viewinverse;\n' +
    'uniform vec3 worldVelocity;\n' +
    'uniform vec3 worldAcceleration;\n' +
    'uniform float timeRange;\n' +
    'uniform float time;\n' +
    'uniform float timeOffset;\n' +
    'uniform float frameDuration;\n' +
    'uniform float numFrames;\n' +
    '\n' +
    ' // main procedure, the original name was vertexShaderFunction\n' +
    'void main()\n' +
    '{\n' +
    '\n' +
    '    PixelShaderInput _ZZ4Soutput;\n' +
    '    vec3 _ZZ4Svelocity;\n' +
    '    vec3 _ZZ4Sacceleration;\n' +
    '    float _ZZ4SlocalTime;\n' +
    '    float _ZZ4SpercentLife;\n' +
    '    float _ZZ4Sframe;\n' +
    '    float _ZZ4SuOffset;\n' +
    '    float _ZZ4Su;\n' +
    '    float _ZZ4Ssize;\n' +
    '    float _ZZ4Ss;\n' +
    '    float _ZZ4Sc;\n' +
    '    vec2 _ZZ4SrotatedPoint;\n' +
    '    vec3 _ZZ4SlocalPosition;\n' +
    '\n' +
    '    _ZZ3SvZh0027 = vec4(texcoord0.x, texcoord0.y, texcoord0.z, 1.00000000E+00);\n' +
    '    _ZZ3SrZh0027 = _ZZ3SvZh0027.x*world[0];\n' +
    '    _ZZ3SrZh0027 = _ZZ3SrZh0027 + _ZZ3SvZh0027.y*world[1];\n' +
    '    _ZZ3SrZh0027 = _ZZ3SrZh0027 + _ZZ3SvZh0027.z*world[2];\n' +
    '    _ZZ3SrZh0027 = _ZZ3SrZh0027 + _ZZ3SvZh0027.w*world[3];\n' +
    '    _ZZ3SvZh0029 = vec4(texcoord1.x, texcoord1.y, texcoord1.z, 0.00000000E+00);\n' +
    '    _ZZ3SrZh0029 = _ZZ3SvZh0029.x*world[0];\n' +
    '    _ZZ3SrZh0029 = _ZZ3SrZh0029 + _ZZ3SvZh0029.y*world[1];\n' +
    '    _ZZ3SrZh0029 = _ZZ3SrZh0029 + _ZZ3SvZh0029.z*world[2];\n' +
    '    _ZZ3SrZh0029 = _ZZ3SrZh0029 + _ZZ3SvZh0029.w*world[3];\n' +
    '    _ZZ4Svelocity = _ZZ3SrZh0029.xyz + worldVelocity;\n' +
    '    _ZZ3SvZh0031 = vec4(texcoord2.x, texcoord2.y, texcoord2.z, 0.00000000E+00);\n' +
    '    _ZZ3SrZh0031 = _ZZ3SvZh0031.x*world[0];\n' +
    '    _ZZ3SrZh0031 = _ZZ3SrZh0031 + _ZZ3SvZh0031.y*world[1];\n' +
    '    _ZZ3SrZh0031 = _ZZ3SrZh0031 + _ZZ3SvZh0031.z*world[2];\n' +
    '    _ZZ3SrZh0031 = _ZZ3SrZh0031 + _ZZ3SvZh0031.w*world[3];\n' +
    '    _ZZ4Sacceleration = _ZZ3SrZh0031.xyz + worldAcceleration;\n' +
    '    _ZZ3SaZh0033 = (time - timeOffset) - texcoord0.w;\n' +
    '    _ZZ3SaZh0035 = _ZZ3SaZh0033/timeRange;\n' +
    '    _ZZ3SxZh0037 = abs(_ZZ3SaZh0035);\n' +
    '    _ZZ3ScZh0033 = fract(_ZZ3SxZh0037)*abs(timeRange);\n' +
    '    _ZZ4SlocalTime = _ZZ3SaZh0033 < 0.00000000E+00 ? -_ZZ3ScZh0033 : _ZZ3ScZh0033;\n' +
    '    _ZZ4SpercentLife = _ZZ4SlocalTime/position.z;\n' +
    '    _ZZ3SxZh0041 = _ZZ4SlocalTime/frameDuration + position.w;\n' +
    '    _ZZ3SaZh0043 = floor(_ZZ3SxZh0041);\n' +
    '    _ZZ3SaZh0045 = _ZZ3SaZh0043/numFrames;\n' +
    '    _ZZ3SxZh0047 = abs(_ZZ3SaZh0045);\n' +
    '    _ZZ3ScZh0043 = fract(_ZZ3SxZh0047)*abs(numFrames);\n' +
    '    _ZZ4Sframe = _ZZ3SaZh0043 < 0.00000000E+00 ? -_ZZ3ScZh0043 : _ZZ3ScZh0043;\n' +
    '    _ZZ4SuOffset = _ZZ4Sframe/numFrames;\n' +
    '    _ZZ4Su = _ZZ4SuOffset + (position.x + 5.00000000E-01)*(1.00000000E+00/numFrames);\n' +
    '    _ZZ4Soutput.texcoord = vec2(_ZZ4Su, position.y + 5.00000000E-01);\n' +
    '    _ZZ4Ssize = texcoord1.w + _ZZ4SpercentLife*(texcoord2.w - texcoord1.w);\n' +
    '    _ZZ4Ssize = _ZZ4SpercentLife < 0.00000000E+00 || _ZZ4SpercentLife > 1.00000000E+00 ? 0.00000000E+00 : _ZZ4Ssize;\n' +
    '    _ZZ3SaZh0053 = texcoord3.x + texcoord3.y*_ZZ4SlocalTime;\n' +
    '    _ZZ4Ss = sin(_ZZ3SaZh0053);\n' +
    '    _ZZ3SaZh0055 = texcoord3.x + texcoord3.y*_ZZ4SlocalTime;\n' +
    '    _ZZ4Sc = cos(_ZZ3SaZh0055);\n' +
    '    _ZZ4SrotatedPoint = vec2(position.x*_ZZ4Sc + position.y*_ZZ4Ss, -position.x*_ZZ4Ss + position.y*_ZZ4Sc);\n' +
    '    _ZZ3SZaTMP58.x = viewinverse[0].x;\n' +
    '    _ZZ3SZaTMP58.y = viewinverse[0].y;\n' +
    '    _ZZ3SZaTMP58.z = viewinverse[0].z;\n' +
    '    _ZZ3SZaTMP59.x = viewinverse[1].x;\n' +
    '    _ZZ3SZaTMP59.y = viewinverse[1].y;\n' +
    '    _ZZ3SZaTMP59.z = viewinverse[1].z;\n' +
    '    _ZZ4SlocalPosition = (_ZZ3SZaTMP58*_ZZ4SrotatedPoint.x + _ZZ3SZaTMP59*_ZZ4SrotatedPoint.y)*_ZZ4Ssize + _ZZ4Svelocity*_ZZ4SlocalTime + _ZZ4Sacceleration*_ZZ4SlocalTime*_ZZ4SlocalTime + _ZZ3SrZh0027.xyz;\n' +
    '    _ZZ3SvZh0057 = vec4(_ZZ4SlocalPosition.x, _ZZ4SlocalPosition.y, _ZZ4SlocalPosition.z, 1.00000000E+00);\n' +
    '    _ZZ3SrZh0057 = _ZZ3SvZh0057.x*viewprojection[0];\n' +
    '    _ZZ3SrZh0057 = _ZZ3SrZh0057 + _ZZ3SvZh0057.y*viewprojection[1];\n' +
    '    _ZZ3SrZh0057 = _ZZ3SrZh0057 + _ZZ3SvZh0057.z*viewprojection[2];\n' +
    '    _ZZ3SrZh0057 = _ZZ3SrZh0057 + _ZZ3SvZh0057.w*viewprojection[3];\n' +
    '    _ZZ4Soutput.percentLife = _ZZ4SpercentLife;\n' +
    '    _ZZ3Sret_0.position = _ZZ3SrZh0057;\n' +
    '    _ZZ3Sret_0.texcoord = _ZZ4Soutput.texcoord;\n' +
    '    _ZZ3Sret_0.percentLife = _ZZ4Soutput.percentLife;\n' +
    '    _ZZ3Sret_0.colorMult = gl_Color;\n' +
    '    gl_TexCoord[0].xy = _ZZ4Soutput.texcoord;\n' +
    '    gl_TexCoord[2] = gl_Color;\n' +
    '    _glPositionTemp = _ZZ3SrZh0057; gl_Position = vec4(_glPositionTemp.x + _glPositionTemp.w * dx_clipping.x, dx_clipping.w * (_glPositionTemp.y + _glPositionTemp.w * dx_clipping.y), _glPositionTemp.z * 2 - _glPositionTemp.w, _glPositionTemp.w);\n' +
    '    gl_TexCoord[1].x = _ZZ4Soutput.percentLife;\n' +
    '    return;\n' +
    '} // main end\n' +
    '\n' +
    '\n' +
    '// #o3d SplitMarker\n' +
    '// #o3d MatrixLoadOrder RowMajor\n' +
    '\n' +
    '// glslf output by Cg compiler\n' +
    '// cgc version 2.0.0010, build date Dec 12 2007\n' +
    '// command line args: -profile glslf\n' +
    '//vendor NVIDIA Corporation\n' +
    '//version 2.0.0.10\n' +
    '//profile glslf\n' +
    '//program pixelShaderFunction\n' +
    '//semantic viewProjection : VIEWPROJECTION\n' +
    '//semantic world : WORLD\n' +
    '//semantic viewInverse : VIEWINVERSE\n' +
    '//semantic worldVelocity\n' +
    '//semantic worldAcceleration\n' +
    '//semantic timeRange\n' +
    '//semantic time\n' +
    '//semantic timeOffset\n' +
    '//semantic frameDuration\n' +
    '//semantic numFrames\n' +
    '//semantic rampSampler\n' +
    '//semantic colorSampler\n' +
    '//var float4x4 viewProjection : VIEWPROJECTION : , 4 : -1 : 0\n' +
    '//var float4x4 world : WORLD : , 4 : -1 : 0\n' +
    '//var float4x4 viewInverse : VIEWINVERSE : , 4 : -1 : 0\n' +
    '//var float3 worldVelocity :  :  : -1 : 0\n' +
    '//var float3 worldAcceleration :  :  : -1 : 0\n' +
    '//var float timeRange :  :  : -1 : 0\n' +
    '//var float time :  :  : -1 : 0\n' +
    '//var float timeOffset :  :  : -1 : 0\n' +
    '//var float frameDuration :  :  : -1 : 0\n' +
    '//var float numFrames :  :  : -1 : 0\n' +
    '//var sampler rampSampler :  : _ZZ2SrampSampler : -1 : 1\n' +
    '//var sampler colorSampler :  : _ZZ2ScolorSampler : -1 : 1\n' +
    '//var float2 input.texcoord : $vin.TEXCOORD0 : TEXCOORD0 : 0 : 1\n' +
    '//var float1 input.percentLife : $vin.TEXCOORD1 : TEXCOORD1 : 0 : 1\n' +
    '//var float4 input.colorMult : $vin.TEXCOORD2 : TEXCOORD2 : 0 : 1\n' +
    '//var float4 pixelShaderFunction : $vout.COLOR : COLOR : -1 : 1\n' +
    '\n' +
    '\n' +
    '\n' +
    'struct VertexShaderInput {\n' +
    '    vec4 positionStartTime;\n' +
    '    vec4 velocityStartSize;\n' +
    '    vec4 accelerationEndSize;\n' +
    '    vec4 spinStartSpinSpeed;\n' +
    '    vec4 colorMult;\n' +
    '};\n' +
    '\n' +
    'struct PixelShaderInput {\n' +
    '    vec2 texcoord;\n' +
    '    float percentLife;\n' +
    '    vec4 colorMult;\n' +
    '};\n' +
    '\n' +
    'vec4 _ZZ3Sret_0;\n' +
    'sampler2D _ZZ3SsZh0017;\n' +
    'vec2 _ZZ3ScZh0017;\n' +
    'sampler2D _ZZ3SsZh0019;\n' +
    'uniform sampler rampSampler;\n' +
    'uniform sampler colorSampler;\n' +
    '\n' +
    ' // main procedure, the original name was pixelShaderFunction\n' +
    'void main()\n' +
    '{\n' +
    '\n' +
    '    PixelShaderInput _ZZ4Sinput;\n' +
    '    vec4 _ZZ4ScolorMult;\n' +
    '    vec4 _ZZ4Scolor;\n' +
    '\n' +
    '    _ZZ4Sinput.percentLife = gl_TexCoord[1].x;\n' +
    '    _ZZ3SsZh0017 = sampler2D(rampSampler);\n' +
    '    _ZZ3ScZh0017 = vec2(_ZZ4Sinput.percentLife, 5.00000000E-01);\n' +
    '    _ZZ4ScolorMult = texture2D(_ZZ3SsZh0017, _ZZ3ScZh0017)*gl_TexCoord[2];\n' +
    '    _ZZ3SsZh0019 = sampler2D(colorSampler);\n' +
    '    _ZZ4Scolor = texture2D(_ZZ3SsZh0019, gl_TexCoord[0].xy)*_ZZ4ScolorMult;\n' +
    '    _ZZ3Sret_0 = _ZZ4Scolor;\n' +
    '    gl_FragColor = _ZZ4Scolor;\n' +
    '    return;\n' +
    '} // main end\n'}];


/**
 * Sets the shader language used.  Passing 'glsl' will cause all generated
 * shader code to be in glsl.  Passing anything else will result in the
 * default o3d hlsl/cg based shader language.
 * @param {string} language Shader language to use.
 */
o3djs.particles.setLanguage = function(language) {
  o3djs.particles.FX_STRINGS = o3djs.particles.FX_STRINGS_CG;
  if (language == 'glsl')
    o3djs.particles.FX_STRINGS = o3djs.particles.FX_STRINGS_GLSL;
}


/**
 * Corner values.
 * @private
 * @type {!Array.<!Array.<number>>}
 */
o3djs.particles.CORNERS_ = [
      [-0.5, -0.5],
      [+0.5, -0.5],
      [+0.5, +0.5],
      [-0.5, +0.5]];


/**
 * Creates a particle system.
 * You only need one of these to run multiple emitters of different types
 * of particles.
 * @param {!o3d.Pack} pack The pack for the particle system to manage resources.
 * @param {!o3djs.rendergraph.ViewInfo} viewInfo A viewInfo so the particle
 *     system can do the default setup. The only thing used from viewInfo
 *     is the zOrderedDrawList. If that is not where you want your particles,
 *     after you create the particleEmitter use
 *     particleEmitter.material.drawList = myDrawList to set it to something
 *     else.
 * @param {!o3d.ParamFloat} opt_clockParam A ParamFloat to be the default
 *     clock for emitters of this particle system.
 * @param {!function(): number} opt_randomFunction A function that returns
 *     a random number between 0.0 and 1.0. This allows you to pass in a
 *     pseudo random function if you need particles that are reproducable.
 * @return {!o3djs.particles.ParticleSystem} The created particle system.
 */
o3djs.particles.createParticleSystem = function(pack,
                                                viewInfo,
                                                opt_clockParam,
                                                opt_randomFunction) {
  return new o3djs.particles.ParticleSystem(pack,
                                            viewInfo,
                                            opt_clockParam,
                                            opt_randomFunction);
};

/**
 * An Object to manage Particles.
 * @constructor
 * @param {!o3d.Pack} pack The pack for the particle system to manage resources.
 * @param {!o3djs.rendergraph.ViewInfo} viewInfo A viewInfo so the particle
 *     system can do the default setup. The only thing used from viewInfo
 *     is the zOrderedDrawList. If that is not where you want your particles,
 *     after you create the particleEmitter use
 *     particleEmitter.material.drawList = myDrawList to set it to something
 *     else.
 * @param {!o3d.ParamFloat} opt_clockParam A ParamFloat to be the default
 *     clock for emitters of this particle system.
 * @param {!function(): number} opt_randomFunction A function that returns
 *     a random number between 0.0 and 1.0. This allows you to pass in a
 *     pseudo random function if you need particles that are reproducable.
 */
o3djs.particles.ParticleSystem = function(pack,
                                          viewInfo,
                                          opt_clockParam,
                                          opt_randomFunction) {
  var o3d = o3djs.base.o3d;
  var particleStates = [];
  var effects = [];
  for (var ee = 0; ee < o3djs.particles.FX_STRINGS.length; ++ee) {
    var info = o3djs.particles.FX_STRINGS[ee];
    var effect = pack.createObject('Effect');
    effect.name = info.name;
    effect.loadFromFXString(info.fxString);
    effects.push(effect);
  }

  var stateInfos = {};
  stateInfos[o3djs.particles.ParticleStateIds.BLEND] = {
    'SourceBlendFunction':
        o3djs.base.o3d.State.BLENDFUNC_SOURCE_ALPHA,
    'DestinationBlendFunction':
        o3djs.base.o3d.State.BLENDFUNC_INVERSE_SOURCE_ALPHA};

  stateInfos[o3djs.particles.ParticleStateIds.ADD] = {
    'SourceBlendFunction':
        o3djs.base.o3d.State.BLENDFUNC_SOURCE_ALPHA,
    'DestinationBlendFunction':
        o3djs.base.o3d.State.BLENDFUNC_ONE};

  stateInfos[o3djs.particles.ParticleStateIds.BLEND_PREMULTIPLY] = {
    'SourceBlendFunction':
        o3djs.base.o3d.State.BLENDFUNC_ONE,
    'DestinationBlendFunction':
        o3djs.base.o3d.State.BLENDFUNC_INVERSE_SOURCE_ALPHA};

  stateInfos[o3djs.particles.ParticleStateIds.BLEND_NO_ALPHA] = {
    'SourceBlendFunction':
        o3djs.base.o3d.State.BLENDFUNC_SOURCE_COLOR,
    'DestinationBlendFunction':
        o3djs.base.o3d.State.BLENDFUNC_INVERSE_SOURCE_COLOR};

  stateInfos[o3djs.particles.ParticleStateIds.SUBTRACT] = {
    'SourceBlendFunction':
        o3djs.base.o3d.State.BLENDFUNC_SOURCE_ALPHA,
    'DestinationBlendFunction':
        o3djs.base.o3d.State.BLENDFUNC_INVERSE_SOURCE_ALPHA,
    'BlendEquation':
        o3djs.base.o3d.State.BLEND_REVERSE_SUBTRACT};

  stateInfos[o3djs.particles.ParticleStateIds.INVERSE] = {
    'SourceBlendFunction':
        o3djs.base.o3d.State.BLENDFUNC_INVERSE_DESTINATION_COLOR,
    'DestinationBlendFunction':
        o3djs.base.o3d.State.BLENDFUNC_INVERSE_SOURCE_COLOR};

  for (var key in o3djs.particles.ParticleStateIds) {
    var state = pack.createObject('State');
    var id = o3djs.particles.ParticleStateIds[key];
    particleStates[id] = state;
    state.getStateParam('ZWriteEnable').value = false;
    state.getStateParam('CullMode').value = o3d.State.CULL_NONE;

    var info = stateInfos[id];
    for (var stateName in info) {
      state.getStateParam(stateName).value = info[stateName];
    }
  }

  var colorTexture = pack.createTexture2D(8, 8, o3d.Texture.ARGB8, 1, false);
  var pixelBase = [0, 0.20, 0.70, 1, 0.70, 0.20, 0, 0];
  var pixels = [];
  for (var yy = 0; yy < 8; ++yy) {
    for (var xx = 0; xx < 8; ++xx) {
      var pixel = pixelBase[xx] * pixelBase[yy];
      pixels.push(pixel, pixel, pixel, pixel);
    }
  }
  colorTexture.set(0, pixels);
  var rampTexture = pack.createTexture2D(3, 1, o3d.Texture.ARGB8, 1, false);
  rampTexture.set(0, [1, 1, 1, 1,
                      1, 1, 1, 0.5,
                      1, 1, 1, 0]);

  if (!opt_clockParam) {
    this.counter_ = pack.createObject('SecondCounter');
    opt_clockParam = this.counter_.getParam('count');
  }

  this.randomFunction_ = opt_randomFunction || function() {
        return Math.random();
      };

  /**
   * The states for the various blend modes.
   * @type {!Array.<!o3d.State>}
   */
  this.particleStates = particleStates;

  /**
   * The default ParamFloat to use as the clock for emitters created by
   * this system.
   * @type {!o3d.ParamFloat}
   */
  this.clockParam = opt_clockParam;

  /**
   * The pack used to manage particle system resources.
   * @type {!o3d.Pack}
   */
  this.pack = pack;

  /**
   * The viewInfo that is used to get drawLists.
   * @type {!o3djs.rendergraph.ViewInfo}
   */
  this.viewInfo = viewInfo;

  /**
   * The effects for particles.
   * @type {!Array.<!o3d.Effect>}
   */
  this.effects = effects;


  /**
   * The default color texture for particles.
   * @type {!o3d.Texture2D}
   */
  this.defaultColorTexture = colorTexture;


  /**
   * The default ramp texture for particles.
   * @type {!o3d.Texture2D}
   */
  this.defaultRampTexture = rampTexture;
};

/**
 * A ParticleSpec specifies how to emit particles.
 *
 * NOTE: For all particle functions you can specific a ParticleSpec as a
 * Javascript object, only specifying the fields that you care about.
 *
 * <pre>
 * emitter.setParameters({
 *   numParticles: 40,
 *   lifeTime: 2,
 *   timeRange: 2,
 *   startSize: 50,
 *   endSize: 90,
 *   positionRange: [10, 10, 10],
 *   velocity:[0, 0, 60], velocityRange: [15, 15, 15],
 *   acceleration: [0, 0, -20],
 *   spinSpeedRange: 4}
 * );
 * </pre>
 *
 * Many of these parameters are in pairs. For paired paramters each particle
 * specfic value is set like this
 *
 * particle.field = value + Math.random() - 0.5 * valueRange * 2;
 *
 * or in English
 *
 * particle.field = value plus or minus valueRange.
 *
 * So for example, if you wanted a value from 10 to 20 you'd pass 15 for value
 * and 5 for valueRange because
 *
 * 15 + or - 5  = (10 to 20)
 *
 * @constructor
 */
o3djs.particles.ParticleSpec = function() {
  /**
   * The number of particles to emit.
   * @type {number}
   */
  this.numParticles = 1;

  /**
   * The number of frames in the particle texture.
   * @type {number}
   */
  this.numFrames = 1;

  /**
   * The frame duration at which to animate the particle texture in seconds per
   * frame.
   * @type {number}
   */
  this.frameDuration = 1;

  /**
   * The initial frame to display for a particular particle.
   * @type {number}
   */
  this.frameStart = 0;

  /**
   * The frame start range.
   * @type {number}
   */
  this.frameStartRange = 0;

  /**
   * The life time of the entire particle system.
   * To make a particle system be continuous set this to match the lifeTime.
   * @type {number}
   */
  this.timeRange = 99999999;

  /**
   * The startTime of a particle.
   * @type {?number}
   */
  this.startTime = null;
  // TODO: Describe what happens if this is not set. I still have some
  //     work to do there.

  /**
   * The lifeTime of a particle.
   * @type {number}
   */
  this.lifeTime = 1;

  /**
   * The lifeTime range.
   * @type {number}
   */
  this.lifeTimeRange = 0;

  /**
   * The starting size of a particle.
   * @type {number}
   */
  this.startSize = 1;

  /**
   * The starting size range.
   * @type {number}
   */
  this.startSizeRange = 0;

  /**
   * The ending size of a particle.
   * @type {number}
   */
  this.endSize = 1;

  /**
   * The ending size range.
   * @type {number}
   */
  this.endSizeRange = 0;

  /**
   * The starting position of a particle in local space.
   * @type {!o3djs.math.Vector3}
   */
  this.position = [0, 0, 0];

  /**
   * The starting position range.
   * @type {!o3djs.math.Vector3}
   */
  this.positionRange = [0, 0, 0];

  /**
   * The velocity of a paritcle in local space.
   * @type {!o3djs.math.Vector3}
   */
  this.velocity = [0, 0, 0];

  /**
   * The velocity range.
   * @type {!o3djs.math.Vector3}
   */
  this.velocityRange = [0, 0, 0];

  /**
   * The acceleration of a particle in local space.
   * @type {!o3djs.math.Vector3}
   */
  this.acceleration = [0, 0, 0];

  /**
   * The accleration range.
   * @type {!o3djs.math.Vector3}
   */
  this.accelerationRange = [0, 0, 0];

  /**
   * The starting spin value for a particle in radians.
   * @type {number}
   */
  this.spinStart = 0;

  /**
   * The spin start range.
   * @type {number}
   */
  this.spinStartRange = 0;

  /**
   * The spin speed of a particle in radians.
   * @type {number}
   */
  this.spinSpeed = 0;

  /**
   * The spin speed range.
   * @type {number}
   */
  this.spinSpeedRange = 0;

  /**
   * The color multiplier of a particle.
   * @type {!o3djs.math.Vector4}
   */
  this.colorMult = [1, 1, 1, 1];

  /**
   * The color multiplier range.
   * @type {!o3djs.math.Vector4}
   */
  this.colorMultRange = [0, 0, 0, 0];

  /**
   * The velocity of all paritcles in world space.
   * @type {!o3djs.math.Vector3}
   */
  this.worldVelocity = [0, 0, 0];

  /**
   * The acceleration of all paritcles in world space.
   * @type {!o3djs.math.Vector3}
   */
  this.worldAcceleration = [0, 0, 0];

  /**
   * Whether these particles are oriented in 2d or 3d. true = 2d, false = 3d.
   * @type {boolean}
   */
  this.billboard = true;

  /**
   * The orientation of a particle. This is only used if billboard is false.
   * @type {!o3djs.quaternions.Quaternion}
   */
  this.orientation = [0, 0, 0, 1];
};

/**
 * Creates a particle emitter.
 * @param {!o3d.Texture} opt_texture The texture to use for the particles.
 *     If you don't supply a texture a default is provided.
 * @param {!o3d.ParamFloat} opt_clockParam A ParamFloat to be the clock for
 *     the emitter.
 * @return {!o3djs.particles.ParticleEmitter} The new emitter.
 */
o3djs.particles.ParticleSystem.prototype.createParticleEmitter =
    function(opt_texture, opt_clockParam) {
  return new o3djs.particles.ParticleEmitter(this, opt_texture, opt_clockParam);
};

/**
 * Creates a Trail particle emitter.
 * You can use this for jet exhaust, etc...
 * @param {!o3d.Transform} parent Transform to put emitter on.
 * @param {number} maxParticles Maximum number of particles to appear at once.
 * @param {!o3djs.particles.ParticleSpec} parameters The parameters used to
 *     generate particles.
 * @param {!o3d.Texture} opt_texture The texture to use for the particles.
 *     If you don't supply a texture a default is provided.
 * @param {!function(number, !o3djs.particles.ParticleSpec): void}
 *     opt_perParticleParamSetter A function that is called for each particle to
 *     allow it's parameters to be adjusted per particle. The number is the
 *     index of the particle being created, in other words, if numParticles is
 *     20 this value will be 0 to 19. The ParticleSpec is a spec for this
 *     particular particle. You can set any per particle value before returning.
 * @param {!o3d.ParamFloat} opt_clockParam A ParamFloat to be the clock for
 *     the emitter.
 * @return {!o3djs.particles.Trail} A Trail object.
 */
o3djs.particles.ParticleSystem.prototype.createTrail = function(
    parent,
    maxParticles,
    parameters,
    opt_texture,
    opt_perParticleParamSetter,
    opt_clockParam) {
  return new o3djs.particles.Trail(
      this,
      parent,
      maxParticles,
      parameters,
      opt_texture,
      opt_perParticleParamSetter,
      opt_clockParam);
};

/**
 * A ParticleEmitter
 * @constructor
 * @param {!o3djs.particles.ParticleSystem} particleSystem The particle system
 *     to manage this emitter.
 * @param {!o3d.Texture} opt_texture The texture to use for the particles.
 *     If you don't supply a texture a default is provided.
 * @param {!o3d.ParamFloat} opt_clockParam A ParamFloat to be the clock for
 *     the emitter.
 */
o3djs.particles.ParticleEmitter = function(particleSystem,
                                           opt_texture,
                                           opt_clockParam) {
  opt_clockParam = opt_clockParam || particleSystem.clockParam;

  var o3d = o3djs.base.o3d;
  var pack = particleSystem.pack;
  var viewInfo = particleSystem.viewInfo;
  var material = pack.createObject('Material');
  material.name = 'particles';
  material.drawList = viewInfo.zOrderedDrawList;
  material.effect = particleSystem.effects[1];
  particleSystem.effects[1].createUniformParameters(material);
  material.getParam('time').bind(opt_clockParam);

  var rampSampler = pack.createObject('Sampler');
  rampSampler.texture = particleSystem.defaultRampTexture;
  rampSampler.addressModeU = o3d.Sampler.CLAMP;

  var colorSampler = pack.createObject('Sampler');
  colorSampler.texture = opt_texture || particleSystem.defaultColorTexture;
  colorSampler.addressModeU = o3d.Sampler.CLAMP;
  colorSampler.addressModeV = o3d.Sampler.CLAMP;

  material.getParam('rampSampler').value = rampSampler;
  material.getParam('colorSampler').value = colorSampler;

  var vertexBuffer = pack.createObject('VertexBuffer');
  var uvLifeTimeFrameStartField = vertexBuffer.createField('FloatField', 4);
  var positionStartTimeField = vertexBuffer.createField('FloatField', 4);
  var velocityStartSizeField = vertexBuffer.createField('FloatField', 4);
  var accelerationEndSizeField = vertexBuffer.createField('FloatField', 4);
  var spinStartSpinSpeedField = vertexBuffer.createField('FloatField', 4);
  var orientationField = vertexBuffer.createField('FloatField', 4);
  var colorMultField = vertexBuffer.createField('FloatField', 4);

  var indexBuffer = pack.createObject('IndexBuffer');

  var streamBank = pack.createObject('StreamBank');
  streamBank.setVertexStream(o3d.Stream.POSITION, 0,
                             uvLifeTimeFrameStartField, 0);
  streamBank.setVertexStream(o3d.Stream.TEXCOORD, 0,
                             positionStartTimeField, 0);
  streamBank.setVertexStream(o3d.Stream.TEXCOORD, 1,
                             velocityStartSizeField, 0);
  streamBank.setVertexStream(o3d.Stream.TEXCOORD, 2,
                             accelerationEndSizeField, 0);
  streamBank.setVertexStream(o3d.Stream.TEXCOORD, 3,
                             spinStartSpinSpeedField, 0);
  streamBank.setVertexStream(o3d.Stream.TEXCOORD, 4,
                             orientationField, 0);
  streamBank.setVertexStream(o3d.Stream.COLOR, 0,
                             colorMultField, 0);

  var shape = pack.createObject('Shape');
  var primitive = pack.createObject('Primitive');
  primitive.material = material;
  primitive.owner = shape;
  primitive.streamBank = streamBank;
  primitive.indexBuffer = indexBuffer;
  primitive.primitiveType = o3d.Primitive.TRIANGLELIST;
  primitive.createDrawElement(pack, null);

  this.vertexBuffer_ = vertexBuffer;
  this.uvLifeTimeFrameStartField_ = uvLifeTimeFrameStartField;
  this.positionStartTimeField_ = positionStartTimeField;
  this.velocityStartSizeField_ = velocityStartSizeField;
  this.accelerationEndSizeField_ = accelerationEndSizeField;
  this.spinStartSpinSpeedField_ = spinStartSpinSpeedField;
  this.orientationField_ = orientationField;
  this.colorMultField_ = colorMultField;
  this.indexBuffer_ = indexBuffer;
  this.streamBank_ = streamBank;
  this.primitive_ = primitive;
  this.rampSampler_ = rampSampler;
  this.rampTexture_ = particleSystem.defaultRampTexture;
  this.colorSampler_ = colorSampler;

  /**
   * The particle system managing this emitter.
   * @type {!o3djs.particles.ParticleSystem}
   */
  this.particleSystem = particleSystem;

  /**
   * The Shape used to render these particles.
   * @type {!o3d.Shape}
   */
  this.shape = shape;

  /**
   * The material used by this emitter.
   * @type {!o3d.Material}
   */
  this.material = material;

  /**
   * The param that is the source for the time for this emitter.
   * @type {!o3d.ParamFloat}
   */
  this.clockParam = opt_clockParam;
};

/**
 * Sets the blend state for the particles.
 * You can use this to set the emitter to draw with BLEND, ADD, SUBTRACT, etc.
 * @param {o3djs.particles.ParticleStateIds} stateId The state you want.
 */
o3djs.particles.ParticleEmitter.prototype.setState = function(stateId) {
  this.material.state = this.particleSystem.particleStates[stateId];
};

/**
 * Sets the colorRamp for the particles.
 * The colorRamp is used as a multiplier for the texture. When a particle
 * starts it is multiplied by the first color, as it ages to progressed
 * through the colors in the ramp.
 *
 * <pre>
 * particleEmitter.setColorRamp([
 *   1, 0, 0, 1,    // red
 *   0, 1, 0, 1,    // green
 *   1, 0, 1, 0]);  // purple but with zero alpha
 * </pre>
 *
 * The code above sets the particle to start red, change to green then
 * fade out while changing to purple.
 *
 * @param {!Array.<number>} colorRamp An array of color values in
 *     the form RGBA.
 */
o3djs.particles.ParticleEmitter.prototype.setColorRamp = function(colorRamp) {
  var width = colorRamp.length / 4;
  if (width % 1 != 0) {
    throw 'colorRamp must have multiple of 4 entries';
  }

  if (this.rampTexture_ == this.particleSystem.defaultRampTexture) {
    this.rampTexture_ = null;
  }

  if (this.rampTexture_ && this.rampTexture_.width != width) {
    this.particleSystem.pack.removeObject(this.rampTexture_);
    this.rampTexture_ = null;
  }

  if (!this.rampTexture_) {
    this.rampTexture_ = this.particleSystem.pack.createTexture2D(
        width, 1, o3djs.base.o3d.Texture.ARGB8, 1, false);
  }

  this.rampTexture_.set(0, colorRamp);
  this.rampSampler_.texture = this.rampTexture_;
};

/**
 * Validates and adds missing particle parameters.
 * @param {!o3djs.particles.ParticleSpec} parameters The parameters to validate.
 */
o3djs.particles.ParticleEmitter.prototype.validateParameters = function(
    parameters) {
  var defaults = new o3djs.particles.ParticleSpec();
  for (var key in parameters) {
    if (typeof defaults[key] === 'undefined') {
      throw 'unknown particle parameter "' + key + '"';
    }
  }
  for (var key in defaults) {
    if (typeof parameters[key] === 'undefined') {
      parameters[key] = defaults[key];
    }
  }
};

/**
 * Creates particles.
 * @private
 * @param {number} firstParticleIndex Index of first particle to create.
 * @param {number} numParticles The number of particles to create.
 * @param {!o3djs.particles.ParticleSpec} parameters The parameters for the
 *     emitters.
 * @param {!function(number, !o3djs.particles.ParticleSpec): void}
 *     opt_perParticleParamSetter A function that is called for each particle to
 *     allow it's parameters to be adjusted per particle. The number is the
 *     index of the particle being created, in other words, if numParticles is
 *     20 this value will be 0 to 19. The ParticleSpec is a spec for this
 *     particular particle. You can set any per particle value before returning.
 */
o3djs.particles.ParticleEmitter.prototype.createParticles_ = function(
    firstParticleIndex,
    numParticles,
    parameters,
    opt_perParticleParamSetter) {
  var uvLifeTimeFrameStart = this.uvLifeTimeFrameStart_;
  var positionStartTime = this.positionStartTime_;
  var velocityStartSize = this.velocityStartSize_;
  var accelerationEndSize = this.accelerationEndSize_;
  var spinStartSpinSpeed = this.spinStartSpinSpeed_;
  var orientation = this.orientation_;
  var colorMults = this.colorMults_;

  // Set the globals.
  this.material.effect =
      this.particleSystem.effects[parameters.billboard ? 1 : 0];
  this.material.getParam('timeRange').value = parameters.timeRange;
  this.material.getParam('numFrames').value = parameters.numFrames;
  this.material.getParam('frameDuration').value = parameters.frameDuration;
  this.material.getParam('worldVelocity').value = parameters.worldVelocity;
  this.material.getParam('worldAcceleration').value =
      parameters.worldAcceleration;

  var random = this.particleSystem.randomFunction_;

  var plusMinus = function(range) {
    return (random() - 0.5) * range * 2;
  };

  // TODO: change to not allocate.
  var plusMinusVector = function(range) {
    var v = [];
    for (var ii = 0; ii < range.length; ++ii) {
      v.push(plusMinus(range[ii]));
    }
    return v;
  };

  for (var ii = 0; ii < numParticles; ++ii) {
    if (opt_perParticleParamSetter) {
      opt_perParticleParamSetter(ii, parameters);
    }
    var pLifeTime = parameters.lifeTime;
    var pStartTime = (parameters.startTime === null) ?
        (ii * parameters.lifeTime / numParticles) : parameters.startTime;
    var pFrameStart =
        parameters.frameStart + plusMinus(parameters.frameStartRange);
    var pPosition = o3djs.math.addVector(
        parameters.position, plusMinusVector(parameters.positionRange));
    var pVelocity = o3djs.math.addVector(
        parameters.velocity, plusMinusVector(parameters.velocityRange));
    var pAcceleration = o3djs.math.addVector(
        parameters.acceleration,
        plusMinusVector(parameters.accelerationRange));
    var pColorMult = o3djs.math.addVector(
        parameters.colorMult, plusMinusVector(parameters.colorMultRange));
    var pSpinStart =
        parameters.spinStart + plusMinus(parameters.spinStartRange);
    var pSpinSpeed =
        parameters.spinSpeed + plusMinus(parameters.spinSpeedRange);
    var pStartSize =
        parameters.startSize + plusMinus(parameters.startSizeRange);
    var pEndSize = parameters.endSize + plusMinus(parameters.endSizeRange);
    var pOrientation = parameters.orientation;

    // make each corner of the particle.
    for (var jj = 0; jj < 4; ++jj) {
      var offset0 = (ii * 4 + jj) * 4;
      var offset1 = offset0 + 1;
      var offset2 = offset0 + 2;
      var offset3 = offset0 + 3;

      uvLifeTimeFrameStart[offset0] = o3djs.particles.CORNERS_[jj][0];
      uvLifeTimeFrameStart[offset1] = o3djs.particles.CORNERS_[jj][1];
      uvLifeTimeFrameStart[offset2] = pLifeTime;
      uvLifeTimeFrameStart[offset3] = pFrameStart;

      positionStartTime[offset0] = pPosition[0];
      positionStartTime[offset1] = pPosition[1];
      positionStartTime[offset2] = pPosition[2];
      positionStartTime[offset3] = pStartTime;

      velocityStartSize[offset0] = pVelocity[0];
      velocityStartSize[offset1] = pVelocity[1];
      velocityStartSize[offset2] = pVelocity[2];
      velocityStartSize[offset3] = pStartSize;

      accelerationEndSize[offset0] = pAcceleration[0];
      accelerationEndSize[offset1] = pAcceleration[1];
      accelerationEndSize[offset2] = pAcceleration[2];
      accelerationEndSize[offset3] = pEndSize;

      spinStartSpinSpeed[offset0] = pSpinStart;
      spinStartSpinSpeed[offset1] = pSpinSpeed;
      spinStartSpinSpeed[offset2] = 0;
      spinStartSpinSpeed[offset3] = 0;

      orientation[offset0] = pOrientation[0];
      orientation[offset1] = pOrientation[1];
      orientation[offset2] = pOrientation[2];
      orientation[offset3] = pOrientation[3];

      colorMults[offset0] = pColorMult[0];
      colorMults[offset1] = pColorMult[1];
      colorMults[offset2] = pColorMult[2];
      colorMults[offset3] = pColorMult[3];
    }
  }

  firstParticleIndex *= 4;
  this.uvLifeTimeFrameStartField_.setAt(
      firstParticleIndex,
      uvLifeTimeFrameStart);
  this.positionStartTimeField_.setAt(
      firstParticleIndex,
      positionStartTime);
  this.velocityStartSizeField_.setAt(
      firstParticleIndex,
      velocityStartSize);
  this.accelerationEndSizeField_.setAt(
      firstParticleIndex,
      accelerationEndSize);
  this.spinStartSpinSpeedField_.setAt(
      firstParticleIndex,
      spinStartSpinSpeed);
  this.orientationField_.setAt(
      firstParticleIndex,
      orientation);
  this.colorMultField_.setAt(
      firstParticleIndex,
      colorMults);
};

/**
 * Allocates particles.
 * @private
 * @param {number} numParticles Number of particles to allocate.
 */
o3djs.particles.ParticleEmitter.prototype.allocateParticles_ = function(
    numParticles) {
  if (this.vertexBuffer_.numElements != numParticles * 4) {
    this.vertexBuffer_.allocateElements(numParticles * 4);

    var indices = [];
    for (var ii = 0; ii < numParticles; ++ii) {
      // Make 2 triangles for the quad.
      var startIndex = ii * 4
      indices.push(startIndex + 0, startIndex + 1, startIndex + 2);
      indices.push(startIndex + 0, startIndex + 2, startIndex + 3);
    }
    this.indexBuffer_.set(indices);

    // We keep these around to avoid memory allocations for trails.
    this.uvLifeTimeFrameStart_ = [];
    this.positionStartTime_ = [];
    this.velocityStartSize_ = [];
    this.accelerationEndSize_ = [];
    this.spinStartSpinSpeed_ = [];
    this.orientation_ = [];
    this.colorMults_ = [];
  }

  this.primitive_.numberPrimitives = numParticles * 2;
  this.primitive_.numberVertices = numParticles * 4;
};

/**
 * Sets the parameters of the particle emitter.
 *
 * Each of these parameters are in pairs. The used to create a table
 * of particle parameters. For each particle a specfic value is
 * set like this
 *
 * particle.field = value + Math.random() - 0.5 * valueRange * 2;
 *
 * or in English
 *
 * particle.field = value plus or minus valueRange.
 *
 * So for example, if you wanted a value from 10 to 20 you'd pass 15 for value
 * and 5 for valueRange because
 *
 * 15 + or - 5  = (10 to 20)
 *
 * @param {!o3djs.particles.ParticleSpec} parameters The parameters for the
 *     emitters.
 * @param {!function(number, !o3djs.particles.ParticleSpec): void}
 *     opt_perParticleParamSetter A function that is called for each particle to
 *     allow it's parameters to be adjusted per particle. The number is the
 *     index of the particle being created, in other words, if numParticles is
 *     20 this value will be 0 to 19. The ParticleSpec is a spec for this
 *     particular particle. You can set any per particle value before returning.
 */
o3djs.particles.ParticleEmitter.prototype.setParameters = function(
    parameters,
    opt_perParticleParamSetter) {
  this.validateParameters(parameters);

  var numParticles = parameters.numParticles;

  this.allocateParticles_(numParticles);

  this.createParticles_(
      0,
      numParticles,
      parameters,
      opt_perParticleParamSetter);
};

/**
 * Creates a OneShot particle emitter instance.
 * You can use this for dust puffs, explosions, fireworks, etc...
 * @param {!o3d.Transform} opt_parent The parent for the oneshot.
 * @return {!o3djs.particles.OneShot} A OneShot object.
 */
o3djs.particles.ParticleEmitter.prototype.createOneShot = function(opt_parent) {
  return new o3djs.particles.OneShot(this, opt_parent);
};

/**
 * An object to manage a particle emitter instance as a one shot. Examples of
 * one shot effects are things like an explosion, some fireworks.
 * @constructor
 * @param {!o3djs.particles.ParticleEmitter} emitter The emitter to use for the
 *     one shot.
 * @param {!o3d.Transform} opt_parent The parent for this one shot.
 */
o3djs.particles.OneShot = function(emitter, opt_parent) {
  var pack = emitter.particleSystem.pack;
  this.emitter_ = emitter;

  /**
   * Transform for OneShot.
   * @type {!o3d.Transform}
   */
  this.transform = pack.createObject('Transform');
  this.transform.visible = false;
  this.transform.addShape(emitter.shape);
  this.timeOffsetParam_ =
      this.transform.createParam('timeOffset', 'ParamFloat');
  if (opt_parent) {
    this.setParent(opt_parent);
  }
};

/**
 * Sets the parent transform for this OneShot.
 * @param {!o3d.Transform} parent The parent for this one shot.
 */
o3djs.particles.OneShot.prototype.setParent = function(parent) {
  this.transform.parent = parent;
};

/**
 * Triggers the oneshot.
 *
 * Note: You must have set the parent either at creation, with setParent, or by
 * passing in a parent here.
 *
 * @param {!o3djs.math.Vector3} opt_position The position of the one shot
 *     relative to its parent.
 * @param {!o3d.Transform} opt_parent The parent for this one shot.
 */
o3djs.particles.OneShot.prototype.trigger = function(opt_position, opt_parent) {
  if (opt_parent) {
    this.setParent(opt_parent);
  }
  if (opt_position) {
    this.transform.identity();
    this.transform.translate(opt_position);
  }
  this.transform.visible = true;
  this.timeOffsetParam_.value = this.emitter_.clockParam.value;
};

/**
 * A type of emitter to use for particle effects that leave trails like exhaust.
 * @constructor
 * @extends {o3djs.particles.ParticleEmitter}
 * @param {!o3djs.particles.ParticleSystem} particleSystem The particle system
 *     to manage this emitter.
 * @param {!o3d.Transform} parent Transform to put emitter on.
 * @param {number} maxParticles Maximum number of particles to appear at once.
 * @param {!o3djs.particles.ParticleSpec} parameters The parameters used to
 *     generate particles.
 * @param {!o3d.Texture} opt_texture The texture to use for the particles.
 *     If you don't supply a texture a default is provided.
 * @param {!function(number, !o3djs.particles.ParticleSpec): void}
 *     opt_perParticleParamSetter A function that is called for each particle to
 *     allow it's parameters to be adjusted per particle. The number is the
 *     index of the particle being created, in other words, if numParticles is
 *     20 this value will be 0 to 19. The ParticleSpec is a spec for this
 *     particular particle. You can set any per particle value before returning.
 * @param {!o3d.ParamFloat} opt_clockParam A ParamFloat to be the clock for
 *     the emitter.
 */
o3djs.particles.Trail = function(
    particleSystem,
    parent,
    maxParticles,
    parameters,
    opt_texture,
    opt_perParticleParamSetter,
    opt_clockParam) {
  o3djs.particles.ParticleEmitter.call(
      this, particleSystem, opt_texture, opt_clockParam);

  var pack = particleSystem.pack;

  this.allocateParticles_(maxParticles);
  this.validateParameters(parameters);

  this.parameters = parameters;
  this.perParticleParamSetter = opt_perParticleParamSetter;
  this.birthIndex_ = 0;
  this.maxParticles_ = maxParticles;

  /**
   * Transform for OneShot.
   * @type {!o3d.Transform}
   */
  this.transform = pack.createObject('Transform');
  this.transform.addShape(this.shape);

  this.transform.parent = parent;
};

o3djs.base.inherit(o3djs.particles.Trail, o3djs.particles.ParticleEmitter);

/**
 * Births particles from this Trail.
 * @param {!o3djs.math.Vector3} position Position to birth particles at.
 */
o3djs.particles.Trail.prototype.birthParticles = function(position) {
  var numParticles = this.parameters.numParticles;
  this.parameters.startTime = this.clockParam.value;
  this.parameters.position = position;
  while (this.birthIndex_ + numParticles >= this.maxParticles_) {
    var numParticlesToEnd = this.maxParticles_ - this.birthIndex_;
    this.createParticles_(this.birthIndex_,
                          numParticlesToEnd,
                          this.parameters,
                          this.perParticleParamSetter);
    numParticles -= numParticlesToEnd;
    this.birthIndex_ = 0;
  }
  this.createParticles_(this.birthIndex_,
                        numParticles,
                        this.parameters,
                        this.perParticleParamSetter);
  this.birthIndex_ += numParticles;
};


// For compatability with o3d code, the default language is o3d shading
// language.
o3djs.particles.setLanguage('o3d');
