/**
 * assetRankInfo.js — 資産称号（ウォーキング換算レベル）の一覧オーバーレイ
 */
const AssetRankInfoView = {
  show() {
    const asset = AppState.getAsset();
    const total = asset.cardio + asset.strength + asset.endurance;
    const rankInfo = getAssetRankInfo(total);

    const root = document.getElementById("overlayRoot");
    const overlay = el(`
      <div class="overlay">
        <div class="result-sheet" style="text-align:left;">
          <div class="edit-sheet-title">資産称号とは</div>
          <div class="edit-sheet-sub">身体資産（BPT）の合計額を、ウォーキングした場合の距離に換算した目安の称号です</div>

          <div class="asset-rank-badge" style="margin-top:10px; padding-top:10px;">
            <div class="asset-rank-top">
              <span class="asset-rank-name">${icon("medal", { size: 14 })} 現在：${rankInfo.current.name}</span>
              <span class="asset-rank-km">ウォーキング換算 ${formatWalkKm(rankInfo.current.km)}</span>
            </div>
          </div>

          <div class="rank-ladder" style="margin-top:12px;">
            ${CONFIG.ASSET_RANKS.map(r => `
              <div class="rank-ladder-item ${r.name === rankInfo.current.name ? "current-rank" : ""}" style="color:var(--brass-deep); background:var(--brass-soft);">
                <span>${r.name}</span>
                <span class="rl-range">${Fmt.bpt(r.min)} BPT〜（${formatWalkKm(r.km)}）</span>
              </div>
            `).join("")}
          </div>

          <p class="small-muted" style="margin-top:12px; line-height:1.7;">
            「1 BPT ≒ 2.5m歩いた距離」という目安換算（30分・時速5kmのウォーキング ≒ 960BPT ≒ 2.5kmから逆算）を使っています。
            有名な距離とざっくり結びつけた遊び要素なので、実際の地理的な距離とは意図的にずれがあります。
          </p>
          <p class="small-muted" style="margin-top:6px; line-height:1.7;">
            上位の称号ほど、次までに必要なBPTの増分が大きくなるように設計されています。
          </p>

          <div class="edit-actions">
            <button class="btn-primary" id="assetRankInfoCloseBtn">閉じる</button>
          </div>
        </div>
      </div>
    `);
    root.appendChild(overlay);

    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
    document.getElementById("assetRankInfoCloseBtn").addEventListener("click", () => overlay.remove());
  }
};
