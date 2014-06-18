QUnit.test("tree_store.set()", function(assert) {
  var ts = BrainBrowser.createTreeStore();

  ts.set(1, 2, 3, "item");
  assert.strictEqual(ts.get(1, 2, 3), "item");
});

QUnit.test("tree_store.remove()", function(assert) {
  var ts = BrainBrowser.createTreeStore();

  ts.set(1, 2, 3, "item");
  assert.strictEqual(ts.remove(1, 2, 3), "item");
  assert.strictEqual(ts.get(1, 2, 3), null);
});

QUnit.test("tree_store.reset() with no arguments", function(assert) {
  var ts = BrainBrowser.createTreeStore();

  ts.set(1, 2, 3, "item");
  assert.strictEqual(ts.get(1, 2, 3), "item");
  ts.reset();
  assert.deepEqual(ts.get(), {});
});

QUnit.test("tree_store.reset() with arguments", function(assert) {
  var ts = BrainBrowser.createTreeStore();
  var tree = {x: {y: "z"}};
  ts.reset(tree);
  assert.deepEqual(ts.get(), tree);
});

QUnit.test("tree_store.forEach()", function(assert) {
  var ts = BrainBrowser.createTreeStore();
  var result = [];
  var items = ["item1", "item2", "item3", "item4"]

  ts.set(1, 2, 3, items[0]);
  ts.set(1, 2, 4, items[1]);
  ts.set(1, 3, 4, items[2]);
  ts.set("a", "b", "c", items[3]);
  ts.forEach(3, function(item) {
    result.push(item);
  });

  assert.deepEqual(result, items);
});
