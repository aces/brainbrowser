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

function testException(assert, test, prevent_logging) {
  var console_log, console_error;
  
  if (prevent_logging) {
    console_log = console.log;
    console_error = console.error;
    console.log = function() {};
    console.error = function() {};
  }

  try {
    test();
    assert.ok(true);
  } catch (exception) {
    assert.ok(false);
  }

  if (prevent_logging) {
    console.log = console_log;
    console.error = console_error;
  }
}

QUnit.test("Listen for and trigger an event.", function(assert) {
  var o = {};
  var triggered = false;

  BrainBrowser.events.addEventModel(o);

  o.addEventListener("event", function() { triggered = true; });

  o.triggerEvent("event");

  assert.ok(triggered);
});

QUnit.test("Set 'this' to triggering object", function(assert) {
  var o = {};

  BrainBrowser.events.addEventModel(o);

  o.addEventListener("event", function() { 
    assert.strictEqual(this, o);
  });

  o.triggerEvent("event");
});

QUnit.test("Pass event object to an handler", function(assert) {
  var o = {};

  BrainBrowser.events.addEventModel(o);

  o.addEventListener("event", function(event) { 
    assert.notStrictEqual(event, undefined);
  });

  o.triggerEvent("event");
});

QUnit.test("Default event object should have 'target' and 'name' set", function(assert) {
  var o = {};

  BrainBrowser.events.addEventModel(o);

  o.addEventListener("event", function(event) { 
    assert.strictEqual(event.name, "event");
    assert.strictEqual(event.target, o);
  });

  o.triggerEvent("event");
});

QUnit.test("Pass event object", function(assert) {
  var o = {};

  BrainBrowser.events.addEventModel(o);

  o.addEventListener("event", function(event) { 
    assert.strictEqual(event.test, "test");
  });

  o.triggerEvent("event", {test: "test"});
});

QUnit.test("Passed event object should have 'target' and 'name' set", function(assert) {
  var o = {};

  BrainBrowser.events.addEventModel(o);

  o.addEventListener("event", function(event) { 
    assert.strictEqual(event.name, "event");
    assert.strictEqual(event.target, o);
    assert.strictEqual(event.test, "test");
  });

  o.triggerEvent("event", {test: "test"});
});

QUnit.test("Don't allow override of event object 'target' and 'name'", function(assert) {
  var o = {};

  BrainBrowser.events.addEventModel(o);

  o.addEventListener("event", function(event) { 
    assert.strictEqual(event.name, "event");
    assert.strictEqual(event.target, o);
  });

  o.triggerEvent("event", {name: "wrong", target: "wrong"});
});

QUnit.test("Event handlers should not throw exceptions", function(assert) {
  var o = {};

  BrainBrowser.events.addEventModel(o);

  o.addEventListener("event", function() { 
    throw "Error";
  });

  testException(assert, function() {
    o.triggerEvent("event");
  }, true);
});

QUnit.test("Use '*' listen for any event", function(assert) {
  var o = {};
  var triggered = false;

  BrainBrowser.events.addEventModel(o);

  o.addEventListener("*", function() { triggered = true; });

  o.triggerEvent("event");

  assert.ok(triggered);
});

QUnit.test("Pass default event object to '*' listener", function(assert) {
  var o = {};

  BrainBrowser.events.addEventModel(o);

  o.addEventListener("*", function(event) { 
    assert.strictEqual(event.name, "event");
    assert.strictEqual(event.target, o);
  });

  o.triggerEvent("event");
});

QUnit.test("Pass event object to '*' listener", function(assert) {
  var o = {};

  BrainBrowser.events.addEventModel(o);

  o.addEventListener("*", function(event) { 
    assert.strictEqual(event.test, "test");
  });

  o.triggerEvent("event", {test: "test"});
});

QUnit.test("Passed event object should have 'target' and 'name' set in '*' listener", function(assert) {
  var o = {};

  BrainBrowser.events.addEventModel(o);

  o.addEventListener("*", function(event) { 
    assert.strictEqual(event.name, "event");
    assert.strictEqual(event.target, o);
    assert.strictEqual(event.test, "test");
  });

  o.triggerEvent("event", {test: "test"});
});

QUnit.test("Don't allow override of event object 'target' and 'name' in '*' listener", function(assert) {
  var o = {};

  BrainBrowser.events.addEventModel(o);

  o.addEventListener("*", function(event) { 
    assert.strictEqual(event.name, "event");
    assert.strictEqual(event.target, o);
  });

  o.triggerEvent("event", {name: "wrong", target: "wrong"});
});

