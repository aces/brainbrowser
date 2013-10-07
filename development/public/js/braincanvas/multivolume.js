/*
 * Copyright (c) 2011-2012, McGill University
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *   * Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *   * Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *   * Neither the name of McGill University nor the
 *     names of its contributors may be used to endorse or promote products
 *     derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL McGill University  BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/*
 * Author: Nicolas Kassis <nic.kassis@gmail.com>
 */


/**
 * Represents a blended volume
 */

(function() {
  "use strict";

  function MultiVolumeData(volumes) {
    var data = this;
    var i;
    
    data.volumes = [];
    var numVolumes = volumes.length;
    for(i = 0; i < numVolumes; i++) {
      if(volumes[i] !== this) {
        data.volumes.push(volumes[i]);
      }
    }
    data.blendRatios = [];

    //initialize blendRatios
    numVolumes = data.volumes.length;
    var blendRatio = 1.0/numVolumes;
    for(i = 0; i < numVolumes; i++) {
      data.blendRatios[i] = blendRatio;
    }

  }

  MultiVolumeData.prototype.updateBlendRatio = function(ratio) {
    ratio += 50;
    this.blendRatios[0] = (100.0-ratio)/100.0;
    this.blendRatios[1] = parseFloat(ratio)/100.0;

  };

  MultiVolumeData.prototype.slice = function(axis, number, time) {
    var numVolumes = this.volumes.length;
    var i, slice;
    var slices = [];

    for(i = 0; i < numVolumes; i++) {
      var volume = this.volumes[i];
      if(volume !== this) {
        slice = this.volumes[i].slice(axis,number,time)[0];
        slice.alpha = this.blendRatios[i];
        slices.push(slice);
      }
    }
    slices.x = slices[0].x;
    slices.y = slices[0].y;
    return slices;
  };
  
  MultiVolumeData.prototype.getScaledSlice = function(axis, number, time, zoom) {
    var numVolumes = this.volumes.length;
    var i, slice;
    var slices = [];

    for(i = 0; i < numVolumes; i++) {
      var volume = this.volumes[i];
      if(volume !== this) {
        slice = this.volumes[i].getScaledSlice(axis,number,time, zoom)[0];
        slice.alpha = this.blendRatios[i];
        slices.push(slice);
      }
    }
    slices.x = slices[0].x;
    slices.y = slices[0].y;
    return slices;
  };
  
  MultiVolumeData.prototype.getVoxelCoords = function() {
    return {
      x: this.position.xspace,
      y: this.position.yspace,
      z: this.position.zspace
    };
  };
  
  MultiVolumeData.prototype.setVoxelCoords = function(x, y, z) {
    this.position.xspace = x;
    this.position.yspace = y;
    this.position.zspace = z;
  };
  
  MultiVolumeData.prototype.getWorldCoords = function() {
    var reference = this.volumes[0];
    
    return {
      x: reference.data.xspace.start + this.position.xspace * reference.data.xspace.step,
      y: reference.data.yspace.start + this.position.yspace * reference.data.yspace.step,
      z: reference.data.zspace.start + this.position.zspace * reference.data.zspace.step
    };
  };
  
  MultiVolumeData.prototype.setWorldCoords = function(x, y, z) {
    var reference = this.volumes[0];
    this.position.xspace = Math.floor((x - reference.data.xspace.start) / reference.data.xspace.step);
    this.position.yspace = Math.floor((y - reference.data.yspace.start) / reference.data.yspace.step);
    this.position.zspace = Math.floor((z - reference.data.zspace.start) / reference.data.zspace.step);
  };

  BrainCanvas.volumeType.multiVolume = function(opt, callback) {
    var volume = new MultiVolumeData(opt.volumes);
    volume.type = "multivolume";
    volume.min = 0;
    volume.max = 255;
    volume.header = opt.volumes[0].header;
    setTimeout(callback,1);
    return volume;
  };
}());

