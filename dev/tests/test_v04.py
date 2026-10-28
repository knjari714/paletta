"""v0.4.0 β で追加・変更した部分のテスト（案内ページ・お問い合わせ・名称・PWA・公開ファイル）"""
import os, json, re, subprocess, datetime
from playwright.sync_api import sync_playwright
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.abspath(os.path.join(HERE,"..",".."))
FIX=os.path.join(HERE,"fixtures")+"/"; OUT=os.path.join(HERE,"output")+"/"; os.makedirs(OUT,exist_ok=True)
BASE=os.environ.get("PALETTA_BASE","http://localhost:8765/"); URL=BASE+"public/"
CFG=json.loads(subprocess.check_output(["node","-e","global.window={};require(process.argv[1]+'/public/data/config.js');console.log(JSON.stringify(window.APP_CONFIG))",ROOT]))
FORM=CFG["contactUrl"]
PAGES=["howto.html","terms.html","privacy.html"]
OLD=re.compile(r"学び方ノート|仮称|試作版")
res=[]; errs=[]
def check(group,name,ok):
    res.append((group,name,bool(ok)))
    if not ok: print(f"FAIL [{group}] {name}")
def lum(rgb):
    r,g,b=[int(x)/255 for x in re.findall(r"\d+",rgb)[:3]]
    f=lambda c: c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
def contrast(a,b):
    la,lb=sorted([lum(a),lum(b)],reverse=True); return (la+0.05)/(lb+0.05)
def noscroll(pg): return pg.evaluate("document.documentElement.scrollWidth<=window.innerWidth")

