from pathlib import Path
import json
import os
import re
import shutil
from PIL import Image

ROOT = Path(__file__).resolve().parent
STABLE_SITE = ROOT / '_stable_site'
BETA_SOURCE = ROOT / '_beta_site'
SITE = ROOT / 'site'
STABLE_RELEASE = os.environ.get('STABLE_RELEASE','0.8.8').strip()
BETA_LABEL = os.environ.get('BETA_LABEL','0.8.9-beta.3').strip()

if not (STABLE_SITE / 'index.html').exists():
    raise SystemExit('Build Oficial ausente em _stable_site')
if not (BETA_SOURCE / 'index.html').exists():
    raise SystemExit('Build Beta ausente em _beta_site')
if not (ROOT / 'app-icon-192.png').exists():
    raise SystemExit('Ícone Oficial aprovado ausente')
if not (ROOT / 'app-icon-beta-192.png').exists():
    raise SystemExit('Ícone Beta com selo ausente')
if not (ROOT / 'boot-resilient.js').exists():
    raise SystemExit('boot-resilient.js ausente')


def write_json(path: Path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def resize_png(src: Path, dst: Path, size: int):
    with Image.open(src) as image:
        image = image.convert('RGBA').resize((size, size), Image.Resampling.LANCZOS)
        image.save(dst, format='PNG', optimize=True)


def inject_icons(path: Path, icon192: str, touch180: str):
    if not path.exists():
        return
    text = path.read_text(encoding='utf-8')
    text = re.sub(r'\s*<link\s+rel=["\']apple-touch-icon["\'][^>]*>', '', text, flags=re.I)
    text = re.sub(r'\s*<link\s+rel=["\']icon["\'][^>]*>', '', text, flags=re.I)
    tags = (
        f'\n  <link rel="icon" type="image/png" sizes="192x192" href="{icon192}">\n'
        f'  <link rel="apple-touch-icon" sizes="180x180" href="{touch180}">\n'
    )
    text = text.replace('</head>', tags + '</head>', 1)
    path.write_text(text, encoding='utf-8')


def inject_boot(index_path: Path, release: str, beta_mode: bool):
    text = index_path.read_text(encoding='utf-8')
    release_js = json.dumps(release, ensure_ascii=False)
    inline = f"window.APP_RELEASE={release_js};"
    if beta_mode:
        inline += "window.__CRONOMETRO_DISABLE_SW__=true;"
        inline += "setTimeout(()=>{const t=(p,m)=>Promise.race([p,new Promise(r=>setTimeout(()=>r(null),m))]);(async()=>{try{const base=new URL('./',location.href).pathname;if('serviceWorker'in navigator){const regs=await t(navigator.serviceWorker.getRegistrations(),500);if(Array.isArray(regs))Promise.allSettled(regs.filter(x=>{try{return new URL(x.scope).pathname===base}catch(_){return false}}).map(x=>x.unregister()));}if('caches'in window){const keys=await t(caches.keys(),500);if(Array.isArray(keys))Promise.allSettled(keys.filter(k=>k.startsWith('cronometro-beta-')).map(k=>caches.delete(k)));}}catch(_){}})();},0);"

    # Remove injeção anterior para permitir reexecução do build.
    text = re.sub(r'\s*<!-- cronometro-public-runtime -->.*?<!-- /cronometro-public-runtime -->\s*', '\n', text, flags=re.S)
    text = re.sub(r"\s*<script>window\.APP_RELEASE=.*?</script>\s*<script src=\"\./boot-resilient\.js\"></script>", '', text, flags=re.S)

    runtime = (
        '\n  <!-- cronometro-public-runtime -->\n'
        f'  <script>{inline}</script>\n'
        '  <script src="./boot-resilient.js"></script>\n'
        '  <!-- /cronometro-public-runtime -->\n'
    )
    marker = '<script src="./cronometro-v080-01.js"></script>'
    if marker not in text:
        raise SystemExit(f'Não encontrei primeiro script do motor em {index_path}')
    text = text.replace(marker, runtime + '  ' + marker, 1)
    index_path.write_text(text, encoding='utf-8')


def patch_beta_registration(beta_dir: Path):
    path = beta_dir / 'cronometro-v080-09.js'
    text = path.read_text(encoding='utf-8')
    old = "if('serviceWorker' in navigator){"
    new = "if('serviceWorker' in navigator&&!window.__CRONOMETRO_DISABLE_SW__){"
    if new not in text:
        if old not in text:
            raise SystemExit('Registro de Service Worker da Beta não localizado')
        text = text.replace(old, new, 1)
    path.write_text(text, encoding='utf-8')


def build_manifest(path: Path, name: str, icon192: str, icon512: str):
    data = json.loads(path.read_text(encoding='utf-8'))
    data['name'] = name
    data['short_name'] = name
    data['id'] = './'
    data['start_url'] = './'
    data['scope'] = './'
    data['display'] = 'standalone'
    data['icons'] = [
        {'src': icon192, 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any'},
        {'src': icon512, 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any'},
    ]
    write_json(path, data)


def service_worker_text(cache_name: str, assets, beta_mode: bool):
    assets_json = json.dumps(assets, ensure_ascii=False, indent=2)
    beta_literal = 'true' if beta_mode else 'false'
    return f"""'use strict';
const CACHE={json.dumps(cache_name)};
const BETA_MODE={beta_literal};
const ASSETS={assets_json};
const SCOPE_PATH=new URL(self.registration.scope).pathname;

self.addEventListener('install',event=>{{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
}});
self.addEventListener('activate',event=>{{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(key=>{{
      if(BETA_MODE)return key.startsWith('cronometro-beta-')&&key!==CACHE;
      return key.startsWith('cronometro-')&&!key.startsWith('cronometro-beta-')&&key!==CACHE;
    }}).map(key=>caches.delete(key)))),
    self.clients.claim()
  ]));
}});

function relPath(url){{
  return url.pathname.startsWith(SCOPE_PATH)?url.pathname.slice(SCOPE_PATH.length):url.pathname;
}}
function isSpecialNavigation(url){{
  const rel=relPath(url);
  if(!BETA_MODE&&rel.startsWith('beta/'))return true;
  return rel==='menu.html'||rel.startsWith('menu/')||rel.startsWith('diagnostico/')||rel==='launch.html'||rel==='recover.html'||rel==='safe.html';
}}
async function networkFirst(request, fallbackIndex=false){{
  try{{
    const response=await fetch(request);
    if(response&&response.ok){{
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{{}});
    }}
    return response;
  }}catch(error){{
    const hit=await caches.match(request,{{ignoreSearch:true}});
    if(hit)return hit;
    if(fallbackIndex){{
      const fallback=await caches.match('./index.html');
      if(fallback)return fallback;
    }}
    throw error;
  }}
}}
self.addEventListener('fetch',event=>{{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  const rel=relPath(url);

  /* O SW Oficial nunca interfere em /beta/. */
  if(!BETA_MODE&&rel.startsWith('beta/')){{
    event.respondWith(fetch(event.request));
    return;
  }}

  if(event.request.mode==='navigate'){{
    /* Páginas reais nunca recebem index.html como fallback. */
    if(isSpecialNavigation(url)){{
      event.respondWith(networkFirst(event.request,false));
      return;
    }}
    event.respondWith(networkFirst(event.request,true));
    return;
  }}

  event.respondWith(networkFirst(event.request,false).catch(()=>caches.match(event.request,{{ignoreSearch:true}})));
}});
"""


def root_assets(folder: Path, include_special: bool):
    allowed = {'.html','.css','.js','.json','.webmanifest','.svg','.png','.txt'}
    skip = {'sw.js'}
    items = ['./']
    for p in sorted(folder.iterdir(), key=lambda x: x.name):
        if p.is_file() and p.suffix.lower() in allowed and p.name not in skip:
            items.append('./' + p.name)
    if include_special:
        if (folder / 'menu' / 'index.html').exists(): items.append('./menu/index.html')
        if (folder / 'diagnostico' / 'index.html').exists(): items.append('./diagnostico/index.html')
    # remove duplicados preservando ordem
    return list(dict.fromkeys(items))


# -------------------------------------------------------------------
# OFICIAL: snapshot estável + camadas de infraestrutura sem tocar no DB.
# -------------------------------------------------------------------
if SITE.exists():
    shutil.rmtree(SITE)
shutil.copytree(STABLE_SITE, SITE)

# O ícone aprovado é infraestrutura visual; o motor/DB continua o snapshot stable.
shutil.copy2(ROOT / 'app-icon-192.png', SITE / 'app-icon-192.png')
resize_png(ROOT / 'app-icon-192.png', SITE / 'app-icon-512.png', 512)
resize_png(ROOT / 'app-icon-192.png', SITE / 'apple-touch-icon.png', 180)
shutil.copy2(ROOT / 'boot-resilient.js', SITE / 'boot-resilient.js')

# Páginas de suporte sempre usam a versão corrigida do desenvolvimento.
for name in ('launch.html','recover.html','safe.html'):
    src = ROOT / name
    if src.exists():
        text = src.read_text(encoding='utf-8').replace('__RELEASE__', STABLE_RELEASE)
        (SITE / name).write_text(text, encoding='utf-8')

inject_boot(SITE / 'index.html', STABLE_RELEASE, False)
for name in ('index.html','launch.html','recover.html','safe.html'):
    inject_icons(SITE / name, './app-icon-192.png', './apple-touch-icon.png')
build_manifest(SITE / 'manifest.webmanifest', 'Cronômetro', './app-icon-192.png', './app-icon-512.png')
write_json(SITE / 'version.json', {'version': STABLE_RELEASE})
write_json(SITE / 'environment.json', {
    'environment':'production','release':STABLE_RELEASE,'branch':'stable',
    'database':'cronometro_local_v1','stable':True,'writes_to_beta':False
})

# -------------------------------------------------------------------
# BETA: desenvolvimento isolado. Durante desenvolvimento intenso não registra SW.
# -------------------------------------------------------------------
beta = SITE / 'beta'
if beta.exists():
    shutil.rmtree(beta)
shutil.copytree(BETA_SOURCE, beta)

shutil.copy2(ROOT / 'app-icon-beta-192.png', beta / 'app-icon-beta-192.png')
resize_png(ROOT / 'app-icon-beta-192.png', beta / 'app-icon-beta-512.png', 512)
resize_png(ROOT / 'app-icon-beta-192.png', beta / 'apple-touch-icon-beta.png', 180)
shutil.copy2(ROOT / 'boot-resilient.js', beta / 'boot-resilient.js')

base_js = beta / 'cronometro-v080-01.js'
text = base_js.read_text(encoding='utf-8')
needle = "const DB_NAME='cronometro_local_v1';"
if needle not in text:
    raise SystemExit('Não foi possível localizar DB_NAME Oficial para isolar a Beta')
base_js.write_text(text.replace(needle,"const DB_NAME='cronometro_beta_v1';",1), encoding='utf-8')
patch_beta_registration(beta)

tools = (ROOT / 'beta-tools.js').read_text(encoding='utf-8').replace('__BETA_RELEASE__', BETA_LABEL)
(beta / 'beta-tools.js').write_text(tools, encoding='utf-8')
shutil.copy2(ROOT / 'beta-patches.js', beta / 'beta-patches.js')

# Suporte Beta recebe a versão mais recente das páginas independentes.
for name in ('launch.html','recover.html','safe.html'):
    text = (ROOT / name).read_text(encoding='utf-8').replace('__RELEASE__', BETA_LABEL)
    (beta / name).write_text(text, encoding='utf-8')

idx = (beta / 'index.html').read_text(encoding='utf-8')
idx = idx.replace('<title>Cronômetro</title>','<title>Cronômetro Beta</title>',1)
idx = idx.replace('content="Cronômetro"','content="Cronômetro Beta"')
if 'name="robots"' not in idx:
    idx = idx.replace('<meta charset="utf-8" />','<meta charset="utf-8" />\n  <meta name="robots" content="noindex,nofollow" />',1)
if 'beta-tools.js' not in idx:
    idx = idx.replace('</body>',f'  <script src="./beta-tools.js?v={BETA_LABEL}" defer></script>\n  <script src="./beta-patches.js?v={BETA_LABEL}" defer></script>\n</body>',1)
(beta / 'index.html').write_text(idx, encoding='utf-8')
inject_boot(beta / 'index.html', BETA_LABEL, True)
for name in ('index.html','launch.html','recover.html','safe.html'):
    inject_icons(beta / name, './app-icon-beta-192.png', './apple-touch-icon-beta.png')
build_manifest(beta / 'manifest.webmanifest', 'Cronômetro Beta', './app-icon-beta-192.png', './app-icon-beta-512.png')
write_json(beta / 'version.json', {'version': BETA_LABEL})
write_json(beta / 'environment.json', {
    'environment':'beta','release':BETA_LABEL,'branch':'development',
    'database':'cronometro_beta_v1','production_database':'cronometro_local_v1',
    'writes_to_production':False,'copy_direction':'production-to-beta-only',
    'service_worker_registration':'disabled-during-development'
})

# -------------------------------------------------------------------
# MENU CENTRAL — HTML independente, sem motor do app ou acesso ao banco.
# -------------------------------------------------------------------
def menu_html(prefix: str):
    return f'''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#101118"><meta name="robots" content="noindex,nofollow"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Cronômetro Menu"><title>Menu · Cronômetro</title><link rel="icon" type="image/png" sizes="192x192" href="{prefix}app-icon-192.png"><link rel="apple-touch-icon" sizes="180x180" href="{prefix}apple-touch-icon.png">
<style>
:root{{--bg:#0d0f17;--card:#171924;--card2:#1e2130;--text:#f7f7fb;--muted:#9b9dad;--line:#2b2e40;--violet:#a784ff;--blue:#64a8ff;--green:#55d879;--orange:#ffad38}}
*{{box-sizing:border-box}}html,body{{margin:0;width:100%;max-width:100%;min-height:100%;overflow-x:hidden;background:radial-gradient(circle at 78% -10%,rgba(108,92,255,.13),transparent 34%),var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}}body{{min-height:100dvh}}main{{width:min(100%,500px);margin:0 auto;padding:calc(24px + env(safe-area-inset-top)) 16px calc(38px + env(safe-area-inset-bottom))}}header{{padding:3px 4px 20px}}.headrow{{display:flex;align-items:center;gap:13px;margin-bottom:8px}}.headicon{{width:54px;height:54px;border-radius:16px;overflow:hidden;flex:0 0 54px;box-shadow:0 6px 22px rgba(102,92,255,.14)}}.headicon img{{width:100%;height:100%;display:block}}h1{{font-size:30px;line-height:1.05;margin:0;letter-spacing:-.035em}}.lead{{margin:0;color:var(--muted);font-size:13.5px;line-height:1.45}}.section-title{{margin:22px 4px 9px;font-size:11.5px;letter-spacing:.085em;text-transform:uppercase;color:#74778a;font-weight:780}}.grid{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}}.card{{display:flex;width:100%;min-width:0;overflow:hidden;align-items:center;gap:12px;text-decoration:none;color:inherit;background:linear-gradient(180deg,var(--card2),var(--card));border:1px solid var(--line);border-radius:19px;padding:14px;min-height:80px;-webkit-tap-highlight-color:transparent;transition:transform .12s ease,border-color .12s ease}}.card:active{{transform:scale(.985);border-color:#52566d}}.card.wide{{grid-column:1/-1}}.app-card{{align-items:flex-start;min-height:116px;padding:15px}}.icon{{width:48px;height:48px;flex:0 0 48px;border-radius:13px;display:grid;place-items:center;background:#272a39;border:1px solid #35394c;overflow:hidden}}.app-card .icon{{width:60px;height:60px;flex-basis:60px;border-radius:17px;background:transparent;border:0}}.icon img{{width:100%;height:100%;display:block;object-fit:cover}}.icon svg{{width:27px;height:27px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}}.copy{{min-width:0;flex:1;overflow:hidden}}.copy strong{{display:flex;flex-wrap:wrap;overflow-wrap:anywhere;align-items:center;gap:7px;font-size:15px;line-height:1.2;margin-bottom:4px}}.copy small{{display:block;color:var(--muted);font-size:11.4px;line-height:1.36;overflow-wrap:anywhere}}.tag{{display:inline-flex;align-items:center;padding:3px 7px;border-radius:999px;font-size:9px;line-height:1;background:#332a59;color:#c9bdff;font-weight:820;letter-spacing:.035em}}.tag.stable{{background:#173a22;color:#87e69a}}.tag.beta{{background:#3b2373;color:#d0b5ff}}.arrow{{color:#717486;font-size:23px;margin-left:auto}}.note{{margin:18px 4px 0;padding:13px 14px;border-radius:15px;background:#151721;border:1px solid var(--line);color:var(--muted);font-size:12px;line-height:1.45}}.note strong{{color:var(--text)}}@media(max-width:350px){{.grid{{grid-template-columns:1fr}}.card.wide{{grid-column:auto}}}}
</style></head><body><main>
<header><div class="headrow"><span class="headicon"><img src="{prefix}app-icon-192.png" alt=""></span><div><h1>Cronômetro</h1><p class="lead">Menu de ambientes, testes e recuperação.</p></div></div></header>
<div class="section-title">Apps</div><div class="grid">
<a class="card app-card" href="{prefix}"><span class="icon"><img src="{prefix}app-icon-192.png" alt=""></span><span class="copy"><strong>Oficial <span class="tag stable">ESTÁVEL</span></strong><small>Uso diário · v{STABLE_RELEASE}<br>Dados reais.</small></span></a>
<a class="card app-card" href="{prefix}beta/"><span class="icon"><img src="{prefix}beta/app-icon-beta-192.png" alt=""></span><span class="copy"><strong>Beta <span class="tag beta">BETA</span></strong><small>Testes · v{BETA_LABEL}<br>Dados isolados.</small></span></a>
</div>
<div class="section-title">Diagnóstico</div><div class="grid"><a class="card wide" href="{prefix}diagnostico/"><span class="icon" style="color:var(--violet)"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l2.5 1.5"/><path d="M4 4l2 2M20 4l-2 2M4 20l2-2M20 20l-2-2"/></svg></span><span class="copy"><strong>Central de Diagnóstico</strong><small>Versão, cache, Service Worker, armazenamento e erros.</small></span><span class="arrow">›</span></a></div>
<div class="section-title">Ferramentas do Oficial</div><div class="grid">
<a class="card" href="{prefix}launch.html"><span class="icon" style="color:var(--blue)"><svg viewBox="0 0 24 24"><path d="M5 13c2.5-5 7-8 14-8-1 7-4 11.5-9 14l-5-6Z"/><path d="M14 10h.01"/><path d="M5 13 2 16l5 1"/><path d="m10 19 1 3 3-4"/></svg></span><span class="copy"><strong>Inicializador</strong><small>Abertura limpa sem bloquear o app.</small></span></a>
<a class="card" href="{prefix}recover.html"><span class="icon" style="color:var(--orange)"><svg viewBox="0 0 24 24"><path d="M4 7h6v6"/><path d="M5.5 17a8 8 0 1 0 1-10L4 9"/></svg></span><span class="copy"><strong>Recuperação</strong><small>Remove somente runtime/cache.</small></span></a>
<a class="card wide" href="{prefix}safe.html"><span class="icon" style="color:var(--green)"><svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 4.8 2.8 8 7 10 4.2-2 7-5.2 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg></span><span class="copy"><strong>Modo Seguro</strong><small>Lê o banco diretamente e cria backup sem carregar o app.</small></span><span class="arrow">›</span></a>
</div>
<div class="section-title">Ferramentas da Beta</div><div class="grid">
<a class="card" href="{prefix}beta/launch.html"><span class="icon" style="color:var(--blue)"><svg viewBox="0 0 24 24"><path d="M5 13c2.5-5 7-8 14-8-1 7-4 11.5-9 14l-5-6Z"/><path d="M14 10h.01"/><path d="M5 13 2 16l5 1"/><path d="m10 19 1 3 3-4"/></svg></span><span class="copy"><strong>Inicializador Beta</strong><small>Abertura limpa da Beta.</small></span></a>
<a class="card" href="{prefix}beta/recover.html"><span class="icon" style="color:var(--orange)"><svg viewBox="0 0 24 24"><path d="M4 7h6v6"/><path d="M5.5 17a8 8 0 1 0 1-10L4 9"/></svg></span><span class="copy"><strong>Recuperar Beta</strong><small>Não toca no Oficial.</small></span></a>
<a class="card wide" href="{prefix}beta/safe.html"><span class="icon" style="color:var(--green)"><svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 4.8 2.8 8 7 10 4.2-2 7-5.2 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg></span><span class="copy"><strong>Modo Seguro Beta</strong><small>Inspeciona somente o banco de testes.</small></span><span class="arrow">›</span></a>
</div><div class="note"><strong>Importante:</strong> a Beta usa <code>cronometro_beta_v1</code>, separado de <code>cronometro_local_v1</code>. A cópia permitida é somente Oficial → Beta.</div>
</main></body></html>'''

menu = SITE / 'menu'
menu.mkdir(exist_ok=True)
(menu / 'index.html').write_text(menu_html('../'), encoding='utf-8')
(SITE / 'menu.html').write_text(menu_html('./'), encoding='utf-8')

# -------------------------------------------------------------------
# DIAGNÓSTICO REAL — sem app.js, sem inicializar banco, sem registrar SW.
# -------------------------------------------------------------------
diag = SITE / 'diagnostico'
diag.mkdir(exist_ok=True)
diag_html = f'''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#101118"><meta name="robots" content="noindex,nofollow"><meta name="apple-mobile-web-app-title" content="Cronômetro Diagnóstico"><title>Diagnóstico · Cronômetro</title><link rel="icon" type="image/png" sizes="192x192" href="../app-icon-192.png"><link rel="apple-touch-icon" sizes="180x180" href="../apple-touch-icon.png"><style>
:root{{--bg:#0d0f17;--card:#191b25;--text:#f7f7fb;--muted:#9b9dad;--line:#2b2e40;--ok:#55d879;--warn:#ffad38;--bad:#ff666b;--blue:#64a8ff}}*{{box-sizing:border-box}}html,body{{margin:0;width:100%;max-width:100%;overflow-x:hidden;min-height:100%;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}}main{{width:min(100%,520px);margin:auto;padding:calc(24px + env(safe-area-inset-top)) 16px calc(36px + env(safe-area-inset-bottom))}}h1{{font-size:30px;margin:0 0 7px}}.lead{{font-size:13px;line-height:1.45;color:var(--muted);margin:0 0 18px}}.card{{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:15px;margin:10px 0}}.row{{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;padding:9px 0;border-bottom:1px solid var(--line)}}.row:last-child{{border:0}}.row strong{{font-size:13px}}.value{{max-width:58%;text-align:right;color:var(--muted);font-size:12px;line-height:1.35;overflow-wrap:anywhere}}.value.ok{{color:var(--ok)}}.value.warn{{color:var(--warn)}}.value.bad{{color:var(--bad)}}.actions{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}}a,button{{appearance:none;border:0;text-decoration:none;text-align:center;background:#242735;color:var(--text);border:1px solid #34384a;border-radius:13px;padding:11px 10px;font:650 12px/1.25 inherit}}button.primary{{background:#2d61d8;border-color:#3972ef}}pre{{white-space:pre-wrap;word-break:break-word;background:#11131b;border-radius:12px;padding:11px;max-height:260px;overflow:auto;color:#c8cad6;font:11px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace}}@media(max-width:350px){{.actions{{grid-template-columns:1fr}}}}
</style></head><body><main><h1>Diagnóstico</h1><p class="lead">Esta página não carrega o motor principal e não altera seus dados. Ela verifica o ambiente que o Safari realmente está usando.</p>
<div class="card"><div class="row"><strong>Oficial</strong><span class="value">{STABLE_RELEASE}</span></div><div class="row"><strong>Beta</strong><span class="value">{BETA_LABEL}</span></div><div class="row"><strong>URL</strong><span class="value" id="url">—</span></div><div class="row"><strong>Modo standalone</strong><span class="value" id="standalone">—</span></div><div class="row"><strong>Internet</strong><span class="value" id="online">—</span></div><div class="row"><strong>Tempo do diagnóstico</strong><span class="value" id="elapsed">—</span></div></div>
<div class="card"><div class="row"><strong>Service Worker controller</strong><span class="value" id="controller">—</span></div><div class="row"><strong>Registrations reais</strong><span class="value" id="registrations">—</span></div><div class="row"><strong>Caches do Cronômetro</strong><span class="value" id="caches">—</span></div><div class="row"><strong>Estado do runtime</strong><span class="value" id="runtime">—</span></div></div>
<div class="card"><div class="row"><strong>IndexedDB</strong><span class="value" id="idb">—</span></div><div class="row"><strong>Bancos detectados</strong><span class="value" id="dbs">—</span></div><div class="row"><strong>localStorage</strong><span class="value" id="ls">—</span></div><div class="row"><strong>User Agent</strong><span class="value" id="ua">—</span></div></div>
<div class="card"><strong style="font-size:13px">Ações</strong><div class="actions" style="margin-top:11px"><a href="../menu.html">Menu</a><a href="../">Oficial</a><a href="../beta/">Beta</a><a href="../safe.html">Modo Seguro Oficial</a><a href="../beta/safe.html">Modo Seguro Beta</a><button class="primary" id="copy">Copiar diagnóstico</button></div></div>
<div class="card"><strong style="font-size:13px">Log</strong><pre id="log">Iniciando…</pre></div>
<script>
(()=>{{
 const started=performance.now();const report={{releaseOfficial:{json.dumps(STABLE_RELEASE)},releaseBeta:{json.dumps(BETA_LABEL)},url:location.href,errors:[]}};const log=[];const q=id=>document.getElementById(id);const set=(id,text,cls='')=>{{const el=q(id);if(el){{el.textContent=text;el.className='value'+(cls?' '+cls:'')}}}};const add=x=>{{log.push(`${{new Date().toLocaleTimeString('pt-BR')}}  ${{x}}`);q('log').textContent=log.join('\n')}};window.addEventListener('error',e=>{{report.errors.push(String(e.message||e.error));add('ERRO JS: '+(e.message||e.error))}});window.addEventListener('unhandledrejection',e=>{{report.errors.push(String(e.reason?.message||e.reason));add('PROMISE: '+(e.reason?.message||e.reason))}});
 const projectRoot=location.pathname.split('/diagnostico/')[0]+'/';set('url',location.href);report.standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;set('standalone',report.standalone?'Sim':'Não',report.standalone?'ok':'');report.online=navigator.onLine;set('online',report.online?'Online':'Offline',report.online?'ok':'warn');set('ua',navigator.userAgent);report.userAgent=navigator.userAgent;
 try{{const k='__cronometro_diag__';localStorage.setItem(k,'1');localStorage.removeItem(k);report.localStorage=true;set('ls','Disponível','ok')}}catch(e){{report.localStorage=false;set('ls','Indisponível','bad');add('localStorage indisponível')}}
 report.indexedDB='indexedDB'in window;set('idb',report.indexedDB?'Disponível':'Indisponível',report.indexedDB?'ok':'bad');
 (async()=>{{
   let regs=[];try{{regs='serviceWorker'in navigator?await navigator.serviceWorker.getRegistrations():[]}}catch(e){{add('Falha ao listar Service Workers')}}
   const ownRegs=regs.filter(r=>{{try{{return new URL(r.scope).pathname.startsWith(projectRoot)}}catch(_){{return false}}}});report.registrations=ownRegs.map(r=>r.scope);set('registrations',String(ownRegs.length),ownRegs.length?'warn':'ok');
   const controller=navigator.serviceWorker?.controller||null;report.controller=controller?.scriptURL||null;set('controller',controller?'Presente':'Nenhum',controller?'warn':'ok');
   let cacheKeys=[];try{{cacheKeys='caches'in window?await caches.keys():[]}}catch(e){{add('Falha ao listar caches')}}const ownCaches=cacheKeys.filter(k=>k.startsWith('cronometro-'));report.caches=ownCaches;set('caches',ownCaches.length?ownCaches.join(', '):'Nenhum',ownCaches.length?'warn':'ok');
   const runtimeClean=ownRegs.length===0&&ownCaches.length===0;const residual=runtimeClean&&!!controller;report.runtime={{runtimeClean,residualController:residual}};if(residual)set('runtime','Limpo · controller residual','warn');else if(runtimeClean)set('runtime','Limpo','ok');else set('runtime','Runtime ativo','warn');
   if(report.indexedDB&&typeof indexedDB.databases==='function'){{try{{const dbs=await indexedDB.databases();const names=dbs.map(d=>d.name).filter(Boolean);report.databases=names;set('dbs',names.filter(n=>n.startsWith('cronometro_')).join(', ')||'Nenhum banco Cronômetro detectado',names.some(n=>n==='cronometro_local_v1')?'ok':'warn')}}catch(e){{set('dbs','Não foi possível listar','warn')}}}}else set('dbs','Safari não oferece listagem; use Modo Seguro','warn');
   report.elapsedMs=Math.round(performance.now()-started);set('elapsed',report.elapsedMs+' ms');add('Diagnóstico concluído');q('copy').onclick=async()=>{{const text=JSON.stringify(report,null,2);try{{await navigator.clipboard.writeText(text);q('copy').textContent='Copiado'}}catch(_){{if(navigator.share)await navigator.share({{text,title:'Diagnóstico Cronômetro'}})}}}};
 }})().catch(e=>{{add('ERRO diagnóstico: '+(e?.message||e));set('runtime','Falha no diagnóstico','bad')}});
}})();
</script></main></body></html>'''
(diag / 'index.html').write_text(diag_html, encoding='utf-8')

# -------------------------------------------------------------------
# Service Workers finais: o Oficial não pode interceptar Beta/Menu/Diagnóstico.
# -------------------------------------------------------------------
(SITE / 'sw.js').write_text(service_worker_text(
    f'cronometro-official-{STABLE_RELEASE}-public-2', root_assets(SITE, True), False
), encoding='utf-8')
(beta / 'sw.js').write_text(service_worker_text(
    f'cronometro-beta-{BETA_LABEL}-public-2', root_assets(beta, False), True
), encoding='utf-8')

write_json(SITE / 'ambientes.json', {
    'official':{'path':'./','release':STABLE_RELEASE,'branch':'stable','database':'cronometro_local_v1'},
    'beta':{'path':'./beta/','release':BETA_LABEL,'branch':'development','database':'cronometro_beta_v1','writes_to_production':False},
    'diagnostic':{'path':'./diagnostico/'},'menu':{'path':'./menu/'},'data_flow':'official-to-beta-only'
})
(SITE / '.nojekyll').write_text('', encoding='utf-8')

# -------------------------------------------------------------------
# Validações obrigatórias baseadas no manual de correção PWA/iPhone.
# -------------------------------------------------------------------
root_index=(SITE/'index.html').read_text(encoding='utf-8')
beta_index=(beta/'index.html').read_text(encoding='utf-8')
menu_text=(SITE/'menu.html').read_text(encoding='utf-8')
root_manifest=(SITE/'manifest.webmanifest').read_text(encoding='utf-8')
beta_manifest=(beta/'manifest.webmanifest').read_text(encoding='utf-8')
root_sw=(SITE/'sw.js').read_text(encoding='utf-8')
beta_core=(beta/'cronometro-v080-09.js').read_text(encoding='utf-8')
diag_text=(diag/'index.html').read_text(encoding='utf-8')
checks={
    'Oficial preserva DB':"cronometro_local_v1" in (SITE/'cronometro-v080-01.js').read_text(encoding='utf-8'),
    'Beta usa DB isolado':"const DB_NAME='cronometro_beta_v1';" in (beta/'cronometro-v080-01.js').read_text(encoding='utf-8'),
    'Beta não usa DB Oficial no motor':"const DB_NAME='cronometro_local_v1';" not in (beta/'cronometro-v080-01.js').read_text(encoding='utf-8'),
    'Beta SW desabilitado no desenvolvimento':'__CRONOMETRO_DISABLE_SW__=true' in beta_index and '!window.__CRONOMETRO_DISABLE_SW__' in beta_core,
    'Boot Oficial presente':'boot-resilient.js' in root_index,
    'Boot Beta presente':'boot-resilient.js' in beta_index,
    'Menu independente':'cronometro-v080-01.js' not in menu_text,
    'Menu responsivo iPhone':'repeat(2,minmax(0,1fr))' in menu_text and 'overflow-x:hidden' in menu_text,
    'Menu publicado':(SITE/'menu.html').exists() and (SITE/'menu'/'index.html').exists(),
    'Diagnóstico real':'Registrations reais' in diag_text and 'Caches do Cronômetro' in diag_text and 'controller residual' in diag_text,
    'Modo seguro Oficial':(SITE/'safe.html').exists(),
    'Modo seguro Beta':(beta/'safe.html').exists(),
    'Apple touch Oficial 180':'apple-touch-icon.png' in root_index and (SITE/'apple-touch-icon.png').exists(),
    'Apple touch Beta 180':'apple-touch-icon-beta.png' in beta_index and (beta/'apple-touch-icon-beta.png').exists(),
    'Manifest Oficial 192/512':'app-icon-192.png' in root_manifest and 'app-icon-512.png' in root_manifest and '"start_url": "./"' in root_manifest,
    'Manifest Beta 192/512':'app-icon-beta-192.png' in beta_manifest and 'app-icon-beta-512.png' in beta_manifest and '"start_url": "./"' in beta_manifest,
    'SW protege Menu':'menu.html' in root_sw and 'Páginas reais nunca recebem index.html' in root_sw,
    'SW Oficial não interfere na Beta':"rel.startsWith('beta/')" in root_sw,
    'Recuperação não apaga DB':'indexedDB.deleteDatabase' not in (SITE/'recover.html').read_text(encoding='utf-8'),
    'Beta claramente identificada':'Cronômetro Beta' in beta_index and (beta/'app-icon-beta-192.png').exists(),
}
failed=[name for name,ok in checks.items() if not ok]
for name,ok in checks.items():print(f"[{'OK' if ok else 'FALHA'}] {name}")
if failed:raise SystemExit('Publicação bloqueada: '+', '.join(failed))
print(f'Oficial congelado: {STABLE_RELEASE} / cronometro_local_v1')
print(f'Beta isolada e endurecida: {BETA_LABEL} / cronometro_beta_v1')
print('Pages: main pública; desenvolvimento: development; aprovado: stable.')
print('Fluxo de dados permitido: Oficial -> Beta. Nunca Beta -> Oficial.')
