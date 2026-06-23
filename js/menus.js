// レベル・スタイル別トレーニングメニューのデータ定義

const STYLE_LABELS = {
  outboxer: "アウトボクサー",
  infighter: "インファイター",
  counter: "カウンターパンチャー",
  allround: "オールラウンダー"
};

const LEVEL_LABELS = {
  beginner1: "初心者①(ストレート期)",
  beginner2: "初心者②(フック期)",
  beginner3: "初心者③(アッパー期)",
  intermediate: "中級者(マスボクシング)",
  advanced: "上級者(スパーリング)"
};

const SAFETY_NOTE_SPAR =
  "※スパーリングを行う場合は、必ずヘッドギア・マウスピース・グローブを正しく着用し、パワーを抑えて安全第一で行ってください。";

const SAFETY_NOTE_MASS =
  "※マスボクシングは事前にパートナーと当てる強さ・本気度を確認し、技術確認を目的に安全に行ってください。";

// シャドーボクシング:初心者期はパンチ習得の段階に合わせた内容(スタイル共通)
const SHADOW_BY_BEGINNER_LEVEL = {
  beginner1: [
    "ジャブの基本フォーム確認:まっすぐ腕を伸ばし、当たる瞬間に拳を握る",
    "右ストレートの基本:後ろ足の蹴りを腰→肩→拳の順に伝える",
    "ジャブ→ストレート(ワンツー)の連携を鏡でチェック",
    "構え・フットワークを確認しながらのストレート連打"
  ],
  beginner2: [
    "ジャブ→ストレートのコンビネーションを継続して精度を高める",
    "左フックの基本:前足重心で腰の回転を使って打つ",
    "ワンツー→左フックのコンビネーション",
    "ストレートとフックを切り替える打ち分け練習"
  ],
  beginner3: [
    "ショートアッパーの基本:腰の回転なしで腕を突き上げる練習",
    "ジャブ→ストレート→フック→アッパーの総合コンビネーション",
    "ロングアッパー:肩を中心に打つ感覚を確認",
    "全パンチ(ストレート・フック・アッパー)を織り交ぜたシャドー"
  ]
};

// サンドバッグ:初心者期はシャドーと同じパンチ習得段階に合わせた内容(スタイル共通)
const BAG_BY_BEGINNER_LEVEL = {
  beginner1: [
    "ジャブを連打し、体重を前に乗せる感覚をつかむ",
    "ワンツー(ジャブ→ストレート)を連続で打ち込む",
    "ステップインしてジャブ→ステップアウトの繰り返し",
    "ワンツーのリズムを一定に保ちながら連打"
  ],
  beginner2: [
    "ワンツー→左フックのコンビネーションを連打",
    "ジャブ・ストレート・フックを織り交ぜた連打",
    "フックを強調したコンビネーションで体重移動を確認",
    "ワンツーからフックへ繋ぐスピード強化"
  ],
  beginner3: [
    "ジャブ→ストレート→フック→アッパーの総合コンビネーション",
    "アッパーを混ぜたコンビネーションで上下の打ち分け",
    "全パンチを使った連続コンビネーション",
    "スピードとパワーを切り替えながらの総合連打"
  ]
};

// 目慣れボクシング:フック期以降は最終ラウンドを「同じパンチで打ち返す」に変更
const EYEBOXING_BY_LEVEL = {
  beginner2: [
    "目慣れボクシング:パートナーの軽いジャブをパリング(払う)で対応する練習",
    "目慣れ受け返し:受けたら同じパンチで打ち返す。ジャブにはジャブ、フックにはフックで返す。打たない方の手は必ずガード"
  ]
};

// ミット打ち:初心者期はシャドーと同じパンチ習得段階に合わせた内容(スタイル共通)
const MITT_BY_BEGINNER_LEVEL = {
  beginner1: [
    "ジャブの精度確認:ミットの位置に正確に当てる",
    "ワンツー(ジャブ→ストレート)のタイミングを合わせる",
    "ジャブ→ジャブ→ストレートのリズム練習",
    "ワンツーを正確なフォームで繰り返す"
  ],
  beginner2: [
    "ワンツー→左フックのコンビネーションをミットで確認",
    "ジャブ・ストレート・フックの打ち分けをミットで練習",
    "フックのタイミングをミット担当の動きに合わせる",
    "ワンツー+フックのコンビネーションを反復"
  ],
  beginner3: [
    "ジャブ→ストレート→フック→アッパーの総合コンビネーション",
    "アッパーを含む上下の打ち分けをミットで確認",
    "全パンチを使ったコンビネーションをテンポ良く",
    "ディフェンス動作を挟んだ総合コンビネーション"
  ]
};

