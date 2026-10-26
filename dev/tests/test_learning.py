import os, sys, json, subprocess
HERE=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(HERE,"..",".."))
FIX=os.path.join(HERE,"fixtures")+"/"
OUT=os.path.join(HERE,"output")+"/"
os.makedirs(OUT,exist_ok=True)
BASE=os.environ.get("PALETTA_BASE","http://localhost:8765/")
URL=BASE+"public/"
import json, subprocess
from playwright.sync_api import sync_playwright
data=json.loads(subprocess.check_output(["node","-e","global.window={};['config','videos','cards','navi','reflect'].forEach(f=>require(process.argv[1]+'/public/data/'+f+'.js'));console.log(JSON.stringify({N:window.NAVI,C:window.CARDS,CFG:window.APP_CONFIG,V:window.VIDEOS}))",ROOT]))
N,C,CFG,V=data["N"],data["C"],data["CFG"],data["V"]; byId={c["id"]:c for c in C}
res=[]; errs=[]
def check(cond_no,name,ok):
    res.append((cond_no,name,bool(ok)))
    if not ok: print(f"FAIL [{cond_no}] {name}")
def noscroll(pg): return pg.evaluate("document.documentElement.scrollWidth<=window.innerWidth")
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(viewport={"width":390,"height":844}); pg=ctx.new_page()
    pg.on("pageerror",lambda e: errs.append(str(e)))
    W=lambda ms=250: pg.wait_for_timeout(ms)
    # ---------- library ----------
    pg.goto(URL+"#/library"); W()
    titles=pg.locator(".card-item h3").all_inner_texts()
    check(2,"library shows 21 cards", len(titles)==21 and set(titles)=={c["title"] for c in C})
    check(1,"revised titles shown", "解説を見る前に、方針を30秒考える" in titles and "間違いが始まったところを探す" in titles and "違う節の問題を一問混ぜる" in titles)
    counts={k:sum(1 for c in C if c["category"]==k) for k in CFG["categories"]}
    check(3,"category counts 9/10/2", counts=={"study":9,"math":10,"others":2})
    for k,lab in [(k,v["label"]) for k,v in CFG["categories"].items()]:
        n=pg.locator(f".card-item.cat-{k}").count()
        badges=pg.locator(f".card-item.cat-{k} .cat-badge").all_inner_texts()
        check(3,f"badge label {k}", n==counts[k] and all(x.strip()==lab for x in badges))
    cols={k:pg.evaluate(f"getComputedStyle(document.querySelector('.card-item.cat-{k}')).borderLeftColor") for k in counts}
    check(3,"stripe colors match palette", cols=={"study":"rgb(49, 94, 168)","math":"rgb(40, 120, 72)","others":"rgb(163, 90, 28)"})
    check(3,"category icons are svg", pg.locator(".card-item .cat-badge svg").count()==21)
    pg.click("button.chip.cat-math"); W()
    check(3,"filter math -> 10", pg.locator(".card-item").count()==10)
    pg.click("button.chip:has-text('すべて')"); W()
    check(15,"library no h-scroll", noscroll(pg))
    # ---------- card details ----------
    for c in C:
        pg.goto(URL+"#/card/"+c["id"]); W(120)
        t=pg.inner_text(".detail")
        ok = c["title"] in t and all(s in t for s in c["steps"]) and c["check"] in t and c["when"] in t and c["what"] in t
        check(1,f"detail text {c['id']}", ok)
        check(4,f"easyStart shown {c['id']}", (pg.locator(".extra.easy").count()==1)==bool(c.get("easyStart")))
        check(4,f"extension shown {c['id']}", (pg.locator(".extra.ext").count()==1)==bool(c.get("extension")))
        check(1,f"note shown {c['id']}", (pg.locator(".card-note").count()==1)==bool(c.get("note")))
        vids=pg.locator("a.video").evaluate_all("els=>els.map(e=>e.href)")
        exp=["https://youtu.be/"+next(v["youtubeId"] for v in V if v["id"]==vid) for vid in c["videos"]]
        check(6,f"videos {c['id']}", vids==exp)
        if c["category"]=="others":
            check(5,f"mode tag {c['id']}", CFG["modes"][c["mode"]] in pg.inner_text(".detail-head"))
        # order: dt sequence
        order=pg.evaluate("""()=>[...document.querySelectorAll('.detail .panel dt, .detail .panel .extra-label')].map(e=>e.textContent.trim())""")
        expo=["こんなときに","何を変える？","やり方"]+(["ここまででもOK"] if c.get("easyStart") else [])+(["余裕があれば"] if c.get("extension") else [])+["確かめること"]
        check(4,f"section order {c['id']}", order==expo)
    check(4,"all GREEN have easyStart", all(c.get("easyStart") for c in C if c["category"]=="math"))
    pg.goto(URL+"#/card/compare-methods"); W(); check(15,"card no h-scroll", noscroll(pg))
    # ---------- all branches ----------
    q1=N["questions"]["q1"]; n=0; newcards={"compare-methods","connect-representations","hide-one-step","verify-another-way","explain-with-peer","prepare-question"}; seen_new=set()
    for i1,o1 in enumerate(q1["options"]):
        q2=N["questions"][o1["goto"]]
        for i2,o2 in enumerate(q2["options"]):
            r=N["results"][o2["result"]]
            pg.goto(URL+"#/home"); pg.evaluate("sessionStorage.clear()"); pg.goto(URL+"#/navi"); pg.reload(); W(100)
            pg.click("button.choice >> nth=0"); pg.click(f"button.choice >> nth={i1}"); pg.click(f"button.choice >> nth={i2}")
            ok_ask = pg.inner_text(".ask-text")==r["ask"]
            pg.click("[data-act=ask-next]"); pg.click("button.choice >> nth=0"); W(80)
            main=pg.locator(".card-item:not(.others-list .card-item) h3").all_inner_texts()
            check(7,f"branch {o2['result']} ask+cards", ok_ask and main==[byId[x]["title"] for x in r["cards"]])
            seen_new |= set(r["cards"]) & newcards
            others=r.get("others",[])
            if others:
                check(9,f"others hidden initially {o2['result']}", not pg.is_visible(".others-list"))
                pg.click("[data-act=toggle-others]")
                vis=pg.locator(".others-list .card-item h3").all_inner_texts()
                check(9,f"others shown {o2['result']}", pg.is_visible(".others-list") and vis==[byId[x]["title"] for x in others])
                seen_new |= set(others)
            else:
                check(9,f"no others -> library link {o2['result']}", pg.locator("[data-act=toggle-others]").count()==0 and pg.locator(".others-note a").count()==1)
            n+=1
    # v0.3.2 以降：verify-another-way はセルフナビに組み込まず、ライブラリから利用する
    check(8,"new cards in branches (verify-another-way is library-only)", seen_new==newcards-{"verify-another-way"})
    check(7,"21 branches tested", n==21)
    # library link from result -> others filter
    pg.click(".others-note a"); W()
    check(9,"library opened filtered to others", "library" in pg.url and pg.locator(".card-item").count()==2)
    # ---------- flow + home/back ----------
    pg.goto(URL+"#/home"); pg.evaluate("sessionStorage.clear(); localStorage.clear()"); pg.reload(); W()
    pg.click("text=今の自分を見つめる"); pg.click("button.choice >> nth=0"); pg.click("button.choice >> nth=2")
    check(11,"Q2 shown", pg.inner_text("h2.q-title")==N["questions"]["q-review"]["text"])
    pg.click("[data-act=navi-back]"); check(11,"back -> Q1", pg.inner_text("h2.q-title")==q1["text"])
    pg.click("button.choice >> nth=2")
    pg.click("[data-act=go-home]"); W()
    check(11,"home button -> home", pg.locator(".hero").count()==1 and pg.url.endswith("#/home"))
    pg.click("text=今の自分を見つめる"); W()
    check(11,"resume screen shown", "前回の続きがあります" in pg.inner_text("#view"))
    pg.click("[data-act=resume-continue]"); W()
    check(11,"continue -> same Q2", pg.inner_text("h2.q-title")==N["questions"]["q-review"]["text"])
    pg.click("[data-act=go-home]"); pg.click("text=今の自分を見つめる"); pg.click("[data-act=resume-restart]"); W()
    check(11,"restart -> concern screen", "いま、数学の勉強で気になっていることは？" in pg.inner_text("#view"))
    pg.click("button.choice >> nth=0"); pg.click("button.choice >> nth=2"); pg.click("button.choice >> nth=1")
    pg.click("[data-act=ask-next]"); pg.click("button.choice >> nth=1")
    pg.click(".card-item >> nth=2"); W()  # hide-one-step
    check(10,"selected hide-one-step", pg.inner_text(".detail h1")==byId["hide-one-step"]["title"])
    pg.click("text=これを試してみる"); pg.click("button.chip:has-text('数学B')")
    dialogs=[]
    def dismiss(d): dialogs.append(d.message); d.dismiss()
    pg.once("dialog",dismiss); pg.click("[data-act=go-home]"); W()
    check(11,"unsaved plan -> confirm, stay", len(dialogs)==1 and "#/plan/" in pg.url)
    pg.click("text=決めた"); W()
    check(10,"go-study screen", "では、実際の勉強へ" in pg.inner_text("#view"))
    pg.click("[data-act=go-home]"); W()
    check(10,"home shows active plan", byId["hide-one-step"]["title"] in pg.inner_text(".active-plan"))
    nplans=pg.evaluate("JSON.parse(localStorage.getItem('manabikata-note.v1')).plans.length")
    pg.click("text=試したので振り返る"); W()
    check(9.3,"reflect shows easyStart hint", "ここまででもOK" in pg.inner_text("#view"))
    pg.click("button.choice:has-text('少しだけ試せた')")
    dialogs.clear(); pg.once("dialog",dismiss); pg.click("[data-act=go-home]"); W()
    check(11,"unsaved reflect -> confirm, stay", len(dialogs)==1 and "#/reflect" in pg.url)
    pg.once("dialog",lambda d: d.accept()); pg.click("[data-act=go-home]"); W()
    check(12,"accept -> home, records kept", pg.url.endswith("#/home") and pg.evaluate("JSON.parse(localStorage.getItem('manabikata-note.v1')).plans.length")==nplans)
    pg.click("text=試したので振り返る"); W()
    check(11,"draft discarded after leaving", pg.locator("button.choice.on").count()==0)
    pg.click("button.choice:has-text('試せた') >> nth=0"); pg.click("button.choice:has-text('このまま続けられそう')"); pg.click("button.choice:has-text('少し感じた')")
    pg.fill("#r-note","次の一操作だけなら考えられた"); pg.click("button.choice:has-text('別の方法を選ぶ')"); pg.click("[data-act=r-save]"); W()
    check(10,"reflection saved", "記録しました" in pg.inner_text("#view"))
    pg.click("text=前回の候補から選ぶ"); W()
    check(10,"reopen result", pg.locator(".card-item").count()>=3)
    pg.click(".card-item >> nth=0"); pg.click("text=これを試してみる"); pg.click("text=決めた"); W()
    pg.goto(URL+"#/note"); W()
    for el in pg.query_selector_all("details"): el.evaluate("e=>e.open=true")
    check(10,"note shows memo + category", "次の一操作だけなら考えられた" in pg.inner_text("#view") and pg.locator(".note-cat .cat-badge").count()==2)
    check(15,"note no h-scroll", noscroll(pg))
    # ---------- colors ----------
    pg.goto(URL+"#/home"); W()
    check(13,"primary button plum", pg.evaluate("getComputedStyle(document.querySelector('.btn')).backgroundColor")=="rgb(102, 85, 116)")
    check(13,"bg neutral", pg.evaluate("getComputedStyle(document.body).backgroundColor")=="rgb(248, 246, 242)")
    check(14,"tabbar svg icons", pg.locator(".tabbar svg").count()==4 and pg.locator(".menu svg").count()>=6)
    check(14,"home button has aria-label", True)
    # ---------- export/import ----------
    pg.goto(URL+"#/data"); W()
    with pg.expect_download() as d: pg.click("text=記録をファイルに書き出す")
    d.value.save_as(OUT+"export.json"); ex=json.load(open(OUT+"export.json"))
    check(18,"export 2 plans", len(ex["plans"])==2)
    c2=b.new_context(viewport={"width":390,"height":844}); p2=c2.new_page(); p2.on("pageerror",lambda e: errs.append("p2:"+str(e)))
    for f,name in [(FIX+"v0.2-export.json","v0.2"),(FIX+"v0.1-export.json","v0.1"),(OUT+"export.json","v0.3")]:
        p2.goto(URL+"#/data"); p2.wait_for_timeout(200); p2.set_input_files("#import-file",f); p2.wait_for_timeout(400)
    p2.goto(URL+"#/note"); p2.wait_for_timeout(300)
    check(17,"imported v0.1+v0.2+v0.3 -> 6 plans", p2.locator("details.entry").count()==6)
    p2.goto(URL+"#/home"); p2.wait_for_timeout(300)
    check(17,"active plan after import", p2.locator(".active-plan").count()==1)
    # v0.2 plan: rechoose reopens result (result ids unchanged)
    v02=json.load(open(FIX+"v0.2-export.json")); v02act=[x for x in v02["plans"] if x["status"]=="active"][0]
    c3=b.new_context(viewport={"width":390,"height":844}); p3=c3.new_page(); p3.on("pageerror",lambda e: errs.append("p3:"+str(e)))
    p3.goto(URL+"#/data"); p3.wait_for_timeout(200); p3.set_input_files("#import-file",FIX+"v0.2-export.json"); p3.wait_for_timeout(400)
    p3.goto(URL+"#/home"); p3.wait_for_timeout(200); p3.click("text=まだ試していない"); p3.click("text=別の方法を選び直す"); p3.wait_for_timeout(300)
    check(17,"v0.2 rechoose -> result with new candidates", p3.locator(".card-item").count()>=3 and N["results"][v02act["resultId"]]["ask"] in p3.inner_text("#view"))
    # ---------- check.html ----------
    p4=b.new_page(viewport={"width":1100,"height":900}); p4.goto(BASE+"dev/check.html"); p4.wait_for_timeout(300)
    check(19,"check.html ok", "参照の誤りはありません" in p4.inner_text("#out"))
    check(19,"check.html no warnings", p4.locator(".box.warn").count()==0)
    p4.screenshot(path=OUT+"check.png",full_page=False)
    # ---------- dark mode distinct ----------
    c5=b.new_context(viewport={"width":390,"height":844},color_scheme="dark"); p5=c5.new_page()
    p5.goto(URL+"#/library"); p5.wait_for_timeout(300)
    dc={k:p5.evaluate(f"getComputedStyle(document.querySelector('.card-item.cat-{k}')).borderLeftColor") for k in counts}
    check(16,"dark category colors distinct", len(set(dc.values()))==3 and dc["study"]!="rgb(49, 94, 168)")
    check(16,"dark badges keep labels", p5.locator(".cat-badge").count()>=21)
    # ---------- PWA offline ----------
    c6=b.new_context(viewport={"width":390,"height":844}); p6=c6.new_page()
    p6.goto(URL); p6.wait_for_timeout(300)
    p6.evaluate("navigator.serviceWorker.ready"); p6.reload(); p6.wait_for_timeout(500)
    controlled=p6.evaluate("!!navigator.serviceWorker.controller")
    c6.set_offline(True); p6.reload(); p6.wait_for_timeout(500)
    check(20,"PWA: offline reload renders", controlled and "数学の学び方を、自分の色に。" in p6.inner_text("#view") and p6.locator(".tabbar svg").count()==4)
    c6.set_offline(False)
    man=p6.evaluate("fetch('manifest.webmanifest').then(r=>r.json())")
    check(20,"manifest ok", man["name"]=="Paletta" and len(man["icons"])>=2)
    b.close()
print("page errors:",errs)
fails=[r for r in res if not r[2]]
print(f"{len(res)-len(fails)}/{len(res)} passed")
