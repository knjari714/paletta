/* オフラインでも開けるようにするための仕組み（Service Worker）
   ネットにつながるときは常に最新のファイルを取りに行き、
   つながらないときだけ保存しておいたファイルを使います。
   → 内容を更新すると、次に開いたときに反映されます。
   ※ 公開のたびに CACHE の名前を変えると、古いキャッシュが確実に削除されます。
   ※ 外部サービス（Googleフォーム・YouTube）はキャッシュしません。 */
const CACHE = "paletta-v0.5.2";
const SHELL = [
  "./",
  "index.html",
  "howto.html",
  "terms.html",
  "privacy.html",
  "css/style.css",
  "css/pages.css",
  "js/app.js",
  "js/pages.js",
  "data/config.js",
  "data/videos.js",
  "data/cards.js",
  "data/navi.js",
  "data/reflect.js",
  "manifest.webmanifest",
  "images/paletta-mark.png",
  "images/paletta-wordmark.png",
  "images/paletta-wordmark-light.png",
  "icons/favicon.ico",
  "icons/favicon-32.png",
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-any-192.png",
  "icons/icon-any-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  // 以前のバージョン（manabikata-v0.x など）のキャッシュを削除する
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })
        .then(r => r || (e.request.mode === "navigate" ? caches.match("index.html") : Response.error())))
  );
});
