// アプリのUI制御・タイマー処理

let audioCtx = null;

function beep(freq = 880, duration = 0.2) {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = "sine";
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
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
    beep(step.type === "rest" ? 660 : 990, 0.3);
  }

  updateTimerDisplay();
}

function advanceStep() {
  if (stepIndex < timerSteps.length - 1) {
    stepIndex += 1;
    remaining = timerSteps[stepIndex].duration;
    beep(1200, 0.4);
    updateTimerDisplay();
  } else {
    // 終了
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
