from pathlib import Path
import json
import shutil
import sys

ROOT = Path(__file__).resolve().parent
SOURCE = Path(sys.argv[1] if len(sys.argv) > 1 else ROOT).resolve()
OUTPUT = Path(sys.argv[2] if len(sys.argv) > 2 else ROOT / 'site').resolve()
RELEASE = (sys.argv[3] if len(sys.argv) > 3 else '0.8.8').strip()

if not (SOURCE / 'index.html').exists():
    raise SystemExit(f'Fonte inválida: {SOURCE}')

if OUTPUT.exists():
    shutil.rmtree(OUTPUT)
OUTPUT.mkdir(parents=True)

patterns = ('*.html','*.css','*.js','*.json','*.webmanifest','*.svg','*.png','*.txt')
exclude = {'prepare_release.py','prepare_environments.py','beta-tools.js','beta-patches.js'}

for pattern in patterns:
    for src in SOURCE.glob(pattern):
        if src.name in exclude or not src.is_file():
            continue
        shutil.copy2(src, OUTPUT / src.name)

# As páginas de segurança podem evoluir no desenvolvimento sem alterar o motor
# congelado da branch stable. Se não existirem no snapshot estável, usamos as
# páginas de suporte da main.
for name in ('launch.html','recover.html','safe.html'):
    dst = OUTPUT / name
    if not dst.exists() and (ROOT / name).exists():
        shutil.copy2(ROOT / name, dst)

for name in ('launch.html','recover.html','safe.html'):
    path = OUTPUT / name
    if path.exists():
        path.write_text(path.read_text(encoding='utf-8').replace('__RELEASE__', RELEASE), encoding='utf-8')

(OUTPUT / 'version.json').write_text(json.dumps({'version': RELEASE}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(OUTPUT / '.nojekyll').write_text('', encoding='utf-8')

required = ['index.html','manifest.webmanifest','sw.js','version.json','cronometro-v080-01.js','launch.html','recover.html','safe.html']
missing = [name for name in required if not (OUTPUT / name).exists()]
if missing:
    raise SystemExit('Build incompleto: ' + ', '.join(missing))

print(f'Build preparado: {SOURCE.name} -> {OUTPUT} / {RELEASE}')
