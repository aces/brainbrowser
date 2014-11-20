/*
* BrainBrowser: Web-based Neurological Visualization Tools
* (https://brainbrowser.cbrain.mcgill.ca)
*
* Copyright (C) 2011
* The Royal Institution for the Advancement of Learning
* McGill University
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
* Author: Nicolas Kassis
* Author: Tarek Sherif <tsherif@gmail.com> (http://tareksherif.ca/)
*/

(function() {
  "use strict";

  /**
  * @doc function
  * @name BrainBrowser.static methods:createTreeStore
  * @returns {object} Tree store object.
  * 
  * @description
  * Factory function to create a flexible tree storage abstract data type.
  * ```js
  * BrainBrowser.createTreeStore();
  * ```
  */
  BrainBrowser.createTreeStore = function() {

    var tree = {};

    return {

      /**
      * @doc function
      * @name BrainBrowser.tree store:set
      * @param {multiple} keys Keys that indicate the path to the node of the tree where to store the value.
      * @param {any} value Final argument given is the value to be stored.
      *
      * @description
      * Store a value in a tree structure of arbitrary arity.
      *
      * ```js
      * var ts = BrainBrowser.createTreeStore();
      * ts.set(x, y, z, "Some text about this point.");
      * ts.set("annotations", x, y, z, { image: "brain.png", article: "paper.pdf" });
      * ```
      *
      */
      set: function() {
        var value = arguments[arguments.length - 1];
        var keys = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
        var subtree = tree;
        var current_key;
        var i, count;
        var error_message;

        for (i = 0, count = keys.length - 1; i < count; i++) {
          current_key = keys[i];
          if (subtree[current_key] && typeof subtree[current_key] !== "object") {
            error_message = "Hash key '[" + keys.slice(0, i + 1).join("][") +
              "]' has already been set to a non-object value.\n" +
              "Cannot set '[" + keys.join("][") + "]'";

            BrainBrowser.events.triggerEvent("error", { message: error_message });
            throw new Error(error_message);
          }
          if (!subtree[current_key]) {
            subtree[current_key] = {};
          }

          subtree = subtree[current_key];
        }

        current_key = keys[i];

        subtree[current_key] = value;
      },

      /**
      * @doc function
      * @name BrainBrowser.tree store:get
      * @param {multiple} keys Keys that indicate the path to the node of the tree from which to retrieve the value.
      *
      * @returns {any} The value stored at the node (or **null** if it doesn't exist).
      *
      * @description
      * Retrieve a configuration parameter.
      *
      * ```js
      * var ts = BrainBrowser.createTreeStore();
      * ts.set(x, y, z, "Some text about this point.");
      * ts.get(x, y, z); // => returns "Some text about this point."
      * ```
      *
      */
      get: function() {
        var keys = Array.prototype.slice.call(arguments);
        var subtree = tree;
        var current_key;
        var i, count;

        if (keys.length === 0) {
          return tree;
        }

        for (i = 0, count = keys.length - 1; i < count; i++) {
          current_key = keys[i];
          if (subtree[current_key] === undefined) {
            return null;
          }
          subtree = subtree[current_key];
        }

        current_key = keys[i];

        return subtree[current_key] !== undefined ? subtree[current_key] : null;
      },

      /**
      * @doc function
      * @name BrainBrowser.tree store:remove
      * @param {multiple} keys Keys that indicate the  path to the node to remove.
      *
      * @returns {any} The value stored at the node (or **null** if it doesn't exist).
      *
      * @description
      * Remove a node from the tree store.
      *
      * ```js
      * var ts = BrainBrowser.createTreeStore();
      * ts.set(x, y, z, "Some text about this point.");
      * ts.get(x, y, z); // => returns "Some text about this point."
      * ts.remove(x, y, z); 
      * ts.get(x, y, z); // => returns **null**
      * ```
      *
      */
      remove: function() {
        var keys = Array.prototype.slice.call(arguments);
        var subtree = tree;
        var current_key;
        var i, count;
        var result;


        for (i = 0, count = keys.length - 1; i < count; i++) {
          current_key = keys[i];
          if (subtree[current_key] === undefined) {
            return null;
          }
          subtree = subtree[current_key];
        }

        current_key = keys[i];

        result = subtree[current_key];

        subtree[current_key] = undefined;

        return result;
      },

      /**
      * @doc function
      * @name BrainBrowser.tree store:reset
      * @param {object} new_tree (Optional) new tree object to set this tree store to.
      *
      * @description
      * Reset the tree to the object given as **new_tree**. If no argument is given, the
      * tree store is cleared.
      *
      * ```js
      * var ts = BrainBrowser.createTreeStore();
      * ts.reset({ x: { y: "z" } });
      * ```
      *
      */
      reset: function(new_tree) {
        new_tree = (new_tree && typeof new_tree === "object") ? new_tree : {};

        tree = new_tree;
      },

      /**
      * @doc function
      * @name BrainBrowser.tree store:forEach
      * @param {number} depth The depth at which to iterate.
      * @param {function} callback Callback function to which
      * the tree nodes will be passed.
      *
      * @description
      * Iterate over tree nodes at a certain depth
      * and pass them to a callback function.
      * ```js
      * var ts = BrainBrowser.createTreeStore();
      * ts.reset({ x: { a: "z" , b: "y"} });
      * ts.forEach(2, function(node) {  // => prints "z" and "y"
      *  console.log(node);
      * }); 
      * ```
      */
      forEach: function(depth, callback) {
        depth = depth > 0 ? depth : 1;
        
        forEach(tree, 1, depth, callback);
      }
    };

  };

  function forEach(subtree, depth, max_depth, callback) {
    if (depth > max_depth) {
      return callback(subtree);
    }

    Object.keys(subtree).forEach(function(key) {
      forEach(subtree[key], depth + 1, max_depth, callback);
    });
  }

})();
