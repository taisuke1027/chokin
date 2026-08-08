/**
 * more.js — その他メニュー
 */
const MoreView = {
  render() {
    return el(`
      <div>
        <h2 style="font-family:var(--font-display); font-size:19px; margin:8px 0 16px;">その他</h2>

        <div class="card" style="padding:0; overflow:hidden;">
          ${this.menuItem(icon("book", { size: 20 }), "シーズン成績", "過去シーズンの記録を見る", "seasons")}
          ${this.menuItem(icon("flask", { size: 20 }), "科学的根拠・計算方法", "BPTの考え方と出典について", "science")}
        </div>

        <div class="card">
          <div class="section-label">運動記録のバックアップ</div>
          <p class="small-muted" style="line-height:1.6; margin-bottom:12px;">
            これまでの運動記録をJSONファイルとして書き出したり、書き出したファイルを読み込んで復元したりできます。機種変更やブラウザデータの消去に備えたバックアップにお使いください。
          </p>
          <button class="btn-secondary" id="exportRecordsBtn">${icon("save", { size: 15 })} 運動記録をエクスポート</button>
          <button class="btn-secondary" id="importRecordsBtn" style="margin-top:10px;">${icon("folder", { size: 15 })} 運動記録をインポート</button>
          <input type="file" id="importRecordsInput" accept="application/json,.json" style="display:none;" />
        </div>

        <div class="card">
          <div class="section-label">このシーズンについて</div>
          <div class="flex-between" style="padding:6px 0;"><span class="small-muted">開始日</span><span class="num">${Fmt.dateFullJp(AppState.season.startDate)}</span></div>
          <div class="flex-between" style="padding:6px 0;"><span class="small-muted">シーズン番号</span><span class="num">Season ${AppState.season.seasonNumber}</span></div>
          <button class="btn-secondary" id="recalcHistoryBtn" style="margin-top:12px;">${icon("gauge", { size: 15 })} 資産履歴を再計算する</button>
          <div class="small-muted" style="margin-top:8px; line-height:1.6;">運動記録は変えずに、シーズン開始日から今日までの資産推移・減価を最新の計算方法で作り直します。過去の計算に誤差があった場合の修正に使えます。</div>
          <button class="btn-secondary" id="endSeasonBtn" style="margin-top:14px;">シーズンを終了して新しく始める</button>
        </div>
      </div>
    `);
  },

  menuItem(icon, title, sub, view) {
    return `
      <button class="menu-item-btn" data-go="${view}" style="width:100%; display:flex; align-items:center; gap:14px; padding:16px 18px; background:none; border:none; border-bottom:1px solid var(--rule); text-align:left;">
        <div style="font-size:20px;">${icon}</div>
        <div style="flex:1;">
          <div style="font-weight:700; font-size:14px;">${title}</div>
          <div style="font-size:11.5px; color:var(--ink-faint); margin-top:2px;">${sub}</div>
        </div>
        <div style="color:var(--ink-faint);">›</div>
      </button>
    `;
  },

  exportRecords() {
    const records = Storage.getWorkoutRecords().filter(r => r.userId === AppState.user.id);
    if (records.length === 0) {
      showToast("エクスポートできる運動記録がありません");
      return;
    }
    const payload = {
      app: "積立貯筋口座",
      exportedAt: new Date().toISOString(),
      version: 1,
      recordCount: records.length,
      records,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chikutate-chokin_records_${todayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast(`${records.length}件の記録をエクスポートしました`);
  },

  importRecords(fileText) {
    let payload;
    try {
      payload = JSON.parse(fileText);
    } catch (e) {
      showToast("ファイルの読み込みに失敗しました（JSON形式ではありません）");
      return;
    }

    const incoming = Array.isArray(payload) ? payload : payload.records;
    if (!Array.isArray(incoming)) {
      showToast("ファイルの形式が正しくありません");
      return;
    }

    const valid = incoming.filter(r =>
      r && typeof r === "object" && r.date &&
      (r.category === "cardio" || r.category === "strength") &&
      typeof r.exerciseId === "string"
    );
    if (valid.length === 0) {
      showToast("インポートできる記録が見つかりませんでした");
      return;
    }

    ConfirmDialog.show(
      `${valid.length}件の運動記録をインポートします。現在のシーズンに追加され、資産・習慣スコアも自動的に作り直されます。よろしいですか？`,
      () => {
        const allRecords = Storage.getWorkoutRecords();
        const existingIds = new Set(allRecords.map(r => r.id));
        const currentSeasonId = AppState.season.id;
        const userId = AppState.user.id;
        let importedCount = 0;
        let skippedCount = 0;
        let earliestDate = null;

        valid.forEach(r => {
          // 同じIDの記録が既にあれば、重複取り込みとしてスキップする
          if (r.id && existingIds.has(r.id)) { skippedCount++; return; }
          const newRecord = {
            id: r.id && !existingIds.has(r.id) ? r.id : uid("wr"),
            userId,
            seasonId: currentSeasonId,
            exerciseId: r.exerciseId,
            category: r.category,
            date: r.date,
            duration: r.duration ?? null,
            distance: r.distance ?? null,
            speed: r.speed ?? null,
            incline: r.incline ?? null,
            weight: r.weight ?? null,
            repetitions: r.repetitions ?? null,
            sets: r.sets ?? null,
            heartRate: r.heartRate ?? null,
            calculatedStimulus: r.calculatedStimulus ?? null,
            calculatedBPT: r.calculatedBPT ?? null,
            gainBreakdown: r.gainBreakdown ?? { cardio: 0, strength: 0, endurance: 0 },
          };
          allRecords.push(newRecord);
          existingIds.add(newRecord.id);
          importedCount++;
          if (earliestDate === null || newRecord.date < earliestDate) earliestDate = newRecord.date;
        });
        Storage.saveWorkoutRecords(allRecords);

        if (importedCount === 0) {
          showToast("すべて重複していたため、インポートは行われませんでした");
          return;
        }

        // インポートした記録がシーズン開始日より前の日付なら、開始日をさかのぼらせて
        // 資産履歴の再計算にすべて反映されるようにする
        const season = Storage.getSeason(currentSeasonId);
        if (earliestDate && earliestDate < season.startDate) {
          season.startDate = earliestDate;
          Storage.upsertSeason(season);
        }

        SeasonManager.recalculateSeasonHistory(currentSeasonId);
        AppState.season = Storage.getSeason(currentSeasonId);
        AppState.recomputeHabitScore();

        showToast(`${importedCount}件を取り込みました${skippedCount > 0 ? `（${skippedCount}件は重複のためスキップ）` : ""}`);
        Router.go("home");
      },
      { confirmLabel: "インポートする", danger: false }
    );
  },

  afterRender() {
    document.querySelectorAll(".menu-item-btn").forEach(b => {
      b.addEventListener("click", () => Router.go(b.dataset.go));
    });

    document.getElementById("exportRecordsBtn").addEventListener("click", () => {
      this.exportRecords();
    });

    document.getElementById("importRecordsBtn").addEventListener("click", () => {
      document.getElementById("importRecordsInput").click();
    });

    document.getElementById("importRecordsInput").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => this.importRecords(reader.result);
      reader.onerror = () => showToast("ファイルの読み込みに失敗しました");
      reader.readAsText(file);
      e.target.value = ""; // 同じファイルを連続で選び直せるようにリセット
    });

    document.getElementById("recalcHistoryBtn").addEventListener("click", () => {
      ConfirmDialog.show(
        "運動記録はそのままに、資産の推移・減価を最新の計算方法で作り直します。よろしいですか？",
        () => {
          const result = SeasonManager.recalculateSeasonHistory(AppState.season.id);
          AppState.season = Storage.getSeason(AppState.season.id);
          AppState.recomputeHabitScore();
          showToast(`資産履歴を再計算しました（現在資産: ${Fmt.bpt(result.newTotal)} BPT）`);
          Router.refresh();
        },
        { confirmLabel: "再計算する", danger: false }
      );
    });

    document.getElementById("endSeasonBtn").addEventListener("click", () => {
      ConfirmDialog.show(
        `現在のシーズンを終了し、新しいシーズンを Season ${AppState.season.seasonNumber + 1} として開始します。よろしいですか？`,
        () => {
          const newSeason = SeasonManager.endCurrentSeasonAndStartNext();
          AppState.season = newSeason;
          AppState.recomputeHabitScore();
          showToast("新しいシーズンが始まりました");
          Router.go("home");
        },
        { confirmLabel: "開始する", danger: false }
      );
    });
  }
};
