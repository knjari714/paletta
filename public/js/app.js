/* =========================================================
   Paletta（パレッタ） v0.4.0 β — アプリ本体
   ※ 保存キー（manabikata-*）は、過去の記録を引き継ぐため旧名のまま使っています。変更しないでください。
   内容（問い・カード・動画）は data/ フォルダのファイルにあります。
   記録は、使っている人の端末のブラウザ内（localStorage）にだけ保存されます。
   ========================================================= */
(function () {
  "use strict";

  const CFG = window.APP_CONFIG;
  const NAVI = window.NAVI;
  const CARDS = window.CARDS;
  const VIDEOS = window.VIDEOS;
  const REFLECT = window.REFLECT;

  const cardById = id => CARDS.find(c => c.id === id);
  const videoById = id => VIDEOS.find(v => v.id === id);
  const concernById = id => NAVI.concerns.find(c => c.id === id);

  /* ---------------------------------------------------------
     保存（ブラウザ内）
     --------------------------------------------------------- */
  const STORE_KEY = "manabikata-note.v1";
  const emptyStore = () => ({ version: 1, plans: [], activePlanId: null });

  let memoryOnly = false;
  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return emptyStore();
      const d = JSON.parse(raw);
      if (!d || !Array.isArray(d.plans)) return emptyStore();
      return d;
    } catch (e) {
      memoryOnly = true;
      return emptyStore();
    }
  }
  let store = load();
  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(store));
    } catch (e) {
      memoryOnly = true;
    }
  }
  function requestPersist() {
    try {
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
    } catch (e) { /* 対応していない環境では何もしない */ }
  }

  const activePlan = () => store.plans.find(p => p.id === store.activePlanId && p.status === "active") || null;
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  /* ---------------------------------------------------------
     セルフナビの途中経過（タブを閉じるまで保持）
     --------------------------------------------------------- */
  const NAVI_KEY = "manabikata-navi";
  function loadNavi() {
    try { return JSON.parse(sessionStorage.getItem(NAVI_KEY)) || null; } catch (e) { return null; }
  }
  let navi = loadNavi();
  function saveNavi() {
    try { sessionStorage.setItem(NAVI_KEY, JSON.stringify(navi)); } catch (e) { /* noop */ }
  }
  function resetNavi() { navi = null; saveNavi(); }

  /* 振り返り入力の途中経過 */
  let draft = null;

  /* ---------------------------------------------------------
     小道具
     --------------------------------------------------------- */
  const $view = document.getElementById("view");
  const $top = document.getElementById("topbar");
  const $tabbar = document.getElementById("tabbar");

  const esc = s => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  /* ---------------------------------------------------------
     アイコン（角の丸い線画で統一。外部サービスに依存しない）
     --------------------------------------------------------- */
  const ICONS = {
    home:    '<path d="M4 10.5 12 4l8 6.5"/><path d="M6 9.5V19a1 1 0 0 0 1 1h3.5v-5h3v5H17a1 1 0 0 0 1-1V9.5"/>',
    cards:   '<rect x="4" y="7" width="12" height="13" rx="2"/><path d="M8 4h10a2 2 0 0 1 2 2v11"/>',
    note:    '<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M9 3.5v17"/><path d="M12 8.5h4M12 12h4"/>',
    play:    '<circle cx="12" cy="12" r="8.5"/><path d="M10.3 8.9v6.2l4.9-3.1z"/>',
    compass: '<circle cx="12" cy="12" r="8.5"/><path d="m15.3 8.7-2.1 4.5-4.5 2.1 2.1-4.5z"/>',
    brain:   '<path d="M9 5.2a2.4 2.4 0 0 0-2.4 2.4 2.6 2.6 0 0 0-1.9 4.1 2.6 2.6 0 0 0 1.5 4.2A2.7 2.7 0 0 0 9 18.8a2 2 0 0 0 3-1.7V7.2a2 2 0 0 0-3-2Z"/><path d="M15 5.2a2.4 2.4 0 0 1 2.4 2.4 2.6 2.6 0 0 1 1.9 4.1 2.6 2.6 0 0 1-1.5 4.2 2.7 2.7 0 0 1-2.8 2.9 2 2 0 0 1-3-1.7V7.2a2 2 0 0 1 3-2Z"/>',
    sigma:   '<path d="M17 7V5H7l5.5 7L7 19h10v-2"/>',
    people:  '<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0"/><circle cx="16.5" cy="9.5" r="2.4"/><path d="M16 14.1a4.6 4.6 0 0 1 4.5 5.4"/>',
    person:  '<circle cx="12" cy="8" r="3.2"/><path d="M5.5 19.5a6.5 6.5 0 0 1 13 0"/>',
    sprout:  '<path d="M12 20v-7.5"/><path d="M12 12.5C12 9 9.7 6.5 5.5 6.5c0 3.5 2.3 6 6.5 6Z"/><path d="M12 14.5c0-3 2-5 5.5-5 0 3-2 5-5.5 5Z"/>',
    rise:    '<path d="m4 16.5 5-5 3.5 3.5L20 7.5"/><path d="M14.5 7.5H20V13"/>',
    cycle:   '<path d="M19.5 12a7.5 7.5 0 0 1-12.9 5.2"/><path d="M4.5 12a7.5 7.5 0 0 1 12.9-5.2"/><path d="M17.6 3.6v3.6H14"/><path d="M6.4 20.4v-3.6H10"/>',
    back:    '<path d="m14.5 6-6 6 6 6"/>',
    check:   '<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.2 2.4 2.4 4.7-4.9"/>',
    arrow:   '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    chevron: '<path d="m9.5 6 6 6-6 6"/>'
  };
  const ic = (name, cls) => `<svg class="ic${cls ? " " + cls : ""}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name] || ""}</svg>`;

  /* ---------------------------------------------------------
     カードの種類（色・アイコン・表示名）
     --------------------------------------------------------- */
  const CAT_ICON = { study: "brain", math: "sigma", others: "people" };
  const catKey = card => (card && CFG.categories && CFG.categories[card.category]) ? card.category : "";
  const catClass = card => catKey(card) ? `cat-${catKey(card)}` : "cat-none";
  function catBadge(card) {
    const k = catKey(card);
    if (!k) return "";
    return `<span class="cat-badge">${ic(CAT_ICON[k])}<span>${esc(CFG.categories[k].label)}</span></span>`;
  }
  function modeTag(card) {
    const m = card && card.mode;
    if (!m || m === "solo" || !CFG.modes || !CFG.modes[m]) return "";
    return `<span class="tag mode">${ic(m === "withOthers" ? "people" : "person")}${esc(CFG.modes[m])}</span>`;
  }

  function fmtDate(iso) {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}（${"日月火水木金土"[d.getDay()]}）`;
  }
  function daysSince(iso) {
    const ms = Date.now() - new Date(iso).getTime();
    return Math.floor(ms / 86400000);
  }
  function sinceText(iso) {
    const n = daysSince(iso);
    if (n <= 0) return "今日";
    if (n === 1) return "昨日";
    return `${n}日前`;
  }

  function burdenHtml(n) {
    const label = ["", "小", "中", "大"][n] || "";
    let dots = "";
    for (let i = 1; i <= 3; i++) dots += i <= n ? "●" : '<span class="off">●</span>';
    return `<span class="tag">負担 <span class="burden" aria-hidden="true">${dots}</span> ${label}</span>`;
  }
  const typeLabel = t => (t === "start" ? "Small Start" : "Small Change");

  let toastTimer;
  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
  }

  /* 上部バー：「戻る」は一段階前へ、「ホーム」はホーム画面へ */
  const backBtnHtml = (act, to) =>
    `<button class="back" data-act="${act}"${to ? ` data-to="${esc(to)}"` : ""} aria-label="一つ前に戻る">${ic("back")}<span>戻る</span></button>`;
  function setTop({ back = null, title = "", home = true } = {}) {
    $top.innerHTML =
      (back ? backBtnHtml("back", back) : "") +
      `<span class="title">${esc(title)}</span><span class="spacer"></span>` +
      (home ? `<button class="home-btn" data-act="go-home" aria-label="ホームへ戻る">${ic("home")}<span>ホーム</span></button>` : "");
  }

  /* 記録前の入力があるか（ホームへ移動するときに確認する） */
  function hasUnsaved() {
    const h = location.hash;
    if (h.startsWith("#/reflect") && draft && (draft.done || draft.next || (draft.note || "").trim() || (draft.adjustNote || "").trim())) return true;
    if (h.startsWith("#/plan/") && (planDraft.subject || planDraft.material)) return true;
    return false;
  }
  function confirmLeave() {
    if (!hasUnsaved()) return true;
    if (!confirm("入力した内容は、まだ記録されていません。\n移動すると、入力した内容は消えます。よろしいですか？")) return false;
    draft = null;
    planDraft = { subject: "", material: "" };
    return true;
  }
  function setTab(name) {
    $tabbar.classList.toggle("hidden", name === null);
    $tabbar.querySelectorAll("a").forEach(a => a.classList.toggle("on", a.dataset.tab === name));
  }
  function render(html) {
    $view.innerHTML = `<div class="fade-in">${html}</div>`;
    window.scrollTo(0, 0);
  }
  const go = hash => { location.hash = hash; };

  /* ---------------------------------------------------------
     ルーティング
     --------------------------------------------------------- */
  function route() {
    const parts = (location.hash || "#/home").replace(/^#\/?/, "").split("/");
    const [name, arg] = parts;
    window.scrollTo(0, 0);
    routeView(name, arg);
    applyRestore();
  }
  function routeView(name, arg) {
    switch (name) {
      case "navi": return viewNavi();
      case "card": return viewCard(decodeURIComponent(arg || ""));
      case "plan": return viewPlanSetup(decodeURIComponent(arg || ""));
      case "go": return viewGoStudy();
      case "notyet": return viewNotYet();
      case "reflect": return viewReflect();
      case "reflected": return viewReflected();
      case "library": return viewLibrary();
      case "note": return viewNote();
      case "videos": return viewVideos();
      case "data": return viewData();
      default: return viewHome();
    }
  }
  window.addEventListener("hashchange", route);

  /* ---------------------------------------------------------
     カードを開いた場所（候補画面・ライブラリ・ノート）を覚えておき、
     「ほかの方法も見てみる」で、その画面の状態のまま戻れるようにする
     --------------------------------------------------------- */
  const ORIGIN_KEY = "manabikata-card-origin";
  let cardOrigin = null;
  try { cardOrigin = JSON.parse(sessionStorage.getItem(ORIGIN_KEY)) || null; } catch (e) { cardOrigin = null; }
  let pendingRestore = null;

  function rememberCardOrigin() {
    const h = location.hash || "#/home";
    const from = h.startsWith("#/navi") ? "navi" : h.startsWith("#/library") ? "library" : h.startsWith("#/note") ? "note" : null;
    if (!from) return; // それ以外の画面から開いたときは、前の記録を使う
    cardOrigin = {
      from, hash: h, y: window.scrollY,
      openIds: from === "note" ? [...document.querySelectorAll("details.entry[open]")].map(d => d.dataset.id) : null
    };
    try { sessionStorage.setItem(ORIGIN_KEY, JSON.stringify(cardOrigin)); } catch (e) { /* noop */ }
  }
  document.addEventListener("click", e => {
    const a = e.target.closest('a[href^="#/card/"]');
    if (a) rememberCardOrigin();
  }, true);

  /* 戻り先：開いた場所 → なければ候補画面（答えが残っていれば）→ ライブラリ */
  function returnFromCard() {
    const naviReady = !!(navi && navi.resultId && navi.askSeen && navi.timeIdx != null);
    let o = cardOrigin;
    if (o && o.from === "navi" && !naviReady) o = null;
    if (!o) o = naviReady ? { from: "navi", hash: "#/navi", y: 0 } : { from: "library", hash: "#/library", y: 0 };
    if (o.from === "navi" && navi) { navi.resume = false; saveNavi(); }
    pendingRestore = o;
    go(o.hash);
  }

  /* 戻った画面で、スクロール位置とノートの開閉状態を元に戻す */
  function applyRestore() {
    const r = pendingRestore;
    if (!r || r.hash !== (location.hash || "#/home")) return;
    pendingRestore = null;
    if (r.openIds) {
      document.querySelectorAll("details.entry").forEach(d => { d.open = r.openIds.includes(d.dataset.id); });
    }
    if (r.y) requestAnimationFrame(() => window.scrollTo(0, r.y));
  }

  /* ---------------------------------------------------------
     ホーム
     --------------------------------------------------------- */
  function viewHome() {
    setTop({ title: "", home: false });
    setTab("home");
    const plan = activePlan();
    let planHtml = "";
    if (plan) {
      const card = cardById(plan.cardId);
      const lastAt = plan.reflections.length ? plan.reflections[plan.reflections.length - 1].at : plan.startedAt;
      const where = [plan.subject, plan.material].filter(Boolean).join("・");
      planHtml = `
        <div class="panel active-plan ${catClass(card)}">
          <div class="label">前回選んだ方法</div>
          ${catBadge(card)}
          <h2>${esc(card ? card.title : plan.title)}</h2>
          <div class="meta">${esc(sinceText(lastAt))}に選びました${where ? `　／　${esc(where)}` : ""}${plan.adjustNote ? `<br>変えたこと：${esc(plan.adjustNote)}` : ""}</div>
          <div class="btn-stack">
            <button class="btn" data-act="to-reflect">${ic("cycle")}試したので振り返る</button>
            <button class="btn sub" data-act="to-notyet">まだ試していない</button>
            <button class="btn ghost" data-act="consult">別のことを相談する</button>
          </div>
        </div>`;
    }

    render(`
      <section class="hero">
        <h1 class="brand">
          <img class="brand-mark" src="images/paletta-mark.png" alt="" width="160" height="144">
          <picture>
            <source srcset="images/paletta-wordmark-light.png" media="(prefers-color-scheme: dark)">
            <img class="brand-word" src="images/paletta-wordmark.png" alt="${esc(CFG.appName)}" width="240" height="56">
          </picture>
        </h1>
        <p class="tagline">${esc(CFG.tagline)}</p>
        <p>${esc(CFG.subTagline)}</p>
        ${store.plans.length ? "" : `<a class="first-guide" href="${esc(CFG.pages.howto)}">${ic("compass")}<span>はじめての方へ｜${esc(CFG.appName)}の使い方</span>${ic("chevron", "go")}</a>`}
      </section>
      ${planHtml ? `<div class="section-label">いま試していること</div>${planHtml}` : ""}
      <div class="section-label">${plan ? "ほかにできること" : "はじめる"}</div>
      <div class="menu">
        <a href="#/navi" data-act="open-navi">
          <span class="mi">${ic("compass")}</span>
          <span><b>今の自分を見つめる</b><span class="d">いくつかの問いに答えて、困っていることを整理し、試す方法を選びます。</span></span>
          ${ic("chevron", "go")}
        </a>
        <a href="#/library">
          <span class="mi">${ic("cards")}</span>
          <span><b>Small Change ライブラリ</b><span class="d">学び方の工夫・数学の考え方・人の力を借りる方法の一覧です。</span></span>
          ${ic("chevron", "go")}
        </a>
        <a href="#/note">
          <span class="mi">${ic("note")}</span>
          <span><b>私の勉強法ノート</b><span class="d">試した方法と、振り返りの記録です。</span></span>
          ${ic("chevron", "go")}
        </a>
      </div>
      <p class="foot"><a href="#/data">記録の保存と引き継ぎ</a></p>
      ${siteFooterHtml()}
    `);
  }

  /* ホーム下部：案内ページ・お問い合わせ */
  function contactLinkHtml(label) {
    return `<a href="${esc(CFG.contactUrl)}" target="_blank" rel="noopener noreferrer" data-act="contact">${esc(label || "お問い合わせ")}<span class="sr-only">（Googleフォームが新しいタブで開きます）</span></a>`;
  }
  function siteFooterHtml() {
    return `
      <footer class="site-foot">
        <nav aria-label="${esc(CFG.appName)}について">
          <a href="${esc(CFG.pages.howto)}">使い方</a>
          <a href="${esc(CFG.pages.terms)}">利用規約</a>
          <a href="${esc(CFG.pages.privacy)}">プライバシーポリシー</a>
          ${contactLinkHtml()}
        </nav>
        <p class="contact-note">お問い合わせはGoogleフォーム（新しいタブ）で開きます。学習記録が送信されることはありません。</p>
        <p class="ver">${esc(CFG.versionLabel)}｜開発・運営：${esc(CFG.operator)}</p>
      </footer>`;
  }

  /* ---------------------------------------------------------
     勉強法セルフナビ
     navi = { concernId, path:[{qid, idx}], resultId, askSeen, timeIdx, picked }
       流れ：Q1 → Q2 → 自分への問い（askSeen） → 時間の問い（timeIdx） → 候補
       picked … 戻ったときに、前に選んでいた選択肢を示すための記録
     --------------------------------------------------------- */
  function viewNavi() {
    setTab(null);
    if (!navi || !navi.concernId) return viewConcern();
    if (navi.resume) return viewResume();
    if (navi.resultId && !navi.askSeen) return viewAsk();
    if (navi.resultId && navi.timeIdx == null) return viewTime();
    if (navi.resultId) return viewResult();
    return viewQuestion();
  }

  const newNavi = concernId => ({ concernId, path: [], resultId: null, askSeen: false, timeIdx: null, picked: {} });
  const naviBackBtn = () => $top.insertAdjacentHTML("afterbegin", backBtnHtml("navi-back"));
  const progressHtml = (pct, label) =>
    `${label ? `<div class="step-label">${esc(label)}</div>` : ""}<div class="progress" aria-hidden="true"><i style="width:${pct}%"></i></div>`;
  const naviHasProgress = () => !!(navi && navi.concernId && (navi.path.length || navi.resultId));

  /* 途中から再開するか、最初からやり直すか */
  function viewResume() {
    setTop({ back: "#/home", title: "今の自分を見つめる" });
    const answers = naviAnswers();
    const concern = concernById(navi.concernId);
    render(`
      <h2 class="q-title">前回の続きがあります</h2>
      <p class="q-hint">途中まで答えた内容が残っています。</p>
      <div class="panel">
        <ul class="answers">
          ${concern ? `<li><span class="q">気になっていること</span>${esc(concern.label)}</li>` : ""}
          ${answers.map(x => `<li><span class="q">${esc(x.q)}</span>${esc(x.a)}</li>`).join("")}
        </ul>
      </div>
      <div class="btn-stack">
        <button class="btn" data-act="resume-continue">続きから</button>
        <button class="btn sub" data-act="resume-restart">最初からやり直す</button>
      </div>
    `);
  }

  /* 結果の候補カード（"id" でも { id: "..." } でも書けるようにしておく） */
  const resultCards = res => (res.cards || [])
    .map(c => cardById(typeof c === "string" ? c : c && c.id))
    .filter(Boolean);

  /* 結果に至った選択肢の文（Q2の答え） */
  function lastAnswerLabel() {
    if (navi.savedAnswers) {
      const qs = navi.savedAnswers.filter(a => a.q !== NAVI.timeQuestion.text);
      return qs.length ? qs[qs.length - 1].a : "";
    }
    const last = navi.path[navi.path.length - 1];
    return last ? NAVI.questions[last.qid].options[last.idx].label : "";
  }

  function viewConcern() {
    setTop({ back: "#/home", title: "今の自分を見つめる" });
    const list = NAVI.concerns.map(c => `
      <button class="choice" data-act="pick-concern" data-id="${esc(c.id)}" ${c.available ? "" : "disabled"} style="${c.available ? "" : "opacity:.5;cursor:default"}">
        ${esc(c.label)}<small>${esc(c.note || "")}</small>
      </button>`).join("");
    render(`
      <h2 class="q-title">いま、数学の勉強で気になっていることは？</h2>
      <p class="q-hint">いちばん近いものを選んでください。</p>
      <div class="choices">${list}</div>
    `);
  }

  function currentQid() {
    const concern = concernById(navi.concernId);
    if (!navi.path.length) return concern.start;
    const last = navi.path[navi.path.length - 1];
    const opt = NAVI.questions[last.qid].options[last.idx];
    return opt.goto;
  }

  function viewQuestion() {
    const qid = currentQid();
    const q = NAVI.questions[qid];
    if (!q) { render(`<p class="empty">問い「${esc(qid)}」がデータにありません（navi.js を確認してください）。</p>`); return; }
    const stepNo = navi.path.length + 1;
    setTop({ title: "今の自分を見つめる" });
    naviBackBtn();
    const prevIdx = navi.picked ? navi.picked[qid] : undefined;
    const opts = q.options.map((o, i) =>
      `<button class="choice ${prevIdx === i ? "prev" : ""}" data-act="answer" data-qid="${esc(qid)}" data-idx="${i}">${esc(o.label)}${prevIdx === i ? `<small>前に選んだ答え</small>` : ""}</button>`).join("");
    render(`
      ${progressHtml(stepNo === 1 ? 20 : 45, `問い ${stepNo}`)}
      <h2 class="q-title" style="margin-top:20px">${esc(q.text)}</h2>
      ${q.hint ? `<p class="q-hint">${esc(q.hint)}</p>` : `<div style="height:12px"></div>`}
      <div class="choices">${opts}</div>
    `);
  }

  /* 自分への問い（読むだけ。回答は求めない） */
  function viewAsk() {
    const res = NAVI.results[navi.resultId];
    setTop({ title: "今の自分を見つめる" });
    naviBackBtn();
    if (!res) { render(`<p class="empty">結果「${esc(navi.resultId)}」がデータにありません（navi.js を確認してください）。</p>`); return; }
    render(`
      ${progressHtml(70, "自分への問い")}
      <p class="echo">${esc(res.echo || `「${lastAnswerLabel()}」を選びました。`)}</p>
      <div class="ask-box">
        <div class="ask-label">自分への問い</div>
        <p class="ask-text">${esc(res.ask || "")}</p>
      </div>
      ${res.encourage ? `<p class="encourage">${esc(res.encourage)}</p>` : ""}
      <p class="notice" style="margin-top:18px">答えを書く必要はありません。少し考えてみたら、次へ進みましょう。</p>
      <div class="btn-stack">
        <button class="btn" data-act="ask-next">次へ</button>
      </div>
    `);
  }

  function viewTime() {
    const tq = NAVI.timeQuestion;
    setTop({ title: "今の自分を見つめる" });
    naviBackBtn();
    const prevIdx = navi.picked ? navi.picked.__time : undefined;
    const opts = tq.options.map((o, i) =>
      `<button class="choice ${prevIdx === i ? "prev" : ""}" data-act="answer-time" data-idx="${i}">${esc(o.label)}${prevIdx === i ? `<small>前に選んだ答え</small>` : ""}</button>`).join("");
    render(`
      ${progressHtml(90, "最後の問い")}
      <h2 class="q-title" style="margin-top:20px">${esc(tq.text)}</h2>
      ${tq.hint ? `<p class="q-hint">${esc(tq.hint)}</p>` : ""}
      <div class="choices">${opts}</div>
    `);
  }

  function naviAnswers() {
    if (navi.savedAnswers) return navi.savedAnswers;
    const list = navi.path.map(p => {
      const q = NAVI.questions[p.qid];
      return { q: q.text, a: q.options[p.idx].label };
    });
    if (navi.timeIdx != null) {
      list.push({ q: NAVI.timeQuestion.text, a: NAVI.timeQuestion.options[navi.timeIdx].label });
    }
    return list;
  }

  function cardItemHtml(card, level, from) {
    const fit = level != null && card.burden <= level;
    return `
      <a class="card-item ${catClass(card)}" href="#/card/${encodeURIComponent(card.id)}" data-from="${esc(from || "")}">
        ${catBadge(card)}
        <h3>${esc(card.title)}</h3>
        <p>${esc(card.catch)}</p>
        <div class="card-tags">
          ${burdenHtml(card.burden)}
          ${modeTag(card)}
          ${fit ? `<span class="tag fit">比較的取り入れやすい</span>` : ""}
        </div>
      </a>`;
  }

  function viewResult() {
    const res = NAVI.results[navi.resultId];
    setTop({ title: "今の自分を見つめる", step: "" });
    naviBackBtn();
    if (!res) { render(`<p class="empty">結果「${esc(navi.resultId)}」がデータにありません（navi.js を確認してください）。</p>`); return; }
    const level = NAVI.timeQuestion.options[navi.timeIdx].level;
    const answers = naviAnswers().map(x => `<li><span class="q">${esc(x.q)}</span>${esc(x.a)}</li>`).join("");
    const cards = resultCards(res);
    const others = (res.others || []).map(cardById).filter(Boolean);
    const othersHtml = others.length
      ? `<button class="btn sub others-toggle" data-act="toggle-others" aria-expanded="${navi.showOthers ? "true" : "false"}">
           ${ic("people")}<span>誰かと取り組む方法も見る（${others.length}）</span>
         </button>
         <div class="others-list" ${navi.showOthers ? "" : "hidden"}>
           <p class="notice" style="margin:12px 0 10px">友達や先生と取り組める状況なら、こちらも選べます。難しいときは、上の方法だけで大丈夫です。</p>
           ${others.map(c => cardItemHtml(c, level, "navi")).join("")}
         </div>`
      : `<p class="notice others-note">${ic("people")} 誰かと取り組む方法は、<a href="#/library" data-act="lib-open" data-v="others">ライブラリの「他者の力を借りる」</a>で見られます。</p>`;
    render(`
      <div class="panel link-panel" style="margin-top:4px">
        <div class="small muted">あなたの答え</div>
        <div class="link-answer">${esc(lastAnswerLabel())}</div>
        <div class="ask-mini">
          <span class="ask-label">自分への問い</span>
          <span>${esc(res.ask || "")}</span>
        </div>
        <details class="all-answers">
          <summary>答えた内容をすべて見る</summary>
          <ul class="answers">${answers}</ul>
        </details>
      </div>

      <div class="section-label">この答えから考えた、試せそうな方法</div>
      ${res.lead ? `<p style="margin:0 0 12px">${esc(res.lead)}</p>` : ""}
      ${cards.map(c => cardItemHtml(c, level, "navi")).join("")}
      <p class="notice" style="margin-top:14px">
        どれが合うかは、試してみないとわかりません。気になるものを開いて、自分で1つ選んでみてください。<br>
        「比較的取り入れやすい」の印は、答えた時間をもとにした目安です。負担が大きめの方法が、自分に合っていることもあります。
      </p>

      <div class="others-block">${othersHtml}</div>

      <div class="btn-stack">
        <a class="btn ghost" href="#/library">ほかの方法も見る（ライブラリ）</a>
        <button class="btn ghost" data-act="navi-restart">最初から答え直す</button>
      </div>
    `);
  }

  /* ---------------------------------------------------------
     カード詳細
     --------------------------------------------------------- */
  function videoHtml(v) {
    return `
      <a class="video" href="https://youtu.be/${esc(v.youtubeId)}" target="_blank" rel="noopener">
        <img src="https://i.ytimg.com/vi/${esc(v.youtubeId)}/mqdefault.jpg" alt="" loading="lazy">
        <div><span>勉強法動画 ${v.no}</span><b>${esc(v.title)}</b></div>
      </a>`;
  }

  function viewCard(id) {
    const card = cardById(id);
    setTab(null);
    setTop({ back: "back", title: typeLabel(card && card.type) });
    if (!card) { render(`<p class="empty">この方法は見つかりませんでした。</p>`); return; }
    const plan = activePlan();
    const same = plan && plan.cardId === card.id;
    const level = navi && navi.timeIdx != null ? NAVI.timeQuestion.options[navi.timeIdx].level : null;
    const vids = (card.videos || []).map(videoById).filter(Boolean);
    render(`
      <article class="detail ${catClass(card)}">
        <div class="detail-head">
          ${catBadge(card) || `<span class="cat-badge">${esc(typeLabel(card.type))}</span>`}
          <h1>${esc(card.title)}</h1>
          <p class="catch">${esc(card.catch)}</p>
          <div class="card-tags">
            ${burdenHtml(card.burden)}
            ${modeTag(card)}
            ${level != null && card.burden <= level ? `<span class="tag fit">比較的取り入れやすい</span>` : ""}
          </div>
          ${card.burdenNote ? `<p class="burden-note">${esc(card.burdenNote)}</p>` : ""}
        </div>
        <div class="panel">
          <dl>
            <dt style="margin-top:0">こんなときに</dt><dd>${esc(card.when)}</dd>
            <dt>何を変える？</dt><dd>${esc(card.what)}</dd>
            <dt>やり方</dt><dd><ol>${(card.steps || []).map(s => `<li>${esc(s)}</li>`).join("")}</ol>
              ${card.note ? `<p class="card-note">${esc(card.note)}</p>` : ""}</dd>
          </dl>
          ${card.easyStart ? `
            <div class="extra easy">
              <div class="extra-label">${ic("sprout")}ここまででもOK</div>
              <p>${esc(card.easyStart)}</p>
            </div>` : ""}
          ${card.extension ? `
            <div class="extra ext">
              <div class="extra-label">${ic("rise")}余裕があれば</div>
              <p>${esc(card.extension)}</p>
            </div>` : ""}
          <dl>
            <dt>確かめること</dt><dd>${esc(card.check)}</dd>
          </dl>
        </div>
        ${vids.length ? `<div class="section-label">関連する勉強法動画</div>${vids.map(videoHtml).join("")}` : ""}
        <div class="btn-stack">
          ${same
            ? `<p class="notice" style="margin:0;text-align:center">この方法は、いま試しているところです。</p>`
            : `<a class="btn" href="#/plan/${encodeURIComponent(card.id)}">これを試してみる</a>`}
          <button class="btn sub quiet" data-act="card-return">ほかの方法も見てみる</button>
          <p class="notice rechoose-note">自分に合いそうな方法を、選び直してもOK。</p>
        </div>
      </article>
    `);
  }

  /* ---------------------------------------------------------
     試す準備（科目・教材は任意）
     --------------------------------------------------------- */
  let planDraft = { subject: "", material: "" };

  function viewPlanSetup(cardId) {
    const card = cardById(cardId);
    setTab(null);
    setTop({ back: "back", title: "試す準備" });
    if (!card) { render(`<p class="empty">この方法は見つかりませんでした。</p>`); return; }
    const prev = activePlan();
    const chip = (kind, v) =>
      `<button class="chip ${planDraft[kind] === v ? "on" : ""}" data-act="chip" data-kind="${kind}" data-v="${esc(v)}">${esc(v)}</button>`;
    render(`
      <h2 class="q-title">「${esc(card.title)}」を試します</h2>
      <p class="q-hint">どちらも選ばなくてかまいません。</p>

      <div class="section-label" style="margin-top:8px">どの科目で？（任意）</div>
      <div class="chips">${CFG.subjects.map(s => chip("subject", s)).join("")}</div>

      <div class="section-label">何を使って？（任意）</div>
      <div class="chips">${CFG.materials.map(s => chip("material", s)).join("")}</div>

      ${prev ? `<p class="notice" style="margin-top:22px">いま試している「${esc((cardById(prev.cardId) || prev).title)}」は、ここで区切りになります。これまでの記録はノートに残ります。</p>` : ""}

      <div class="btn-stack">
        <button class="btn" data-act="start-plan" data-id="${esc(card.id)}">決めた</button>
      </div>
    `);
  }

  function startPlan(cardId) {
    const card = cardById(cardId);
    const prev = activePlan();
    if (prev) { prev.status = "closed"; prev.closedReason = "switched"; prev.closedAt = new Date().toISOString(); }
    const fromNavi = navi && navi.resultId && navi.timeIdx != null;
    const res = fromNavi ? NAVI.results[navi.resultId] : null;
    const plan = {
      id: uid(),
      cardId: card.id,
      title: card.title,
      type: card.type,
      concernId: fromNavi ? navi.concernId : (prev ? prev.concernId : null),
      resultId: fromNavi ? navi.resultId : null,
      answers: fromNavi ? naviAnswers() : [],
      ask: res && res.ask ? res.ask : "",
      subject: planDraft.subject || "",
      material: planDraft.material || "",
      startedAt: new Date().toISOString(),
      status: "active",
      reflections: []
    };
    store.plans.push(plan);
    store.activePlanId = plan.id;
    save();
    requestPersist();
    planDraft = { subject: "", material: "" };
    resetNavi();
    location.replace("#/go");
  }

  /* ---------------------------------------------------------
     実際の学習へ
     --------------------------------------------------------- */
  function viewGoStudy() {
    const plan = activePlan();
    setTab(null);
    setTop({ title: "" });
    if (!plan) return go("#/home");
    const card = cardById(plan.cardId) || plan;
    const where = plan.material ? `${plan.material}を開いて` : "いつもの教科書や問題集で";
    render(`
      <div class="big-msg">
        <div class="mark">${ic("arrow")}</div>
        <h1>では、実際の勉強へ。</h1>
        <p>${esc(where)}、試してみてください。</p>
      </div>
      <div class="panel ${catClass(card)}" style="margin-top:20px">
        ${catBadge(card)}
        <div style="font-weight:700;margin-top:4px">${esc(card.title)}</div>
        <ol style="margin:8px 0 0;padding-left:1.4em">${(card.steps || []).map(s => `<li>${esc(s)}</li>`).join("")}</ol>
        ${card.easyStart ? `<div class="extra easy" style="margin-top:12px"><div class="extra-label">${ic("sprout")}ここまででもOK</div><p>${esc(card.easyStart)}</p></div>` : ""}
      </div>
      <p class="notice" style="margin-top:14px">
        この画面のスクリーンショットを撮っておくと、勉強中に見返せます。<br>
        次にアプリを開いたとき、試してみてどうだったかをたずねます。答えなくても大丈夫です。
      </p>
      <div class="btn-stack">
        <a class="btn sub" href="#/home">ホームに戻る</a>
      </div>
    `);
  }

  /* ---------------------------------------------------------
     まだ試していない
     --------------------------------------------------------- */
  function viewNotYet() {
    const plan = activePlan();
    setTab(null);
    setTop({ back: "#/home", title: "" });
    if (!plan) return go("#/home");
    const card = cardById(plan.cardId) || plan;
    render(`
      <div class="big-msg">
        <h1>大丈夫です。</h1>
        <p>試すタイミングは、これからでもあります。</p>
      </div>
      <div class="panel" style="margin-top:20px">
        <div class="small muted">いま選んでいる方法</div>
        <b>${esc(card.title)}</b>
      </div>
      <div class="btn-stack">
        <a class="btn" href="#/home" data-act="keep">このまま続ける</a>
        <button class="btn sub" data-act="rechoose">試しにくいので、別の方法を選び直す</button>
        <button class="btn ghost" data-act="skip-record">今回は見送って、記録に残す</button>
      </div>
    `);
  }

  /* ---------------------------------------------------------
     振り返り（Small Reflection）
     draft = { done, reasons[], feasibility, effect, note, next, adjustNote }
     --------------------------------------------------------- */
  function startDraft(preset) {
    draft = Object.assign({ done: null, reasons: [], feasibility: null, effect: null, note: "", next: null, adjustNote: "" }, preset || {});
  }

  function choiceGroup(key, def, multi) {
    return def.options.map(o => {
      const v = typeof o === "string" ? o : o.value;
      const label = typeof o === "string" ? o : o.label;
      const on = multi ? draft[key].includes(v) : draft[key] === v;
      return `<button class="choice ${on ? "on" : ""}" data-act="r-pick" data-key="${key}" data-v="${esc(JSON.stringify(v))}" data-multi="${multi ? 1 : 0}">${esc(label)}</button>`;
    }).join("");
  }

  function viewReflect() {
    const plan = activePlan();
    setTab(null);
    setTop({ back: "#/home", title: "振り返り" });
    if (!plan) return go("#/home");
    if (!draft) startDraft();
    const card = cardById(plan.cardId) || plan;
    const tried = draft.done === "done" || draft.done === "partly";
    const notTried = draft.done === "notyet";

    let body = `
      <div class="panel" style="margin-top:4px">
        <div class="small muted">振り返る方法</div>
        <b>${esc(card.title)}</b>
        ${card.check ? `<div class="small muted" style="margin-top:6px">確かめること：${esc(card.check)}</div>` : ""}
        ${card.easyStart ? `<div class="small muted" style="margin-top:6px">${ic("sprout")} 「ここまででもOK」（${esc(card.easyStart.replace(/。$/, ""))}）だけ試した場合も、大切な実践です。どこまでできたかを気付きの欄に残しておくと、次に役立ちます。</div>` : ""}
      </div>

      <h2 class="q-title" style="margin-top:24px">${esc(REFLECT.done.text)}</h2>
      <div class="choices">${choiceGroup("done", REFLECT.done)}</div>
    `;

    if (notTried) {
      body += `
        <h2 class="q-title" style="margin-top:28px;font-size:17px">${esc(REFLECT.notDoneReasons.text)}</h2>
        <p class="q-hint">${esc(REFLECT.notDoneReasons.note)}（複数選択可・任意）</p>
        <div class="chips">${REFLECT.notDoneReasons.options.map(o =>
          `<button class="chip ${draft.reasons.includes(o) ? "on" : ""}" data-act="r-reason" data-v="${esc(o)}">${esc(o)}</button>`).join("")}</div>
      `;
    }

    if (tried) {
      body += `
        <h2 class="q-title" style="margin-top:28px">${esc(REFLECT.feasibility.text)}</h2>
        <p class="q-hint">${esc(REFLECT.feasibility.sub)}</p>
        <div class="choices">${choiceGroup("feasibility", REFLECT.feasibility)}</div>

        <h2 class="q-title" style="margin-top:28px">${esc(REFLECT.effect.text)}</h2>
        <p class="q-hint">${esc(REFLECT.effect.sub)}</p>
        <div class="choices">${choiceGroup("effect", REFLECT.effect)}</div>
      `;
    }

    if (draft.done) {
      body += `
        <h2 class="q-title" style="margin-top:28px;font-size:17px">${esc(REFLECT.note.text)}<span class="small muted">（任意）</span></h2>
        <textarea id="r-note" rows="3" placeholder="${esc(REFLECT.note.placeholder)}">${esc(draft.note)}</textarea>

        <h2 class="q-title" style="margin-top:28px">${esc(REFLECT.next.text)}</h2>
        <div class="choices">${choiceGroup("next", REFLECT.next)}</div>
        ${draft.next === "adjust" ? `
          <p class="q-hint" style="margin:14px 0 6px">どう変えますか？（任意）</p>
          <input type="text" id="r-adjust" value="${esc(draft.adjustNote)}" placeholder="例：全部ではなく、×の問題だけにする">` : ""}
      `;
    }

    const ready = draft.done && draft.next && (!tried || (draft.feasibility != null && draft.effect != null));
    body += `
      <div class="btn-stack" style="margin-top:24px">
        <button class="btn" data-act="r-save" ${ready ? "" : "disabled"}>記録する</button>
        ${ready ? "" : `<p class="notice" style="text-align:center;margin:0">選ぶところが残っています</p>`}
      </div>
    `;
    const y = window.scrollY;
    $view.innerHTML = `<div>${body}</div>`;
    window.scrollTo(0, y);
  }

  function saveReflection() {
    const plan = activePlan();
    if (!plan || !draft) return;
    const noteEl = document.getElementById("r-note");
    const adjEl = document.getElementById("r-adjust");
    if (noteEl) draft.note = noteEl.value.trim();
    if (adjEl) draft.adjustNote = adjEl.value.trim();
    const tried = draft.done !== "notyet";
    const r = {
      at: new Date().toISOString(),
      done: draft.done,
      reasons: draft.done === "notyet" ? draft.reasons.slice() : [],
      feasibility: tried ? draft.feasibility : null,
      effect: tried ? draft.effect : null,
      note: draft.note,
      next: draft.next,
      adjustNote: draft.next === "adjust" ? draft.adjustNote : ""
    };
    plan.reflections.push(r);
    const next = draft.next;
    if (next === "adjust" && r.adjustNote) plan.adjustNote = r.adjustNote;
    if (next === "other" || next === "pause") {
      plan.status = "closed";
      plan.closedReason = next;
      plan.closedAt = r.at;
      store.activePlanId = null;
    }
    save();
    requestPersist();
    draft = null;
    sessionStorage.setItem("manabikata-lastnext", next);
    sessionStorage.setItem("manabikata-lastplan", plan.id);
    location.replace("#/reflected");
  }

  function viewReflected() {
    setTab(null);
    setTop({ title: "" });
    const next = sessionStorage.getItem("manabikata-lastnext");
    const planId = sessionStorage.getItem("manabikata-lastplan");
    const plan = store.plans.find(p => p.id === planId);
    const msgs = {
      continue: ["記録しました。", "同じ方法を、もう少し続けてみましょう。"],
      adjust: ["記録しました。", "少し変えたやり方で、また試してみましょう。"],
      other: ["記録しました。", "次に試す方法を選びましょう。"],
      pause: ["記録しました。", "ここで一区切りです。またいつでもどうぞ。"]
    };
    const [h, p] = msgs[next] || msgs.pause;
    let actions = `<a class="btn sub" href="#/home">ホームに戻る</a>`;
    if (next === "other") {
      const res = plan && plan.resultId && NAVI.results[plan.resultId];
      actions = `
        ${res ? `<button class="btn" data-act="reopen-result" data-plan="${esc(plan.id)}">前回の候補から選ぶ</button>` : ""}
        <a class="btn ${res ? "sub" : ""}" href="#/navi" data-act="new-navi">問いに答え直す</a>
        <a class="btn ghost" href="#/library">ライブラリから選ぶ</a>`;
    }
    render(`
      <div class="big-msg">
        <div class="mark">${ic("check")}</div>
        <h1>${esc(h)}</h1>
        <p>${esc(p)}</p>
      </div>
      <div class="btn-stack" style="margin-top:28px">${actions}</div>
      <p class="foot"><a href="#/note">ノートで記録を見る</a></p>
    `);
  }

  /* ---------------------------------------------------------
     ライブラリ
     --------------------------------------------------------- */
  let libFilter = "all";
  function viewLibrary() {
    setTab("library");
    setTop({ title: "Small Change ライブラリ", home: false });
    const cats = Object.keys(CFG.categories || {});
    if (libFilter !== "all" && !cats.includes(libFilter) && libFilter !== "none") libFilter = "all";
    const groups = cats.map(k => ({ key: k, cards: CARDS.filter(c => catKey(c) === k) }));
    const uncategorized = CARDS.filter(c => !catKey(c));
    if (uncategorized.length) groups.push({ key: "none", cards: uncategorized });

    const chips = [`<button class="chip ${libFilter === "all" ? "on" : ""}" data-act="lib-filter" data-v="all">すべて <span class="n">${CARDS.length}</span></button>`]
      .concat(groups.map(g => {
        const label = g.key === "none" ? "その他" : CFG.categories[g.key].label;
        return `<button class="chip cat-chip cat-${g.key} ${libFilter === g.key ? "on" : ""}" data-act="lib-filter" data-v="${g.key}">${g.key !== "none" ? ic(CAT_ICON[g.key]) : ""}${esc(label)} <span class="n">${g.cards.length}</span></button>`;
      })).join("");

    const shown = groups.filter(g => g.cards.length && (libFilter === "all" || libFilter === g.key));
    const body = shown.map(g => {
      const c = CFG.categories[g.key];
      return `
        <section class="cat-group">
          <div class="cat-head cat-${g.key}">
            ${g.key !== "none" ? `<span class="cat-icon">${ic(CAT_ICON[g.key])}</span>` : ""}
            <div><b>${esc(c ? c.label : "その他")}</b>${c && c.en ? `<span class="en">${esc(c.en)}</span>` : ""}${c && c.desc ? `<span class="desc">${esc(c.desc)}</span>` : ""}</div>
          </div>
          ${g.cards.map(card => cardItemHtml(card, null, "library")).join("")}
        </section>`;
    }).join("");

    render(`
      <p class="q-hint" style="margin-top:4px">数学の勉強の仕方にも、いろいろな方法があります。今の勉強に足せそうなものを開いてみてください。</p>
      <div class="chips lib-filter" role="group" aria-label="種類で絞り込む">${chips}</div>
      ${body}
    `);
  }

  /* ---------------------------------------------------------
     私の勉強法ノート
     --------------------------------------------------------- */
  const doneLabel = v => (REFLECT.done.options.find(o => o.value === v) || {}).label || "";
  const optLabel = (def, v) => (def.options.find(o => o.value === v) || {}).label || "";
  let noteSubject = "all";

  function viewNote() {
    setTab("note");
    setTop({ title: "私の勉強法ノート", home: false });
    const plans = store.plans.slice().reverse();
    if (!plans.length) {
      render(`
        <div class="empty">
          まだ記録はありません。<br>方法を1つ選んで試すと、ここに残っていきます。
        </div>
        <div class="btn-stack"><a class="btn" href="#/navi" data-act="new-navi">今の自分を見つめる</a></div>
        <p class="foot"><a href="#/data">記録の保存と引き継ぎ</a></p>
      `);
      return;
    }
    const nRefl = store.plans.reduce((s, p) => s + p.reflections.length, 0);
    const nTried = store.plans.filter(p => p.reflections.some(r => r.done !== "notyet")).length;
    const subjects = [...new Set(store.plans.map(p => p.subject).filter(Boolean))];
    const filtered = plans.filter(p => noteSubject === "all" || p.subject === noteSubject);

    const entries = filtered.map(p => {
      const card = cardById(p.cardId) || p;
      const isActive = p.status === "active" && store.activePlanId === p.id;
      const closedText = { switched: "別の方法へ", other: "別の方法へ", pause: "区切り" }[p.closedReason] || "区切り";
      const refl = p.reflections.map(r => `
        <div class="refl">
          <div class="when">${esc(fmtDate(r.at))}の振り返り</div>
          <ul>
            <li><span class="k">実施</span>${esc(doneLabel(r.done))}</li>
            ${r.reasons && r.reasons.length ? `<li><span class="k">理由</span>${esc(r.reasons.join("、"))}</li>` : ""}
            ${r.feasibility != null ? `<li><span class="k">続けやすさ</span>${esc(optLabel(REFLECT.feasibility, r.feasibility))}</li>` : ""}
            ${r.effect != null ? `<li><span class="k">手ごたえ</span>${esc(optLabel(REFLECT.effect, r.effect))}</li>` : ""}
            <li><span class="k">次は</span>${esc(optLabel(REFLECT.next, r.next))}${r.adjustNote ? `（${esc(r.adjustNote)}）` : ""}</li>
          </ul>
          ${r.note ? `<div class="memo">${esc(r.note)}</div>` : ""}
        </div>`).join("");
      const answers = p.answers && p.answers.length
        ? `<details style="margin-top:12px"><summary class="small muted" style="cursor:pointer">選んだときの自分の答え</summary><ul class="answers" style="margin-top:6px">${p.answers.map(x => `<li><span class="q">${esc(x.q)}</span>${esc(x.a)}</li>`).join("")}${p.ask ? `<li><span class="q">自分への問い</span>${esc(p.ask)}</li>` : ""}</ul></details>`
        : "";
      return `
        <details class="entry" data-id="${esc(p.id)}" ${isActive ? "open" : ""}>
          <summary>
            <span class="status ${isActive ? "active" : "closed"}">${isActive ? "試している" : esc(closedText)}</span>${catKey(cardById(p.cardId)) ? `<span class="${catClass(cardById(p.cardId))} note-cat">${catBadge(cardById(p.cardId))}</span>` : ""}<h3>${esc(card.title)}</h3>
            <div class="meta">${esc(fmtDate(p.startedAt))}に選択${p.subject ? `・${esc(p.subject)}` : ""}${p.material ? `・${esc(p.material)}` : ""}　振り返り ${p.reflections.length}回</div>
          </summary>
          <div class="body">
            ${refl || `<p class="small muted" style="margin:12px 0 0">まだ振り返りはありません。</p>`}
            ${answers}
            <div style="display:flex;gap:8px;margin-top:14px">
              <a class="btn sub" style="min-height:40px;font-size:14px" href="#/card/${encodeURIComponent(p.cardId)}">方法を見る</a>
              <button class="btn ghost" style="min-height:40px;font-size:13px;width:auto" data-act="del-plan" data-id="${esc(p.id)}">削除</button>
            </div>
          </div>
        </details>`;
    }).join("");

    render(`
      <div class="stat-row" style="margin-top:4px">
        <div class="stat"><b>${store.plans.length}</b><span>選んだ方法</span></div>
        <div class="stat"><b>${nTried}</b><span>試せた方法</span></div>
        <div class="stat"><b>${nRefl}</b><span>振り返り</span></div>
      </div>
      ${subjects.length ? `
        <div class="chips" style="margin-top:16px">
          <button class="chip ${noteSubject === "all" ? "on" : ""}" data-act="note-subject" data-v="all">すべて</button>
          ${subjects.map(s => `<button class="chip ${noteSubject === s ? "on" : ""}" data-act="note-subject" data-v="${esc(s)}">${esc(s)}</button>`).join("")}
        </div>` : ""}
      <div style="margin-top:16px">${entries || `<p class="empty">この科目の記録はありません。</p>`}</div>
      <p class="foot"><a href="#/data">記録の保存と引き継ぎ</a></p>
    `);
  }

  /* ---------------------------------------------------------
     動画
     --------------------------------------------------------- */
  function viewVideos() {
    setTab("videos");
    setTop({ title: "勉強法動画", home: false });
    render(`
      <p class="q-hint" style="margin-top:4px">YouTubeで開きます。各方法のページにも、関連する動画を載せています。</p>
      ${VIDEOS.map(v => videoHtml(v).replace("<span>勉強法動画", `<span>${esc(v.area)} ／ 動画`)).join("")}
    `);
  }

  /* ---------------------------------------------------------
     記録の保存と引き継ぎ
     --------------------------------------------------------- */
  function viewData() {
    setTab(null);
    setTop({ back: "back", title: "記録の保存と引き継ぎ" });
    render(`
      <div class="panel warm">
        <b>記録は、この端末のこのブラウザの中に保存されています。</b>
        <p class="notice" style="margin:8px 0 0">
          運営者に自動で送られることはありません。そのかわり、次のときは記録が消えたり、見えなくなったりします。
        </p>
        <ul class="notice" style="margin:6px 0 0;padding-left:1.2em">
          <li>ブラウザの履歴やサイトデータを消したとき</li>
          <li>プライベートブラウズ（シークレットモード）で使ったとき</li>
          <li>別の端末や別のブラウザで開いたとき</li>
          <li>iPhone・iPadで、長い間このアプリを開かなかったとき</li>
        </ul>
        <p class="notice" style="margin:8px 0 0">ホーム画面に追加して使うと、消えにくくなります。</p>
        <p class="notice" style="margin:8px 0 0">共用の端末では、ほかの人に記録を見られることがあります。自由記述には、名前や連絡先などを書かないでください。</p>
        <p class="notice" style="margin:8px 0 0"><a href="${esc(CFG.pages.privacy)}">プライバシーポリシー</a>で、記録の扱いを詳しく説明しています。</p>
        ${memoryOnly ? `<p class="notice" style="margin:8px 0 0;color:var(--notice)"><b>いまの環境では保存ができないため、ページを閉じると記録が消えます。</b></p>` : ""}
      </div>

      <div class="section-label">バックアップ・引き継ぎ</div>
      <div class="btn-stack" style="margin-top:0">
        <button class="btn" data-act="export">記録をファイルに書き出す</button>
        <label class="btn sub" style="cursor:pointer">
          ファイルから読み込む
          <input type="file" id="import-file" accept="application/json,.json" style="display:none">
        </label>
      </div>
      <p class="notice">書き出したファイルを別の端末で読み込むと、記録を引き継げます。すでにある記録は消えず、足し合わされます。</p>

      <div class="section-label">記録を消す</div>
      <button class="btn ghost" style="color:var(--notice)" data-act="wipe">すべての記録を削除する</button>
      <p class="foot">${esc(CFG.versionLabel)}</p>
    `);
  }

  function exportData() {
    // 読み込み時に app の値やファイル名は確認しないため、旧名（manabikata-note）で書き出したファイルも読み込めます
    const payload = Object.assign({ app: "paletta", appVersion: CFG.version, exportedAt: new Date().toISOString() }, store);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const d = new Date();
    const name = `paletta-note-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}.json`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toast("書き出しました");
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const d = JSON.parse(reader.result);
        if (!d || !Array.isArray(d.plans)) throw new Error("format");
        const have = new Set(store.plans.map(p => p.id));
        let added = 0;
        d.plans.forEach(p => {
          if (p && p.id && p.cardId && !have.has(p.id)) {
            p.reflections = Array.isArray(p.reflections) ? p.reflections : [];
            p.answers = Array.isArray(p.answers) ? p.answers : [];
            store.plans.push(p);
            added++;
          }
        });
        store.plans.sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt));
        if (!activePlan() && d.activePlanId && store.plans.some(p => p.id === d.activePlanId && p.status === "active")) {
          store.activePlanId = d.activePlanId;
        }
        // 「試している」が複数にならないよう整理
        store.plans.forEach(p => {
          if (p.status === "active" && p.id !== store.activePlanId) { p.status = "closed"; p.closedReason = p.closedReason || "switched"; }
        });
        save();
        requestPersist();
        toast(added ? `${added}件の記録を読み込みました` : "新しい記録はありませんでした");
      } catch (e) {
        toast("このファイルは読み込めませんでした");
      }
    };
    reader.readAsText(file);
  }

  /* ---------------------------------------------------------
     操作
     --------------------------------------------------------- */
  document.addEventListener("click", e => {
    const el = e.target.closest("[data-act]");
    if (!el) return;
    const act = el.dataset.act;

    switch (act) {
      case "back": {
        e.preventDefault();
        if (!confirmLeave()) return;
        const to = el.dataset.to;
        if (to && to !== "back") go(to);
        else if (history.length > 1) history.back();
        else go("#/home");
        break;
      }
      /* ホームへ（セルフナビの途中の答えは残す。記録は消さない） */
      case "go-home": {
        if (!confirmLeave()) return;
        if (location.hash === "#/home" || location.hash === "") route(); else go("#/home");
        break;
      }

      /* ホーム */
      case "to-reflect": startDraft(); go("#/reflect"); break;
      case "to-notyet": go("#/notyet"); break;
      case "open-navi": // href で #/navi へ。途中の答えがあれば、再開画面を出す
        if (naviHasProgress()) { navi.resume = true; saveNavi(); }
        break;
      case "consult":
        if (naviHasProgress()) { navi.resume = true; saveNavi(); }
        if (location.hash === "#/navi") viewNavi(); else go("#/navi");
        break;
      case "new-navi": resetNavi(); break; // href で #/navi へ
      case "resume-continue": navi.resume = false; saveNavi(); viewNavi(); break;
      case "resume-restart": resetNavi(); viewNavi(); break;
      case "toggle-others": {
        navi.showOthers = !navi.showOthers; saveNavi();
        const list = el.nextElementSibling;
        if (list) list.hidden = !navi.showOthers;
        el.setAttribute("aria-expanded", navi.showOthers ? "true" : "false");
        break;
      }
      case "lib-open": libFilter = el.dataset.v || "all"; break; // href で #/library へ
      case "card-return": returnFromCard(); break;
      case "contact": // 新しいタブでGoogleフォームを開く（学習記録は渡さない）。オフライン時は案内だけ出す
        if (navigator.onLine === false) {
          e.preventDefault();
          toast("オフラインのため、お問い合わせフォームを開けません。インターネットに接続してから、もう一度お試しください。");
        }
        break;

      /* セルフナビ */
      case "pick-concern": {
        const c = concernById(el.dataset.id);
        if (!c || !c.available) return;
        navi = newNavi(c.id);
        saveNavi(); viewNavi(); break;
      }
      case "answer": {
        const qid = el.dataset.qid, idx = +el.dataset.idx;
        const opt = NAVI.questions[qid].options[idx];
        navi.picked = navi.picked || {};
        navi.picked[qid] = idx;
        navi.path.push({ qid, idx });
        if (opt.result) { navi.resultId = opt.result; navi.askSeen = false; }
        saveNavi(); viewNavi(); window.scrollTo(0, 0); break;
      }
      case "ask-next": navi.askSeen = true; saveNavi(); viewNavi(); window.scrollTo(0, 0); break;
      case "answer-time": {
        navi.timeIdx = +el.dataset.idx;
        navi.picked = navi.picked || {};
        navi.picked.__time = navi.timeIdx;
        saveNavi(); viewNavi(); window.scrollTo(0, 0); break;
      }
      case "navi-back": {
        if (navi.timeIdx != null) navi.timeIdx = null;                         // 候補 → 時間の問い
        else if (navi.resultId && navi.askSeen) navi.askSeen = false;         // 時間の問い → 自分への問い
        else if (navi.resultId) { navi.resultId = null; navi.path.pop(); }    // 自分への問い → Q2
        else if (navi.path.length) navi.path.pop();                           // Q2 → Q1
        else navi = null;                                                     // Q1 → 困り感
        saveNavi();
        if (navi) viewNavi(); else viewConcern();
        window.scrollTo(0, 0);
        break;
      }
      case "navi-restart": navi = newNavi(navi.concernId); saveNavi(); viewNavi(); break;

      /* 試す準備 */
      case "chip": {
        const k = el.dataset.kind, v = el.dataset.v;
        planDraft[k] = planDraft[k] === v ? "" : v;
        el.parentElement.querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c.dataset.v === planDraft[k]));
        break;
      }
      case "start-plan": startPlan(el.dataset.id); break;

      /* まだ試していない */
      case "keep": toast("このまま続けます"); break;
      case "rechoose": {
        const plan = activePlan();
        const res = plan && plan.resultId && NAVI.results[plan.resultId];
        if (res) {
          navi = restoredNavi(plan);
          saveNavi(); go("#/navi");
        } else go("#/library");
        break;
      }
      case "skip-record": startDraft({ done: "notyet" }); go("#/reflect"); break;

      /* 振り返り */
      case "r-pick": {
        const key = el.dataset.key;
        const v = JSON.parse(el.dataset.v);
        const noteEl = document.getElementById("r-note");
        const adjEl = document.getElementById("r-adjust");
        if (noteEl) draft.note = noteEl.value;
        if (adjEl) draft.adjustNote = adjEl.value;
        draft[key] = v;
        if (key === "done") { draft.reasons = []; draft.feasibility = null; draft.effect = null; }
        viewReflect();
        break;
      }
      case "r-reason": {
        const v = el.dataset.v;
        const i = draft.reasons.indexOf(v);
        if (i >= 0) draft.reasons.splice(i, 1); else draft.reasons.push(v);
        el.classList.toggle("on");
        break;
      }
      case "r-save": saveReflection(); break;
      case "reopen-result": {
        const plan = store.plans.find(p => p.id === el.dataset.plan);
        if (!plan) return;
        navi = restoredNavi(plan);
        saveNavi(); go("#/navi");
        break;
      }

      /* ライブラリ・ノート */
      case "lib-filter": libFilter = el.dataset.v; viewLibrary(); break;
      case "note-subject": noteSubject = el.dataset.v; viewNote(); break;
      case "del-plan": {
        e.preventDefault();
        if (!confirm("この方法の記録を削除しますか？（元に戻せません）")) return;
        store.plans = store.plans.filter(p => p.id !== el.dataset.id);
        if (store.activePlanId === el.dataset.id) store.activePlanId = null;
        save(); viewNote(); toast("削除しました");
        break;
      }

      /* データ */
      case "export": exportData(); break;
      case "wipe": {
        if (!confirm("すべての記録を削除します。よろしいですか？")) return;
        if (!confirm("本当に削除しますか？書き出していない記録は元に戻せません。")) return;
        store = emptyStore(); save(); resetNavi(); toast("すべての記録を削除しました"); go("#/home");
        break;
      }
    }
  });

  /* 振り返りの記述欄は入力のたびに保持 */
  document.addEventListener("input", e => {
    if (!draft) return;
    if (e.target.id === "r-note") draft.note = e.target.value;
    if (e.target.id === "r-adjust") draft.adjustNote = e.target.value;
  });

  document.addEventListener("change", e => {
    if (e.target.id === "import-file" && e.target.files[0]) {
      importData(e.target.files[0]);
      e.target.value = "";
    }
  });

  /* 保存された答え（文章）から、分岐の道筋を復元する */
  function restorePath(plan) {
    const concern = concernById(plan.concernId);
    if (!concern) return [];
    const path = [];
    let qid = concern.start;
    for (const ans of plan.answers || []) {
      const q = NAVI.questions[qid];
      if (!q) break;
      const idx = q.options.findIndex(o => o.label === ans.a);
      if (idx < 0) break;
      path.push({ qid, idx });
      const opt = q.options[idx];
      if (opt.result) break;
      qid = opt.goto;
    }
    return path;
  }
  /* 記録から、候補画面を再現する（「別の方法を選び直す」用） */
  function restoredNavi(plan) {
    const path = restorePath(plan);
    const last = path[path.length - 1];
    const ok = last && NAVI.questions[last.qid].options[last.idx].result === plan.resultId;
    return {
      concernId: plan.concernId,
      path: ok ? path : [],
      resultId: plan.resultId,
      askSeen: true,
      timeIdx: restoreTimeIdx(plan),
      picked: {},
      // 問いの文面が変わって道筋を再現できないときは、記録された答えをそのまま表示する
      savedAnswers: ok ? null : (plan.answers || [])
    };
  }

  function restoreTimeIdx(plan) {
    const last = (plan.answers || []).find(a => a.q === NAVI.timeQuestion.text);
    const idx = last ? NAVI.timeQuestion.options.findIndex(o => o.label === last.a) : -1;
    return idx >= 0 ? idx : NAVI.timeQuestion.options.length - 1;
  }

  /* ---------------------------------------------------------
     オフライン対応（http/https で公開しているときだけ）
     --------------------------------------------------------- */
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }

  /* 下部タブのアイコン */
  document.querySelectorAll("[data-icon]").forEach(el => { el.innerHTML = ic(el.dataset.icon); });

  document.title = `${CFG.appName}｜${CFG.tagline}`;
  route();
})();
