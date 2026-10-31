"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const G = require("./app.js");
const {THEMES, OBJECTS, TRAITS, TRAIT_KEYS, SUSPECTS, LEVELS, CASE_COUNT, CLUE_FAMILY} = G;

// 內容資料
assert.ok(OBJECTS.length >= CASE_COUNT);
assert.ok(THEMES.length >= CASE_COUNT);
for (const theme of THEMES) assert.equal(theme.places.length, 4);
assert.equal(SUSPECTS.length, 8);
assert.equal(new Set(SUSPECTS.map(s => s.id)).size, 8);
assert.equal(new Set(SUSPECTS.map(s => TRAIT_KEYS.map(k => s[k]).join("/"))).size, 8, "suspects cover every trait combination");
for (const s of SUSPECTS) for (const k of TRAIT_KEYS) assert.ok(TRAITS[k][s[k]], "trait exists");

// 隨機數可重現
const r1 = G.mulberry32(42), r2 = G.mulberry32(42);
for (let i = 0; i < 5; i++) assert.equal(r1(), r2());

// 幾何小工具
const tiny = {size: 4};
assert.equal(G.coordLabel(tiny, 0), "A1");
assert.equal(G.coordLabel(tiny, 6), "C2");
assert.equal(G.coordLabel(tiny, 15), "D4");
assert.deepEqual(G.neighbors(tiny, 0).sort((a, b) => a - b), [1, 4]);
assert.deepEqual(G.neighbors(tiny, 5).sort((a, b) => a - b), [1, 4, 6, 9]);
assert.deepEqual(G.neighbors(tiny, 7).sort((a, b) => a - b), [3, 6, 11], "no wrap across rows");
assert.equal(G.stepsBetween(tiny, 0, 15), 6);

// 每種線索的判斷（固定地圖，手算答案）
const P = (...rows) => rows.flat();
const fixed = {size: 4, landmark: 5, divider: {axis: "h", at: 2}, places: P(
  [0, 1, 2, 3],
  [1, -1, 3, 0],
  [2, 3, 0, 1],
  [3, 0, 1, 2])};
const cellsWhere = clue => G.candidatesFor(fixed, [clue]);
assert.deepEqual(cellsWhere({kind: "place", place: 0}), [0, 7, 10, 13]);
assert.ok(!cellsWhere({kind: "notPlace", place: 0}).includes(0));
assert.equal(cellsWhere({kind: "notPlace", place: 0}).length, 11);
assert.deepEqual(cellsWhere({kind: "nextTo", place: 2}), [1, 3, 4, 6, 9, 11, 12, 14]);
assert.deepEqual(cellsWhere({kind: "notNextTo", place: 2}), [0, 2, 7, 8, 10, 13, 15]);
assert.deepEqual(cellsWhere({kind: "side", side: "before"}), [0, 1, 2, 3, 4, 6, 7]);
assert.deepEqual(cellsWhere({kind: "side", side: "after"}), [8, 9, 10, 11, 12, 13, 14, 15]);
assert.deepEqual(cellsWhere({kind: "edge", outer: false}), [6, 9, 10]);
assert.equal(cellsWhere({kind: "edge", outer: true}).length, 12);
assert.deepEqual(cellsWhere({kind: "dir", dir: "up"}), [0, 1, 2, 3]);
assert.deepEqual(cellsWhere({kind: "dir", dir: "left"}), [0, 4, 8, 12]);
assert.deepEqual(cellsWhere({kind: "dir", dir: "down"}), [8, 9, 10, 11, 12, 13, 14, 15]);
assert.deepEqual(cellsWhere({kind: "dir", dir: "right"}), [2, 3, 6, 7, 10, 11, 14, 15]);
assert.deepEqual(cellsWhere({kind: "within", steps: 1}), [1, 4, 6, 9]);
assert.deepEqual(cellsWhere({kind: "exact", steps: 2}), [0, 2, 7, 8, 10, 13]);
assert.ok(!G.candidatesFor(fixed, []).includes(5), "landmark never hides anything");
assert.throws(() => G.clueMatches(fixed, 0, {kind: "nope"}), RangeError);
// 直向分界線
assert.deepEqual(G.candidatesFor({...fixed, divider: {axis: "v", at: 1}}, [{kind: "side", side: "before"}]), [0, 4, 8, 12]);

