(function () {
  'use strict';

  const TOTAL_ROUNDS = 5;
  const PLAYERS = ['小乖', '米米'];
  const photos = [
    { src: 'assets/family-01.webp', focus: '先看人物，再看身邊的小東西', clues: ['照片裡大約有幾個人？', '大家的表情或視線有什麼不同？', '人物旁邊最醒目的東西是什麼？'] },
    { src: 'assets/family-02.webp', focus: '留意人物的位置和正在看的方向', clues: ['誰離鏡頭比較近？', '照片裡有哪些顏色最明顯？', '你覺得大家正在觀察什麼？'] },
    { src: 'assets/family-03.webp', focus: '找找姿勢、表情和背景線索', clues: ['人物正在站著、坐著，還是在移動？', '臉上的表情讓你想到哪種心情？', '背景裡哪個形狀最容易認出來？'] },
    { src: 'assets/family-04.webp', focus: '觀察手、臉和附近的物品', clues: ['人物的手正在做什麼？', '衣服上有什麼顏色或圖案？', '如果替照片配一句話，會說什麼？'] },
    { src: 'assets/family-05.webp', focus: '找出這一刻正在進行的活動', clues: ['人物可能正在完成什麼小任務？', '畫面裡最小的東西可能是什麼？', '這個場景聽起來會安靜還是熱鬧？'] },
    { src: 'assets/family-06.webp', focus: '用動作和物品來描述，不直接說答案', clues: ['人物的身體朝向哪裡？', '附近有哪個東西可能會被拿起來？', '這張照片最像一天中的哪個時段？'] },
    { src: 'assets/family-07.webp', focus: '看看人物如何一起完成一件事', clues: ['照片裡的人靠得近還是遠？', '桌面或身邊有哪些線索？', '這一刻最可能聽到哪一句話？'] },
    { src: 'assets/family-08.webp', focus: '從表情、衣服和背景猜是哪一張', clues: ['人物的表情比較專心、開心還是好奇？', '衣服上最明顯的顏色是什麼？', '背景中哪一件東西可以當最後提示？'] }
  ];

  function shuffleIndices(length, random = Math.random) {
    const result = Array.from({ length }, (_, index) => index);
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function roleForRound(round) {
    const giver = PLAYERS[(round - 1) % PLAYERS.length];
    const guesser = PLAYERS[round % PLAYERS.length];
    return { giver, guesser };
  }

  function clueButtonLabel(shown, total) {
    return shown >= total ? '三條提示都出現了' : `顯示第 ${shown + 1} 條提示`;
  }

  if (typeof module !== 'undefined') {
    module.exports = { TOTAL_ROUNDS, PLAYERS, photos, shuffleIndices, roleForRound, clueButtonLabel };
  }
  if (typeof document === 'undefined') return;

  const $ = (id) => document.getElementById(id);
  const coverStage = $('cover-stage');
  const chooseStage = $('choose-stage');
  const clueStage = $('clue-stage');
  const answerStage = $('answer-stage');
  const finishStage = $('finish-stage');
  const nextClueButton = $('next-clue');
  const answerButton = $('answer-button');

  let round = 1;
  let shown = 0;
  let deck = shuffleIndices(photos.length);

  function currentPhoto() {
    return photos[deck[round - 1]];
  }

  function setPhoto(elementId) {
    const image = $(elementId);
    image.src = currentPhoto().src;
    image.alt = '本回合題目照片';
  }

  function clearPhoto(elementId) {
    $(elementId).removeAttribute('src');
  }

  function announce(message) {
    $('status-message').textContent = message;
  }

  function focusHeading(elementId) {
    $(elementId).focus({ preventScroll: true });
  }

  function showRound(shouldFocus = false) {
    shown = 0;
    const roles = roleForRound(round);
    const photo = currentPhoto();

    $('clue-list').replaceChildren();
    nextClueButton.disabled = false;
    nextClueButton.textContent = clueButtonLabel(0, photo.clues.length);
    answerButton.hidden = true;
    coverStage.hidden = false;
    chooseStage.hidden = true;
    clueStage.hidden = true;
    answerStage.hidden = true;
    finishStage.hidden = true;
    $('round-label').textContent = `第 ${round} 回合，共 ${TOTAL_ROUNDS} 回合`;
    $('role-label').textContent = `出題：${roles.giver}　猜題：${roles.guesser}`;
    $('cover-title').textContent = `請 ${roles.guesser} 先移開視線`;
    $('show-photo-button').textContent = `只有 ${roles.giver} 在看，顯示照片`;
    $('giver-name').textContent = roles.giver;
    $('guesser-name').textContent = roles.guesser;
    $('photo-focus').textContent = photo.focus;
    clearPhoto('photo-card');
    clearPhoto('answer-photo');
    announce(`第 ${round} 回合，請 ${roles.guesser} 先移開視線`);
    if (shouldFocus) focusHeading('cover-title');
  }

  function showPhoto() {
    coverStage.hidden = true;
    chooseStage.hidden = false;
    setPhoto('photo-card');
    announce('題目照片已顯示，只能讓出題者觀看');
    focusHeading('photo-title');
  }

  function beginGuessing() {
    clearPhoto('photo-card');
    chooseStage.hidden = true;
    clueStage.hidden = false;
    announce('照片已藏起，現在可以把裝置交給猜題者');
    focusHeading('clue-title');
  }

  function revealClue() {
    const photo = currentPhoto();
    if (shown >= photo.clues.length) return;
    const item = document.createElement('p');
    item.className = 'clue';
    item.textContent = `提示 ${shown + 1}　${photo.clues[shown]}`;
    shown += 1;
    $('clue-list').append(item);
    nextClueButton.textContent = clueButtonLabel(shown, photo.clues.length);
    nextClueButton.disabled = shown === photo.clues.length;
    answerButton.hidden = false;
  }

  function showAnswer() {
    clueStage.hidden = true;
    answerStage.hidden = false;
    setPhoto('answer-photo');
    announce('照片答案已揭曉');
    focusHeading('answer-title');
  }

  function advance() {
    round += 1;
    if (round > TOTAL_ROUNDS) {
      coverStage.hidden = true;
      chooseStage.hidden = true;
      clueStage.hidden = true;
      answerStage.hidden = true;
      finishStage.hidden = false;
      $('round-label').textContent = `完成 ${TOTAL_ROUNDS} 回合`;
      $('role-label').textContent = '小乖和米米合作成功！';
      clearPhoto('answer-photo');
      announce('五回合完成，小乖和米米合作成功');
      focusHeading('finish-title');
      return;
    }
    showRound(true);
  }

  function swapPhoto() {
    const currentPosition = round - 1;
    if (currentPosition >= deck.length - 1) return;
    const swapWith = currentPosition + 1 + Math.floor(Math.random() * (deck.length - currentPosition - 1));
    [deck[currentPosition], deck[swapWith]] = [deck[swapWith], deck[currentPosition]];
    showRound(true);
  }

  function reset() {
    round = 1;
    deck = shuffleIndices(photos.length);
    showRound(true);
  }

  $('show-photo-button').addEventListener('click', showPhoto);
  $('ready-button').addEventListener('click', beginGuessing);
  nextClueButton.addEventListener('click', revealClue);
  answerButton.addEventListener('click', showAnswer);
  $('next-round-button').addEventListener('click', advance);
  $('new-card').addEventListener('click', swapPhoto);
  $('reset-button').addEventListener('click', reset);
  $('restart-button').addEventListener('click', reset);

  showRound();
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) showRound();
  });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
})();
