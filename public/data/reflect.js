/* =========================================================
   振り返り（Small Reflection）の問い（※文面はすべて仮）

   「実現可能性（続けられそうか）」と「有効性（手ごたえ）」を
   分けて聞くことで、設計原則④を画面上でも区別しています。
   ========================================================= */
window.REFLECT = {

  // 1. 実施状況
  done: {
    text: "この方法を、実際の勉強で試せましたか？",
    options: [
      { value: "done",    label: "試せた" },
      { value: "partly",  label: "少しだけ試せた" },
      { value: "notyet",  label: "試せなかった" }
    ]
  },

  // 試せなかったときの理由（複数選択・任意）
  notDoneReasons: {
    text: "差し支えなければ、理由に近いものを選んでください。",
    note: "試せなかったことも、次の工夫の手がかりになります。",
    options: ["時間がとれなかった", "忘れていた", "やり方がよくわからなかった", "自分には合わなそうだと思った", "その他"]
  },

  // 2. 実現可能性
  feasibility: {
    text: "続けやすさはどうでしたか？",
    sub: "効果とは別に、「続けられそうか」を考えます。",
    options: [
      { value: 3, label: "このまま続けられそう" },
      { value: 2, label: "やり方を変えれば続けられそう" },
      { value: 1, label: "続けるのは難しそう" }
    ]
  },

  // 3. 有効性
  effect: {
    text: "勉強の手ごたえに、変化はありましたか？",
    sub: "「まだわからない」も大切な答えです。",
    options: [
      { value: 3, label: "変化を感じた" },
      { value: 2, label: "少し感じた" },
      { value: 0, label: "まだわからない" },
      { value: 1, label: "感じなかった" }
    ]
  },

  // 4. 気付き（自由記述・任意）
  note: {
    text: "気付いたことがあれば、一言どうぞ。",
    placeholder: "例：符号のミスは、移項のときに多かった",
    optional: true
  },

  // 5. 次にどうするか
  next: {
    text: "次はどうしますか？",
    options: [
      { value: "continue", label: "同じ方法を続ける" },
      { value: "adjust",   label: "少し変えて続ける" },
      { value: "other",    label: "別の方法を選ぶ" },
      { value: "pause",    label: "いったん区切る" }
    ]
  },

  /* =========================================================
     Small Start の振り返り（選択式2問＋任意のひとこと）
     ※ value は記録に保存されます。文面を直すときは label だけを変えてください。
     ※ tried の value は Small Change の「実施状況」と同じ値（done / partly / notyet）を使います。
     ========================================================= */
  start: {
    tried: {
      text: "今回の工夫を試してみた？",
      options: [
        { value: "done",   label: "試せた" },
        { value: "partly", label: "少し試せた" },
        { value: "notyet", label: "まだ試せなかった" }
      ]
    },
    fit: {
      text: "この方法は、今の自分に合っていそう？",
      options: [
        { value: "fit",    label: "合っていそう" },
        { value: "unsure", label: "まだわからない" },
        { value: "unfit",  label: "合わなさそう" }
      ]
    },
    note: {
      text: "ひとこと",
      placeholder: "気付いたことや、次に変えてみたいこと",
      optional: true
    },
    // 記録した後に選ぶ次の行動
    next: {
      text: "次はどうする？",
      options: [
        { value: "continue", label: "同じ方法をもう一度試す" },
        { value: "other",    label: "別の方法を見る" },
        { value: "pause",    label: "学習ノートへ戻る／終了する" }
      ]
    }
  }
};
