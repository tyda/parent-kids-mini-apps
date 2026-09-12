(function (root) {
  "use strict";

  const SIZE = 5;
  const MOVES = {
    up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0]
  };

  function key(point) { return `${point.x},${point.y}`; }

  function createMission(random = Math.random) {
    const start = { x: 0, y: Math.floor(random() * SIZE) };
    const goal = { x: SIZE - 1, y: Math.floor(random() * SIZE) };
    const safe = new Set();
    for (let x = start.x; x <= goal.x; x += 1) safe.add(`${x},${start.y}`);
    const low = Math.min(start.y, goal.y);
    const high = Math.max(start.y, goal.y);
    for (let y = low; y <= high; y += 1) safe.add(`${goal.x},${y}`);

    const candidates = [];
    for (let y = 0; y < SIZE; y += 1) {
      for (let x = 0; x < SIZE; x += 1) {
        const pointKey = `${x},${y}`;
        if (!safe.has(pointKey)) candidates.push({ x, y });
      }
    }
    for (let i = candidates.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    return { start, goal, rocks: candidates.slice(0, 6) };
  }

  function movePosition(position, direction, size = SIZE) {
    const delta = MOVES[direction];
    if (!delta) return { ...position, moved: false };
    const x = Math.max(0, Math.min(size - 1, position.x + delta[0]));
    const y = Math.max(0, Math.min(size - 1, position.y + delta[1]));
    return { x, y, moved: x !== position.x || y !== position.y };
  }

  function evaluateMove(mission, position) {
    if (key(position) === key(mission.goal)) return "goal";
    if (mission.rocks.some((rock) => key(rock) === key(position))) return "rock";
    return "safe";
  }

  const core = { SIZE, createMission, movePosition, evaluateMove, key };
  if (typeof module !== "undefined" && module.exports) module.exports = core;
  root.SpaceNavigatorCore = core;

  if (typeof document === "undefined") return;

  const board = document.querySelector("#board");
  const missionLabel = document.querySelector("#missionLabel");
  const shieldLabel = document.querySelector("#shieldLabel");
  const rolePrompt = document.querySelector("#rolePrompt");
  const hideButton = document.querySelector("#hideButton");
  const showButton = document.querySelector("#showButton");
  const controls = document.querySelector("#controls");
  const nextButton = document.querySelector("#nextButton");
  const restartButton = document.querySelector("#restartButton");

  let round = 1;
  let mission;
  let position;
  let shields;
  let hidden;
  let finished;
  let visited;
  let peekTimer;

  function startMission() {
    window.clearTimeout(peekTimer);
    mission = createMission();
    position = { ...mission.start };
    shields = 2;
    hidden = false;
    finished = false;
    visited = new Set([key(position)]);
    missionLabel.textContent = `任務 ${round} / 3`;
    rolePrompt.textContent = "導航員，先記住安全航線！";
    hideButton.classList.remove("hidden");
    showButton.classList.add("hidden");
    controls.classList.add("hidden");
    nextButton.classList.add("hidden");
    render();
  }

  function render(hitKey = "") {
    shieldLabel.textContent = `護盾 ${"❤️".repeat(shields)}${"🖤".repeat(2 - shields)}`;
    board.replaceChildren();
    for (let y = 0; y < SIZE; y += 1) {
      for (let x = 0; x < SIZE; x += 1) {
        const point = { x, y };
        const pointKey = key(point);
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.setAttribute("role", "gridcell");
        if (visited.has(pointKey)) cell.classList.add("visited");
        if (pointKey === hitKey) cell.classList.add("hit");
        if (pointKey === key(position)) {
          cell.textContent = "🚀";
          cell.classList.add("ship");
          cell.setAttribute("aria-label", "太空船目前位置");
        } else if (pointKey === key(mission.goal)) {
          cell.textContent = "🌟";
          cell.setAttribute("aria-label", "太空站");
        } else if (!hidden && mission.rocks.some((rock) => key(rock) === pointKey)) {
          cell.textContent = "🪨";
          cell.setAttribute("aria-label", "隕石");
        } else {
          cell.setAttribute("aria-label", "太空格");
        }
        board.append(cell);
      }
    }
  }

  function beginDriving() {
    hidden = true;
    rolePrompt.textContent = "駕駛員，聽方向密語按按鍵。別撞到看不見的隕石！";
    hideButton.classList.add("hidden");
    showButton.classList.remove("hidden");
    controls.classList.remove("hidden");
    render();
  }

  function drive(direction) {
    if (finished || !hidden) return;
    const next = movePosition(position, direction);
    if (!next.moved) {
      rolePrompt.textContent = "宇宙邊界到了，換一個方向。";
      return;
    }
    position = { x: next.x, y: next.y };
    visited.add(key(position));
    const result = evaluateMove(mission, position);
    if (result === "rock") {
      shields -= 1;
      rolePrompt.textContent = shields ? "碰到隕石，少一格護盾！導航員快改路線。" : "護盾用完了！沒關係，地圖重新亮起，再試一次。";
      render(key(position));
      if (!shields) {
        hidden = false;
        controls.classList.add("hidden");
        showButton.classList.add("hidden");
        hideButton.textContent = "🙈 再記一次，藏起隕石";
        hideButton.classList.remove("hidden");
      }
      return;
    }
    if (result === "goal") {
      finished = true;
      rolePrompt.textContent = round === 3 ? "三次任務完成！你們是最佳星際搭檔 ✨" : "抵達太空站！擊掌一下，下一關交換角色。";
      controls.classList.add("hidden");
      showButton.classList.add("hidden");
      if (round < 3) nextButton.classList.remove("hidden");
    }
    render();
  }

  hideButton.addEventListener("click", beginDriving);
  showButton.addEventListener("click", () => {
    if (finished) return;
    hidden = false;
    showButton.disabled = true;
    rolePrompt.textContent = "緊急雷達開啟 3 秒，快看！";
    render();
    peekTimer = window.setTimeout(() => {
      hidden = true;
      showButton.disabled = false;
      rolePrompt.textContent = "雷達關閉，繼續聽方向密語。";
      render();
    }, 3000);
  });
  controls.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-direction]");
    if (button) drive(button.dataset.direction);
  });
  nextButton.addEventListener("click", () => { round += 1; startMission(); });
  restartButton.addEventListener("click", () => {
    round = 1;
    hideButton.textContent = "🙈 記好了，藏起隕石";
    startMission();
  });
  document.addEventListener("keydown", (event) => {
    const direction = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" }[event.key];
    if (direction) { event.preventDefault(); drive(direction); }
  });

  startMission();
  if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
}(typeof globalThis !== "undefined" ? globalThis : this));