const SOUND_CARDS = [
  {
    id: 'tiny-repeat',
    places: ['anywhere', 'car', 'restaurant', 'queue'],
    badge: '重複聲音',
    title: '找一個會重複出現的聲音',
    prompt: '像滴答、輪子、門鈴、餐具碰撞這種「又來了」的聲音。',
    scene: '你們是聲音研究員，要找到這個地方的節奏。',
    task: '安靜聽 20 秒；每次聽到同一個聲音，就用手指輕點一下。',
    reward: '說出它像什麼節拍：慢慢走、快快跑，還是跳舞？'
  },
  {
    id: 'far-near',
    places: ['anywhere', 'car', 'queue', 'bedtime'],
    badge: '遠近偵探',
    title: '找一個很遠或很近的聲音',
    prompt: '聽聽看，有沒有一個聲音好像從遠方來，或就在旁邊。',
    scene: '你們在畫一張看不見的聲音地圖。',
    task: '輪流指出聲音可能的方向，再說它比較遠還是比較近。',
    reward: '如果兩個人猜不同，就各自說一個理由，兩個理由都算成功。'
  },
  {
    id: 'soft-loud',
    places: ['anywhere', 'restaurant', 'queue', 'bedtime'],
    badge: '大小聲',
    title: '找一個最小聲的聲音',
    prompt: '不是找最吵的，是找差一點就被忽略的小聲音。',
    scene: '你們是溫柔的耳朵探險家。',
    task: '先閉嘴聽 20 秒，再小小聲分享自己找到的聲音。',
    reward: '幫那個聲音取一個可愛名字，例如「椅子小咕嚕」。'
  },
  {
    id: 'machine-nature',
    places: ['anywhere', 'car', 'restaurant', 'queue'],
    badge: '分類高手',
    title: '把聲音分成「機器」或「人」',
    prompt: '聽到聲音後，猜猜是機器做的，還是人做的。',
    scene: '你們在整理聲音博物館的收藏櫃。',
    task: '找到 3 個聲音，每個都放進「機器」或「人」的分類。',
    reward: '如果有一個很難分，幫它建立第三類：「神祕聲音」。'
  },
  {
    id: 'sound-story',
    places: ['anywhere', 'car', 'restaurant', 'bedtime'],
    badge: '聲音故事',
    title: '用三個聲音編一個小故事',
    prompt: '先收集三個聲音，再把它們串成一句故事。',
    scene: '附近的聲音正在偷偷演一齣迷你劇。',
    task: '一人找第一個聲音，另一人找第二個，一起找第三個。',
    reward: '用「有一天……然後……最後……」說出 20 秒故事。'
  },
  {
    id: 'bedtime-cloud',
    places: ['bedtime'],
    badge: '睡前雲朵',
    title: '找一個可以放進夢裡的聲音',
    prompt: '選一個聽起來不緊張、可以慢慢變小的聲音。',
    scene: '你們把聲音放到雲朵上，讓它輕輕飄走。',
    task: '聽到聲音後，吸氣數 3 下、吐氣數 4 下，做兩輪。',
    reward: '說一句：「晚安，這個聲音先去睡覺。」'
  },
  {
    id: 'car-window',
    places: ['car'],
    badge: '車窗外',
    title: '猜一個車窗外的聲音來源',
    prompt: '不用看螢幕太久，聽到聲音就猜它從哪裡來。',
    scene: '你們坐在一艘城市小船上，用耳朵看窗外。',
    task: '聽 20 秒後，各猜一個車外聲音的來源。',
    reward: '下一次真的看到類似東西時，喊「找到了」就得一顆星。'
  },
  {
    id: 'restaurant-chef',
    places: ['restaurant'],
    badge: '廚房節奏',
    title: '找一個像料理中的聲音',
    prompt: '餐具、杯子、門、腳步，都可能變成廚房樂器。',
    scene: '你們是安靜的小小音樂廚師。',
    task: '找 2 個聲音，想像它們正在煮什麼料理。',
    reward: '替這道想像料理取名，不需要真的點餐。'
  },
  {
    id: 'queue-count',
    places: ['queue'],
    badge: '等待計數',
    title: '等待時數三種聲音',
    prompt: '排隊時最適合把無聊變成觀察任務。',
    scene: '你們正在替等待時間蓋三個小印章。',
    task: '聽到三種不同聲音就伸出三根手指，不需要說很大聲。',
    reward: '三根手指都出現後，互相擊掌或用眼神擊掌。'
  }
];

