/**
 * home.js — ホーム画面（19章）
 */
const HomeView = {
  render() {
    const tipText = EXERCISE_TIPS[Math.floor(Math.random() * EXERCISE_TIPS.length)];
    const mascotFace = randomMascotFace();

    const asset = AppState.getAsset();
    const total = asset.cardio + asset.strength + asset.endurance;
    const prevDay = AppState.getPrevDayTotal();
    const delta = total - prevDay;
    const deltaClass = delta > 0.5 ? "up" : delta < -0.5 ? "down" : "flat";
    const deltaIcon = delta < -0.5 ? "▼" : "";

    const season = AppState.season;
    const seasonGain = total - season.initialAsset;
    const isAtHigh = total >= season.highestAsset - 0.5;
    const habit = AppState.getHabitScore();
    const habitRank = HabitCalculator.getRank(habit.score);
    const pressureLevel = Storage.getPressureLevel();
    const p = CONFIG.DECAY.PRESSURE_LEVEL;

    const seasonRecords = Storage.getWorkoutRecordsBySeason(season.id);
    const totalExerciseDays = new Set(seasonRecords.map(r => r.date.slice(0, 10))).size;
    const daysSinceStart = Math.max(1, Fmt.daysBetween(season.startDate, todayStr()) + 1);
    const weeklyAvgDays = totalExerciseDays / Math.max(1, daysSinceStart / 7);

    const rankInfo = getAssetRankInfo(total);
    const graceDays = CONFIG.DECAY.CURVE[0].toDay;

    return el(`
      <div>
        <div class="card balance-card" style="position:relative;">
          <button class="info-icon-btn" id="bptInfoBtn" aria-label="BPTについて" style="position:absolute; top:14px; right:14px;">ⓘ</button>

          <!-- 身体資産：最も重要な要素 -->
          <div class="balance-label">${icon("wallet", { size: 15 })} 身体資産</div>
          <div class="balance-amount"><span class="num">${Fmt.bpt(total)}</span><span class="unit">BPT</span></div>
          <div class="home-delta-row">
            <div class="balance-delta ${deltaClass}">
              ${deltaIcon ? `<span>${deltaIcon}</span>` : ""}
              <span class="num">${Fmt.signedBpt(delta)} BPT</span>
              <span style="opacity:.7; font-weight:500;">前日比</span>
            </div>

            <!-- 過去最高・今シーズン積立：補足情報（前日比の右に並べる） -->
            <div class="home-sub-stat-row">
              <div class="home-sub-stat">
                <span class="k">過去最高 ${isAtHigh ? icon("medal", { size: 11, className: "inline-accent" }) : ""}</span>
                <span class="v num">${Fmt.bpt(season.highestAsset)}</span>
              </div>
              <div class="home-sub-stat">
                <span class="k">今シーズン積立</span>
                <span class="v num">${Fmt.signedBpt(seasonGain)}</span>
              </div>
            </div>
          </div>

          <hr class="hr-dash" style="margin:16px 0;" />

          <!-- 習慣スコア：2番目に重要な要素 -->
          <div class="balance-label" style="margin-bottom:10px;">
            ${icon("star", { size: 14 })} 習慣スコア
            <button class="info-icon-btn" id="habitInfoBtn" aria-label="詳しい説明を見る" style="width:18px; height:18px; font-size:11px; margin-left:2px;">ⓘ</button>
          </div>
          <div class="home-habit-row">
            <div class="home-habit-main">
              <div class="habit-ring" data-val="${habit.score}" style="--pct:${habit.score}"></div>
              <div class="habit-text">
                <div class="t">${habit.score} / 100</div>
                <div class="habit-rank-badge" style="color:${habitRank.color}; background:${habitRank.bg};">
                  <img src="${habitRank.iconFile}" alt="${habitRank.name}" class="rank-badge-icon" />
                  ${habitRank.name}
                </div>
                <div class="d">有酸素${habit.cardioAchievement}%達成</div>
                <div class="d">筋トレ${habit.strengthAchievement}%達成</div>
                <div class="d">今週の運動日数${habit.exerciseDays}日</div>
              </div>
            </div>
            <div class="home-habit-side-stats">
              <div class="side-stat-mini">
                <div class="k">総運動日数</div>
                <div class="v num">${totalExerciseDays}日</div>
              </div>
              <div class="side-stat-mini">
                <div class="k">週あたり運動日数</div>
                <div class="v num">${weeklyAvgDays.toFixed(1)}日</div>
              </div>
            </div>
          </div>

          <div class="asset-rank-badge">
            <div class="balance-label" style="margin-bottom:6px;">${icon("medal", { size: 15 })} BPTレベル</div>
            <div class="asset-rank-visual" style="background-image:url('${rankInfo.current.bg}');">
              <div class="asset-rank-content">
                <div class="asset-rank-top">
                  <span class="asset-rank-name">${icon("medal", { size: 14 })} ${rankInfo.current.name}
                    <button class="info-icon-btn" id="assetRankInfoBtn" aria-label="称号の一覧を見る" style="width:18px; height:18px; font-size:11px; margin-left:2px;">ⓘ</button>
                  </span>
                  <span class="asset-rank-km">${Fmt.bpt(total)}BPT（現在の資産）はウォーキング換算した時に${formatWalkKm(rankInfo.current.km)}（${Fmt.bpt(rankInfo.current.min)}BPT）以上の距離に当たります。${rankInfo.current.note ? `（${rankInfo.current.note}）` : ""}</span>
                </div>
                ${rankInfo.next ? `
                  <div class="asset-rank-progress-track"><div class="asset-rank-progress-fill" style="width:${(rankInfo.progress * 100).toFixed(0)}%;"></div></div>
                  <div class="asset-rank-next">次の「${rankInfo.next.name}」まであと ${Fmt.bpt(rankInfo.remaining)} BPT</div>
                ` : `<div class="asset-rank-next">称号は最高位です！</div>`}
              </div>
            </div>
          </div>
        </div>

        <div class="tip-banner" id="tipBanner">
          <div class="tip-banner-badge">${icon("bulb", { size: 12 })} 豆知識</div>
          <img src="${mascotFace.file}" alt="しばまる" class="tip-mascot-icon" />
          <div class="tip-banner-text">${tipText}</div>
        </div>

        <div class="card" style="margin-bottom:100px;">
          <div class="flex-between" style="margin-bottom:8px;">
            <div class="pressure-card-title">プレッシャーレベル（減少係数）</div>
            <button class="info-icon-btn" id="pressureInfoBtn" aria-label="詳しい説明を見る">ⓘ</button>
          </div>
          <div class="flex-between" style="margin-bottom:8px;">
            <span class="small-muted">運動しない期間の資産減少の強さ</span>
            <span class="num" style="font-weight:800; font-size:16px; color:var(--brass-deep);">×${pressureLevel.toFixed(1)}</span>
          </div>
          <input type="range" id="pressureLevelSlider" class="pressure-slider"
            min="${p.MIN}" max="${p.MAX}" step="${p.STEP}" value="${pressureLevel}" />
          <div class="flex-between" style="margin-top:2px;">
            <span class="small-muted" style="font-size:10.5px;">標準（×${p.MIN.toFixed(1)}）</span>
            <span class="small-muted" style="font-size:10.5px;">高負荷（×${p.MAX.toFixed(1)}）</span>
          </div>
          <p class="small-muted" style="margin-top:10px; line-height:1.7;">
            数値を上げるほど、運動をサボった期間の資産減少が大きくなります。標準（×${p.MIN.toFixed(1)}）が最も緩やかな設定です。
          </p>
          <p class="small-muted" style="margin-top:6px; line-height:1.7; color:var(--brass-deep); font-weight:700;">
            目安：${graceDays}日以内に1回運動すれば、資産は減りません。
          </p>
        </div>

        <button class="btn-primary record-cta-fixed" id="recordCta">＋ 運動を記録する</button>
      </div>
    `);
  },

  afterRender() {
    document.getElementById("recordCta").addEventListener("click", () => Router.go("record"));

    document.getElementById("bptInfoBtn").addEventListener("click", () => {
      BptInfoView.show();
    });

    document.getElementById("assetRankInfoBtn").addEventListener("click", () => {
      AssetRankInfoView.show();
    });

    const slider = document.getElementById("pressureLevelSlider");
    const valueLabel = slider.closest(".card").querySelector(".num");
    slider.addEventListener("input", (e) => {
      valueLabel.textContent = `×${Number(e.target.value).toFixed(1)}`;
    });
    slider.addEventListener("change", (e) => {
      Storage.setPressureLevel(Number(e.target.value));
      showToast(`プレッシャーレベルを ×${Number(e.target.value).toFixed(1)} に設定しました`);
    });

    document.getElementById("pressureInfoBtn").addEventListener("click", () => {
      PressureInfoView.show();
    });

    document.getElementById("habitInfoBtn").addEventListener("click", () => {
      HabitInfoView.show();
    });
  }
};

