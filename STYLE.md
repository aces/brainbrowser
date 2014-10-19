BrainBrowser Coding Style Guidelines
====================================

Variable Naming
---------------

BrainBrowser uses conventions for naming variables that differ somewhat from most JavaScript projects. In particular, we differentiate between **data** and **function** variables. **Function variables** are references to functions. **Data variables** are references to anything else.

**Data variables** should be underscored:

```JavaScript
  var a_number = 1;
  var this_is_a_string = "string";
```

**Function variables** should be camel-cased:

```JavaScript
  function addTheseTwoNumbers(x, y) {
    return x + y;
  }
```

The same principle holds for object property names:

```JavaScript
  var my_object = {
    first_number: 1,
    second_number: 2,
    addNumbers: function() {
      return this.first_number + this.second_number;
    }
  };
```

Variable Declarations
---------------------

Variable declarations should appear at the beginning of the function scope they appear in, immediately after any validity checks or setting of defaults on the arguments. Each line declaring variables should start with **var** and end with a semicolon. Variables that are defined when declared should be written one per line and should appear before declarations without a definition. Declarations without a definition can be grouped together on a line and separated by commas. 

```JavaScript
  
  function myFunc(arg) {
    arg = arg || "Hello";
    
    var a_string = "This is a string";
    var a_number = 5;
    var object1, object2, object3;
  }
  
```

Strict Mode
-----------

All code should be running in local strict mode. Generally, this means that any new file should either define a single function that begins with a **use strict** pragma or have all its code wrapped in an [IIFE](http://en.wikipedia.org/wiki/Immediately-invoked_function_expression) that begins with a **use strict** pragma.

```JavaScript
  (function() {
    "use strict";

    // Rest of the code...
    
  })();
``` 

Indentation
-----------

Two spaces.

Semicolons
----------

Always.

Quotes
------

In general, the code tends toward double quoting strings. It's acceptable to use single quotes if it keeps you from having to escape double quotes in the string itself.

```JavaScript
  var a_string = "Hello";
  throw new Error('Variable "a_string" is set to "Hello"!');
```

Equality
--------

Use strict equality always.

```JavaScript
  if (1 === 1 && false !== 0) {
    // Works like it should!
  }
```

Constructors
------------

Don't write any. If you want a function to create objects, write a factory function instead.

```JavaScript
  function createObject() {
    var obj = {
      // Add properties to obj...
    };

    return obj;
  }
```

Prototypes and `this`
---------------------
Generally avoid them unless necessary. The preference in BrainBrowser is to use flat objects with [functional inheritance](http://julien.richard-foy.fr/blog/2011/10/30/functional-inheritance-vs-prototypal-inheritance/) for code reuse and modularization.

```JavaScript
  function addMethod(obj) {
    
    obj.newMethod = function() {
      //...
    };
  
  }
  
  function createObject() {
    var obj = {};
    
    addMethod(obj);
    
    return obj;
  }
```

