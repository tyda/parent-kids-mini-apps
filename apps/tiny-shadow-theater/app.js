"use strict";
const CATEGORIES = Object.freeze({
  角色: [{id:"cat", icon:"🐈", label:"貓咪"},{id:"dino", icon:"🦕", label:"恐龍"},{id:"owl", icon:"🦉", label:"貓頭鷹"},{id:"rabbit", icon:"🐇", label:"兔子"}],
  地點: [{id:"forest", icon:"🌲", label:"森林"},{id:"moon", icon:"🌙", label:"月亮"},{id:"castle", icon:"🏰", label:"城堡"},{id:"sea", icon:"🌊", label:"海邊"}],
  道具: [{id:"umbrella", icon:"☂️", label:"雨傘"},{id:"key", icon:"🗝️", label:"鑰匙"},{id:"balloon", icon:"🎈", label:"氣球"},{id:"cake", icon:"🎂", label:"蛋糕"}]
});
function createGame() { return {act: 1, picks: {}, revealed: false, finished: false}; }
function select(game, category, id) {
  if (!Object.hasOwn(CATEGORIES, category) || !CATEGORIES[category].some(item => item.id === id)) throw new RangeError("不存在的圖卡");
  if (game.revealed || game.finished) return game;
  return {...game, picks: {...game.picks, [category]: id}};
}
function complete(game) { return Object.keys(CATEGORIES).every(category => game.picks[category]); }
function reveal(game) { return complete(game) && !game.finished ? {...game, revealed:true} : game; }
function nextAct(game) {
  if (!game.revealed || game.finished) return game;
  return game.act === 3 ? {...game, finished:true} : {act:game.act + 1, picks:{}, revealed:false, finished:false};
}
function progress(game) { return game.finished ? "三幕完成！" : `第 ${game.act} 幕／共 3 幕`; }
if (typeof module !== "undefined") module.exports = {CATEGORIES, createGame, select, reveal, nextAct, progress};
if (typeof document !== "undefined") {
  const $ = id => document.getElementById(id);
  let game = createGame();
  let curtain = false;
  const label = (category, id) => CATEGORIES[category].find(item => item.id === id);
  function render() {
    $("progress").textContent = progress(game);
    $("picker").hidden = curtain || game.finished;
    $("stage").hidden = !curtain || game.finished;
    $("done").hidden = !game.finished;
    $("handoff").disabled = !complete(game);
    $("handoff").hidden = curtain;
    $("reveal").hidden = !curtain || game.revealed;
    $("next").hidden = !game.revealed;
    $("edit").hidden = !curtain || game.revealed;
    $("hint").textContent = curtain ? (game.revealed ? "猜中了嗎？用這三張卡一起接一句故事！" : "先猜三個影子是什麼，再按揭曉。") : "出題者選角色、地點、道具各一張，按「交給猜的人」。";
    if (curtain) {
      const picks = Object.entries(CATEGORIES).map(([category]) => label(category, game.picks[category]));
      $("shadows").replaceChildren(...picks.map((item, i) => {
        const card = document.createElement("div");
        card.className = "shadow-card";
        const title = document.createElement("strong"); title.textContent = Object.keys(CATEGORIES)[i];
        const icon = document.createElement("span"); icon.className = game.revealed ? "shape revealed" : "shape"; icon.textContent = item.icon;
        const name = document.createElement("small"); name.textContent = game.revealed ? item.label : "猜猜我是誰？";
        card.append(title, icon, name);
        return card;
      }));
      if (game.revealed) $("story").textContent = `故事接龍：「${picks[0].label}在${picks[1].label}找到了${picks[2].label}，接下來會怎樣？」`;
      else $("story").textContent = "輪流說出你看到的線索；答案不必一次猜對。";
    }
    if (!curtain) {
      $("groups").replaceChildren(...Object.entries(CATEGORIES).map(([category, items]) => {
        const section = document.createElement("section");
        const title = document.createElement("h2"); title.textContent = category; section.append(title);
        const row = document.createElement("div"); row.className = "choices";
        for (const item of items) {
          const button = document.createElement("button"); button.type = "button";
          button.className = "choice"; button.setAttribute("aria-pressed", String(game.picks[category] === item.id));
          button.textContent = `${item.icon} ${item.label}`;
          button.addEventListener("click", () => { game = select(game, category, item.id); render(); });
          row.append(button);
        }
        section.append(row); return section;
      }));
    }
  }
  $("handoff").addEventListener("click", () => { if (complete(game)) { curtain = true; render(); } });
  $("edit").addEventListener("click", () => { curtain = false; render(); });
  $("reveal").addEventListener("click", () => { game = reveal(game); render(); });
  $("next").addEventListener("click", () => { game = nextAct(game); curtain = false; render(); });
  $("restart").addEventListener("click", () => { game = createGame(); curtain = false; render(); });
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js", {scope:"./"}).catch(() => {});
  render();
}
