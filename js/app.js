// アプリのUI制御・タイマー処理

let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function beep(freq = 880, duration = 0.2) {
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = freq;
  osc.type = "sine";
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

// ゴング音:低音の鐘をシミュレート
function gong() {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;

  // 基音と倍音を重ねてゴングらしさを出す
  const frequencies = [110, 220, 330, 440, 660];
  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const vol = 0.25 / (i + 1);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
    osc.start(now);
    osc.stop(now + 2.5);
  });
}

// 音声で次ラウンドの内容をアナウンス
function announce(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "ja-JP";
  utter.rate = 0.95;
  window.speechSynthesis.speak(utter);
}

let currentMenu = null;

function rowIdFor(round) {
  return round.phase === "rushbag" ? "rushbag-row" : `round-row-${round.round}`;
}

function renderMenu(menu, level, style) {
  const container = document.getElementById("menuResult");
  container.innerHTML = "";

  const heading = document.createElement("h2");
  heading.textContent = `${LEVEL_LABELS[level]} × ${STYLE_LABELS[style]} の本日のメニュー(全20R)`;
  container.appendChild(heading);

  const table = document.createElement("table");
  table.className = "menu-table";
  table.innerHTML = `
    <thead>
      <tr><th>R</th><th>種別</th><th>内容</th><th>時間</th></tr>
    </thead>
  `;
  const tbody = document.createElement("tbody");
  menu.rounds.forEach(r => {
    const tr = document.createElement("tr");
    tr.id = rowIdFor(r);
    if (r.phase === "rushbag") {
      tr.classList.add("rushbag-row");
    }
    tr.innerHTML = `
      <td>${r.phase === "rushbag" ? "🥊" : r.round}</td>
      <td>${r.phaseName}</td>
      <td>${r.content}</td>
      <td>${r.duration}</td>
    `;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  const tableWrap = document.createElement("div");
  tableWrap.className = "menu-table-wrap";
  tableWrap.appendChild(table);
  container.appendChild(tableWrap);

  document.getElementById("timerSection").style.display = "block";
  document.getElementById("startTimerBtn").disabled = false;
}

document.getElementById("generateBtn").addEventListener("click", () => {
  const level = document.getElementById("levelSelect").value;
  const style = document.getElementById("styleSelect").value;
  currentMenu = generateMenu(level, style);
  renderMenu(currentMenu, level, style);
  resetTimerState();
});

// ===== タイマー =====
const WORK_SEC = 2 * 60;
const REST_SEC = 30;
const RUSH_SEC = 30;

let timerSteps = null; // 平坦化したステップ配列
let stepIndex = 0;
let remaining = 0;
let timerInterval = null;

/**
 * メニューからタイマーのステップ列を組み立てる。
 * 各ラウンドの後(最後を除く)に休憩を挟み、ラッシュバッグはセット数分の
 * 30秒ステップに展開する。
 */
function buildSteps(menu) {
  const steps = [];
  menu.rounds.forEach((r, i) => {
    if (r.phase === "rushbag") {
      for (let s = 1; s <= r.rushbagSets; s++) {
        steps.push({
          type: "rush",
          round: r,
          set: s,
          totalSets: r.rushbagSets,
          duration: RUSH_SEC
        });
      }
    } else {
      steps.push({ type: "work", round: r, duration: WORK_SEC });
    }

    if (i < menu.rounds.length - 1) {
      steps.push({ type: "rest", duration: REST_SEC });
    }
  });
  return steps;
}

function resetTimerState() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerSteps = null;
  stepIndex = 0;
  remaining = 0;
  document.getElementById("timerDisplay").textContent = "--:--";
  document.getElementById("timerLabel").textContent = "準備中";
  document.getElementById("startTimerBtn").textContent = "開始";
  document.getElementById("startTimerBtn").disabled = !currentMenu;
  document.querySelectorAll(".menu-table tbody tr").forEach(tr => tr.classList.remove("active-round"));
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function startTimer() {
  if (!currentMenu) return;

  if (timerInterval) {
    // 一時停止
    clearInterval(timerInterval);
    timerInterval = null;
    document.getElementById("startTimerBtn").textContent = "再開";
    return;
  }

  if (!timerSteps) {
    timerSteps = buildSteps(currentMenu);
    stepIndex = 0;
    remaining = timerSteps[0].duration;
    // 最初のラウンド開始ゴング+アナウンス
    gong();
    const first = timerSteps[0];
    if (first.type === "work") {
      setTimeout(() => announce(`第${first.round.round}ラウンド、${first.round.phaseName}。${first.round.content}`), 1500);
    } else if (first.type === "rush") {
      setTimeout(() => announce(`ラッシュバッグ、${first.totalSets}セット。${first.round.content}`), 1500);
    }
    updateTimerDisplay();
  }

  document.getElementById("startTimerBtn").textContent = "一時停止";
  timerInterval = setInterval(tick, 1000);
}

function tick() {
  remaining -= 1;

  if (remaining < 0) {
    advanceStep();
    return;
  }

  if (remaining === 0) {
    const step = timerSteps[stepIndex];
    // ラウンド終了・インターバル終了の直前ビープ
    beep(step.type === "rest" ? 660 : 990, 0.3);
  }

  updateTimerDisplay();
}

// 次のworkまたはrushステップを先読みしてアナウンス文を作る
function buildNextAnnounce(nextIndex) {
  for (let i = nextIndex; i < timerSteps.length; i++) {
    const s = timerSteps[i];
    if (s.type === "work") {
      return `第${s.round.round}ラウンド、${s.round.phaseName}。${s.round.content}`;
    }
    if (s.type === "rush") {
      return `ラッシュバッグ、${s.totalSets}セット。${s.round.content}`;
    }
  }
  return null;
}

function advanceStep() {
  if (stepIndex < timerSteps.length - 1) {
    const prevStep = timerSteps[stepIndex];
    stepIndex += 1;
    remaining = timerSteps[stepIndex].duration;
    const curStep = timerSteps[stepIndex];

    if (curStep.type === "rest") {
      // インターバル開始 = 前ラウンド終了ゴング + 次ラウンド内容をアナウンス
      gong();
      const msg = buildNextAnnounce(stepIndex + 1);
      if (msg) {
        setTimeout(() => announce(`インターバル。次は、${msg}`), 1500);
      }
    } else {
      // ラウンド開始ゴング
      gong();
    }

    updateTimerDisplay();
  } else {
    // 全終了
    gong();
    clearInterval(timerInterval);
    timerInterval = null;
    document.getElementById("timerLabel").textContent = "トレーニング終了！お疲れ様でした 🥊";
    document.getElementById("timerDisplay").textContent = "00:00";
    document.getElementById("startTimerBtn").disabled = true;
    document.querySelectorAll(".menu-table tbody tr").forEach(tr => tr.classList.remove("active-round"));
  }
}

function updateTimerDisplay() {
  const step = timerSteps[stepIndex];
  document.getElementById("timerDisplay").textContent = formatTime(remaining);

  document.querySelectorAll(".menu-table tbody tr").forEach(tr => tr.classList.remove("active-round"));

  if (step.type === "work") {
    const r = step.round;
    document.getElementById("timerLabel").textContent = `第${r.round}ラウンド: ${r.phaseName}`;
    document.getElementById(rowIdFor(r))?.classList.add("active-round");
  } else if (step.type === "rest") {
    document.getElementById("timerLabel").textContent = "休憩";
  } else if (step.type === "rush") {
    document.getElementById("timerLabel").textContent = `ラッシュバッグ ${step.set}/${step.totalSets}セット目`;
    document.getElementById(rowIdFor(step.round))?.classList.add("active-round");
  }
}

document.getElementById("startTimerBtn").addEventListener("click", startTimer);
document.getElementById("resetTimerBtn").addEventListener("click", () => {
  if (!currentMenu) return;
  resetTimerState();
});
