// アプリのUI制御・タイマー処理

let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

// iOS/Android向け:最初のタッチ/クリックでAudioContextを解放しておく
function unlockAudio() {
  const ctx = getAudioCtx();
  if (ctx.state === "suspended") {
    ctx.resume();
  }
  // 無音バッファを再生してiOSのオーディオロックを解除
  const buf = ctx.createBuffer(1, 1, ctx.sampleRate);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start(0);
}
document.addEventListener("touchstart", unlockAudio, { once: true });
document.addEventListener("click", unlockAudio, { once: true });

function playSound(fn) {
  const ctx = getAudioCtx();
  if (ctx.state === "running") {
    fn(ctx);
  } else {
    ctx.resume().then(() => fn(ctx));
  }
}

function beep(freq = 880, duration = 0.2) {
  playSound(ctx => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.01);
  });
}

// リアルなボクシングベル音
// 実際のベルは基音に非整数倍音が重なる。ボクシングベルは約500Hz基音+金属的高倍音
function gong() {
  playSound(ctx => {
    const now = ctx.currentTime;

    // マスターゲイン(クリッピング防止)
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.9, now);
    master.connect(ctx.destination);

    // 金属打音(ノイズバースト):ベルを叩いた瞬間の「カン」という衝撃音
    const noiseLen = Math.floor(ctx.sampleRate * 0.08);
    const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) nd[i] = (Math.random() * 2 - 1);
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    noiseSrc.connect(noiseGain);
    noiseGain.connect(master);
    noiseSrc.start(now);

    // ベル本体の倍音構成(実際のベルに近い非整数倍音)
    // 基音500Hz + 実際のベルの倍音比率に近い値
    const partials = [
      { freq: 500,  vol: 1.0,  decay: 4.0 },
      { freq: 1155, vol: 0.6,  decay: 3.2 },
      { freq: 1862, vol: 0.4,  decay: 2.5 },
      { freq: 2700, vol: 0.25, decay: 1.8 },
      { freq: 3520, vol: 0.15, decay: 1.2 },
      { freq: 4800, vol: 0.08, decay: 0.7 },
    ];

    partials.forEach(({ freq, vol, decay }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(master);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.003); // 超高速アタック
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
      osc.start(now);
      osc.stop(now + decay + 0.05);
    });
  });
}

// 音声アナウンス:スマホ対応(voices非同期ロード考慮)
function announce(text, onEnd) {
  if (!window.speechSynthesis) {
    if (onEnd) onEnd();
    return;
  }
  window.speechSynthesis.cancel();

  const speak = () => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ja-JP";
    utter.rate = 0.85;
    utter.pitch = 1.05;
    utter.volume = 1.0; // ブラウザ仕様上の最大値(これ以上は上げられない)
    const voices = window.speechSynthesis.getVoices();
    const jaVoice = voices.find(v => v.lang.startsWith("ja") && !v.name.includes("Google"))
                   || voices.find(v => v.lang.startsWith("ja"));
    if (jaVoice) utter.voice = jaVoice;
    if (onEnd) {
      utter.onend = onEnd;
      utter.onerror = onEnd;
    }
    window.speechSynthesis.speak(utter);
  };

  // Androidなどはvoicesが非同期でロードされるため遅延して再試行
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    speak();
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      speak();
    };
    // フォールバック:0.5秒後に音声リストを待たず実行
    setTimeout(speak, 500);
  }
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

  // 開始ラウンド選択肢を再構築
  const startRoundSelect = document.getElementById("startRoundSelect");
  startRoundSelect.innerHTML = "";
  menu.rounds.forEach((r, i) => {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = r.phase === "rushbag"
      ? `🥊 ラッシュバッグ — ${r.phaseName}`
      : `第${r.round}R — ${r.phaseName}`;
    startRoundSelect.appendChild(opt);
  });

  const tableWrap = document.createElement("div");
  tableWrap.className = "menu-table-wrap";
  tableWrap.appendChild(table);
  container.appendChild(tableWrap);

  // 今日のテクニック
  if (typeof getDailyTip === "function") {
    const tip = getDailyTip();
    const tipCard = document.createElement("div");
    tipCard.className = "tip-card";
    tipCard.innerHTML = `
      <div class="tip-header">💡 今日のテクニック</div>
      <div class="tip-category">${tip.category}</div>
      <div class="tip-text">${tip.text}</div>
    `;
    container.appendChild(tipCard);
  }

  // コーチ新座宏のYouTube参照
  const ytCard = document.createElement("div");
  ytCard.className = "coach-video-card";
  ytCard.innerHTML = `
    <div class="coach-video-text">🎥 詳しい打ち方は新座宏コーチのYouTubeで解説中</div>
    <a class="coach-video-link" href="https://www.youtube.com/@%E6%96%B0%E5%BA%A7%E5%AE%8F" target="_blank" rel="noopener">YouTubeで見る →</a>
  `;
  container.appendChild(ytCard);

  // 技術ライブラリ（索引）
  if (typeof getTipsByGroup === "function") {
    const lib = document.createElement("div");
    lib.className = "tech-library";
    lib.innerHTML = '<div class="tech-library-title">📖 技術ライブラリ</div>';
    getTipsByGroup().forEach((g, gi) => {
      const section = document.createElement("div");
      section.className = "tech-group";
      const btn = document.createElement("button");
      btn.className = "tech-group-btn";
      btn.textContent = g.group;
      btn.setAttribute("aria-expanded", "false");
      const content = document.createElement("div");
      content.className = "tech-group-content";
      content.hidden = true;
      g.tips.forEach(t => {
        const item = document.createElement("div");
        item.className = "tech-tip-item";
        item.innerHTML = `<span class="tech-tip-cat">${t.category}</span><p class="tech-tip-text">${t.text}</p>`;
        content.appendChild(item);
      });
      btn.addEventListener("click", () => {
        const open = !content.hidden;
        content.hidden = open;
        btn.setAttribute("aria-expanded", String(!open));
        btn.classList.toggle("open", !open);
      });
      section.appendChild(btn);
      section.appendChild(content);
      lib.appendChild(section);
    });
    container.appendChild(lib);
  }

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
  document.getElementById("startRoundSelect").disabled = false;
  document.querySelectorAll(".menu-table tbody tr").forEach(tr => tr.classList.remove("active-round"));
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ハイテンションJ-POPワークアウトプレイリスト(Amazon Music)
const AMAZON_MUSIC_PLAYLIST_URL = "https://music.amazon.co.jp/playlists/B08C79516K";

