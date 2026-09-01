from pathlib import Path
import json
import os
import re
import shutil

ROOT = Path(__file__).resolve().parent
STABLE_SITE = ROOT / '_stable_site'
BETA_SOURCE = ROOT / '_beta_site'
SITE = ROOT / 'site'
STABLE_RELEASE = os.environ.get('STABLE_RELEASE','0.8.8').strip()
BETA_LABEL = os.environ.get('BETA_LABEL','0.8.9-beta.2').strip()

if not (STABLE_SITE / 'index.html').exists():
    raise SystemExit('Build Oficial ausente em _stable_site')
if not (BETA_SOURCE / 'index.html').exists():
    raise SystemExit('Build Beta ausente em _beta_site')
if not (ROOT / 'app-icon-beta-192.png').exists():
    raise SystemExit('Ícone Beta com selo ausente')

if SITE.exists():
    shutil.rmtree(SITE)
shutil.copytree(STABLE_SITE, SITE)

# OFICIAL: snapshot congelado da branch stable. O banco continua exatamente o
# mesmo usado pela versão de produção.
(SITE / 'environment.json').write_text(json.dumps({
    'environment':'production',
    'release':STABLE_RELEASE,
    'branch':'stable',
    'database':'cronometro_local_v1',
    'stable':True,
    'writes_to_beta':False,
},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# BETA: cópia do desenvolvimento com IndexedDB, cache e identidade próprios.
beta = SITE / 'beta'
if beta.exists():
    shutil.rmtree(beta)
shutil.copytree(BETA_SOURCE,beta)
shutil.copy2(ROOT / 'app-icon-beta-192.png', beta / 'app-icon-beta-192.png')

base_js = beta / 'cronometro-v080-01.js'
text = base_js.read_text(encoding='utf-8')
needle = "const DB_NAME='cronometro_local_v1';"
if needle not in text:
    raise SystemExit('Não foi possível localizar DB_NAME Oficial para isolar a Beta')
text = text.replace(needle,"const DB_NAME='cronometro_beta_v1';",1)
base_js.write_text(text,encoding='utf-8')

sw = beta / 'sw.js'
if sw.exists():
    sw_text = sw.read_text(encoding='utf-8')
    sw_text = re.sub(r"const CACHE='cronometro-[^']+';",f"const CACHE='cronometro-beta-{BETA_LABEL}';",sw_text,count=1)
    if "'./app-icon-beta-192.png'" not in sw_text:
        sw_text = sw_text.replace("'./','./index.html'", "'./','./index.html','./app-icon-beta-192.png'", 1)
    sw.write_text(sw_text,encoding='utf-8')

# Ferramentas de teste e camada experimental da Beta.
tools = (ROOT / 'beta-tools.js').read_text(encoding='utf-8').replace('__BETA_RELEASE__',BETA_LABEL)
(beta / 'beta-tools.js').write_text(tools,encoding='utf-8')
shutil.copy2(ROOT / 'beta-patches.js',beta / 'beta-patches.js')


def replace_or_inject_icon(path: Path, href: str):
    if not path.exists():
        return
    text = path.read_text(encoding='utf-8')
    # remove referências anteriores do projeto e garante uma única identidade
    text = re.sub(r'\s*<link rel="apple-touch-icon"[^>]*>', '', text)
    text = re.sub(r'\s*<link rel="icon"[^>]*>', '', text)
    tags = f'\n  <link rel="icon" type="image/png" sizes="192x192" href="{href}">\n  <link rel="apple-touch-icon" sizes="192x192" href="{href}">\n'
    text = text.replace('</head>', tags + '</head>', 1)
    path.write_text(text,encoding='utf-8')

# Beta sempre identificada como Beta, inclusive quando adicionada à Tela de Início.
idx_path = beta / 'index.html'
idx = idx_path.read_text(encoding='utf-8')
idx = idx.replace('<title>Cronômetro</title>','<title>Cronômetro Beta</title>',1)
idx = idx.replace('content="Cronômetro"','content="Cronômetro Beta"')
if 'name="robots"' not in idx:
    idx = idx.replace('<meta charset="utf-8" />','<meta charset="utf-8" />\n  <meta name="robots" content="noindex,nofollow" />',1)
if 'beta-tools.js' not in idx:
    idx = idx.replace('</body>',f'  <script src="./beta-tools.js?v={BETA_LABEL}" defer></script>\n  <script src="./beta-patches.js?v={BETA_LABEL}" defer></script>\n</body>',1)
idx_path.write_text(idx,encoding='utf-8')
for name in ('index.html','launch.html','recover.html','safe.html'):
    replace_or_inject_icon(beta / name, './app-icon-beta-192.png')

manifest_path = beta / 'manifest.webmanifest'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
manifest['name']='Cronômetro Beta'
manifest['short_name']='Cronômetro Beta'
manifest['id']='./'
manifest['scope']='./'
manifest['start_url']=f'./launch.html?v={BETA_LABEL}'
manifest['icons']=[{
    'src':'./app-icon-beta-192.png',
    'sizes':'192x192',
    'type':'image/png',
    'purpose':'any'
}]
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(beta / 'version.json').write_text(json.dumps({'version':BETA_LABEL},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(beta / 'environment.json').write_text(json.dumps({
    'environment':'beta',
    'release':BETA_LABEL,
    'branch':'development',
    'database':'cronometro_beta_v1',
    'production_database':'cronometro_local_v1',
    'writes_to_production':False,
    'copy_direction':'production-to-beta-only',
},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# CENTRAL DE DIAGNÓSTICO: funciona sem carregar o motor principal.
diag = SITE / 'diagnostico'
diag.mkdir(exist_ok=True)
diag_html=f'''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#101118"><meta name="apple-mobile-web-app-title" content="Cronômetro Diagnóstico"><title>Diagnóstico · Cronômetro</title><link rel="icon" href="../icon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="../icon.svg">
<style>html,body{{margin:0;min-height:100%;background:#101118;color:#f7f7fb;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}}main{{max-width:430px;margin:auto;padding:calc(28px + env(safe-area-inset-top)) 18px 36px}}h1{{font-size:28px;margin:0 0 7px}}.lead{{margin:0 0 22px;color:#9b9dad;line-height:1.45;font-size:14px}}h2{{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#74778a;margin:22px 4px 8px}}.card{{display:block;text-decoration:none;color:inherit;background:#1a1c27;border:1px solid #2c3041;border-radius:17px;padding:15px 16px;margin:9px 0}}.card strong{{display:block;font-size:15px;margin-bottom:4px}}.card span{{display:block;color:#9b9dad;font-size:12px;line-height:1.4}}.tag{{display:inline-block!important;width:auto;margin-top:7px;padding:4px 7px;border-radius:999px;background:#1b3b24;color:#87e69a!important;font-weight:800;font-size:10px!important}}.beta .tag{{background:#3b2373;color:#d0b5ff!important}}.warn .tag{{background:#4c3312;color:#ffd06e!important}}</style></head><body><main>
<h1>Diagnóstico</h1><p class="lead">Ferramentas independentes para abrir, recuperar e verificar o Cronômetro sem apagar seus registros.</p>
<h2>Oficial · {STABLE_RELEASE}</h2>
<a class="card" href="../"><strong>Abrir app Oficial</strong><span>Versão estável preservada para uso real.</span><span class="tag">ESTÁVEL</span></a>
<a class="card" href="../launch.html"><strong>Inicializador seguro</strong><span>Faz uma abertura limpa removendo apenas controladores e cache antigos.</span></a>
<a class="card warn" href="../recover.html"><strong>Recuperar interface Oficial</strong><span>Remove somente runtime/cache. Não apaga IndexedDB nem registros.</span><span class="tag">EMERGÊNCIA</span></a>
<a class="card" href="../safe.html"><strong>Modo seguro Oficial</strong><span>Verifica o banco local e permite backup de emergência sem carregar o app principal.</span></a>
<h2>Beta · {BETA_LABEL}</h2>
<a class="card beta" href="../beta/"><strong>Abrir Cronômetro Beta</strong><span>Ambiente de testes com banco separado do Oficial.</span><span class="tag">DADOS ISOLADOS</span></a>
<a class="card beta" href="../beta/launch.html"><strong>Inicializador da Beta</strong><span>Abre somente o ambiente Beta em modo limpo.</span></a>
<a class="card beta warn" href="../beta/recover.html"><strong>Recuperar Beta</strong><span>Limpa somente runtime/cache da Beta.</span><span class="tag">NÃO TOCA NO OFICIAL</span></a>
<a class="card beta" href="../beta/safe.html"><strong>Modo seguro da Beta</strong><span>Verifica somente o banco de testes e cria backup da Beta.</span></a>
</main></body></html>'''
(diag/'index.html').write_text(diag_html,encoding='utf-8')

(SITE/'ambientes.json').write_text(json.dumps({
    'official':{'path':'./','release':STABLE_RELEASE,'branch':'stable','database':'cronometro_local_v1'},
    'beta':{'path':'./beta/','release':BETA_LABEL,'branch':'development','database':'cronometro_beta_v1','writes_to_production':False},
    'diagnostic':{'path':'./diagnostico/'},
    'menu':{'path':'./menu/'},
    'data_flow':'official-to-beta-only',
},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

checks={
    'oficial presente':(SITE/'index.html').exists(),
    'beta presente':(beta/'index.html').exists(),
    'beta usa banco isolado':"const DB_NAME='cronometro_beta_v1';" in (beta/'cronometro-v080-01.js').read_text(encoding='utf-8'),
    'beta não usa DB oficial no motor':"const DB_NAME='cronometro_local_v1';" not in (beta/'cronometro-v080-01.js').read_text(encoding='utf-8'),
    'beta claramente identificada':'Cronômetro Beta' in (beta/'index.html').read_text(encoding='utf-8'),
    'ícone Beta com selo publicado':(beta/'app-icon-beta-192.png').exists(),
    'manifest Beta usa ícone próprio':'app-icon-beta-192.png' in (beta/'manifest.webmanifest').read_text(encoding='utf-8'),
    'ferramentas beta':(beta/'beta-tools.js').exists(),
    'diagnóstico presente':(diag/'index.html').exists(),
    'diagnóstico informa isolamento':'DADOS ISOLADOS' in (diag/'index.html').read_text(encoding='utf-8'),
}
failed=[name for name,ok in checks.items() if not ok]
for name,ok in checks.items():print(f"[{'OK' if ok else 'FALHA'}] {name}")
if failed:raise SystemExit('Ambientes bloqueados: '+', '.join(failed))
print(f'Oficial congelado: {STABLE_RELEASE} / cronometro_local_v1')
print(f'Beta isolada: {BETA_LABEL} / cronometro_beta_v1')
print('Fluxo permitido: Oficial -> Beta. Nunca Beta -> Oficial.')
