'use strict';
const assert = require('node:assert/strict');
const { ITEMS, THEMES, createGame, toggle, advance } = require('./app.js');
const game = createGame(() => 0.3);
assert.equal(game.round, 0);
assert.equal(new Set(game.themes).size, 5);
assert.equal(new Set(game.items).size, 8);
assert.equal(ITEMS.length >= 8, true);
assert.equal(THEMES.length >= 5, true);
assert.equal(advance(game), game);
let s = toggle(game, game.items[0]);
assert.equal(game.selected.length, 0);
s = toggle(s, game.items[1]);
s = toggle(s, game.items[2]);
assert.equal(toggle(s, game.items[3]), s);
assert.equal(toggle(s, -1), s);
assert.equal(toggle(s, s.selected[0]).selected.length, 2);
for (let r = 0; r < 5; r++) {
  if (r) for (const id of s.items.slice(0, 3)) s = toggle(s, id);
  s = advance(s);
  assert.equal(s.round, r + 1);
  assert.equal(s.exhibits.length, r + 1);
}
assert.equal(s.done, true);
assert.equal(advance(s), s);
assert.equal(toggle(s, s.items[0]), s);
assert.equal(createGame(() => 0).exhibits.length, 0);
console.log('pocket-museum: deterministic deck, selection cap, immutability, five rounds, end/restart PASS');
