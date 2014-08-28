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
