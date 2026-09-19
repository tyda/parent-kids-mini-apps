(function (root) {
  "use strict";

  const ROUND_COUNT = 6;
  const PUZZLES = [
    { id: "food", items: [["apple", "🍎", "蘋果"], ["banana", "🍌", "香蕉"], ["berry", "🍓", "草莓"], ["carrot", "🥕", "紅蘿蔔"]], odd: "carrot", reason: "紅蘿蔔通常被當作蔬菜，其他三個通常被當作水果。" },
    { id: "travel", items: [["car", "🚗", "汽車"], ["bike", "🚲", "腳踏車"], ["bus", "🚌", "公車"], ["fish", "🐟", "魚"]], odd: "fish", reason: "魚是動物，其他三個是陸地上的交通工具。" },
    { id: "table", items: [["spoon", "🥄", "湯匙"], ["fork", "🍴", "叉子"], ["bowl", "🥣", "碗"], ["sock", "🧦", "襪子"]], odd: "sock", reason: "襪子穿在腳上，其他三個常在吃飯時使用。" },
    { id: "animals", items: [["dog", "🐶", "狗"], ["cat", "🐱", "貓"], ["rabbit", "🐰", "兔子"], ["octopus", "🐙", "章魚"]], odd: "octopus", reason: "章魚住在水裡，其他三個主要生活在陸地上。" },
    { id: "sky", items: [["sun", "☀️", "太陽"], ["moon", "🌙", "月亮"], ["star", "⭐", "星星"], ["umbrella", "☂️", "雨傘"]], odd: "umbrella", reason: "雨傘是人做的物品，其他三個都能在天空中看到。" },
    { id: "shapes", items: [["circle", "⭕", "圓形"], ["triangle", "🔺", "三角形"], ["square", "⬜", "方形"], ["toast", "🍞", "吐司"]], odd: "toast", reason: "吐司是食物，其他三個是幾何形狀。" },
    { id: "music", items: [["guitar", "🎸", "吉他"], ["piano", "🎹", "鋼琴"], ["drum", "🥁", "鼓"], ["torch", "🔦", "手電筒"]], odd: "torch", reason: "手電筒用來照明，其他三個是樂器。" },
    { id: "plants", items: [["tree", "🌳", "樹"], ["flower", "🌷", "花"], ["cactus", "🌵", "仙人掌"], ["helicopter", "🚁", "直升機"]], odd: "helicopter", reason: "直升機是交通工具，其他三個都是植物。" },
    { id: "wear", items: [["hat", "👒", "帽子"], ["shoe", "👟", "鞋子"], ["glove", "🧤", "手套"], ["cake", "🍰", "蛋糕"]], odd: "cake", reason: "蛋糕可以吃，其他三個可以穿戴。" },
    { id: "fly", items: [["butterfly", "🦋", "蝴蝶"], ["bird", "🐦", "小鳥"], ["plane", "✈️", "飛機"], ["turtle", "🐢", "烏龜"]], odd: "turtle", reason: "烏龜通常不會飛，其他三個都能在空中飛行。" },
    { id: "bath", items: [["toothbrush", "🪥", "牙刷"], ["soap", "🧼", "肥皂"], ["shampoo", "🧴", "洗髮精"], ["popcorn", "🍿", "爆米花"]], odd: "popcorn", reason: "爆米花是零食，其他三個常用來清潔身體。" },
    { id: "cold", items: [["snowman", "⛄", "雪人"], ["ice", "🧊", "冰塊"], ["penguin", "🐧", "企鵝"], ["volcano", "🌋", "火山"]], odd: "volcano", reason: "火山讓人想到高溫，其他三個讓人想到寒冷。" }
  ];

  function shuffle(items, random = Math.random) {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function buildDeck(random = Math.random, count = ROUND_COUNT) {
    return shuffle(PUZZLES, random).slice(0, Math.min(count, PUZZLES.length));
  }

  function evaluatePick(puzzle, itemId) {
    return { matchesReference: puzzle.odd === itemId, reason: puzzle.reason };
  }

  function addReasonStar(current, earnedThisRound, limit = 2) {
    if (earnedThisRound >= limit) return { total: current, earnedThisRound };
    return { total: current + 1, earnedThisRound: earnedThisRound + 1 };
  }

  const core = { ROUND_COUNT, PUZZLES, shuffle, buildDeck, evaluatePick, addReasonStar };
  if (typeof module !== "undefined" && module.exports) module.exports = core;
  root.OddOneLabCore = core;

  if (typeof document === "undefined") return;

  const roundLabel = document.querySelector("#roundLabel");
  const starLabel = document.querySelector("#starLabel");
  const turnLabel = document.querySelector("#turnLabel");
  const choices = document.querySelector("#choices");
  const reasonPanel = document.querySelector("#reasonPanel");
  const pickMessage = document.querySelector("#pickMessage");
  const officialReason = document.querySelector("#officialReason");
  const reasonButton = document.querySelector("#reasonButton");
  const extraButton = document.querySelector("#extraButton");
  const nextButton = document.querySelector("#nextButton");
  const finishPanel = document.querySelector("#finishPanel");
  const finishMessage = document.querySelector("#finishMessage");
  const playAgainButton = document.querySelector("#playAgainButton");
  const restartButton = document.querySelector("#restartButton");

  let deck = [];
  let round = 0;
  let stars = 0;
  let earnedThisRound = 0;
  let selected = false;

  function updateStars() {
    const max = deck.length * 2;
    starLabel.textContent = `理由星 ${"★".repeat(stars)}${"☆".repeat(max - stars)}`;
    starLabel.setAttribute("aria-label", `目前獲得 ${stars} 顆理由星，共 ${max} 顆`);
  }

  function renderRound() {
    const puzzle = deck[round];
    selected = false;
    earnedThisRound = 0;
    roundLabel.textContent = `第 ${round + 1} / ${deck.length} 題`;
    turnLabel.textContent = `這題請「${round % 2 === 0 ? "小小研究員" : "大研究員"}」先選`;
    reasonPanel.classList.add("hidden");
    finishPanel.classList.add("hidden");
    choices.classList.remove("hidden");
    turnLabel.classList.remove("hidden");
    reasonButton.disabled = false;
    extraButton.disabled = false;
    nextButton.disabled = true;
    nextButton.textContent = round === deck.length - 1 ? "看研究結果 →" : "下一題，交換先選的人 →";
    choices.replaceChildren();

    shuffle(puzzle.items).forEach(([id, emoji, name]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice";
      button.dataset.id = id;
      button.setAttribute("aria-label", `${name} ${emoji}`);
      button.innerHTML = `<span class="emoji" aria-hidden="true">${emoji}</span><span class="name">${name}</span>`;
      choices.append(button);
    });
    updateStars();
  }

  function selectItem(button) {
    if (selected) return;
    selected = true;
    const puzzle = deck[round];
    const result = evaluatePick(puzzle, button.dataset.id);
    choices.querySelectorAll("button").forEach((choice) => { choice.disabled = true; });
    button.classList.add("selected");
    pickMessage.textContent = result.matchesReference
      ? "你找到了研究所準備的分類！現在把理由說出來。"
      : "有創意的選擇！先說說看，你用的是什麼分類方法？";
    officialReason.textContent = result.reason;
    reasonPanel.classList.remove("hidden");
    reasonButton.focus();
  }

  function earnStar(button, message) {
    const result = addReasonStar(stars, earnedThisRound);
    stars = result.total;
    earnedThisRound = result.earnedThisRound;
    button.disabled = true;
    button.textContent = message;
    nextButton.disabled = false;
    updateStars();
  }

  function finishGame() {
    choices.classList.add("hidden");
    reasonPanel.classList.add("hidden");
    turnLabel.classList.add("hidden");
    finishPanel.classList.remove("hidden");
    roundLabel.textContent = "研究完成";
    finishMessage.textContent = `你們一起收集了 ${stars} 顆理由星，而且完成了 ${deck.length} 種分類討論。`;
    playAgainButton.focus();
  }

  function startGame() {
    deck = buildDeck();
    round = 0;
    stars = 0;
    renderRound();
  }

  choices.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-id]");
    if (button) selectItem(button);
  });
  reasonButton.addEventListener("click", () => earnStar(reasonButton, "✓ 第一個理由完成"));
  extraButton.addEventListener("click", () => earnStar(extraButton, "✓ 第二種分法完成"));
  nextButton.addEventListener("click", () => {
    if (round + 1 >= deck.length) finishGame();
    else { round += 1; renderRound(); }
  });
  playAgainButton.addEventListener("click", startGame);
  restartButton.addEventListener("click", startGame);

  startGame();
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
  }
}(typeof globalThis !== "undefined" ? globalThis : this));
