/**
 * weightRecord.js — 「体重を記録する」画面
 * BPT資産・シーズンとは独立した、日毎の体重ログ。身長が設定されていればBMIも表示する。
 */
const WeightRecordView = {
  state: { date: null },

  render() {
    if (!this.state.date) this.state.date = todayStr();
    const existing = Storage.getWeightRecordByDate(AppState.user.id, this.state.date);
    const heightCm = AppState.user.heightCm;

    return el(`
      <div>
        <h2 style="font-family:var(--font-display); font-size:19px; margin:8px 0 16px;">体重を記録する</h2>

        <div class="card">
          <div class="field-group">
            <label>記録する日付</label>
            <input type="date" id="weightDateInput" value="${this.state.date}" max="${todayStr()}" />
          </div>
          <div class="field-group">
            <label>体重 (kg)</label>
            <input type="number" id="weightValueInput" inputmode="decimal" step="0.1" min="0" max="300"
              placeholder="例: 65.0" value="${existing ? existing.weight : ""}" />
          </div>

          <div id="bmiPreviewArea">${this.renderBmiPreview(existing ? existing.weight : null, heightCm)}</div>
        </div>

        <button class="btn-primary" id="saveWeightBtn" style="margin-top:4px;">記録する</button>
      </div>
    `);
  },

  /** 身長が設定されていればBMIプレビューを、未設定なら身長設定への導線を表示する */
  renderBmiPreview(weight, heightCm) {
    if (!heightCm) {
      return `
        <div class="weight-bmi-hint">
          <span class="small-muted">身長が未設定です。設定するとBMIが計算されます。</span>
          <button class="btn-text" id="goHeightSettingsBtn" style="margin-top:4px;">${icon("ruler", { size: 14 })} 身長を設定する</button>
        </div>
      `;
    }
    if (!weight || weight <= 0) {
      return `<div class="weight-bmi-hint"><span class="small-muted">体重を入力するとBMIが表示されます（身長 ${heightCm}cm）</span></div>`;
    }
    const bmi = BmiCalculator.calculate(weight, heightCm);
    const cat = BmiCalculator.category(bmi);
    return `
      <div class="weight-bmi-preview">
        <span class="k">BMI</span>
        <span class="num v">${bmi.toFixed(1)}</span>
        <span class="weight-bmi-cat" style="color:${cat.color};">${cat.label}</span>
      </div>
    `;
  },

  afterRender() {
    const dateInput = document.getElementById("weightDateInput");
    const weightInput = document.getElementById("weightValueInput");
    const previewArea = document.getElementById("bmiPreviewArea");

    const refreshPreview = () => {
      const weight = parseFloat(weightInput.value);
      previewArea.innerHTML = this.renderBmiPreview(isNaN(weight) ? null : weight, AppState.user.heightCm);
      const btn = document.getElementById("goHeightSettingsBtn");
      if (btn) btn.addEventListener("click", () => Router.go("heightSettings"));
    };

    dateInput.addEventListener("change", () => {
      this.state.date = dateInput.value || todayStr();
      const existing = Storage.getWeightRecordByDate(AppState.user.id, this.state.date);
      weightInput.value = existing ? existing.weight : "";
      refreshPreview();
    });
    weightInput.addEventListener("input", refreshPreview);

    const goHeightBtn = document.getElementById("goHeightSettingsBtn");
    if (goHeightBtn) goHeightBtn.addEventListener("click", () => Router.go("heightSettings"));

    document.getElementById("saveWeightBtn").addEventListener("click", () => {
      const weight = parseFloat(weightInput.value);
      if (isNaN(weight) || weight <= 0) {
        showToast("体重を入力してください");
        return;
      }
      const date = dateInput.value || todayStr();
      const record = Models.createWeightRecord(AppState.user.id, date, weight);
      Storage.upsertWeightRecord(record);
      this.state.date = null; // 次回はまた「今日」から始める
      showToast(`体重を記録しました（${weight}kg）`);
      Router.go("home");
    });
  }
};
