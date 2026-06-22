// アプリのUI制御・タイマー処理

let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function beep(freq = 880, duration = 0.2) {
  const ctx = getAudioCtx();
  const play = () => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  };
  if (ctx.state === "running") {
    play();
  } else {
    ctx.resume().then(play);
  }
}

// ボクシングベル音:金属的な響きを重ねて大きめに鳴らす
function gong() {
  const ctx = getAudioCtx();
  const play = () => {
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(1.0, now);
    master.connect(ctx.destination);

    // ベル基音 + 金属倍音(非整数比でリアルな金属感)
    const partials = [
      { freq: 420, vol: 1.0, decay: 3.5 },
      { freq: 630, vol: 0.7, decay: 2.8 },
      { freq: 840, vol: 0.5, decay: 2.2 },
      { freq: 1050, vol: 0.35, decay: 1.8 },
      { freq: 1680, vol: 0.2, decay: 1.2 },
      { freq: 2520, vol: 0.1, decay: 0.8 },
    ];

    partials.forEach(({ freq, vol, decay }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(master);
      // 瞬間的に立ち上がり、ゆっくり減衰
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
      osc.start(now);
      osc.stop(now + decay + 0.1);
    });
  };
  if (ctx.state === "running") {
    play();
  } else {
    ctx.resume().then(play);
  }
}

// 音声アナウンス:短い言葉で自然に
function announce(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "ja-JP";
  utter.rate = 0.85;
  utter.pitch = 1.05;
  const voices = window.speechSynthesis.getVoices();
  const jaVoice = voices.find(v => v.lang.startsWith("ja") && !v.name.includes("Google"))
                 || voices.find(v => v.lang.startsWith("ja"));
  if (jaVoice) utter.voice = jaVoice;
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
      setTimeout(() => announce(`${first.round.round}ラウンド。${first.round.phaseName}`), 1500);
    } else if (first.type === "rush") {
      setTimeout(() => announce(`ラッシュバッグ`), 1500);
    }
    updateTimerDisplay();
  }

  document.getElementById("startTimerBtn").textContent = "一時停止";
  timerInterval = setInterval(tick, 1000);
}

function tick() {
  remaining -= 1;

  if (remaining <= 0) {
    // カウントが0になった瞬間にゴングを鳴らしてステップ移行
    advanceStep();
    return;
  }

  // 残り3秒はカウントダウンビープ
  if (remaining <= 3) {
    beep(880, 0.15);
  }

  updateTimerDisplay();
}

// 次のworkまたはrushステップを先読みしてアナウンス文を作る(短め)
function buildNextAnnounce(nextIndex) {
  for (let i = nextIndex; i < timerSteps.length; i++) {
    const s = timerSteps[i];
    if (s.type === "work") {
      return `次、${s.round.round}ラウンド。${s.round.phaseName}`;
    }
    if (s.type === "rush") {
      return `次、ラッシュバッグ`;
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
