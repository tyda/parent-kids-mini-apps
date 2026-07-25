const assert = require('assert');
const { prompts, TOTAL_ROUNDS, ROUND_SECONDS, pickDifferentIndex, pickPrompt, stars, finishMessage } = require('./app.js');

assert.strictEqual(TOTAL_ROUNDS, 5, '遊戲應固定為五回合');
assert.strictEqual(ROUND_SECONDS, 30, '每回合預設 30 秒');
assert.ok(prompts.length >= 18, '題庫至少需要 18 題，避免太快重複');

for (const prompt of prompts) {
  assert.ok(prompt.emoji, '每題都要有提示圖示');
  assert.ok(prompt.word.length >= 1, '每題都要有答案');
  assert.ok(prompt.tip.length >= 10, '每題都要有可用的畫圖提示');
}
assert.strictEqual(new Set(prompts.map(item => item.word)).size, prompts.length, '答案不可重複');

assert.strictEqual(pickDifferentIndex(1, 0, () => 0), 0);
assert.strictEqual(pickDifferentIndex(20, 0, () => 0), 1, '新題不可與上一題相同');
assert.strictEqual(pickDifferentIndex(20, 3, () => 0.1), 2);
const chosen = pickPrompt(0, () => 0);
assert.strictEqual(chosen.index, 1);
assert.strictEqual(chosen.word, prompts[1].word);

assert.strictEqual(stars(0), '☆ ☆ ☆ ☆ ☆');
assert.strictEqual(stars(3), '★ ★ ★ ☆ ☆');
assert.strictEqual(stars(9), '★ ★ ★ ★ ★');
assert.strictEqual(stars(-2), '☆ ☆ ☆ ☆ ☆');
assert.match(finishMessage(5), /5 顆星/);
assert.match(finishMessage(3), /3 顆星/);
assert.match(finishMessage(1), /1 顆星/);

console.log('tiny-one-line-drawing core tests passed');
