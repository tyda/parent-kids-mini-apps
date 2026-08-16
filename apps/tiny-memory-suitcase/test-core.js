"use strict";

const assert = require("node:assert/strict");
const { ITEMS, createGame, getChoices, addItem, isComplete } = require("./app.js");

function fixedRandom() { return 0.42; }

const game = createGame(5, fixedRandom);
assert.equal(game.goal, 5);
assert.equal(game.sequence.length, 1);
assert.equal(game.deck.length, ITEMS.length - 1);
assert.equal(new Set(game.deck.map((item) => item.name)).size, game.deck.length, "deck items must be unique");
assert.equal(getChoices(game).length, 3);
assert.equal(isComplete(game), false);

const firstChoice = getChoices(game)[1];
const turnTwo = addItem(game, firstChoice.name);
assert.equal(turnTwo.sequence.length, 2);
assert.equal(turnTwo.sequence[1].name, firstChoice.name);
assert.equal(turnTwo.turn, 2);
assert.equal(game.sequence.length, 1, "addItem must not mutate previous state");
assert.equal(turnTwo.deck.some((item) => item.name === firstChoice.name), false);

let completed = turnTwo;
while (!isComplete(completed)) {
  completed = addItem(completed, getChoices(completed)[0].name);
}
assert.equal(completed.sequence.length, 5);
assert.equal(new Set(completed.sequence.map((item) => item.name)).size, 5);
assert.throws(() => addItem(completed, completed.deck[0].name), /already complete/);
assert.throws(() => createGame(4), /goal/);
assert.throws(() => addItem(game, "不存在的物品"), /not available/);

console.log("PASS tiny-memory-suitcase: 15 assertions");
