/* =========================================================
   勉強法セルフナビ：困り感・問い・分岐（v0.3）

   流れ
     困り感 → Q1 → Q2 → 自分への問い（読むだけ） → 時間の問い → 候補カード

   しくみ
   1. 「困り感」を選ぶと、start に書いた問い（Q1）から始まります。
   2. 問いの選択肢には、次のどちらかを書きます。
        goto:   "問いのid"   … 次の問いへ進む
        result: "結果のid"   … 自分への問い → 時間の問い → 候補 へ進む
   3. 結果（results）には、次の項目を書きます。
        echo      : 答えの受け止め（「〜が多いようですね」など。断定しない表現で）
        ask       : 自分への問い（読むだけ。回答欄はありません）
        encourage : （任意）自分への問いの下に添える一言
        lead      : 候補画面で、答えと候補のつながりを示す一文
        cards     : 候補として表示するカードの id（2〜3枚。書いた順に表示）
                    一人でも取り組めるカード（mode が solo / either）を書きます。
        others    : （任意）「誰かと取り組む方法も見る」を押したときに表示するカードの id
                    この答えに関係の深いものだけを書きます。書かなければ、ボタンの代わりに
                    ライブラリへの案内が出ます。
      カードの中身は cards.js に書きます。

   ※ 文面を直したら、check.html を開くと、分岐やカードidの誤りを確認できます。
   ========================================================= */
