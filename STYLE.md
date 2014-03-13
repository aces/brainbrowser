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

Variable declarations should appear at the beginning of the function scope they appear in. Each line declaring variables should start with **var** and end with a semicolon. Variables that are defined when declared should be written one per line. Variable declarations that don't include a definition can be grouped together on a line and separated by commas. 

```JavaScript
  var a_string = "This is a string";
  var a_number = 5;
  var object1, object2, object3;
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

In general, the code tends toward double quoting strings. It's acceptable to use single quotes if it keeps you from having to escape things in the string.

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
----------------------

Don't write any. If you want a function to create objects, write a factory function instead.

```JavaScript
  function createObject() {
    var obj = Object.create(proto);

    // Add properties to obj...

    return obj;
  }
```

