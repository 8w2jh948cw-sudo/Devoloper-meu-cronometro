from pathlib import Path
import json

ROOT=Path(__file__).resolve().parent
SITE=ROOT/'site'

for rel,name,description in [
    ('manifest.webmanifest','Cronômetro','Cronômetro PWA'),
    ('beta/manifest.webmanifest','Cronômetro Beta','Cronômetro Beta PWA para testes'),
]:
    path=SITE/rel
    data=json.loads(path.read_text(encoding='utf-8'))
    data['name']=name
    data['short_name']=name
    data['description']=description
    data['id']='./'
    data['start_url']='./'
    data['scope']='./'
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    if 'v0.8.1' in path.read_text(encoding='utf-8'):
        raise SystemExit(f'Metadado antigo permaneceu em {rel}')

# Estrutura canônica: menu.html é a única fonte do menu. /menu/ apenas
# encaminha para essa página, evitando duas cópias que possam divergir.
menu_html=SITE/'menu.html'
if not menu_html.exists() or menu_html.stat().st_size < 1000:
    raise SystemExit('menu.html real ausente ou inválido')
menu_text=menu_html.read_text(encoding='utf-8')
if 'Central de Diagnóstico' not in menu_text:
    raise SystemExit('menu.html não contém o menu real esperado')
if 'cronometro-v080-01.js' in menu_text:
    raise SystemExit('menu.html não é independente do motor do app')

menu_route=SITE/'menu'/'index.html'
menu_route.parent.mkdir(exist_ok=True)
redirect='''<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="robots" content="noindex,nofollow">
  <meta http-equiv="refresh" content="0; url=../menu.html">
  <title>Abrindo menu · Cronômetro</title>
  <script>location.replace('../menu.html'+location.search+location.hash)</script>
</head>
<body>
  <p><a href="../menu.html">Abrir menu do Cronômetro</a></p>
</body>
</html>
'''
menu_route.write_text(redirect,encoding='utf-8')
if 'url=../menu.html' not in redirect or "location.replace('../menu.html'" not in redirect:
    raise SystemExit('Redirecionador /menu/ inválido')

print('Metadados públicos finalizados; /menu.html é a fonte única e /menu/ redireciona para ela.')
