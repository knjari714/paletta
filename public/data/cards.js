/* =========================================================
   Small Change カード（v0.3：21枚）

   各項目の意味
   - id         : 分岐（navi.js）や記録から参照する名前。英数字とハイフンで。
                  ※ 既存カードの id は変えないでください（過去の記録が参照しています）。
   - type       : "change"（Small Change）か "start"（Small Start）
   - category   : カードの種類（色とアイコンが決まります）
                    "study"  … 学び方を工夫する（BLUE）
                    "math"   … 数学の考え方を活かす（GREEN）
                    "others" … 他者の力を借りる（ORANGE）
   - mode       : 取り組み方
                    "solo" … 一人でできる / "either" … 一人でも誰かとでも / "withOthers" … 誰かと取り組む
   - title      : カード名
   - catch      : 一行の説明
   - when       : こんなときに
   - what       : 何を変える？
   - steps      : やり方（短い文を2〜4個）
   - note       : （任意）やり方の下に添える補足
   - easyStart  : （任意）ここまででもOK
   - extension  : （任意）余裕があれば
   - burden     : 負担の目安 1（小）〜3（大）
   - burdenNote : 負担についての補足
   - check      : 確かめること
   - videos     : 関連動画の id（videos.js）
   - researchTags : 開発・研究用のタグ（生徒向け画面には表示しません）

   ※ カテゴリーの表示名や説明は config.js にあります。
   ※ 新しい項目（例：inHomework: true）を足しても、画面で使うまでは無視されます。
   ========================================================= */
