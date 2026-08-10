/**
 * asset.js — 「資産」画面
 * 資産表記 → カレンダー（旧: 履歴ページ） → 推移/内訳トグル、の統合画面。
 */
const AssetView = {
  state: { period: "1m", yearMonth: null },
  detailDate: null,
  detailSelectMode: false,
  detailSelectedIds: new Set(),

  colors: { total: "#23262B", cardio: "#6E8FAE", strength: "#A9803F", endurance: "#8FA678" },
  labels: { cardio: "心肺", strength: "筋力", endurance: "筋持久力" },

  periods: [
    { key: "1w", label: "1週間", days: 7 },
    { key: "1m", label: "1ヶ月", days: 30 },
    { key: "3m", label: "3ヶ月", days: 90 },
    { key: "6m", label: "6ヶ月", days: 180 },
    { key: "season", label: "シーズン", days: null },
    { key: "all", label: "全期間", days: null },
  ],

  render() {
    const asset = AppState.getAsset();
    const total = asset.cardio + asset.strength + asset.endurance;
    const season = AppState.season;

    if (!this.state.yearMonth) this.state.yearMonth = this.currentMonthStr();
    const agg = this.aggregateMonth(this.state.yearMonth);
    const { label, range } = this.monthLabelAndRange(this.state.yearMonth);
    const dailyTotals = this.computeDailyTotals(this.state.yearMonth);

    const full = Storage.getAssetHistoryBySeason(season.id);
    const period = this.periods.find(p => p.key === this.state.period);
    let filtered = full;
    if (period.days) {
      const cutoff = addDaysStr(todayStr(), -period.days);
      filtered = full.filter(h => h.date >= cutoff);
    }

    return el(`
      <div>
        <h2 style="font-family:var(--font-display); font-size:19px; margin:8px 0 16px;">資産</h2>

        <h2 style="font-family:var(--font-display); font-size:19px; margin:24px 0 12px;">月毎の収支</h2>
        <div class="card">
          <div class="month-nav">
            <button id="prevMonthBtn">‹</button>
            <div class="month-label">
              <div class="y">${label}</div>
              <div class="range">${range}</div>
            </div>
            <button id="nextMonthBtn" ${this.state.yearMonth >= this.currentMonthStr() ? "disabled style=\"opacity:.3;\"" : ""}>›</button>
          </div>

          <div class="iose-row">
            <div class="iose-col"><div class="k">増加分</div><div class="v income num">${Fmt.bpt(agg.incomeTotal)}</div></div>
            <div class="iose-op-col"><div class="k" style="visibility:hidden;">-</div><div class="iose-op">－</div></div>
            <div class="iose-col"><div class="k">減少分</div><div class="v expense num">${Fmt.bpt(agg.expenseTotal)}</div></div>
            <div class="iose-op-col"><div class="k" style="visibility:hidden;">-</div><div class="iose-op">＝</div></div>
            <div class="iose-col"><div class="k">収支</div><div class="v balance num" style="color:${agg.balance >= 0 ? "var(--brass-deep)" : "var(--clay)"}">${Fmt.signedBpt(agg.balance)}</div></div>
          </div>

          <hr class="hr-dash" style="margin:16px 0;" />

          <div id="calSwipeArea">
            ${this.renderCalendarGrid(this.state.yearMonth, dailyTotals, this.computeRecordDates(this.state.yearMonth))}
          </div>
          <div class="cal-legend">
            <span><span class="cal-legend-dot gain"></span>増加分</span>
            <span><span class="cal-legend-dot decay"></span>減少分</span>
            <span><span class="cal-legend-stamp">達成</span>運動した日</span>
          </div>
        </div>

        <h2 style="font-family:var(--font-display); font-size:19px; margin:24px 0 12px;">データグラフ</h2>
        <div class="card">
          <div class="picker-pill-row">
            <button class="picker-pill" id="periodPill">${icon("calendar", { size: 14 })} ${period.label} <span class="caret">▾</span></button>
          </div>

          <div id="chartHost">${this.renderChart(filtered)}</div>
          <hr class="hr-dash" />
          ${this.renderTrendBreakdown(filtered)}

          <hr class="hr-dash" />
          ${this.renderBreakdownChart(asset, total)}
        </div>

        <h2 style="font-family:var(--font-display); font-size:19px; margin:24px 0 12px;">記録一覧</h2>
        <div class="card">
          ${this.renderList(filtered)}
        </div>
      </div>
    `);
  },

  // ---- 推移（旧: 資産推移ページ） ----

  renderChart(filtered) {
    const points = filtered.map(h => ({ date: h.date, values: { cardio: h.cardio, strength: h.strength, endurance: h.endurance } }));
    // 下から 筋持久力 → 筋力 → 心肺 の順に積み上げる
    const layers = [
      { key: "endurance", color: this.colors.endurance, label: "筋持久力" },
      { key: "strength", color: this.colors.strength, label: "筋力" },
      { key: "cardio", color: this.colors.cardio, label: "心肺" },
    ];
    return ChartUI.renderStackedArea(points, layers, { height: 190 });
  },

  renderTrendBreakdown(filtered) {
    const first = filtered[0];
    const last = filtered[filtered.length - 1];
    if (!first || !last) return "";

    const rows = [
      { key: "total", color: this.colors.total, label: "総資産" },
      { key: "cardio", color: this.colors.cardio, label: "心肺" },
      { key: "strength", color: this.colors.strength, label: "筋力" },
      { key: "endurance", color: this.colors.endurance, label: "筋持久力" },
    ];
    return rows.map(l => {
      const change = last[l.key] - first[l.key];
      return `
        <div class="flex-between" style="padding:7px 0;">
          <span style="display:flex; align-items:center; gap:7px; font-size:12.5px; color:var(--ink-soft);">
            <span class="stack-legend-swatch" style="background:${l.color}"></span>${l.label}
          </span>
          <span class="num" style="font-weight:700; color:${change >= 0 ? "var(--brass-deep)" : "var(--clay)"}">${Fmt.signedBpt(change)}</span>
        </div>
      `;
    }).join("");
  },

  renderList(filtered) {
    if (filtered.length === 0) {
      return `<div class="empty-state"><div class="icon">${icon("folder", { size: 26 })}</div><p>この期間のデータはまだありません。</p></div>`;
    }
    const reversed = [...filtered].reverse();
    let html = "";
    let currentMonth = null;
    reversed.forEach(h => {
      const monthKey = h.date.slice(0, 7);
      if (monthKey !== currentMonth) {
        currentMonth = monthKey;
        const [y, m] = monthKey.split("-");
        html += `<div class="ledger-month-header">${y}年${Number(m)}月</div>`;
      }
      html += `
        <div class="ledger-entry">
          <div class="le-left">
            <div class="le-icon">${icon("calendar", { size: 16 })}</div>
            <div>
              <div class="le-name">${Fmt.dateJp(h.date)}</div>
              <div class="le-sub">心肺${Fmt.bpt(h.cardio)}・筋力${Fmt.bpt(h.strength)}・筋持久${Fmt.bpt(h.endurance)}</div>
            </div>
          </div>
          <div class="le-amt">${Fmt.bpt(h.total)}</div>
        </div>
      `;
    });
    return html;
  },

  // ---- 内訳（旧: ポートフォリオページ） ----
  renderBreakdownChart(asset, total) {
    const t = total || 1;
    const segments = [
      { key: "cardio", color: this.colors.cardio, value: asset.cardio },
      { key: "strength", color: this.colors.strength, value: asset.strength },
      { key: "endurance", color: this.colors.endurance, value: asset.endurance },
    ];
    const donutSvg = ChartUI.renderPieWithLabels(
      segments.map(s => ({ ...s, label: this.labels[s.key] })),
      { centerLabel: { k: "合計", v: Fmt.bpt(t) } }
    );

    return `
      ${donutSvg}
      ${segments.map(seg => this.renderLegendRow(seg, t)).join("")}
    `;
  },

  renderLegendRow(seg, total) {
    const pct = seg.value / total;
    return `
      <div class="legend-row">
        <div class="lg-left"><span class="legend-dot" style="background:${seg.color}"></span>${this.labels[seg.key]}</div>
        <div>
          <div class="lg-val num">${Fmt.bpt(seg.value)} BPT</div>
          <div class="lg-pct">${Fmt.pct(pct)}</div>
        </div>
      </div>
    `;
  },

  // ---- カレンダー（旧: 履歴ページ） ----

  currentMonthStr() {
    return todayStr().slice(0, 7);
  },

  renderCalendarGrid(yearMonth, dailyTotals, recordDates) {
    const [y, m] = yearMonth.split("-").map(Number);
    const firstWeekday = new Date(y, m - 1, 1).getDay(); // 0=日
    const daysInMonth = new Date(y, m, 0).getDate();
    const todayKey = todayStr();
    const weekdayLabels = ["日", "月", "火", "水", "木", "金", "土"];

    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    return `
      <div class="cal-weekdays">
        ${weekdayLabels.map((w, i) => `<div class="cal-weekday ${i === 0 ? "sun" : ""}${i === 6 ? "sat" : ""}">${w}</div>`).join("")}
      </div>
      <div class="cal-grid">
        ${cells.map(d => {
          if (d === null) return `<div class="cal-cell empty"></div>`;
          const dateKey = `${yearMonth}-${String(d).padStart(2, "0")}`;
          const data = dailyTotals[dateKey];
          const hasGain = data && data.gain > 0.5;
          const hasDecay = !!data;
          const hasWorkout = recordDates.has(dateKey);
          return `
            <button class="cal-cell ${dateKey === todayKey ? "today" : ""}" data-date="${dateKey}">
              <div class="cal-top-row">
                <div class="cal-day-num">${d}</div>
                ${hasWorkout ? `<div class="cal-stamp"><span>達</span><span>成</span></div>` : ""}
              </div>
              <div class="cal-day-amounts">
                ${hasGain ? `<div class="cal-gain">+${Fmt.compactBpt(data.gain)}</div>` : ""}
                ${hasDecay ? `<div class="cal-decay">${data.decay > 0.5 ? "-" + Fmt.compactBpt(data.decay) : "0"}</div>` : ""}
              </div>
            </button>
          `;
        }).join("")}
      </div>
    `;
  },

  computeDailyTotals(yearMonth) {
    const seasonIds = SeasonManager.getAllSeasons(AppState.user.id).map(s => s.id);
    const entries = Storage.getAssetHistory().filter(h => seasonIds.includes(h.seasonId) && h.date.startsWith(yearMonth));
    const map = {};
    entries.forEach(e => {
      if (!map[e.date]) map[e.date] = { gain: 0, decay: 0 };
      map[e.date].gain += (e.gainCardio || 0) + (e.gainStrength || 0) + (e.gainEndurance || 0);
      map[e.date].decay += (e.decayCardio || 0) + (e.decayStrength || 0) + (e.decayEndurance || 0);
    });
    return map;
  },

  computeRecordDates(yearMonth) {
    const seasonIds = SeasonManager.getAllSeasons(AppState.user.id).map(s => s.id);
    const records = Storage.getWorkoutRecords()
      .filter(r => seasonIds.includes(r.seasonId) && r.date.slice(0, 7) === yearMonth);
    return new Set(records.map(r => r.date.slice(0, 10)));
  },

  formatDayLabel(dateKey) {
    const d = new Date(dateKey + "T00:00:00");
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    return `${d.getMonth() + 1}月${d.getDate()}日（${weekdays[d.getDay()]}）`;
  },

  monthLabelAndRange(yearMonth) {
    const [y, m] = yearMonth.split("-").map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    return {
      label: `${y}年${m}月`,
      range: `${m}月1日〜${m}月${lastDay}日`,
    };
  },

  aggregateMonth(yearMonth) {
    const seasonIds = SeasonManager.getAllSeasons(AppState.user.id).map(s => s.id);
    const entries = Storage.getAssetHistory().filter(h => seasonIds.includes(h.seasonId) && h.date.startsWith(yearMonth));

    const income = { cardio: 0, strength: 0, endurance: 0 };
    const expense = { cardio: 0, strength: 0, endurance: 0 };
    for (const e of entries) {
      income.cardio += e.gainCardio || 0;
      income.strength += e.gainStrength || 0;
      income.endurance += e.gainEndurance || 0;
      expense.cardio += e.decayCardio || 0;
      expense.strength += e.decayStrength || 0;
      expense.endurance += e.decayEndurance || 0;
    }
    const incomeTotal = income.cardio + income.strength + income.endurance;
    const expenseTotal = expense.cardio + expense.strength + expense.endurance;

    return { income, expense, incomeTotal, expenseTotal, balance: incomeTotal - expenseTotal };
  },

  shiftMonth(yearMonth, delta) {
    const [y, m] = yearMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  },

  // ---- 日付詳細オーバーレイ ----

  showDayDetail(dateKey) {
    this.detailDate = dateKey;
    this.detailSelectMode = false;
    this.detailSelectedIds = new Set();
    this.renderDayDetailOverlay();
  },

  getDayRecords(dateKey) {
    const seasonIds = SeasonManager.getAllSeasons(AppState.user.id).map(s => s.id);
    return Storage.getWorkoutRecords()
      .filter(r => seasonIds.includes(r.seasonId) && r.date.slice(0, 10) === dateKey)
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  renderDayDetailOverlay() {
    this.removeDayDetailOverlay();
    const dateKey = this.detailDate;
    const records = this.getDayRecords(dateKey);

    const root = document.getElementById("overlayRoot");
    const overlay = el(`
      <div class="overlay" id="dayDetailOverlay">
        <div class="result-sheet" style="text-align:left;">
          <div class="flex-between" style="margin-bottom:4px;">
            <div class="edit-sheet-title" style="margin:0;">${this.formatDayLabel(dateKey)}</div>
            <button class="btn-text" id="dayDetailSelectBtn" style="width:auto; padding:0; font-size:12.5px;">
              ${this.detailSelectMode ? "完了" : "選択"}
            </button>
          </div>

          ${this.detailSelectMode ? `
            <div class="flex-between select-action-bar">
              <span class="small-muted">${this.detailSelectedIds.size}件選択中</span>
              <button class="btn-secondary" id="dayDetailBulkDateBtn" style="width:auto; padding:8px 14px; font-size:12.5px;" ${this.detailSelectedIds.size === 0 ? "disabled" : ""}>${icon("calendar", { size: 14 })} 日付を変更</button>
            </div>
          ` : ""}

          <div style="margin-top:10px; max-height:50vh; overflow-y:auto;">
            ${records.length === 0
              ? `<div class="empty-state"><div class="icon">${icon("calendar", { size: 26 })}</div><p>この日の運動記録はありません。</p></div>`
              : records.map(r => this.renderDayDetailRow(r)).join("")}
          </div>

          <div class="edit-actions">
            <button class="btn-secondary" id="dayDetailCloseBtn">閉じる</button>
          </div>
        </div>
      </div>
    `);
    root.appendChild(overlay);

    overlay.addEventListener("click", (e) => { if (e.target === overlay) this.removeDayDetailOverlay(); });
    document.getElementById("dayDetailCloseBtn").addEventListener("click", () => this.removeDayDetailOverlay());

    document.getElementById("dayDetailSelectBtn").addEventListener("click", () => {
      this.detailSelectMode = !this.detailSelectMode;
      this.detailSelectedIds = new Set();
      this.renderDayDetailOverlay();
    });

    const bulkBtn = document.getElementById("dayDetailBulkDateBtn");
    if (bulkBtn) {
      bulkBtn.addEventListener("click", () => {
        this.showBulkDateChange(this.detailSelectedIds, () => {
          this.detailSelectMode = false;
          this.detailSelectedIds = new Set();
          this.removeDayDetailOverlay();
          Router.refresh();
        });
      });
    }

    if (this.detailSelectMode) {
      overlay.querySelectorAll("[data-select-id]").forEach(rowEl => {
        rowEl.addEventListener("click", () => {
          const id = rowEl.dataset.selectId;
          if (this.detailSelectedIds.has(id)) this.detailSelectedIds.delete(id);
          else this.detailSelectedIds.add(id);
          this.renderDayDetailOverlay();
        });
      });
    } else {
      overlay.querySelectorAll("[data-record-id]").forEach(rowEl => {
        rowEl.addEventListener("click", () => {
          const id = rowEl.dataset.recordId;
          const record = records.find(r => r.id === id);
          if (!record) return;
          this.removeDayDetailOverlay();
          EditRecordView.show(record);
        });
      });
    }
  },

  removeDayDetailOverlay() {
    const existing = document.getElementById("dayDetailOverlay");
    if (existing) existing.remove();
  },

  renderDayDetailRow(r) {
    const def = [...EXERCISES.cardio, ...EXERCISES.strength].find(e => e.id === r.exerciseId);
    const iconName = r.category === "cardio" ? "pulse" : "dumbbell";
    const sub = r.category === "cardio"
      ? `${r.duration ?? "-"}分`
      : `${r.weight ?? "-"}kg × ${r.repetitions ?? "-"}回 × ${r.sets ?? "-"}set`;

    if (this.detailSelectMode) {
      const isSelected = this.detailSelectedIds.has(r.id);
      return `
        <button class="ledger-entry clickable" data-select-id="${r.id}">
          <div class="le-left">
            <div class="select-checkbox ${isSelected ? "checked" : ""}">${isSelected ? "✓" : ""}</div>
            <div>
              <div class="le-name">${def ? def.name : r.exerciseId}</div>
              <div class="le-sub">${sub}</div>
            </div>
          </div>
          <div class="le-amt">${Fmt.signedBpt(r.calculatedBPT)}</div>
        </button>
      `;
    }

    return `
      <button class="ledger-entry clickable" data-record-id="${r.id}">
        <div class="le-left">
          <div class="le-icon">${icon(iconName, { size: 16 })}</div>
          <div>
            <div class="le-name">${def ? def.name : r.exerciseId}</div>
            <div class="le-sub">${sub}</div>
          </div>
        </div>
        <div class="le-amt">${Fmt.signedBpt(r.calculatedBPT)}</div>
        <div class="le-chevron">›</div>
      </button>
    `;
  },

  showBulkDateChange(selectedIds, onDone) {
    const count = selectedIds.size;
    if (count === 0) { showToast("記録を選択してください"); return; }

    const root = document.getElementById("overlayRoot");
    const overlay = el(`
      <div class="overlay">
        <div class="result-sheet" style="text-align:left;">
          <div class="edit-sheet-title">日付をまとめて変更</div>
          <div class="edit-sheet-sub">選択した${count}件の記録の日付を変更します</div>
          <div class="field-group">
            <label>新しい日付</label>
            <input type="date" id="bulkDateInput" value="${todayStr()}"
              max="${todayStr()}" min="${AppState.season.startDate.slice(0, 10)}" />
          </div>
          <div class="edit-actions">
            <button class="btn-primary" id="bulkDateApplyBtn">変更する</button>
            <button class="btn-secondary" id="bulkDateCancelBtn">キャンセル</button>
          </div>
        </div>
      </div>
    `);
    root.appendChild(overlay);

    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
    document.getElementById("bulkDateCancelBtn").addEventListener("click", () => overlay.remove());
    document.getElementById("bulkDateApplyBtn").addEventListener("click", () => {
      const newDate = document.getElementById("bulkDateInput").value;
      if (!newDate) { showToast("日付を選んでください"); return; }

      let successCount = 0;
      selectedIds.forEach(id => {
        const result = BptCalculator.changeWorkoutDate(id, newDate);
        if (result) successCount += 1;
      });

      AppState.season = Storage.getSeason(AppState.season.id);
      AppState.recomputeHabitScore();

      overlay.remove();
      showToast(`${successCount}件の記録の日付を変更しました`);
      if (onDone) onDone();
    });
  },

  afterRender() {
    document.getElementById("periodPill").addEventListener("click", () => {
      Picker.show("期間を選択", this.periods, this.state.period, (key) => {
        this.state.period = key;
        Router.refresh();
      });
    });

    document.getElementById("prevMonthBtn").addEventListener("click", () => {
      this.state.yearMonth = this.shiftMonth(this.state.yearMonth, -1);
      Router.refresh();
    });
    const nextBtn = document.getElementById("nextMonthBtn");
    if (!nextBtn.disabled) {
      nextBtn.addEventListener("click", () => {
        this.state.yearMonth = this.shiftMonth(this.state.yearMonth, 1);
        Router.refresh();
      });
    }
    document.querySelectorAll(".cal-cell[data-date]").forEach(cell => {
      cell.addEventListener("click", () => this.showDayDetail(cell.dataset.date));
    });

    // カレンダーのスワイプで月を切り替える（左スワイプ＝翌月、右スワイプ＝前月）
    const swipeArea = document.getElementById("calSwipeArea");
    if (swipeArea) {
      let touchStartX = null;
      let touchStartY = null;
      swipeArea.addEventListener("touchstart", (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }, { passive: true });
      swipeArea.addEventListener("touchend", (e) => {
        if (touchStartX === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        touchStartX = null;
        touchStartY = null;
        // 縦方向のスクロールと誤認しないよう、横方向の移動が縦方向より
        // 明確に大きい場合のみスワイプとして扱う
        const SWIPE_THRESHOLD = 40;
        if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        if (dx < 0) {
          // 左スワイプ → 翌月（今月より先には進めない）
          if (this.state.yearMonth < this.currentMonthStr()) {
            this.state.yearMonth = this.shiftMonth(this.state.yearMonth, 1);
            Router.refresh();
          }
        } else {
          // 右スワイプ → 前月
          this.state.yearMonth = this.shiftMonth(this.state.yearMonth, -1);
          Router.refresh();
        }
      }, { passive: true });
    }
  }
};
