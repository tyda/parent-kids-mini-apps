const assert = require('assert');
const { colors, missions, TOTAL_ROUNDS, pickDifferentIndex, makeChallenge, progressBadges } = require('./app.js');

assert.strictEqual(TOTAL_ROUNDS, 5, '短遊戲應固定為 5 回合');
assert.ok(colors.length >= 8, '至少要有 8 種顏色');
assert.ok(missions.length >= 6, '至少要有 6 種任務');

for (const color of colors) {
  assert.ok(color.name.endsWith('色'), '顏色需有文字名稱，不能只靠色彩辨識');
  assert.ok(/^#[0-9a-f]{6}$/i.test(color.value), '顏色值需為完整 hex');
  assert.ok(color.icon, '每種顏色需搭配不同圖案提示');
}
for (const mission of missions) {
  assert.ok(mission.title.startsWith('找'), '任務標題需是清楚可執行的找尋指令');
  assert.ok(mission.question.length >= 12, '每張卡需有分享問題');
}

assert.strictEqual(pickDifferentIndex(1, 0, () => 0), 0);
assert.strictEqual(pickDifferentIndex(10, 0, () => 0), 1, '不可連續抽到同一項');
assert.strictEqual(pickDifferentIndex(10, 3, () => 0.2), 2);

const challenge = makeChallenge(0, 0, () => 0);
assert.strictEqual(challenge.colorIndex, 1, '需避開上一個顏色');
assert.strictEqual(challenge.missionIndex, 1, '需避開上一個任務');
assert.strictEqual(challenge.color, colors[1]);
assert.strictEqual(challenge.mission, missions[1]);

assert.strictEqual(progressBadges(0), '○ ○ ○ ○ ○');
assert.strictEqual(progressBadges(3), '● ● ● ○ ○');
assert.strictEqual(progressBadges(9), '● ● ● ● ●');
assert.strictEqual(progressBadges(-2), '○ ○ ○ ○ ○');

console.log('tiny-color-scouts core tests passed');
