"use strict";

const assert = require("node:assert/strict");
const { ROUND_COUNT, PUZZLES, shuffle, buildDeck, evaluatePick, addReasonStar } = require("./app.js");

assert.equal(ROUND_COUNT, 6);
assert.ok(PUZZLES.length >= 10, "題庫應足以讓重玩有變化");
assert.ok(PUZZLES.every((puzzle) => puzzle.items.length === 4), "每題必須正好有四張圖卡");
assert.ok(PUZZLES.every((puzzle) => puzzle.items.some(([id]) => id === puzzle.odd)), "參考答案必須存在於圖卡中");
assert.equal(new Set(PUZZLES.map((puzzle) => puzzle.id)).size, PUZZLES.length, "題目 id 不可重複");

const reversed = shuffle([1, 2, 3, 4], () => 0);
assert.deepEqual(reversed, [2, 3, 4, 1]);
const source = [1, 2, 3];
shuffle(source, () => 0);
assert.deepEqual(source, [1, 2, 3], "shuffle 不可改動輸入陣列");

const deck = buildDeck(() => 0, 6);
assert.equal(deck.length, 6);
assert.equal(new Set(deck.map((puzzle) => puzzle.id)).size, 6, "單局不可出現重複題目");
assert.equal(buildDeck(() => .5, 99).length, PUZZLES.length, "不可抽超過題庫數量");

const puzzle = PUZZLES[0];
assert.equal(evaluatePick(puzzle, puzzle.odd).matchesReference, true);
assert.equal(evaluatePick(puzzle, "not-reference").matchesReference, false);
assert.equal(evaluatePick(puzzle, puzzle.odd).reason, puzzle.reason);

assert.deepEqual(addReasonStar(3, 0), { total: 4, earnedThisRound: 1 });
assert.deepEqual(addReasonStar(4, 2), { total: 4, earnedThisRound: 2 }, "每題最多兩顆理由星");

console.log("tiny-odd-one-lab core tests: PASS");
