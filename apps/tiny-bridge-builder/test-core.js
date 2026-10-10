"use strict";
const assert = require("node:assert/strict");
const {ROUTES, N, E, S, W, rotate, direction, makeLevel, isConnected, turnTile} = require("./app.js");
assert.equal(ROUTES.length, 5);
assert.equal(rotate(N), E);
assert.equal(rotate(E), S);
assert.equal(rotate(S), W);
assert.equal(rotate(W), N);
assert.equal(direction(4, 5), E);
assert.throws(() => direction(3, 4));
for (const [i, route] of ROUTES.entries()) {
  assert.equal(route[0], 4);
  assert.equal(route.at(-1), 11);
  assert.equal(new Set(route).size, route.length);
  const level = makeLevel(route, i);
  assert.equal(level.tiles.length, 16);
  assert.equal(isConnected(level.solution), true, `level ${i} solution connects`);
  assert.equal(isConnected(level.tiles), false, `level ${i} starts unsolved`);
  let board = level.tiles;
  for (let cell = 0; cell < 16; cell++) {
    let count = 0;
    while (board[cell] !== level.solution[cell] && count++ < 4) board = turnTile(board, cell);
    assert.equal(board[cell], level.solution[cell]);
  }
  assert.equal(isConnected(board), true);
}
const level = makeLevel(ROUTES[0]);
const changed = turnTile(level.tiles, 4);
assert.notEqual(changed[4], level.tiles[4]);
assert.deepEqual(changed.filter((_, i) => i !== 4), level.tiles.filter((_, i) => i !== 4));
assert.throws(() => turnTile(level.tiles, -1), RangeError);
assert.equal(isConnected([]), false);
console.log("tiny-bridge-builder core tests: PASS");
