const assert = require('assert');
const { stations, rhythms, helpers, pickIndex, makeRound } = require('./app.js');

assert.ok(stations.length >= 6, '至少要有 6 個車站，避免太快重複');
assert.ok(rhythms.length >= 6, '至少要有 6 種節奏');
assert.ok(helpers.length >= 3, '至少要有 3 則提示');

for (const station of stations) {
  assert.ok(station.name && station.name.length >= 3, '每個車站要有清楚名稱');
  assert.ok(station.mission && station.mission.length >= 12, '每個車站要有可執行小任務');
}

for (const rhythm of rhythms) {
  assert.ok(/[・]/.test(rhythm), `節奏格式應該用分隔點：${rhythm}`);
}

assert.strictEqual(pickIndex(1, 0, () => 0), 0, '單一項目時應回傳 0');
assert.strictEqual(pickIndex(4, 0, () => 0.01), 1, '抽到上一張時應避開連續重複');
assert.strictEqual(pickIndex(4, 2, () => 0.01), 0, '抽到不同項目時可直接使用');

let calls = 0;
const deterministicRandom = () => {
  const values = [0, 0, 0.4, 0.4, 0.8, 0.8];
  return values[calls++ % values.length];
};
const first = makeRound(deterministicRandom);
const second = makeRound(deterministicRandom);
assert.notStrictEqual(first.station.name, second.station.name, '連續車站不應完全相同');
assert.notStrictEqual(first.rhythm, second.rhythm, '連續節奏不應完全相同');

console.log('tiny-rhythm-train core tests passed');
