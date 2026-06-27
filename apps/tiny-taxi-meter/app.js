/* Taxi Meter Kids - core fare logic + browser app wiring */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TaxiMeterKids = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const DEFAULT_CONFIG = Object.freeze({
    baseDistanceMeters: 1250,
    baseFare: 85,
    incrementDistanceMeters: 200,
    incrementFare: 5,
    waitingIntervalSeconds: 60,
    waitingFare: 5,
    nightMultiplier: 1.2,
    slowSpeedKmh: 5,
    minGpsAccuracyMeters: 80
  });

  function clampNumber(value, fallback, min, max) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  function createState(overrides) {
    return {
      config: Object.assign({}, DEFAULT_CONFIG, overrides || {}),
      running: false,
      paused: false,
      night: false,
      manualWaiting: false,
      distanceMeters: 0,
      waitingSeconds: 0,
      elapsedSeconds: 0,
      lastPosition: null,
      gpsEnabled: false,
      gpsStatus: '尚未啟用 GPS',
      log: []
    };
  }

  function resetState(state) {
    const config = Object.assign({}, state.config);
    Object.assign(state, createState(config));
    return state;
  }

  function start(state) {
    state.running = true;
    state.paused = false;
    state.log.push({ time: Date.now(), message: '開始跳錶' });
    return state;
  }

  function pause(state) {
    state.paused = !state.paused;
    state.log.push({ time: Date.now(), message: state.paused ? '暫停' : '繼續' });
    return state;
  }

  function stop(state) {
    state.running = false;
    state.paused = false;
    state.log.push({ time: Date.now(), message: '停止' });
    return state;
  }

  function setNight(state, enabled) {
    state.night = Boolean(enabled);
    state.log.push({ time: Date.now(), message: state.night ? '夜間加成開啟' : '夜間加成關閉' });
    return state;
  }

  function setManualWaiting(state, enabled) {
    state.manualWaiting = Boolean(enabled);
    state.log.push({ time: Date.now(), message: state.manualWaiting ? '等待計時開啟' : '等待計時關閉' });
    return state;
  }

  function setWaitingInterval(state, seconds) {
    state.config.waitingIntervalSeconds = clampNumber(seconds, DEFAULT_CONFIG.waitingIntervalSeconds, 10, 300);
    return state;
  }

  function addDistance(state, meters) {
    const m = clampNumber(meters, 0, 0, 1000000);
    state.distanceMeters += m;
    return state;
  }

  function haversineMeters(a, b) {
    if (!a || !b) return 0;
    const toRad = deg => deg * Math.PI / 180;
    const R = 6371000;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  function updateFromGps(state, position) {
    const coords = position && position.coords ? position.coords : position;
    if (!coords) return { accepted: false, reason: '沒有座標資料', addedMeters: 0 };
    const accuracy = Number(coords.accuracy || 9999);
    const current = {
      lat: Number(coords.latitude),
      lon: Number(coords.longitude),
      timestamp: Number(position.timestamp || Date.now()),
      accuracy,
      speed: coords.speed == null ? null : Number(coords.speed)
    };
    if (!Number.isFinite(current.lat) || !Number.isFinite(current.lon)) {
      return { accepted: false, reason: '座標格式錯誤', addedMeters: 0 };
    }
    if (accuracy > state.config.minGpsAccuracyMeters) {
      state.gpsStatus = `GPS 精準度不足（±${Math.round(accuracy)}m），暫不累計距離`;
      state.lastPosition = current;
      return { accepted: false, reason: 'GPS 精準度不足', addedMeters: 0 };
    }
    if (!state.lastPosition) {
      state.lastPosition = current;
      state.gpsStatus = 'GPS 已定位，等待移動';
      return { accepted: true, reason: '初始定位', addedMeters: 0 };
    }
    const added = haversineMeters(state.lastPosition, current);
    if (added > 0 && added < 1000) {
      state.distanceMeters += added;
    }
    state.lastPosition = current;
    state.gpsStatus = `GPS 累計中（±${Math.round(accuracy)}m）`;
    return { accepted: true, reason: '已累計距離', addedMeters: added };
  }

  function tick(state, seconds, options) {
    const sec = clampNumber(seconds, 1, 0, 3600);
    const opts = options || {};
    if (!state.running || state.paused) return state;
    state.elapsedSeconds += sec;

    const speedKmh = Number(opts.speedKmh);
    const slowBySpeed = Number.isFinite(speedKmh) && speedKmh >= 0 && speedKmh < state.config.slowSpeedKmh;
    if (state.manualWaiting || slowBySpeed) {
      state.waitingSeconds += sec;
    }
    return state;
  }

  function calculateFare(state) {
    const cfg = state.config;
    const extraDistance = Math.max(0, state.distanceMeters - cfg.baseDistanceMeters);
    const distanceSteps = Math.ceil(extraDistance / cfg.incrementDistanceMeters);
    const distanceFare = cfg.baseFare + (distanceSteps * cfg.incrementFare);
    const waitingSteps = Math.floor(state.waitingSeconds / cfg.waitingIntervalSeconds);
    const waitingFare = waitingSteps * cfg.waitingFare;
    const subtotal = distanceFare + waitingFare;
    const total = state.night ? Math.ceil(subtotal * cfg.nightMultiplier) : subtotal;
    return {
      baseFare: cfg.baseFare,
      distanceFare,
      waitingFare,
      subtotal,
      nightSurcharge: total - subtotal,
      total,
      distanceSteps,
      waitingSteps,
      distanceMeters: state.distanceMeters,
      waitingSeconds: state.waitingSeconds,
      elapsedSeconds: state.elapsedSeconds
    };
  }

  function formatMoney(amount) {
    return `$${Math.round(Number(amount) || 0).toLocaleString('zh-TW')}`;
  }

  function formatDistance(meters) {
    const m = Number(meters) || 0;
    if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
    return `${Math.round(m)} m`;
  }

  function formatDuration(seconds) {
    const s = Math.max(0, Math.floor(Number(seconds) || 0));
    const hh = Math.floor(s / 3600);
    const mm = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return [hh, mm, ss].map(v => String(v).padStart(2, '0')).join(':');
  }

  function initBrowserApp() {
    const state = createState();
    const $ = id => document.getElementById(id);
    const fareEl = $('fare');
    const distanceEl = $('distance');
    const elapsedEl = $('elapsed');
    const waitingEl = $('waiting');
    const detailEl = $('details');
    const statusEl = $('status');
    const gpsEl = $('gpsStatus');
    const nightBadgeEl = $('nightBadge');
    const waitingBadgeEl = $('waitingBadge');
    const gpsBadgeEl = $('gpsBadge');
    const waitIntervalEl = $('waitInterval');
    const slowSpeedEl = $('slowSpeed');
    let timer = null;
    let watchId = null;

    function applyViewportMode() {
      const viewport = window.visualViewport;
      const width = viewport && viewport.width ? viewport.width : window.innerWidth;
      const height = viewport && viewport.height ? viewport.height : window.innerHeight;
      const landscape = width > height && width >= 620 && height <= 720;
      document.body.classList.toggle('landscape-layout', landscape);
      // Android Chrome / Pixel 橫向時網址列會吃掉高度；放寬 compact 門檻，避免標題與設定區被裁切。
      document.body.classList.toggle('landscape-compact', landscape && height <= 620);
    }

    function syncConfigInputs() {
      setWaitingInterval(state, waitIntervalEl.value);
      state.config.slowSpeedKmh = clampNumber(slowSpeedEl.value, DEFAULT_CONFIG.slowSpeedKmh, 1, 30);
    }

    function render() {
      const fare = calculateFare(state);
      fareEl.textContent = formatMoney(fare.total);
      distanceEl.textContent = formatDistance(fare.distanceMeters);
      elapsedEl.textContent = formatDuration(fare.elapsedSeconds);
      waitingEl.textContent = formatDuration(fare.waitingSeconds);
      nightBadgeEl.hidden = !state.night;
      waitingBadgeEl.hidden = !state.manualWaiting;
      gpsBadgeEl.hidden = !state.gpsEnabled;
      statusEl.textContent = state.paused ? '已暫停' : (state.running ? '跳錶中' : '準備開始');
      gpsEl.textContent = state.gpsStatus;
      detailEl.innerHTML = [
        `起程：前 1.25 公里 ${formatMoney(fare.baseFare)}`,
        `續程：${fare.distanceSteps} 跳 × $5 = ${formatMoney(fare.distanceFare - fare.baseFare)}`,
        `等待：${fare.waitingSteps} 跳 × $5 = ${formatMoney(fare.waitingFare)}`,
        state.night ? `夜間加成：+20% = ${formatMoney(fare.nightSurcharge)}` : '夜間加成：未啟用'
      ].map(x => `<li>${x}</li>`).join('');
      $('pauseBtn').textContent = state.paused ? '繼續' : '暫停';
      $('startBtn').disabled = state.running && !state.paused;
    }

    function ensureTimer() {
      if (timer) return;
      timer = window.setInterval(() => {
        syncConfigInputs();
        tick(state, 1);
        render();
      }, 1000);
    }

    function stopTimerIfIdle() {
      if (!state.running && timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    $('startBtn').addEventListener('click', () => {
      syncConfigInputs();
      start(state);
      ensureTimer();
      render();
    });

    $('pauseBtn').addEventListener('click', () => {
      if (!state.running) return;
      pause(state);
      render();
    });

    $('resetBtn').addEventListener('click', () => {
      resetState(state);
      syncConfigInputs();
      stopTimerIfIdle();
      render();
    });

    $('nightBtn').addEventListener('click', () => {
      setNight(state, !state.night);
      render();
    });

    $('waitBtn').addEventListener('click', () => {
      setManualWaiting(state, !state.manualWaiting);
      render();
    });

    $('add200Btn').addEventListener('click', () => {
      addDistance(state, 200);
      render();
    });

    $('add1kBtn').addEventListener('click', () => {
      addDistance(state, 1000);
      render();
    });

    $('snackBtn').addEventListener('click', () => {
      addDistance(state, 100);
      render();
    });

    $('videoBtn').addEventListener('click', () => {
      addDistance(state, 500);
      render();
    });

    $('gpsBtn').addEventListener('click', () => {
      if (!navigator.geolocation) {
        state.gpsStatus = '這台裝置或瀏覽器不支援 GPS';
        render();
        return;
      }
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
        state.gpsEnabled = false;
        state.gpsStatus = 'GPS 已關閉';
        render();
        return;
      }
      state.gpsEnabled = true;
      state.gpsStatus = '正在取得 GPS 權限與定位…';
      watchId = navigator.geolocation.watchPosition(
        pos => { if (state.running && !state.paused) updateFromGps(state, pos); render(); },
        err => { state.gpsStatus = `GPS 錯誤：${err.message}`; render(); },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
      );
      render();
    });

    waitIntervalEl.addEventListener('change', () => { syncConfigInputs(); render(); });
    slowSpeedEl.addEventListener('change', () => { syncConfigInputs(); render(); });
    window.addEventListener('resize', applyViewportMode);
    window.addEventListener('orientationchange', () => window.setTimeout(applyViewportMode, 120));
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', applyViewportMode);
    }

    applyViewportMode();
    render();
    return { state, render };
  }

  return {
    DEFAULT_CONFIG,
    createState,
    resetState,
    start,
    pause,
    stop,
    setNight,
    setManualWaiting,
    setWaitingInterval,
    addDistance,
    haversineMeters,
    updateFromGps,
    tick,
    calculateFare,
    formatMoney,
    formatDistance,
    formatDuration,
    initBrowserApp
  };
});