// 大量種子：每案都可解、唯一、線索無贅述、文字完整、同種子結果相同
const families = new Set();
for (const [level, config] of Object.entries(LEVELS)) {
  for (let seed = 1; seed <= 400; seed++) {
    for (let index = 0; index < CASE_COUNT; index++) {
      const c = G.makeCase(seed, index, level);
      if (seed <= 20) assert.deepEqual(c, G.makeCase(seed, index, level), "deterministic");
      const {map, target, clues} = c;
      assert.equal(map.size, config.size);
      assert.equal(map.places.length, config.size ** 2);
      assert.equal(map.places.filter(p => p === -1).length, 1, "exactly one landmark");
      assert.equal(map.places[map.landmark], -1);
      for (let place = 0; place < 4; place++) assert.ok(map.places.filter(p => p === place).length >= 3, "every place appears");
      assert.notEqual(target, map.landmark);
      assert.ok(map.divider.at >= 1 && map.divider.at < config.size, "divider splits the map");
      assert.equal(clues.length, config.clues);
      assert.deepEqual(G.candidatesFor(map, clues), [target], "all clues leave only the target");
      assert.ok(G.isMinimal(map, clues), "every clue is needed");
      assert.equal(new Set(clues.map(cl => CLUE_FAMILY[cl.kind])).size, clues.length, "varied clue families");
      let left = G.hidingCells(map).length;
      for (let i = 0; i < clues.length; i++) {
        const now = G.candidatesFor(map, clues.slice(0, i + 1));
        assert.ok(now.includes(target), "true clue");
        assert.ok(now.length < left, "each clue removes something");
        if (i < clues.length - 1) assert.ok(now.length >= 2, "still a real gamble before the last clue");
        left = now.length;
        const text = G.clueText(c.theme, map, clues[i]);
        assert.ok(text.length > 4 && !/undefined|null|NaN/.test(text), text);
        families.add(clues[i].kind);
      }
      if (level === "easy") assert.ok(!clues.some(cl => ["notNextTo", "within", "exact"].includes(cl.kind)), "easy has no step clues");
    }
    const themes = [0, 1, 2].map(i => G.makeCase(seed, i, level).theme);
    assert.equal(new Set(themes).size, CASE_COUNT, "three different maps");
  }
}
for (const kind of Object.keys(CLUE_FAMILY)) assert.ok(families.has(kind), `clue kind ${kind} actually appears`);
assert.throws(() => G.makeCase(1, 0, "nope"), RangeError);
assert.notDeepEqual(G.makeCase(1, 0, "easy").map, G.makeCase(2, 0, "easy").map, "seed changes the map");

// 線索文字會用到當前主題的名稱
const theme = 0, name = THEMES[theme];
assert.ok(G.clueText(theme, fixed, {kind: "side", side: "before"}).includes(`${name.divider}的上面`));
assert.ok(G.clueText(theme, fixed, {kind: "side", side: "after"}).includes("下面"));
assert.ok(G.clueText(theme, {...fixed, divider: {axis: "v", at: 2}}, {kind: "side", side: "before"}).includes("左邊"));
assert.ok(G.clueText(theme, {...fixed, divider: {axis: "v", at: 2}}, {kind: "side", side: "after"}).includes("右邊"));
assert.ok(G.clueText(theme, fixed, {kind: "dir", dir: "up"}).includes(name.landmark.label));
assert.ok(G.clueText(theme, fixed, {kind: "exact", steps: 2}).includes("剛好 2 步"));

