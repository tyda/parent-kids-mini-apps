"use strict";

// Pure story rules; no accounts, network calls, or saved personal data.
const OPENINGS = [
  "一隻小狐狸發現一把會發光的雨傘。",
  "一台迷你機器人收到一封來自雲朵的信。",
  "一隻小海龜在沙灘找到一扇小小的門。",
  "一顆會說話的種子掉進了空空的花盆。",
  "一位郵差撿到一張畫著星星的地圖。",
  "一隻企鵝在冰箱裡聽見神祕的敲門聲。"
];
const TURNS = [
  { lead: "但是", choices: ["路突然被一座軟綿綿的山擋住了。", "地圖上的箭頭突然倒過來了。"] },
  { lead: "幸好", choices: ["一位新朋友說：『我陪你一起試！』", "主角發現口袋裡有一顆勇氣鈕扣。"] },
  { lead: "但是", choices: ["橋只容得下一個人慢慢走過去。", "前面出現一個需要回答的謎題。"] },
  { lead: "幸好", choices: ["大家輪流說出一個好點子。", "一陣風送來一條彩色的線索。"] },
  { lead: "但是", choices: ["最後一把鑰匙突然不見了。", "天色暗了，路標也看不清了。"] },
  { lead: "最後", choices: ["大家合作完成任務，還約好下次再來。", "主角找到新方向，帶著朋友開心回家。"] }
];
function newGame(random = Math.random) {
  const n = random();
  if (!Number.isFinite(n) || n < 0 || n >= 1) throw new RangeError("random must be in [0,1)");
  return { opening: OPENINGS[Math.floor(n * OPENINGS.length)], picks: [] };
}
function choose(state, choice) {
  if (!state || !OPENINGS.includes(state.opening) || !Array.isArray(state.picks)) throw new TypeError("invalid game");
  if (state.picks.length >= TURNS.length) throw new RangeError("story finished");
  if (!Number.isInteger(choice) || choice < 0 || choice >= TURNS[state.picks.length].choices.length) throw new RangeError("invalid choice");
  return { opening: state.opening, picks: [...state.picks, choice] };
}
function lines(state) {
  return [state.opening, ...state.picks.map((choice, index) => `${TURNS[index].lead}，${TURNS[index].choices[choice]}`)];
}
if (typeof module !== "undefined" && module.exports) module.exports = { OPENINGS, TURNS, newGame, choose, lines };

if (typeof document !== "undefined") {
  const $ = (id) => document.getElementById(id);
  const story = $("story");
  const options = $("options");
  const progress = $("progress");
  const prompt = $("prompt");
  let game = null;
  let rounds = 0;
  function render() {
    story.replaceChildren();
    if (!game) return;
    for (const [index, text] of lines(game).entries()) {
      const p = document.createElement("p");
      p.textContent = text;
      p.className = index ? "chapter" : "opening";
      story.append(p);
    }
    const step = game.picks.length;
    options.replaceChildren();
    if (step === TURNS.length) {
      progress.textContent = "故事完成！";
      prompt.textContent = "一起從頭讀一遍：每人輪流說一句，還可以幫主角想一個名字。";
      $("start").textContent = "再玩一個新故事";
      return;
    }
    progress.textContent = `第 ${step + 1} / ${TURNS.length} 句 · ${step % 2 ? "大人" : "孩子"}選`;
    prompt.textContent = `先說說接下來可能發生什麼，再選一張「${TURNS[step].lead}」卡。`;
    TURNS[step].choices.forEach((text, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "option";
      button.textContent = `${TURNS[step].lead}，${text}`;
      button.addEventListener("click", () => { game = choose(game, index); render(); });
      options.append(button);
    });
  }
  $("start").addEventListener("click", () => {
    // Rotate openings if repeated clicks draw the same opening; restart stays fresh.
    const picked = newGame();
    if (game && picked.opening === game.opening) picked.opening = OPENINGS[(OPENINGS.indexOf(game.opening) + 1 + rounds % (OPENINGS.length - 1)) % OPENINGS.length];
    rounds += 1;
    game = picked;
    $("start").textContent = "重新開始（會清除這一局）";
    render();
  });
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {});
}
