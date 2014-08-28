QUnit.test("Listen for and trigger an event.", function(assert) {
  var o = {};
  var triggered = false;

  BrainBrowser.utils.addEventModel(o);

  o.addEventListener("event", function() { triggered = true; });

  o.triggerEvent("event");

  assert.ok(triggered);
});

QUnit.test("Pass arguments to an event", function(assert) {
  var o = {};
  var args = ["arg1", "arg2"];

  BrainBrowser.utils.addEventModel(o);

  o.addEventListener("event", function(arg1, arg2) { 
    assert.deepEqual(args, [arg1, arg2]);
  });

  o.triggerEvent("event", args[0], args[1]);
});

QUnit.test("Set 'this' to triggering object", function(assert) {
  var o = {};

  BrainBrowser.utils.addEventModel(o);

  o.addEventListener("event", function() { 
    assert.strictEqual(this, o);
  });

  o.triggerEvent("event");
});

QUnit.test("Use '*' listen for any event", function(assert) {
  var o = {};
  var triggered = false;

  BrainBrowser.utils.addEventModel(o);

  o.addEventListener("*", function() { triggered = true; });

  o.triggerEvent("event");

  assert.ok(triggered);
});

QUnit.test("Pass event name to '*' listener", function(assert) {
  var o = {};
  var event_name = "event";

  BrainBrowser.utils.addEventModel(o);

  o.addEventListener("*", function(arg1) { 
    assert.strictEqual(arg1, event_name); 
  });

  o.triggerEvent(event_name);
});

QUnit.test("Set 'this' to triggering object when listening for '*'", function(assert) {
  var o = {};

  BrainBrowser.utils.addEventModel(o);

  o.addEventListener("*", function() { 
    assert.strictEqual(this, o);
  });

  o.triggerEvent("event");
});

QUnit.test("Propagate events", function(assert) {
  var source = {};
  var target = {};
  var triggered = false;

  BrainBrowser.utils.addEventModel(source);
  BrainBrowser.utils.addEventModel(target);

  source.propagateEventTo("event", target);
  target.addEventListener("event", function() { triggered = true; });

  source.triggerEvent("event");

  assert.ok(triggered);
});

QUnit.test("Propagate event arguments", function(assert) {
  var source = {};
  var target = {};
  var args = ["arg1", "arg2"];

  BrainBrowser.utils.addEventModel(source);
  BrainBrowser.utils.addEventModel(target);

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

  BrainBrowser.utils.addEventModel(source);
  BrainBrowser.utils.addEventModel(target);

  source.propagateEventTo("event", target);
  target.addEventListener("*", function() { triggered = true; });

  source.triggerEvent("event");

  assert.ok(triggered);
});

QUnit.test("Set 'this' to source object when propagating events", function(assert) {
  var source = {};
  var target = {};

  BrainBrowser.utils.addEventModel(source);
  BrainBrowser.utils.addEventModel(target);

  source.propagateEventTo("event", target);
  target.addEventListener("event", function() { 
    assert.strictEqual(this, source);
  });

  source.triggerEvent("event");
});

QUnit.test("Set 'this' to source object when propagating events to '*' listener", function(assert) {
  var source = {};
  var target = {};

  BrainBrowser.utils.addEventModel(source);
  BrainBrowser.utils.addEventModel(target);

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

  BrainBrowser.utils.addEventModel(source);
  BrainBrowser.utils.addEventModel(target);

  target.propagateEventFrom("event", source);
  target.addEventListener("event", function() { triggered = true; });

  source.triggerEvent("event");

  assert.ok(triggered);
});

QUnit.test("Receive arguments when propagating event from an object", function(assert) {
  var source = {};
  var target = {};
  var args = ["arg1", "arg2"];

  BrainBrowser.utils.addEventModel(source);
  BrainBrowser.utils.addEventModel(target);

  target.propagateEventFrom("event", source);
  target.addEventListener("event", function(arg1, arg2) { 
    assert.deepEqual(args, [arg1, arg2]);
  });

  source.triggerEvent("event", args[0], args[1]);
});

QUnit.test("Set 'this' to source object when propagating event from an object", function(assert) {
  var source = {};
  var target = {};

  BrainBrowser.utils.addEventModel(source);
  BrainBrowser.utils.addEventModel(target);

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

  BrainBrowser.utils.addEventModel(source);
  BrainBrowser.utils.addEventModel(target);

  target.propagateEventFrom("event", source);
  target.addEventListener("*", function() { triggered = true; });

  source.triggerEvent("event");

  assert.ok(triggered);
});

QUnit.test("Set 'this' to source object when propagating events from an object to a '*' listener", function(assert) {
  var source = {};
  var target = {};

  BrainBrowser.utils.addEventModel(source);
  BrainBrowser.utils.addEventModel(target);

  target.propagateEventFrom("event", source);
  target.addEventListener("*", function() { 
    assert.strictEqual(this, source);
  });

  source.triggerEvent("event");
});
