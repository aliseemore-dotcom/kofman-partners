#!/usr/bin/env python3
"""Generate one real URL per K+P Commercial screen.

commercial/index.html is a single-page app. For SEO every screen needs its own
URL with its own <title>/description/canonical, so this script
  1. reads the project / market data from commercial/index.html,
  2. writes ROUTE_META into index.html (used when navigating inside the app),
  3. writes a copy of index.html (with route-specific <head>) into
     commercial/<route>/index.html, and
  4. regenerates sitemap.xml.

Run after ANY edit to commercial/index.html:   python3 tools/build_commercial_routes.py
"""
import html, json, os, re, shutil, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "commercial", "index.html")
SITE = "https://www.kofmanpartners.com"
GENERATED = ["work", "what-we-do", "markets", "brands", "advisors", "contact"]

NODE = r"""
const fs=require('fs');const t=fs.readFileSync(process.argv[2],'utf8');
const a=t.indexOf('<script type="text/x-dc" data-dc-script');const s=t.indexOf('>',a)+1;
const code=t.slice(s,t.indexOf('/*ROUTE_META_START*/'));
const out=new Function(code+';return {PROJECTS,STUDIES,MARKETS};')();
console.log(JSON.stringify({projects:out.PROJECTS.map(p=>({id:p.id,slug:p.slug,name:p.name,address:p.address,meta:p.meta,tag:p.tag})),
 studies:Object.fromEntries(Object.entries(out.STUDIES).map(([k,v])=>[k,{brief:v.brief||''}])),
 markets:Object.fromEntries(Object.entries(out.MARKETS).map(([k,v])=>[k,{name:v.name,headline:v.headline,stat:v.stat}]))}));
"""

def clip(s, n=158):
    s = re.sub(r"\s+", " ", s).strip()
    if len(s) <= n:
        return s
    cut = s[:n - 1].rsplit(" ", 1)[0].rstrip(",;:—-")
    return cut + "…"

def first_sentence(s):
    m = re.match(r"(.+?[.!?])(\s|$)", s.strip())
    return m.group(1) if m else s.strip()

def load_data():
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False) as f:
        f.write(NODE)
    try:
        out = subprocess.run(["node", f.name, SRC], capture_output=True, text=True, check=True).stdout
    finally:
        os.unlink(f.name)
    return json.loads(out)

def build_meta(d):
    brand = "K+P Commercial"
    meta = {}
    home = re.search(r"<title>(.*?)</title>", open(SRC).read()).group(1)
    meta["/commercial/"] = None  # filled from the existing <head>
    meta["/commercial/work/"] = (f"Selected Work — F&B and Retail Projects | {brand}",
        "Twenty-three F&B, retail and wellness openings placed, negotiated and closed by K+P across London, Europe and the Middle East.")
    meta["/commercial/what-we-do/"] = (f"What We Do — Site Acquisition for F&B and Retail Brands | {brand}",
        "We source prime sites and negotiate the deals that put the world's best F&B and retail brands into them — for brands, landlords and developers.")
    meta["/commercial/brands/"] = (f"Brands & Partners — Landlord and Developer Network | {brand}",
        "Eighteen years of transactions build a bench: the landlords and estates of London, the region's developers and the brands we have placed.")
    meta["/commercial/advisors/"] = (f"Your Advisors — The {brand} Team",
        "Deals are done by people, not platforms. Meet the leadership and advisory team behind K+P Commercial: over a century of combined sector experience.")
    meta["/commercial/contact/"] = (f"Contact {brand} — Tell Us About the Brand",
        "Tell us about your brand and the market you want to enter. One conversation is usually enough to know whether we can help. We reply within one working day.")
    for key, slug in (("uk", "uk"), ("europe", "europe"), ("me", "middle-east")):
        m = d["markets"][key]
        meta[f"/commercial/markets/{slug}/"] = (f"{m['name']} — Market Entry for F&B and Retail Brands | {brand}",
            clip(f"{m['headline']} {m['stat']}."))
    counts = {}
    for p in d["projects"]:
        counts[p["name"]] = counts.get(p["name"], 0) + 1
    for p in d["projects"]:
        # a brand with several sites (GAIA, ABC Co) shares one case study, so use the per-site line instead
        brief = d["studies"].get(p["name"], {}).get("brief", "") if counts[p["name"]] == 1 else ""
        desc = (first_sentence(brief) if brief else p["meta"].rstrip(".") + ".") + f" {p['name']}, {p['address']} — a {brand} project."
        meta[f"/commercial/work/{p['slug']}/"] = (clip(f"{p['name']} — {p['address']} | {brand}", 70), clip(desc))
    return meta

def set_head(t, title, desc, path):
    url = SITE + path
    e = html.escape
    t = re.sub(r"<title>.*?</title>", lambda m: f"<title>{e(title, quote=False)}</title>", t, count=1)
    t = re.sub(r'(<meta name="description" content=")[^"]*(")', lambda m: m.group(1) + e(desc) + m.group(2), t, count=1)
    t = re.sub(r'(<link rel="canonical" href=")[^"]*(")', lambda m: m.group(1) + url + m.group(2), t, count=1)
    t = re.sub(r'(<meta property="og:title" content=")[^"]*(")', lambda m: m.group(1) + e(title) + m.group(2), t, count=1)
    t = re.sub(r'(<meta property="og:description" content=")[^"]*(")', lambda m: m.group(1) + e(desc) + m.group(2), t, count=1)
    t = re.sub(r'(<meta property="og:url" content=")[^"]*(")', lambda m: m.group(1) + url + m.group(2), t, count=1)
    return t

def main():
    d = load_data()
    meta = build_meta(d)
    src = open(SRC).read()
    home_title = html.unescape(re.search(r"<title>(.*?)</title>", src).group(1))
    home_desc = html.unescape(re.search(r'name="description" content="(.*?)"', src).group(1))
    meta["/commercial/"] = (home_title, home_desc)
    js = json.dumps({k: {"title": v[0], "description": v[1]} for k, v in meta.items()}, ensure_ascii=False, indent=1)
    src = re.sub(r"/\*ROUTE_META_START\*/.*?/\*ROUTE_META_END\*/",
                 lambda m: "/*ROUTE_META_START*/\nconst ROUTE_META = " + js.replace("</", "<\\/") + ";\n/*ROUTE_META_END*/", src, flags=re.S)
    open(SRC, "w").write(src)
    # wipe previously generated route folders, then rebuild
    for name in GENERATED:
        shutil.rmtree(os.path.join(ROOT, "commercial", name), ignore_errors=True)
    for path, (title, desc) in meta.items():
        if path == "/commercial/":
            continue
        out = os.path.join(ROOT, path.strip("/"), "index.html")
        os.makedirs(os.path.dirname(out), exist_ok=True)
        open(out, "w").write(set_head(src, title, desc, path))
    urls = ["/", "/residential", "/lettings", "/how-we-work"] + list(meta.keys())
    open(os.path.join(ROOT, "sitemap.xml"), "w").write(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "".join(f"  <url><loc>{SITE}{u}</loc></url>\n" for u in urls) + "</urlset>\n")
    print(f"{len(meta) - 1} route pages generated, sitemap has {len(urls)} URLs")

if __name__ == "__main__":
    main()
