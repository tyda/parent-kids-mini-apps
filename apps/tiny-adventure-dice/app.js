const PLACES = [
  '恐龍公園', '雲朵廚房', '星星停車場', '彩虹便利商店', '月亮圖書館',
  '森林捷運站', '太空早餐店', '海盜洗車場', '貓咪城堡', '超級市場迷宮'
];

const MISSIONS = [
  '找出 3 個紅色東西', '學一種動物走 5 步', '說一個今天最開心的事', '找出 2 個圓形東西',
  '用手比一個超大愛心', '幫旁邊的人取一個可愛綽號', '安靜聽 10 秒鐘，說出聽到什麼',
  '猜旁邊的大人現在在想什麼', '說出一個謝謝的人', '擺一個最像機器人的姿勢', '找出一個像三角形的東西',
  '用一句話編出這個地點的故事'
];

const REWARDS = [
  '獲得 1 顆星星', '可以選下一首歌', '得到一個大抱抱', '可以決定下一題誰玩',
  '獲得「小隊長」稱號 1 分鐘', '可以選今天睡前故事主題', '得到神祕擊掌一次', '獲得親親或抱抱二選一'
];

const DICE_EMOJI = ['🎲', '🚗', '🦖', '🌈', '🚀', '🐱', '⭐', '🍌'];
const STORAGE_KEY = 'tinyAdventureDice:v1';

function pick(list, rng = Math.random) {
  return list[Math.floor(rng() * list.length)];
}

function createAdventure(rng = Math.random) {
  return {
    place: pick(PLACES, rng),
    mission: pick(MISSIONS, rng),
    reward: pick(REWARDS, rng),
    emoji: pick(DICE_EMOJI, rng),
    createdAt: new Date().toISOString()
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { stars: 0, saved: [] };
    const parsed = JSON.parse(raw);
    return {
      stars: Number.isInteger(parsed.stars) ? Math.max(0, Math.min(5, parsed.stars)) : 0,
      saved: Array.isArray(parsed.saved) ? parsed.saved.slice(0, 20) : []
    };
  } catch {
    return { stars: 0, saved: [] };
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function adventureText(a) {
  return `${a.emoji || '🎲'} ${a.place}｜${a.mission}｜${a.reward}`;
}

function setupApp() {
  const placeText = document.querySelector('#placeText');
  const missionText = document.querySelector('#missionText');
  const rewardText = document.querySelector('#rewardText');
  const diceFace = document.querySelector('#diceFace');
  const rollBtn = document.querySelector('#rollBtn');
  const saveBtn = document.querySelector('#saveBtn');
  const starBtn = document.querySelector('#starBtn');
  const resetBtn = document.querySelector('#resetBtn');
  const starsEl = document.querySelector('#stars');
  const savedList = document.querySelector('#savedList');
  const emptySaved = document.querySelector('#emptySaved');
  const clearSavedBtn = document.querySelector('#clearSavedBtn');
  const soundBtn = document.querySelector('#soundBtn');

  let state = loadState();
  let current = createAdventure(() => 0.12);
  let soundOn = false;
  let audioCtx = null;

  function beep() {
    if (!soundOn) return;
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.16);
  }

  function renderAdventure() {
    placeText.textContent = current.place;
    missionText.textContent = current.mission;
    rewardText.textContent = current.reward;
    diceFace.textContent = current.emoji;
  }

  function renderStars() {
    starsEl.textContent = '★'.repeat(state.stars) + '☆'.repeat(5 - state.stars);
  }

  function renderSaved() {
    savedList.innerHTML = '';
    emptySaved.hidden = state.saved.length > 0;
    state.saved.forEach((item, index) => {
      const li = document.createElement('li');
      li.textContent = `${index + 1}. ${adventureText(item)}`;
      savedList.appendChild(li);
    });
  }

  function persistAndRender() {
    saveState(state);
    renderStars();
    renderSaved();
  }

  rollBtn.addEventListener('click', () => {
    current = createAdventure();
    diceFace.classList.remove('rolling');
    void diceFace.offsetWidth;
    diceFace.classList.add('rolling');
    renderAdventure();
    beep();
  });

  saveBtn.addEventListener('click', () => {
    state.saved.unshift(current);
    state.saved = state.saved.slice(0, 10);
    persistAndRender();
    beep();
  });

  starBtn.addEventListener('click', () => {
    state.stars = Math.min(5, state.stars + 1);
    persistAndRender();
    beep();
  });

  resetBtn.addEventListener('click', () => {
    state.stars = 0;
    persistAndRender();
  });

  clearSavedBtn.addEventListener('click', () => {
    state.saved = [];
    persistAndRender();
  });

  soundBtn.addEventListener('click', async () => {
    soundOn = !soundOn;
    soundBtn.setAttribute('aria-pressed', String(soundOn));
    soundBtn.textContent = soundOn ? '🔊 音效' : '🔈 音效';
    if (soundOn) beep();
  });

  renderAdventure();
  persistAndRender();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', setupApp);
}

if (typeof module !== 'undefined') {
  module.exports = { PLACES, MISSIONS, REWARDS, DICE_EMOJI, pick, createAdventure, adventureText };
}
