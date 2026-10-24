"use strict";
const assert = require("node:assert/strict");
const G = require("./app.js");
const {SIGNALS, WORDS, MISSIONS, CODE_LENGTH} = G;

// 詞彙與密碼本
assert.equal(SIGNALS.length, 3);
assert.equal(WORDS.length, 8);
assert.equal(new Set(WORDS.map(w => w.id)).size, WORDS.length);
assert.equal(G.allCodes().length, 9);
assert.ok(MISSIONS.length >= 4);

// 隨機數可重現
const r1 = G.mulberry32(42), r2 = G.mulberry32(42);
for (let i = 0; i < 5; i++) assert.equal(r1(), r2());

// 每回合：密碼本不重複、訊息不重複、同 seed 結果相同
for (let seed = 1; seed <= 50; seed++) {
  for (let index = 0; index < 6; index++) {
    const round = G.makeRound(seed, index, 3);
    assert.deepEqual(round, G.makeRound(seed, index, 3), "deterministic");
    const codes = Object.values(round.codebook).map(c => c.join(""));
    assert.equal(new Set(codes).size, WORDS.length, "unique codes");
    assert.equal(round.message.length, 3);
    assert.equal(new Set(round.message).size, 3, "no repeated words");
    for (const id of round.message) assert.ok(round.codebook[id]);
    assert.ok(round.mission >= 0 && round.mission < MISSIONS.length);
    assert.deepEqual(G.decodeSignals(round.codebook, G.expectedCode(round)), round.message, "round trip");
  }
}
// 任務與密碼本會換
const seq = [0, 1, 2, 3].map(i => G.makeRound(7, i, 2));
assert.equal(new Set(seq.map(r => r.mission)).size, 4, "missions change each round");
assert.ok(new Set(seq.map(r => JSON.stringify(r.codebook))).size > 1, "codebook changes");

// 選項驗證
assert.throws(() => G.createGame({length: 5}), RangeError);
assert.throws(() => G.createGame({rounds: 3}), RangeError);

// 完整流程：完美回合
let game = G.createGame({seed: 2026, length: 2, rounds: 4});
assert.equal(game.phase, "ready");
assert.equal(G.progressText(game), "第 1／4 回合 · 團隊星星 ⭐ 0");
assert.deepEqual(G.roles(game), {encoder: 0, decoder: 1});
assert.equal(G.pressSignal(game, "r"), game, "cannot press before encode");
assert.equal(G.send(game), game);
game = G.startEncode(game);
assert.equal(game.phase, "encode");
assert.throws(() => G.pressSignal(game, "x"), RangeError);
const code = G.expectedCode(game.current);
assert.equal(code.length, 2 * CODE_LENGTH);
for (const id of code) game = G.pressSignal(game, id);
assert.equal(G.pressSignal(game, "r"), game, "capped at needed signals");
assert.equal(G.canSend(game), true);
game = G.undoSignal(game);
assert.equal(game.sent.length, 3);
assert.equal(G.send(game), game, "incomplete cannot send");
game = G.pressSignal(game, code[3]);
game = G.send(game);
assert.equal(game.phase, "handoff");
assert.equal(G.pressSignal(game, "r"), game, "locked after send");
game = G.backToEncode(game);
assert.equal(game.phase, "encode");
game = G.send(game);
assert.equal(G.chooseGuess(game, 0, "apple"), game, "cannot guess before decode");
game = G.startDecode(game);
assert.equal(game.phase, "decode");
assert.equal(G.submitGuess(game), game, "empty guess cannot submit");
assert.throws(() => G.chooseGuess(game, 5, "apple"), RangeError);
assert.throws(() => G.chooseGuess(game, 0, "nope"), RangeError);
game.current.message.forEach((id, i) => { game = G.chooseGuess(game, i, id); });
game = G.submitGuess(game);
assert.equal(game.phase, "result");
assert.equal(game.stars, 2);
assert.equal(game.history[0].stars, 2);
assert.ok(game.history[0].slots.every(s => s.correct && s.encodedOk && s.decodedOk));

// 第二回合：交換角色，編碼打錯一組
game = G.nextRound(game);
assert.equal(game.phase, "ready");
assert.equal(game.round, 1);
assert.deepEqual(G.roles(game), {encoder: 1, decoder: 0});
assert.deepEqual(game.sent, []);
assert.deepEqual(game.guess, [null, null]);
game = G.startEncode(game);
const right = G.expectedCode(game.current);
const wrongGroup = G.allCodes().find(c => c.join("") !== right.slice(0, 2).join(""));
for (const id of [...wrongGroup, ...right.slice(2)]) game = G.pressSignal(game, id);
game = G.startDecode(G.send(game));
const decoded = G.decodeSignals(game.current.codebook, game.sent);
// 解碼員照燈號誠實解碼（第一組可能是密碼本外的空碼）
const fallback = WORDS.find(w => w.id !== game.current.message[0]).id;
game = G.chooseGuess(game, 0, decoded[0] && decoded[0] !== game.current.message[0] ? decoded[0] : fallback);
game = G.chooseGuess(game, 1, decoded[1]);
game = G.submitGuess(game);
const slots = game.history[1].slots;
assert.equal(slots[0].encodedOk, false);
assert.equal(slots[0].correct, false);
assert.equal(slots[1].correct, true);
assert.equal(game.stars, 3);

// 收尾兩回合
for (let r = 2; r < 4; r++) {
  game = G.startEncode(G.nextRound(game));
  for (const id of G.expectedCode(game.current)) game = G.pressSignal(game, id);
  game = G.startDecode(G.send(game));
  game = G.chooseGuess(game, 0, game.current.message[0]);
  game = G.chooseGuess(game, 1, game.current.message[0]);
  game = G.submitGuess(game);
}
assert.equal(game.stars, 5);
game = G.nextRound(game);
assert.equal(game.phase, "finished");
assert.equal(G.progressText(game), "任務完成！團隊星星 ⭐ 5／8");
assert.equal(G.nextRound(game), game);
assert.equal(G.maxStars(G.createGame({length: 3, rounds: 6})), 18);

// 9 個代碼裡有 1 個是空碼
const round = G.makeRound(1, 0, 2);
const used = new Set(Object.values(round.codebook).map(c => c.join("")));
const spare = G.allCodes().find(c => !used.has(c.join("")));
assert.deepEqual(G.decodeSignals(round.codebook, spare), [null]);
assert.deepEqual(G.groupSignals(["r", "y", "b"]), [["r", "y"], ["b"]]);
assert.deepEqual(G.decodeSignals(round.codebook, ["r"]), [null]);

assert.match(G.cheer(8, 8), /完美/);
assert.ok(G.cheer(0, 8).length > 0);
console.log("tiny-secret-signal core tests: PASS");
