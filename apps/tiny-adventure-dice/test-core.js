const assert = require('assert');
const { PLACES, MISSIONS, REWARDS, DICE_EMOJI, pick, createAdventure, adventureText } = require('./app.js');

function fixedRng(values) {
  let i = 0;
  return () => values[i++ % values.length];
}

assert.ok(PLACES.length >= 8, 'should have enough places');
assert.ok(MISSIONS.length >= 10, 'should have enough missions');
assert.ok(REWARDS.length >= 6, 'should have enough rewards');

assert.strictEqual(pick(['a','b','c'], () => 0), 'a');
assert.strictEqual(pick(['a','b','c'], () => 0.999), 'c');

const adv = createAdventure(fixedRng([0, 0.2, 0.4, 0.6]));
assert.strictEqual(adv.place, PLACES[0]);
assert.strictEqual(adv.mission, MISSIONS[Math.floor(0.2 * MISSIONS.length)]);
assert.strictEqual(adv.reward, REWARDS[Math.floor(0.4 * REWARDS.length)]);
assert.strictEqual(adv.emoji, DICE_EMOJI[Math.floor(0.6 * DICE_EMOJI.length)]);
assert.ok(Date.parse(adv.createdAt), 'createdAt should be ISO-ish date');

const text = adventureText(adv);
assert.ok(text.includes(adv.place));
assert.ok(text.includes(adv.mission));
assert.ok(text.includes(adv.reward));

for (let i = 0; i < 100; i++) {
  const a = createAdventure();
  assert.ok(PLACES.includes(a.place));
  assert.ok(MISSIONS.includes(a.mission));
  assert.ok(REWARDS.includes(a.reward));
  assert.ok(DICE_EMOJI.includes(a.emoji));
}

console.log('All tests passed');
