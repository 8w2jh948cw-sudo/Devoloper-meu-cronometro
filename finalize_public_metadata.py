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

print('Metadados públicos finalizados sem número de versão obsoleto.')
