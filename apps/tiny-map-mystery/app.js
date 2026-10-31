"use strict";
// 三張主題地圖：每格是四種地點之一，另有一個地標（不藏東西）和一條分界線。
const THEMES = Object.freeze([
  Object.freeze({
    id: "forest", icon: "🌲", title: "森林村", divider: "小河",
    landmark: Object.freeze({icon: "🏰", label: "城堡"}),
    places: Object.freeze([
      Object.freeze({icon: "🌳", label: "大樹"}),
      Object.freeze({icon: "🏠", label: "小屋"}),
      Object.freeze({icon: "🌸", label: "花田"}),
      Object.freeze({icon: "🍄", label: "蘑菇"})
    ])
  }),
  Object.freeze({
    id: "seaside", icon: "🌊", title: "海邊鎮", divider: "木棧道",
    landmark: Object.freeze({icon: "⚓", label: "大船錨"}),
    places: Object.freeze([
      Object.freeze({icon: "🐚", label: "貝殼"}),
      Object.freeze({icon: "⛵", label: "帆船"}),
      Object.freeze({icon: "🌴", label: "椰子樹"}),
      Object.freeze({icon: "🦀", label: "螃蟹"})
    ])
  }),
  Object.freeze({
    id: "fair", icon: "🎪", title: "遊樂園", divider: "小火車軌道",
    landmark: Object.freeze({icon: "🎡", label: "摩天輪"}),
    places: Object.freeze([
      Object.freeze({icon: "🎠", label: "旋轉木馬"}),
      Object.freeze({icon: "🎪", label: "帳篷"}),
      Object.freeze({icon: "🍦", label: "冰淇淋車"}),
      Object.freeze({icon: "🎈", label: "氣球攤"})
    ])
  })
]);
const OBJECTS = Object.freeze([
  Object.freeze({icon: "🔑", label: "金鑰匙"}),
  Object.freeze({icon: "🧸", label: "小熊布偶"}),
  Object.freeze({icon: "👑", label: "小皇冠"}),
  Object.freeze({icon: "🎁", label: "生日禮物"}),
  Object.freeze({icon: "🔔", label: "小鈴鐺"}),
  Object.freeze({icon: "🥁", label: "小鼓"})
]);
// 三種特徵各兩個值，八位嫌疑犯剛好是全部組合，三條證據一定能指認一位。
const TRAITS = Object.freeze({
  ears: Object.freeze({
    label: "耳朵",
    long: Object.freeze({icon: "👂", label: "尖長耳朵", evidence: "泥地上印著尖尖長長的耳朵影子"}),
    round: Object.freeze({icon: "👂", label: "圓圓耳朵", evidence: "泥地上印著圓圓的耳朵影子"})
  }),
  gear: Object.freeze({
    label: "穿戴",
    scarf: Object.freeze({icon: "🧣", label: "圍巾", evidence: "樹枝上勾到一段圍巾毛線"}),
    hat: Object.freeze({icon: "🎩", label: "高帽子", evidence: "地上掉了一個高帽子的帽帶"})
  }),
  snack: Object.freeze({
    label: "點心",
    apple: Object.freeze({icon: "🍎", label: "蘋果", evidence: "旁邊留下一個吃剩的蘋果核"}),
    cookie: Object.freeze({icon: "🍪", label: "餅乾", evidence: "旁邊撒了一路餅乾屑"})
  })
});
const TRAIT_KEYS = Object.freeze(["ears", "gear", "snack"]);
const SUSPECTS = Object.freeze([
  Object.freeze({id: "rabbit", icon: "🐰", label: "兔子", ears: "long", gear: "scarf", snack: "apple"}),
  Object.freeze({id: "fox", icon: "🦊", label: "狐狸", ears: "long", gear: "scarf", snack: "cookie"}),
  Object.freeze({id: "cat", icon: "🐱", label: "貓咪", ears: "long", gear: "hat", snack: "apple"}),
  Object.freeze({id: "wolf", icon: "🐺", label: "野狼", ears: "long", gear: "hat", snack: "cookie"}),
  Object.freeze({id: "bear", icon: "🐻", label: "小熊", ears: "round", gear: "scarf", snack: "apple"}),
  Object.freeze({id: "mouse", icon: "🐭", label: "老鼠", ears: "round", gear: "scarf", snack: "cookie"}),
  Object.freeze({id: "panda", icon: "🐼", label: "貓熊", ears: "round", gear: "hat", snack: "apple"}),
  Object.freeze({id: "koala", icon: "🐨", label: "無尾熊", ears: "round", gear: "hat", snack: "cookie"})
]);
const PLAYERS = Object.freeze([
  Object.freeze({icon: "🔍", label: "放大鏡偵探"}),
  Object.freeze({icon: "🧭", label: "指南針偵探"})
]);
const LEVELS = Object.freeze({
  easy: Object.freeze({size: 4, clues: 3, label: "見習偵探", note: "4×4 地圖，每案 3 張線索"}),
  hard: Object.freeze({size: 5, clues: 4, label: "資深偵探", note: "5×5 地圖，每案 4 張線索，還有步數線索"})
});
const CASE_COUNT = 3;
const BASE_STARS = 3;
const FINAL_STARS = 2;
// 每種線索所屬的家族；同一案每個家族只出一張，線索才會有變化。
const CLUE_FAMILY = Object.freeze({place: "place", notPlace: "place", nextTo: "near", notNextTo: "near", side: "side", edge: "edge", dir: "dir", within: "dist", exact: "dist"});
const MAX_ATTEMPTS = 2000;

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(list, rng) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
function mix(...parts) {
  return parts.reduce((hash, part) => Math.imul(hash ^ (part >>> 0), 0x9E3779B1) >>> 0, 0x811C9DC5);
}