// 開局與選項
assert.throws(() => G.createGame({level: "nope"}), RangeError);
assert.deepEqual(G.createGame({seed: 9, level: "hard"}), G.createGame({seed: 9, level: "hard"}));
const culprits = new Set();
for (let seed = 1; seed <= 200; seed++) culprits.add(G.createGame({seed}).culprit);
assert.equal(culprits.size, 8, "any suspect can be the culprit");

function start(seed = 7, level = "easy") { return G.startInvestigation(G.createGame({seed, level})); }
function wrongCell(game, skip = []) {
  return G.hidingCells(game.current.map).find(cell => cell !== game.current.target && !skip.includes(cell));
}

// 階段保護
let g = G.createGame({seed: 7});
assert.equal(g.phase, "briefing");
assert.equal(G.revealClue(g), g, "no reveal during briefing");
assert.equal(G.toggleMark(g, 0), g, "no marks during briefing");
assert.equal(G.searchCell(g, g.current.target), g, "no search during briefing");
assert.equal(G.nextCase(g), g);
assert.equal(G.accuse(g, "fox"), g);
assert.throws(() => G.accuse(g, "ghost"), RangeError);

// 打叉：可取消、不可打在地標、不改原物件
g = start();
const original = g, cellA = wrongCell(g);
g = G.toggleMark(g, cellA);
assert.deepEqual(g.marks, [cellA]);
assert.deepEqual(original.marks, [], "pure update");
assert.deepEqual(G.toggleMark(g, cellA).marks, []);
assert.equal(G.toggleMark(g, g.current.map.landmark), g, "landmark cannot be marked");
assert.equal(G.toggleMark(g, -1), g);
assert.equal(G.toggleMark(g, 999), g);
assert.equal(G.toggleMark(g, 1.5), g);

// 檢查：只依翻開的線索判斷，不看答案
for (let seed = 1; seed <= 100; seed++) {
  let c = start(seed);
  const possible = G.candidatesFor(c.current.map, G.revealedClues(c));
  const impossible = G.hidingCells(c.current.map).filter(cell => !possible.includes(cell));
  assert.equal(G.checkMarks(c).possible, possible.length);
  assert.equal(G.checkMarks(c).unmarked, impossible.length);
  // 同樣的地圖與線索、換一個答案，結果要一模一樣
  const other = possible.find(cell => cell !== c.current.target);
  if (other !== undefined) {
    const swapped = {...c, current: {...c.current, target: other}};
    assert.deepEqual(G.checkMarks(swapped), G.checkMarks(c), "check never peeks at the answer");
  }
  for (const cell of impossible) c = G.toggleMark(c, cell);
  assert.deepEqual(G.checkMarks(c), {possible: possible.length, wrongMarks: [], unmarked: 0});
  c = G.toggleMark(c, possible[0]);
  assert.deepEqual(G.checkMarks(c).wrongMarks, [possible[0]], "flags a wrong cross");
}

// 翻線索與換手
g = start(7);
assert.equal(g.revealed, 1);
assert.equal(G.roles(g).reader, 0);
g = G.revealClue(g);
assert.equal(g.revealed, 2);
assert.deepEqual(G.roles(g), {reader: 1, marker: 0}, "roles swap on each new clue");
g = G.revealClue(G.revealClue(g));
assert.equal(g.revealed, g.current.clues.length, "cannot reveal past the deck");
assert.equal(G.canReveal(g), false);
assert.equal(G.revealClue(g), g);

// 計分：全翻完找到＝3 顆
g = start(7);
while (G.canReveal(g)) g = G.revealClue(g);
assert.deepEqual(G.previewStars(g), {base: 3, bonus: 0, total: 3});
g = G.searchCell(g, g.current.target);
assert.equal(g.phase, "solved");
assert.equal(g.history[0].stars, 3);
assert.equal(G.searchCell(g, g.current.target), g, "no search after solved");

