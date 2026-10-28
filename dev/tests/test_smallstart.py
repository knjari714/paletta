"""Small Start β版のテスト（仕様書「13. 動作確認項目」に対応）"""
import os, json, re, subprocess
from playwright.sync_api import sync_playwright
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.abspath(os.path.join(HERE,"..",".."))
OUT=os.path.join(HERE,"output")+"/"; os.makedirs(OUT,exist_ok=True)
BASE=os.environ.get("PALETTA_BASE","http://localhost:8765/"); URL=BASE+"public/"
data=json.loads(subprocess.check_output(["node","-e","global.window={};['config','videos','cards','navi','reflect'].forEach(f=>require(process.argv[1]+'/public/data/'+f+'.js'));console.log(JSON.stringify({N:window.NAVI,C:window.CARDS,CFG:window.APP_CONFIG,R:window.REFLECT}))",ROOT]))
N,C,CFG,R=data["N"],data["C"],data["CFG"],data["R"]
byId={c["id"]:c for c in C}
SC=[c for c in C if c.get("type")=="start"]

# 仕様書の対応表（第6章）をそのまま書き写したもの。データがこれと一致することを確かめる
NUM={1:"start-rethink-study",2:"start-split-study",3:"start-set-goal",4:"start-change-timing",5:"start-change-load",6:"start-protect-rest"}
SPEC={ "time-packed":(1,2,3),"time-assignments":(1,3,2),"time-fragmented":(2,1,3),"time-irregular":(3,2,4),
       "energy-exhausted":(4,5,6),"energy-focus":(5,6,4),"energy-guilt":(6,5,3),
       "both-exhausted":(5,4,6),"both-assignments":(1,3,6),"both-balance":(6,1,5) }
Q2N={"start-time":4,"start-energy":3,"start-both":3}
plain=lambda t: re.sub(r"\*\*","",t)
def rich_texts(items):
    out=[]
    for it in items:
        if isinstance(it,str): out.append(plain(it))
        else: out+= [plain(x) for x in (it.get("ol") or it.get("ul") or [])]
    return out

res=[]; errs=[]
def check(g,name,ok):
    res.append((g,name,bool(ok)))
    if not ok: print(f"FAIL [{g}] {name}")
noscroll=lambda pg: pg.evaluate("document.documentElement.scrollWidth<=window.innerWidth")