function rowOf(map, cell) { return Math.floor(cell / map.size); }
function colOf(map, cell) { return cell % map.size; }
function coordLabel(map, cell) { return `${String.fromCharCode(65 + colOf(map, cell))}${rowOf(map, cell) + 1}`; }
function neighbors(map, cell) {
  const row = rowOf(map, cell), col = colOf(map, cell), out = [];
  if (row > 0) out.push(cell - map.size);
  if (row < map.size - 1) out.push(cell + map.size);
  if (col > 0) out.push(cell - 1);
  if (col < map.size - 1) out.push(cell + 1);
  return out;
}
function stepsBetween(map, a, b) { return Math.abs(rowOf(map, a) - rowOf(map, b)) + Math.abs(colOf(map, a) - colOf(map, b)); }
function hidingCells(map) { return map.places.map((_, cell) => cell).filter(cell => cell !== map.landmark); }

function makeMap(size, rng) {
  const landmark = Math.floor(rng() * size * size);
  const pool = [];
  for (let i = 0; i < size * size - 1; i++) pool.push(i % 4);
  const mixed = shuffle(pool, rng);
  const places = [];
  for (let cell = 0; cell < size * size; cell++) places.push(cell === landmark ? -1 : mixed.pop());
  const divider = {axis: rng() < 0.5 ? "h" : "v", at: 1 + Math.floor(rng() * (size - 1))};
  return {size, places, landmark, divider};
}
function clueMatches(map, cell, clue) {
  const row = rowOf(map, cell), col = colOf(map, cell);
  const lRow = rowOf(map, map.landmark), lCol = colOf(map, map.landmark);
  switch (clue.kind) {
    case "place": return map.places[cell] === clue.place;
    case "notPlace": return map.places[cell] !== clue.place;
    case "nextTo": return neighbors(map, cell).some(n => map.places[n] === clue.place);
    case "notNextTo": return !neighbors(map, cell).some(n => map.places[n] === clue.place);
    case "side": {
      const pos = map.divider.axis === "h" ? row : col;
      return clue.side === "before" ? pos < map.divider.at : pos >= map.divider.at;
    }
    case "edge": {
      const outer = row === 0 || col === 0 || row === map.size - 1 || col === map.size - 1;
      return clue.outer === outer;
    }
    case "dir":
      if (clue.dir === "up") return row < lRow;
      if (clue.dir === "down") return row > lRow;
      if (clue.dir === "left") return col < lCol;
      return col > lCol;
    case "within": return stepsBetween(map, cell, map.landmark) <= clue.steps;
    case "exact": return stepsBetween(map, cell, map.landmark) === clue.steps;
    default: throw new RangeError("不存在的線索");
  }
}
function candidatesFor(map, clues) { return hidingCells(map).filter(cell => clues.every(clue => clueMatches(map, cell, clue))); }
function allClues(map, level) {
  const clues = [];
  for (let place = 0; place < 4; place++) {
    clues.push({kind: "place", place}, {kind: "notPlace", place}, {kind: "nextTo", place});
    if (level === "hard") clues.push({kind: "notNextTo", place});
  }
  clues.push({kind: "side", side: "before"}, {kind: "side", side: "after"}, {kind: "edge", outer: true}, {kind: "edge", outer: false});
  for (const dir of ["up", "down", "left", "right"]) clues.push({kind: "dir", dir});
  if (level === "hard") for (const steps of [1, 2, 3]) clues.push({kind: "within", steps}, {kind: "exact", steps});
  return clues;
}
// 依序挑線索：每張都要真的排除格子，最後一張才剛好剩一格。
function pickClues(map, target, wanted, level, rng) {
  const pool = shuffle(allClues(map, level).filter(clue => clueMatches(map, target, clue)), rng);
  const families = new Set(), picked = [];
  let left = hidingCells(map);
  for (const clue of pool) {
    if (picked.length === wanted) break;
    if (families.has(CLUE_FAMILY[clue.kind])) continue;
    const next = left.filter(cell => clueMatches(map, cell, clue));
    if (next.length === left.length) continue;
    const isLast = picked.length === wanted - 1;
    if (isLast ? next.length !== 1 : next.length < 2) continue;
    picked.push(clue);
    families.add(CLUE_FAMILY[clue.kind]);
    left = next;
  }
  if (picked.length !== wanted || !isMinimal(map, picked)) return null;
  return picked;
}
// 少任何一張線索都解不出來：因此不論翻到哪，每張線索都有用，也一定有「提早破案」的賭注。
function isMinimal(map, clues) {
  return clues.every((_, skip) => candidatesFor(map, clues.filter((__, i) => i !== skip)).length > 1);
}
function makePlan(seed) {
  const rng = mulberry32(mix(seed, 0x5EED));
  return {
    themes: shuffle(THEMES.map((_, i) => i), rng),
    objects: shuffle(OBJECTS.map((_, i) => i), rng),
    culprit: Math.floor(rng() * SUSPECTS.length),
    traits: shuffle(TRAIT_KEYS.slice(), rng),
    lineup: shuffle(SUSPECTS.map(s => s.id), rng)
  };
}
function makeCase(seed, index, level) {
  const config = LEVELS[level];
  if (!config) throw new RangeError("不存在的難度");
  const plan = makePlan(seed);
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const rng = mulberry32(mix(seed, index + 1, attempt));
    const map = makeMap(config.size, rng);
    const cells = hidingCells(map);
    const target = cells[Math.floor(rng() * cells.length)];
    const clues = pickClues(map, target, config.clues, level, rng);
    if (clues) return {index, theme: plan.themes[index], object: plan.objects[index], map, target, clues};
  }
  throw new Error("找不到可解的地圖");
}
function placeName(theme, place) {
  const item = THEMES[theme].places[place];
  return `${item.icon} ${item.label}`;
}
function clueText(theme, map, clue) {
  const t = THEMES[theme], mark = `${t.landmark.icon} ${t.landmark.label}`;
  const horizontal = map.divider.axis === "h";
  switch (clue.kind) {
    case "place": return `東西藏在有「${placeName(theme, clue.place)}」的格子。`;
    case "notPlace": return `東西不在有「${placeName(theme, clue.place)}」的格子。`;
    case "nextTo": return `藏東西那一格的上下左右，至少有一格是「${placeName(theme, clue.place)}」。`;
    case "notNextTo": return `藏東西那一格的上下左右，都沒有「${placeName(theme, clue.place)}」。`;
    case "side": {
      const where = horizontal ? (clue.side === "before" ? "上面" : "下面") : (clue.side === "before" ? "左邊" : "右邊");
      return `東西在${t.divider}的${where}。`;
    }
    case "edge": return clue.outer ? "東西在地圖最外面一圈。" : "東西不在地圖最外面一圈，在裡面。";
    case "dir": {
      const where = {up: "上面的橫排", down: "下面的橫排", left: "左邊的直排", right: "右邊的直排"}[clue.dir];
      return `東西在比 ${mark} 更${where}（同一排不算）。`;
    }
    case "within": return `從 ${mark} 出發，${clue.steps} 步以內走得到（不能斜走）。`;
    case "exact": return `從 ${mark} 出發，剛好 ${clue.steps} 步走得到（不能斜走）。`;
    default: throw new RangeError("不存在的線索");
  }
}
function evidenceOf(culprit, trait) { return TRAITS[trait][culprit[trait]]; }

