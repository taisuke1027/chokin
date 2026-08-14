/**
 * format.js — 表示用フォーマッタ
 */
const Fmt = {
  bpt(n) {
    const rounded = Math.round(n);
    return rounded.toLocaleString("ja-JP");
  },
  /** 軸ラベルなど、限られたスペース用に「万」単位で短縮表示する */
  compactBpt(n) {
    const rounded = Math.round(n);
    if (Math.abs(rounded) >= 10000) {
      return (rounded / 10000).toFixed(rounded % 10000 === 0 ? 0 : 1) + "万";
    }
    return rounded.toLocaleString("ja-JP");
  },
  signedBpt(n) {
    const rounded = Math.round(n);
    const sign = rounded > 0 ? "+" : rounded < 0 ? "" : "±";
    return sign + rounded.toLocaleString("ja-JP");
  },
  pct(n, digits = 1) {
    return (n * 100).toFixed(digits) + "%";
  },
  dateJp(isoOrDateStr) {
    const d = new Date(isoOrDateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  },
  dateFullJp(isoOrDateStr) {
    const d = new Date(isoOrDateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  },
  daysBetween(a, b) {
    const da = new Date(a); const db = new Date(b || new Date());
    return Math.round((db - da) / (24 * 60 * 60 * 1000));
  }
};

function showToast(message, ms = 2200) {
  const root = document.getElementById("toastRoot");
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => el.remove(), ms);
}

function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

// ---- オーバーレイ表示中は背景画面がスクロールされないようにする ----
let _overlayLockCount = 0;
function lockBodyScroll() {
  _overlayLockCount++;
  if (_overlayLockCount === 1) document.body.style.overflow = "hidden";
}
function unlockBodyScroll() {
  _overlayLockCount = Math.max(0, _overlayLockCount - 1);
  if (_overlayLockCount === 0) document.body.style.overflow = "";
}
/** オーバーレイを閉じる共通処理（背景スクロールのロック解除とセットで行う） */
function closeOverlay(overlayEl) {
  overlayEl.remove();
  unlockBodyScroll();
}

/**
 * ページ全体を右にスワイプすると、指定した画面へ「戻る」ように振る舞う。
 * ドラッグ中は指の動きにシートがそのまま追従し、離した時に十分右へ
 * スワイプしていればそのまま滑り落ちるように戻り、途中で離した場合は
 * 元の位置にスナップバックする（縦スクロールとの誤爆を避けるため、
 * 横方向の動きが縦方向より明確に大きい場合のみスワイプとして扱う）。
 * @param {HTMLElement} viewEl 現在表示中のビューのルート要素
 * @param {string} backRoute 戻り先のルート名
 */
function bindSwipeRightToGoBack(viewEl, backRoute) {
  let touchStartX = null;
  let touchStartY = null;
  let dragging = false;
  let horizontal = null;

  viewEl.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    dragging = true;
    horizontal = null;
    viewEl.style.transition = "none";
  }, { passive: true });

  viewEl.addEventListener("touchmove", (e) => {
    if (!dragging || touchStartX === null) return;
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;

    if (horizontal === null) {
      // 最初の動きで、横スワイプか縦スクロールかを判定する
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      horizontal = Math.abs(dx) > Math.abs(dy) * 1.2;
    }
    if (!horizontal) return; // 縦スクロールはそのまま通す

    if (dx <= 0) {
      viewEl.style.transform = "translateX(0px)";
      return;
    }
    const damped = dx * 0.9;
    viewEl.style.transform = `translateX(${damped}px)`;
    e.preventDefault();
  }, { passive: false });

  viewEl.addEventListener("touchend", (e) => {
    if (!dragging || touchStartX === null) { touchStartX = null; dragging = false; return; }
    const dx = e.changedTouches[0].clientX - touchStartX;
    dragging = false;
    touchStartX = null;

    if (!horizontal) return;
    viewEl.style.transition = "transform 0.28s cubic-bezier(.22, .61, .36, 1)";
    if (dx > 90) {
      // しっかり右スワイプ → そのまま滑り落ちるように戻る
      const viewWidth = viewEl.getBoundingClientRect().width;
      viewEl.style.transform = `translateX(${viewWidth}px)`;
      setTimeout(() => Router.go(backRoute), 240);
    } else {
      // 閾値未満 → 元の位置にヌルッとスナップバックする
      viewEl.style.transform = "translateX(0px)";
    }
  }, { passive: true });
}

/**
 * オーバーレイのシートが一番上までスクロールされている状態で下にスワイプすると、
 * 指の動きに追従してシートが滑らかに動き、離した時に閉じる/元に戻るを判定する。
 * （スクロール中の誤爆を防ぐため、タッチ開始時にscrollTopが最上部にあるかどうかで判定する）
 * @param {HTMLElement} sheetEl 実際に表示されているシート要素（.result-sheet等）
 * @param {HTMLElement} overlayEl 削除対象のオーバーレイ全体（背景含む）
 */
function bindSwipeDownToClose(sheetEl, overlayEl) {
  let touchStartY = null;
  let dragging = false;
  let startedAtTop = false;

  sheetEl.addEventListener("touchstart", (e) => {
    startedAtTop = sheetEl.scrollTop <= 0;
    touchStartY = e.touches[0].clientY;
    dragging = startedAtTop;
    sheetEl.style.transition = "none";
  }, { passive: true });

  sheetEl.addEventListener("touchmove", (e) => {
    if (!dragging || touchStartY === null) return;
    const dy = e.touches[0].clientY - touchStartY;
    if (dy <= 0) {
      sheetEl.style.transform = "translateY(0px)";
      return;
    }
    // 下方向のドラッグ中は指にそのまま追従させる（軽い抵抗を加えて自然な重さを出す）
    const damped = dy * 0.9;
    sheetEl.style.transform = `translateY(${damped}px)`;
    e.preventDefault();
  }, { passive: false });

  sheetEl.addEventListener("touchend", (e) => {
    if (!dragging || touchStartY === null) { touchStartY = null; dragging = false; return; }
    const dy = e.changedTouches[0].clientY - touchStartY;
    dragging = false;
    touchStartY = null;

    sheetEl.style.transition = "transform 0.28s cubic-bezier(.22, .61, .36, 1)";
    if (dy > 90) {
      // しっかり下スワイプ → そのまま滑り落ちるように閉じる
      const sheetHeight = sheetEl.getBoundingClientRect().height;
      sheetEl.style.transform = `translateY(${sheetHeight}px)`;
      setTimeout(() => closeOverlay(overlayEl), 260);
    } else {
      // 閾値未満 → 元の位置にヌルッとスナップバックする
      sheetEl.style.transform = "translateY(0px)";
    }
  }, { passive: true });
}

/**
 * 資産称号（ウォーキング換算レベル）の判定。
 * CONFIG.ASSET_RANKS は下限BPTの昇順に並んでいる前提。
 * @returns {{current, next, progress, remaining}} progressは次の称号までの進捗(0〜1)
 */
function getAssetRankInfo(total) {
  const ranks = CONFIG.ASSET_RANKS;
  let current = ranks[0];
  let next = null;
  for (let i = 0; i < ranks.length; i++) {
    if (total >= ranks[i].min) {
      current = ranks[i];
      next = ranks[i + 1] || null;
    }
  }
  const progress = next ? Math.min(1, Math.max(0, (total - current.min) / (next.min - current.min))) : 1;
  const remaining = next ? Math.max(0, next.min - total) : 0;
  return { current, next, progress, remaining };
}

function formatWalkKm(km) {
  return `約${Math.round(km).toLocaleString("ja-JP")}km`;
}
