"use strict";
// 三種燈號：顏色＋形狀＋文字，色弱也能分辨。
const SIGNALS = Object.freeze([
  Object.freeze({id:"r", mark:"●", label:"紅圓燈", key:"1"}),
  Object.freeze({id:"y", mark:"▲", label:"黃三角燈", key:"2"}),
  Object.freeze({id:"b", mark:"■", label:"藍方塊燈", key:"3"})
]);
const WORDS = Object.freeze([
  Object.freeze({id:"apple", icon:"🍎", label:"蘋果"}),
  Object.freeze({id:"fish", icon:"🐟", label:"魚"}),
  Object.freeze({id:"moon", icon:"🌙", label:"月亮"}),
  Object.freeze({id:"star", icon:"⭐", label:"星星"}),
  Object.freeze({id:"bike", icon:"🚲", label:"腳踏車"}),
  Object.freeze({id:"balloon", icon:"🎈", label:"氣球"}),
  Object.freeze({id:"rain", icon:"🌧️", label:"下雨"}),
  Object.freeze({id:"house", icon:"🏠", label:"房子"})
]);
const MISSIONS = Object.freeze([
  Object.freeze({icon:"🏕️", title:"露營補給站", rule:"送訊號時可以小聲念出燈號，但不能說出圖案名字。"}),
  Object.freeze({icon:"🌊", title:"燈塔夜班", rule:"安靜任務：送訊號和解碼時都不出聲，只用眼睛和手指。"}),
  Object.freeze({icon:"🛰️", title:"太空站通話", rule:"解碼員可以問一個「是／不是」的問題，編碼員只能點頭或搖頭。"}),
  Object.freeze({icon:"🐾", title:"森林郵差", rule:"編碼員送完後，用一個動作（不是指螢幕）給一點提示。"}),
  Object.freeze({icon:"🚂", title:"山洞火車", rule:"解碼員先猜，再一起數一數每組是不是兩個燈。"}),
  Object.freeze({icon:"🎪", title:"馬戲團後台", rule:"解碼後，兩個人一起用這些圖案編一句好笑的話。"})
]);
const PLAYERS = Object.freeze([
  Object.freeze({icon:"🦊", label:"狐狸隊員"}),
  Object.freeze({icon:"🐢", label:"烏龜隊員"})
]);
const CODE_LENGTH = 2;
const LENGTHS = Object.freeze([2, 3]);
const ROUND_OPTIONS = Object.freeze([4, 6]);

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
function allCodes() {
  const codes = [];
  for (const a of SIGNALS) for (const b of SIGNALS) codes.push([a.id, b.id]);
  return codes;
}
// 每回合的密碼本與訊息都由 seed＋回合序號決定，可重現、可測試。
function makeRound(seed, index, length) {
  const rng = mulberry32((seed ^ Math.imul(index + 1, 0x9E3779B1)) >>> 0);
  const codes = shuffle(allCodes(), rng);
  const codebook = {};
  WORDS.forEach((word, i) => { codebook[word.id] = codes[i]; });
  const message = shuffle(WORDS.map(word => word.id), rng).slice(0, length);
  const mission = (Math.floor(mulberry32(seed >>> 0)() * MISSIONS.length) + index) % MISSIONS.length;
  return {index, codebook, message, mission};
}
function createGame(options = {}) {
  const seed = Number.isInteger(options.seed) ? options.seed >>> 0 : 1;
  const length = options.length === undefined ? 2 : options.length;
  const rounds = options.rounds === undefined ? 4 : options.rounds;
  if (!LENGTHS.includes(length)) throw new RangeError("訊息長度只能是 2 或 3");
  if (!ROUND_OPTIONS.includes(rounds)) throw new RangeError("回合數只能是 4 或 6");
  return {seed, length, rounds, round: 0, phase: "ready", current: makeRound(seed, 0, length), sent: [], guess: Array(length).fill(null), stars: 0, history: []};
}
function roles(game) {
  const encoder = game.round % 2;
  return {encoder, decoder: 1 - encoder};
}
function expectedCode(round) { return round.message.flatMap(id => round.codebook[id]); }
function groupSignals(signals) {
  const groups = [];
  for (let i = 0; i < signals.length; i += CODE_LENGTH) groups.push(signals.slice(i, i + CODE_LENGTH));
  return groups;
}
function lookup(codebook, group) {
  if (group.length !== CODE_LENGTH) return null;
  const hit = Object.entries(codebook).find(([, code]) => code[0] === group[0] && code[1] === group[1]);
  return hit ? hit[0] : null;
}
function decodeSignals(codebook, signals) { return groupSignals(signals).map(group => lookup(codebook, group)); }
function neededSignals(game) { return game.length * CODE_LENGTH; }

