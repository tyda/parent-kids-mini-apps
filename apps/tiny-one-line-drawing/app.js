const prompts = [
  { emoji: '☂️', word: '雨傘', tip: '先畫傘面，再加一根彎彎的握把。' },
  { emoji: '🐟', word: '魚', tip: '牠有尾巴，也住在水裡。' },
  { emoji: '🚲', word: '腳踏車', tip: '兩個圓圓的輪子是好線索。' },
  { emoji: '🍦', word: '冰淇淋', tip: '甜筒上會有一球冰冰的東西。' },
  { emoji: '🐱', word: '貓咪', tip: '三角耳朵和鬍鬚很有辨識度。' },
  { emoji: '🚀', word: '火箭', tip: '畫出尖尖的頂端和噴出的火焰。' },
  { emoji: '🌻', word: '向日葵', tip: '大花朵、長花莖，還有幾片葉子。' },
  { emoji: '🎂', word: '生日蛋糕', tip: '蛋糕上可以放幾根小蠟燭。' },
  { emoji: '🐘', word: '大象', tip: '長鼻子和大耳朵不能少。' },
  { emoji: '🏠', word: '房子', tip: '屋頂、門和窗戶都是好線索。' },
  { emoji: '🦋', word: '蝴蝶', tip: '左右各有一對漂亮的翅膀。' },
  { emoji: '🚂', word: '火車', tip: '一節接一節，前面還會冒煙。' },
  { emoji: '🍎', word: '蘋果', tip: '圓圓的果實，上面有一片葉子。' },
  { emoji: '🤖', word: '機器人', tip: '方方的身體，加上天線或按鈕。' },
  { emoji: '⛵', word: '帆船', tip: '船身上方有一大片帆。' },
  { emoji: '🦖', word: '恐龍', tip: '大尾巴、短短的手或背上的尖角。' },
  { emoji: '🎈', word: '氣球', tip: '圓圓的氣球下面綁著一條線。' },
  { emoji: '🐌', word: '蝸牛', tip: '慢慢爬，背上有一個螺旋殼。' },
  { emoji: '👓', word: '眼鏡', tip: '兩個鏡框，中間連在一起。' },
  { emoji: '🌙', word: '月亮', tip: '可以畫彎彎的月牙和幾顆星星。' }
];

const TOTAL_ROUNDS = 5;
const ROUND_SECONDS = 30;
let round = 1;
let score = 0;
let currentIndex = -1;
let secondsLeft = ROUND_SECONDS;
let timerId = null;
let paused = false;
let drawing = false;
let erasing = false;
let ctx = null;
let canvas = null;

function pickDifferentIndex(length, previousIndex, random = Math.random) {
  if (length <= 1) return 0;
  const picked = Math.floor(random() * length);
  return picked === previousIndex ? (picked + 1) % length : picked;
}

function pickPrompt(previousIndex = -1, random = Math.random) {
  const index = pickDifferentIndex(prompts.length, previousIndex, random);
  return { ...prompts[index], index };
}

function stars(done, total = TOTAL_ROUNDS) {
  const safe = Math.max(0, Math.min(total, done));
  return `${'★ '.repeat(safe)}${'☆ '.repeat(total - safe)}`.trim();
}

function finishMessage(points, total = TOTAL_ROUNDS) {
  if (points === total) return `拿到 ${points} 顆星！你們的畫圖默契太厲害了。`;
  if (points >= Math.ceil(total / 2)) return `拿到 ${points} 顆星！有些畫猜得快，有些畫特別有創意。`;
  return `拿到 ${points} 顆星！猜不出來也沒關係，最好笑的畫通常最值得記住。`;
}

function renderStatus() {
  document.getElementById('round-label').textContent = `第 ${round} 回合，共 ${TOTAL_ROUNDS} 回合`;
  document.getElementById('stars').textContent = stars(score);
  document.getElementById('stars').setAttribute('aria-label', `目前得到 ${score} 顆星`);
}

function showPrompt() {
  stopTimer();
  const prompt = pickPrompt(currentIndex);
  currentIndex = prompt.index;
  document.getElementById('prompt-emoji').textContent = prompt.emoji;
  document.getElementById('prompt-word').textContent = prompt.word;
  document.getElementById('prompt-tip').textContent = `提示：${prompt.tip}`;
  document.getElementById('answer-word').textContent = prompt.word;
  document.getElementById('prompt-panel').hidden = false;
  document.getElementById('drawing-panel').hidden = true;
  document.getElementById('finish-panel').hidden = true;
  renderStatus();
}

function updateTimer() {
  const label = document.getElementById('timer-label');
  label.textContent = secondsLeft > 0 ? `還有 ${secondsLeft} 秒` : '時間到，可以繼續畫或看答案';
  label.classList.toggle('urgent', secondsLeft <= 10);
}

function stopTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
}

function startTimer() {
  stopTimer();
  paused = false;
  secondsLeft = ROUND_SECONDS;
  updatePauseButton();
  updateTimer();
  timerId = setInterval(() => {
    secondsLeft -= 1;
    updateTimer();
    if (secondsLeft <= 0) stopTimer();
  }, 1000);
}

function updatePauseButton() {
  const button = document.getElementById('timer-toggle');
  button.textContent = paused ? '繼續計時' : '暫停計時';
  button.setAttribute('aria-pressed', String(paused));
}

function toggleTimer() {
  if (secondsLeft <= 0) return;
  paused = !paused;
  if (paused) stopTimer();
  else {
    timerId = setInterval(() => {
      secondsLeft -= 1;
      updateTimer();
      if (secondsLeft <= 0) stopTimer();
    }, 1000);
  }
  updatePauseButton();
}

function sizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, rect.width, rect.height);
}

function clearCanvas() {
  const rect = canvas.getBoundingClientRect();
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
  document.getElementById('canvas-hint').hidden = false;
}

function pointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function beginStroke(event) {
  drawing = true;
  canvas.setPointerCapture(event.pointerId);
  const point = pointerPosition(event);
  ctx.beginPath();
  ctx.moveTo(point.x, point.y);
  document.getElementById('canvas-hint').hidden = true;
}

function continueStroke(event) {
  if (!drawing) return;
  const point = pointerPosition(event);
  ctx.globalCompositeOperation = erasing ? 'destination-out' : 'source-over';
  ctx.strokeStyle = erasing ? 'rgba(0,0,0,1)' : '#241c3c';
  ctx.lineWidth = erasing ? 24 : 5;
  ctx.lineTo(point.x, point.y);
  ctx.stroke();
}

function endStroke() {
  drawing = false;
  if (ctx) ctx.closePath();
}

function setTool(useEraser) {
  erasing = useEraser;
  document.getElementById('pen').classList.toggle('active', !erasing);
  document.getElementById('eraser').classList.toggle('active', erasing);
  document.getElementById('pen').setAttribute('aria-pressed', String(!erasing));
  document.getElementById('eraser').setAttribute('aria-pressed', String(erasing));
}

function beginDrawing() {
  document.getElementById('prompt-panel').hidden = true;
  document.getElementById('drawing-panel').hidden = false;
  document.getElementById('answer-panel').hidden = true;
  requestAnimationFrame(() => {
    sizeCanvas();
    setTool(false);
    document.getElementById('canvas-hint').hidden = false;
    startTimer();
  });
}

function revealAnswer() {
  stopTimer();
  paused = true;
  updatePauseButton();
  document.getElementById('answer-panel').hidden = false;
}

function completeRound(guessed) {
  stopTimer();
  if (guessed) score += 1;
  if (round >= TOTAL_ROUNDS) {
    document.getElementById('prompt-panel').hidden = true;
    document.getElementById('drawing-panel').hidden = true;
    document.getElementById('finish-panel').hidden = false;
    document.getElementById('finish-message').textContent = finishMessage(score);
    document.getElementById('stars').textContent = stars(score);
    document.getElementById('round-label').textContent = '五回合完成！';
    return;
  }
  round += 1;
  showPrompt();
}

function restartGame() {
  round = 1;
  score = 0;
  currentIndex = -1;
  showPrompt();
}

if (typeof document !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('drawing-canvas');
    canvas.addEventListener('pointerdown', beginStroke);
    canvas.addEventListener('pointermove', continueStroke);
    canvas.addEventListener('pointerup', endStroke);
    canvas.addEventListener('pointercancel', endStroke);
    document.getElementById('start-drawing').addEventListener('click', beginDrawing);
    document.getElementById('change-prompt').addEventListener('click', showPrompt);
    document.getElementById('timer-toggle').addEventListener('click', toggleTimer);
    document.getElementById('pen').addEventListener('click', () => setTool(false));
    document.getElementById('eraser').addEventListener('click', () => setTool(true));
    document.getElementById('clear').addEventListener('click', clearCanvas);
    document.getElementById('guessed').addEventListener('click', () => completeRound(true));
    document.getElementById('reveal').addEventListener('click', revealAnswer);
    document.getElementById('not-guessed').addEventListener('click', () => completeRound(false));
    document.getElementById('restart').addEventListener('click', restartGame);
    restartGame();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

if (typeof module !== 'undefined') {
  module.exports = { prompts, TOTAL_ROUNDS, ROUND_SECONDS, pickDifferentIndex, pickPrompt, stars, finishMessage };
}