function createGame(options = {}) {
  const seed = Number.isInteger(options.seed) ? options.seed >>> 0 : 1;
  const level = options.level === undefined ? "easy" : options.level;
  if (!LEVELS[level]) throw new RangeError("不存在的難度");
  const plan = makePlan(seed);
  return {
    seed, level, phase: "briefing", caseIndex: 0, current: makeCase(seed, 0, level),
    revealed: 1, marks: [], searched: [],
    culprit: SUSPECTS[plan.culprit].id, traits: plan.traits, lineup: plan.lineup,
    history: [], wrongAccusations: [], finalStars: 0
  };
}
function suspectById(id) { return SUSPECTS.find(s => s.id === id); }
function roles(game) {
  const reader = (game.caseIndex + game.revealed - 1) % 2;
  return {reader, marker: 1 - reader};
}
function startInvestigation(game) { return game.phase === "briefing" ? {...game, phase: "investigate"} : game; }
function revealedClues(game) { return game.current.clues.slice(0, game.revealed); }
function canReveal(game) { return game.phase === "investigate" && game.revealed < game.current.clues.length; }
function revealClue(game) { return canReveal(game) ? {...game, revealed: game.revealed + 1} : game; }
function isHidingCell(game, cell) { return Number.isInteger(cell) && cell >= 0 && cell < game.current.map.places.length && cell !== game.current.map.landmark; }
function toggleMark(game, cell) {
  if (game.phase !== "investigate" || !isHidingCell(game, cell) || game.searched.includes(cell)) return game;
  const marks = game.marks.includes(cell) ? game.marks.filter(c => c !== cell) : [...game.marks, cell];
  return {...game, marks};
}
// 只比對已翻開的線索，絕不看答案；所以「檢查」不會洩題，只幫忙抓畫錯的叉。
function checkMarks(game) {
  const {map} = game.current;
  const possible = candidatesFor(map, revealedClues(game)).filter(cell => !game.searched.includes(cell));
  const wrongMarks = game.marks.filter(cell => possible.includes(cell));
  const unmarked = hidingCells(map).filter(cell => !possible.includes(cell) && !game.marks.includes(cell) && !game.searched.includes(cell));
  return {possible: possible.length, wrongMarks, unmarked: unmarked.length};
}
function previewStars(game) {
  const base = Math.max(1, BASE_STARS - game.searched.length);
  const bonus = game.revealed < game.current.clues.length ? 1 : 0;
  return {base, bonus, total: base + bonus};
}
function searchCell(game, cell) {
  if (game.phase !== "investigate" || !isHidingCell(game, cell) || game.searched.includes(cell)) return game;
  if (cell !== game.current.target) {
    return {...game, searched: [...game.searched, cell], marks: game.marks.filter(c => c !== cell)};
  }
  const {base, bonus, total} = previewStars(game);
  const trait = game.traits[game.caseIndex];
  const entry = {caseIndex: game.caseIndex, base, bonus, stars: total, misses: game.searched.length, cluesUsed: game.revealed, trait};
  return {...game, phase: "solved", history: [...game.history, entry]};
}
function explainCase(current) {
  const out = [];
  let left = hidingCells(current.map);
  for (const clue of current.clues) {
    const next = left.filter(cell => clueMatches(current.map, cell, clue));
    out.push({clue, removed: left.length - next.length, left: next.length});
    left = next;
  }
  return out;
}
function nextCase(game) {
  if (game.phase !== "solved") return game;
  if (game.caseIndex + 1 >= CASE_COUNT) return {...game, phase: "accuse"};
  const caseIndex = game.caseIndex + 1;
  return {...game, phase: "briefing", caseIndex, current: makeCase(game.seed, caseIndex, game.level), revealed: 1, marks: [], searched: []};
}
function knownEvidence(game) {
  const culprit = suspectById(game.culprit);
  return game.history.map(entry => ({trait: entry.trait, value: culprit[entry.trait], ...evidenceOf(culprit, entry.trait)}));
}
function matchingSuspects(evidence) { return SUSPECTS.filter(s => evidence.every(item => s[item.trait] === item.value)); }
function mismatches(game, suspectId) {
  const suspect = suspectById(suspectId);
  return knownEvidence(game).filter(item => suspect[item.trait] !== item.value).map(item => ({trait: item.trait, suspectHas: TRAITS[item.trait][suspect[item.trait]].label, evidenceSays: item.label}));
}
function accuse(game, suspectId) {
  if (!suspectById(suspectId)) throw new RangeError("不存在的嫌疑犯");
  if (game.phase !== "accuse" || game.wrongAccusations.includes(suspectId)) return game;
  if (suspectId !== game.culprit) return {...game, wrongAccusations: [...game.wrongAccusations, suspectId]};
  return {...game, phase: "finished", finalStars: Math.max(0, FINAL_STARS - game.wrongAccusations.length)};
}
function caseStars(game) { return game.history.reduce((sum, entry) => sum + entry.stars, 0); }
function totalStars(game) { return caseStars(game) + game.finalStars; }
function maxStars() { return CASE_COUNT * (BASE_STARS + 1) + FINAL_STARS; }
function progressText(game) {
  if (game.phase === "finished") return `結案！團隊星星 ⭐ ${totalStars(game)}／${maxStars()}`;
  if (game.phase === "accuse") return `最後一步：指認調皮鬼 · 團隊星星 ⭐ ${caseStars(game)}`;
  return `第 ${game.caseIndex + 1}／${CASE_COUNT} 案 · 團隊星星 ⭐ ${caseStars(game)}`;
}
function rankFor(stars) {
  const ratio = stars / maxStars();
  if (ratio >= 0.85) return "🏅 傳奇神探：又大膽又細心！";
  if (ratio >= 0.6) return "🎖️ 小鎮名偵探：推理很穩，再大膽一點就更厲害。";
  return "🔍 認真見習生：每畫掉一格都是推理，下一場一定更快！";
}