// フェーズごとの内容(スタイル別・共通)
const PHASE_CONTENT = {
  warmup: {
    common: [
      "縄跳び またはその場ジョギングで全身を温める(心拍数アップ)",
      "軽いシャドーボクシングで肩・腰・足首を動かし、フォームを確認する"
    ]
  },
  shadow: {
    outboxer: [
      "ジャブ→バックステップを繰り返し、距離感を作る練習",
      "ジャブ→ストレート→サイドステップのコンビネーションをミラーで確認",
      "フットワーク主体のシャドー:常に半歩動きながらパンチを出す"
    ],
    infighter: [
      "ガードを固めて前進しながらワンツー→ボディフックの連打",
      "ヘッドスリップしながら接近し、左右フックで攻める動き",
      "ボディへのワンツーからアッパーへ繋ぐコンビネーション"
    ],
    counter: [
      "相手の打ち終わりを想定し、スリップ→カウンターの形を反復",
      "バックステップでパンチを外してからの右ストレートカウンター",
      "ロールからのカウンターフックを繰り返す"
    ],
    allround: [
      "ジャブ・ワンツー・フック・アッパーを織り交ぜたコンビネーション",
      "前後左右のフットワークを入れながら全パンチをバランス良く出す",
      "ディフェンス(ブロック・スリップ)とパンチを交互に組み合わせる"
    ]
  },
  mitt: {
    outboxer: [
      "ジャブを起点に距離を取るコンビネーション(ジャブ-ジャブ-ストレート)をミットへ",
      "打ったら即サイドステップで離れる、アウトボクシング想定の連携ミット",
      "ダブルジャブ→ワンツーのリズム強化"
    ],
    infighter: [
      "接近戦想定:ワンツー→左右ボディフック→アッパーのコンビネーション",
      "ガードしながら前進し、ミットの圧力に押し負けない連打",
      "ボディ→ヘッドの上下打ち分けコンビネーション"
    ],
    counter: [
      "ミット側の動きに対してスリップ→カウンターを返す反応練習",
      "フェイントを入れてからのカウンター打ち分け",
      "相手のジャブをパリーしてからの右ストレート"
    ],
    allround: [
      "ジャブ-ワンツー-フック-アッパーの総合コンビネーション",
      "ディフェンスからの返しパンチを組み合わせた総合練習",
      "テンポを変化させたコンビネーションで対応力を養う"
    ]
  },
  bag: {
    outboxer: [
      "ジャブ中心で連打、距離を意識して打ったら離れる",
      "ワンツーを軸にしたスピード重視のコンビネーション",
      "ステップインしてジャブ→ステップアウトの繰り返し"
    ],
    infighter: [
      "接近して左右フック・ボディアッパーを連続で叩き込む",
      "ガードを固めたまま体重移動を使ったパワーパンチ連打",
      "ボディ→ヘッドの連続コンビネーション"
    ],
    counter: [
      "スリップ動作を入れてからのカウンターパンチ連打",
      "リズムを変えながらフェイント→本気の一打を意識する",
      "バックステップ→踏み込みカウンターの反復"
    ],
    allround: [
      "基本コンビネーション(ジャブ・ワンツー・フック・アッパー)をバランス良く",
      "スピード重視ラウンドとパワー重視ラウンドを交互に",
      "ディフェンス動作を挟みながらの連打"
    ]
  },
  footwork: {
    outboxer: [
      "前後左右のステップワークでリングを広く使う動き",
      "ジャブを打ちながらのサイドステップ反復"
    ],
    infighter: [
      "相手との距離を詰めるプレッシャーステップ",
      "ヘッドムーブメントと共に前進するフットワーク"
    ],
    counter: [
      "バックステップ→踏み込みのタイミング練習",
      "ロール+ステップでパンチをかわす動き"
    ],
    allround: [
      "前後左右のステップ+ヘッドスリップを組み合わせた総合フットワーク",
      "ディフェンス(スウェー・ブロック・パーリング)のドリル"
    ]
  },
  eyeboxing: {
    common: [
      "目慣れボクシング:パートナーの軽いジャブをパリング(払う)で対応する練習",
      "目慣れボクシング:軽いパンチをブロッキング(ガードで受ける)で止める練習",
      "目慣れボクシング:パリングとブロッキングを交互に行い、パンチに目を慣らす"
    ]
  },
  counterreturn: {
    common: [
      "パンチの受け返し:ジャブをブロックしてから即ワンツーを返す",
      "パンチの受け返し:パリングした直後にカウンターのストレートを返す",
      "パンチの受け返し:フックをブロックしてからボディへの返しパンチ",
      "パンチの受け返し:ディフェンス→カウンターのテンポを上げて反復"
    ]
  },
  massboxing: {
    common: [
      `マスボクシング:技術確認中心、当てる力は抑えて行う。${SAFETY_NOTE_MASS}`,
      `マスボクシング:コンビネーションとディフェンスの連動を実践確認する。${SAFETY_NOTE_MASS}`
    ]
  },
  sparring: {
    common: [
      `スパーリング:技術確認中心、パワーは抑える。${SAFETY_NOTE_SPAR}`,
      `スパーリング:実践的なコンビネーションと駆け引きを意識する。${SAFETY_NOTE_SPAR}`
    ]
  },
  rushbag: {
    common: [
      "サンドバッグを30秒交代で全力連打。2人の場合は30秒ごとに交代、1人の場合は「全力30秒→流す30秒」を繰り返す"
    ]
  },
  core: {
    common: [
      "腹筋・体幹トレーニング(プランク、ツイストなど)で軸を強化",
      "腕立て伏せ・スクワットなど基礎体力トレーニング"
    ]
  },
  cooldown: {
    common: [
      "クールダウン:ゆっくりとした呼吸とストレッチで筋肉を緩める",
      "使った部位(肩・腕・腰・足)を中心にストレッチ"
    ]
  }
};

