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
* Author: Tarek Sherif <tsherif@gmail.com> (http://tareksherif.ca/)
*/

QUnit.test("Listen for and trigger an event.", function(assert) {
  var o = {};
  var triggered = false;

  BrainBrowser.events.addEventModel(o);

  o.addEventListener("event", function() { triggered = true; });

  o.triggerEvent("event");

  assert.ok(triggered);
});

QUnit.test("Pass arguments to an event", function(assert) {
  var o = {};
  var args = ["arg1", "arg2"];

  BrainBrowser.events.addEventModel(o);

  o.addEventListener("event", function(arg1, arg2) { 
    assert.deepEqual(args, [arg1, arg2]);
  });

  o.triggerEvent("event", args[0], args[1]);
});

QUnit.test("Set 'this' to triggering object", function(assert) {
  var o = {};

  BrainBrowser.events.addEventModel(o);

  o.addEventListener("event", function() { 
    assert.strictEqual(this, o);
  });

  o.triggerEvent("event");
});

QUnit.test("Use '*' listen for any event", function(assert) {
  var o = {};
  var triggered = false;

  BrainBrowser.events.addEventModel(o);

  o.addEventListener("*", function() { triggered = true; });

  o.triggerEvent("event");

  assert.ok(triggered);
});

QUnit.test("Pass event name to '*' listener", function(assert) {
  var o = {};
  var event_name = "event";

  BrainBrowser.events.addEventModel(o);

  o.addEventListener("*", function(arg1) { 
    assert.strictEqual(arg1, event_name); 
  });

  o.triggerEvent(event_name);
});

QUnit.test("Set 'this' to triggering object when listening for '*'", function(assert) {
  var o = {};

  BrainBrowser.events.addEventModel(o);

  o.addEventListener("*", function() { 
    assert.strictEqual(this, o);
  });

  o.triggerEvent("event");
});

QUnit.test("Propagate events", function(assert) {
  var source = {};
  var target = {};
  var triggered = false;

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  source.propagateEventTo("event", target);
  target.addEventListener("event", function() { triggered = true; });

  source.triggerEvent("event");

  assert.ok(triggered);
});

QUnit.test("Propagate event arguments", function(assert) {
  var source = {};
  var target = {};
  var args = ["arg1", "arg2"];

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  source.propagateEventTo("event", target);
  target.addEventListener("event", function(arg1, arg2) { 
    assert.deepEqual(args, [arg1, arg2]);
  });

  source.triggerEvent("event", args[0], args[1]);
});

QUnit.test("Propagate events to '*' listener", function(assert) {
  var source = {};
  var target = {};
  var triggered = false;

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  source.propagateEventTo("event", target);
  target.addEventListener("*", function() { triggered = true; });

  source.triggerEvent("event");

  assert.ok(triggered);
});

QUnit.test("Set 'this' to source object when propagating events", function(assert) {
  var source = {};
  var target = {};

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  source.propagateEventTo("event", target);
  target.addEventListener("event", function() { 
    assert.strictEqual(this, source);
  });

  source.triggerEvent("event");
});

QUnit.test("Set 'this' to source object when propagating events to '*' listener", function(assert) {
  var source = {};
  var target = {};

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  source.propagateEventTo("event", target);
  target.addEventListener("*", function() { 
    assert.strictEqual(this, source);
  });

  source.triggerEvent("event");
});

QUnit.test("Propagate event from an object", function(assert) {
  var source = {};
  var target = {};
  var triggered = false;

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  target.propagateEventFrom("event", source);
  target.addEventListener("event", function() { triggered = true; });

  source.triggerEvent("event");

  assert.ok(triggered);
});

QUnit.test("Receive arguments when propagating event from an object", function(assert) {
  var source = {};
  var target = {};
  var args = ["arg1", "arg2"];

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  target.propagateEventFrom("event", source);
  target.addEventListener("event", function(arg1, arg2) { 
    assert.deepEqual(args, [arg1, arg2]);
  });

  source.triggerEvent("event", args[0], args[1]);
});

QUnit.test("Set 'this' to source object when propagating event from an object", function(assert) {
  var source = {};
  var target = {};

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  target.propagateEventFrom("event", source);
  target.addEventListener("event", function() { 
    assert.strictEqual(this, source);
  });

  source.triggerEvent("event");
});

QUnit.test("Propagate any event from an object with the '*' listener", function(assert) {
  var source = {};
  var target = {};
  var triggered = false;

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  target.propagateEventFrom("event", source);
  target.addEventListener("*", function() { triggered = true; });

  source.triggerEvent("event");

  assert.ok(triggered);
});

QUnit.test("Set 'this' to source object when propagating events from an object to a '*' listener", function(assert) {
  var source = {};
  var target = {};

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  target.propagateEventFrom("event", source);
  target.addEventListener("*", function() { 
    assert.strictEqual(this, source);
  });

  source.triggerEvent("event");
});

QUnit.test("Propagate all events using '*'", function(assert) {
  var source = {};
  var target = {};
  var triggered = false;

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  source.propagateEventTo("*", target);
  target.addEventListener("event", function() { triggered = true; });

  source.triggerEvent("event");

  assert.ok(triggered);
});

QUnit.test("Set 'this' to source object when propagating all events using '*'", function(assert) {
  var source = {};
  var target = {};
  var triggered = false;

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  source.propagateEventTo("*", target);
  target.addEventListener("event", function() { 
      assert.strictEqual(this, source);
    });

  source.triggerEvent("event");
});

QUnit.test("Send arguments when propagating all events using '*'", function(assert) {
  var source = {};
  var target = {};
  var args = ["arg1", "arg2"];

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  source.propagateEventTo("*", target);
  target.addEventListener("event", function(arg1, arg2) { 
    assert.deepEqual(args, [arg1, arg2]);
  });

  source.triggerEvent("event", args[0], args[1]);
});

QUnit.test("Propagate all events from an object using '*'", function(assert) {
  var source = {};
  var target = {};
  var triggered = false;

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  target.propagateEventFrom("*", source);
  target.addEventListener("event", function() { triggered = true; });

  source.triggerEvent("event");

  assert.ok(triggered);
});

QUnit.test("Set 'this' to source object when propagating all events from an object using '*'", function(assert) {
  var source = {};
  var target = {};
  var triggered = false;

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  target.propagateEventFrom("*", source);
  target.addEventListener("event", function() { 
      assert.strictEqual(this, source);
    });

  source.triggerEvent("event");
});

QUnit.test("Send arguments when propagating all events from an object using '*'", function(assert) {
  var source = {};
  var target = {};
  var args = ["arg1", "arg2"];

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  target.propagateEventFrom("*", source);
  target.addEventListener("event", function(arg1, arg2) { 
    assert.deepEqual(args, [arg1, arg2]);
  });

  source.triggerEvent("event", args[0], args[1]);
});

QUnit.test("Propagate events to BrainBrowser.events", function(assert) {
  var source = {};
  var triggered = false;

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventListener("event", function() { triggered = true; });

  source.triggerEvent("event");

  assert.ok(triggered);
});

QUnit.test("Propagate events to BrainBrowser.events only once in a chain", function(assert) {
  var source = {};
  var target = {};
  var count = 0;

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  source.propagateEventTo("event", target);
  BrainBrowser.events.addEventListener("event", function() { count++; });

  source.triggerEvent("event");

  assert.strictEqual(count, 1);
});