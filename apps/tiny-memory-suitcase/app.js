(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MemorySuitcase = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const ITEMS = [
    { emoji: "🧦", name: "條紋襪子" }, { emoji: "🪥", name: "小牙刷" },
    { emoji: "🍎", name: "紅蘋果" }, { emoji: "🧸", name: "玩具熊" },
    { emoji: "📕", name: "故事書" }, { emoji: "🕶️", name: "太陽眼鏡" },
    { emoji: "🥨", name: "蝴蝶餅" }, { emoji: "🧢", name: "藍帽子" },
    { emoji: "🔦", name: "手電筒" }, { emoji: "🦆", name: "小黃鴨" },
    { emoji: "🥄", name: "湯匙" }, { emoji: "🌂", name: "小雨傘" },
    { emoji: "🪁", name: "風箏" }, { emoji: "🍌", name: "香蕉" },
    { emoji: "⚽", name: "足球" }, { emoji: "🧩", name: "拼圖" },
    { emoji: "🚗", name: "玩具車" }, { emoji: "🥤", name: "水壺" }
  ];

  function validateGoal(goal) {
    if (![3, 5, 7].includes(goal)) throw new Error("goal must be 3, 5, or 7");
  }

  function shuffled(items, random) {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function createGame(goal, random = Math.random) {
    validateGoal(goal);
    const deck = shuffled(ITEMS, random);
    return { goal, sequence: [deck[0]], deck: deck.slice(1), turn: 1 };
  }

  function getChoices(game, count = 3) {
    return game.deck.slice(0, count);
  }

  function addItem(game, name) {
    if (game.sequence.length >= game.goal) throw new Error("game is already complete");
    const index = game.deck.findIndex((item) => item.name === name);
    if (index < 0) throw new Error("item is not available");
    const item = game.deck[index];
    return {
      goal: game.goal,
      sequence: game.sequence.concat(item),
      deck: game.deck.filter((_, itemIndex) => itemIndex !== index),
      turn: game.turn === 1 ? 2 : 1
    };
  }

  function isComplete(game) {
    return game.sequence.length === game.goal;
  }

  return { ITEMS, createGame, getChoices, addItem, isComplete };
});

(function () {
  "use strict";
  if (typeof document === "undefined") return;

  const core = window.MemorySuitcase;
  const $ = (selector) => document.querySelector(selector);
  const setup = $("#setup");
  const gamePanel = $("#game");
  const result = $("#result");
  const lookStage = $("#look-stage");
  const recallStage = $("#recall-stage");
  const checkStage = $("#check-stage");
  let goal = 5;
  let game = null;

  function setVisible(element, visible) {
    element.classList.toggle("hidden", !visible);
  }

  function itemMarkup(item) {
    return `<li><span class="emoji" aria-hidden="true">${item.emoji}</span><span>${item.name}</span></li>`;
  }

  function renderList(element, sequence) {
    element.innerHTML = sequence.map(itemMarkup).join("");
  }

  function updateHeader() {
    $("#turn-label").textContent = `第 ${game.turn} 位的回合`;
    $("#progress").textContent = `${game.sequence.length} / ${game.goal} 件`;
    $("#meter-fill").style.width = `${(game.sequence.length / game.goal) * 100}%`;
  }

  function showLook() {
    updateHeader();
    renderList($("#suitcase"), game.sequence);
    setVisible(lookStage, true);
    setVisible(recallStage, false);
    setVisible(checkStage, false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showCheck() {
    renderList($("#answer"), game.sequence);
    setVisible(recallStage, false);
    setVisible(checkStage, true);
    const complete = core.isComplete(game);
    setVisible($("#choice-title"), !complete);
    setVisible($("#choices"), !complete);
    setVisible($("#finish"), complete);
    if (!complete) {
      $("#choices").innerHTML = "";
      core.getChoices(game).forEach((item) => {
        const button = document.createElement("button");
        button.className = "choice";
        button.innerHTML = `<span class="emoji" aria-hidden="true">${item.emoji}</span>${item.name}`;
        button.addEventListener("click", () => {
          game = core.addItem(game, item.name);
          showLook();
        });
        $("#choices").appendChild(button);
      });
    }
  }

  function readBest() {
    try { return Number(localStorage.getItem("tiny-memory-suitcase-best")) || 0; }
    catch (_) { return 0; }
  }

  function saveBest(value) {
    try { localStorage.setItem("tiny-memory-suitcase-best", String(value)); }
    catch (_) { /* Storage can be unavailable in private browsing. */ }
  }

  function finishGame() {
    const oldBest = readBest();
    const best = Math.max(oldBest, game.goal);
    saveBest(best);
    renderList($("#final-list"), game.sequence);
    $("#result-copy").textContent = `你們一起記住了 ${game.goal} 件物品，而且順利輪流完成！`;
    $("#best").textContent = best > oldBest ? `新紀錄：${best} 件 🎉` : `這台裝置的最高紀錄：${best} 件`;
    setVisible(gamePanel, false);
    setVisible(result, true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.querySelectorAll(".level").forEach((button) => {
    button.addEventListener("click", () => {
      goal = Number(button.dataset.goal);
      document.querySelectorAll(".level").forEach((item) => item.classList.toggle("selected", item === button));
    });
  });

  $("#start").addEventListener("click", () => {
    game = core.createGame(goal);
    setVisible(setup, false);
    setVisible(result, false);
    setVisible(gamePanel, true);
    showLook();
  });

  $("#hide-items").addEventListener("click", () => {
    setVisible(lookStage, false);
    setVisible(recallStage, true);
    $("#reveal").focus();
  });
  $("#reveal").addEventListener("click", showCheck);
  $("#finish").addEventListener("click", finishGame);
  $("#again").addEventListener("click", () => {
    setVisible(result, false);
    setVisible(setup, true);
  });
  $("#reset-record").addEventListener("click", () => {
    try { localStorage.removeItem("tiny-memory-suitcase-best"); } catch (_) { /* no-op */ }
    $("#best").textContent = "最高紀錄已清除，可以重新挑戰。";
  });

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }
})();