function startEncode(game) { return game.phase === "ready" ? {...game, phase: "encode"} : game; }
function pressSignal(game, id) {
  if (!SIGNALS.some(signal => signal.id === id)) throw new RangeError("不存在的燈號");
  if (game.phase !== "encode" || game.sent.length >= neededSignals(game)) return game;
  return {...game, sent: [...game.sent, id]};
}
function undoSignal(game) { return game.phase === "encode" && game.sent.length ? {...game, sent: game.sent.slice(0, -1)} : game; }
function clearSignals(game) { return game.phase === "encode" ? {...game, sent: []} : game; }
function canSend(game) { return game.phase === "encode" && game.sent.length === neededSignals(game); }
function send(game) { return canSend(game) ? {...game, phase: "handoff"} : game; }
function backToEncode(game) { return game.phase === "handoff" ? {...game, phase: "encode"} : game; }
function startDecode(game) { return game.phase === "handoff" ? {...game, phase: "decode"} : game; }
function chooseGuess(game, slot, wordId) {
  if (!WORDS.some(word => word.id === wordId)) throw new RangeError("不存在的圖案");
  if (!Number.isInteger(slot) || slot < 0 || slot >= game.length) throw new RangeError("不存在的格子");
  if (game.phase !== "decode") return game;
  const guess = game.guess.slice();
  guess[slot] = wordId;
  return {...game, guess};
}
function canSubmit(game) { return game.phase === "decode" && game.guess.every(Boolean); }
function scoreRound(round, sent, guess) {
  const meant = decodeSignals(round.codebook, sent);
  const slots = round.message.map((id, i) => ({
    answer: id,
    sentAs: meant[i],
    guess: guess[i],
    encodedOk: meant[i] === id,
    decodedOk: guess[i] === meant[i],
    correct: guess[i] === id
  }));
  return {slots, stars: slots.filter(slot => slot.correct).length};
}
function submitGuess(game) {
  if (!canSubmit(game)) return game;
  const result = scoreRound(game.current, game.sent, game.guess);
  return {...game, phase: "result", stars: game.stars + result.stars, history: [...game.history, {round: game.round, ...result}]};
}
function nextRound(game) {
  if (game.phase !== "result") return game;
  if (game.round + 1 >= game.rounds) return {...game, phase: "finished"};
  const round = game.round + 1;
  return {...game, round, phase: "ready", current: makeRound(game.seed, round, game.length), sent: [], guess: Array(game.length).fill(null)};
}
function maxStars(game) { return game.length * game.rounds; }
function progressText(game) {
  if (game.phase === "finished") return `任務完成！團隊星星 ⭐ ${game.stars}／${maxStars(game)}`;
  return `第 ${game.round + 1}／${game.rounds} 回合 · 團隊星星 ⭐ ${game.stars}`;
}
function cheer(stars, max) {
  const ratio = max ? stars / max : 0;
  if (ratio === 1) return "完美收訊！你們是最默契的電台搭檔。";
  if (ratio >= 0.6) return "訊號很清楚！再玩一場，換個密碼本試試。";
  return "雜訊有點多也沒關係，每一次交換角色都在練習默契。";
}

if (typeof module !== "undefined") module.exports = {SIGNALS, WORDS, MISSIONS, PLAYERS, CODE_LENGTH, mulberry32, allCodes, makeRound, createGame, roles, expectedCode, groupSignals, decodeSignals, startEncode, pressSignal, undoSignal, clearSignals, canSend, send, backToEncode, startDecode, chooseGuess, canSubmit, scoreRound, submitGuess, nextRound, maxStars, progressText, cheer};