if (typeof module !== "undefined") module.exports = {THEMES, OBJECTS, TRAITS, TRAIT_KEYS, SUSPECTS, PLAYERS, LEVELS, CASE_COUNT, BASE_STARS, FINAL_STARS, CLUE_FAMILY, mulberry32, shuffle, rowOf, colOf, coordLabel, neighbors, stepsBetween, hidingCells, makeMap, clueMatches, candidatesFor, allClues, pickClues, isMinimal, makePlan, makeCase, clueText, createGame, suspectById, roles, startInvestigation, revealedClues, canReveal, revealClue, toggleMark, checkMarks, previewStars, searchCell, explainCase, nextCase, knownEvidence, matchingSuspects, mismatches, accuse, caseStars, totalStars, maxStars, progressText, rankFor};

if (typeof document !== "undefined") {
  const $ = id => document.getElementById(id);
  const GUIDE_KEY = "tiny-map-mystery:guide-seen";
  let game = null;
  let setupLevel = "easy";
  let tool = "mark";
  let cursor = 0;
  let pending = null;
  let flagged = [];
  let notice = "";
  let focusKey = null;

  function el(tag, props = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (key === "class") node.className = value;
      else if (key.startsWith("aria-") || key.startsWith("data-") || key === "role") node.setAttribute(key, value);
      else node[key] = value;
    }
    node.append(...children);
    return node;
  }
  function button(label, onClick, props = {}) {
    const b = el("button", {type: "button", ...props}, label);
    b.addEventListener("click", onClick);
    return b;
  }
  function announce(text) { $("live").textContent = text; }
  function playerName(index) { return `${PLAYERS[index].icon} ${PLAYERS[index].label}`; }
  function resetCaseUi() { tool = "mark"; cursor = 0; pending = null; flagged = []; notice = ""; }
  function dividerNode(current) {
    const {map} = current;
    return el("div", {class: `divider divider-${map.divider.axis}`, "aria-hidden": "true", style: `--at:${map.divider.at};--n:${map.size}`});
  }
  function mapBlock(current, grid) {
    const t = THEMES[current.theme];
    return el("div", {class: "map-block"},
      el("div", {class: "map-wrap"}, grid, dividerNode(current)),
      el("p", {class: "legend", "aria-hidden": "true"}, el("span", {class: "swatch"}), `藍色條紋是${t.divider}；${t.landmark.icon} 是${t.landmark.label}，不藏東西`));
  }
  function dividerDescription(current) {
    const {map} = current, name = THEMES[current.theme].divider, at = map.divider.at;
    return map.divider.axis === "h" ? `${name}橫跨地圖，在第 ${at} 和第 ${at + 1} 橫排之間。` : `${name}直直穿過地圖，在第 ${at} 和第 ${at + 1} 直排之間，也就是 ${String.fromCharCode(64 + at)} 和 ${String.fromCharCode(65 + at)} 之間。`;
  }
  function cellInfo(current, cell) {
    const t = THEMES[current.theme], {map} = current;
    return cell === map.landmark ? t.landmark : t.places[map.places[cell]];
  }

  function renderMap() {
    const {current} = game, {map} = current;
    const grid = el("div", {class: "map", role: "group", style: `--n:${map.size}`, "aria-label": `${THEMES[current.theme].title}地圖，${map.size} 乘 ${map.size} 格。方向鍵移動，空白鍵打叉，Enter 搜查。${dividerDescription(current)}`});
    map.places.forEach((_, cell) => {
      const info = cellInfo(current, cell), isLandmark = cell === map.landmark;
      const marked = game.marks.includes(cell), missed = game.searched.includes(cell), wrong = flagged.includes(cell);
      const state = isLandmark ? "，地標，東西不會藏在這裡" : missed ? "，搜查過了，沒有東西" : marked ? `，已打叉${wrong ? "，檢查發現這個叉可能打錯了" : ""}` : "";
      const b = el("button", {
        type: "button",
        class: `cell${isLandmark ? " landmark" : ""}${marked ? " marked" : ""}${missed ? " missed" : ""}${wrong ? " flagged" : ""}${pending === cell ? " pending" : ""}`,
        tabIndex: cell === cursor ? 0 : -1,
        "data-key": `cell-${cell}`,
        "data-cell": String(cell),
        "aria-label": `${coordLabel(map, cell)}，${info.label}${state}`
      },
      el("small", {"aria-hidden": "true"}, coordLabel(map, cell)),
      el("span", {class: "cell-icon", "aria-hidden": "true"}, info.icon),
      el("span", {class: "cell-mark", "aria-hidden": "true"}, missed ? "🚫" : marked ? "✕" : ""));
      b.addEventListener("click", () => tapCell(cell));
      b.addEventListener("focus", () => { cursor = cell; });
      grid.append(b);
    });
    grid.addEventListener("keydown", onMapKey);
    return mapBlock(current, grid);
  }
  function staticMap(current) {
    const {map} = current;
    const grid = el("div", {class: "map static", role: "img", style: `--n:${map.size}`, "aria-label": `答案在 ${coordLabel(map, current.target)}，${cellInfo(current, current.target).label}的格子。`});
    map.places.forEach((_, cell) => {
      const info = cellInfo(current, cell), hit = cell === current.target;
      grid.append(el("div", {class: `cell${cell === map.landmark ? " landmark" : ""}${hit ? " hit" : " dim"}`},
        el("small", {}, coordLabel(map, cell)),
        el("span", {class: "cell-icon"}, hit ? OBJECTS[current.object].icon : info.icon)));
    });
    return mapBlock(current, grid);
  }
  function tapCell(cell) {
    const {map} = game.current;
    cursor = cell;
    if (cell === map.landmark) { setNotice(`${cellInfo(game.current, cell).label}是地標，東西不會藏在這裡。`, `cell-${cell}`); return; }
    if (game.searched.includes(cell)) { setNotice(`${coordLabel(map, cell)} 已經搜查過了，沒有東西。`, `cell-${cell}`); return; }
    if (tool === "search") { askSearch(cell); return; }
    markCell(cell);
  }
  function setNotice(text, key) {
    notice = text;
    focusKey = key;
    render();
    announce(text);
  }
  function markCell(cell) {
    const {map} = game.current;
    const before = game;
    game = toggleMark(game, cell);
    if (game === before) return;
    flagged = flagged.filter(c => c !== cell);
    pending = null;
    setNotice(`${coordLabel(map, cell)} ${game.marks.includes(cell) ? "打叉" : "取消打叉"}。`, `cell-${cell}`);
  }
  function askSearch(cell) {
    pending = cell;
    focusKey = "confirm-search";
    notice = "";
    render();
    announce(`要搜查 ${coordLabel(game.current.map, cell)} 嗎？`);
  }
  function cancelSearch() {
    const cell = pending;
    pending = null;
    focusKey = cell === null ? null : `cell-${cell}`;
    render();
    announce("取消搜查");
  }
  function confirmSearch() {
    const cell = pending, {map} = game.current;
    pending = null;
    tool = "mark";
    const before = game.searched.length;
    game = searchCell(game, cell);
    if (game.phase === "solved") { render(true); return; }
    if (game.searched.length > before) setNotice(`${coordLabel(map, cell)} 什麼都沒有！少 1 顆星，再想一想。`, `cell-${cell}`);
  }
  function onMapKey(event) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const size = game.current.map.size;
    const moves = {ArrowUp: -size, ArrowDown: size, ArrowLeft: -1, ArrowRight: 1};
    if (moves[event.key] !== undefined) {
      event.preventDefault();
      const next = cursor + moves[event.key];
      const blocked = next < 0 || next >= size * size || (Math.abs(moves[event.key]) === 1 && Math.floor(next / size) !== Math.floor(cursor / size));
      if (blocked) return;
      cursor = next;
      focusKey = `cell-${cursor}`;
      render();
    } else if (event.key === " ") {
      event.preventDefault();
      const cell = Number(event.target.dataset.cell);
      if (cell === game.current.map.landmark || game.searched.includes(cell)) tapCell(cell);
      else markCell(cell);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const cell = Number(event.target.dataset.cell);
      if (cell === game.current.map.landmark || game.searched.includes(cell)) tapCell(cell);
      else askSearch(cell);
    }
  }
  function doReveal() {
    if (!canReveal(game)) return;
    game = revealClue(game);
    flagged = [];
    const {current} = game;
    const r = roles(game);
    setNotice(`新線索：${clueText(current.theme, current.map, current.clues[game.revealed - 1])} 換 ${PLAYERS[r.reader].label}念線索，${PLAYERS[r.marker].label}打叉。`, canReveal(game) ? "reveal" : `cell-${cursor}`);
  }
  function doCheck() {
    const result = checkMarks(game);
    flagged = result.wrongMarks;
    const parts = [`依照翻開的線索，還有 ${result.possible} 格可能。`];
    parts.push(result.wrongMarks.length ? `有 ${result.wrongMarks.length} 個叉打錯了，閃黃框的格子其實還有可能。` : "你們打的叉都沒有錯。");
    if (result.unmarked) parts.push(`還有 ${result.unmarked} 格可以再打叉。`);
    setNotice(parts.join(""), "check");
  }

  function renderSetup() {
    const options = el("div", {class: "options", role: "group", "aria-label": "選擇難度"});
    for (const [id, level] of Object.entries(LEVELS)) {
      options.append(button(`${level.label}：${level.note}`, () => { setupLevel = id; focusKey = `level-${id}`; render(); }, {class: "option", "aria-pressed": String(setupLevel === id), "data-key": `level-${id}`}));
    }
    const start = button("🗺️ 打開地圖，接第一個案子", () => {
      const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
      game = createGame({seed, level: setupLevel});
      resetCaseUi();
      $("guide").open = false;
      try { localStorage.setItem(GUIDE_KEY, "1"); } catch (_) { /* 私密模式可忽略 */ }
      render(true);
    }, {class: "primary"});
    $("view").replaceChildren(el("section", {class: "panel", "aria-labelledby": "setup-title"},
      el("h2", {id: "setup-title"}, "偵探社開張"),
      el("p", {}, `小鎮有 ${CASE_COUNT} 件東西被藏起來了。一案約 2–5 分鐘，全部破案後再指認調皮鬼。`),
      options, start));
  }
  function renderBriefing() {
    const {current} = game, t = THEMES[current.theme], obj = OBJECTS[current.object], r = roles(game);
    const go = button("打開地圖，翻第一張線索 🔍", () => { game = startInvestigation(game); resetCaseUi(); render(true); }, {class: "primary"});
    $("view").replaceChildren(el("section", {class: "panel curtain", "aria-labelledby": "brief-title"},
      el("div", {class: "big", "aria-hidden": "true"}, `${t.icon}${obj.icon}`),
      el("h2", {id: "brief-title"}, `第 ${game.caseIndex + 1} 案：${t.title}的${obj.label}不見了！`),
      el("p", {}, `有人把${obj.label}藏在地圖的某一格，還留下線索。翻線索、打叉、討論，再決定搜查哪一格。`),
      el("p", {class: "step"}, `這張線索由 ${playerName(r.reader)} 念，${playerName(r.marker)} 拿手機打叉；翻新線索就換人。`),
      go));
  }
  function clueList() {
    const {current} = game;
    const list = el("ol", {class: "clues", "aria-label": "翻開的線索"});
    revealedClues(game).forEach((clue, i) => {
      list.append(el("li", {class: i === game.revealed - 1 ? "fresh" : ""}, clueText(current.theme, current.map, clue)));
    });
    return list;
  }
  function renderInvestigate() {
    const {current} = game, t = THEMES[current.theme], obj = OBJECTS[current.object], r = roles(game);
    const stars = previewStars(game), remaining = current.clues.length - game.revealed;
    const tools = el("div", {class: "tools", role: "group", "aria-label": "點格子時要做什麼"},
      button("✕ 打叉", () => { tool = "mark"; pending = null; focusKey = "tool-mark"; render(); announce("工具：打叉"); }, {class: "option", "aria-pressed": String(tool === "mark"), "data-key": "tool-mark"}),
      button("🔍 搜查", () => { tool = "search"; focusKey = "tool-search"; render(); announce("工具：搜查，接著點想搜查的格子"); }, {class: "option", "aria-pressed": String(tool === "search"), "data-key": "tool-search"}));
    const parts = [
      el("h3", {}, `線索（${game.revealed}／${current.clues.length}）`),
      clueList(),
      el("p", {class: "step"}, `${playerName(r.reader)} 念線索，${playerName(r.marker)} 打叉；打叉前先說說看哪些格子不可能。`)
    ];
    if (pending !== null) {
      parts.push(el("div", {class: "confirm", role: "group", "aria-label": "確認搜查"},
        el("p", {}, `🔍 要搜查 ${coordLabel(current.map, pending)} 嗎？找錯會少 1 顆星。`),
        el("div", {class: "row"},
          button("確定搜查", confirmSearch, {class: "go", "data-key": "confirm-search"}),
          button("再想想", cancelSearch, {"data-key": "cancel-search"}))));
    }
    parts.push(tools);
    parts.push(el("div", {class: "row"},
      button("✔️ 檢查我的叉", doCheck, {"data-key": "check", "aria-keyshortcuts": "C"}),
      canReveal(game)
        ? button(`🃏 翻新線索（剩 ${remaining} 張）`, doReveal, {"data-key": "reveal", "aria-keyshortcuts": "N"})
        : button("線索都翻完了", () => {}, {disabled: true})));
    parts.push(el("p", {class: "stars-now"}, `現在破案可得 ⭐ ${stars.base}${stars.bonus ? " ＋ 大膽獎 ⭐ 1" : ""}`));
    if (notice) parts.push(el("p", {class: "notice"}, notice));
    $("view").replaceChildren(el("section", {class: "panel", "aria-labelledby": "inv-title"},
      el("h2", {id: "inv-title"}, `${obj.icon} ${t.title}：找${obj.label}`),
      el("div", {class: "board"}, renderMap(), el("div", {class: "side"}, ...parts))));
  }
  function evidenceItem(item) { return el("li", {}, el("span", {class: "pic", "aria-hidden": "true"}, item.icon), `${item.evidence}（${item.label}）`); }
  function renderSolved() {
    const {current} = game, obj = OBJECTS[current.object];
    const entry = game.history[game.history.length - 1];
    const culprit = suspectById(game.culprit);
    const evidence = evidenceOf(culprit, entry.trait);
    const steps = el("ol", {class: "clues"});
    for (const step of explainCase(current)) {
      steps.append(el("li", {}, `${clueText(current.theme, current.map, step.clue)} `, el("small", {}, `（排除 ${step.removed} 格，剩 ${step.left} 格）`)));
    }
    const last = game.caseIndex + 1 >= CASE_COUNT;
    const next = button(last ? "🕵️ 證據到齊，去指認調皮鬼" : "接下一案，換人先念 🔄", () => { game = nextCase(game); resetCaseUi(); render(true); }, {class: "primary"});
    $("view").replaceChildren(el("section", {class: "panel", "aria-labelledby": "sol-title"},
      el("h2", {id: "sol-title"}, `🎉 找到${obj.label}了！藏在 ${coordLabel(current.map, current.target)}`),
      el("p", {class: "stars-now"}, `這案得到 ⭐ ${entry.stars}${entry.bonus ? "（含大膽獎：線索沒翻完就破案）" : ""}${entry.misses ? `，搜錯 ${entry.misses} 次` : ""}`),
      el("div", {class: "board"}, staticMap(current),
        el("div", {class: "side"},
          el("div", {class: "evidence-new"}, el("strong", {}, "🧾 找到新證據！"), el("p", {}, `${evidence.icon} ${evidence.evidence}。調皮鬼的${TRAITS[entry.trait].label}是「${evidence.label}」。`)),
          el("h3", {}, "全部線索怎麼排除"),
          steps,
          el("p", {class: "step"}, "輪流說一句：哪一張線索最有用？為什麼？"))),
      next));
  }
  function suspectCard(suspect) {
    const wrong = game.wrongAccusations.includes(suspect.id);
    const traits = TRAIT_KEYS.map(key => TRAITS[key][suspect[key]].label);
    const b = el("button", {type: "button", class: `suspect${wrong ? " cleared" : ""}`, disabled: wrong, "aria-label": `${suspect.label}：${traits.join("、")}${wrong ? "，已排除" : ""}`, "data-key": `suspect-${suspect.id}`},
      el("span", {class: "pic", "aria-hidden": "true"}, suspect.icon),
      el("strong", {"aria-hidden": "true"}, suspect.label),
      el("span", {class: "traits", "aria-hidden": "true"}, `${TRAITS.ears[suspect.ears].label}`),
      el("span", {class: "traits", "aria-hidden": "true"}, `${TRAITS.gear[suspect.gear].icon} ${TRAITS.gear[suspect.gear].label} ${TRAITS.snack[suspect.snack].icon} ${TRAITS.snack[suspect.snack].label}`));
    b.addEventListener("click", () => {
      const before = game;
      game = accuse(game, suspect.id);
      if (game === before) return;
      if (game.phase === "finished") { notice = ""; render(true); return; }
      const miss = mismatches(game, suspect.id).map(m => `牠是${m.suspectHas}，但證據說${m.evidenceSays}`).join("；");
      setNotice(`不是${suspect.label}喔：${miss}。`, null);
    });
    return b;
  }
  function renderAccuse() {
    const evidence = el("ul", {class: "evidence", "aria-label": "三條證據"}, ...knownEvidence(game).map(evidenceItem));
    const grid = el("div", {class: "suspects", role: "group", "aria-label": "八位嫌疑犯"}, ...game.lineup.map(id => suspectCard(suspectById(id))));
    const parts = [
      el("h2", {id: "acc-title"}, "🕵️ 誰是調皮鬼？"),
      el("p", {}, "把三條證據一條一條對。兩個人都同意了，再按下那張卡。一次指認成功可得 ⭐ 2。"),
      evidence
    ];
    if (notice) parts.push(el("p", {class: "notice"}, notice));
    parts.push(grid);
    $("view").replaceChildren(el("section", {class: "panel", "aria-labelledby": "acc-title"}, ...parts));
  }
  function renderFinished() {
    const culprit = suspectById(game.culprit), total = totalStars(game);
    const list = el("ul", {class: "evidence"});
    game.history.forEach(entry => {
      const c = makeCase(game.seed, entry.caseIndex, game.level);
      list.append(el("li", {}, `第 ${entry.caseIndex + 1} 案 ${THEMES[c.theme].title}的${OBJECTS[c.object].label}：⭐ ${entry.stars}`));
    });
    list.append(el("li", {}, `指認調皮鬼：⭐ ${game.finalStars}`));
    const again = button("再開一場（新地圖、新調皮鬼）", () => { game = null; resetCaseUi(); render(true); }, {class: "primary"});
    $("view").replaceChildren(el("section", {class: "panel curtain", "aria-labelledby": "fin-title"},
      el("div", {class: "big", "aria-hidden": "true"}, culprit.icon),
      el("h2", {id: "fin-title"}, `抓到了！調皮鬼是${culprit.label}！`),
      el("p", {}, `原來${culprit.label}只是想邀請大家玩尋寶，還準備了${TRAITS.snack[culprit.snack].label}要請客。`),
      el("p", {class: "stars-now"}, `團隊星星 ⭐ ${total}／${maxStars()}`),
      el("p", {}, rankFor(total)),
      list,
      el("p", {class: "step"}, "換你們出題：現實中藏一樣小東西，給對方三句線索。"),
      again));
  }
  function render(moveFocus = false) {
    const active = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.key : null;
    $("progress").textContent = game ? progressText(game) : "還沒開案";
    $("restart").hidden = !game;
    if (!game) renderSetup();
    else ({briefing: renderBriefing, investigate: renderInvestigate, solved: renderSolved, accuse: renderAccuse, finished: renderFinished})[game.phase]();
    if (moveFocus) {
      focusKey = null;
      const heading = $("view").querySelector("h2");
      if (heading) { heading.tabIndex = -1; heading.focus({preventScroll: true}); }
      $("view").scrollIntoView({block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"});
      return;
    }
    const wanted = focusKey || active;
    focusKey = null;
    if (wanted) {
      const target = $("view").querySelector(`[data-key="${wanted}"]`);
      if (target && !target.disabled) target.focus({preventScroll: true});
    }
  }

  document.addEventListener("keydown", event => {
    if (!game || game.phase !== "investigate" || event.altKey || event.ctrlKey || event.metaKey) return;
    const key = event.key.toLowerCase();
    if (key === "n") { event.preventDefault(); doReveal(); }
    else if (key === "c") { event.preventDefault(); doCheck(); }
    else if (event.key === "Escape" && pending !== null) { event.preventDefault(); cancelSearch(); }
  });
  $("restart").addEventListener("click", () => {
    if (confirm("要結束這場、回到準備畫面嗎？")) { game = null; resetCaseUi(); render(true); }
  });
  try { if (localStorage.getItem(GUIDE_KEY)) $("guide").open = false; } catch (_) { /* 忽略 */ }
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js", {scope: "./"}).catch(() => {});
  render();
}
