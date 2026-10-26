/* =========================================================
   アプリ全体の設定（名称・キャッチコピー・連絡先など）
   ここを書き換えると、アプリ画面上の表示が変わります。

   ※ 名称を変えるときは、次のファイルも合わせて直してください
     （JavaScriptなしでも読めるよう、名称を直接書いています）。
       index.html（<title> と meta）、manifest.webmanifest、
       howto.html・terms.html・privacy.html
   ========================================================= */
window.APP_CONFIG = {
  appName: "Paletta",
  appReading: "パレッタ",
  tagline: "数学の学び方を、自分の色に。",
  subTagline: "自分の勉強を振り返り、いろいろな方法を試しながら、自分に合った学び方を見つけるアプリです。",
  version: "v0.4.0 β",
  versionLabel: "Paletta v0.4.0 β",
  operator: "新井健使",

  // お問い合わせ（Googleフォーム。新しいタブで開きます）
  contactUrl: "https://docs.google.com/forms/d/e/1FAIpQLSelMmzSaA0BG9F45TSxbpQJoN7o0RmerUH9RfRu2n4dPGYGBA/viewform",

  // 案内ページ
  pages: {
    howto: "howto.html",
    terms: "terms.html",
    privacy: "privacy.html"
  },

  // 記録につける「科目」の候補（任意入力）
  subjects: ["数学Ⅰ", "数学A", "数学Ⅱ", "数学B", "数学Ⅲ", "数学C", "その他"],

  // 「どこで試すか」の候補（任意入力）
  materials: ["教科書", "問題集", "宿題・課題", "授業ノート", "考査の解き直し", "その他"],

  // カードの種類（cards.js の category）。色とアイコンは画面側で決まります。
  categories: {
    study:  { label: "学び方を工夫する",     en: "Study Skills",         desc: "思い出す・間を空ける・振り返るなど、学び方の工夫を数学に活かす方法。" },
    math:   { label: "数学の考え方を活かす", en: "Math Thinking",        desc: "比べる・表現をつなぐ・確かめるなど、数学ならではの取り組み方。" },
    others: { label: "他者の力を借りる",     en: "Learning with Others", desc: "説明し合う・質問するなど、人の力を借りる方法。できるときに選べば大丈夫です。" }
  },

  // 取り組み方（cards.js の mode）。一人でできるカードには表示しません。
  modes: {
    solo:       "一人でできる",
    either:     "一人でも・誰かとでも",
    withOthers: "誰かと取り組む"
  }
};