// 計分：沒翻完就找到＝大膽獎
g = G.searchCell(start(7), start(7).current.target);
assert.equal(g.history[0].base, 3);
assert.equal(g.history[0].bonus, 1);
assert.equal(g.history[0].stars, 4);
assert.equal(g.history[0].cluesUsed, 1);

// 計分：搜錯扣星、最少 1 顆，不能重複搜，叉會清掉
g = start(7);
const miss1 = wrongCell(g);
g = G.toggleMark(g, miss1);
g = G.searchCell(g, miss1);
assert.deepEqual(g.searched, [miss1]);
assert.deepEqual(g.marks, [], "searched cell loses its cross");
assert.equal(g.phase, "investigate");
assert.equal(G.searchCell(g, miss1), g, "cannot search the same cell twice");
assert.equal(G.toggleMark(g, miss1), g, "searched cell cannot be crossed");
assert.equal(G.searchCell(g, g.current.map.landmark), g, "landmark cannot be searched");
assert.equal(G.previewStars(g).base, 2);
g = G.searchCell(g, wrongCell(g, g.searched));
assert.equal(G.previewStars(g).base, 1);
g = G.searchCell(g, wrongCell(g, g.searched));
assert.equal(G.previewStars(g).base, 1, "at least one star");
assert.equal(G.checkMarks(g).possible, G.candidatesFor(g.current.map, G.revealedClues(g)).filter(c => !g.searched.includes(c)).length, "searched cells are no longer possible");
g = G.searchCell(g, g.current.target);
assert.equal(g.history[0].misses, 3);
assert.equal(g.history[0].stars, 2, "1 star + bold bonus");

// 每個案子最後都找得到：不斷搜錯也不會卡死
for (let seed = 1; seed <= 40; seed++) {
  let c = start(seed, "hard");
  for (const cell of G.hidingCells(c.current.map)) if (cell !== c.current.target) c = G.searchCell(c, cell);
  c = G.searchCell(c, c.current.target);
  assert.equal(c.phase, "solved");
  assert.equal(c.history[0].stars, 2);
}

// 解說：逐張線索的排除數字加起來剛好
for (let seed = 1; seed <= 50; seed++) {
  const c = G.makeCase(seed, 0, "hard");
  const steps = G.explainCase(c);
  assert.equal(steps[steps.length - 1].left, 1);
  assert.equal(steps.reduce((sum, s) => sum + s.removed, 0), G.hidingCells(c.map).length - 1);
  assert.ok(steps.every(s => s.removed > 0));
}

// 完整一場
function solveAll(seed, level) {
  let game = G.createGame({seed, level});
  for (let i = 0; i < CASE_COUNT; i++) {
    assert.equal(game.phase, "briefing");
    assert.equal(game.caseIndex, i);
    assert.equal(game.revealed, 1, "new case starts with one clue");
    assert.deepEqual(game.marks, []);
    assert.deepEqual(game.searched, []);
    assert.equal(G.roles(game).reader, i % 2, "first reader alternates by case");
    game = G.startInvestigation(game);
    while (G.canReveal(game)) game = G.revealClue(game);
    game = G.nextCase(G.searchCell(game, game.current.target));
  }
  return game;
}
for (let seed = 1; seed <= 100; seed++) {
  const game = solveAll(seed, seed % 2 ? "easy" : "hard");
  assert.equal(game.phase, "accuse");
  const evidence = G.knownEvidence(game);
  assert.equal(evidence.length, 3);
  assert.deepEqual(new Set(evidence.map(e => e.trait)), new Set(TRAIT_KEYS), "one clue for each trait");
  const matches = G.matchingSuspects(evidence);
  assert.equal(matches.length, 1, "evidence points at exactly one suspect");
  assert.equal(matches[0].id, game.culprit);
  assert.deepEqual(new Set(game.lineup), new Set(SUSPECTS.map(s => s.id)));
}

