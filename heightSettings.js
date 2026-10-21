/**
 * heightSettings.js — 「身長設定」画面
 * BMI計算に使う身長（cm）を設定する。その他メニューから遷移する。
 */
const HeightSettingsView = {
  render() {
    const heightCm = AppState.user.heightCm;

    return el(`
      <div>
        <h2 style="font-family:var(--font-display); font-size:19px; margin:8px 0 16px;">身長設定</h2>

        <div class="card">
          <p class="small-muted" style="line-height:1.6; margin-bottom:14px;">
            体重記録画面やデータグラフで、BMI（体格指数）や標準体重の目安を計算するために使います。
          </p>
          <div class="field-group">
            <label>身長 (cm)</label>
            <input type="number" id="heightInput" inputmode="decimal" step="0.1" min="50" max="250"
              placeholder="例: 165.0" value="${heightCm ?? ""}" />
          </div>
        </div>

        <button class="btn-primary" id="saveHeightBtn">保存する</button>
      </div>
    `);
  },

  afterRender() {
    document.getElementById("saveHeightBtn").addEventListener("click", () => {
      const input = document.getElementById("heightInput");
      const value = parseFloat(input.value);
      if (isNaN(value) || value <= 0) {
        showToast("身長を入力してください");
        return;
      }
      AppState.user.heightCm = value;
      Storage.saveUser(AppState.user);
      showToast(`身長を設定しました（${value}cm）`);
      Router.go("more");
    });
  }
};
