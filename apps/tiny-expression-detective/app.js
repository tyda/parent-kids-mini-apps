const emotions = [
  { emoji: '🤩', name: '好期待', scene: '像是等一下就要打開一份驚喜。', clue: '眼睛會不會亮亮的？身體想靠近還是退後？' },
  { emoji: '😌', name: '很安心', scene: '像是回到舒服又熟悉的地方。', clue: '肩膀和呼吸可能變得比較放鬆。' },
  { emoji: '😮', name: '好驚訝', scene: '像是突然看到一個意想不到的東西。', clue: '看看眉毛、眼睛和嘴巴有什麼變化。' },
  { emoji: '🤔', name: '有點疑惑', scene: '像是遇到一題還想不明白的問題。', clue: '頭可能歪一邊，眼神像在找答案。' },
  { emoji: '😤', name: '不太服氣', scene: '像是差一點就成功，想再試一次。', clue: '不是大發脾氣，是「我還想挑戰」的感覺。' },
  { emoji: '🥱', name: '好想睡', scene: '像是已經躺進暖暖的被窩。', clue: '動作可以變慢，眼睛也可能快閉起來。' },
  { emoji: '😳', name: '有點害羞', scene: '像是大家突然稱讚了你做得真好。', clue: '視線可能躲一下，動作也會變小。' },
  { emoji: '🥰', name: '覺得溫暖', scene: '像是收到一個剛剛好的擁抱。', clue: '臉和身體會是柔軟的，嘴角可能上揚。' },
  { emoji: '😟', name: '有一點擔心', scene: '像是在等一個還不知道的結果。', clue: '眉頭、手指或坐姿可能透露小線索。' },
  { emoji: '😎', name: '很有自信', scene: '像是準備展示一件很拿手的事。', clue: '姿勢可以站穩一點，像在說「交給我」。' }
];

const TOTAL_ROUNDS = 5;
let round = 1;
let completed = 0;
let currentIndex = -1;
let isHidden = false;

function pickDifferentIndex(length, previousIndex, random = Math.random) {
  if (length <= 1) return 0;
  const picked = Math.floor(random() * length);
  return picked === previousIndex ? (picked + 1) % length : picked;
}

function makeCard(previousIndex = -1, random = Math.random) {
  const index = pickDifferentIndex(emotions.length, previousIndex, random);
  return { ...emotions[index], index };
}

function progressStars(done, total = TOTAL_ROUNDS) {
  const safeDone = Math.max(0, Math.min(total, done));
  return `${'★ '.repeat(safeDone)}${'☆ '.repeat(total - safeDone)}`.trim();
}

function renderProgress() {
  document.getElementById('round-label').textContent = completed >= TOTAL_ROUNDS
    ? '完成 5 回合！'
    : `第 ${round} 回合，共 ${TOTAL_ROUNDS} 回合`;
  document.getElementById('stars').textContent = progressStars(completed);
}

function showCard(card) {
  currentIndex = card.index;
  isHidden = false;
  document.getElementById('emotion-emoji').textContent = card.emoji;
  document.getElementById('emotion-name').textContent = card.name;
  document.getElementById('scene-text').textContent = card.scene;
  document.querySelector('#hidden-card > span').textContent = '🔎';
  document.querySelector('#hidden-card > h2').textContent = '偵探，請看表情猜心情';
  document.getElementById('clue-text').textContent = card.clue;
  document.getElementById('answer-text').textContent = `${card.emoji} ${card.name}`;
  document.getElementById('secret').hidden = false;
  document.getElementById('hidden-card').hidden = true;
  document.getElementById('hide-answer').hidden = false;
  document.getElementById('guess-actions').hidden = true;
  document.getElementById('reveal-panel').hidden = true;
  document.getElementById('role-label').textContent = '演員先偷看，別讓偵探看到';
}

function nextCard() {
  showCard(makeCard(currentIndex));
  renderProgress();
}

function hideAnswer() {
  isHidden = true;
  document.getElementById('secret').hidden = true;
  document.getElementById('hidden-card').hidden = false;
  document.getElementById('hide-answer').hidden = true;
  document.getElementById('guess-actions').hidden = false;
  document.getElementById('role-label').textContent = '偵探時間：猜猜演員是哪種心情';
}

function revealAnswer() {
  document.getElementById('reveal-panel').hidden = false;
}

function completeRound() {
  if (!isHidden) return;
  completed += 1;
  if (completed >= TOTAL_ROUNDS) {
    renderProgress();
    document.getElementById('role-label').textContent = '結案成功！你們是默契十足的表情偵探';
    document.querySelector('#hidden-card > span').textContent = '🏅';
    document.querySelector('#hidden-card > h2').textContent = '完成 5 回合';
    document.getElementById('clue-text').textContent = '說說哪一張最難猜，再按下方重新開始。';
    document.getElementById('guess-actions').hidden = true;
    return;
  }
  round = completed + 1;
  nextCard();
}

function restartGame() {
  round = 1;
  completed = 0;
  currentIndex = -1;
  nextCard();
}

if (typeof document !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('hide-answer').addEventListener('click', hideAnswer);
    document.getElementById('reveal-answer').addEventListener('click', revealAnswer);
    document.getElementById('got-it').addEventListener('click', completeRound);
    document.getElementById('new-card').addEventListener('click', nextCard);
    document.getElementById('restart').addEventListener('click', restartGame);
    restartGame();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

if (typeof module !== 'undefined') {
  module.exports = { emotions, TOTAL_ROUNDS, pickDifferentIndex, makeCard, progressStars };
}