// 指認：一次成功／指認錯有說明／錯的不再算／星星
g = solveAll(11, "easy");
const wrongSuspects = SUSPECTS.filter(s => s.id !== g.culprit);
assert.equal(G.caseStars(g), 9);
assert.equal(G.progressText(g).includes("指認"), true);
const once = G.accuse(g, g.culprit);
assert.equal(once.phase, "finished");
assert.equal(once.finalStars, 2);
assert.equal(G.totalStars(once), 11);
assert.equal(G.mismatches(g, g.culprit).length, 0);
for (const s of wrongSuspects) assert.ok(G.mismatches(g, s.id).length >= 1, "wrong suspect always explained");
const w1 = G.accuse(g, wrongSuspects[0].id);
assert.deepEqual(w1.wrongAccusations, [wrongSuspects[0].id]);
assert.equal(w1.phase, "accuse");
assert.equal(G.accuse(w1, wrongSuspects[0].id), w1, "same wrong suspect is ignored");
assert.equal(G.accuse(w1, w1.culprit).finalStars, 1);
const w2 = G.accuse(w1, wrongSuspects[1].id);
assert.equal(G.accuse(w2, w2.culprit).finalStars, 0);
const w3 = G.accuse(w2, wrongSuspects[2].id);
assert.equal(G.accuse(w3, w3.culprit).finalStars, 0, "never negative");
assert.equal(G.accuse(once, wrongSuspects[0].id), once, "no accuse after finished");

// 滿分與文字
assert.equal(G.maxStars(), 14);
let perfect = G.createGame({seed: 5});
for (let i = 0; i < CASE_COUNT; i++) {
  perfect = G.startInvestigation(perfect);
  perfect = G.nextCase(G.searchCell(perfect, perfect.current.target));
}
perfect = G.accuse(perfect, perfect.culprit);
assert.equal(G.totalStars(perfect), G.maxStars());
assert.ok(G.progressText(perfect).includes("14／14"));
assert.ok(G.progressText(G.createGame()).includes(`第 1／${CASE_COUNT} 案`));
assert.notEqual(G.rankFor(14), G.rankFor(9));
assert.notEqual(G.rankFor(9), G.rankFor(3));

// 靜態檢查：PWA 範圍、相對路徑、無外部資源、無私人內容
const read = name => fs.readFileSync(path.join(__dirname, name), "utf8");
const manifest = JSON.parse(read("manifest.webmanifest"));
assert.equal(manifest.scope, "./");
assert.equal(manifest.start_url, "./");
assert.ok(manifest.name.includes("小小地圖謎案"));
const sw = read("sw.js"), html = read("index.html"), js = read("app.js"), css = read("styles.css");
assert.ok(html.includes('rel="manifest" href="./manifest.webmanifest"'));
assert.ok(html.includes('src="./app.js"'));
assert.ok(html.includes('href="./styles.css"'));
assert.ok(html.includes('href="../../"'), "back link goes to the collection");
assert.ok(js.includes('register("./sw.js", {scope: "./"})'), "scope stays inside the app");
assert.ok(sw.includes('const CACHE = "tiny-map-mystery-v1"'));
assert.ok(sw.includes("self.registration.scope"), "only handles requests in scope");
for (const asset of ["./", "./index.html", "./styles.css", "./app.js", "./manifest.webmanifest"]) assert.ok(sw.includes(`"${asset}"`), asset);
for (const [name, text] of Object.entries({html, js, css, sw, manifest: read("manifest.webmanifest")})) {
  const external = text.replace(/http:\/\/www\.w3\.org\/2000\/svg/g, "").match(/https?:\/\/|\/\/cdn|@import|url\(/g);
  assert.equal(external, null, `${name} loads nothing external`);
  assert.ok(!/tiny-clue-box|family-0[1-9]|\.webp|picker|gapi|\.env\b|token|cloud lab/i.test(text), `${name} has no private references`);
}

console.log("tiny-map-mystery tests passed");
