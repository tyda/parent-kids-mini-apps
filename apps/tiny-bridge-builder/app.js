"use strict";

// N, E, S, W. A tile connects exactly two neighbouring shores.
const N = 1, E = 2, S = 4, W = 8;
const ROUTES = [
  [4, 5, 6, 10, 11],
  [4, 0, 1, 5, 9, 10, 11],
  [4, 8, 9, 13, 14, 10, 11],
  [4, 5, 1, 2, 6, 7, 11],
  [4, 5, 9, 8, 12, 13, 14, 15, 11]
];
const DIRS = [[N, -4, S], [E, 1, W], [S, 4, N], [W, -1, E]];

function direction(from, to) {
  if (to === from - 4) return N;
  if (to === from + 4) return S;
  if (to === from + 1 && from % 4 !== 3) return E;
  if (to === from - 1 && from % 4 !== 0) return W;
  throw new Error("路線包含非相鄰格子");
}
function rotate(mask) { return ((mask << 1) & 15) | (mask >> 3); }
function makeLevel(route, levelIndex = 0) {
  const solution = Array.from({length: 16}, (_, i) => (i + levelIndex) % 3 === 0 ? N | S : N | E);
  route.forEach((cell, i) => {
    const previous = i === 0 ? W : direction(cell, route[i - 1]);
    const next = i === route.length - 1 ? E : direction(cell, route[i + 1]);
    solution[cell] = previous | next;
  });
  const tiles = solution.map((mask, i) => {
    let turns = (i + levelIndex) % 3 + 1;
    while (turns--) mask = rotate(mask);
    return mask;
  });
  // Ensure the starting board is never already connected.
  if (isConnected(tiles)) tiles[route[0]] = rotate(tiles[route[0]]);
  return { route: [...route], solution, tiles };
}
function isConnected(tiles) {
  if (!Array.isArray(tiles) || tiles.length !== 16 || !(tiles[4] & W) || !(tiles[11] & E)) return false;
  const queue = [4], visited = new Set([4]);
  for (let n = 0; n < queue.length; n++) {
    const cell = queue[n];
    for (const [out, offset, back] of DIRS) {
      const next = cell + offset;
      if (!(tiles[cell] & out) || next < 0 || next >= 16 ||
          (out === E && cell % 4 === 3) || (out === W && cell % 4 === 0) ||
          !(tiles[next] & back) || visited.has(next)) continue;
      visited.add(next);
      queue.push(next);
    }
  }
  return visited.has(11);
}
function turnTile(tiles, index) {
  if (!Number.isInteger(index) || index < 0 || index >= 16) throw new RangeError("格子超出範圍");
  return tiles.map((mask, i) => i === index ? rotate(mask) : mask);
}

if (typeof module !== "undefined") module.exports = { N, E, S, W, ROUTES, rotate, direction, makeLevel, isConnected, turnTile };

if (typeof document !== "undefined") {
  const board = document.querySelector("#board");
  const levelText = document.querySelector("#levelText");
  const status = document.querySelector("#status");
  const nextButton = document.querySelector("#nextButton");
  const hintButton = document.querySelector("#hintButton");
  const restartButton = document.querySelector("#restartButton");
  const names = ["小溪", "彎彎河", "森林河", "雲朵河", "大海灣"];
  let stage = 0, tiles, solved = false;
  const openings = [[N, "上"], [E, "右"], [S, "下"], [W, "左"]];

  function draw() {
    board.replaceChildren();
    tiles.forEach((mask, i) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tile";
      button.setAttribute("aria-label", `第 ${Math.floor(i / 4) + 1} 排第 ${i % 4 + 1} 格，橋面朝${openings.filter(([bit]) => mask & bit).map(([, name]) => name).join("和")}，點擊旋轉`);
      if (i === 4) button.classList.add("start");
      if (i === 11) button.classList.add("end");
      for (const [bit, label] of openings) {
        if (!(mask & bit)) continue;
        const piece = document.createElement("span");
        piece.className = `piece piece-${label}`;
        button.append(piece);
      }
      const center = document.createElement("span");
      center.className = "center";
      button.append(center);
      button.addEventListener("click", () => {
        if (solved) return;
        tiles = turnTile(tiles, i);
        check();
        if (!solved) board.children[i].focus();
      });
      board.append(button);
    });
  }
  function check() {
    solved = isConnected(tiles);
    draw();
    nextButton.hidden = !solved;
    hintButton.disabled = solved;
    status.textContent = solved
      ? stage === ROUTES.length - 1 ? "五座橋都通了！你們是最佳橋樑搭檔。" : "橋通了！換一個人轉下一座橋吧。"
      : "點橋塊讓橋面轉彎，從左岸連到右岸。";
    nextButton.textContent = stage === ROUTES.length - 1 ? "再玩一輪" : "下一座橋 →";
  }
  function start(index) {
    stage = index;
    tiles = makeLevel(ROUTES[stage], stage).tiles;
    solved = false;
    levelText.textContent = `第 ${stage + 1} / ${ROUTES.length} 座：${names[stage]}`;
    check();
  }
  hintButton.addEventListener("click", () => {
    const solution = makeLevel(ROUTES[stage], stage).solution;
    const wrong = ROUTES[stage].find((i) => tiles[i] !== solution[i]);
    if (wrong === undefined) {
      status.textContent = "標準路線已排好，再看看左右岸有沒有接通。";
      return;
    }
    // A hint reveals the position but does not silently solve the puzzle.
    const tile = board.children[wrong];
    tile.classList.add("hint");
    tile.focus();
    status.textContent = `提示：第 ${Math.floor(wrong / 4) + 1} 排第 ${wrong % 4 + 1} 格，可以試著轉一轉。`;
  });
  nextButton.addEventListener("click", () => start((stage + 1) % ROUTES.length));
  restartButton.addEventListener("click", () => start(0));
  start(0);
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("./sw.js", {scope: "./"}).catch(() => {});
  }
}
