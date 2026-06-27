const M = require('./app.js');
let failed = 0;
function assert(name, fn) {
  try {
    fn();
    console.log('PASS', name);
  } catch (err) {
    failed += 1;
    console.error('FAIL', name, err.message);
  }
}
function eq(actual, expected) {
  if (actual !== expected) throw new Error(`expected ${expected}, got ${actual}`);
}

assert('起程 0 公尺為 85 元', () => eq(M.calculateFare(M.createState()).total, 85));
assert('1.25 公里內為 85 元', () => {
  const s = M.createState();
  M.addDistance(s, 1250);
  eq(M.calculateFare(s).total, 85);
});
assert('超過起程距離 1 公尺跳 5 元', () => {
  const s = M.createState();
  M.addDistance(s, 1251);
  eq(M.calculateFare(s).total, 90);
});
assert('續程兩跳為 95 元', () => {
  const s = M.createState();
  M.addDistance(s, 1650);
  eq(M.calculateFare(s).total, 95);
});
assert('等待 60 秒加 5 元', () => {
  const s = M.createState();
  M.start(s);
  M.setManualWaiting(s, true);
  M.tick(s, 60);
  eq(M.calculateFare(s).waitingFare, 5);
});
assert('100 秒等待模式正確', () => {
  const s = M.createState();
  M.setWaitingInterval(s, 100);
  M.start(s);
  M.setManualWaiting(s, true);
  M.tick(s, 99);
  eq(M.calculateFare(s).waitingFare, 0);
  M.tick(s, 1);
  eq(M.calculateFare(s).waitingFare, 5);
});
assert('夜間加成 +20%', () => {
  const s = M.createState();
  M.setNight(s, true);
  eq(M.calculateFare(s).total, 102);
});
assert('暫停不累計 tick', () => {
  const s = M.createState();
  M.start(s);
  M.pause(s);
  M.tick(s, 60);
  eq(s.elapsedSeconds, 0);
});
assert('GPS 距離累加', () => {
  const s = M.createState();
  M.updateFromGps(s, { coords: { latitude: 24, longitude: 120, accuracy: 10 }, timestamp: 1 });
  M.updateFromGps(s, { coords: { latitude: 24, longitude: 120.001, accuracy: 10 }, timestamp: 2 });
  if (s.distanceMeters <= 0) throw new Error('distance should be > 0');
});

if (failed) {
  console.error(`${failed} tests failed`);
  process.exit(1);
}
console.log('All tests passed');
