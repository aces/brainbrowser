/////////////////////////////////////////////////////////////////////////////////////
// The MIT License (MIT)
// 
// Copyright (c) 2013 Tarek Sherif
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
/////////////////////////////////////////////////////////////////////////////////////

var oFactory = (function() {
  "use strict";
  
  ///////////////////////////////////
  //  Private Functions
  ///////////////////////////////////
  
  // Extend an object by copying over attributes.
  // By default does a deep copy, but if the +shallow+
  // argument is set to true, references will will simply
  // be copied over.
  var objectExtend = function(obj, extension, shallow) {
    
    Object.getOwnPropertyNames(extension).forEach(function(key) {
      obj[key] = shallow ? extension[key] : deepCopy(extension[key]);
    });
  };
  
  // Extend an object by passing it to a function that
  // will modify it.
  var moduleExtend = function(obj, extensions) {
    extensions.forEach(function (extension) {
      extension.call(obj, obj);
    });
  };
  
  // Extend either an object (props) or a list 
  // of modules (mods) based on a list of extensions 
  // that may be a mix of both.
  var extend = function(props, mods, extensions) {
    extensions.forEach(function (extension) {
      if (typeof extension === "function") {
        mods.push(extension);
      } else if (typeof extension === "object"){
        objectExtend(props, extension);
      }
    });
  };
  
  // Perform a deep copy of a value.
  var deepCopy = function deepCopy(val) {
    var result;
    
    if (Array.isArray(val)) {
      result = [];
      val.forEach(function(elem) {
        result.push(deepCopy(elem));
      });
    } else if (val && typeof val === "object") {
      result = Object.create(Object.getPrototypeOf(val));
      Object.keys(val).forEach(function(key) {
        result[key] = deepCopy(val[key]);
      });
    } else {
      result = val;
    }
    
    return result;
  };

  ///////////////////////////////////
  //  oFactory Function
  ///////////////////////////////////
  
  var oFactory = function(proto) {
    var sealed = false;
    var frozen = false;
  
    // The created factory function
    //
    // The +props+ argument is an object or function
    // using to define properties on the created object
    // when the factory function is actually called.
    var factory = function(props) {
      var obj;                    // The created object
      var specs = factory.specs;  // Object creation specs
      props = props || {};        // Additional properties given as argument
      
      // Object creation
      obj = Object.create(specs.proto);
    
      objectExtend(obj, specs.instance_properties);
      moduleExtend(obj, specs.instance_modules);
      if (typeof props === "function") {
        props.call(obj, obj);
      } else {
        objectExtend(obj, props, true);
      }    
      
      moduleExtend(obj, specs.inits);
      
      if (sealed) Object.seal(obj);
      if (frozen) Object.freeze(obj);
      
      return obj;
    };
    
    // Specs property holds description of 
    // how to create an object.
    factory.specs = {
      proto: proto || {},      // Prototype
      instance_modules: [],    // Function modifiers
      instance_properties: {}, // Default properties
      inits: []                // Post-creation initialization functions
    };
    
    ///////////////////////////////////
    //  Factory methods
    ///////////////////////////////////
    
    // Add descriptions of how the created object should be prepared.
    // Arguments can be objects that define properties directly
    // or functions that describe the modification.
    factory.mixin = function() {
      extend(this.specs.instance_properties, this.specs.instance_modules, Array.prototype.slice.call(arguments));
      
      return this;
    };
    
    // Modify the prototype.
    // Arguments can be objects that define properties directly
    // or functions that describe the modification.
    factory.share = function() {
      var extensions = Array.prototype.slice.call(arguments);
      var specs = this.specs;
      var mods = [];
      
      extensions.forEach(function(extension) {
        if (typeof extension === "function") {
          mods.push(extension);
        } else if (typeof extension === "object"){
          objectExtend(specs.proto, extension, true);
        }
      });
      
      moduleExtend(specs.proto, mods);
      
      return this;
    };
    
    // Describe post-creation initialization.
    // Argument is a single function that will be run
    // after all other object preparation is complete.
    factory.init = function(f) {
      this.specs.inits.push(f);
      
      return this;
    };
    
    // The factory will create frozen objects.
    factory.freeze = function() {
      frozen = true;
      
      return this;
    }
   
    // The factory will create sealed objects.
    factory.seal = function() {
      sealed = true;
      
      return this;
    }
    
    // Compose this factory with another.
    // Wrapper around oFactory.compose()
    factory.compose = function() {
      var factories = [this].concat(Array.prototype.slice.call(arguments));
      
      return oFactory.compose.apply(oFactory, factories)
    }
    
    return factory;
  };
  
  // Create a factory that is a composition of the factories
  // passed as arguments. Factory definitions are
  // applied in the order they are given so later definitions
  // are given priority.
  oFactory.compose = function() {
    var comp = oFactory();
    comp.specs = {
      proto: {},
      instance_modules: [],
      instance_properties: {},
      inits: []
    }
    
    Array.prototype.slice.call(arguments).forEach(function(f) {
      objectExtend(comp.specs.proto, f.specs.proto);
      objectExtend(comp.specs.instance_properties, f.specs.instance_properties)
      Array.prototype.push.apply(comp.specs.instance_modules, f.specs.instance_modules);
      Array.prototype.push.apply(comp.specs.inits, f.specs.inits);
    });
        
    return comp;
  };
  
  return oFactory;
})();

