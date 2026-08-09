/**
 * ledger.js — 履歴画面（カレンダー表示）
 * 月間カレンダーの各日付に、その日の増加分（青）・減少分（赤）を表示する。
 * 日付をタップすると、その日の運動記録の詳細が開き、「選択」で複数選択して
 * まとめて日付を変更できる。
 */
const LedgerView = {
  state: { yearMonth: null },
  detailDate: null,
  detailSelectMode: false,
  detailSelectedIds: new Set(),

  currentMonthStr() {
    return todayStr().slice(0, 7);
  },

  render() {
    if (!this.state.yearMonth) this.state.yearMonth = this.currentMonthStr();
    const agg = this.aggregateMonth(this.state.yearMonth);
    const { label, range } = this.monthLabelAndRange(this.state.yearMonth);
    const dailyTotals = this.computeDailyTotals(this.state.yearMonth);

    return el(`
      <div>
        <h2 style="font-family:var(--font-display); font-size:19px; margin:8px 0 16px;">履歴</h2>

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
        </div>

        <div class="card">
          ${this.renderCalendarGrid(this.state.yearMonth, dailyTotals, this.computeRecordDates(this.state.yearMonth))}
          <div class="cal-legend">
            <span><span class="cal-legend-dot gain"></span>増加分</span>
            <span><span class="cal-legend-dot decay"></span>減少分</span>
            <span><span class="cal-legend-stamp">達成</span>運動した日</span>
          </div>
        </div>
      </div>
    `);
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

  computeRecordDates(yearMonth) {
    const seasonIds = SeasonManager.getAllSeasons(AppState.user.id).map(s => s.id);
    const records = Storage.getWorkoutRecords()
      .filter(r => seasonIds.includes(r.seasonId) && r.date.slice(0, 7) === yearMonth);
    return new Set(records.map(r => r.date.slice(0, 10)));
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
  }
};
