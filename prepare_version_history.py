from pathlib import Path
import io
import json
import os
import shutil
import subprocess
import tarfile

ROOT = Path(__file__).resolve().parent
SITE = ROOT / "site"
CURRENT = os.environ.get("STABLE_RELEASE", "0.8.9").strip()

RELEASES = [
    {"version":"0.8.8","sha":"876495b8681369df93d85a62d5586f836de0321f","date":"31/08/2026","note":"Modo visual Clássico/Ultra e efeitos Glow."},
    {"version":"0.8.7","sha":"80105d808532710975df3bc10f77a53854c5c8ad","date":"30/08/2026","note":"Painel de backup e lembrete de backup desatualizado."},
    {"version":"0.8.6","sha":"f43fde5a8c9e427d28d6f244834ee270af58b90f","date":"30/08/2026","note":"Novo ícone da aba Estatísticas."},
    {"version":"0.8.5","sha":"b15edd807891887033cf51bbdfb6d0489f6d8969","date":"30/08/2026","note":"Configurações de som movidas para uma página própria."},
    {"version":"0.8.4","sha":"a66ce2471e3ec76f1593252e9d094e2cca075f95","date":"30/08/2026","note":"Laboratório integrado para editar a barra inferior."},
    {"version":"0.8.3","sha":"5adc24223e0f0d453d2c0a5caf81354295351651","date":"30/08/2026","note":"Correções de layout, Registros e gaveta de Modelos/Áreas."},
    {"version":"0.8.2","sha":"fda79cabe87d294d3de185d372bb0c5b513ce635","date":"30/08/2026","note":"Áreas, clientes, anotações e estados de medição."},
    {"version":"0.8.1","sha":"b24fb84b8d9eb845f626838fda879b50d3baebc8","date":"26/08/2026","note":"Histórico, estatísticas e organizador revisados."},
    {"version":"0.8.0","sha":"41c7b0eedea9546cde8cf75c7bf8b546fa44d6fb","date":"24/08/2026","note":"Primeira versão modular preservada no repositório."},
]

ALLOWED_SUFFIXES={".html",".css",".js",".json",".webmanifest",".svg",".png",".txt"}

def archive_release(release):
    version=release["version"]
    sha=release["sha"]
    dest=SITE/"versoes"/version
    if dest.exists():
        shutil.rmtree(dest)
    dest.mkdir(parents=True)
    blob=subprocess.check_output(["git","archive","--format=tar",sha],cwd=ROOT)
    with tarfile.open(fileobj=io.BytesIO(blob),mode="r:") as tf:
        for member in tf.getmembers():
            p=Path(member.name)
            if not member.isfile() or len(p.parts)!=1:
                continue
            if p.suffix.lower() not in ALLOWED_SUFFIXES:
                continue
            member.name=p.name
            tf.extract(member,dest)

    core=dest/"cronometro-v080-01.js"
    if core.exists():
        text=core.read_text(encoding="utf-8")
        text=text.replace("const DB_NAME='cronometro_local_v1';",f"const DB_NAME='cronometro_archive_{version.replace('.','')}';")
        core.write_text(text,encoding="utf-8")

    for js in dest.glob("*.js"):
        text=js.read_text(encoding="utf-8")
        text=text.replace("if('serviceWorker' in navigator){","if(!window.__CRONOMETRO_ARCHIVE__&&'serviceWorker' in navigator){")
        text=text.replace('if("serviceWorker" in navigator){','if(!window.__CRONOMETRO_ARCHIVE__&&"serviceWorker" in navigator){')
        js.write_text(text,encoding="utf-8")

    index=dest/"index.html"
    if not index.exists():
        raise SystemExit(f"Versão {version} não contém index.html")
    html=index.read_text(encoding="utf-8")
    archive_head=f"""\n  <meta name="robots" content="noindex,nofollow">\n  <script>window.__CRONOMETRO_ARCHIVE__=true;</script>\n  <style>
  #archive-version-badge{{position:fixed;z-index:2147483646;top:max(8px,env(safe-area-inset-top));right:9px;padding:5px 8px;border-radius:999px;background:rgba(28,28,30,.88);color:#fff;font:750 10px/1 -apple-system,BlinkMacSystemFont,sans-serif;letter-spacing:.04em;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:0 4px 16px rgba(0,0,0,.14);pointer-events:none}}
  #archive-version-back{{position:fixed;z-index:2147483647;top:max(8px,env(safe-area-inset-top));left:9px;padding:6px 9px;border-radius:999px;background:rgba(28,28,30,.88);color:#fff;text-decoration:none;font:650 10px/1 -apple-system,BlinkMacSystemFont,sans-serif;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:0 4px 16px rgba(0,0,0,.14)}}
  </style>\n"""
    html=html.replace("</head>",archive_head+"</head>",1)
    html=html.replace("<body>","<body>\n<a id=\"archive-version-back\" href=\"../\">‹ Versões</a><div id=\"archive-version-badge\">ARQUIVO v"+version+"</div>",1)
    index.write_text(html,encoding="utf-8")

    manifest=dest/"manifest.webmanifest"
    if manifest.exists():
        try:
            data=json.loads(manifest.read_text(encoding="utf-8"))
            data["name"]=f"Cronômetro Arquivo {version}"
            data["short_name"]=f"Arquivo {version}"
            data["id"]=f"./arquivo-{version}"
            data["start_url"]="./"
            manifest.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        except Exception:
            pass