window.CARDS = [

  /* =====================================================
     BLUE：学び方を工夫する（Study Skills）
     ===================================================== */
  {
    id: "first-move",
    type: "change", category: "study", mode: "solo",
    title: "「最初の一手」だけ決める",
    catch: "最後まで解こうとする前に、最初にすることだけを考える。",
    when: "問題を見ても、何から始めればよいか浮かばないとき。",
    what: "いきなり最後まで解こうとせず、最初の一手を考えることから始める。",
    steps: [
      "問題を見て、最初に何をするかを一言で考える。",
      "思いついたら、その一手だけ試してみる。",
      "思いつかなければ、教科書やノートから手がかりを一つ探す。"
    ],
    burden: 1,
    burdenNote: "1問につき数十秒。いつもの演習にそのまま足せます。",
    check: "最初の一手を考えるとき、どんな手がかりが役立った？",
    videos: ["v5"],
    researchTags: ["planning", "heuristics"]
  },
  {
    id: "plan-before-answer",
    type: "change", category: "study", mode: "solo",
    title: "解説を見る前に、方針を30秒考える",
    catch: "わからなくても、予想を一つ持ってから解説を開く。",
    when: "考えてもわからず、すぐに解説を見てしまうとき。",
    what: "解説を見るタイミングは変えずに、その前に自分の予想を一つ持つ。",
    steps: [
      "解説を見る前に、使えそうな考え方を一つ予想する。",
      "解説と自分の予想を比べる。",
      "違っていたところを一つ確認する。"
    ],
    burden: 1,
    burdenNote: "30秒は目安です。時間を計る必要はありません。",
    check: "解説と自分の考えの違いに気付けた？",
    videos: ["v4", "v5"],
    researchTags: ["prediction", "generation"]
  },
  {
    id: "close-and-reproduce",
    type: "change", category: "study", mode: "solo",
    title: "解説を閉じて、もう一度書く",
    catch: "「読んでわかった」を「自分で書ける」に近づける。",
    when: "解説を読むとわかるのに、似た問題が出るとまた解けないとき。",
    what: "解説を読んで終わりにせず、閉じてから自分の手で再現する。",
    steps: [
      "解説を読んで納得したら閉じる。",
      "解説を見ずに、自分の手で再現してみる。",
      "難しければ、最初の一手や途中の一部分だけでもよい。",
      "詰まったところを確認する。"
    ],
    note: "一部分を再現できたことと、問題全体を自力で解けることは別のことです。どこまでできたかを確かめましょう。",
    burden: 2,
    burdenNote: "1問ごとに数分増えます。全部ではなく、間違えた問題だけでも。",
    check: "どこまで自分の力で再現できた？",
    videos: ["v5"],
    researchTags: ["retrieval-practice"]
  },
  {
    id: "one-word-reason",
    type: "change", category: "study", mode: "solo",
    title: "間違いを一言で記録する",
    catch: "丸つけのついでに、何が起きたかを一言だけ残す。",
    when: "同じような間違いをくり返している気がするとき。",
    what: "丸つけのときに、間違えた問題で何が起きたかを一言書き足す。",
    steps: [
      "丸つけの際、間違えた問題を一つ選ぶ。",
      "「符号」「条件の見落とし」など、何が起きたかを一言で残す。",
      "記録がたまったら、似た間違いがあるか見返す。"
    ],
    note: "まずは「何が起きたか」を書きます。「なぜ起きたか」は推測なので、わかる範囲で別に考えれば十分です。",
    burden: 1,
    burdenNote: "1問につき数秒。",
    check: "自分の間違いに、くり返しの傾向はあった？",
    videos: ["v6"],
    researchTags: ["error-analysis", "self-monitoring"]
  },
  {
    id: "why-this-line",
    type: "change", category: "study", mode: "solo",
    title: "わからなかった一行に「なぜ？」を残す",
    catch: "解説の全部ではなく、引っかかった一か所に疑問を残す。",
    when: "解説を読んでも、途中の式変形や方針の理由がわからないとき。",
    what: "わからない部分を読み流さず、疑問を言葉にして残す。",
    steps: [
      "解説で理解できなかった部分を一つ選ぶ。",
      "「なぜこの式になる？」など、疑問を一言で残す。",
      "理由を考え、必要なら質問や復習につなげる。"
    ],
    note: "理由をすぐに説明できなくても大丈夫です。何がわからないかがはっきりすること自体に価値があります。",
    burden: 2,
    burdenNote: "1問につき数分。",
    check: "何を理解できていないか、以前よりはっきりした？",
    videos: ["v4"],
    researchTags: ["self-explanation", "question-generation"]
  },
  {
    id: "check-point",
    type: "change", category: "study", mode: "solo",
    title: "ミスしやすいところを一つ確認する",
    catch: "全部を見直すのではなく、自分がミスしやすい操作だけ確かめる。",
    when: "方針は合っているのに、計算や式の処理の間違いで点を落とすとき。",
    what: "見直しの対象を、自分がミスしやすい操作一つにしぼる。",
    steps: [
      "最近の間違いから、ミスしやすい操作を一つ選ぶ。",
      "問題を解くとき、その操作の直後に確認する。",
      "同じ間違いが起きたか確かめる。"
    ],
    burden: 1,
    burdenNote: "1問につき数秒。",
    check: "決めた操作や場面で、同じ間違いは起きた？",
    videos: ["v8"],
    researchTags: ["self-monitoring", "error-analysis"]
  },
  {
    id: "retry-later",
    type: "change", category: "study", mode: "solo",
    title: "間違えた問題を、日を置いて解き直す",
    catch: "その場の解き直しに加えて、次の機会にもう一度。",
    when: "解き直しをしても、時間がたつとまた解けなくなるとき。",
    what: "間違えた問題を一つ選び、次に数学を勉強する機会に解き直す。",
    steps: [
      "間違えた問題から、もう一度解きたい問題を一つ選んで印をつける。",
      "次に数学を勉強する機会に、解説を見ずに解く。",
      "解けなかった場合は、どこで止まったか確認する。"
    ],
    burden: 2,
    burdenNote: "日にちを決める必要はありません。次に数学を勉強するときに、一問だけ。",
    check: "時間がたっても、自力で解き方を思い出せた？",
    videos: ["v5", "v7"],
    researchTags: ["spaced-practice", "retrieval-practice"]
  },
  {
    id: "mark-where-stuck",
    type: "change", category: "study", mode: "solo",
    title: "手が止まった場所に印をつける",
    catch: "解けなかった問題に、「ここまでは考えた」を残す。",
    when: "途中で止まる、あるいは何がわからないか整理できないとき。",
    what: "解けない問題をそのまま終わらせず、止まった場所と、そこまでの考えを残す。",
    steps: [
      "問題を解いていて手が止まったら、印をつける。",
      "そこまでに何を考えたか振り返る。",
      "後で解説と比べ、どこまで正しかったか確認する。"
    ],
    easyStart: "手が止まった場所に、印をつけるだけ。",
    burden: 1,
    burdenNote: "印をつけるだけなら、1問につき数秒。後回しにした問題にも使えます。",
    check: "どこで手が止まり、どこまでは正しく考えられていた？",
    videos: ["v6", "v5"],
    researchTags: ["self-monitoring", "metacognition"]
  },
  {
    id: "notice-one-thing",
    type: "change", category: "study", mode: "solo",
    title: "今日の学びから、一つ気付きを見つける",
    catch: "勉強法を変える前に、自分の学びに目を向ける。",
    when: "自分が何に困っているのか、うまく説明できないとき。",
    what: "授業や宿題を振り返り、気付きを一つだけ見つける。",
    steps: [
      "最近の数学の授業や宿題を一つ思い浮かべる。",
      "「できたこと」「わかったこと」「困ったこと」から一つ選ぶ。",
      "次に試してみたいことがあるか考える。"
    ],
    note: "見つけるのは一つで十分です。",
    burden: 1,
    burdenNote: "1回1分ほど。授業や宿題の終わりに。",
    check: "自分の学習について、新しい気付きがあった？",
    videos: ["v7"],
    researchTags: ["reflection", "self-regulated-learning"]
  },

  /* =====================================================
     GREEN：数学の考え方を活かす（Math Thinking）
     ===================================================== */
  {
    id: "compare-with-example",
    type: "change", category: "math", mode: "solo",
    title: "教科書の例題と並べて比べる",
    catch: "解けない問題と例題の「同じところ・違うところ」を探す。",
    when: "例題はできるのに、問題集や考査の問題になるとできないとき。",
    what: "解けない問題を、関係がありそうな例題と並べて見比べる。",
    steps: [
      "解けなかった問題と関係がありそうな例題を探す。",
      "同じところと違うところを一つずつ探す。",
      "違いが解き方にどう関係するか考える。"
    ],
    easyStart: "共通点か相違点を一つ見つける。",
    burden: 2,
    burdenNote: "例題を探す時間を含めて、1問5分ほど。",
    check: "どこが同じで、どこが違った？ その違いは解き方に関係していた？",
    videos: ["v3", "v4"],
    researchTags: ["comparison", "analogical-reasoning"]
  },
  {
    id: "name-the-method",
    type: "change", category: "math", mode: "solo",
    title: "解き方に短い名前をつける",
    catch: "解けた問題の考え方を、自分の言葉で一言にまとめる。",
    when: "解き方を覚えても、どの問題で使えばよいかわからないとき。",
    what: "解き終えた後に、解法のポイントを一言で書き留める。",
    steps: [
      "解き終えた問題の考え方を振り返る。",
      "解法のポイントを一言で書く。",
      "余裕があれば、なぜその解法を選んだか考える。"
    ],
    easyStart: "使った方法の名前を一つ書く。",
    burden: 1,
    burdenNote: "1問につき数秒〜数十秒。",
    check: "どのような問題で使う解法か、思い出せる？",
    videos: ["v6"],
    researchTags: ["strategy-labeling", "self-explanation"]
  },
  {
    id: "explain-example",
    type: "change", category: "math", mode: "solo",
    title: "授業の例題を、ノートを見ずに説明する",
    catch: "「わかった」を、自分の言葉で確かめる。",
    when: "授業ではわかったつもりでも、自分で解こうとすると手が止まるとき。",
    what: "問題演習の前に、授業の例題の流れを自分の言葉で説明する。",
    steps: [
      "授業で扱った例題を一つ選ぶ。",
      "ノートを閉じ、解き方の流れを自分の言葉で説明する。",
      "説明できない部分をノートで確認する。"
    ],
    easyStart: "一つの操作について、何をしたか説明する。",
    burden: 2,
    burdenNote: "1回3〜5分。声に出しても、メモに書いても。",
    check: "どこまで説明できて、どこがあいまいだった？",
    videos: ["v3", "v4"],
    researchTags: ["self-explanation", "retrieval-practice"]
  },
  {
    id: "mix-problems",
    type: "change", category: "math", mode: "solo",
    title: "違う節の問題を一問混ぜる",
    catch: "いつもの演習に一問だけ、別の節の問題を足す。",
    when: "節ごとの問題は解けるのに、テストで問題が混ざるとできないとき。",
    what: "同じ節の問題を続けるだけでなく、別の節の問題を一問混ぜて、解法を自分で選ぶ。",
    steps: [
      "普段の問題演習の最後に、別の節の基本問題を一問選ぶ。",
      "どの解法を使うか自分で考える。",
      "余裕があれば、実際に解いて確かめる。"
    ],
    note: "解法を予想することと、実際に解いて確かめることは別の練習です。どこまでできたかを振り返りましょう。",
    easyStart: "使えそうな解法を一つ予想する。",
    burden: 2,
    burdenNote: "一問だけなので数分ほど。予想だけなら1分で。",
    check: "単元名や並び順に頼らず、解法を選べた？",
    videos: ["v5", "v8"],
    researchTags: ["interleaved-practice", "strategy-selection"]
  },
  {
    id: "compare-error-lines",
    type: "change", category: "math", mode: "solo",
    title: "間違いが始まったところを探す",
    catch: "答案全体ではなく、正しくなくなった最初の場所を見つける。",
    when: "途中の計算や処理で間違えるが、原因がはっきりしないとき。",
    what: "誤答全体を眺めるのではなく、考え方や式の変形が正しくなくなった箇所を探す。",
    steps: [
      "自分の解答と模範解答を見比べる。",
      "考え方や式の変形が正しくなくなった箇所を探す。",
      "そこで何を間違えたか考える。"
    ],
    note: "模範解答と違う方法で解いていても、正しい場合があります。違う方法のときは、自分の方法のどこで正しくなくなったかを探します。",
    easyStart: "見直したい一か所に印をつける。",
    burden: 1,
    burdenNote: "間違えた問題1問につき1〜2分。丸つけのついでにできます。",
    check: "誤りが生じた箇所を特定できた？",
    videos: ["v5", "v6"],
    researchTags: ["error-analysis", "comparison"]
  },
  {
    id: "classwork-link",
    type: "change", category: "math", mode: "solo",
    title: "授業と問題集のつながりを一つ探す",
    catch: "授業で学んだことと、問題演習のつながりを一つ見つける。",
    when: "授業で学んだことと、宿題・問題集とのつながりが見えないとき。",
    what: "授業ノートやプリントと問題集を見比べ、つながりを意識する。",
    steps: [
      "授業で学んだこと、または問題集の一問を選ぶ。",
      "授業ノート・プリントと問題集を見比べる。",
      "つながっているところを一つ探す。"
    ],
    note: "つながりが見つからなければ、どこがつながらないかをメモしておき、先生や友達に質問してみるのも一つの方法です。",
    easyStart: "関連しそうな箇所に印をつける。",
    burden: 2,
    burdenNote: "ノートを見返す時間を含めて、5分ほど。",
    check: "授業で学んだことと問題演習の関係を説明できた？",
    videos: ["v3", "v6"],
    researchTags: ["connection-making", "transfer"]
  },
  {
    id: "compare-methods",
    type: "change", category: "math", mode: "solo",
    title: "別の解き方と比べてみる",
    catch: "一つの問題の、二つの解き方を見比べる。",
    when: "解法を覚えても、違う問題に対応しにくいとき。",
    what: "一つの解法だけを覚えるのではなく、別の解法との違いを見る。",
    steps: [
      "同じ問題について、すでに示されている二つの解法を用意する。",
      "同じところと違うところを探す。",
      "それぞれの解法の特徴を考える。"
    ],
    note: "自分で別の解き方を考え出す必要はありません。教科書や解説にすでに載っている解き方を使います。",
    easyStart: "二つの解法の違いを一つ見つける。",
    extension: "それぞれの解法が、どんな場面で使いやすいか考える。",
    burden: 2,
    burdenNote: "解き方を読み比べるので、1問5分ほど。",
    check: "二つの解法の違いを一つ説明できた？",
    videos: ["v4", "v5"],
    researchTags: ["comparison", "procedural-flexibility"]
  },
  {
    id: "connect-representations",
    type: "change", category: "math", mode: "solo",
    title: "式・図・言葉をつなげてみる",
    catch: "式の一部分が、図やグラフのどこに当たるかを探す。",
    when: "計算はできても、式や図の意味がよくわからないとき。",
    what: "式を操作するだけでなく、異なる表現との関係を考える。",
    steps: [
      "式と図・グラフなどが示されている例を選ぶ。",
      "式の一部分が何に対応するか探す。",
      "見つけた関係を指さすか、一言で説明する。"
    ],
    note: "図やグラフが合わない問題では、式と言葉の対応でもかまいません。",
    easyStart: "すでにある二つの表現で、対応する部分を一つ探す。",
    extension: "一方の表現から、もう一方を予想する。",
    burden: 2,
    burdenNote: "一つの例につき数分。",
    check: "異なる表現のつながりを一つ見つけられた？",
    videos: ["v4"],
    researchTags: ["multiple-representations"]
  },
  {
    id: "hide-one-step",
    type: "change", category: "math", mode: "solo",
    title: "解答例を一部分だけ隠して考える",
    catch: "解説を読むだけでなく、一か所を隠して自分で考える。",
    when: "解説を読めばわかるのに、一人で解こうとすると手が止まるとき。",
    what: "解説を読むだけで終わらず、一部分を自分で考える。",
    steps: [
      "解説の流れを確認する。",
      "途中の一か所を紙などで隠す。",
      "そこに何が書かれているか考え、解説と比べる。"
    ],
    note: "一部分を考えられたことと、問題全体を自力で解けることは別のことです。",
    easyStart: "次の一操作だけ考える。",
    extension: "隠す部分を増やし、最後には解説を閉じて解き直す。",
    burden: 1,
    burdenNote: "1問につき1〜2分。いつもの解説の読み方に足せます。",
    check: "どの部分を自分で考えられた？ 何が手がかりになった？",
    videos: ["v5"],
    researchTags: ["worked-examples", "fading"]
  },
  {
    id: "verify-another-way",
    type: "change", category: "math", mode: "solo",
    title: "答えを別の方法で確かめる",
    catch: "同じ計算をくり返すのではなく、別の方法で答えを確かめる。",
    when: "見直しても、間違いに気付けないとき。",
    what: "同じ計算を繰り返すだけでなく、別の視点から検証する。",
    steps: [
      "解き終わった問題を選ぶ。",
      "代入、逆算、図やグラフとの照合など、使えそうな確認方法を一つ探す。",
      "結果が条件に合っているか確かめる。"
    ],
    note: "別の方法で確かめて矛盾がなくても、答えが必ず正しいとは限りません。",
    easyStart: "知っている確認方法を一つ試す。",
    extension: "いつもの見直しと比べてみる。",
    burden: 2,
    burdenNote: "1問につき数分。",
    check: "別の方法で何を確かめられた？ 新しい発見はあった？",
    videos: ["v8"],
    researchTags: ["verification", "metacognition"]
  },

  /* =====================================================
     ORANGE：他者の力を借りる（Learning with Others）
     ===================================================== */
  {
    id: "explain-with-peer",
    type: "change", category: "others", mode: "withOthers",
    title: "解き方を1分だけ説明し合う",
    catch: "友達に説明して、相手の反応から考え直す。",
    when: "解法を理解できているか、自信がないとき。",
    what: "自分の中だけで理解を確かめず、他者の反応を受けて考え直す。",
    steps: [
      "解いたことのある問題を一つ選ぶ。",
      "友達やクラスメイトに、解き方のポイントを説明する。",
      "質問や感想を一つもらい、必要なら説明を考え直す。"
    ],
    note: "相手の反応が少なかったときは、自分でも説明に詰まったところがなかったか振り返ってみましょう。",
    easyStart: "解き方全体ではなく、公式を使った理由など一部分だけ説明する。",
    burden: 2,
    burdenNote: "相手と1〜2分。休み時間や、一緒に勉強するときに。",
    check: "説明してみて、あいまいな部分や新しい気付きはあった？",
    videos: ["v4", "v5"],
    researchTags: ["peer-explanation", "mathematical-discourse"]
  },
  {
    id: "prepare-question",
    type: "change", category: "others", mode: "either",
    title: "わからないところを質問にしてみる",
    catch: "「わからない」を、人に伝えられる質問の形にする。",
    when: "わからないことがあるのに、何を質問すればよいかわからないとき。",
    what: "「わからない」で終わらせず、他者に伝えられる形にする。",
    steps: [
      "困ったところを一つ選ぶ。",
      "「ここまではわかるけれど、ここからがわからない」と言葉にする。",
      "友達や先生に質問し、説明を聞いた後、自分でも考え直す。"
    ],
    note: "質問できなかったとしても、失敗ではありません。質問の形にできたこと自体が前進です。",
    easyStart: "質問を一言メモしておく。実際に質問するのは後でもよい。",
    burden: 1,
    burdenNote: "質問を考えるだけなら1〜2分。",
    check: "自分の困り感や、次に考えるべきことがはっきりした？",
    videos: ["v4"],
    researchTags: ["help-seeking", "question-generation"]
  }
];