function filterCards(place, cards = SOUND_CARDS) {
  return cards.filter((card) => card.places.includes(place) || card.places.includes('anywhere'));
}

function pickCard(place = 'anywhere', previousId = '', random = Math.random) {
  const pool = filterCards(place);
  if (pool.length === 0) return SOUND_CARDS[0];
  if (pool.length === 1) return pool[0];
  let card = pool[Math.floor(random() * pool.length)];
  if (card.id === previousId) {
    const index = pool.findIndex((item) => item.id === card.id);
    card = pool[(index + 1) % pool.length];
  }
  return card;
}

function formatStars(count, max = 5) {
  const safe = Math.max(0, Math.min(max, Number(count) || 0));
  return '★'.repeat(safe) + '☆'.repeat(max - safe);
}

function nextStarCount(count, max = 5) {
  return Math.max(0, Math.min(max, (Number(count) || 0) + 1));
}

function createInitialState() {
  return { place: 'anywhere', stars: 0, previousId: '', currentCard: null };
}

if (typeof module !== 'undefined') {
  module.exports = { SOUND_CARDS, filterCards, pickCard, formatStars, nextStarCount, createInitialState };
}

if (typeof window !== 'undefined') {
  const state = createInitialState();
  let countdown = 20;
  let timerId = null;

  const $ = (id) => document.getElementById(id);
  const placeSelect = $('placeSelect');
  const drawButton = $('drawButton');
  const timerButton = $('timerButton');
  const doneButton = $('doneButton');
  const resetButton = $('resetButton');
  const timerText = $('timerText');

  function renderCard(card) {
    $('cardBadge').textContent = card.badge;
    $('card-title').textContent = card.title;
    $('cardPrompt').textContent = card.prompt;
    $('sceneText').textContent = card.scene;
    $('taskText').textContent = card.task;
    $('rewardText').textContent = card.reward;
  }

  function renderStars() {
    $('stars').textContent = formatStars(state.stars);
    $('stars').setAttribute('aria-label', `已完成 ${state.stars} 顆星`);
  }

  function stopTimer(reset = true) {
    if (timerId) window.clearInterval(timerId);
    timerId = null;
    if (reset) countdown = 20;
    timerText.textContent = String(countdown);
    timerButton.textContent = '開始 20 秒安靜聽';
  }

  function drawCard() {
    stopTimer(true);
    state.place = placeSelect.value;
    const card = pickCard(state.place, state.previousId);
    state.currentCard = card;
    state.previousId = card.id;
    renderCard(card);
  }

  drawButton.addEventListener('click', drawCard);

  placeSelect.addEventListener('change', () => {
    state.place = placeSelect.value;
  });

  timerButton.addEventListener('click', () => {
    if (timerId) {
      stopTimer(false);
      return;
    }
    countdown = 20;
    timerText.textContent = String(countdown);
    timerButton.textContent = '正在聽…再按可暫停';
    timerId = window.setInterval(() => {
      countdown -= 1;
      timerText.textContent = String(countdown);
      if (countdown <= 0) {
        stopTimer(false);
        timerButton.textContent = '完成！再聽一次';
        countdown = 20;
      }
    }, 1000);
  });

  doneButton.addEventListener('click', () => {
    state.stars = nextStarCount(state.stars);
    renderStars();
  });

  resetButton.addEventListener('click', () => {
    stopTimer(true);
    state.stars = 0;
    state.previousId = '';
    state.currentCard = null;
    $('cardBadge').textContent = '準備開始';
    $('card-title').textContent = '先選地點，再抽任務';
    $('cardPrompt').textContent = '今天要找哪一種聲音呢？';
    $('sceneText').textContent = '像小小偵探一樣，把附近聲音拼成一張地圖。';
    $('taskText').textContent = '抽卡後會出現 20 秒安靜聽的挑戰。';
    $('rewardText').textContent = '完成後按下「完成任務」，收集一顆星。';
    renderStars();
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }

  renderStars();
}