with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(viewport={"width":390,"height":844},accept_downloads=True); pg=ctx.new_page()
    pg.on("pageerror",lambda e: errs.append(str(e)))
    W=lambda ms=200: pg.wait_for_timeout(ms)
    def go_start(page=None):
        # 「今の自分を見つめる」→「勉強したいけれど、時間や体力が足りない」
        page=page or pg
        page.click("[data-act=open-navi]"); page.wait_for_timeout(150)
        page.click("button.choice[data-id=no-time]"); page.wait_for_timeout(150)
    def fresh():
        pg.goto(URL+"#/home"); pg.evaluate("localStorage.clear(); sessionStorage.clear()"); pg.reload(); W(300)

    # ---------- 入口（v0.5.2〜：ホームには3機能のみ。Small Start は「今の自分を見つめる」の中から） ----------
    fresh()
    menu=pg.locator(".menu a b").all_inner_texts()
    check("entry","home has 3 functions only", menu==["今の自分を見つめる","ライブラリ","私の勉強法ノート"] and pg.locator("[data-act=open-start]").count()==0)
    q1=N["questions"]["start-q1"]
    # 「今の自分を見つめる」から
    pg.click("[data-act=open-navi]"); W()
    lbls=pg.locator("button.choice").all_inner_texts()
    check("entry","concern screen has Small Start enabled", any("時間や体力が足りない" in x for x in lbls) and pg.locator("button.choice[disabled]").count()==0)
    pg.click("button.choice >> nth=1"); W()
    check("entry","concern entry -> Q1", pg.inner_text("h2.q-title")==q1["text"] and pg.locator("button.choice").count()==3)
    check("entry","Q1 labels", pg.locator("button.choice").all_inner_texts()==[o["label"] for o in q1["options"]])
    check("nav","title Small Start", "Small Start" in pg.inner_text(".topbar .title"))
    pg.click("[data-act=navi-back]"); W()
    check("nav","Q1 back (from concern) -> concern screen", "気になっていること" in pg.inner_text("#view"))

    # ---------- Q2 と10分岐 ----------
    n=0
    for i1,o1 in enumerate(q1["options"]):
        q2=N["questions"][o1["goto"]]
        check("q2",f"{o1['goto']} has {Q2N[o1['goto']]} options", len(q2["options"])==Q2N[o1["goto"]])
        for i2,o2 in enumerate(q2["options"]):
            rid=o2["result"]
            fresh(); go_start(); pg.click(f"button.choice >> nth={i1}"); W(100)
            ok_q2 = pg.inner_text("h2.q-title")==q2["text"] and pg.locator("button.choice").count()==len(q2["options"])
            pg.click(f"button.choice >> nth={i2}"); W(150)
            shown=pg.locator(".card-item h3").all_inner_texts()
            exp=[byId[NUM[k]]["title"] for k in SPEC[rid]]
            check("branch",f"{rid}: Q2 ok, no ask/time, 3 cards in spec order", ok_q2 and pg.locator(".ask-text").count()==0 and shown==exp)
            check("branch",f"{rid}: data matches spec", N["results"][rid]["cards"]==[NUM[k] for k in SPEC[rid]])
            check("branch",f"{rid}: lead & answer shown", CFG["smallStart"]["resultLead"] in pg.inner_text("#view") and pg.inner_text(".link-answer")==o2["label"])
            check("branch",f"{rid}: no burden tag / no fit tag", pg.locator(".card-item .tag").count()==0)
            if n==0:
                pg.click("[data-act=navi-back]"); W()
                check("nav","result back -> Q2", pg.inner_text("h2.q-title")==q2["text"] and "前に選んだ答え" in pg.inner_text("#view"))
                pg.click("[data-act=navi-back]"); W()
                check("nav","Q2 back -> Q1", pg.inner_text("h2.q-title")==q1["text"])
            n+=1
    check("branch","10 branches", n==10)

    # ---------- カード6枚 ----------
    check("cards","6 Small Start cards", len(SC)==6)
    for c in SC:
        pg.goto(URL+"#/card/"+c["id"]); W(120)
        t=pg.inner_text(".detail")
        texts=[c["title"],plain(c["catch"]),plain(c["when"]),plain(c["easyStart"]),plain(c["reflectQ"])]+rich_texts(c["tryFirst"])+rich_texts(c["rethink"])+([plain(c["consult"])] if c.get("consult") else [])
        missing=[x for x in texts if x not in t]
        check("cards",f"{c['id']} body text", not missing)
        order=pg.evaluate("[...document.querySelectorAll('.detail .panel dt, .detail .panel .extra-label')].map(e=>e.textContent.trim())")
        exp=["こんなときに","まず試してみよう","ここまででもOK","仕組みを見直すなら","振り返りの問い"]+(["自分だけでは難しいときは"] if c.get("consult") else [])
        check("cards",f"{c['id']} section order", order==exp)
        check("cards",f"{c['id']} badge Small Start, no burden", "Small Start" in pg.inner_text(".detail-head") and pg.locator(".detail .tag").count()==0)
        check("cards",f"{c['id']} bold rendered", ("**" not in t))
    check("cards","consult only on 01/04/06", sorted(c["id"] for c in SC if c.get("consult"))==sorted([NUM[1],NUM[4],NUM[6]]))
    pg.goto(URL+"#/card/start-set-goal"); W()
    check("cards","card03 numbered steps", pg.locator(".detail dd.rich ol li").count()==3)
    pg.goto(URL+"#/card/start-change-load"); W()
    check("cards","card05 bullet list", pg.locator(".detail dd.rich ul li").count()==3)

    # ---------- 推薦 → カード → 推薦へ戻る ----------
    fresh(); go_start(); pg.click("button.choice >> nth=0"); pg.click("button.choice >> nth=2"); W()
    pg.click(".card-item >> nth=1"); W()
    pg.click("[data-act=card-return]"); W(400)
    check("nav","card -> back to recommendations (card-return)", pg.url.endswith("#/navi") and pg.locator(".card-item").count()==3)
    pg.click(".card-item >> nth=0"); W(); pg.click(".topbar .back"); W(400)
    check("nav","card -> back to recommendations (top back)", pg.locator(".card-item").count()==3)
    # 推薦 → ライブラリ（Small Start で絞り込み）→ カード → 一覧へ戻る
    pg.click("text=ほかの方法も見る（ライブラリ）"); W()
    check("library","from result -> library filtered Small Start", pg.locator(".card-item").count()==6 and pg.locator("button.kind-chip.on").inner_text().startswith("Small Start"))
    pg.click(".card-item >> nth=4"); W(); pg.click("[data-act=card-return]"); W(400)
    check("library","card -> back to library (filter kept)", "library" in pg.url and pg.locator(".card-item").count()==6)
    # ライブラリの切り替え
    pg.click("button.kind-chip[data-v=all]"); W()
    check("library","all = 27", pg.locator(".card-item").count()==27)
    pg.click("button.kind-chip[data-v=change]"); W()
    check("library","Small Change = 21, 3-color chips kept", pg.locator(".card-item").count()==21 and pg.locator("button.chip.cat-chip").count()==3)
    pg.click("button.chip.cat-math"); W()
    check("library","math filter = 10", pg.locator(".card-item").count()==10)
    pg.click("button.kind-chip[data-v=start]"); W()
    check("library","Small Start = 6, no 3-color chips", pg.locator(".card-item").count()==6 and pg.locator("button.chip.cat-chip").count()==0)
    check("library","no h-scroll", noscroll(pg))

    # ---------- 記録（メモ空欄でもOK） ----------
    fresh(); go_start(); pg.click("button.choice >> nth=1"); pg.click("button.choice >> nth=0"); W()
    pg.click(".card-item >> nth=0"); W(); pg.click("text=これを試してみる"); W()
    check("record","plan page: scene input, no subject chips", pg.locator("#plan-scene").count()==1 and pg.locator("button.chip").count()==0 and CFG["smallStart"]["sceneLabel"] in pg.inner_text("#view"))
    check("record","placeholder", pg.get_attribute("#plan-scene","placeholder")==CFG["smallStart"]["scenePlaceholder"])
    pg.click("text=決めた"); W()
    check("record","go screen", "では、試してみよう。" in pg.inner_text("#view") and "授業や宿題、毎日の生活" in pg.inner_text("#view"))
    st=pg.evaluate("JSON.parse(localStorage.getItem('manabikata-note.v1'))")
    pl=st["plans"][-1]
    check("record","saved with empty memo", pl["type"]=="start" and pl["scene"]=="" and pl["cardId"]=="start-change-timing" and pl["resultId"]=="energy-exhausted" and len(pl["answers"])==2)
    pg.reload(); W(300)
    check("record","persists after reload", "勉強するタイミングを変えてみる" in pg.inner_text("#view") or pg.evaluate("JSON.parse(localStorage.getItem('manabikata-note.v1')).plans.length")==1)
    # メモありで別のカード（区切りになる）
    pg.goto(URL+"#/card/start-protect-rest"); W(); pg.click("text=これを試してみる"); W()
    pg.fill("#plan-scene","部活動が休みの日に"); pg.click("text=決めた"); W()
    check("record","memo shown on go screen", "試す場面：部活動が休みの日に" in pg.inner_text("#view"))
    pg.goto(URL+"#/home"); W()
    check("record","home shows active plan with scene", "休む時間を先に確保する" in pg.inner_text(".active-plan") and "部活動が休みの日に" in pg.inner_text(".active-plan"))

    # ---------- 振り返り ----------
    pg.click("text=試したので振り返る"); W()
    v=pg.inner_text("#view")
    check("reflect","Small Start questions", R["start"]["tried"]["text"] in v and R["start"]["fit"]["text"] in v)
    check("reflect","SS options", pg.locator("button.choice").all_inner_texts()==[o["label"] for o in R["start"]["tried"]["options"]]+[o["label"] for o in R["start"]["fit"]["options"]])
    check("reflect","no SC questions", all(x not in v for x in ["続けやすさ","手ごたえ","次はどうしますか"]))
    pg.click("button.choice:has-text('まだ試せなかった')"); W()
    check("reflect","no reasons when not tried", pg.locator("[data-act=r-reason]").count()==0)
    check("reflect","save disabled until fit chosen", pg.locator("[data-act=r-save]").is_disabled())
    pg.click("button.choice:has-text('まだわからない')"); W()
    check("reflect","save enabled with notyet + unsure (memo empty)", not pg.locator("[data-act=r-save]").is_disabled())
    pg.click("[data-act=r-save]"); W()
    check("reflect","after: 3 next options", pg.locator("[data-act=start-next]").all_inner_texts()==[o["label"] for o in R["start"]["next"]["options"]])
    pg.click("[data-act=start-next][data-v=continue]"); W()
    st=pg.evaluate("JSON.parse(localStorage.getItem('manabikata-note.v1'))"); pl=st["plans"][-1]
    check("reflect","continue keeps active, record ok", st["activePlanId"]==pl["id"] and pl["reflections"][-1]=={**pl["reflections"][-1],"kind":"start","done":"notyet","fit":"unsure","next":"continue"})
    # 2回目：試せた・合っていそう・ひとこと → 別の方法を見る
    pg.click("text=試したので振り返る"); W()
    pg.click("button.choice:has-text('少し試せた')"); pg.click("button.choice:has-text('合っていそう')")
    pg.fill("#r-note","寝る時刻が少し早くなった"); pg.click("[data-act=r-save]"); W()
    pg.click("[data-act=start-next][data-v=other]"); W(400)
    # このカードはカードのURLから直接選んだので、推薦結果がない → ライブラリの Small Start へ
    check("reflect","other (no recommendation) -> library Small Start", "library" in pg.url and pg.locator(".card-item").count()==6)
    st=pg.evaluate("JSON.parse(localStorage.getItem('manabikata-note.v1'))")
    check("reflect","other closes plan", st["activePlanId"] is None and st["plans"][-1]["closedReason"]=="other")
    # 推薦から選んだカードなら、前回の推薦へ戻る
    pg.goto(URL+"#/home"); W(); go_start(); pg.click("button.choice >> nth=2"); pg.click("button.choice >> nth=0"); W()
    pg.click(".card-item >> nth=0"); pg.click("text=これを試してみる"); pg.click("text=決めた"); W()
    pg.goto(URL+"#/home"); W(); pg.click("text=試したので振り返る"); pg.click("button.choice:has-text('試せた') >> nth=0"); pg.click("button.choice:has-text('まだわからない')"); pg.click("[data-act=r-save]"); W()
    pg.click("[data-act=start-next][data-v=other]"); W(400)
    check("reflect","other (from recommendation) -> previous recommendations", pg.url.endswith("#/navi") and pg.locator(".card-item h3").all_inner_texts()==[byId[NUM[k]]["title"] for k in SPEC["both-exhausted"]])
    # 終了する
    pg.goto(URL+"#/card/start-split-study"); W(); pg.click("text=これを試してみる"); pg.click("text=決めた"); W()
    pg.goto(URL+"#/home"); W(); pg.click("text=試したので振り返る"); pg.click("button.choice:has-text('試せた') >> nth=0"); pg.click("button.choice:has-text('合わなさそう')"); pg.click("[data-act=r-save]"); W()
    pg.click("[data-act=start-next][data-v=pause]"); W(300)
    check("reflect","pause -> note, closed", pg.url.endswith("#/note") and pg.evaluate("JSON.parse(localStorage.getItem('manabikata-note.v1')).activePlanId")==None)
    # ノートの表示
    for el in pg.query_selector_all("details.entry"): el.evaluate("e=>e.open=true")
    nt=pg.inner_text("#view")
    check("note","SS reflections shown with SS labels", "試せた？" in nt and "合っていそう？" in nt and "寝る時刻が少し早くなった" in nt and "部活動が休みの日に" in nt and nt.count("Small Start")>=3)
    check("note","no SC labels for SS", "続けやすさ" not in nt and "手ごたえ" not in nt)
    pg.screenshot(path=OUT+"ss_note.png",full_page=True)

    # ---------- 書き出し・読み込み ----------
    pg.goto(URL+"#/data"); W()
    with pg.expect_download() as d: pg.click("text=記録をファイルに書き出す")
    d.value.save_as(OUT+"ss-export.json"); ex=json.load(open(OUT+"ss-export.json"))
    check("export","export has SS plans with fields", sum(1 for x in ex["plans"] if x.get("type")=="start")==4 and any(x.get("scene")=="部活動が休みの日に" for x in ex["plans"]))
    c2=b.new_context(viewport={"width":390,"height":844}); p2=c2.new_page(); p2.on("pageerror",lambda e: errs.append("p2:"+str(e)))
    for f in [os.path.join(HERE,"fixtures","v0.3-export.json"), OUT+"ss-export.json", OUT+"ss-export.json"]:
        p2.goto(URL+"#/data"); p2.wait_for_timeout(150); p2.set_input_files("#import-file",f); p2.wait_for_timeout(300)
    st2=p2.evaluate("JSON.parse(localStorage.getItem('manabikata-note.v1'))")
    ss2=[x for x in st2["plans"] if x.get("type")=="start"]
    check("import","SS records kept after import (no dup) + old SC records", len(ss2)==4 and len(st2["plans"])==4+2 and any(r.get("fit")=="fit" for x in ss2 for r in x["reflections"]))
    p2.goto(URL+"#/note"); p2.wait_for_timeout(300)
    check("import","note renders mixed records", p2.locator("details.entry").count()==6)
    c2.close()

    # ---------- Small Change は従来どおり（SS 記録と同居） ----------
    pg.goto(URL+"#/card/first-move"); W(); pg.click("text=これを試してみる"); W()
    check("sc","SC plan page keeps subject chips", pg.locator("button.chip").count()>=7 and pg.locator("#plan-scene").count()==0)
    pg.click("text=決めた"); W()
    check("sc","SC go screen unchanged", "では、実際の勉強へ。" in pg.inner_text("#view"))
    pg.goto(URL+"#/home"); W(); pg.click("text=試したので振り返る"); W()
    pg.click("button.choice:has-text('試せた') >> nth=0"); W()
    v=pg.inner_text("#view")
    check("sc","SC reflection unchanged", "続けやすさはどうでしたか？" in v and "勉強の手ごたえに、変化はありましたか？" in v and "次はどうしますか？" in v)
    pg.click("button.choice:has-text('試せなかった')"); W()
    check("sc","SC reasons still shown", pg.locator("[data-act=r-reason]").count()==5)

    # ---------- 表示（スマホ・PC・ダーク） ----------
    for vw,vh,name in [(360,780,"sp360"),(1280,900,"pc")]:
        c3=b.new_context(viewport={"width":vw,"height":vh}); p3=c3.new_page(); p3.on("pageerror",lambda e: errs.append("p3:"+str(e)))
        p3.goto(URL); p3.wait_for_timeout(300)
        ok=noscroll(p3)
        go_start(p3); p3.click("button.choice >> nth=2"); p3.click("button.choice >> nth=1"); p3.wait_for_timeout(300); ok=ok and noscroll(p3)
        p3.screenshot(path=OUT+f"ss_result_{name}.png",full_page=True)
        p3.click(".card-item >> nth=0"); p3.wait_for_timeout(300); ok=ok and noscroll(p3)
        p3.screenshot(path=OUT+f"ss_card_{name}.png",full_page=True)
        check("layout",f"no h-scroll {name}", ok)
        c3.close()
    c4=b.new_context(viewport={"width":390,"height":844},color_scheme="dark",device_scale_factor=2); p4=c4.new_page()
    p4.goto(URL+"#/card/start-rethink-study"); p4.wait_for_timeout(400); p4.screenshot(path=OUT+"ss_card_dark.png",full_page=True)
    p4.goto(URL); p4.wait_for_timeout(400); p4.screenshot(path=OUT+"ss_home_dark.png",full_page=True)
    c4.close()
    b.close()

print("page errors:",errs)
groups={}
for g,n_,ok in res: groups.setdefault(g,[0,0]); groups[g][0]+=ok; groups[g][1]+=1
for g,(a,t) in groups.items(): print(f"  {g:8s} {a}/{t}")
print(f"{sum(1 for r in res if r[2])}/{len(res)} passed")
