'use strict';
const ITEMS = ['🐚 貝殼', '🪶 羽毛', '🗝️ 鑰匙', '🧦 襪子', '🍋 檸檬', '🧸 玩偶', '🪁 風箏', '🪨 石頭', '☂️ 雨傘', '🧵 毛線', '🥄 湯匙', '🍃 葉子', '🔔 鈴鐺', '🖍️ 蠟筆', '🧩 拼圖', '🎈 氣球'];
const THEMES = ['送給月亮的禮物', '迷你龍的床邊收藏', '海底居民的寶物', '讓雨天變開心', '口袋裡的小宇宙', '森林郵差的包裹', '雲朵上的野餐', '讓機器人認識溫柔'];
function shuffled(values, random) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function createGame(random = Math.random) {
  return { round: 0, themes: shuffled(THEMES, random).slice(0, 5), items: shuffled(ITEMS.map((_, i) => i), random).slice(0, 8), selected: [], exhibits: [], done: false };
}
function toggle(state, id) {
  if (state.done || !state.items.includes(id)) return state;
  const selected = state.selected.includes(id) ? state.selected.filter(x => x !== id) : [...state.selected, id];
  return selected.length > 3 ? state : { ...state, selected };
}
function advance(state) {
  if (state.done || state.selected.length !== 3) return state;
  const exhibits = [...state.exhibits, { theme: state.themes[state.round], items: [...state.selected] }];
  return { ...state, exhibits, selected: [], round: state.round + 1, done: state.round === 4 };
}
if (typeof module !== 'undefined') module.exports = { ITEMS, THEMES, createGame, toggle, advance };
if (typeof document !== 'undefined') {
  let state = createGame();
  const $ = id => document.getElementById(id);
  function render() {
    $('progress').textContent = state.done ? '五間展廳開幕了！' : `第 ${state.round + 1} / 5 間展廳 · ${state.round % 2 ? '換另一位當館長' : '第一位當館長'}`;
    $('theme').textContent = state.done ? '歡迎參觀你們的口袋博物館' : state.themes[state.round];
    $('play').hidden = state.done;
    $('gallery').hidden = !state.done;
    $('status').textContent = state.done ? '輪流挑一間最喜歡的展廳，說說理由。' : `已選 ${state.selected.length} / 3 件。${state.selected.length === 3 ? '請館長說明理由，訪客再問一個問題。' : '點圖卡選擇，再點一次取消。'}`;
    $('next').disabled = state.selected.length !== 3;
    $('next').textContent = state.round === 4 ? '聊好了，博物館開幕！' : '聊好了，換人策展';
    const active = document.activeElement?.dataset.item;
    $('items').replaceChildren(...state.items.map(id => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.item = id;
      button.textContent = ITEMS[id];
      button.setAttribute('aria-pressed', String(state.selected.includes(id)));
      button.addEventListener('click', () => { state = toggle(state, id); render(); });
      return button;
    }));
    if (active !== undefined) $('items').querySelector(`[data-item="${active}"]`)?.focus();
    $('gallery').replaceChildren(...state.exhibits.map(exhibit => {
      const article = document.createElement('article');
      const title = document.createElement('h3'); title.textContent = exhibit.theme;
      const text = document.createElement('p'); text.textContent = exhibit.items.map(id => ITEMS[id]).join(' · ');
      article.append(title, text); return article;
    }));
  }
  $('next').addEventListener('click', () => { state = advance(state); render(); $('theme').focus(); });
  $('restart').addEventListener('click', () => {
    if (!state.done && (state.round || state.selected.length) && !window.confirm('重新抽題會清空這次展覽，要重新開始嗎？')) return;
    state = createGame(); render(); $('theme').focus();
  });
  render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => { $('offline').textContent = '目前未能啟用離線快取，仍可連線遊玩。'; });
}