window.NAVI = {

  // ---------- 困り感（入口） ----------
  concerns: [
    {
      id: "understand-but-cant-solve",
      label: "授業はわかるけれど、問題が解けない",
      note: "2つの問いで、普段の勉強の様子を振り返ります（1〜2分）。",
      start: "q1",
      available: true
    },
    {
      id: "no-time",
      label: "勉強したいけれど、時間も体力もない",
      note: "Small Start（小さな一歩）を準備中です。",
      available: false
    }
  ],

  // ---------- 問い ----------
  questions: {

    // Q1：入口の問い
    q1: {
      text: "問題を解こうとしたとき、どんなところで困ることが多い？",
      hint: "最近の宿題や問題集を思い浮かべて、最も近いものを選んでみよう。",
      options: [
        { label: "何から始めればよいかわからない",                 goto: "q-start" },
        { label: "途中までは進めるけれど、最後まで解けない",       goto: "q-middle" },
        { label: "解説を読むとわかるのに、自分では再現できない",   goto: "q-review" },
        { label: "基本問題は解けるのに、違う問題になると解けない", goto: "q-transfer" },
        { label: "うまく説明できない・いろいろある",               goto: "q-unsure" }
      ]
    },

    // Q2 ①「何から始めればよいかわからない」
    "q-start": {
      text: "そんなとき、普段はどうしていることが多い？",
      hint: "最近、手が止まった問題を一つ思い浮かべてみよう。",
      options: [
        { label: "すぐに解説や答えを見る",             result: "r-start-a" },
        { label: "しばらく自分で考え続ける",           result: "r-start-b" },
        { label: "教科書やノートで似た問題を探す",     result: "r-start-c" },
        { label: "いったん飛ばす・後回しにする",       result: "r-start-d" }
      ]
    },

    // Q2 ②「途中までは進めるけれど、最後まで解けない」
    "q-middle": {
      text: "途中で止まったり間違えたりするとき、どんなことが多い？",
      options: [
        { label: "途中で次に何をすればよいかわからなくなる",         result: "r-middle-a" },
        { label: "考え方はわかるのに、計算や式の処理で間違える",     result: "r-middle-b" },
        { label: "頭ではわかっているつもりでも、式や説明に表せない", result: "r-middle-c" },
        { label: "どこでつまずいたのか、自分でもよくわからない",     result: "r-middle-d" }
      ]
    },

    // Q2 ③「解説を読むとわかるのに、自分では再現できない」
    "q-review": {
      text: "解説を読んで「わかった」と思った後、普段はどうしている？",
      hint: "最近、解説を読んだ問題を思い浮かべてみよう。",
      options: [
        { label: "解説を読んで納得したら、次の問題に進む",       result: "r-review-a" },
        { label: "解説を見ながら、ノートに解き方を写す",         result: "r-review-b" },
        { label: "解説を閉じて、もう一度自分で解く",             result: "r-review-c" },
        { label: "自分では、どんな確認をしているかよくわからない", result: "r-review-d" }
      ]
    },

    // Q2 ④「基本問題は解けるのに、違う問題になると解けない」
    "q-transfer": {
      text: "基本問題を勉強するとき、普段はどんな取り組み方をしている？",
      hint: "最近の問題集や宿題への取り組み方を思い浮かべてみよう。",
      options: [
        { label: "例題や基本問題を、同じ解き方で繰り返し練習している",   result: "r-transfer-a" },
        { label: "問題集を単元・問題番号の順番に解いている",             result: "r-transfer-b" },
        { label: "少し難しい問題になると、解説を見て解き方を覚えている", result: "r-transfer-c" },
        { label: "応用問題にも挑戦しているが、なかなか自力で解けない",   result: "r-transfer-d" }
      ]
    },

    // Q2 ⑤「うまく説明できない・いろいろある」
    "q-unsure": {
      text: "今の自分に、一番近いのはどれ？",
      hint: "はっきりわからなくても大丈夫。なんとなく近いものを選んでみよう。",
      options: [
        { label: "問題によって、困るところが違う",                             result: "r-unsure-a" },
        { label: "授業で学んだことと、問題集や宿題とのつながりが見えない",     result: "r-unsure-b" },
        { label: "解説を見ても、何がわからないのかはっきりしない",             result: "r-unsure-c" },
        { label: "わからないことが多すぎて、どこから取り組めばよいかわからない", result: "r-unsure-d" },
        { label: "自分でも、何に困っているのかよくわからない",                 result: "r-unsure-e" }
      ]
    }
  },

  // ---------- 時間の問い（すべての結果の前に共通で聞く） ----------
  // level の数字以下の負担（cards.js の burden）のカードに「比較的取り入れやすい」と印をつけます。
  // 印は参考情報です。カードが隠れたり、並び順が変わったりすることはありません。
  timeQuestion: {
    text: "この1週間、数学の勉強に使えそうな時間はどのくらいですか？",
    hint: "答えによって候補が隠れることはありません。試しやすさの目安として使います。",
    options: [
      { label: "ほとんどない（宿題で精一杯）", level: 1 },
      { label: "宿題に少し足せるくらい", level: 2 },
      { label: "自主学習の時間もとれる", level: 3 }
    ]
  },

  // ---------- 結果 ----------
  results: {

    // ① 何から始めればよいかわからない
    "r-start-a": {
      echo: "手が止まったとき、すぐに解説や答えを見ることが多いようですね。",
      ask: "解説を見る前に、自分なりに使えそうな考え方を予想したことはある？",
      lead: "解説を見る前に、自分の考えを少しだけ残してみる方法です。",
      cards: ["plan-before-answer", "first-move", "compare-with-example"]
    },
    "r-start-b": {
      echo: "手が止まっても、しばらく自分で考え続けることが多いようですね。",
      ask: "考えている間、何を手がかりにしている？",
      lead: "考えている時間を、手がかりを見つける時間にする方法です。",
      cards: ["first-move", "compare-with-example", "plan-before-answer"]
    },
    "r-start-c": {
      echo: "手が止まったとき、教科書やノートで似た問題を探すことが多いようですね。",
      ask: "似た問題を見つけた後、どこが同じで、どこが違うかを考えている？",
      lead: "似た問題を探すという工夫を、もう一歩活かす方法です。",
      cards: ["compare-with-example", "name-the-method", "first-move"]
    },
    "r-start-d": {
      echo: "手が止まった問題は、いったん飛ばしたり後回しにしたりすることが多いようですね。",
      ask: "後からその問題に戻ったとき、何を手がかりに考え直している？",
      encourage: "飛ばすことは、時間を上手に使う方法でもあります。後で戻ったときに考えやすくする工夫を探してみよう。",
      lead: "飛ばした問題に戻ったとき、考え直しやすくする方法です。",
      cards: ["mark-where-stuck", "first-move", "compare-with-example"]
    },

    // ② 途中までは進めるけれど、最後まで解けない
    "r-middle-a": {
      echo: "途中で、次に何をすればよいかわからなくなることが多いようですね。",
      ask: "どこまでは自分の考えで進められた？ その後、何を手がかりにしようとした？",
      lead: "どこまで進めたか、次に何を手がかりにするかを整理する方法です。",
      cards: ["name-the-method", "plan-before-answer", "mark-where-stuck"],
      others: ["prepare-question"]
    },
    "r-middle-b": {
      echo: "考え方はわかっていても、計算や式の処理で間違えることが多いようですね。",
      ask: "間違いが起きたのは、いつも同じような計算や操作？",
      encourage: "計算や式の処理の間違いは、「不注意」だけが原因とは限りません。その操作の意味や手順に、まだ慣れていないことが関わっている場合もあります。",
      lead: "間違いが起きる場所や理由を、自分で確かめる方法です。",
      cards: ["check-point", "one-word-reason", "compare-error-lines"]
    },
    "r-middle-c": {
      echo: "頭ではわかっているつもりでも、式や説明に表すところで止まることが多いようですね。",
      ask: "書けないのは、何を使うかを決めるところ？ それとも考えたことを表すところ？",
      lead: "考えていることを、式や言葉に表す練習になる方法です。",
      cards: ["first-move", "explain-example", "connect-representations"],
      others: ["explain-with-peer"]
    },
    "r-middle-d": {
      echo: "どこでつまずいたのか、自分でもはっきりしないことが多いようですね。",
      ask: "自分の答案と解説を比べたとき、最初に違いが生じたのはどこだろう？",
      lead: "自分の答案と解説を比べて、つまずいた場所を見つける方法です。",
      cards: ["compare-error-lines", "one-word-reason", "why-this-line"],
      others: ["prepare-question"]
    },

    // ③ 解説を読むとわかるのに、自分では再現できない
    "r-review-a": {
      echo: "解説を読んで納得したら、次の問題に進むことが多いようですね。",
      ask: "「わかった」と思った後、自分だけで解けるか確かめたことはある？",
      lead: "「読んでわかった」が「自分で解ける」になっているか、確かめる方法です。",
      cards: ["close-and-reproduce", "hide-one-step", "retry-later"]
    },
    "r-review-b": {
      echo: "解説を見ながら、ノートに解き方を写すことが多いようですね。",
      ask: "解説を見ずに、どこまで再現できそう？",
      lead: "写すことを、自分で再現する練習に近づける方法です。",
      cards: ["close-and-reproduce", "why-this-line", "hide-one-step"]
    },
    "r-review-c": {
      echo: "解説を閉じて、もう一度自分で解き直すことが多いようですね。",
      ask: "解き直すとき、手順を覚えているだけか、理由も説明できるか確かめている？",
      encourage: "解説を閉じて解き直すのは、すでに大切な工夫です。そのうえで、確かめ方を少し深める方法を考えてみよう。",
      lead: "今の解き直しに、理由の説明や、時間を空けた確認を加える方法です。",
      cards: ["why-this-line", "retry-later", "explain-example"],
      others: ["explain-with-peer"]
    },
    "r-review-d": {
      echo: "「わかった」と思った後にどんな確認をしているか、まだはっきりしないようですね。",
      ask: "最後に「わかった」と感じた問題を、今もう一度解くとしたらどうだろう？",
      lead: "「わかった」と感じたことを、自分で確かめてみる方法です。",
      cards: ["first-move", "close-and-reproduce", "explain-example"],
      others: ["explain-with-peer"]
    },

    // ④ 基本問題は解けるのに、違う問題になると解けない
    "r-transfer-a": {
      echo: "例題や基本問題を、同じ解き方でくり返し練習していることが多いようですね。",
      ask: "問題の解き方だけでなく、なぜその方法を使うのかも考えている？",
      encourage: "基本問題のくり返しは、大切な土台です。今の練習をやめるのではなく、少しだけ何かを足すことを考えてみよう。",
      lead: "今の練習に、「なぜその方法を使うのか」を考える要素を足す方法です。",
      cards: ["name-the-method", "compare-methods", "compare-with-example"],
      others: ["explain-with-peer"]
    },
    "r-transfer-b": {
      echo: "問題集を、単元や問題番号の順番に解いていることが多いようですね。",
      ask: "単元名や問題の並び順がわからなくても、使う解法を選べそう？",
      encourage: "順番に解くことにも良さがあります。今の練習をやめるのではなく、少しだけ何かを足すことを考えてみよう。",
      lead: "今の練習に、「どの解き方を使うか選ぶ」要素を足す方法です。",
      cards: ["mix-problems", "name-the-method", "plan-before-answer"]
    },
    "r-transfer-c": {
      echo: "少し難しい問題では、解説を見て解き方を覚えることが多いようですね。",
      ask: "解説を読む前に、基本問題との共通点や違いを考えている？",
      lead: "解説を読む前に、基本問題とのつながりを考えてみる方法です。",
      cards: ["compare-with-example", "plan-before-answer", "hide-one-step"]
    },
    "r-transfer-d": {
      echo: "応用問題にも挑戦しているけれど、自力で解き切るのは難しいと感じることが多いようですね。",
      ask: "解けなかった問題について、どこまで自分で考えられたか整理している？",
      lead: "解けなかった問題で、どこまで考えられたかを整理する方法です。",
      cards: ["compare-with-example", "mark-where-stuck", "name-the-method"]
    },

    // ⑤ うまく説明できない・いろいろある
    "r-unsure-a": {
      echo: "問題によって、困るところが違うようですね。",
      ask: "最近困った問題を一つ選ぶとしたら、どの問題だろう？",
      encourage: "自分の状況を整理しようとしていること自体が、大切な一歩です。",
      lead: "困った問題を一つずつ残して、困りごとの形を見えるようにする方法です。",
      cards: ["mark-where-stuck", "one-word-reason", "first-move"]
    },
    "r-unsure-b": {
      echo: "授業で学んだことと、問題集や宿題とのつながりが見えにくいようですね。",
      ask: "普段、授業で学んだことを問題演習と結び付けるために、何かしているだろうか？",
      encourage: "自分の状況を整理しようとしていること自体が、大切な一歩です。",
      lead: "授業で学んだことと、問題演習とのつながりを探す方法です。",
      cards: ["compare-with-example", "connect-representations", "classwork-link"],
      others: ["prepare-question"]
    },
    "r-unsure-c": {
      echo: "解説を見ても、何がわからないのかがはっきりしないようですね。",
      ask: "解説の中で、最初に「なぜ？」と思ったのはどこだろう？",
      encourage: "自分の状況を整理しようとしていること自体が、大切な一歩です。",
      lead: "「何がわからないか」を、少しずつはっきりさせる方法です。",
      cards: ["why-this-line", "compare-error-lines", "mark-where-stuck"],
      others: ["prepare-question"]
    },
    "r-unsure-d": {
      echo: "わからないことが多くて、どこから取り組めばよいか迷っているようですね。",
      ask: "今の授業や宿題を進めるために、まず確認したいことを一つ選べそう？",
      encourage: "全部を一度に解決しなくて大丈夫です。自分の状況を整理しようとしていること自体が、大切な一歩です。",
      lead: "まず確認したいことを一つにしぼって始める方法です。",
      cards: ["first-move", "explain-example", "mark-where-stuck"],
      others: ["prepare-question"]
    },
    "r-unsure-e": {
      echo: "何に困っているのか、自分でもまだはっきりしないようですね。",
      ask: "最近、数学で少しでも「できた」と感じた場面はあった？",
      encourage: "すぐに勉強法を変えなくても大丈夫です。まずは自分の様子に目を向けることが、大切な一歩です。",
      lead: "勉強法を変える前に、自分の様子に目を向けてみる方法です。",
      cards: ["notice-one-thing", "mark-where-stuck", "first-move"]
    }
  }
};