def history_page():
    cards=[]
    for r in RELEASES:
        cards.append(f"""<a class="version-card" href="./{r['version']}/">
          <span class="version-dot"></span>
          <span class="version-copy"><strong>v{r['version']}</strong><small>{r['date']} · {r['note']}</small></span>
          <span class="open">Abrir ›</span>
        </a>""")
    return f"""<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#0d0f17"><meta name="robots" content="noindex,nofollow"><title>Histórico de versões · Cronômetro</title>
<link rel="icon" type="image/png" sizes="192x192" href="../app-icon-192.png"><link rel="apple-touch-icon" sizes="180x180" href="../apple-touch-icon.png">
<style>
:root{{--bg:#0d0f17;--card:#191b25;--card2:#202331;--text:#f7f7fb;--muted:#9b9dad;--line:#2b2e40;--blue:#64a8ff;--green:#55d879;--violet:#a784ff}}
*{{box-sizing:border-box}}html,body{{margin:0;width:100%;max-width:100%;min-height:100%;overflow-x:hidden;background:radial-gradient(circle at 82% -8%,rgba(100,168,255,.11),transparent 34%),var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}}body{{min-height:100dvh}}main{{width:min(100%,520px);margin:0 auto;padding:calc(22px + env(safe-area-inset-top)) 16px calc(40px + env(safe-area-inset-bottom))}}.back{{display:inline-flex;align-items:center;gap:5px;color:var(--blue);text-decoration:none;font-size:13px;margin:0 0 22px}}h1{{font-size:30px;line-height:1.05;letter-spacing:-.035em;margin:0 0 8px}}.lead{{margin:0;color:var(--muted);font-size:13px;line-height:1.45}}.current{{margin:20px 0 22px;padding:15px;border-radius:18px;border:1px solid rgba(85,216,121,.25);background:rgba(85,216,121,.08);display:flex;align-items:center;gap:12px}}.current .icon{{width:45px;height:45px;border-radius:13px;overflow:hidden;flex:0 0 45px}}.current img{{width:100%;height:100%;display:block}}.current strong{{display:block;font-size:14px}}.current small{{display:block;color:var(--muted);font-size:11px;margin-top:3px}}.tag{{margin-left:auto;padding:4px 7px;border-radius:999px;background:#173a22;color:#87e69a;font-size:9px;font-weight:800;letter-spacing:.05em}}.section{{margin:0 4px 9px;color:#74778a;font-size:11px;font-weight:780;letter-spacing:.085em;text-transform:uppercase}}.list{{display:grid;gap:9px}}.version-card{{display:flex;align-items:center;gap:11px;min-width:0;text-decoration:none;color:inherit;padding:13px 14px;border-radius:17px;border:1px solid var(--line);background:linear-gradient(180deg,var(--card2),var(--card));-webkit-tap-highlight-color:transparent}}.version-card:active{{transform:scale(.988)}}.version-dot{{width:12px;height:12px;flex:0 0 12px;border-radius:50%;background:var(--violet);box-shadow:0 0 0 5px rgba(167,132,255,.08)}}.version-copy{{min-width:0;flex:1}}.version-copy strong{{display:block;font-size:14px;margin-bottom:3px}}.version-copy small{{display:block;color:var(--muted);font-size:11px;line-height:1.35}}.open{{flex:0 0 auto;color:var(--blue);font-size:11px;font-weight:650}}.note{{margin-top:18px;padding:13px 14px;border-radius:15px;background:#151721;border:1px solid var(--line);color:var(--muted);font-size:11.5px;line-height:1.45}}.note strong{{color:var(--text)}}
</style></head><body><main><a class="back" href="../menu.html">‹ Voltar ao menu</a><h1>Histórico de versões</h1><p class="lead">Abra versões antigas do Cronômetro para visualizar como o app era em cada etapa do desenvolvimento.</p>
<div class="current"><span class="icon"><img src="../app-icon-192.png" alt=""></span><span><strong>v{CURRENT}</strong><small>Versão Oficial atual</small></span><span class="tag">ATUAL</span></div>
<div class="section">Versões anteriores</div><div class="list">{''.join(cards)}</div>
<div class="note"><strong>Visualizações isoladas:</strong> cada versão antiga usa um banco local próprio e não lê nem altera os registros da versão Oficial ou da Beta. O Service Worker também fica desativado nessas visualizações.</div>
</main></body></html>"""

