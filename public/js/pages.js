/* 案内ページ用の小さな補助（JavaScriptがなくても本文は読めます） */
(function () {
  "use strict";
  // 「← Palettaに戻る」：アプリから来た場合は、ブラウザの「戻る」と同じ動きにして直前の画面を保つ
  var back = document.querySelector("[data-back-to-app]");
  if (back) {
    back.addEventListener("click", function (e) {
      try {
        var ref = document.referrer ? new URL(document.referrer) : null;
        var fromApp = ref && ref.origin === location.origin && /\/(index\.html)?$/.test(ref.pathname);
        if (fromApp && history.length > 1) { e.preventDefault(); history.back(); }
      } catch (err) { /* 通常のリンクとして移動 */ }
    });
  }
  // お問い合わせ：オフラインのときは案内を表示する
  document.querySelectorAll("[data-contact]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      if (navigator.onLine === false) {
        e.preventDefault();
        var msg = document.getElementById("offline-msg");
        if (msg) { msg.hidden = false; msg.focus(); }
      }
    });
  });
  // オフラインでも開けるように Service Worker を登録（アプリと共通）
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }
})();
