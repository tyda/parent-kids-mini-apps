const assert = require('assert');
const { emotions, TOTAL_ROUNDS, pickDifferentIndex, makeCard, progressStars } = require('./app.js');

assert.strictEqual(TOTAL_ROUNDS, 5, '短遊戲應固定為 5 回合');
assert.ok(emotions.length >= 8, '至少要有 8 種心情，避免太快重複');

for (const emotion of emotions) {
  assert.ok(emotion.emoji, '每張卡都要有表情符號');
  assert.ok(emotion.name.length >= 3, '每張卡都要有清楚的心情名稱');
  assert.ok(emotion.scene.length >= 12, '每張卡都要有可演出的想像場景');
  assert.ok(emotion.clue.length >= 12, '每張卡都要有可觀察的提示');
}

assert.strictEqual(pickDifferentIndex(1, 0, () => 0), 0);
assert.strictEqual(pickDifferentIndex(10, 0, () => 0), 1, '不可連續抽到同一張');
assert.strictEqual(pickDifferentIndex(10, 3, () => 0.2), 2, '抽到不同張時直接採用');

const card = makeCard(0, () => 0);
assert.strictEqual(card.index, 1, 'makeCard 應避開上一張');
assert.strictEqual(card.name, emotions[1].name);

assert.strictEqual(progressStars(0), '☆ ☆ ☆ ☆ ☆');
assert.strictEqual(progressStars(3), '★ ★ ★ ☆ ☆');
assert.strictEqual(progressStars(8), '★ ★ ★ ★ ★', '完成數需限制在總回合內');
assert.strictEqual(progressStars(-1), '☆ ☆ ☆ ☆ ☆', '完成數不可低於零');

console.log('tiny-expression-detective core tests passed');