def inject_menu(path:Path, href:str):
    if not path.exists():
        return
    html=path.read_text(encoding="utf-8")
    if "Histórico de versões" in html:
        return
    marker='<div class="section-title">Diagnóstico</div>'
    block=f'''<div class="section-title">Arquivo</div><div class="grid"><a class="card wide" href="{href}"><span class="icon" style="color:var(--blue)"><svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/></svg></span><span class="copy"><strong>Histórico de versões</strong><small>Visualize versões anteriores do Cronômetro sem tocar nos seus dados atuais.</small></span><span class="arrow">›</span></a></div>\n'''
    if marker not in html:
        return
    path.write_text(html.replace(marker,block+marker,1),encoding="utf-8")

if not SITE.exists():
    raise SystemExit("site/ ainda não foi criado")

versions_dir=SITE/"versoes"
if versions_dir.exists():
    shutil.rmtree(versions_dir)
versions_dir.mkdir(parents=True)

for release in RELEASES:
    archive_release(release)

(versions_dir/"index.html").write_text(history_page(),encoding="utf-8")
(SITE/"historico-versoes.html").write_text('<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=./versoes/"><title>Histórico de versões</title><a href="./versoes/">Abrir histórico de versões</a>',encoding="utf-8")

inject_menu(SITE/"menu.html","./versoes/")
inject_menu(SITE/"menu"/"index.html","../versoes/")

sw=SITE/"sw.js"
if sw.exists():
    text=sw.read_text(encoding="utf-8")
    if "rel.startsWith('versoes/')" not in text:
        text=text.replace("rel==='menu.html'||rel.startsWith('menu/')", "rel==='menu.html'||rel.startsWith('menu/')||rel.startsWith('versoes/')")
    sw.write_text(text,encoding="utf-8")

print(f"Histórico criado: {len(RELEASES)} versões anteriores + Oficial atual {CURRENT}")
