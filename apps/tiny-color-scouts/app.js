const colors = [
  { name: '紅色', value: '#d83b3b', icon: '●' },
  { name: '橘色', value: '#df6b22', icon: '▲' },
  { name: '黃色', value: '#e7b416', icon: '★' },
  { name: '綠色', value: '#278458', icon: '◆' },
  { name: '藍色', value: '#3479c7', icon: '■' },
  { name: '紫色', value: '#7b52b9', icon: '✦' },
  { name: '黑色', value: '#343434', icon: '⬟' },
  { name: '白色', value: '#f5f3eb', icon: '○', darkIcon: true },
  { name: '棕色', value: '#825536', icon: '⬢' },
  { name: '灰色', value: '#7a858c', icon: '✚' }
];

const missions = [
  { title: '找一樣帶有這個顏色的東西', question: '它摸起來可能是硬的，還是軟的？' },
  { title: '找一樣小小的這個顏色', question: '它比你的手掌大，還是更小？' },
  { title: '找一樣有這個顏色的實用品', question: '人們通常會在什麼時候使用它？' },
  { title: '找一樣藏著這個顏色的東西', question: '這個顏色出現在哪個小角落？' },
  { title: '找一樣接近這個顏色的東西', question: '它比較亮、比較暗，還是剛剛好？' },
  { title: '找兩樣都含有這個顏色的東西', question: '除了顏色，它們還有哪裡相像？' },
  { title: '找一樣有這個顏色和圖案的東西', question: '上面的圖案像線條、圓點，還是別的形狀？' },
  { title: '找一樣讓你想到這個顏色的東西', question: '即使顏色不完全一樣，也可以說說為什麼。' }
];

const TOTAL_ROUNDS = 5;
let round = 1;
let completed = 0;
let previousColor = -1;
let previousMission = -1;
let found = [false, false];
let starter = 0;

function pickDifferentIndex(length, previousIndex, random = Math.random) {
  if (length <= 1) return 0;
  const picked = Math.floor(random() * length);
  return picked === previousIndex ? (picked + 1) % length : picked;
}

function makeChallenge(lastColor = -1, lastMission = -1, random = Math.random) {
  const colorIndex = pickDifferentIndex(colors.length, lastColor, random);
  const missionIndex = pickDifferentIndex(missions.length, lastMission, random);
  return { color: colors[colorIndex], mission: missions[missionIndex], colorIndex, missionIndex };
}

function progressBadges(done, total = TOTAL_ROUNDS) {
  const safeDone = Math.max(0, Math.min(total, done));
  return `${'● '.repeat(safeDone)}${'○ '.repeat(total - safeDone)}`.trim();
}

function renderProgress() {
  document.getElementById('round-label').textContent = completed >= TOTAL_ROUNDS
    ? '五回合全部完成！'
    : `第 ${round} 回合，共 ${TOTAL_ROUNDS} 回合`;
  document.getElementById('badges').textContent = progressBadges(completed);
}

function renderFoundState() {
  const buttons = [document.getElementById('first-found'), document.getElementById('second-found')];
  buttons.forEach((button, index) => {
    button.classList.toggle('is-found', found[index]);
    button.setAttribute('aria-pressed', String(found[index]));
    button.textContent = index === 0
      ? (found[index] ? '✓ 小朋友找到了' : '🧒 小朋友找到了')
      : (found[index] ? '✓ 大人找到了' : '🧑 大人找到了');
  });
  const bothFound = found.every(Boolean);
  document.getElementById('next-round').disabled = !bothFound;
  document.getElementById('status').textContent = bothFound
    ? '太好了！互相說完答案，就可以前進。'
    : found.some(Boolean) ? '一位隊員找到了，再一起幫另一位看看。' : '找到後按自己的按鈕，再互相分享答案。';
}

function showChallenge() {
  const challenge = makeChallenge(previousColor, previousMission);
  previousColor = challenge.colorIndex;
  previousMission = challenge.missionIndex;
  found = [false, false];
  const token = document.getElementById('color-token');
  token.style.backgroundColor = challenge.color.value;
  const icon = document.getElementById('color-icon');
  icon.textContent = challenge.color.icon;
  icon.style.color = challenge.color.darkIcon ? '#4f5c58' : 'rgba(255,255,255,.92)';
  document.getElementById('color-name').textContent = challenge.color.name;
  document.getElementById('mission-title').textContent = challenge.mission.title;
  document.getElementById('mission-question').textContent = challenge.mission.question;
  document.getElementById('turn-label').textContent = starter === 0 ? '這回合由小朋友先找' : '這回合由大人先找';
  renderFoundState();
  renderProgress();
}

function toggleFound(index) {
  found[index] = !found[index];
  renderFoundState();
}

function nextRound() {
  if (!found.every(Boolean)) return;
  completed += 1;
  if (completed >= TOTAL_ROUNDS) {
    renderProgress();
    document.getElementById('turn-label').textContent = '🏅 搜查任務完成！';
    document.getElementById('mission-title').textContent = '你們一起找完了 5 種顏色線索';
    document.getElementById('mission-question').textContent = '互相選一個今天最意外的發現吧。';
    document.getElementById('finders').hidden = true;
    document.getElementById('next-round').hidden = true;
    document.getElementById('status').textContent = '沒有輸贏，仔細觀察就是搜查隊的超能力。';
    return;
  }
  round = completed + 1;
  starter = 1 - starter;
  showChallenge();
}

function restartGame() {
  round = 1;
  completed = 0;
  starter = 0;
  previousColor = -1;
  previousMission = -1;
  document.getElementById('finders').hidden = false;
  document.getElementById('next-round').hidden = false;
  showChallenge();
}

if (typeof document !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('first-found').addEventListener('click', () => toggleFound(0));
    document.getElementById('second-found').addEventListener('click', () => toggleFound(1));
    document.getElementById('next-round').addEventListener('click', nextRound);
    document.getElementById('change-card').addEventListener('click', showChallenge);
    document.getElementById('restart').addEventListener('click', restartGame);
    restartGame();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

if (typeof module !== 'undefined') {
  module.exports = { colors, missions, TOTAL_ROUNDS, pickDifferentIndex, makeChallenge, progressBadges };
}
