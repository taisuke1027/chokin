/**
 * service-worker.js
 * ------------------------------------------------------------------
 * オフラインでも基本機能（運動記録・資産確認）が使えるように、
 * アプリシェルとローカルアセットをキャッシュする（33章 ⑤）。
 * データそのものはlocalStorageに保存されるため、通信状況に
 * 左右されない。
 * ------------------------------------------------------------------
 */

const CACHE_VERSION = "chikutate-v1";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./style.css",
  "./config.js",
  "./exercises.js",
  "./tips.js",
  "./praises.js",
  "./mascot.js",
  "./models.js",
  "./storage.js",
  "./cardioCalculator.js",
  "./strengthCalculator.js",
  "./enduranceCalculator.js",
  "./decayCalculator.js",
  "./habitCalculator.js",
  "./bptCalculator.js",
  "./seasonManager.js",
  "./format.js",
  "./icons.js",
  "./chart.js",
  "./picker.js",
  "./confirm.js",
  "./home.js",
  "./bptInfo.js",
  "./pressureInfo.js",
  "./habitInfo.js",
  "./record.js",
  "./exercisePicker.js",
  "./template.js",
  "./result.js",
  "./edit.js",
  "./asset.js",
  "./ledger.js",
  "./seasons.js",
  "./science.js",
  "./more.js",
  "./router.js",
  "./app.js",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png",
  "./rank-bronze.png",
  "./rank-silver.png",
  "./rank-gold.png",
  "./rank-platinum.png",
  "./rank-legend.png",
  "./mascot-normal.png",
  "./mascot-joy.png",
  "./mascot-motivated.png",
  "./mascot-tehepero.png",
  "./mascot-body-jump.png",
  "./mascot-body-guts.png",
  "./mascot-run-01.png",
  "./mascot-run-02.png",
  "./mascot-run-03.png",
  "./mascot-run-04.png",
  "./mascot-run-05.png",
  "./mascot-run-06.png",
  "./mascot-run-07.png",
  "./mascot-run-08.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Google Fonts等の外部リソースはネットワーク優先＋キャッシュフォールバック
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (isSameOrigin) {
    // アプリシェル: キャッシュ優先（オフライン確実性重視）
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, resClone));
          return res;
        }).catch(() => cached);
      })
    );
  } else {
    // 外部リソース: ネットワーク優先、失敗時はキャッシュ
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, resClone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
