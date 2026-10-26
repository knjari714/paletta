import os, sys, json, subprocess
HERE=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(HERE,"..",".."))
FIX=os.path.join(HERE,"fixtures")+"/"
OUT=os.path.join(HERE,"output")+"/"
os.makedirs(OUT,exist_ok=True)
BASE=os.environ.get("PALETTA_BASE","http://localhost:8765/")
URL=BASE+"public/"
from playwright.sync_api import sync_playwright
res=[]; errs=[]
def check(n,ok):
    res.append(ok); 
    if not ok: print("FAIL",n)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={"width":390,"height":700}); pg.on("pageerror",lambda e: errs.append(str(e)))
    W=lambda ms=300: pg.wait_for_timeout(ms)
    # ---- navi ----
    pg.goto(URL+"#/navi"); W()
    pg.click("button.choice >> nth=0"); pg.click("button.choice >> nth=1"); pg.click("button.choice >> nth=2")  # middle-c (has others)
    pg.click("[data-act=ask-next]"); pg.click("button.choice >> nth=1"); W()
    pg.click("[data-act=toggle-others]"); W()
    pg.locator(".others-list .card-item").scroll_into_view_if_needed(); W()
    y0=pg.evaluate("scrollY"); answers0=pg.evaluate("(()=>{const n=JSON.parse(sessionStorage.getItem('manabikata-navi'));return JSON.stringify([n.concernId,n.path,n.resultId,n.askSeen,n.timeIdx])})()")
    pg.click(".others-list .card-item"); W()
    check("card has primary+secondary", pg.locator("a.btn:has-text('これを試してみる')").count()==1 and pg.locator("[data-act=card-return]").count()==1)
    check("note text", "自分に合いそうな方法を、選び直してもOK。" in pg.inner_text("#view"))
    check("top back+home kept", pg.locator(".topbar .back").count()==1 and pg.locator(".topbar .home-btn").count()==1)
    bg1=pg.evaluate("getComputedStyle(document.querySelector('a.btn')).backgroundColor")
    bg2=pg.evaluate("getComputedStyle(document.querySelector('[data-act=card-return]')).backgroundColor")
    bd2=pg.evaluate("getComputedStyle(document.querySelector('[data-act=card-return]')).borderTopStyle")
    check("primary plum, secondary outline", bg1=="rgb(102, 85, 116)" and bg2=="rgb(255, 255, 255)" and bd2=="solid")
    pg.screenshot(path=OUT+"r_card.png",full_page=True)
    pg.click("[data-act=card-return]"); W(500)
    check("navi: back to result", pg.url.endswith("#/navi") and pg.locator(".link-answer").count()==1)
    check("navi: others still open", pg.is_visible(".others-list"))
    check("navi: scroll restored", abs(pg.evaluate("scrollY")-y0)<5)
    check("navi: answers intact", pg.evaluate("(()=>{const n=JSON.parse(sessionStorage.getItem('manabikata-navi'));return JSON.stringify([n.concernId,n.path,n.resultId,n.askSeen,n.timeIdx])})()")==answers0)
    # ---- library ----
    pg.goto(URL+"#/library"); W(); pg.click("button.chip.cat-math"); W()
    pg.locator(".card-item >> nth=6").scroll_into_view_if_needed(); W(); y1=pg.evaluate("scrollY")
    t=pg.locator(".card-item >> nth=6 >> h3").inner_text(); pg.click(".card-item >> nth=6"); W()
    check("library: opened card", pg.inner_text(".detail h1")==t)
    pg.click("[data-act=card-return]"); W(500)
    check("library: filter kept", "library" in pg.url and pg.locator(".card-item").count()==10 and pg.locator("button.chip.cat-math.on").count()==1)
    check("library: scroll restored", abs(pg.evaluate("scrollY")-y1)<5)
    # ---- note ----
    pg.evaluate("localStorage.clear(); sessionStorage.clear()")
    for cid in ["first-move","hide-one-step"]:
        pg.goto(URL+"#/card/"+cid); W(); pg.click("text=これを試してみる"); W(); pg.click("text=決めた"); W()
    plans0=pg.evaluate("localStorage.getItem('manabikata-note.v1')")
    pg.goto(URL+"#/note"); W()
    ents=pg.locator("details.entry")
    ents.nth(0).evaluate("d=>d.open=false"); ents.nth(1).evaluate("d=>d.open=true"); W()
    pg.locator("details.entry >> nth=1 >> text=方法を見る").click(); W()
    check("note: opened card", pg.inner_text(".detail h1")=="「最初の一手」だけ決める")
    pg.click("[data-act=card-return]"); W(500)
    st=pg.evaluate("[...document.querySelectorAll('details.entry')].map(d=>d.open)")
    check("note: open state restored", "note" in pg.url and st==[False,True])
    check("records untouched", pg.evaluate("localStorage.getItem('manabikata-note.v1')")==plans0)
    # ---- fallback (no origin) ----
    p2=b.new_page(); p2.goto(URL+"#/card/check-point"); p2.wait_for_timeout(300); p2.click("[data-act=card-return]"); p2.wait_for_timeout(300)
    check("fallback -> library", "library" in p2.url)
    # active card shows secondary too
    pg.goto(URL+"#/card/hide-one-step"); W()
    check("active card: secondary shown", pg.locator("[data-act=card-return]").count()==1 and "いま試しているところ" in pg.inner_text("#view"))
    b.close()
print("errors",errs); print(f"{sum(res)}/{len(res)} passed")
