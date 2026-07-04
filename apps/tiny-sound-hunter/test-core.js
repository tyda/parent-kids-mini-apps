const assert = require('assert');
const { SOUND_CARDS, filterCards, pickCard, formatStars, nextStarCount, createInitialState } = require('./app.js');

assert.ok(SOUND_CARDS.length >= 8, '至少要有 8 張聲音任務卡');

for (const card of SOUND_CARDS) {
  assert.ok(card.id && card.title && card.prompt && card.scene && card.task && card.reward, `卡片欄位完整：${card.id}`);
  assert.ok(Array.isArray(card.places) && card.places.length > 0, `卡片需要地點：${card.id}`);
}

for (const place of ['anywhere', 'car', 'restaurant', 'queue', 'bedtime']) {
  assert.ok(filterCards(place).length >= 3, `${place} 至少要有 3 張可抽卡片`);
}

const firstAnywhere = filterCards('anywhere')[0];
const notRepeated = pickCard('anywhere', firstAnywhere.id, () => 0);
assert.notStrictEqual(notRepeated.id, firstAnywhere.id, '抽卡不應連續重複同一張（有替代卡時）');

assert.strictEqual(formatStars(0), '☆☆☆☆☆');
assert.strictEqual(formatStars(3), '★★★☆☆');
assert.strictEqual(formatStars(9), '★★★★★');
assert.strictEqual(nextStarCount(4), 5);
assert.strictEqual(nextStarCount(5), 5);

assert.deepStrictEqual(createInitialState(), { place: 'anywhere', stars: 0, previousId: '', currentCard: null });

console.log('tiny-sound-hunter core tests passed');