if (typeof document !== "undefined") {
  const $ = id => document.getElementById(id);
  const GUIDE_KEY = "tiny-secret-signal:guide-seen";
  const word = id => WORDS.find(item => item.id === id);
  const signal = id => SIGNALS.find(item => item.id === id);
  let game = null;
  let activeSlot = 0;
  let setup = {length: 2, rounds: 4};

  function el(tag, props = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (key === "class") node.className = value;
      else if (key.startsWith("aria-") || key === "role") node.setAttribute(key, value);
      else node[key] = value;
    }
    node.append(...children);
    return node;
  }
  function lamp(id, extra = "") {
    const s = signal(id);
    return el("span", {class: `lamp lamp-${id} ${extra}`.trim(), role: "img", "aria-label": s.label}, s.mark);
  }
  function codeLabel(code) { return code.map(id => signal(id).label).join("、"); }
  function playerName(index) { return `${PLAYERS[index].icon} ${PLAYERS[index].label}`; }
  function announce(text) { $("live").textContent = text; }

  function codebookTable(round, byCode) {
    const rows = WORDS.map(item => ({item, code: round.codebook[item.id]}));
    if (byCode) {
      const order = SIGNALS.map(s => s.id);
      rows.sort((a, b) => (order.indexOf(a.code[0]) * 3 + order.indexOf(a.code[1])) - (order.indexOf(b.code[0]) * 3 + order.indexOf(b.code[1])));
    }
    const list = el("ul", {class: "codebook", "aria-label": "本回合密碼本"});
    for (const {item, code} of rows) {
      list.append(el("li", {"aria-label": `${item.label}：${codeLabel(code)}`},
        el("span", {class: "pic", "aria-hidden": "true"}, item.icon),
        el("span", {class: "name", "aria-hidden": "true"}, item.label),
        el("span", {class: "code", "aria-hidden": "true"}, ...code.map(id => lamp(id)))));
    }
    return list;
  }
  function signalStrip(signals, total) {
    const strip = el("div", {class: "strip", role: "group", "aria-label": `訊號 ${signals.length}／${total} 格`});
    for (let g = 0; g < total / CODE_LENGTH; g++) {
      const group = el("div", {class: "group"}, el("small", {"aria-hidden": "true"}, `第 ${g + 1} 組`));
      for (let k = 0; k < CODE_LENGTH; k++) {
        const id = signals[g * CODE_LENGTH + k];
        group.append(id ? lamp(id, "filled") : el("span", {class: "lamp empty", role: "img", "aria-label": "空格"}, "·"));
      }
      strip.append(group);
    }
    return strip;
  }
  function missionCard(round) {
    const m = MISSIONS[round.mission];
    return el("div", {class: "mission"}, el("strong", {}, `${m.icon} 任務：${m.title}`), el("p", {}, m.rule));
  }

  function renderSetup() {
    const view = $("view");
    const lengthGroup = el("div", {class: "options", role: "group", "aria-label": "每則訊息幾個圖案"});
    for (const n of [2, 3]) {
      const b = el("button", {type: "button", class: "option", "aria-pressed": String(setup.length === n)}, n === 2 ? "輕鬆：每則 2 個圖案" : "挑戰：每則 3 個圖案");
      b.addEventListener("click", () => { setup = {...setup, length: n}; render(); });
      lengthGroup.append(b);
    }
    const roundGroup = el("div", {class: "options", role: "group", "aria-label": "玩幾回合"});
    for (const n of [4, 6]) {
      const b = el("button", {type: "button", class: "option", "aria-pressed": String(setup.rounds === n)}, n === 4 ? "4 回合（約 8 分鐘）" : "6 回合（約 12 分鐘）");
      b.addEventListener("click", () => { setup = {...setup, rounds: n}; render(); });
      roundGroup.append(b);
    }
    const start = el("button", {type: "button", class: "primary"}, "📻 開台！開始第一回合");
    start.addEventListener("click", () => {
      const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
      game = createGame({seed, length: setup.length, rounds: setup.rounds});
      try { localStorage.setItem(GUIDE_KEY, "1"); } catch (_) { /* 私密模式可忽略 */ }
      render(true);
    });
    view.replaceChildren(el("section", {class: "panel", "aria-labelledby": "setup-title"},
      el("h2", {id: "setup-title"}, "準備電台"), el("h3", {}, "訊息長度"), lengthGroup, el("h3", {}, "回合數"), roundGroup, start));
  }

  function renderReady() {
    const {encoder, decoder} = roles(game);
    const go = el("button", {type: "button", class: "primary"}, `我是編碼員，偷看任務 👀`);
    go.addEventListener("click", () => { game = startEncode(game); render(true); });
    $("view").replaceChildren(el("section", {class: "panel curtain", "aria-labelledby": "ready-title"},
      el("div", {class: "big", "aria-hidden": "true"}, "🙈"),
      el("h2", {id: "ready-title"}, `請把手機交給 ${playerName(encoder)}`),
      el("p", {}, `${playerName(encoder)} 當「編碼員」，${playerName(decoder)} 當「解碼員」。解碼員先轉過身或閉上眼睛，不要偷看喔！`),
      go));
  }

  function renderEncode() {
    const round = game.current;
    const need = game.length * CODE_LENGTH;
    const secret = el("div", {class: "secret", role: "group", "aria-label": `祕密訊息：${round.message.map(id => word(id).label).join("、")}`},
      ...round.message.map((id, i) => el("div", {class: "secret-word", "aria-hidden": "true"},
        el("small", {}, `第 ${i + 1} 組`), el("span", {class: "pic"}, word(id).icon), el("span", {}, word(id).label))));
    const pad = el("div", {class: "pad", role: "group", "aria-label": "燈號按鈕"});
    for (const s of SIGNALS) {
      const b = el("button", {type: "button", class: `pad-btn pad-${s.id}`, "aria-label": `${s.label}（鍵盤 ${s.key}）`, disabled: game.sent.length >= need},
        el("span", {class: `lamp lamp-${s.id}`, "aria-hidden": "true"}, s.mark), el("span", {"aria-hidden": "true"}, s.label));
      b.addEventListener("click", () => press(s.id));
      pad.append(b);
    }
    const undo = el("button", {type: "button", disabled: !game.sent.length}, "↩︎ 退一格");
    undo.addEventListener("click", () => { game = undoSignal(game); render(); announce(`退一格，已送 ${game.sent.length}／${need} 格`); });
    const clear = el("button", {type: "button", disabled: !game.sent.length}, "清空");
    clear.addEventListener("click", () => { game = clearSignals(game); render(); announce("已清空訊號"); });
    const sendBtn = el("button", {type: "button", class: "primary", disabled: !canSend(game)}, canSend(game) ? "📡 送出訊號，遮住畫面" : `還差 ${need - game.sent.length} 格燈號`);
    sendBtn.addEventListener("click", () => { game = send(game); render(true); });
    $("view").replaceChildren(el("section", {class: "panel", "aria-labelledby": "enc-title"},
      el("h2", {id: "enc-title"}, `🎙️ 編碼員：${playerName(roles(game).encoder)}`),
      missionCard(round),
      el("p", {class: "step"}, "① 看祕密訊息，② 在密碼本找到每個圖案的兩個燈，③ 依序按燈號。"),
      el("div", {class: "split"},
        el("div", {}, el("h3", {}, "祕密訊息"), secret, el("h3", {}, "你送出的燈號"), signalStrip(game.sent, need), pad, el("div", {class: "row"}, undo, clear), sendBtn),
        el("div", {}, el("h3", {}, "密碼本（每回合都會換）"), codebookTable(round, false)))));
  }
  function press(id) {
    if (!game || game.phase !== "encode") return;
    const before = game.sent.length;
    game = pressSignal(game, id);
    if (game.sent.length === before) return;
    render();
    const need = game.length * CODE_LENGTH;
    announce(`${signal(id).label}，已送 ${game.sent.length}／${need} 格${canSend(game) ? "，可以送出了" : ""}`);
  }

  function renderHandoff() {
    const {decoder} = roles(game);
    const go = el("button", {type: "button", class: "primary"}, "我是解碼員，打開接收器 📻");
    go.addEventListener("click", () => { activeSlot = 0; game = startDecode(game); render(true); });
    const back = el("button", {type: "button", class: "ghost"}, "← 編碼員還要修改");
    back.addEventListener("click", () => { game = backToEncode(game); render(true); });
    $("view").replaceChildren(el("section", {class: "panel curtain", "aria-labelledby": "hand-title"},
      el("div", {class: "big", "aria-hidden": "true"}, "📡"),
      el("h2", {id: "hand-title"}, "訊號已送出，畫面已遮住"),
      el("p", {}, `請把手機交給 ${playerName(decoder)}。拿到手機後再按下面的按鈕。`),
      go, back));
  }

  function renderDecode() {
    const round = game.current;
    const slots = el("div", {class: "slots", role: "group", "aria-label": "解碼答案格"});
    game.guess.forEach((id, i) => {
      const w = id ? word(id) : null;
      const b = el("button", {type: "button", class: "slot", "aria-pressed": String(activeSlot === i), "aria-label": `第 ${i + 1} 組答案：${w ? w.label : "還沒選"}${activeSlot === i ? "（正在選）" : ""}`},
        el("small", {"aria-hidden": "true"}, `第 ${i + 1} 組`), el("span", {class: "pic", "aria-hidden": "true"}, w ? w.icon : "？"));
      b.addEventListener("click", () => { activeSlot = i; render(); announce(`改選第 ${i + 1} 組`); });
      slots.append(b);
    });
    const palette = el("div", {class: "palette", role: "group", "aria-label": `圖案選單，正在填第 ${activeSlot + 1} 組`});
    for (const w of WORDS) {
      const b = el("button", {type: "button", class: "word"}, el("span", {class: "pic", "aria-hidden": "true"}, w.icon), w.label);
      b.addEventListener("click", () => {
        game = chooseGuess(game, activeSlot, w.id);
        const filled = activeSlot;
        const nextEmpty = game.guess.findIndex(g => !g);
        activeSlot = nextEmpty === -1 ? filled : nextEmpty;
        render();
        announce(`第 ${filled + 1} 組選了${w.label}${canSubmit(game) ? "，可以對答案了" : ""}`);
      });
      palette.append(b);
    }
    const submit = el("button", {type: "button", class: "primary", disabled: !canSubmit(game)}, canSubmit(game) ? "🔓 揭曉，一起對答案" : "每組都選一個圖案");
    submit.addEventListener("click", () => { game = submitGuess(game); render(true); });
    $("view").replaceChildren(el("section", {class: "panel", "aria-labelledby": "dec-title"},
      el("h2", {id: "dec-title"}, `🎧 解碼員：${playerName(roles(game).decoder)}`),
      missionCard(round),
      el("p", {class: "step"}, "① 看收到的燈號，每兩個燈是一組，② 在密碼本找到一樣的燈，③ 選出圖案。"),
      el("div", {class: "split"},
        el("div", {}, el("h3", {}, "收到的訊號"), signalStrip(game.sent, game.length * CODE_LENGTH), el("h3", {}, "你的解碼"), slots, palette, submit),
        el("div", {}, el("h3", {}, "密碼本（照燈號排好）"), codebookTable(round, true)))));
  }

  function renderResult() {
    const last = game.history[game.history.length - 1];
    const list = el("ul", {class: "results"});
    last.slots.forEach((slot, i) => {
      const ans = word(slot.answer), g = word(slot.guess);
      let note = slot.correct ? "✅ 收到了！" : (!slot.encodedOk ? "📡 燈號有一點打錯，下次慢慢對密碼本。" : "🔍 燈號對了，差一點就解出來！");
      list.append(el("li", {class: slot.correct ? "ok" : "miss"},
        el("strong", {}, `第 ${i + 1} 組`),
        el("span", {}, `祕密：${ans.icon} ${ans.label}`),
        el("span", {}, `猜的：${g.icon} ${g.label}`),
        el("span", {}, note)));
    });
    const last1 = game.round + 1 >= game.rounds;
    const next = el("button", {type: "button", class: "primary"}, last1 ? "🏁 看任務成果" : "下一回合，交換角色 🔄");
    next.addEventListener("click", () => { game = nextRound(game); render(true); });
    $("view").replaceChildren(el("section", {class: "panel", "aria-labelledby": "res-title"},
      el("h2", {id: "res-title"}, `揭曉！這回合得到 ⭐ ${last.stars}／${game.length}`),
      list,
      el("p", {class: "step"}, `${MISSIONS[game.current.mission].icon} 小任務：${MISSIONS[game.current.mission].rule}`),
      next));
  }

  function renderFinished() {
    const max = maxStars(game);
    const again = el("button", {type: "button", class: "primary"}, "再開一場（新密碼本）");
    again.addEventListener("click", () => { game = null; render(true); });
    $("view").replaceChildren(el("section", {class: "panel curtain", "aria-labelledby": "fin-title"},
      el("div", {class: "big", "aria-hidden": "true"}, "🏆"),
      el("h2", {id: "fin-title"}, `團隊星星 ⭐ ${game.stars}／${max}`),
      el("p", {}, cheer(game.stars, max)),
      again));
  }

  function render(moveFocus = false) {
    $("progress").textContent = game ? progressText(game) : "還沒開台";
    $("restart").hidden = !game;
    if (!game) renderSetup();
    else ({ready: renderReady, encode: renderEncode, handoff: renderHandoff, decode: renderDecode, result: renderResult, finished: renderFinished})[game.phase]();
    if (moveFocus) {
      const heading = $("view").querySelector("h2");
      if (heading) { heading.tabIndex = -1; heading.focus({preventScroll: true}); }
      $("view").scrollIntoView({block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"});
    }
  }

  document.addEventListener("keydown", event => {
    if (!game || game.phase !== "encode" || event.altKey || event.ctrlKey || event.metaKey) return;
    const s = SIGNALS.find(item => item.key === event.key);
    if (s) { event.preventDefault(); press(s.id); }
  });
  $("restart").addEventListener("click", () => {
    if (confirm("要結束這場、回到準備畫面嗎？")) { game = null; render(true); }
  });
  try { if (localStorage.getItem(GUIDE_KEY)) $("guide").open = false; } catch (_) { /* 忽略 */ }
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js", {scope: "./"}).catch(() => {});
  render();
}