QUnit.test("Set 'this' to triggering object when listening for '*'", function(assert) {
  var o = {};

  BrainBrowser.events.addEventModel(o);

  o.addEventListener("*", function() { 
    assert.strictEqual(this, o);
  });

  o.triggerEvent("event");
});

QUnit.test("'*'' handlers should not throw exceptions", function(assert) {
  var o = {};

  BrainBrowser.events.addEventModel(o);

  o.addEventListener("*", function() { 
    throw "Error";
  });

  testException(assert, function() {
    o.triggerEvent("event");
  }, true);
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

QUnit.test("Propagate events uniquely", function(assert) {
  var source = {};
  var target = {};
  var count = 0;

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  source.propagateEventTo("event", target);
  source.propagateEventTo("event", target);
  target.addEventListener("event", function() { count++; });

  source.triggerEvent("event");

  assert.strictEqual(count, 1);
});

QUnit.test("Propagate event object", function(assert) {
  var source = {};
  var target = {};
  var event_object = {prop: "prop"};

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  source.propagateEventTo("event", target);
  target.addEventListener("event", function(event) { 
    assert.deepEqual(event, event_object);
  });

  source.triggerEvent("event", event_object);
});

QUnit.test("Propagated event object should have source as target", function(assert) {
  var source = {};
  var target = {};
  var event_object = {prop: "prop"};

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  source.propagateEventTo("event", target);
  target.addEventListener("event", function(event) { 
    assert.strictEqual(event.target, source);
  });

  source.triggerEvent("event", event_object);
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

QUnit.test("Receive event object when propagating event from an object", function(assert) {
  var source = {};
  var target = {};
  var event_object = {prop: "prop"};

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  target.propagateEventFrom("event", source);
  target.addEventListener("event", function(event) { 
    assert.deepEqual(event, event_object);
  });

  source.triggerEvent("event", event_object);
});

QUnit.test("Set event object target to source when propagating event from an object", function(assert) {
  var source = {};
  var target = {};
  var event_object = {prop: "prop"};

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  target.propagateEventFrom("event", source);
  target.addEventListener("event", function(event) { 
    assert.strictEqual(event.target, source);
  });

  source.triggerEvent("event", event_object);
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

QUnit.test("Propagate events uniquely when using '*'", function(assert) {
  var source = {};
  var target = {};
  var count = 0;

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  source.propagateEventTo("event", target);
  source.propagateEventTo("*", target);
  target.addEventListener("event", function() { count++; });

  source.triggerEvent("event");

  assert.strictEqual(count, 1);
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

QUnit.test("Send event object when propagating all events using '*'", function(assert) {
  var source = {};
  var target = {};
  var event_object = {prop: "prop"};

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  source.propagateEventTo("*", target);
  target.addEventListener("event", function(event) { 
    assert.deepEqual(event, event_object);
  });

  source.triggerEvent("event", event_object);
});

QUnit.test("Set source event object target and name when propagating all events using '*'", function(assert) {
  var source = {};
  var target = {};
  var event_object = {prop: "prop"};

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  source.propagateEventTo("*", target);
  target.addEventListener("event", function(event) { 
    assert.strictEqual(event.name, "event");
    assert.strictEqual(event.target, source);
  });

  source.triggerEvent("event", event_object);
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

QUnit.test("Send event object when propagating all events from an object using '*'", function(assert) {
  var source = {};
  var target = {};
  var event_object = {prop: "prop"};

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  target.propagateEventFrom("*", source);
  target.addEventListener("event", function(event) { 
    assert.deepEqual(event, event_object);
  });

  source.triggerEvent("event", event_object);
});

QUnit.test("Set source event object target and name when propagating all events from an object using '*'", function(assert) {
  var source = {};
  var target = {};
  var event_object = {prop: "prop"};

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  target.propagateEventFrom("*", source);
  target.addEventListener("event", function(event) { 
    assert.strictEqual(event.name, "event");
    assert.strictEqual(event.target, source);
  });

  source.triggerEvent("event", event_object);
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

QUnit.test("List direct propagation targets", function(assert) {
  var source = {};
  var target = {};

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  source.propagateEventTo("event", target);

  assert.deepEqual(source.directPropagationTargets("event"), [target]);
});

QUnit.test("directPropagationTargets() should list multiple propagation targets", function(assert) {
  var source = {};
  var target1 = {};
  var target2 = {};

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target1);
  BrainBrowser.events.addEventModel(target2);

  source.propagateEventTo("event", target1);
  source.propagateEventTo("event", target2);

  assert.deepEqual(source.directPropagationTargets("event"), [target1, target2]);
});

QUnit.test("directPropagationTargets() should not list recursive targets", function(assert) {
  var source = {};
  var target1 = {};
  var target2 = {};

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target1);
  BrainBrowser.events.addEventModel(target2);

  source.propagateEventTo("event", target1);
  target1.propagateEventTo("event", target2);

  assert.deepEqual(source.directPropagationTargets("event"), [target1]);
});

QUnit.test("directPropagationTargets() should list propagation targets uniquely", function(assert) {
  var source = {};
  var target1 = {};
  var target2 = {};

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target1);
  BrainBrowser.events.addEventModel(target2);

  source.propagateEventTo("event", target1);
  source.propagateEventTo("event", target2);
  target1.propagateEventTo("event", target2);

  assert.deepEqual(source.directPropagationTargets("event"), [target1, target2]);
});

QUnit.test("directPropagationTargets() should list '*' propagation", function(assert) {
  var source = {};
  var target = {};

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  source.propagateEventTo("*", target);

  assert.deepEqual(source.directPropagationTargets("event"), [target]);
});

QUnit.test("directPropagationTargets() should list '*' propagation uniquely", function(assert) {
  var source = {};
  var target = {};

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  source.propagateEventTo("event", target);
  source.propagateEventTo("*", target);

  assert.deepEqual(source.directPropagationTargets("event"), [target]);
});

QUnit.test("directPropagationTargets() should default to listing all direct targets", function(assert) {
  var source = {};
  var target1 = {};
  var target2 = {};

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target1);
  BrainBrowser.events.addEventModel(target2);

  source.propagateEventTo("event", target1);
  source.propagateEventTo("event", target2);

  assert.deepEqual(source.directPropagationTargets(), [target1, target2]);
});

QUnit.test("List all propagation targets", function(assert) {
  var source = {};
  var target = {};

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  source.propagateEventTo("event", target);

  assert.deepEqual(source.allPropagationTargets("event"), [target]);
});

QUnit.test("allPropagationTargets() should list multiple propagation targets", function(assert) {
  var source = {};
  var target1 = {};
  var target2 = {};

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target1);
  BrainBrowser.events.addEventModel(target2);

  source.propagateEventTo("event", target1);
  source.propagateEventTo("event", target2);

  assert.deepEqual(source.allPropagationTargets("event"), [target1, target2]);
});

QUnit.test("allPropagationTargets() should list propagation targets recursively", function(assert) {
  var source = {};
  var target1 = {};
  var target2 = {};

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target1);
  BrainBrowser.events.addEventModel(target2);

  source.propagateEventTo("event", target1);
  target1.propagateEventTo("event", target2);

  assert.deepEqual(source.allPropagationTargets("event"), [target1, target2]);
});

QUnit.test("allPropagationTargets() should list propagation targets uniquely", function(assert) {
  var source = {};
  var target1 = {};
  var target2 = {};

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target1);
  BrainBrowser.events.addEventModel(target2);

  source.propagateEventTo("event", target1);
  source.propagateEventTo("event", target2);
  target1.propagateEventTo("event", target2);

  assert.deepEqual(source.allPropagationTargets("event"), [target1, target2]);
});

QUnit.test("allPropagationTargets() should list '*' propagation", function(assert) {
  var source = {};
  var target = {};

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  source.propagateEventTo("*", target);

  assert.deepEqual(source.allPropagationTargets("event"), [target]);
});

QUnit.test("allPropagationTargets() should list '*' propagation uniquely", function(assert) {
  var source = {};
  var target = {};

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  source.propagateEventTo("event", target);
  source.propagateEventTo("*", target);

  assert.deepEqual(source.allPropagationTargets("event"), [target]);
});

QUnit.test("allPropagationTargets() should default to listing all targets", function(assert) {
  var source = {};
  var target1 = {};
  var target2 = {};

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target1);
  BrainBrowser.events.addEventModel(target2);

  source.propagateEventTo("event", target1);
  target1.propagateEventTo("event", target2);

  assert.deepEqual(source.allPropagationTargets(), [target1, target2]);
});

QUnit.test("Throw an exception on attempts to propagate to an object without an event model", function(assert) {
  var source = {};

  BrainBrowser.events.addEventModel(source);

  assert.throws(function() {
      source.propagateEventTo("event", {});
    },
    /event model/
  );
});

QUnit.test("Throw an exception on attempts to propagate from BrainBrowser.events", function(assert) {
  var target = {};

  BrainBrowser.events.addEventModel(target);

  assert.throws(function() {
      BrainBrowser.events.propagateEventTo("event", target);
    },
    /cycle/
  );
});

QUnit.test("Throw an exception on cycles", function(assert) {
  var source = {};
  var target1 = {};
  var target2 = {};

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target1);
  BrainBrowser.events.addEventModel(target2);

  source.propagateEventTo("event", target1);
  target1.propagateEventTo("event", target2);

  assert.throws(function() {
      target2.propagateEventTo("event", source);
    },
    /cycle/
  );
});

QUnit.test("Stop propagating events", function(assert) {
  var source = {};
  var target = {};
  var triggered = false;

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  source.propagateEventTo("event", target);
  target.addEventListener("event", function() { triggered = true; });

  source.triggerEvent("event");

  assert.ok(triggered);

  triggered = false;

  source.stopPropagatingTo(target);
  source.triggerEvent("event");

  assert.strictEqual(triggered, false);
});

QUnit.test("Stop propagating events should only stop propagating to given object", function(assert) {
  var source = {};
  var target1 = {};
  var target2 = {};
  var triggered1 = false;
  var triggered2 = false;

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target1);
  BrainBrowser.events.addEventModel(target2);

  source.propagateEventTo("event", target1);
  source.propagateEventTo("event", target2);
  target1.addEventListener("event", function() { triggered1 = true; });
  target2.addEventListener("event", function() { triggered2 = true; });

  source.triggerEvent("event");

  assert.ok(triggered1);
  assert.ok(triggered2);

  triggered1 = false;
  triggered2 = false;

  source.stopPropagatingTo(target1);
  source.triggerEvent("event");

  assert.strictEqual(triggered1, false);
  assert.ok(triggered2);
});

QUnit.test("Stop propagating '*'", function(assert) {
  var source = {};
  var target = {};
  var triggered = false;

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  source.propagateEventTo("*", target);
  target.addEventListener("event", function() { triggered = true; });

  source.triggerEvent("event");

  assert.ok(triggered);

  triggered = false;

  source.stopPropagatingTo(target);
  source.triggerEvent("event");

  assert.strictEqual(triggered, false);
});

QUnit.test("Triggering 'eventmodelcleanup' event should stop propagation", function(assert) {
  var source = {};
  var target = {};
  var triggered = false;

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  source.propagateEventTo("event", target);
  target.addEventListener("event", function() { triggered = true; });

  source.triggerEvent("event");

  assert.ok(triggered);

  triggered = false;

  target.triggerEvent("eventmodelcleanup");
  source.triggerEvent("event");

  assert.strictEqual(triggered, false);
});

QUnit.test("Triggering 'eventmodelcleanup' event should not interfere with other propagation in a chain", function(assert) {
  var source = {};
  var target1 = {};
  var target2 = {};
  var triggered1 = false;
  var triggered2 = false;

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target1);
  BrainBrowser.events.addEventModel(target2);

  source.propagateEventTo("event", target1);
  target1.propagateEventTo("event", target2);
 
  target1.addEventListener("event", function() { triggered1 = true; });
  target2.addEventListener("event", function() { triggered2 = true; });

  source.triggerEvent("event");

  assert.ok(triggered1);
  assert.ok(triggered2);

  triggered1 = false;
  triggered2 = false;

  target1.triggerEvent("eventmodelcleanup");

  source.triggerEvent("event");
  assert.strictEqual(triggered1, false);
  assert.strictEqual(triggered2, false);

  target1.triggerEvent("event");
  assert.ok(triggered1);
  assert.ok(triggered2);
});

QUnit.test("Should not propagate unpropagated events", function(assert) {
  var source = {};
  var target = {};
  var triggered = false;

  BrainBrowser.events.unpropagatedEvent("unpropagated");

  BrainBrowser.events.addEventModel(source);
  BrainBrowser.events.addEventModel(target);

  source.propagateEventTo("unpropagated", target);
  target.addEventListener("unpropagated", function() { triggered = true; });

  source.triggerEvent("unpropagated");

  assert.strictEqual(triggered, false);
});
