const assert = require('assert');
const fs = require('fs');
const path = require('path');
const game = require('./app.js');

assert.strictEqual(game.TOTAL_ROUNDS, 5);
assert.deepStrictEqual(game.PLAYERS, ['小乖', '米米']);
assert.strictEqual(game.photos.length, 8);
for (const photo of game.photos) {
  assert.ok(photo.src.startsWith('assets/family-'));
  assert.ok(fs.existsSync(path.join(__dirname, photo.src)), `${photo.src} should exist`);
  assert.ok(photo.focus);
  assert.strictEqual(photo.clues.length, 3);
}
const deck = game.shuffleIndices(8, () => 0.5);
assert.strictEqual(new Set(deck).size, 8);
assert.deepStrictEqual([...deck].sort((a, b) => a - b), [0, 1, 2, 3, 4, 5, 6, 7]);
assert.deepStrictEqual(game.roleForRound(1), { giver: '小乖', guesser: '米米' });
assert.deepStrictEqual(game.roleForRound(2), { giver: '米米', guesser: '小乖' });
assert.strictEqual(game.clueButtonLabel(3, 3), '三條提示都出現了');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const source = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
assert.ok(html.includes('id="cover-stage"'), 'round should begin behind a handoff cover');
assert.ok(html.includes('id="show-photo-button"'), 'giver confirmation button should exist');
assert.ok(!/<img id="photo-card"[^>]+src=/.test(html), 'photo must not be preloaded in HTML');
assert.ok(source.includes("clearPhoto('photo-card')"), 'photo src should be removed before handoff');
assert.ok(source.includes("showRound(true)"), 'later rounds should return to the cover');
assert.ok(source.includes("window.addEventListener('pageshow'"), 'bfcache restore should return to the cover');
console.log('tiny-clue-box photo game core tests passed');
