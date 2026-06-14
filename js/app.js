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
    tr.id = `round-row-${r.round}`;
    tr.innerHTML = `
      <td>${r.round}</td>
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

  // ラッシュバッグ
  const rushBox = document.createElement("div");
  rushBox.className = "rushbag-box";
  rushBox.id = "rushbag-box";
  rushBox.innerHTML = `
    <h3>🥊 ラッシュバッグ(全ラウンド終了後)</h3>
    <p>サンドバッグを<strong>30秒交代</strong>で全力連打します。全${menu.rushbagSets}セット(計${menu.rushbagSets * 0.5}分)。</p>
    <p>2人で行う場合は30秒ごとに交代。1人で行う場合は「全力30秒→流す30秒」を繰り返してください。</p>
  `;
  container.appendChild(rushBox);

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

let timerState = null; // {phase: 'work'|'rest'|'rush', index, remaining}
let timerInterval = null;

function resetTimerState() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerState = null;
  document.getElementById("timerDisplay").textContent = "--:--";
  document.getElementById("timerLabel").textContent = "準備中";
  document.getElementById("startTimerBtn").textContent = "開始";
  document.querySelectorAll(".menu-table tbody tr").forEach(tr => tr.classList.remove("active-round"));
  document.getElementById("rushbag-box")?.classList.remove("active-round");
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

  if (!timerState) {
    timerState = { phase: "work", index: 0, remaining: WORK_SEC };
    updateTimerDisplay();
  }

  document.getElementById("startTimerBtn").textContent = "一時停止";
  timerInterval = setInterval(tick, 1000);
}

function tick() {
  timerState.remaining -= 1;

  if (timerState.remaining < 0) {
    advancePhase();
    return;
  }

  if (timerState.remaining === 0) {
    beep(timerState.phase === "rest" ? 660 : 990, 0.3);
  }

  updateTimerDisplay();
}

function advancePhase() {
  const totalRounds = currentMenu.rounds.length;

  if (timerState.phase === "work") {
    if (timerState.index < totalRounds - 1) {
      timerState.phase = "rest";
      timerState.remaining = REST_SEC;
    } else {
      // 全ラウンド終了 → ラッシュバッグへ
      timerState.phase = "rush";
      timerState.index = 0;
      timerState.remaining = RUSH_SEC;
    }
  } else if (timerState.phase === "rest") {
    timerState.index += 1;
    timerState.phase = "work";
    timerState.remaining = WORK_SEC;
  } else if (timerState.phase === "rush") {
    if (timerState.index < currentMenu.rushbagSets - 1) {
      timerState.index += 1;
      timerState.remaining = RUSH_SEC;
    } else {
      // 終了
      clearInterval(timerInterval);
      timerInterval = null;
      document.getElementById("timerLabel").textContent = "トレーニング終了！お疲れ様でした 🥊";
      document.getElementById("timerDisplay").textContent = "00:00";
      document.getElementById("startTimerBtn").disabled = true;
      document.querySelectorAll(".menu-table tbody tr").forEach(tr => tr.classList.remove("active-round"));
      document.getElementById("rushbag-box")?.classList.remove("active-round");
      return;
    }
  }

  beep(1200, 0.4);
  updateTimerDisplay();
}

function updateTimerDisplay() {
  document.getElementById("timerDisplay").textContent = formatTime(timerState.remaining);

  document.querySelectorAll(".menu-table tbody tr").forEach(tr => tr.classList.remove("active-round"));
  document.getElementById("rushbag-box")?.classList.remove("active-round");

  if (timerState.phase === "work") {
    const r = currentMenu.rounds[timerState.index];
    document.getElementById("timerLabel").textContent = `第${r.round}ラウンド: ${r.phaseName}`;
    document.getElementById(`round-row-${r.round}`)?.classList.add("active-round");
  } else if (timerState.phase === "rest") {
    document.getElementById("timerLabel").textContent = "休憩";
  } else if (timerState.phase === "rush") {
    document.getElementById("timerLabel").textContent = `ラッシュバッグ ${timerState.index + 1}/${currentMenu.rushbagSets}セット目`;
    document.getElementById("rushbag-box")?.classList.add("active-round");
  }
}

document.getElementById("startTimerBtn").addEventListener("click", startTimer);
document.getElementById("resetTimerBtn").addEventListener("click", () => {
  if (!currentMenu) return;
  resetTimerState();
});
