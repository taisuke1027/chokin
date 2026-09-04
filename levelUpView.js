/**
 * levelUpView.js — 運動記録後、「習慣スコア」「BPTレベル」のランクが
 * 上がっていた場合に表示する、レベルアップの演出オーバーレイ。
 * モチベーション向上のため、結果画面から「運動記録を見る」で遷移するタイミングで表示する。
 * （総運動日数の10日達成は、この演出ではなく記録完了画面のスタンプで表示する）
 */
const LevelUpView = {
  /**
   * @param {object} achievements RecordView.diffAchievements() の戻り値。
   *   habitLevelUp・assetLevelUp のいずれか（または両方）を持つ想定。
   * @param {Function} onDone 演出を閉じたあとに呼ばれるコールバック（画面遷移など）
   */
  show(achievements, onDone) {
    const items = [];
    if (achievements.habitLevelUp) items.push(this.renderHabitItem(achievements.habitLevelUp));
    if (achievements.assetLevelUp) items.push(this.renderAssetItem(achievements.assetLevelUp));

    const root = document.getElementById("overlayRoot");
    const overlay = el(`
      <div class="overlay" id="levelUpOverlay">
        <div class="result-sheet level-up-sheet">
          <div class="level-up-confetti">${this.renderConfetti()}</div>
          <img src="mascot-body-jump.png" alt="しばまる" class="level-up-mascot" />
          <div class="level-up-hanko">${icon("star", { size: 16 })} レベルアップ！</div>
          <div class="level-up-items">${items.join("")}</div>
          <button class="btn-primary" id="levelUpCloseBtn">運動記録を見る</button>
        </div>
      </div>
    `);
    root.appendChild(overlay);

    document.getElementById("levelUpCloseBtn").addEventListener("click", () => {
      overlay.remove();
      if (onDone) onDone();
    });
  },

  renderConfetti() {
    // 紙吹雪はテーマカラーに合わせ、位置・速度・遅延をランダムにして毎回違う見え方にする
    const colors = ["#B08A46", "#9C7838", "#B5493C", "#8FA678", "#6E8FAE", "#C9A15A"];
    let pieces = "";
    for (let i = 0; i < 22; i++) {
      const left = Math.random() * 100;
      const delay = (Math.random() * 0.5).toFixed(2);
      const duration = (1.3 + Math.random() * 0.9).toFixed(2);
      const color = colors[i % colors.length];
      const isCircle = i % 2 === 0;
      pieces += `<span class="confetti-piece${isCircle ? " circle" : ""}" style="left:${left}%; background:${color}; animation-delay:${delay}s; animation-duration:${duration}s;"></span>`;
    }
    return pieces;
  },

  /** 習慣スコアのランクアップ：ランクバッジ画像（PNG）を前後で表示する */
  renderHabitItem(data) {
    return `
      <div class="level-up-item">
        <div class="lu-label">${icon("star", { size: 13 })} 習慣スコア</div>
        <div class="lu-rank-images">
          <img src="${data.before.iconFile}" alt="${data.before.name}" class="lu-rank-badge-img" />
          <span class="lu-rank-arrow">→</span>
          <img src="${data.after.iconFile}" alt="${data.after.name}" class="lu-rank-badge-img lu-rank-badge-img-after" />
        </div>
        <div class="lu-rank-names">
          <span class="from">${data.before.name}</span>
          <span class="arrow">→</span>
          <span class="to">${data.after.name}</span>
        </div>
      </div>
    `;
  },

  /** BPTレベル（資産称号）のレベルアップ：称号の背景写真を前後で表示する */
  renderAssetItem(data) {
    return `
      <div class="level-up-item">
        <div class="lu-label">${icon("medal", { size: 13 })} BPTレベル</div>
        <div class="lu-rank-images">
          <div class="lu-rank-thumb" style="background-image:url('${data.before.bg}');"></div>
          <span class="lu-rank-arrow">→</span>
          <div class="lu-rank-thumb lu-rank-thumb-after" style="background-image:url('${data.after.bg}');"></div>
        </div>
        <div class="lu-rank-names">
          <span class="from">${data.before.name}</span>
          <span class="arrow">→</span>
          <span class="to">${data.after.name}</span>
        </div>
      </div>
    `;
  }
};