// Amazon Musicでプレイリストを開く。アプリ/タブが開けない場合は何もしない(無音のまま)
function openAmazonMusic() {
  try {
    const win = window.open(AMAZON_MUSIC_PLAYLIST_URL, "_blank");
    if (!win) return; // ポップアップブロック等 → 静かに諦める
  } catch (e) {
    // 何もしない
  }
}

document.getElementById("musicBtn").addEventListener("click", openAmazonMusic);

function startTimer() {
  if (!currentMenu) return;

  // iOSはユーザー操作内でspeechSynthesisを一度呼ばないと以降が動かない
  if (window.speechSynthesis) {
    const unlock = new SpeechSynthesisUtterance(" ");
    unlock.volume = 0;
    window.speechSynthesis.speak(unlock);
  }

  if (timerInterval) {
    // 一時停止
    clearInterval(timerInterval);
    timerInterval = null;
    document.getElementById("startTimerBtn").textContent = "再開";
    return;
  }

  if (!timerSteps) {
    timerSteps = buildSteps(currentMenu);

    const startRoundIndex = Number(document.getElementById("startRoundSelect").value || 0);
    const startRound = currentMenu.rounds[startRoundIndex];
    const foundIndex = timerSteps.findIndex(s => s.round === startRound);
    stepIndex = foundIndex >= 0 ? foundIndex : 0;
    document.getElementById("startRoundSelect").disabled = true;

    remaining = timerSteps[stepIndex].duration;
    // 最初のラウンド開始ゴング+アナウンス。音楽はアナウンスが終わってから開く
    // (タブが背面に回るとspeechSynthesisが止まるブラウザがあるため)
    gong();
    const first = timerSteps[stepIndex];
    if (first.type === "work") {
      const content = toSpeechText(first.round.content);
      setTimeout(() => announce(`${first.round.round}ラウンド。${first.round.phaseName}。${content}`, openAmazonMusic), 1500);
    } else if (first.type === "rush") {
      const content = toSpeechText(first.round.content);
      setTimeout(() => announce(`ラッシュバッグ。${content}`, openAmazonMusic), 1500);
    } else {
      openAmazonMusic();
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

// 読み上げ用に記号だけ整えて自然な文にする(括弧内は残す)
function toSpeechText(str) {
  return str
    .replace(/※.*/g, "")          // ※以降の安全注意書きのみ除去
    .replace(/[（(]/g, "、")       // 括弧を読点に置換して内容は読む
    .replace(/[）)]/g, "。")
    .replace(/[:：]/g, "、")
    .replace(/[①②③④⑤]/g, "")
    .replace(/[→]/g, "から")
    .replace(/\s+/g, " ")
    .trim();
}

// 次のworkまたはrushステップを先読みしてアナウンス文を作る
function buildNextAnnounce(nextIndex) {
  for (let i = nextIndex; i < timerSteps.length; i++) {
    const s = timerSteps[i];
    if (s.type === "work") {
      const content = toSpeechText(s.round.content);
      return `次、${s.round.round}ラウンド。${s.round.phaseName}。${content}`;
    }
    if (s.type === "rush") {
      const content = toSpeechText(s.round.content);
      return `次、ラッシュバッグ。${content}`;
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
      // インターバル開始ゴング + 次ラウンド内容を予告
      gong();
      const msg = buildNextAnnounce(stepIndex + 1);
      if (msg) {
        setTimeout(() => announce(`インターバル。次は、${msg}`), 1500);
      }
    } else if (curStep.type === "work") {
      // ラウンド開始ゴング + 内容を読み上げ
      gong();
      const r = curStep.round;
      const content = toSpeechText(r.content);
      setTimeout(() => announce(`${r.round}ラウンド。${r.phaseName}。${content}`), 1000);
    } else if (curStep.type === "rush") {
      // ラッシュバッグ開始ゴング + 内容を読み上げ
      gong();
      const content = toSpeechText(curStep.round.content);
      setTimeout(() => announce(`ラッシュバッグ。${content}`), 1000);
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