with sync_playwright() as p:
    b=p.chromium.launch()
    def fake_google(route):
        route.fulfill(status=200, content_type="text/html", body="<title>form</title>ok")
    # ---------- 公開ファイル構成 ----------
    pg=b.new_page()
    for path,exp in [("public/check.html",404),("public/README.md",404),("public/index.html",200)]:
        r=pg.goto(BASE+path); check("files",f"{path} -> {exp}", r.status==exp)
    check("files","netlify publish=public", 'publish = "public"' in open(ROOT+"/netlify.toml").read())
    # ---------- 案内ページ ----------
    for vw in (360,390):
        ctx=b.new_context(viewport={"width":vw,"height":800}); pg=ctx.new_page(); pg.on("pageerror",lambda e: errs.append(str(e)))
        ctx.route("https://docs.google.com/**",fake_google)
        for f in PAGES:
            r=pg.goto(URL+f); pg.wait_for_timeout(150)
            check("pages",f"{f} opens directly ({vw})", r.status==200)
            check("pages",f"{f} no h-scroll ({vw})", noscroll(pg))
            if vw==390:
                check("pages",f"{f} back link to app", pg.locator("a[data-back-to-app]").get_attribute("href")=="./" and "Palettaに戻る" in pg.inner_text(".page-top"))
                hrefs=pg.locator(".page-foot nav a").evaluate_all("els=>els.map(e=>e.getAttribute('href'))")
                check("pages",f"{f} footer links", all(x in hrefs for x in PAGES+["./",FORM]))
                c=pg.locator(".page-foot a[data-contact]")
                check("contact",f"{f} contact new tab", c.get_attribute("target")=="_blank" and "noopener" in c.get_attribute("rel") and c.get_attribute("href")==FORM)
                ids=pg.evaluate("[...document.querySelectorAll('.toc a')].map(a=>a.getAttribute('href').slice(1))")
                check("pages",f"{f} toc anchors resolve", all(pg.locator(f"#{i}").count()==1 for i in ids))
                check("pages",f"{f} meta shows version/date", (CFG["version"] in pg.inner_text("body")) and (f=="howto.html" or ("制定日：2026年11月2日" in pg.inner_text("main") and "【公開日】" not in pg.inner_text("main"))))
                check("footer",f"{f} footer credit", "Produced & Operated by Kenji ARAI" in pg.inner_text(".page-foot") and "開発・運営" not in pg.inner_text(".page-foot"))
                check("names",f"{f} no old names", not OLD.search(pg.inner_text("body")) and "Paletta" in pg.title())
        # TOC click scrolls to section
        pg.goto(URL+"howto.html"); pg.click(".toc a[href='#small-change']"); pg.wait_for_timeout(1200)
        check("pages",f"toc jump ({vw})", pg.url.endswith("#small-change") and pg.evaluate("Math.abs(document.getElementById('small-change').getBoundingClientRect().top)<60"))
        ctx.close()
    # 内容チェック（原稿の要素）
    pg=b.new_page(); pg.goto(URL+"howto.html")
    t=pg.inner_text("main")
    for s in ["数学の学び方を、自分の色に。","Palettaでできること","基本の使い方","Small Changeって何？","私の勉強法ノートの使い方","学習記録について","よくある質問","先生・保護者の方へ","Paletta β版について","続けやすさ","手ごたえ","ここまででもOK"]:
        check("howto",f"has '{s}'", s in t)
    check("howto","STEP2 mentions 決めた", "「決めた」を押すと、その方法が自分の勉強法ノートに記録されます" in t)
    check("howto","STEP4 uses 続けやすさ", "取り組みやすかったか" not in t and "「続けやすさ」や「手ごたえ」" in t)
    check("files","no HTML comments in public pages", all("<!--" not in open(ROOT+"/public/"+f).read() for f in PAGES))
    check("howto","Small Start section & mentions", "ホーム画面の「Small Start」" not in t and all(x in t for x in ["「今の自分を見つめる」で「勉強したいけれど、時間や体力が足りない」を選び","Small Startって何？","時間や体力が足りないときに、今ある学習や生活の進め方を少し見直す機能","「試してみたか」と「今の自分に合っていそうか」","Small Change）と、時間や体力が足りないときの工夫（Small Start）"]))
    check("howto","sections renumbered 1-9", [h.split(".")[0] for h in pg.locator("main h2 .num").all_inner_texts()]==[str(i) for i in range(1,10)])
    check("howto","4 steps", pg.locator(".steps > li").count()==4 and pg.locator(".steps .si svg").count()==4)
    check("howto","3 color samples", [pg.evaluate(f"getComputedStyle(document.querySelector('.cat-sample.cat-{k}')).borderLeftColor") for k in ("study","math","others")]==["rgb(49, 94, 168)","rgb(40, 120, 72)","rgb(163, 90, 28)"])
    check("howto","beta section has contact link", pg.locator("#beta ~ p a[data-contact], section[aria-labelledby=beta] a[data-contact]").count()>=1)
    # FAQ：7問・キーボードで開閉
    check("faq","7 questions", pg.locator(".faq details").count()==7)
    pg.locator(".faq summary").first.focus(); pg.keyboard.press("Enter"); pg.wait_for_timeout(100)
    o1=pg.evaluate("document.querySelector('.faq details').open"); pg.keyboard.press("Enter"); pg.wait_for_timeout(100)
    o2=pg.evaluate("document.querySelector('.faq details').open")
    check("faq","keyboard toggles", o1 and not o2)
    # Tab でリンクに到達できる
    pg.goto(URL+"howto.html"); pg.keyboard.press("Tab")
    check("a11y","first Tab -> back link", pg.evaluate("document.activeElement.hasAttribute('data-back-to-app')"))
    pg.goto(URL+"terms.html")
    tt=pg.inner_text("main")
    heads=pg.locator("main h2").all_inner_texts()
    check("terms","9 headings in order", [re.sub(r"^\d+\.","",h) for h in heads]==["概要","運営者情報","利用について","学習記録について","著作権・利用範囲","禁止事項","免責事項","サービスおよび規約の変更","準拠法"])
    check("terms","operator & date", "新井健使" in tt and "2026年11月2日" in tt and "【公開日】" not in tt and "個人開発・個人運営" in tt)
    pg.goto(URL+"privacy.html"); pt=pg.inner_text("main")
    check("privacy","google forms reflected", "Googleフォーム" in pt and "Netlify Forms" not in pt)
    check("privacy","google policy link", pg.locator("a[href='https://policies.google.com/privacy?hl=ja']").count()>=1)
    check("privacy","localStorage/sessionStorage/SW", all(s in pt for s in ["localStorage","sessionStorage","Service Worker"]))
    check("privacy","no over-broad claim", "一切取得しない" not in pt)
    check("privacy","v0.5.1 list items", all(x in pt for x in ["学習する科目や教材、工夫を試す場面（任意）","勉強方法や工夫を試した状況","続けやすさ・手ごたえ・自分との相性などについての振り返り"]) and all(x not in pt for x in ["学習した科目や教材（任意）","続けやすさや手ごたえについての振り返り"]))
    check("privacy","date unchanged", pt.count("制定日：2026年11月2日")==2)
    check("privacy","device info item & no-reply-guarantee", "端末やブラウザなどの情報" in pt and "保証するものではありません" in pt)
    # JavaScriptなしでも読める
    ctxn=b.new_context(java_script_enabled=False); pn=ctxn.new_page()
    for f in PAGES:
        pn.goto(URL+f); check("nojs",f"{f} readable without JS", len(pn.inner_text("main"))>500)
    ctxn.close()
    # ダークモードで読める
    ctxd=b.new_context(viewport={"width":390,"height":800},color_scheme="dark"); pd=ctxd.new_page()
    for f in PAGES:
        pd.goto(URL+f)
        fg=pd.evaluate("getComputedStyle(document.querySelector('main p')).color"); bg=pd.evaluate("getComputedStyle(document.body).backgroundColor")
        check("dark",f"{f} text contrast >= 4.5", contrast(fg,bg)>=4.5)
        check("dark",f"{f} light wordmark", "light" in pd.evaluate("document.querySelector('.page-brand img.word').currentSrc"))
        pd.screenshot(path=OUT+f"dark_{f}.png",full_page=False)
    pd.goto(URL); pd.wait_for_timeout(300)
    check("dark","home light wordmark", "light" in pd.evaluate("document.querySelector('.brand-word').currentSrc"))
    ctxd.close()

    # ---------- アプリ：名称・ロゴ・フッター ----------
    ctx=b.new_context(viewport={"width":390,"height":844},accept_downloads=True); ctx.route("https://docs.google.com/**",fake_google)
    pg=ctx.new_page(); pg.on("pageerror",lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(400)
    check("names","document.title", pg.title()=="Paletta｜数学の学び方を、自分の色に。")
    check("logo","home logo images load", pg.evaluate("[...document.querySelectorAll('.hero img')].every(i=>i.complete&&i.naturalWidth>0)"))
    check("first","first-time guide shown (no records)", pg.locator(".first-guide").count()==1 and pg.locator(".first-guide").get_attribute("href")=="howto.html")
    fl=pg.locator(".site-foot nav a")
    check("footer","4 links", fl.all_inner_texts()[:3]==["使い方","利用規約","プライバシーポリシー"] and "お問い合わせ" in fl.nth(3).inner_text())
    check("footer","data link kept", pg.locator("a[href='#/data']").count()==1)
    check("footer","link tap size >= 36px", min(pg.evaluate("[...document.querySelectorAll('.site-foot nav a')].map(a=>a.getBoundingClientRect().height)"))>=36)
    check("footer","version & operator", CFG["version"] in pg.inner_text(".site-foot") and "Produced & Operated by Kenji ARAI" in pg.inner_text(".site-foot") and "開発・運営" not in pg.inner_text(".site-foot"))
    # 名称：主な画面に旧名がない
    for h in ["#/home","#/library","#/note","#/videos","#/data","#/navi","#/card/first-move"]:
        pg.goto(URL+h); pg.wait_for_timeout(150)
        check("names",f"no old name {h}", not OLD.search(pg.inner_text("body")))
    # 記録の保存画面
    pg.goto(URL+"#/data"); pg.wait_for_timeout(200)
    dt=pg.inner_text("#view")
    check("data","privacy link + shared-device note", pg.locator("#view a[href='privacy.html']").count()==1 and "共用の端末" in dt)
    # 案内ページへ行って戻ると、直前の画面に戻る
    pg.click("#view a[href='privacy.html']"); pg.wait_for_timeout(300)
    pg.click("a[data-back-to-app]"); pg.wait_for_timeout(400)
    check("pages","back from page restores #/data", pg.url.endswith("#/data") and "記録の保存と引き継ぎ" in pg.inner_text(".topbar"))
    # セルフナビ途中 → 使い方 → 戻る で回答が残る
    pg.goto(URL+"#/navi"); pg.click("button.choice >> nth=0"); pg.click("button.choice >> nth=1")
    navi0=pg.evaluate("sessionStorage.getItem('manabikata-navi')")
    pg.goto(URL+"howto.html"); pg.click("a[data-back-to-app]"); pg.wait_for_timeout(300)
    check("pages","navi answers kept after page visit", pg.evaluate("sessionStorage.getItem('manabikata-navi')")==navi0)
    # ---------- お問い合わせ ----------
    pg.goto(URL); pg.wait_for_timeout(200)
    for c in ["first-move","hide-one-step"]:
        pg.goto(URL+"#/card/"+c); pg.click("text=これを試してみる"); pg.click("text=決めた"); pg.wait_for_timeout(100)
    pg.goto(URL+"#/home"); pg.wait_for_timeout(200)
    check("first","first-time guide hidden when records exist", pg.locator(".first-guide").count()==0)
    ls0=pg.evaluate("localStorage.getItem('manabikata-note.v1')"); hash0=pg.url
    reqs=[]; ctx.on("request",lambda r: reqs.append(r.url) if "docs.google.com" in r.url else None)
    with ctx.expect_page() as newp: pg.click(".site-foot a[data-act=contact]")
    np_=newp.value; np_.wait_for_load_state()
    check("contact","opens form URL in new tab, no params added", np_.url==FORM)
    check("contact","no learning data in request", all(u==FORM for u in reqs))
    check("contact","no opener", np_.evaluate("window.opener===null"))
    check("contact","app state kept", pg.url==hash0 and pg.evaluate("localStorage.getItem('manabikata-note.v1')")==ls0)
    np_.close()
    # オフライン時
    ctx.set_offline(True); n_before=len(ctx.pages)
    pg.click(".site-foot a[data-act=contact]"); pg.wait_for_timeout(400)
    check("contact","offline: toast, no tab", len(ctx.pages)==n_before and "オフライン" in pg.inner_text("#toast"))
    ctx.set_offline(False)
    # ---------- 書き出しファイル名 ----------
    pg.goto(URL+"#/data"); pg.wait_for_timeout(200)
    with pg.expect_download() as d: pg.click("text=記録をファイルに書き出す")
    today=datetime.date.today().strftime("%Y%m%d")
    check("export","file name paletta-note-YYYYMMDD.json", d.value.suggested_filename==f"paletta-note-{today}.json")
    d.value.save_as(OUT+"v04-export.json"); ex=json.load(open(OUT+"v04-export.json"))
    check("export","app id paletta & plans", ex["app"]=="paletta" and len(ex["plans"])==2)
    # 新旧ファイルを読み込み（重複防止）
    ctx2=b.new_context(); p2=ctx2.new_page()
    for f in [FIX+"v0.1-export.json",FIX+"v0.2-export.json",FIX+"v0.3-export.json",OUT+"v04-export.json",OUT+"v04-export.json"]:
        p2.goto(URL+"#/data"); p2.wait_for_timeout(150); p2.set_input_files("#import-file",f); p2.wait_for_timeout(300)
    n=p2.evaluate("JSON.parse(localStorage.getItem('manabikata-note.v1')).plans.length")
    check("compat","import v0.1+v0.2+v0.3+v0.4 (twice) -> 8 plans, no duplicates", n==8)
    ctx2.close()
    # ---------- PWA ----------
    man=pg.evaluate("fetch('manifest.webmanifest').then(r=>r.json())")
    check("pwa","manifest name", man["name"]=="Paletta" and man["short_name"]=="Paletta")
    ok_icons=all(pg.evaluate(f"fetch('{i['src']}').then(r=>r.ok)") for i in man["icons"])
    check("pwa","manifest icons exist", ok_icons and any(i.get("purpose")=="maskable" for i in man["icons"]))
    for href in ["icons/favicon.ico","icons/favicon-32.png","icons/apple-touch-icon.png"]:
        check("pwa",f"{href} exists", pg.evaluate(f"fetch('{href}').then(r=>r.ok)"))
    ctx.close()
    ctx3=b.new_context(viewport={"width":390,"height":844}); p3=ctx3.new_page()
    p3.goto(URL); p3.evaluate("caches.open('manabikata-v0.3').then(c=>c.put('dummy',new Response('x')))")
    p3.evaluate("navigator.serviceWorker.getRegistrations().then(rs=>Promise.all(rs.map(r=>r.unregister())))")
    p3.reload(); p3.evaluate("navigator.serviceWorker.ready"); p3.wait_for_timeout(800)
    keys=p3.evaluate("caches.keys()")
    CACHE=re.search(r'const CACHE = "([^"]+)"',open(ROOT+"/public/sw.js").read()).group(1)
    check("pwa","old cache removed, new cache only", keys==[CACHE])
    p3.reload(); p3.wait_for_timeout(400)
    ctx3.set_offline(True)
    for f in PAGES:
        p3.goto(URL+f); p3.wait_for_timeout(200)
        check("offline",f"{f} offline", len(p3.inner_text("main"))>500 and p3.evaluate("[...document.images].every(i=>i.complete&&i.naturalWidth>0)"))
    p3.goto(URL+"#/home"); p3.reload(); p3.wait_for_timeout(300)
    check("offline","app offline with logo", "数学の学び方を、自分の色に。" in p3.inner_text("#view") and p3.evaluate("[...document.querySelectorAll('.hero img')].every(i=>i.naturalWidth>0)"))
    p3.goto(URL+"howto.html"); p3.click("a[data-contact] >> nth=0"); p3.wait_for_timeout(200)
    check("offline","page contact offline message", p3.is_visible("#offline-msg"))
    ctx3.set_offline(False); ctx3.close()
    b.close()

print("page errors:",errs)
groups={}
for g,n,ok in res: groups.setdefault(g,[0,0]); groups[g][0]+=ok; groups[g][1]+=1
for g,(a,t) in groups.items(): print(f"  {g:8s} {a}/{t}")
print(f"{sum(1 for r in res if r[2])}/{len(res)} passed")
