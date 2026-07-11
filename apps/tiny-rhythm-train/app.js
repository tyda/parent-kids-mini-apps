const stations = [
  { name: '雲朵點心站', mission: '說一種像雲的食物，然後用手指畫一朵小雲。' },
  { name: '恐龍月台', mission: '用兩根手指走出小恐龍腳步，再猜牠今天想去哪裡。' },
  { name: '星星隧道', mission: '閉眼 3 秒，說出剛剛聽到或想到的一個小聲音。' },
  { name: '彩虹橋站', mission: '輪流說一個顏色，並用那個顏色想像一節車廂。' },
  { name: '午睡車庫', mission: '把節奏變得更輕，像火車正在慢慢停好。' },
  { name: '海風港口站', mission: '用手指敲出浪花靠岸的感覺，再說一種海邊會看到的東西。' },
  { name: '森林小站', mission: '模仿一隻安靜動物走路，讓對方猜是哪一種。' },
  { name: '月亮終點站', mission: '用最慢的速度再敲一次節奏，當作晚安列車。' }
];

const rhythms = [
  '輕・輕・停・輕',
  '輕・停・輕・輕',
  '慢・慢・快快',
  '快快・停・輕',
  '輕・輕・輕・停',
  '慢・快快・慢',
  '停・輕・輕・快快',
  '輕・拍手・輕・停'
];

const helpers = [
  '小提醒：如果在安靜場所，可以只做手指動作，不出聲也算完成。',
  '換人當列車長時，可以把同一個節奏變快一點或變慢一點。',
  '如果孩子想自創節奏，直接讓新節奏成為加開班車。',
  '卡住時，爸爸先示範一次；孩子只要跟到其中兩拍也算成功。'
];

let step = 0;
let lastStationIndex = -1;
let lastRhythmIndex = -1;

function pickIndex(length, lastIndex, random = Math.random) {
  if (length <= 1) return 0;
  let index = Math.floor(random() * length);
  if (index === lastIndex) {
    index = (index + 1) % length;
  }
  return index;
}

function makeRound(random = Math.random) {
  const stationIndex = pickIndex(stations.length, lastStationIndex, random);
  const rhythmIndex = pickIndex(rhythms.length, lastRhythmIndex, random);
  lastStationIndex = stationIndex;
  lastRhythmIndex = rhythmIndex;
  return {
    station: stations[stationIndex],
    rhythm: rhythms[rhythmIndex],
    helper: helpers[Math.floor(random() * helpers.length)]
  };
}

function setStep(nextStep) {
  step = Math.max(0, Math.min(2, nextStep));
  document.querySelectorAll('.track-dot').forEach((dot, index) => {
    dot.classList.toggle('active', index <= step);
  });
}

function renderRound(round) {
  document.getElementById('station-name').textContent = round.station.name;
  document.getElementById('rhythm-text').textContent = round.rhythm;
  document.getElementById('mission-text').textContent = round.station.mission;
  document.getElementById('helper-text').textContent = round.helper;
}

function startNewTrain() {
  setStep(0);
  renderRound(makeRound());
}

function arriveNextStation() {
  if (step >= 2) {
    setStep(0);
    const round = makeRound();
    renderRound({
      ...round,
      helper: '完成一趟旅程！可以換人當列車長，或按「開一班新列車」重新出發。'
    });
    return;
  }
  setStep(step + 1);
  renderRound(makeRound());
}

if (typeof document !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('new-train').addEventListener('click', startNewTrain);
    document.getElementById('next-station').addEventListener('click', arriveNextStation);
    startNewTrain();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  });
}

if (typeof module !== 'undefined') {
  module.exports = { stations, rhythms, helpers, pickIndex, makeRound };
}
