/**
 * gameBalanceSettings.js — 「詳細設定（ゲームバランス）」画面
 * 科学的根拠ページで「調整可能な設定値」と説明している値を、実際に変更できる画面。
 */
const GameBalanceSettingsView = {
  render() {
    const gb = GameBalance.current();

    return el(`
      <div>
        <h2 style="font-family:var(--font-display); font-size:19px; margin:8px 0 6px;">詳細設定（ゲームバランス）</h2>
        <p class="small-muted" style="line-height:1.7; margin-bottom:16px;">
          科学的根拠ページで「調整可能な設定値」として説明している数値を、ここで実際に変更できます。数値を変えると、以後の運動記録の計算に反映されます（過去の記録は再計算されません）。
        </p>

        <div class="card">
          <div class="section-label">心肺運動</div>
          <div class="field-group">
            <label>心肺単価（刺激量 → BPT変換係数）</label>
            <input type="number" id="gbCardioUnitPrice" value="${gb.cardioStimulusToBpt}" step="0.1" min="0.1" />
            <p class="field-hint" id="gbCardioUnitPriceHint"></p>
          </div>
          <div class="field-group">
            <label>頻度補正の上限（%）</label>
            <input type="number" id="gbFreqCap" value="${Math.round(gb.frequencyBonusCap * 100)}" step="1" min="0" max="100" />
            <p class="field-hint" id="gbFreqCapHint"></p>
          </div>
        </div>

        <div class="card">
          <div class="section-label">筋力トレーニング</div>
          <div class="field-group">
            <label>筋力単価（刺激量 → BPT変換係数）</label>
            <input type="number" id="gbStrengthUnitPrice" value="${gb.strengthStimulusToBpt}" step="1" min="1" />
            <p class="field-hint" id="gbStrengthUnitPriceHint"></p>
          </div>
          ${EXERCISES.strength.map(e => `
            <div class="field-group">
              <label>${e.name}の対象筋群係数</label>
              <input type="number" class="gb-muscle-coef" data-exercise-id="${e.id}" data-exercise-name="${e.name}" value="${gb.muscleGroupCoefficients[e.id]}" step="0.05" min="0.1" max="3" />
              <p class="field-hint gb-muscle-coef-hint" data-exercise-id="${e.id}"></p>
            </div>
          `).join("")}
        </div>

        <div class="card">
          <div class="section-label">習慣スコアの重み（4項目の合計が100になるようにしてください）</div>
          <div class="field-group"><label>有酸素達成率</label><input type="number" id="gbW_cardio" value="${gb.habitWeights.cardioAchievement}" min="0" max="100" /></div>
          <div class="field-group"><label>筋力達成率</label><input type="number" id="gbW_strength" value="${gb.habitWeights.strengthAchievement}" min="0" max="100" /></div>
          <div class="field-group"><label>継続度</label><input type="number" id="gbW_consistency" value="${gb.habitWeights.consistency}" min="0" max="100" /></div>
          <div class="field-group"><label>運動日数率</label><input type="number" id="gbW_exerciseDays" value="${gb.habitWeights.exerciseDays}" min="0" max="100" /></div>
          <div id="gbWeightSumWarning" class="small-muted" style="color:var(--clay); display:none; margin-top:4px;">
            合計が100になるように調整してください（現在の合計：<span id="gbWeightSumVal"></span>）
          </div>
        </div>

        <div class="card">
          <div class="section-label">習慣スコアの目標値</div>
          <div class="field-group">
            <label>有酸素運動の週間目標時間（分）</label>
            <input type="number" id="gbGoalCardioMin" value="${gb.weeklyCardioMinutesGoal}" step="10" min="10" />
          </div>
          <div class="field-group">
            <label>筋力トレーニングの週間目標日数</label>
            <input type="number" id="gbGoalStrengthDays" value="${gb.weeklyStrengthDaysGoal}" step="1" min="1" max="7" />
          </div>
          <div class="field-group">
            <label>継続度が満点になる連続週数</label>
            <input type="number" id="gbGoalConsistencyWeeks" value="${gb.consistencyMaxWeeks}" step="1" min="1" />
          </div>
        </div>

        <button class="btn-primary" id="gbSaveBtn">保存する</button>
        <button class="btn-secondary" id="gbResetBtn" style="margin-top:10px; margin-bottom:90px;">デフォルトに戻す</button>
      </div>
    `);
  },

  afterRender() {
    // 心肺単価の計算例（30分ウォーキング・心肺刺激量240の想定）をリアルタイム更新
    const cardioPriceInput = document.getElementById("gbCardioUnitPrice");
    const updateCardioPriceHint = () => {
      const price = Number(cardioPriceInput.value) || 0;
      document.getElementById("gbCardioUnitPriceHint").innerHTML =
        `心肺刺激量にこの数値をかけて心肺BPTを算出します。<br>例：30分のウォーキングで心肺刺激量が240だった場合 → 240 ×${price} ＝ ${Math.round(240 * price).toLocaleString("ja-JP")} BPT`;
    };
    cardioPriceInput.addEventListener("input", updateCardioPriceHint);
    updateCardioPriceHint();

    // 頻度補正上限の計算例をリアルタイム更新
    const freqCapInput = document.getElementById("gbFreqCap");
    const updateFreqCapHint = () => {
      const capPercent = Number(freqCapInput.value) || 0;
      const sessionsNeeded = Math.ceil(capPercent / 2); // 1回+2%として、上限に達するのに必要な回数
      document.getElementById("gbFreqCapHint").innerHTML =
        `直近7日間に心肺運動をした回数が多いほど刺激量が上乗せされる仕組みの、上限値です（1回につき+2%、この上限で頭打ち）。<br>例：直近7日間に${sessionsNeeded}回以上運動していると、上限の+${capPercent}%になり、心肺刺激量が${(1 + capPercent / 100).toFixed(2)}倍になります。`;
    };
    freqCapInput.addEventListener("input", updateFreqCapHint);
    updateFreqCapHint();

    // 筋力単価の計算例（筋力刺激量38.4の想定）をリアルタイム更新
    const strengthPriceInput = document.getElementById("gbStrengthUnitPrice");
    const updateStrengthPriceHint = () => {
      const price = Number(strengthPriceInput.value) || 0;
      document.getElementById("gbStrengthUnitPriceHint").innerHTML =
        `筋力刺激量にこの数値をかけて筋力BPTを算出します。<br>例：筋力刺激量が38.4だった場合 → 38.4 ×${price} ＝ ${Math.round(38.4 * price).toLocaleString("ja-JP")} BPT`;
    };
    strengthPriceInput.addEventListener("input", updateStrengthPriceHint);
    updateStrengthPriceHint();

    // 各種目の対象筋群係数の計算例（4セット×8回・相対強度1.0の想定）をリアルタイム更新
    document.querySelectorAll(".gb-muscle-coef").forEach(input => {
      const exerciseId = input.dataset.exerciseId;
      const exerciseName = input.dataset.exerciseName;
      const hintEl = document.querySelector(`.gb-muscle-coef-hint[data-exercise-id="${exerciseId}"]`);
      const updateHint = () => {
        const coef = Number(input.value) || 0;
        const exampleStimulus = (32 * 1.0 * coef).toFixed(1);
        hintEl.innerHTML =
          `「セット数×回数×相対強度」の値にこの係数をかけて、${exerciseName}の筋力刺激量を算出します。<br>例：4セット×8回、相対強度1.0（自己ベストと同じ強度）の場合 → 32 × 1.0 ×${coef} ＝ ${exampleStimulus}`;
      };
      input.addEventListener("input", updateHint);
      updateHint();
    });

    const weightIds = ["gbW_cardio", "gbW_strength", "gbW_consistency", "gbW_exerciseDays"];
    const checkSum = () => {
      const sum = weightIds.reduce((acc, id) => acc + (Number(document.getElementById(id).value) || 0), 0);
      const warn = document.getElementById("gbWeightSumWarning");
      document.getElementById("gbWeightSumVal").textContent = sum;
      warn.style.display = sum === 100 ? "none" : "block";
    };
    weightIds.forEach(id => document.getElementById(id).addEventListener("input", checkSum));
    checkSum();

    document.getElementById("gbSaveBtn").addEventListener("click", () => {
      const weightVals = {
        cardioAchievement: Number(document.getElementById("gbW_cardio").value) || 0,
        strengthAchievement: Number(document.getElementById("gbW_strength").value) || 0,
        consistency: Number(document.getElementById("gbW_consistency").value) || 0,
        exerciseDays: Number(document.getElementById("gbW_exerciseDays").value) || 0,
      };
      const sum = Object.values(weightVals).reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 100) > 0.01) {
        showToast("習慣スコアの重みの合計が100になるようにしてください");
        return;
      }

      const muscleGroupCoefficients = {};
      document.querySelectorAll(".gb-muscle-coef").forEach(input => {
        muscleGroupCoefficients[input.dataset.exerciseId] = Number(input.value) || 1.0;
      });

      const defaults = GameBalance.defaults();
      const settings = {
        cardioStimulusToBpt: Number(document.getElementById("gbCardioUnitPrice").value) || defaults.cardioStimulusToBpt,
        frequencyBonusCap: (Number(document.getElementById("gbFreqCap").value) || 0) / 100,
        strengthStimulusToBpt: Number(document.getElementById("gbStrengthUnitPrice").value) || defaults.strengthStimulusToBpt,
        muscleGroupCoefficients,
        habitWeights: weightVals,
        weeklyCardioMinutesGoal: Number(document.getElementById("gbGoalCardioMin").value) || defaults.weeklyCardioMinutesGoal,
        weeklyStrengthDaysGoal: Number(document.getElementById("gbGoalStrengthDays").value) || defaults.weeklyStrengthDaysGoal,
        consistencyMaxWeeks: Number(document.getElementById("gbGoalConsistencyWeeks").value) || defaults.consistencyMaxWeeks,
      };
      GameBalance.save(settings);
      AppState.recomputeHabitScore();
      showToast("設定を保存しました");
      Router.go("more");
    });

    document.getElementById("gbResetBtn").addEventListener("click", () => {
      ConfirmDialog.show("すべての設定値をデフォルトに戻しますか？", () => {
        GameBalance.resetToDefaults();
        AppState.recomputeHabitScore();
        showToast("デフォルトに戻しました");
        Router.refresh();
      });
    });
  }
};