const PHASE_NAMES = {
  warmup: "ウォームアップ",
  shadow: "シャドーボクシング",
  mitt: "ミット打ち",
  bag: "サンドバッグ",
  footwork: "フットワーク・ディフェンス",
  eyeboxing: "目慣れボクシング",
  counterreturn: "パンチの受け返し",
  massboxing: "マスボクシング",
  sparring: "スパーリング",
  rushbag: "ラッシュバッグ",
  core: "コンディショニング",
  cooldown: "クールダウン"
};

// レベル別 20ラウンドの構成テンプレート(フェーズの並び)
const LEVEL_TEMPLATES = {
  beginner1: [
    "warmup", "warmup",
    "shadow", "shadow", "shadow", "shadow", "shadow", "shadow",
    "eyeboxing", "eyeboxing", "eyeboxing",
    "bag", "bag", "bag", "bag",
    "mitt", "mitt", "mitt",
    "core",
    "cooldown"
  ],
  beginner2: [
    "warmup",
    "shadow", "shadow", "shadow", "shadow", "shadow",
    "eyeboxing", "eyeboxing",
    "bag", "bag", "bag", "bag",
    "mitt", "mitt", "mitt", "mitt",
    "counterreturn", "counterreturn",
    "core",
    "cooldown"
  ],
  beginner3: [
    "warmup",
    "shadow", "shadow", "shadow", "shadow",
    "counterreturn", "counterreturn", "counterreturn",
    "bag", "bag", "bag", "bag",
    "mitt", "mitt", "mitt", "mitt",
    "footwork", "footwork",
    "core",
    "cooldown"
  ],
  intermediate: [
    "warmup",
    "shadow", "shadow",
    "counterreturn", "counterreturn",
    "bag", "bag", "bag",
    "mitt", "mitt", "mitt", "mitt",
    "massboxing", "massboxing", "massboxing", "massboxing",
    "footwork", "footwork",
    "core",
    "cooldown"
  ],
  advanced: [
    "warmup",
    "shadow", "shadow",
    "bag", "bag", "bag",
    "mitt", "mitt", "mitt",
    "massboxing", "massboxing", "massboxing",
    "sparring", "sparring", "sparring", "sparring",
    "counterreturn", "counterreturn",
    "footwork",
    "core"
  ]
};

// レベル別ラッシュバッグのセット数(30秒×N回交代)
const RUSHBAG_SETS = {
  beginner1: 6,
  beginner2: 8,
  beginner3: 8,
  intermediate: 9,
  advanced: 12
};

/**
 * レベル・スタイルから20ラウンド分のメニュー(+ラッシュバッグ)を生成する
 * ラッシュバッグはコンディショニング(core)の直前に配置される
 */
function generateMenu(level, style) {
  const baseTemplate = LEVEL_TEMPLATES[level];
  const coreIndex = baseTemplate.indexOf("core");
  const template = [...baseTemplate];
  template.splice(coreIndex, 0, "rushbag");

  const counters = {}; // フェーズごとの出現回数カウンタ(内容ローテーション用)
  const isBeginner = level === "beginner1" || level === "beginner2" || level === "beginner3";
  const rushbagSets = RUSHBAG_SETS[level];

  let roundNumber = 0;
  const rounds = template.map((phase) => {
    if (phase === "rushbag") {
      return {
        round: null,
        phase: "rushbag",
        phaseName: PHASE_NAMES.rushbag,
        content: PHASE_CONTENT.rushbag.common[0],
        duration: `30秒×${rushbagSets}セット`,
        rushbagSets: rushbagSets
      };
    }

    const count = counters[phase] || 0;
    counters[phase] = count + 1;

    let contentSet;
    if (phase === "shadow" && isBeginner) {
      contentSet = SHADOW_BY_BEGINNER_LEVEL[level];
    } else if (phase === "bag" && isBeginner) {
      contentSet = BAG_BY_BEGINNER_LEVEL[level];
    } else if (phase === "mitt" && isBeginner) {
      contentSet = MITT_BY_BEGINNER_LEVEL[level];
    } else if (phase === "eyeboxing" && EYEBOXING_BY_LEVEL[level]) {
      contentSet = EYEBOXING_BY_LEVEL[level];
    } else {
      contentSet = PHASE_CONTENT[phase][style] || PHASE_CONTENT[phase].common;
    }

    const content = contentSet[count % contentSet.length];

    roundNumber += 1;
    return {
      round: roundNumber,
      phase: phase,
      phaseName: PHASE_NAMES[phase],
      content: content,
      duration: "2分(休憩30秒)"
    };
  });

  return {
    rounds: rounds,
    rushbagSets: rushbagSets
  };
}
